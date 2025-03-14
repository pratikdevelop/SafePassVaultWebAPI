from fastapi import HTTPException, Request
from typing import Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId


class AddressController:
    @staticmethod
    async def create_address(data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Create a new address and log the action."""
        try:
            data["userId"] = user_id
            result = await db.addresses.insert_one(data)
            address_id = str(result.inserted_id)

            await db.audit_logs.insert_one({
                "userId": user_id,
                "action": "create",
                "entity": "Address",
                "entityId": address_id,
                "newValue": data,
                "ipAddress": request.client.host,
                "userAgent": request.headers.get("user-agent"),
            })
            
            return {**data, "id": address_id}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def get_all_addresses(request: Request, user_id: str) -> Dict[str, Any]:
        """Retrieve all addresses and log the action."""
        try:
            addresses = await db.addresses.find().to_list(length=100)
            for addr in addresses:
                addr["id"] = str(addr["_id"])
                del addr["_id"]

            await db.audit_logs.insert_one({
                "userId": user_id,
                "action": "view",
                "entity": "Address",
                "entityId": None,
                "newValue": addresses,
                "ipAddress": request.client.host,
                "userAgent": request.headers.get("user-agent"),
            })

            return {"addresses": addresses}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_address_by_id(address_id: str, request: Request, user_id: str) -> Dict[str, Any]:
        """Retrieve an address by ID and log the action."""
        try:
            address = await db.addresses.find_one({"_id": ObjectId(address_id)})
            if not address:
                raise HTTPException(status_code=404, detail="Address not found")
            address["id"] = str(address["_id"])
            del address["_id"]

            await db.audit_logs.insert_one({
                "userId": user_id,
                "action": "view",
                "entity": "Address",
                "entityId": address_id,
                "newValue": address,
                "ipAddress": request.client.host,
                "userAgent": request.headers.get("user-agent"),
            })
            
            return address
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def update_address(address_id: str, data: Dict[str, Any], request: Request, user_id: str) -> Dict[str, Any]:
        """Update an address and log the action."""
        try:
            existing_address = await db.addresses.find_one({"_id": ObjectId(address_id)})
            if not existing_address:
                raise HTTPException(status_code=404, detail="Address not found")
            old_value = existing_address.copy()
            await db.addresses.update_one({"_id": ObjectId(address_id)}, {"$set": data})
            updated_address = await db.addresses.find_one({"_id": ObjectId(address_id)})

            await db.audit_logs.insert_one({
                "userId": user_id,
                "action": "update",
                "entity": "Address",
                "entityId": address_id,
                "oldValue": old_value,
                "newValue": updated_address,
                "ipAddress": request.client.host,
                "userAgent": request.headers.get("user-agent"),
            })
            
            updated_address["id"] = str(updated_address["_id"])
            del updated_address["_id"]
            return updated_address
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def delete_address(address_id: str, request: Request, user_id: str) -> Dict[str, Any]:
        """Delete an address and log the action."""
        try:
            deleted_address = await db.addresses.find_one_and_delete({"_id": ObjectId(address_id)})
            if not deleted_address:
                raise HTTPException(status_code=404, detail="Address not found")
            
            await db.audit_logs.insert_one({
                "userId": user_id,
                "action": "delete",
                "entity": "Address",
                "entityId": address_id,
                "oldValue": deleted_address,
                "ipAddress": request.client.host,
                "userAgent": request.headers.get("user-agent"),
            })
            
            return {"message": "Address deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
