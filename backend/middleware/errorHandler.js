// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Default error
  let error = {
    status: 'error',
    message: 'Internal server error',
    statusCode: 500
  };

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        const field = err.detail?.match(/Key \((\w+)\)/)?.[1] || 'field';
        error = {
          status: 'error',
          message: `${field} already exists`,
          statusCode: 409
        };
        break;
      case '23503': // Foreign key violation
        error = {
          status: 'error',
          message: 'Referenced record not found',
          statusCode: 400
        };
        break;
      case '23514': // Check violation
        error = {
          status: 'error',
          message: 'Invalid data format',
          statusCode: 400
        };
        break;
      default:
        error = {
          status: 'error',
          message: 'Database error',
          statusCode: 500
        };
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      status: 'error',
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      status: 'error',
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      status: 'error',
      message: 'Validation failed',
      statusCode: 400
    };
  }

  // Send error response
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};