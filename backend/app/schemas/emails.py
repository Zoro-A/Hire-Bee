from datetime import datetime

from pydantic import BaseModel


class EmailLogResponse(BaseModel):
    id: int
    sender: str
    recipient: str
    subject: str
    body: str
    status: str
    provider: str
    created_at: datetime

    model_config = {"from_attributes": True}
