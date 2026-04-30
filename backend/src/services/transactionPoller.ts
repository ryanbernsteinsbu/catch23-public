import { WebSocketServer, WebSocket } from 'ws';

export interface MLBTransaction {
  id: number;
  typeCode: string;
  description: string;
  player?: { fullName: string; id: number };
  fromTeam?: { name: string };
  toTeam?: { name: string };
  date: string;
  effectiveDate?: string;
}

let seenIds = new Set<number>();
let transactionHistory: MLBTransaction[] = [];
let wss: WebSocketServer | null = null;

export function attachWSS(server: WebSocketServer) {
  wss = server;
}

export function getTransactionHistory(): MLBTransaction[] {
  return transactionHistory;
}

export function broadcast(payload: object) {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function getDateRange() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(yesterday), end: fmt(today) };
}

async function fetchTransactions(): Promise<MLBTransaction[]> {
  const { start, end } = getDateRange();
  const url = `https://statsapi.mlb.com/api/v1/transactions?startDate=${start}&endDate=${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MLB API responded ${res.status}`);
  const data = await res.json();
  return data.transactions ?? [];
}

export async function startPoller() {
  // Seed with current data on boot — don't broadcast these as "new"
  try {
    const initial = await fetchTransactions();
    initial.forEach(t => seenIds.add(t.id));
    transactionHistory = initial.slice(0, 200);
    console.log(`[TransactionPoller] Seeded ${initial.length} transactions`);
  } catch (err) {
    console.error('[TransactionPoller] Initial seed failed:', err);
  }

  setInterval(async () => {
    try {
      const txns = await fetchTransactions();
      const fresh = txns.filter(t => !seenIds.has(t.id));

      if (fresh.length === 0) return;

      fresh.forEach(t => {
        seenIds.add(t.id);
        transactionHistory.unshift(t);
      });

      // Cap history at 200
      if (transactionHistory.length > 200) {
        transactionHistory = transactionHistory.slice(0, 200);
      }

      // Push each new transaction to all connected clients
      fresh.forEach(t => broadcast({ type: 'NEW_TRANSACTION', transaction: t }));
      console.log(`[TransactionPoller] Broadcast ${fresh.length} new transaction(s)`);
    } catch (err) {
      console.error('[TransactionPoller] Poll error:', err);
    }
  }, 60_000); // poll every 60 seconds
}