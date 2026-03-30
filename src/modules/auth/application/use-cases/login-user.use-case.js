// src/modules/auth/application/use-cases/login-user.use-case.js
class LoginUserUseCase {
  constructor(userRepository, passwordService, tokenService) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
    this.tokenService = tokenService;
  }

  async execute({ email, password }) {
    if (!email || !password) {
      throw new Error('Faltan datos');
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await this.userRepository.findByEmail(cleanEmail);

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const validPassword = await this.passwordService.compare(
      password,
      user.password
    );

    if (!validPassword) {
      throw new Error('Credenciales inválidas');
    }

    const token = this.tokenService.generate({
      id: user.id,
      role: user.role
    });

    return {
      token,
      role: user.role
    };
  }
}

module.exports = LoginUserUseCase;
