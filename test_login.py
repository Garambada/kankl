import traceback
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
try:
    response = client.post("/api/v1/auth/login", data={"username": "ankl@boardroom.club", "password": "boardroom123"})
    print("Status:", response.status_code)
    print("Body:", response.text)
except BaseException as e:
    traceback.print_exc()
