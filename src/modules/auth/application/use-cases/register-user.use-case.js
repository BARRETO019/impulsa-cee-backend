// src/modules/auth/application/use-cases/register-user.use-case.js
class RegisterUserUseCase {
  constructor(userRepository, passwordService) {
    this.userRepository = userRepository;
    this.passwordService = passwordService;
  }

  async execute({ name, email, password }) {
    if (!name || !email || !password) {
      throw new Error('Faltan datos');
    }

    const cleanEmail = email.toLowerCase().trim();
    const hashedPassword = await this.passwordService.hash(password);

    const existingUser = await this.userRepository.findByEmail(cleanEmail);

    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const user = await this.userRepository.create({
      name,
      email: cleanEmail,
      password: hashedPassword
    });

    return user;
  }
}

module.exports = RegisterUserUseCase;