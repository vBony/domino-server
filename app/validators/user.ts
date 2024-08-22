import vine, { SimpleMessagesProvider }  from '@vinejs/vine'
import {JSONAPIErrorReporter} from '../helpers/json_api_error_reporter.js'

vine.errorReporter = () => new JSONAPIErrorReporter()

vine.messagesProvider = new SimpleMessagesProvider({
    'nickname.required': 'Nome de usuário é obrigatório',
    'nickname.database.unique': 'Usuário já cadastrado',
    'nickname.minLength': 'Nome de usuário muito curto (min. 4 caracteres)',
    'password.required': 'Senha é obrigatória',
    'password.minLength': 'Senha muito curta (min. 6 caracteres)',
    'password.maxLength': 'Senha muito longa (max. 32 caracteres'
})

export const createValidator = vine.compile(
    vine.object({
        nickname: vine
            .string()
            .trim()
            .minLength(4)
            .unique(async (db, value) => {
                const user = await db
                    .from('users')
                    .where('nickname', value)
                    .first()
                return !user
            })
            .toLowerCase(),
        password: vine
            .string()
            .minLength(6)
            .maxLength(32)
    })
)