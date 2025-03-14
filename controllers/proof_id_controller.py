from fastapi import HTTPException, Request
from models import ProofId, AuditLog, User  # Assuming Beanie models
from typing import Dict, Any, List

class ProofIdController:
    @staticmethod
    async def create_proof_id(data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Create a new proof ID and log the action."""
        try:
            data["user_id"] = user_id
            proof_id = ProofId(**data)
            await proof_id.insert()

            await AuditLog(
                user_id=user_id,
                action="create",
                entity="proofId",
                entity_id=str(proof_id.id),
                new_value=proof_id.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return proof_id.dict()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def get_all_proof_ids(request: Request, user_id: str) -> Dict[str, Any]:
        """Retrieve all proof IDs and log the action."""
        try:
            proof_ids = await ProofId.find_all().populate("user_id", ["name", "email"]).to_list()
            proof_ids_dict = [proof_id.dict() for proof_id in proof_ids]

            await AuditLog(
                user_id=user_id,
                action="view",
                entity="proofId",
                entity_id=None,
                new_value=proof_ids_dict,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return {"proofIds": proof_ids_dict}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_proof_id_by_id(proof_id: str, request: Request, user_id: str) -> Dict[str, Any]:
        """Retrieve a proof ID by ID and log the action."""
        try:
            proof_id_obj = await ProofId.get(proof_id)
            if not proof_id_obj:
                raise HTTPException(status_code=404, detail="Proof ID not found")

            await AuditLog(
                user_id=user_id,
                action="view",
                entity="proofId",
                entity_id=str(proof_id_obj.id),
                new_value=proof_id_obj.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return proof_id_obj.dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def update_proof_id(proof_id: str, data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Update a proof ID and log the action."""
        allowed_updates = {"id_type", "id_number", "issued_by", "issue_date", "expiry_date"}
        if not all(key in allowed_updates for key in data):
            raise HTTPException(status_code=400, detail="Invalid updates!")

        try:
            proof_id_obj = await ProofId.get(proof_id)
            if not proof_id_obj:
                raise HTTPException(status_code=404, detail="Proof ID not found")

            old_value = proof_id_obj.dict()
            for key, value in data.items():
                setattr(proof_id_obj, key, value)
            await proof_id_obj.save()

            await AuditLog(
                user_id=user_id,
                action="update",
                entity="proofId",
                entity_id=str(proof_id_obj.id),
                old_value=old_value,
                new_value=proof_id_obj.dict(),
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return proof_id_obj.dict()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def delete_proof_id(proof_id: str, request: Request, user_id: str) -> Dict[str, Any]:
        """Delete a proof ID and log the action."""
        try:
            proof_id_obj = await ProofId.get(proof_id)
            if not proof_id_obj:
                raise HTTPException(status_code=404, detail="Proof ID not found")

            old_value = proof_id_obj.dict()
            await proof_id_obj.delete()

            await AuditLog(
                user_id=user_id,
                action="delete",
                entity="proofId",
                entity_id=proof_id,
                old_value=old_value,
                ip_address=request.client.host,
                user_agent=request.headers.get("user-agent"),
            ).insert()

            return proof_id_obj.dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))