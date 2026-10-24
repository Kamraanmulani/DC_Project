import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Generate JWT token
export const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Hash password
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Format user response (remove sensitive data)
export const formatUserResponse = (user) => {
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Generate username from email (as fallback)
export const generateUsernameFromEmail = (email) => {
  const username = email.split('@')[0];
  return username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
};