import { checkSchema } from "express-validator";

export const register = checkSchema({
  nickname: {
    trim: true,
    notEmpty: {
      bail: true,
      errorMessage: "Campo obrigatório",
    },
    isLength: {
      options: { min: 4 },
      errorMessage: "Digite um nome com pelo menos 4 caracteres",
    },
  },
  password: {
    isLength: {
      options: { min: 6 },
      errorMessage: "Digite uma senha com pelo menos 6 caracteres",
    },
  },
});

export const login = checkSchema({
  nickname: {
    trim: true,
    notEmpty: {
      bail: true,
      errorMessage: "Campo obrigatório",
    },
  },
  password: {
    notEmpty: {
      errorMessage: "Campo obrigatório",
    },
  },
});
