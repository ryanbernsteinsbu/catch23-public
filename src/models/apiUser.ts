import { DataTypes, Model} from 'sequelize';
import sequelize from '../config/database';

class ApiUser extends Model {
    // Fields
    public id!: number;
    public apiKey!: string;
    public usage!: number;
}

ApiUser.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    apiKey: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        field: 'api_key'
    },
    usage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize,
    tableName:'api_user',
    timestamps: false
});


console.log("sulk");
export default ApiUser;
