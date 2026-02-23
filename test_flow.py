import requests

# 1. Login as Admin
print("Logging in as Admin...")
res = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "ankl@boardroom.club", "password": "boardroom123"})
if res.status_code != 200:
    print(f"Admin login failed: {res.text}")
    exit(1)
admin_token = res.json()["access_token"]

# 2. Create User
print("Creating test user...")
headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
user_data = {"name": "Test Login Flow", "email": "flow@boardroom.club", "password": "flowpassword123", "role": "member"}
res = requests.post("http://localhost:8000/api/v1/users/", headers=headers, json=user_data)
if res.status_code not in (200, 400): # 400 if already exists
    print(f"User creation failed: {res.text}")
    exit(1)

# 3. Login as Test User
print("Logging in as Test User...")
res = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "flow@boardroom.club", "password": "flowpassword123"})
if res.status_code != 200:
    print(f"Test user login failed: {res.text}")
    exit(1)
print("Login successful! Token:", res.json()["access_token"][:20] + "...")
