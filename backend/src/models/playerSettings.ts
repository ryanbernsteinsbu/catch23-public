import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
//import League from './league';

// Enums
export enum Division {
    AL = 'AL', NL = 'NL', MIXED = 'MIXED'
}

export enum OhtaniRule {
    ONE_PLAYER = 'ONE_PLAYER', TWO_PLAYERS = 'TWO_PLAYERS', MIXED = 'MIXED'
}

class PlayerSettings extends Model {
    // Fields
    public id!: number;
    public positionEligibility!: boolean;
    public multiPositionEnabled!: boolean;
    public prospectEligibility!: boolean;
    public rookieStatusFilter!: boolean;
    public mlbOnly!: boolean;
    public mlbPlusProspects!: boolean;
    public minorLeaguePlayers!: boolean;
    public freeAgents!: boolean;
    public draftInjuredPlayers!: boolean;
    public autoInjuryRisk!: boolean;
    public hideLongTermIL!: boolean;
    public ohtaniRule!: OhtaniRule;
    public division!: Division;
    public league_id!: number;
    //public league!: League;

    // Associations
    // public static associations: {
    //     league: Association<PlayerSettings, League>;
    // }

    // public static associate (models: any) {
    //     PlayerSettings.belongsTo(models.League, { foreignKey: 'league_id', as: 'league' });
    // }
}

PlayerSettings.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    positionEligibility: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'position_eligibility'
    },
    multiPositionEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'multi_position_enabled'
    },
    prospectEligibility: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'prospect_eligibility'
    },
    rookieStatusFilter: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'rookie_status_filter'
    },
    mlbOnly: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'mlb_only'
    },
    mlbPlusProspects: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'mlb_plus_prospects'
    },
    minorLeaguePlayers: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'minor_league_players'
    },
    freeAgents: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'free_agents'
    },
    draftInjuredPlayers: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'draft_injured_players'
    },
    autoInjuryRisk: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'auto_injury_risk',
    },
    hideLongTermIL: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'hide_long_termil'
    },
    ohtaniRule: {
        type: DataTypes.ENUM(...Object.values(OhtaniRule)),
        defaultValue: OhtaniRule.MIXED,
        field: 'ohtani_rule'
    },
    division: {
        type: DataTypes.ENUM(...Object.values(Division)),
        defaultValue: Division.MIXED,
        field: 'division'
    }
}, {
    sequelize,
    tableName:'player_settings',
    timestamps: false
});

//PlayerSettings.belongsTo(League, { foreignKey: 'league_id', as: 'league' });
export default PlayerSettings;