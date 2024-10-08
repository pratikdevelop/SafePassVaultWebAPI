const winston = require('winston');
require('winston-mongodb');

// Create a logger
const mongoURI =`mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.nt431ty.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

const logger = winston.createLogger({
    level: 'info', // Default log level
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // Logs in JSON format
    ),
    transports: [
        new winston.transports.Console(), // Log to console
        new winston.transports.File({ filename: 'error.log', level: 'error' }), // Log errors to error.log
        new winston.transports.File({ filename: 'combined.log' }), // Log all other logs to combined.log
        new winston.transports.MongoDB({
            db: mongoURI,
            level: 'info', // Log level to store
            collection: 'logs', // Collection name
            format: winston.format.json() // Format of logs in MongoDB
        })
    ],
});

module.exports = logger;

