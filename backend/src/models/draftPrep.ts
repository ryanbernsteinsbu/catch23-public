import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
import League from './league';

class DraftPrep extends Model {
    // Fields
    public id!: number;
    public rankingsImported!: boolean;
    public cheatsheetBuilt!: boolean;
    public sleepersTagged!: boolean;
    public customRankings!: boolean;
    public projectionsImported!: boolean;
    public league_id!: number;
    public league!: League;

    // Associations
    public static associations: {
        league: Association<DraftPrep, League>;
    }

    // public static associate (models: any) {
    //     DraftPrep.belongsTo(models.League, { foreignKey: 'league_id', as: 'league' });
    // }

    public getCompletedPercentage(): number {
        const count = (this.rankingsImported? 1: 0)
                    + (this.cheatsheetBuilt ? 1: 0)
                    + (this.sleepersTagged ? 1 : 0)
                    + (this.customRankings ? 1 : 0)
                    + (this.projectionsImported ? 1 : 0)

        return (count * 100) / 5;
    }
}

DraftPrep.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    rankingsImported: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    cheatsheetBuilt: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sleepersTagged: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    customRankings: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    projectionsImported: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    tableName:'draft_prep'
});

DraftPrep.belongsTo(League, { foreignKey: 'league_id', as: 'league' });

export default DraftPrep;