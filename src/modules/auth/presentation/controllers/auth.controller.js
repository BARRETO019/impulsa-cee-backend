// src/modules/auth/presentation/controllers/auth.controller.js
const UserRepository = require('../../../infrastructure/repositories/user.repository');
const PasswordService = require('../../../infrastructure/auth/password.service');
const TokenService = require('../../../infrastructure/auth/token.service');
const LoginUserUseCase = require('../../../application/use-cases/login-user.use-case');
const RegisterUserUseCase = require('../../../application/use-cases/register-user.use-case');

const userRepository = new UserRepository();
const passwordService = new PasswordService();
const tokenService = new TokenService();

const loginUserUseCase = new LoginUserUseCase(
  userRepository,
  passwordService,
  tokenService
);

const registerUserUseCase = new RegisterUserUseCase(
  userRepository,
  passwordService
);

exports.login = async (req, res) => {
  try {
    const result = await loginUserUseCase.execute(req.body);
    return res.json(result);
  } catch (error) {
    const status = error.message === 'Faltan datos' ? 400 : 401;
    return res.status(status).json({ error: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const result = await registerUserUseCase.execute(req.body);
    return res.status(201).json({
      message: 'Usuario creado',
      user: result
    });
  } catch (error) {
    const status =
      error.message === 'Faltan datos'
        ? 400
        : error.message === 'El usuario ya existe'
        ? 409
        : 500;

    return res.status(status).json({ error: error.message });
  }
};