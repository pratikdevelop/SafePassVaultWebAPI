from fastapi import HTTPException
from models import AuditLog  # Assuming Beanie or MongoEngine models
from typing import Dict, Any, List, Optional
from datetime import datetime

class AuditLogController:
    @staticmethod
    async def get_user_audit_logs(user_id: str, action: Optional[str] = None, entity: Optional[str] = None,
                                  search_term: Optional[str] = None, start: Optional[str] = None,
                                  end: Optional[str] = None) -> Dict[str, Any]:
        """Retrieve audit logs for a specific user with optional filters."""
        try:
            query = {"userId": user_id}

            if action and action != "all":
                query["action"] = action

            if entity and entity != "all":
                query["$or"] = [
                    {"entity": {"$regex": entity, "$options": "i"}}
                ]

            if search_term:
                query["$or"] = [
                    {"entity": {"$regex": search_term, "$options": "i"}},
                    {"newValue.label": {"$regex": search_term, "$options": "i"}}
                ]

            if start and end and start != "null" and end != "null":
                query["createdAt"] = {
                    "$gte": datetime.fromisoformat(start),
                    "$lte": datetime.fromisoformat(end)
                }

            logs = await AuditLog.find(query).sort("-createdAt").to_list()
            return {"logs": logs}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching audit logs: {str(e)}")

    @staticmethod
    async def search_audit_logs(action: Optional[str] = None, start_date: Optional[str] = None,
                                end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search audit logs based on action and date range."""
        try:
            query = {}
            if action:
                query["action"] = action
            if start_date:
                query["timestamp"] = {"$gte": datetime.fromisoformat(start_date)}
            if end_date:
                query["timestamp"] = {"$lte": datetime.fromisoformat(end_date)}

            logs = await AuditLog.find(query).sort("-timestamp").to_list()
            return logs
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error searching audit logs: {str(e)}")