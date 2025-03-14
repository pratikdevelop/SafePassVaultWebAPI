
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Helper function to encrypt data
const encrypt= (text, password) => {
    console.log('ff', text);
    
//   const iv = crypto.randomBytes(16);

//   const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(password, 'hex'), iv);
//   let encrypted = cipher.update(text, 'utf8', 'hex');
//   encrypted += cipher.final('hex');
//   return `${iv.toString('hex')}:${encrypted}`;
}


module.exports = {
    encrypt
}