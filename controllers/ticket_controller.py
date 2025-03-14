from fastapi import HTTPException, Request
from models import Ticket, User  # Assuming Beanie models
import os
from dotenv import load_dotenv
import httpx
import base64
from typing import Dict, Any, List

load_dotenv()

JIRA_BASE_URL = os.getenv("JIRA_BASE_URL")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")
JIRA_AUTH_TOKEN = os.getenv("JIRA_AUTH_TOKEN")
JIRA_EMAIL = os.getenv("MONGO_INITDB_ROOT_USERNAME")

class TicketController:
    @staticmethod
    async def create_ticket(data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Create a ticket in the database and Jira."""
        try:
            user = await User.find_one(User.id == user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Create new ticket
            new_ticket = Ticket(
                name=user.name,
                email=user.email,
                user_id=user_id,
                category=data.get("category"),
                category_subtype=data.get("categorySubtype"),
                description=data.get("description"),
                priority=data.get("priority"),
                severity=data.get("severity"),
                attachments=data.get("attachments"),
                user_agent=request.headers.get("user-agent"),
            )
            await new_ticket.insert()

            # Prepare Jira issue data
            jira_issue_data = {
                "fields": {
                    "project": {"key": "KAN"},  # Hardcoded as per your example; adjust as needed
                    "summary": f"Ticket: {user.name}",
                    "description": (
                        f"Category: {data.get('category', 'general-feedback')}\n"
                        f"Subtype: {data.get('categorySubtype', 'unknown')}\n"
                        f"Description: {data.get('description', 'N/A')}\n"
                        f"Priority: {data.get('priority', 'Medium')}\n"
                        f"Severity: {data.get('severity', 'Moderate')}\n"
                        f"User Email: {user.email}"
                    ),
                    "issuetype": {"name": "Task"},
                    "labels": ["bugfix", "blitz_test"],
                    "reporter": {"name": user.name},
                }
            }

            # Send request to Jira
            auth = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_AUTH_TOKEN}".encode()).decode()
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{JIRA_BASE_URL}/rest/api/2/issue",
                    headers={
                        "Authorization": f"Basic {auth}",
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    json=jira_issue_data,
                )
                response.raise_for_status()
                jira_data = response.json()

            return {
                "success": True,
                "message": "Ticket created successfully and added to Jira",
                "ticket": new_ticket.dict(),
                "jiraIssue": jira_data,
            }
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=500, detail=f"Failed to create ticket in Jira: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error creating ticket: {str(e)}")

    @staticmethod
    async def get_all_tickets() -> Dict[str, Any]:
        """Retrieve all tickets."""
        try:
            tickets = await Ticket.find_all().to_list()
            return {"success": True, "tickets": [ticket.dict() for ticket in tickets]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching tickets: {str(e)}")

    @staticmethod
    async def get_ticket_by_id(ticket_id: str) -> Dict[str, Any]:
        """Retrieve a ticket by ID."""
        try:
            ticket = await Ticket.get(ticket_id)
            if not ticket:
                raise HTTPException(status_code=404, detail="Ticket not found")
            return {"success g": True, "ticket": ticket.dict()}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching ticket: {str(e)}")

    @staticmethod
    async def update_ticket(ticket_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a ticket."""
        try:
            ticket = await Ticket.get(ticket_id)
            if not ticket:
                raise HTTPException(status_code=404, detail="Ticket not found")

            for key, value in data.items():
                setattr(ticket, key, value)
            await ticket.save()

            return {"success": True, "message": "Ticket updated successfully", "ticket": ticket.dict()}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error updating ticket: {str(e)}")

    @staticmethod
    async def delete_ticket(ticket_id: str) -> Dict[str, str]:
        """Delete a ticket."""
        try:
            ticket = await Ticket.get(ticket_id)
            if not ticket:
                raise HTTPException(status_code=404, detail="Ticket not found")

            await ticket.delete()
            return {"success": True, "message": "Ticket deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error deleting ticket: {str(e)}")