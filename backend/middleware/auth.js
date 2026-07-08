/**
 * Authentication and Authorization Middleware
 * Validates JWT tokens and enforces session inactivity timeouts using Redis or in-memory caches.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { cache } = require('../config/redis');

// Retrieve or generate JWT secret
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'super-secure-jwt-secret-key-change-in-prod-12345') {
  console.warn("Generating ephemeral secret. Instance-isolated!");
  jwtSecret = crypto.randomBytes(32).toString('hex');
}

// Session timeout threshold: 5 minutes (300 seconds)
const SESSION_INACTIVITY_LIMIT = 5 * 60 * 1000;

/**
 * Middleware: Verify JWT and Check Session Inactivity
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  // Expecting format: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access Denied: No authentication token provided.' });
  }

  try {
    const verified = jwt.verify(token, jwtSecret);
    req.user = verified;

    // Check Inactivity Session Timeout
    const sessionKey = `session:${req.user.id}`;
    const lastActiveStr = await cache.get(sessionKey);
    const now = Date.now();

    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      
      if (now - lastActive > SESSION_INACTIVITY_LIMIT) {
        // Invalidate session
        await cache.del(sessionKey);
        return res.status(403).json({ 
          error: 'Session expired', 
          message: 'Your session has expired due to 5 minutes of inactivity. Please log in again.' 
        });
      }
    }

    // Update session timestamp to extend active session
    await cache.set(sessionKey, now.toString(), 600); // Set expiration to 10 mins

    next();
  } catch (err) {
    console.error('JWT Verification Error:', err.message);
    return res.status(403).json({ error: 'Access Denied: Invalid or expired token.' });
  }
}

module.exports = {
  authenticateToken,
  jwtSecret,
  SESSION_INACTIVITY_LIMIT
};
