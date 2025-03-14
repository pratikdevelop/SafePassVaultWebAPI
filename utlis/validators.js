const User = require('../model/user'); // Import User model for checking existing emails

/**
 * Validates the input fields during user registration.
 * @param {Object} data - Object containing the input fields.
 * @returns {Object} - Contains `isValid` flag and `errors` object.
 */
const validateUserRegistration = async (data) => {
  const errors = {};

  // Destructure the input data
  const { email, password, name, phone } = data;

  // Basic validation for missing fields
  if (!email) {
    errors.email = 'Email is required.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  if (!name) {
    errors.name = 'Name is required.';
  }

  if (!phone) {
    errors.phone = 'Phone number is required.';
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.email = 'Invalid email format.';
  }

  // Phone number validation (e.g., 10 digits)
  const phoneRegex = /^\d{10}$/;
  if (phone && !phoneRegex.test(phone)) {
    errors.phone = 'Phone number must be 10 digits.';
  }  
  // Password strength validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;
  if (password && !passwordRegex.test(password)) {
    errors.password =
      'Password must be at least 8 characters long and contain numbers, letters, and special characters.';
  }

  // Check if email already exists in the database
  if (email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      errors.email = 'Email is already registered.';
    }
  }

  // Return validation result
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateUserRegistration,
};
