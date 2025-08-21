import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../instances/mysql'

export interface AccessTokensInstance extends Model {
    id: number
    user_id: number
    hash: string
    created_at: string
    expires_at: string
}

export const AccessTokens = sequelize.define<AccessTokensInstance>('EAccessTokens', {
    id: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
        field: 'id'
    },
    user_id: {
        type: DataTypes.INTEGER,
        field: 'user_id'
    },
    hash: {
        type: DataTypes.STRING,
        field: 'hash'
    },
    created_at: {
        type: DataTypes.DATE,
        field: 'created_at'
    },
    expires_at: {
        type: DataTypes.DATE,
        field: 'expires_at'
    }
}, 
{
    tableName: 'auth_access_tokens',
    timestamps: false,
    createdAt: 'created_at'
})