import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
import League from './league';
import DraftPick from './draftPick';

// Used AI to assist with sytax/ code checking
// Post MVP:
    // they should be able to add how many players as they would like, therefore the enum should dynamically change

class Team extends Model {
    // Fields
    public id!: number;
    public name!: string;
    public budget!: number;
    public league_id!: number;
    public isPrincipal!: boolean;
    public readonly league?: League;
    public readonly players?: DraftPick[];

    // public static associations: {
    //     players: Association<Team, DraftPick>;
    //     league: Association<Team, League>;
    // }
}

Team.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    league_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'league',
            key: 'id'
        }
    },
    isPrincipal: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    }
}, {
    sequelize,
    tableName:'teams',
    timestamps: false,
});

//Team.belongsTo(League, { foreignKey: 'league_id', as: 'league' });
//Team.hasMany(DraftPick, { foreignKey: 'team_id', as: 'players' });

export default Team;