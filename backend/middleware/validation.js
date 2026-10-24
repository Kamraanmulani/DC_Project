import Joi from 'joi';

// Validation schemas
export const signupSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must be no longer than 50 characters',
      'any.required': 'Username is required'
    }),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  phone: Joi.string()
    .pattern(/^[+]?[1-9][0-9]{7,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number (8-15 digits)',
      'any.required': 'Phone number is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must be no longer than 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Validation middleware
export const validateSignup = (req, res, next) => {
  const { error } = signupSchema.validate(req.body);
  
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      details: errorMessage
    });
  }
  
  next();
};

export const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  
  if (error) {
    const errorMessage = error.details[0].message;
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      details: errorMessage
    });
  }
  
  next();
};