// Used AI to help with syntax
import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';
import League from './league';

class User extends Model {
    // Fields
    public id!: number;
    public email!: string;
    public hashedPassword!: string;
    public displayName!: string;

    public readonly leagues?: League[];
    public static assocations: {
        leagues: Association<User, League>;
    };

    // public static associate(models: any) {
    //     User.hasMany(models.League, { foreignKey: 'user_id', as: 'leagues' });
    // }
}

User.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    hashedPassword: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'hashed_password'
    },
    displayName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'display_name'
    }
}, {
    sequelize,
    tableName:'users',
    timestamps: false
});

User.hasMany(League, { foreignKey: 'user_id', as: 'leagues' });

export default User;