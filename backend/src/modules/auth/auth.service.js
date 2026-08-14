const bcrypt = require('bcryptjs');
const userRepository = require('../users/user.repository');
const generateToken = require('../../utils/generateToken');
const AppError = require('../../utils/AppError');

async function register({ name, email, password, phone, role }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // ADMIN is never assignable through self-service registration.
  const safeRole = role === 'DONOR' ? 'DONOR' : 'REQUESTER';
  const user = await userRepository.create({
    name,
    email,
    passwordHash,
    phone,
    role: safeRole,
  });

  return { token: generateToken(user), user };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmailWithHash(email);
  // Same generic message for missing user or wrong password (avoid user enumeration).
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.enabled) {
    throw new AppError('This account has been disabled', 403);
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    enabled: user.enabled,
  };

  return { token: generateToken(safeUser), user: safeUser };
}

module.exports = { register, login };