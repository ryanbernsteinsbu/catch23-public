const express = require('express');
const cors = require('cors');
import sequelize from './config/database';
import userRoutes from './routes/userRoutes';
import playerRoutes from './routes/playerRoutes'
import leagueRoutes from './routes/leagueRoutes';
import teamRoutes from './routes/teamRoutes';
import requireAuth from './middleware/requireAuth';
import publicRoutes from './routes/publicRoutes'
import draftPickRoutes from './routes/draftPickRoutes';
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
app.use(cors({
    origin: 'http://localhost:3000', // relink to actual server later
    credentials: true
}));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/public', requireAuth, publicRoutes);
app.use('/api/draft-picks', draftPickRoutes);
app.use('/api/ranking', rankingRoutes);

const PORT = process.env.PORT || 8000;
// console.log(Object.keys(sequelize.models));
// console.log(sequelize.models.ApiUser);
sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
