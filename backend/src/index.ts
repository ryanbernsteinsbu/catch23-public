const express = require('express');
const cors = require('cors');
import sequelize from './config/database';
import requireAuth from './middleware/requireAuth';
import publicRoutes from './routes/publicRoutes'
import frontendRoutes from './routes/frontendRoutes'
import Player from './models/player';
import rankingRoutes from './routes/rankingRoutes';
import { create, login } from './controllers/accountController';

const ApiUser = require('./models/apiUser') //i have no idea why import and require are mixed here
// associations

require('dotenv').config();

const app = express();
app.use(express.json());

// Routes

const allowedOrigins = [
  "https://catch23-public.vercel.app",
  "https://get-catch23.vercel.app",
  "http://localhost:3000"
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
app.use('/api/create-key', create); //make an account
app.use('/api/login', login);
app.use('/api/', requireAuth);
app.use('/api/public', publicRoutes); //Think about naming this smthn different
app.use('/api/ranking', rankingRoutes);
app.use('/', frontendRoutes)


const PORT = process.env.PORT || 8000;
// console.log(Object.keys(sequelize.models));
// console.log(sequelize.models.ApiUser);
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
