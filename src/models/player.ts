import { DataTypes, Model, Association} from 'sequelize';
import sequelize from '../config/database';

// Used AI and MLB website to make sure I had correct formatting since this will be external datas

// Enums
export enum Position {
    CATCHER = 'CATCHER', FIRST = 'FIRST', SECOND = 'SECOND', THIRD = 'THIRD',
    SHORTSTOP = 'SHORTSTOP', OUTFIELD = 'OUTFIELD', PITCHER = 'PITCHER', UTILITY = 'UTILITY'
}

export enum Status {
    ACTIVE = 'ACTIVE', IL_10 = 'IL_10', IL_15 = 'IL_15', IL_60='IL_60', MINORS = 'MINORS', OUT='OUT'
}


class Player extends Model {
    // Fields
    public id!: number;
    public age?: number;
    public mlbPlayerId!: number; // use for syncing with MLB database
    public firstName!: string;
    public lastName!: string;
    public isHitter!: boolean;
    public playablePositions!: Position[];
    public lastYearStats!: Record<string, number>;
    public threeYearAvg!: Record<string, number>;
    public projectedStats!: Record<string, number>;
    public status!: Status;
    public seasonsLeft!: number; 
    public realTeam!: string;
    public realLeague!: string;
}


Player.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    mlbPlayerId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isHitter: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    playablePositions: {
        type: DataTypes.ARRAY(DataTypes.ENUM(...Object.values(Position))),
        allowNull: false,
        defaultValue: []
    },
    lastYearStats: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    threeYearAvg: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    projectedStats: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    status: {
        type: DataTypes.ENUM(...Object.values(Status)),
        allowNull: false
    },
    seasonsLeft: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    realTeam: {
        type: DataTypes.STRING,
        allowNull: false
    },
    realLeague: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    sequelize,
    tableName:'player',
    timestamps: false,
});

export default Player;
