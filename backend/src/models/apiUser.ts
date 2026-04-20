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
    email: {
        type: DataTypes.STRING,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING,
        field: 'password_hash'
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


export default ApiUser;
