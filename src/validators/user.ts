import { checkSchema } from "express-validator";
import { User } from "../models/User";

/**
 * TODO: Add exist rule to nickname field
 */
export const register = checkSchema ({
    nickname: {
        trim: true,
        notEmpty: {
            bail: true,
            errorMessage: 'Campo obrigatório'
        },
        isLength: {
            options: { min: 4 },
            errorMessage: "Digite um nome maior que 6 caracteres",
        }
    },
    password: {
        isLength: {
            options: { min: 6 },
            errorMessage: "Digite uma senha maior que 6 caracteres"
        }
    }
})
