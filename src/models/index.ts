import sequelize from '../config/database';

import ApiUser from './apiUser';
import User from './user';
import DraftPick from './draftPick';
import League from './league';
import Team from './team';
import Player from './player';
import DraftPrep from './draftPrep';
import DraftSettings from './draftSettings';
import PlayerSettings from './playerSettings';
import RosterSettings from './rosterSettings';
import ScoringSettings from './scoringSettings';

Team.belongsTo(League, { foreignKey: 'league_id', as: 'league' });

Team.hasMany(DraftPick, { foreignKey: 'team_id', as: 'players' });
DraftPick.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });

Player.hasMany(DraftPick, { foreignKey: 'player_id', as: 'draftPicks' });
DraftPick.belongsTo(Player, { foreignKey: 'player_id', as: 'player' });
