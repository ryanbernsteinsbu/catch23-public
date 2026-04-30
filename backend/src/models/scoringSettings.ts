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
        public useAvg!: boolean;
        public useHr!: boolean;
        public useRbi!: boolean;
        public useSb!: boolean;
        public useRuns!: boolean;

        // Pitchers
        public useEra!: boolean;
        public useWhip!: boolean;
        public useWins!: boolean;
        public useStrikeouts!: boolean;
        public useSaves!: boolean;

    public league_id!: number;
    //public league!: League;

    // Associations
    // public static associations: {
    //     league: Association<ScoringSettings, League>;
    // }

    // public static associate (models: any) {
    //     ScoringSettings.belongsTo(models.League, { foreignKey: 'league_id', as: 'league' });
    // }
}

ScoringSettings.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    useAvg: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_avg'
    },
    useHr: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_hr'
    },
    useRbi: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_rbi'
    },
    useSb: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_sb'
    },
    useRuns: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_runs'
    },
    useEra: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_era'
    },
    useWhip: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_whip'
    },
    useWins: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_wins'
    },
    useStrikeouts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_strikeouts'
    },
    useSaves: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'use_saves'
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