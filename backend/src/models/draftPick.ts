import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
import Team from './team';
// import Player from './player';


export enum RosterPosition {
     CATCHER = 'CATCHER', FIRST = 'FIRST', THIRD = 'THIRD', SECOND = 'SECOND', SHORTSTOP = 'SHORTSTOP',
     CORNER = 'CORNER', MIDDLE = 'MIDDLE',
     OUTFIELD = 'OUTFIELD', UTILITY = 'UTILITY', PITCHER = 'PITCHER'
}

class DraftPick extends Model {
    // Fields
    public id!: number;
    public cost!: number;
    public rosterPosition!: RosterPosition;
    public team_id!: number;
    public team?: Team;
    public player_id!: number;
    // public player?: Player;

    // Associations
    public static associations: {
        team: Association<DraftPick, Team>;
        // player: Association<DraftPick, Player>;
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