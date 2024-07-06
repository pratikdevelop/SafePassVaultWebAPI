Parrward Management API - password.js

This file defines routes for managing passwords within the Parrward Management API. It leverages Express.js for routing, Mongoose for interacting with the database, and JWT (JSON Web Token) for secure password sharing.

Security Considerations

Strong Password Storage: Never store passwords in plain text. Always use a robust one-way hashing algorithm like bcrypt to store password hashes securely. This route currently uses CryptoJS for encryption/decryption, which is not recommended for password hashing. Consider implementing bcrypt or a similar secure library.
Regular Security Audits: Conduct regular security audits to identify and address potential vulnerabilities.
Input Validation: Validate user input to prevent malicious code injection or manipulation.
Authorization: Implement proper authorization mechanisms to control access to password resources based on user roles and permissions.
Installation

Ensure you have Node.js (version X.X.X or later) and npm (or yarn) installed.
Refer to the main project README for installation instructions.
Dependencies

express: Web framework for building APIs
mongoose: ODM (Object Data Modeling) library for interacting with MongoDB
jsonwebtoken: Library for generating and verifying JWTs
bcrypt: Secure password hashing library (replace CryptoJS)
Environment Variables

Create a .env file to store sensitive information (ignore it in version control). Define the following variables:

Required:

MONGO_DB_URI: The connection string for your MongoDB database (e.g., mongodb://localhost:27017/parrward).
JWT_SECRET: A secret key used for signing and verifying JSON Web Tokens (JWTs) for authentication. Ensure this is a strong, random string kept confidential.
Optional:

EMAIL_USERNAME: The username for an email account you might use for sending notifications or other email-related functionalities.
EMAIL_PASSWORD: The password for the email account (if used).
(Optional) Other environment variables specific to your Parrward integration, such as API keys or connection details.
Example .env file:

MONGO_DB_URI=mongodb://localhost:27017/parrward
JWT_SECRET=your-strong-and-secret-key
# (Optional)
EMAIL_USERNAME=your_email_username
EMAIL_PASSWORD=your_email_password
# Additional Parrward-specific environment variables (if applicable)
How to Set Environment Variables:

Linux/macOS:
Bash
export MONGO_DB_URI=your_mongodb_connection_string
export JWT_SECRET=your-strong-and-secret-key
# (Optional)
export EMAIL_USERNAME=your_email_username
export EMAIL_PASSWORD=your_email_password
Use code with caution.
content_copy
Windows:
Right-click on "This PC" or "My Computer" and select "Properties".
Click on "Advanced system settings".
Click on the "Environment Variables" button.
Under "System variables", click "New" and define the variables as mentioned above.
Running the API

Start the API server:
Bash
npm start
Use code with caution.
content_copy
(or yarn start)
API Endpoints

GET /api/passwords (Authorization: Bearer <token>): Retrieves a list of user passwords (requires appropriate authorization based on user roles and permissions).
POST /api/passwords (Authorization: Bearer <token>, Body: { password data }): Creates a new user password (specific data format and access control to be confirmed).
DELETE /api/passwords/:id (Authorization: Bearer <token>): Deletes a specific user password (requires appropriate authorization).
PUT /api/passwords/:id (Authorization: Bearer <token>, Body: { updated password data }): Updates an existing user password (requires appropriate authorization).
POST /api/passwords/share/:passwordId (Authorization: Bearer <token>, Body: { recipient information }): Shares a password with another user (specific details and access control to be confirmed).
GET /api/passwords/share/:passwordId/:shareToken (Optional Authorization): Retrieves a shared password using a share link (implement authorization for enhanced security).

**Authentication and Authorization**

- Users are expected to authenticate with the API before performing most operations. A valid JWT token needs to be included in the Authorization header using the format: `Authorization: Bearer <token>`.
- Implement proper authorization mechanisms to control access to password resources based on user roles and permissions.
    1. Registration (/api/auth/register):

    POST: Create a new user account.
    Response: Success/Error message.
    2. Confirm Email (/api/auth/confirm-email):

    POST: Verify email using confirmation code.
    Response: Success message with token or error message.
    3. Login (/api/auth/login):

    POST: Login with username/email and password.
    Response: Token on success, error message on failure.
    4. Get User Profile (/api/auth/profile/):

    GET: Retrieve authenticated user profile (requires authorization).
    Response: User profile data or error message.
    5. Update User Profile (/api/auth/profile):

    PUT: Update specific user profile fields (requires authorization).
    Response: Updated profile data or error message.
    6. Delete User Account (/api/auth/profile):

    DELETE: Delete authenticated user account (requires authorization).
    Response: Success/Error message.
    7. Reset Password (/api/auth/reset-password):

    POST: Initiate password reset by sending a link to user's email.
    Response: Success/Error message.
    8. Verify Reset Link (/api/auth/verify-reset-link):

    GET: Verify validity of password reset link.
    Response: Verification status and message.
    9. Change Password (/api/auth/change-password/:id): (Refer to the full response for details)

    PATCH: Update user's password (requires authorization and validation).
    Response: Success/Error message.
    10. Logout (/api/auth/logout): (Refer to the full response for details)

    POST: Log out the authenticated user.
    Response: Success/Error message.
    
**Error Handling**

- The API returns appropriate error responses with meaningful error messages and HTTP status codes for failed requests.