const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config(); // Load environment variables from .env file

// Define the proxy middleware
const exampleProxy = (req, res, next) => {
  const target = process.env.SERVER_URL // Get the service based on the path
  if (target) {
    // Create and use the proxy middleware
    createProxyMiddleware({
      target,
      changeOrigin: true,
    })(req, res, next);
  } else {
    next(); // Pass through for other paths
  }
  
};

module.exports = exampleProxy;
