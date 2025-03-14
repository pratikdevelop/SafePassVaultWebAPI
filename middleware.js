// ... other imports ... (replace with actual imports)
const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization');

  // Check for public routes (optional, uncomment if needed)
  if (requiresAuth(req.url, req.method)) {
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Correctly split the token string
    const parts = token.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }

    const decoded = jwt.verify(parts[1], process.env.SECRET_KEY); // Replace with your actual secret key

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Optional function to define public routes (replace with your logic)
function requiresAuth(url, method) {
  // Consider using a Set for faster lookups, especially with many public routes
  const publicRoutes = ['/login', '/register', '/confirm-email', '/resend-code', 'recovery-verify', '/logs', 'reset-password', 'verify-reset-link', 'change-password', 'plans', 'verify-mfa', '/api/swagger', '/request-magic-link', '/magic-link', 'accept-invitation', 'recover-account', 'download', '/webauthn/complete-authenticate', '/verify-security-pin'];
  let isverify = false;
  publicRoutes.forEach((route) => {
    if (url.includes(route)) {
      isverify = true;
    }
  })
  return isverify
}

module.exports = auth;
