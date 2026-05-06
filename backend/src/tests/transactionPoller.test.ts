jest.mock('ws', () => {
    const WebSocket = { OPEN: 1 };
    const WebSocketServer = jest.fn();
    return { WebSocket, WebSocketServer };
});

// Re-import fresh module state for each test
beforeEach(() => {
    jest.resetModules();
});

describe('transactionPoller', () => {

    describe('attachWSS + broadcast', () => {
        it('does not throw when broadcasting with no WSS attached', async () => {
            const { broadcast, _resetForTesting } = await import('../services/transactionPoller');
            _resetForTesting();
            expect(() => broadcast({ type: 'TEST' })).not.toThrow();
        });

        it('sends message to open clients', async () => {
            const { attachWSS, broadcast, _resetForTesting } = await import('../services/transactionPoller');
            _resetForTesting();

            const mockClient = { readyState: 1, send: jest.fn() };
            const mockWss = { clients: [mockClient] } as any;

            attachWSS(mockWss);
            broadcast({ type: 'TEST' });

            expect(mockClient.send).toHaveBeenCalledWith(JSON.stringify({ type: 'TEST' }));
        });

        it('skips clients that are not open', async () => {
            const { attachWSS, broadcast, _resetForTesting } = await import('../services/transactionPoller');
            _resetForTesting();

            const closedClient = { readyState: 0, send: jest.fn() }; // 0 = CLOSED
            const mockWss = { clients: [closedClient] } as any;

            attachWSS(mockWss);
            broadcast({ type: 'TEST' });

            expect(closedClient.send).not.toHaveBeenCalled();
        });
    });

    describe('getTransactionHistory', () => {
        it('returns empty array initially', async () => {
            const { getTransactionHistory, _resetForTesting } = await import('../services/transactionPoller');
            _resetForTesting();
            expect(getTransactionHistory()).toEqual([]);
        });
    });

    describe('startPoller', () => {
        const mockTransaction = (id: number) => ({
            id, typeCode: 'TR', description: 'Test', date: '2026-01-01'
        });

        beforeEach(() => {
            jest.useFakeTimers();
            global.fetch = jest.fn();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('seeds transaction history on boot without broadcasting', async () => {
            const { startPoller, getTransactionHistory, attachWSS, _resetForTesting } = await import('../services/transactionPoller');
            _resetForTesting();

            const mockClient = { readyState: 1, send: jest.fn() };
            attachWSS({ clients: [mockClient] } as any);

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ transactions: [mockTransaction(1), mockTransaction(2)] })
            });

            await startPoller();

            expect(getTransactionHistory()).toHaveLength(2);
            expect(mockClient.send).not.toHaveBeenCalled(); // no broadcast on seed
        });

        it('deduplicates transactions on subsequent polls', async () => {
            const { startPoller, getTransactionHistory, _resetForTesting } = await import('../services/transactionPoller');
            _resetForTesting();

            // Seed with transaction 1
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ transactions: [mockTransaction(1)] })
            });
            await startPoller();

            // Poll returns transaction 1 again + new transaction 2
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ transactions: [mockTransaction(1), mockTransaction(2)] })
            });

            await jest.advanceTimersByTimeAsync(60_000);

            // Should only have 2 total, not 3
            expect(getTransactionHistory()).toHaveLength(2);
        });

        it('caps history at 200', async () => {
            const { startPoller, getTransactionHistory, _resetForTesting } = await import('../services/transactionPoller');
            _resetForTesting();

            // Seed with 150 transactions
            const initial = Array.from({ length: 150 }, (_, i) => mockTransaction(i + 1));
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ transactions: initial })
            });
            await startPoller();

            // Poll returns 100 new transactions
            const fresh = Array.from({ length: 100 }, (_, i) => mockTransaction(i + 200));
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ transactions: [...initial, ...fresh] })
            });

            await jest.advanceTimersByTimeAsync(60_000);

            expect(getTransactionHistory().length).toBeLessThanOrEqual(200);
        });

        it('handles fetch failure gracefully without crashing', async () => {
            const { startPoller, _resetForTesting } = await import('../services/transactionPoller');
            _resetForTesting();

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ transactions: [] })
            });
            await startPoller();

            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(jest.advanceTimersByTimeAsync(60_000)).resolves.not.toThrow();
        });
    });
});