const express = require('express');
import sequelize from './config/database';
import requireAuth from './middleware/requireAuth';
import publicRoutes from './routes/publicRoutes'
import frontendRoutes from './routes/frontendRoutes'
import Player from './models/player';
import rankingRoutes from './routes/rankingRoutes';
import { create } from './controllers/accountController';

const ApiUser = require('./models/apiUser') //i have no idea why import and require are mixed here
// associations

require('dotenv').config();

const app = express();
app.use(express.json());

// Routes

app.use('/api/create-key', create); //make an account 
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
