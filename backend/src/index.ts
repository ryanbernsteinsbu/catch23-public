const express = require('express');
const cors = require('cors');
import sequelize from './config/database';
import requireAuth from './middleware/requireAuth';
import publicRoutes from './routes/publicRoutes'
import frontendRoutes from './routes/frontendRoutes'
import Player from './models/player';
import rankingRoutes from './routes/rankingRoutes';

const ApiUser = require('./models/apiUser')

require('dotenv').config();

const app = express();
app.use(express.json());
app.options('*', cors()); 
app.use(cors());        

// Routes
app.use('/api/', requireAuth);
app.use('/api/public', publicRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/', frontendRoutes)

const PORT = process.env.PORT || 8000;
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});