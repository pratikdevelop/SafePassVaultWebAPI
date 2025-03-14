from fastapi import HTTPException, status, Depends
from models import User, Organization, Invitation, AuditLog  # Assuming Beanie or MongoEngine models
from typing import List, Dict, Optional,Any
from datetime import datetime
import uuid
import bcrypt
from configuration import send_email  # Replace with your email service

class InvitationController:
    @staticmethod
    async def send_invitation(
        user_id: str,
        organization_id: str,
        email: str,
        phone: str,
        name: str,
    ) -> Dict[str, Any]:
        """Send an invitation to join an organization."""
        try:
            # Find the organization
            organization = await Organization.find_one(Organization.id == organization_id)
            if not organization:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

            # Find the sender (current user)
            sender = await User.find_one(User.id == user_id)
            if not sender:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sender not found")

            # Create a new recipient user
            recipient = User(
                email=email,
                name=name,
                phone=phone,
                role="user",
            )
            await recipient.save()

            # Add recipient to the organization
            organization.members.append(recipient.id)
            await organization.save()

            # Create a new invitation
            invitation = Invitation(
                sender=sender.id,
                recipient=recipient.id,
                organization=organization.id,
            )
            await invitation.save()

            # Add invitation to the sender's invitation list
            sender.invitations.append(invitation.id)
            await sender.save()

            # Send email invitation
            email_content = f"""
                <b>Hi {recipient.name},</b>
                <p>{sender.name} has invited you to join the organization <strong>'{organization.name}'</strong> on SafePassVault.</p>
                <p>To accept this invitation, click the link below:</p>
                <p><a href="{os.getenv('FRONTEND_URL')}/auth/accept-invitation?id={invitation.id}">Accept Invitation</a></p>
                <p>If the link doesn’t work, copy and paste this URL into your browser: {os.getenv('FRONTEND_URL')}/auth/accept-invitation?id={invitation.id}</p>
                <p>Thank you,<br>SafePassVault Team</p>
            """
            await send_email(
                to=recipient.email,
                subject=f"Invitation to Join {organization.name}",
                html=email_content,
            )

            # Log the invitation
            audit_log = AuditLog(
                user_id=user_id,
                action="send_invitation",
                entity="invitation",
                entity_id=invitation.id,
                new_value=invitation.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent
            )
            await audit_log.save()

            return {"message": "Invitation sent successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    @staticmethod
    async def accept_invitation(invitation_id: str, password: str, email: str) -> Dict[str, Any]:
        """Accept an invitation and set up the user's account."""
        try:
            invitation = await Invitation.find_one(Invitation.id == invitation_id).populate("recipient")
            if not invitation:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")

            if invitation.is_accepted:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invitation already accepted")

            if invitation.recipient.email != email:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email does not match")

            # Hash the password
            hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
            confirmation_code = str(uuid.uuid4())

            # Update the recipient user
            await User.find_one(User.id == invitation.recipient.id).update(
                password=hashed_password,
                confirmation_code=confirmation_code,
            )

            # Mark the invitation as accepted
            invitation.is_accepted = True
            await invitation.save()

            # Send verification email
            email_content = f"""
                <b>Hi {invitation.recipient.name},</b>
                <p>Your invitation has been accepted! Use this verification code to complete your setup:</p>
                <p><strong>{confirmation_code}</strong></p>
                <p>Thank you,<br>SafePassVault Team</p>
            """
            await send_email(
                to=invitation.recipient.email,
                subject="Your Verification Code",
                html=email_content,
            )

            # Log the acceptance
            audit_log = AuditLog(
                user_id=invitation.recipient.id,
                action="accept_invitation",
                entity="invitation",
                entity_id=invitation.id,
                new_value=invitation.dict(),
                ip_address="0.0.0.0",  # Replace with actual IP
                user_agent="user-agent",  # Replace with actual user agent
            )
            await audit_log.save()

            return {"message": "Invitation accepted successfully"}
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))