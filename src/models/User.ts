import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../instances/mysql'

export interface UserInstance extends Model {
    id: number
    nickname: string,
    password: string
}

export const User = sequelize.define<UserInstance>('EUser', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        field: 'id'
    },
    nickname: {
        type: DataTypes.STRING,
        field: 'nickname'
    },
    password: {
        type: DataTypes.STRING,
        field: 'password'
    }
}, 
{
    tableName: 'users',
    timestamps: false
})