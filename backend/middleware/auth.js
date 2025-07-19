const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Find user by ID from token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not found.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Account is deactivated.'
        });
      }

      // Add user to request object
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name
      };

      next();

    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Token has expired.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw tokenError;
      }
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token provided, continue without user
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id);
      
      if (user && user.isActive) {
        req.user = {
          id: user._id,
          email: user.email,
          name: user.name
        };
      }
    } catch (tokenError) {
      // Ignore token errors for optional auth
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without user if there's an error
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Authentication required.'
        });
      }

      // Get full user object to check role
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not found.'
        });
      }

      // Check if user has required role
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        });
      }

      next();

    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during authorization.'
      });
    }
  };
};

// Check if user owns resource middleware
const checkOwnership = (resourceModel, resourceParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Authentication required.'
        });
      }

      const resourceId = req.params[resourceParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      // Check if user owns the resource
      if (!resource.user.equals(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      // Add resource to request for further use
      req.resource = resource;
      next();

    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during ownership verification.'
      });
    }
  };
};

// Rate limiting middleware for sensitive operations
const sensitiveOperationLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
  const rateLimit = require('express-rate-limit');
  
  return rateLimit({
    windowMs: windowMs,
    max: max,
    message: {
      success: false,
      message: 'Too many attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Validate user session middleware
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Get user from database to check latest status
    const user = await User.findById(req.user.id);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid. Please log in again.',
        code: 'SESSION_INVALID'
      });
    }

    next();

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during session validation.'
    });
  }
};

module.exports = {
  auth,
  optionalAuth,
  authorize,
  checkOwnership,
  sensitiveOperationLimit,
  validateSession
};