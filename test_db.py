import requests

try:
    res = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "ankl@boardroom.club", "password": "boardroom123"})
    print("Status:", res.status_code)
    if res.status_code == 200:
        print("Success! Token starts with:", res.json().get("access_token")[:10])
    else:
        print("Response:", res.text)
except Exception as e:
    print("Failed to connect:", e)
