import os
from typing import Optional
from datetime import timedelta, datetime
import boto3
from motor.motor_asyncio import AsyncIOMotorClient
import aiosmtplib
from email.message import EmailMessage
import logging
from twilio.rest import Client as TwilioClient
from logging.handlers import RotatingFileHandler
from pymongo import MongoClient
from paypalserversdk.http.auth.o_auth_2 import ClientCredentialsAuthCredentials
from paypalserversdk.logging.configuration.api_logging_configuration import (
    LoggingConfiguration,
    RequestLoggingConfiguration,
    ResponseLoggingConfiguration,
)
from paypalserversdk.paypal_serversdk_client import PaypalServersdkClient
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

# Load environment variables from .env file
load_dotenv()

# AWS S3 Configuration
def get_s3_client():
    """Initialize and return an AWS S3 client."""
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        return s3_client
    except Exception as e:
        logging.error(f"Error initializing S3 client: {e}")
        raise

s3 = get_s3_client()

# MongoDB Configuration
async def init_mongo_client() -> AsyncIOMotorClient:
    """Initialize and return an async MongoDB client."""
    mongo_uri = os.getenv("MONGOURL")
    try:
        client = AsyncIOMotorClient(mongo_uri)
        await client.admin.command("ping")  # Test connection
        logging.info("Connected to MongoDB")
        return client
    except Exception as e:
        logging.error(f"Error connecting to MongoDB: {e}")
        raise

mongo_client = None  # Will be initialized later in FastAPI startup

# Sync MongoDB client for logging (if needed)
mongo_sync_client = MongoClient(os.getenv("MONGOURL"))

# Email Configuration (using aiosmtplib)
async def get_email_transporter() -> aiosmtplib.SMTP:
    """Initialize and return an SMTP transporter for sending emails."""
    try:
        transporter = aiosmtplib.SMTP(
            hostname="smtp.gmail.com",
            port=587,
            use_tls=False,
            start_tls=True,
            username=os.getenv("EMAIL_USERNAME"),
            password=os.getenv("EMAIL_PASSWORD"),
        )
        await transporter.connect()
        logging.info("Email transporter is ready to send messages")
        return transporter
    except Exception as e:
        logging.error(f"Error in email transporter configuration: {e}")
        raise

# Alternative: FastAPI-Mail Configuration
email_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("EMAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("EMAIL_PASSWORD"),
    MAIL_FROM=os.getenv("EMAIL_USERNAME"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,  # Set to False for testing with self-signed certs
)
fm = FastMail(email_config)

async def send_email(to: str, subject: str, body: str):
    """Send an email using FastAPI-Mail."""
    message = MessageSchema(
        subject=subject,
        recipients=[to],
        body=body,
        subtype="html",
    )
    try:
        await fm.send_message(message)
        logging.info(f"Email sent to {to}")
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        raise

async def send_magic_link_email(email: str, token: str):
    """Send a magic link email."""
    magic_link_url = f"{os.getenv('FRONTEND_URL')}/auth/magic-link?token={token}&email={email}"
    body = f"""
        <h1>Login with Magic Link</h1>
        <p>Click the link below to login to your account:</p>
        <a href="{magic_link_url}">Login Now</a>
        <p>This link will expire in 15 minutes.</p>
    """
    await send_email(email, "Your Magic Link for Login", body)

# Logging Configuration (using Python's logging with MongoDB)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[
        logging.StreamHandler(),  # Console output
        RotatingFileHandler("error.log", maxBytes=10*1024*1024, backupCount=5),  # Removed level
        RotatingFileHandler("combined.log", maxBytes=10*1024*1024, backupCount=5),
    ],
)

# Set level for the error log handler separately
for handler in logging.getLogger().handlers:
    if isinstance(handler, RotatingFileHandler) and handler.baseFilename.endswith("error.log"):
        handler.setLevel(logging.ERROR)

# MongoDB logging handler (custom implementation since winston-mongodb isn't directly available)
class MongoDBHandler(logging.Handler):
    def __init__(self, db_uri: str, collection: str):
        super().__init__()
        self.db = MongoClient(db_uri)["your_db_name"]
        self.collection = self.db[collection]

    def emit(self, record):
        log_entry = {
            "timestamp": datetime.utcnow(),
            "level": record.levelname,
            "message": self.format(record),
        }
        self.collection.insert_one(log_entry)

logger = logging.getLogger(__name__)
logger.addHandler(MongoDBHandler(os.getenv("MONGOURL"), "logs"))

# PayPal Configuration (using paypal-serversdk)
paypal_client = PaypalServersdkClient(
    client_credentials_auth_credentials=ClientCredentialsAuthCredentials(
        o_auth_client_id=os.getenv("PAYPAL_CLIENT_ID"),
        o_auth_client_secret=os.getenv("PAYPAL_CLIENT_SECRET"),
    ),
    logging_configuration=LoggingConfiguration(
        log_level=logging.INFO,
        mask_sensitive_headers=False,  # False for Sandbox, True for production
        request_logging_config=RequestLoggingConfiguration(
            log_headers=True, log_body=True
        ),
        response_logging_config=ResponseLoggingConfiguration(
            log_headers=True, log_body=True
        ),
    ),
)
logger.info("PayPal client initialized")

# Twilio Configuration
def get_twilio_client() -> TwilioClient:
    """Initialize and return a Twilio client."""
    try:
        client = TwilioClient(
            os.getenv("TWILIO_ACCOUNT_SID"),
            os.getenv("TWILIO_AUTH_TOKEN"),
        )
        return client
    except Exception as e:
        logger.error(f"Error initializing Twilio client: {e}")
        raise

twilio_client = get_twilio_client()

async def send_sms(mfa_code: str, user_phone: str):
    """Send an SMS using Twilio."""
    try:
        message = await twilio_client.messages.create(
            body=f"Your MFA code is: {mfa_code}",
            from_=os.getenv("TWILIO_PHONE_NUMBER"),
            to=user_phone,
        )
        logger.info(f"SMS sent successfully. SID: {message.sid}")
        return message
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        raise

# Export equivalent (for Python, these are module-level variables)
__all__ = [
    "s3",
    "mongo_client",
    "send_email",
    "send_magic_link_email",
    "logger",
    "paypal_client",
    "twilio_client",
    "send_sms",
    "init_mongo_client",  # Matches your main.py import
]