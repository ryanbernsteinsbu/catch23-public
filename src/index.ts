const express = require('express');
import sequelize from './config/database';
import requireAuth from './middleware/requireAuth';
import publicRoutes from './routes/publicRoutes'
import frontendRoutes from './routes/frontendRoutes'
import Team from './models/team';
import Player from './models/player';
import DraftPick from './models/draftPick';
import League from './models/league';
import rankingRoutes from './routes/rankingRoutes';

const ApiUser = require('./models/apiUser') //i have no idea why import and require are mixed here
// associations
Team.belongsTo(League, { foreignKey: 'league_id', as: 'league' });

Team.hasMany(DraftPick, { foreignKey: 'team_id', as: 'players' });
DraftPick.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

Player.hasMany(DraftPick, { foreignKey: 'player_id', as: 'draftPicks' });
DraftPick.belongsTo(Player, { foreignKey: 'player_id', as: 'player' });

require('dotenv').config();

const app = express();
app.use(express.json());

// Routes
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
