import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
//import League from './league';

//     /* POST MVP TASKS:
//         * add in more data beyond the standard stats
//     */

class ScoringSettings extends Model {
    // Fields
    public id!: number;
        
    // Hitters
    public hrWeight!: number;      // 0 = don't use, otherwise relative importance
    public rbiWeight!: number;
    public sbWeight!: number;
    public avgWeight!: number;
    public runsWeight!: number;

    // Pitchers
    public eraWeight!: number;
    public whipWeight!: number;
    public winsWeight!: number;
    public strikeoutsWeight!: number;
    public savesWeight!: number;

    // Stat windows
    public useLastYear!: boolean;
    public useThreeYearAvg!: boolean;
    public useProjected!: boolean;

    public league_id!: number;
}

ScoringSettings.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    hrWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.175,
        field: 'hr_weight'
    },
    rbiWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.155,
        field: 'rbi_weight'
    },
    sbWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.125,
        field: 'sb_weight'
    },
    avgWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.150,
        field: 'avg_weight'
    },
    runsWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.125,
        field: 'runs_weight'
    },
    eraWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.200,
        field: 'era_weight'
    },
    whipWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.200,
        field: 'whip_weight'
    },
    winsWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.100,
        field: 'wins_weight'
    },
    strikeoutsWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.150,
        field: 'strikeouts_weight'
    },
    savesWeight: {
        type: DataTypes.FLOAT,
        defaultValue: 0.100,
        field: 'saves_weight'
    },
    useLastYear: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_last_year'
    },
    useThreeYearAvg: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_three_year_avg'
    },
    useProjected: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_projected'
    },
    league_id: { // fix this to camelCase later
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    sequelize,
    tableName:'scoring_settings',
    timestamps: false
});

//ScoringSettings.belongsTo(League, { foreignKey: 'league_id', as: 'league' });

export default ScoringSettings;