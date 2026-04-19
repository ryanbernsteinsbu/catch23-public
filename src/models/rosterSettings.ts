import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
import League from './league';

class RosterSettings extends Model {
    // Fields
    public id!: number;
    public numCatchers!: number;
    public numFirstBase!: number;
    public numSecondBase!: number;
    public numThirdBase!: number;
    public numShortstop!: number;
    public numCornerInfield!: number;
    public numMiddleInfield!: number;
    public numOutfield!: number;
    public numUtility!: number;
    public numPitchers!: number;
    public numTaxi!: number;
    public league_id!: number;
    //public league!: League;

    // Associations
    public static associations: {
        league: Association<RosterSettings, League>;
    }

    // public static associate (models: any) {
    //     RosterSettings.belongsTo(models.League, { foreignKey: 'league_id', as: 'league' });
    // }

    // Helper Methods
    public getTotalRosterSize(): number {
        return this.numCatchers + this.numFirstBase + this.numSecondBase + this.numThirdBase +
        this.numShortstop + this.numCornerInfield + this.numMiddleInfield +
        this.numOutfield + this.numUtility + this.numPitchers + this.numTaxi;
    }
}

RosterSettings.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    numCatchers: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        field: 'num_catchers'
    },
    numFirstBase: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'num_first_base'
    },
    numSecondBase: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'num_second_base'
    },
    numThirdBase: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'num_third_base'
    }, 
    numShortstop: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'num_shortstop'
    },
    numCornerInfield: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'num_corner_infield'
    },
    numMiddleInfield: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'num_middle_infield'
    },
    numOutfield: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        field: 'num_outfield'
    },
    numUtility: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'num_utility'
    },
    numPitchers: {
        type: DataTypes.INTEGER,
        defaultValue: 9,
        field: 'num_pitchers'
    },
    numTaxi: {
        type: DataTypes.INTEGER,
        defaultValue: 8,
        field: 'num_taxi'
    },
    league_id: {
        type: DataTypes.BIGINT,
        allowNull: true
    }

}, {
    sequelize,
    tableName:'roster_settings',
    timestamps: false
});

// RosterSettings.belongsTo(League, { foreignKey: 'league_id', as: 'league' });

export default RosterSettings;