import { query } from '../config/database.js';
import { hashPassword, comparePassword, generateToken, formatUserResponse } from '../utils/auth.js';

// Sign up controller
export const signup = async (req, res, next) => {
  try {
    const { username, email, phone, password } = req.body;

    // Check if user already exists
    const existingUserQuery = `
      SELECT id, username, email, phone 
      FROM users 
      WHERE username = $1 OR email = $2 OR phone = $3
    `;
    const existingUser = await query(existingUserQuery, [username, email, phone]);

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      let conflictField = '';
      
      if (user.username === username) conflictField = 'Username';
      else if (user.email === email) conflictField = 'Email';
      else if (user.phone === phone) conflictField = 'Phone number';

      return res.status(409).json({
        status: 'error',
        message: `${conflictField} already exists`
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const insertUserQuery = `
      INSERT INTO users (username, email, phone, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, phone, created_at, is_active
    `;
    const newUser = await query(insertUserQuery, [username, email, phone, passwordHash]);

    // Generate JWT token
    const user = newUser.rows[0];
    const token = generateToken({ 
      userId: user.id, 
      email: user.email, 
      username: user.username 
    });

    // Format response
    const userResponse = formatUserResponse(user);

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

// Login controller
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userQuery = `
      SELECT id, username, email, phone, password_hash, created_at, is_active, last_login
      FROM users 
      WHERE email = $1
    `;
    const userResult = await query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email, 
      username: user.username 
    });

    // Format response
    const userResponse = formatUserResponse(user);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get current user controller
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const userQuery = `
      SELECT id, username, email, phone, created_at, is_active, last_login
      FROM users 
      WHERE id = $1
    `;
    const userResult = await query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const userResponse = formatUserResponse(user);

    res.status(200).json({
      status: 'success',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    next(error);
  }
};