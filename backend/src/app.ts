const express = require('express');
const cors = require('cors');
import requireAuth from './middleware/requireAuth';
import publicRoutes from './routes/publicRoutes';
import frontendRoutes from './routes/frontendRoutes';
import rankingRoutes from './routes/rankingRoutes';
import transactionRoutes from './routes/transactionRoutes';
import { create, login } from './controllers/accountController';

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
app.use('/api/', requireAuth);
app.use('/api/public', publicRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/transactions', transactionRoutes); 
app.use('/', frontendRoutes);


export default app;