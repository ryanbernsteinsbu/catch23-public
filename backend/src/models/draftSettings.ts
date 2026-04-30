import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
import League from './league';

class DraftSettings extends Model {
    // Fields
    public id!: number;
    public budget!: number;
    public numTeams!: number;
    public league_id!: number;
    public league!: League;

    // Associations
    public static associations: {
        league: Association<DraftSettings, League>;
    }

    // public static associate (models: any) {
    //     DraftSettings.belongsTo(models.League, { foreignKey: 'league_id', as: 'league' });
    // }
}

DraftSettings.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    budget: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 260
    },
    numTeams: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 12,
        field: 'num_teams'
    }
}, {
    sequelize,
    tableName:'draft_settings',
    timestamps: false
});

export default DraftSettings;