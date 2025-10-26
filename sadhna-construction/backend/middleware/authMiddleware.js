const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'yoursecretkey';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  // Check for token in Authorization header or in query parameters
  const authHeader = req.headers['authorization'];
  const queryToken = req.query.token;
  
  let token;
  
  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (queryToken) {
    token = queryToken;
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Access token missing' });
  }
  
  try {
    const decoded = jwt.verify(token, secret);
    // Ensure both _id and id are available
    req.user = {
      ...decoded,
      id: decoded._id,  // Add id field for compatibility
      _id: decoded._id  // Ensure _id is present
    };
    console.log('Auth middleware - User:', req.user);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to check for required roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient rights' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };