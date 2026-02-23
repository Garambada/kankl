import requests

login_data = {"username": "ankl@boardroom.club", "password": "boardroom123"}
response = requests.post("http://localhost:8000/api/v1/auth/login", data=login_data)
print(f"Login Response: {response.status_code}")
print(response.json())
