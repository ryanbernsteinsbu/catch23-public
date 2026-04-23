const express = require('express');
const cors = require('cors');
import sequelize from './config/database';
import requireAuth from './middleware/requireAuth';
import publicRoutes from './routes/publicRoutes'
import frontendRoutes from './routes/frontendRoutes'
import Player from './models/player';
import rankingRoutes from './routes/rankingRoutes';
import { create, login } from './controllers/accountController';

const ApiUser = require('./models/apiUser')

require('dotenv').config();

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

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
app.use('/api/create-key', create); //make an account
app.use('/api/login', login);
app.use('/api/public', publicRoutes);
console.log("rankingRoutes loaded:", rankingRoutes); // should not be undefined
app.use('/api/ranking', rankingRoutes);
app.use('/api/', requireAuth);
app.use('/', frontendRoutes)


const PORT = process.env.PORT || 8000;
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
