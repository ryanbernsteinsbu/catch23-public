import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
import Team from './team';
import Player from './player';


export enum RosterPosition {
    CATCHER_1 = 'CATCHER_1', CATCHER_2 = 'CATCHER_2',
    FIRST = 'FIRST', THIRD = 'THIRD', SECOND = 'SECOND', SHORTSTOP = 'SHORTSTOP',
    OUTFIELD_1 = 'OUTFIELD_1', OUTFIELD_2 = 'OUTFIELD_2', OUTFIELD_3 = 'OUTFIELD_3', OUTFIELD_4 = 'OUTFIELD_4', OUTFIELD_5 = 'OUTFIELD_5',
    UTILITY = 'UTILITY',
    PITCHER_1 = 'PITCHER_1', PITCHER_2 = 'PITCHER_2', PITCHER_3 = 'PITCHER_3', PITCHER_4 = 'PITCHER_4', PITCHER_5 = 'PITCHER_5', 
    PITCHER_6 = 'PITCHER_6', PITCHER_7 = 'PITCHER_7', PITCHER_8 = 'PITCHER_8', PITCHER_9 = 'PITCHER_9'
}
class DraftPick extends Model {
    // Fields
    public id!: number;
    public cost!: number;
    public rosterPosition!: RosterPosition;
    public team_id!: number;
    public team?: Team;
    public player_id!: number;
    public player?: Player;

    // Associations
    public static associations: {
        team: Association<DraftPick, Team>;
        player: Association<DraftPick, Player>;
    }
    
    // public static associate (models: any) {
    //     DraftPick.belongsTo(models.Team, { foreignKey: 'team_id', as: 'team' });
    //     DraftPick.belongsTo(models.Player, { foreignKey: 'player_id', as: 'player' });
    // }

}

DraftPick.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    rosterPosition: {
        type: DataTypes.ENUM(...Object.values(RosterPosition)),
        allowNull: false,
        field: 'roster_position'
    },
    team_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'teams', key: 'id'}
    },
    player_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'player', key: 'id'}
    }
}, {
    sequelize,
    tableName:'draft_pick',
    timestamps: false,
});

//DraftPick.belongsTo(Team, { foreignKey: 'team_id', as: 'team' });
//DraftPick.belongsTo(Player, { foreignKey: 'player_id', as: 'player' });

export default DraftPick;