from fastapi import HTTPException
from models import SharedItem, Password, File, Card, Note, ProofId, User  # Assuming Beanie models
from typing import Dict, Any, List

class ItemController:
    @staticmethod
    def _get_model_by_item_type(item_type: str):
        """Helper to get model based on item type."""
        models = {
            "password": Password,
            "file": File,
            "card": Card,
            "note": Note,
            "ProofId": ProofId,
        }
        if item_type not in models:
            raise HTTPException(status_code=400, detail="Invalid item type")
        return models[item_type]

    @staticmethod
    async def share_item(data: Dict[str, Any], user_id: str) -> Dict[str, str]:
        """Share an item with specified users."""
        try:
            item_type, item_ids, users = data["itemType"], data["itemId"].split(","), data["users"]
            Model = ItemController._get_model_by_item_type(item_type)

            # Validate items exist
            items = await Model.find(Model.id.in_(item_ids)).to_list()
            if not items or len(items) != len(item_ids):
                raise HTTPException(status_code=404, detail=f"{item_type.capitalize()} not found")

            for item_id in item_ids:
                shared_item = await SharedItem.find_one(
                    SharedItem.owner_id == user_id,
                    SharedItem.item_type == item_type,
                    SharedItem.item_id == item_id
                )
                if shared_item:
                    # Update existing shared item
                    for user in users:
                        existing_share = next((s for s in shared_item.shared_with if str(s["user_id"]) == user["userId"]), None)
                        permissions = {
                            "view": "view" in user["permissions"],
                            "edit": "edit" in user["permissions"],
                            "delete": "delete" in user["permissions"],
                        }
                        if existing_share:
                            existing_share["permissions"] = permissions
                        else:
                            shared_item.shared_with.append({"user_id": user["userId"], "permissions": permissions})
                    await shared_item.save()
                else:
                    # Create new shared item
                    shared_item = SharedItem(
                        owner_id=user_id,
                        item_type=item_type,
                        item_id=item_id,
                        shared_with=[
                            {"user_id": user["userId"], "permissions": {
                                "view": "view" in user["permissions"],
                                "edit": "edit" in user["permissions"],
                                "delete": "delete" in user["permissions"],
                            }} for user in users
                        ]
                    )
                    await shared_item.insert()

            return {"message": f"{item_type.capitalize()} shared successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error sharing item: {str(e)}")

    @staticmethod
    async def get_items(item_type: str, user_id: str) -> List[Dict[str, Any]]:
        """Retrieve own and shared items of a specific type."""
        try:
            Model = ItemController._get_model_by_item_type(item_type)

            # Fetch own items
            own_items = await Model.find(Model.user_id == user_id).to_list()

            # Fetch shared items
            shared_items = await SharedItem.find(
                SharedItem.shared_with.user_id == user_id,
                SharedItem.item_type == item_type
            ).populate("item_id").to_list()

            # Combine items
            items = [item.dict() for item in own_items] + [
                {**shared.item_id.dict(), "permissions": shared.permissions}
                for shared in shared_items if shared.item_id
            ]
            return items
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching {item_type}s: {str(e)}")