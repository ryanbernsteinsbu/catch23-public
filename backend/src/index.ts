const express = require('express');
const cors = require('cors');
import http from 'http';
import { WebSocketServer } from 'ws';
import sequelize from './config/database';
import requireAuth from './middleware/requireAuth';
import publicRoutes from './routes/publicRoutes';
import frontendRoutes from './routes/frontendRoutes';
import Player from './models/player';
import rankingRoutes from './routes/rankingRoutes';
import transactionRoutes from './routes/transactionRoutes';
import { attachWSS, startPoller } from './services/transactionPoller';
import { create, login } from './controllers/accountController';

const ApiUser = require('./models/apiUser')
require('dotenv').config();

require('dotenv').config();

const app = express();
app.use(express.json());
const allowedOrigins = [
    "https://catch23-public.vercel.app",
    "https://catch23.vercel.app",
    "https://get-catch23.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
];
app.use(cors({
    origin:( origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS origin not allowed"));
        }
    },
    credentials: true
}));

// Routes
app.use('/api/create-key', create);
app.use('/api/login', login);
app.use('/api/public', publicRoutes);
console.log("rankingRoutes loaded:", rankingRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/transactions', transactionRoutes); 
app.use('/api/', requireAuth);
app.use('/', frontendRoutes);


const PORT = process.env.PORT || 8000;

// Upgrade to HTTP server so WS can share the same port
const server = http.createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
attachWSS(wss);

wss.on('connection', (ws) => {
    console.log('[WS] Client connected');
    ws.on('close', () => console.log('[WS] Client disconnected'));
});

sequelize.sync().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        startPoller(); // ← start polling MLB after DB is ready
    });
});
