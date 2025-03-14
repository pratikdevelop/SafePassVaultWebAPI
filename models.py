from beanie import Document, PydanticObjectId
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, Annotated
from datetime import datetime

# Submodels
class Attachment(BaseModel):
    name: Optional[str] = None
    path: Optional[str] = None

class Feature(BaseModel):
    icon: str = Field(..., description="Feature icon")
    text: str = Field(..., description="Feature text")

class KeyValuePair(BaseModel):
    key: str = Field(..., description="Key")
    value: str = Field(..., description="Value")

class SecurityQuestionItem(BaseModel):
    question: Annotated[str, Field(..., min_length=2, max_length=255, pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    answer: Annotated[str, Field(..., min_length=3, max_length=255, pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None

class Permission(BaseModel):
    view: bool = Field(default=False, description="View permission")
    edit: bool = Field(default=False, description="Edit permission")
    delete: bool = Field(default=False, description="Delete permission")

class SharedWith(BaseModel):
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    permissions: Permission = Field(default_factory=Permission)

class Token(BaseModel):
    token: str = Field(..., description="Auth token")
    expiry: Optional[datetime] = None

# Main Models
class Address(Document):
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    name: str = Field(..., description="Name of the address entry")
    folder: Optional[str] = None
    title: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    gender: Optional[Annotated[str, Field(pattern="^(Male|Female|Other)$")]] = None
    birthday: Optional[datetime] = None
    company: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    phone_extension: Optional[str] = None
    evening_phone: Optional[str] = None
    evening_phone_extension: Optional[str] = None
    advanced_settings: Dict[str, List[Attachment]] = Field(default_factory=lambda: {"attachments": []})
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "addresses"
        indexes = [["user_id"]]

class AuditLog(Document):
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    action: str = Field(..., description="Action performed")
    entity: str = Field(..., description="Entity type (e.g., 'passwords')")
    entity_id: Optional[PydanticObjectId] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "audit_logs"
        indexes = [["user_id", "timestamp"]]

class Card(Document):
    card_type: str = Field(..., description="Type of card")
    card_number: str = Field(..., description="Card number (should be encrypted)")
    card_holder_name: str = Field(..., description="Name on card")
    expiry_date: datetime = Field(..., description="Expiration date")
    cvv: str = Field(..., description="Card verification value (should be encrypted)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    billing_address: Optional[str] = None
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    comments: List[PydanticObjectId] = Field(default_factory=list, description="References to Comment")
    folder_id: Optional[PydanticObjectId] = None
    tags: List[PydanticObjectId] = Field(default_factory=list, description="References to Tag")

    class Settings:
        name = "cards"
        indexes = [["card_number", "user_id"]]

    async def pre_save(self):
        self.updated_at = datetime.utcnow()

class Comment(Document):
    content: str = Field(..., description="Comment content")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[PydanticObjectId] = None

    class Settings:
        name = "comments"

class File(Document):
    filename: Optional[str] = None
    original_name: Optional[str] = None
    path: Optional[str] = None
    size: Optional[int] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    shared_with: List[str] = Field(default_factory=list)
    version: int = Field(default=1, description="File version")
    folder_id: Optional[PydanticObjectId] = None
    owner_id: Optional[PydanticObjectId] = None
    is_deleted: bool = Field(default=False, description="Soft delete flag")
    thumbnails: List[str] = Field(default_factory=list, description="File preview thumbnails")
    encrypted: bool = Field(default=False, description="Encryption flag")
    permissions: Dict[str, str] = Field(default_factory=dict, description="Permissions: read, write, comment")
    offline_access: bool = Field(default=False, description="Offline sync flag")
    location: str = Field(..., description="File location")

    class Settings:
        name = "files"
        indexes = [["owner_id", "folder_id"]]

class Folder(Document):
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    name: Annotated[str, Field(..., pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    is_special: bool = Field(default=False, description="Special folder flag")
    type: Annotated[str, Field(..., pattern="^(passwords|notes|cards|identity|files|address|secrets)$")] = "passwords"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "folders"
        indexes = [["name", "user_id"]]

class Invitation(Document):
    sender: PydanticObjectId = Field(..., description="Reference to User (sender)")
    recipient: PydanticObjectId = Field(..., description="Reference to User (recipient)")
    organization_id: PydanticObjectId = Field(..., description="Reference to Organization")
    status: Annotated[str, Field(default="pending", pattern="^(pending|accepted|declined)$")] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "invitations"
        indexes = [["sender", "recipient"]]

class Note(Document):
    title: Annotated[str, Field(..., pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    content: Annotated[str, Field(..., pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    tags: List[PydanticObjectId] = Field(default_factory=list, description="References to Tag")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: PydanticObjectId = Field(..., description="Reference to User (owner)")
    modified_by: PydanticObjectId = Field(..., description="Reference to User (modifier)")
    comments: List[PydanticObjectId] = Field(default_factory=list, description="References to Comment")
    folder_id: Optional[PydanticObjectId] = None

    class Settings:
        name = "notes"
        indexes = [["user_id"]]

    async def pre_save(self):
        self.updated_at = datetime.utcnow()

class Organization(Document):
    name: str = Field(..., description="Organization name")
    description: Optional[str] = None
    owner_id: PydanticObjectId = Field(..., description="Reference to User (owner)")
    members: List[PydanticObjectId] = Field(default_factory=list, description="References to User")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "organizations"
        indexes = [["owner_id"]]

class Password(Document):
    website: Annotated[str, Field(..., pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    name: Optional[str] = None
    username: Annotated[str, Field(..., pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    password: str = Field(..., description="Encrypted password")
    key: str = Field(..., description="Encryption key or reference")
    created_by: PydanticObjectId = Field(..., description="Reference to User (creator)")
    totp: Optional[int] = None
    description: Optional[str] = None
    favorite: bool = Field(default=False, description="Favorite flag")
    modified_by: PydanticObjectId = Field(..., description="Reference to User (modifier)")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    tags: List[PydanticObjectId] = Field(default_factory=list, description="References to Tag")
    comments: List[PydanticObjectId] = Field(default_factory=list, description="References to Comment")
    folder_id: PydanticObjectId = Field(..., description="Reference to Folder")

    class Settings:
        name = "passwords"
        indexes = [["user_id", "website"]]

class Plan(Document):
    paypal_plan_id: str = Field(..., description="PayPal plan ID")
    plan_name: str = Field(..., description="Name of the plan")
    description: Optional[str] = None
    amount: int = Field(..., description="Amount in cents")
    currency: str = Field(default="usd", description="Currency code")
    interval: str = Field(..., description="Billing interval (e.g., month, year)")
    interval_count: int = Field(default=1, description="Number of intervals")
    features: List[Feature] = Field(..., description="List of plan features")
    button_link: str = Field(..., description="Link for the button")
    button_text: str = Field(..., description="Text for the button")
    has_trial: bool = Field(..., description="Trial availability")
    query_params: Dict[str, Any] = Field(..., description="Query parameters")
    trial_link: Optional[str] = None
    trial_query_params: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "plans"

class ProofId(Document):
    id_type: Annotated[str, Field(..., pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    id_number: Annotated[str, Field(..., unique=True, pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    issued_by: Annotated[str, Field(..., pattern=r"^\S.*\S$|^[^ ].*[^ ]$|^.+$")] = None
    issue_date: datetime = Field(..., description="Date of issue")
    expiry_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    document_image_url: Optional[str] = None

    class Settings:
        name = "proof_ids"
        indexes = [["id_number", "user_id"]]

    async def pre_save(self):
        self.updated_at = datetime.utcnow()

class Secret(Document):
    name: str = Field(..., description="Secret name")
    type: str = Field(default="", description="Secret type")
    value: Optional[str] = None  # Should be encrypted if `encrypt` is True
    description: str = Field(default="", description="Secret description")
    format: str = Field(default="text", description="Secret format")
    encrypt: bool = Field(default=False, description="Encryption flag")
    category: str = Field(default="", description="Secret category")
    expiration_date: Optional[datetime] = None
    created_by: Optional[PydanticObjectId] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)
    file: str = Field(default="", description="File reference")
    tags: List[PydanticObjectId] = Field(default_factory=list, description="References to Tag")
    key_value_pairs: List[KeyValuePair] = Field(default_factory=list, description="Key-value pairs")
    json_value: str = Field(default="", description="JSON value")
    folder_id: PydanticObjectId = Field(..., description="Reference to Folder")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "secrets"
        indexes = [["created_by", "folder_id"]]

class SecurityQuestion(Document):
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    security_questions: List[SecurityQuestionItem] = Field(..., description="List of security questions")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "security_questions"
        indexes = [["user_id"]]

    async def pre_save(self):
        self.updated_at = datetime.utcnow()

class SharedItem(Document):
    owner_id: PydanticObjectId = Field(..., description="Reference to User (owner)")
    item_type: str = Field(..., description="Type of shared item")
    item_id: PydanticObjectId = Field(..., description="Reference to shared item")
    shared_with: List[SharedWith] = Field(..., description="Users with permissions")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "shared_items"
        indexes = [["owner_id", "item_id"]]

class SSOSettings(Document):
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    provider: Annotated[str, Field(..., pattern="^(google|facebook|azure-ad|saml|oauth2|openid-connect)$")] = None
    login_url: Optional[str] = None
    redirect_url: str = Field(..., description="Redirect URL")
    client_id: str = Field(..., description="Client ID")
    client_secret: str = Field(..., description="Client secret (should be encrypted)")
    tenant_id: Optional[str] = None
    secret_expiry: Optional[datetime] = None
    scopes: List[str] = Field(default_factory=list, description="OAuth scopes")
    additional_settings: Dict[str, str] = Field(default_factory=dict, description="Custom settings")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "sso_settings"
        indexes = [["user_id"]]

class Subscription(Document):
    paypal_subscription_id: Optional[str] = None
    user_id: PydanticObjectId = Field(..., description="Reference to User")
    plan: str = Field(..., description="Subscription plan type")
    subscription_status: str = Field(..., description="Subscription status")
    subscription_expiry: Optional[datetime] = None
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    trial_end_date: Optional[datetime] = None
    plan_action: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "subscriptions"
        indexes = [["user_id"]]

class Tag(Document):
    name: str = Field(..., description="Tag name", unique=True)
    description: Optional[str] = None
    created_by: Optional[PydanticObjectId] = None
    tag_type: Annotated[str, Field(..., pattern="^(passwords|notes|cards|proof|files|address|secrets)$")] = "passwords"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tags"
        indexes = [["name"]]

class Ticket(Document):
    ticket_id: str = Field(
        default_factory=lambda: f"TICKET-{int(datetime.utcnow().timestamp())}",
        description="Unique ticket ID",
        unique=True
    )
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    category: Optional[str] = None
    category_subtype: Optional[str] = None
    description: Optional[str] = None
    user_id: Optional[PydanticObjectId] = None
    priority: Annotated[str, Field(default="Medium", pattern="^(Low|Medium|High)$")] = None
    severity: Annotated[str, Field(default="Moderate", pattern="^(Minor|Moderate|Critical)$")] = None
    status: Annotated[str, Field(default="Open", pattern="^(Open|In Progress|Resolved|Closed)$")] = None
    assignee: Optional[str] = None
    resolution_notes: Optional[str] = None
    attachments: List[str] = Field(default_factory=list, description="Attachment URLs")
    user_agent: Optional[str] = None
    related_tickets: List[PydanticObjectId] = Field(default_factory=list, description="References to Ticket")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tickets"
        indexes = [["ticket_id", "user_id"]]

    async def pre_save(self):
        self.updated_at = datetime.utcnow()

class User(Document):
    name: str = Field(..., description="User name")
    email: EmailStr = Field(..., description="User email", unique=True)
    phone: Annotated[int, Field(..., ge=1000000000, le=9999999999)] = None  # 10-digit constraint
    user_image: Optional[str] = None
    totp_qr_image: Optional[str] = None
    password: Optional[str] = None  # Should be hashed/encrypted
    email_confirmed: bool = Field(default=False, description="Email confirmation status")
    confirmation_code: Optional[str] = None
    tokens: List[Token] = Field(default_factory=list, description="Auth tokens")
    reset_token: Optional[str] = None
    reset_token_expiry: Optional[datetime] = None
    mfa_enabled: bool = Field(default=False, description="MFA enabled flag")
    mfa_method: Annotated[str, Field(default="email", pattern="^(email|sms|totp|fingerprint|webauthn|null)$")] = None
    totp_secret: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    organization_ids: List[PydanticObjectId] = Field(default_factory=list, description="References to Organization")
    invitation_ids: List[PydanticObjectId] = Field(default_factory=list, description="References to Invitation")
    country: Optional[str] = None
    favorites: List[PydanticObjectId] = Field(default_factory=list, description="References to Password")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    role: Annotated[str, Field(default="admin", pattern="^(admin|user)$")] = None
    public_key: Optional[str] = None
    passphrase: Optional[str] = None  # Should be encrypted
    fingerprint: Optional[str] = None
    recovery_token_expiry: datetime = Field(default_factory=datetime.utcnow)
    recovery_token: Optional[str] = None
    webauthn_client_id: Optional[str] = None
    webauthn_public_key: Optional[str] = None
    webauthn_challenge: Optional[str] = None
    passkeys_for_webauth: List[Any] = Field(default_factory=list, description="WebAuthn passkeys")
    security_pin: Optional[str] = None  # Should be encrypted

    class Settings:
        name = "users"
        indexes = [["email"]]

from beanie import Document
from pydantic import Field
from datetime import datetime
from typing import Optional

class Log(Document):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    level: str = Field(..., description="Log level (e.g., INFO, ERROR)")
    message: str = Field(..., description="Log message")
    user_id: Optional[str] = None  # Adjust type if linked to a User model
    request_id: Optional[str] = None
    source: Optional[str] = None

    class Settings:
        name = "logs"  # Collection name in MongoDB
        indexes = [["timestamp", "level"]]  # For efficient querying