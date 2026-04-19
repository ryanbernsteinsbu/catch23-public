import { DataTypes, Model, Association } from 'sequelize';
import sequelize from '../config/database';
import User from './user';
import Team from './team';
import DraftPrep from './draftPrep';
import ScoringSettings from './scoringSettings'
import PlayerSettings from './playerSettings'
import RosterSettings from './rosterSettings'
import DraftSettings from './draftSettings'

// Enum
export enum LeagueStatus {
    PRE_DRAFT = 'PRE_DRAFT', IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED'
}

class League extends Model {
    // Fields
    public id!: number;
    public title!: string;
    public leagueIconUrl!: string;
    public currRank!: number;
    public projectFinish!: number;
    public dateMade!: Date;
    public season!: number;
    public status!: LeagueStatus;
    public user_id!: number;
    public user?: User;
    public teams?: Team[];
    public draftPrep!: DraftPrep;
    public scoringSettings!: ScoringSettings;
    public playerSettings!: PlayerSettings;
    public rosterSettings!: RosterSettings;
    public draftSettings!: DraftSettings;

    // Associations
    public static associations: {
        user: Association<League, User>;
        teams: Association<League, Team>;
        scoreSettings: Association<League, ScoringSettings>;
        playerSettings: Association<League, PlayerSettings>;
        rosterSettings: Association<League, RosterSettings>;
        draftSettings: Association<League, DraftSettings>;
    }

    // public static associate(models: any) {
    //     League.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    //     League.hasMany(models.Team, { foreignKey: 'league_id', as: 'teams' });
    //     League.hasOne(models.DraftPrep, { foreignKey: 'league_id', as: 'draftPrep' });
    //     League.hasOne(models.ScoringSettings, { foreignKey: 'league_id', as: 'scoringSettings' });
    //     League.hasOne(models.PlayerSettings, { foreignKey: 'league_id', as: 'playerSettings' });
    //     League.hasOne(models.RosterSettings, { foreignKey: 'league_id', as: 'rosterSettings' });
    //     League.hasOne(models.DraftSettings, { foreignKey: 'league_id', as: 'draftSettings' });
    // }

    public distributeBudget(): void {
        if (!this.draftSettings) return;
        if (!this.teams) return;

        this.teams.forEach(team => {
            team.budget = this.draftSettings!.budget;
        });
    }
}

League.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    leagueIconUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'league_icon_url'
    },
    currRank: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'curr_rank'
    },
    projectFinish: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'project_finish'
    },
    dateMade: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'date_made'
    },
    season: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    status: {
        type: DataTypes.ENUM(...Object.values(LeagueStatus)),
        allowNull: false
    },
    user_id: {
        type: DataTypes.BIGINT,
        allowNull: true, // fix later
    }
}, {
    sequelize,
    tableName: 'league',
    timestamps: false
});

League.hasOne(ScoringSettings, { foreignKey: 'league_id', as: 'scoringSettings' });
League.hasOne(PlayerSettings, { foreignKey: 'league_id', as: 'playerSettings' });
League.hasOne(RosterSettings, { foreignKey: 'league_id', as: 'rosterSettings' });
League.hasOne(DraftSettings, { foreignKey: 'league_id', as: 'draftSettings' });
League.hasMany(Team, { foreignKey: 'league_id', as: 'teams' });

export default League;