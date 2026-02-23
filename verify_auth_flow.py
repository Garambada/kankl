import requests
import random
import string

BASE_URL = "http://localhost:8000/api/v1"

def get_random_string(length=10):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def verify_auth_flow():
    # 1. Register
    email = f"test_{get_random_string()}@example.com"
    password = "securepassword123"
    name = "Auth Test User"
    
    print(f"Registering user: {email}")
    reg_response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email,
        "password": password,
        "name": name
    })
    
    if reg_response.status_code != 200:
        print(f"Registration failed: {reg_response.text}")
        return False
        
    data = reg_response.json()
    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")
    
    if not access_token or not refresh_token:
        print("Tokens missing in registration response")
        return False
        
    print("Registration successful. Tokens received.")
    
    # 2. Get Profile (/me)
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = requests.get(f"{BASE_URL}/users/me", headers=headers)
    
    if me_response.status_code != 200:
        print(f"Get Profile failed: {me_response.text}")
        return False
        
    me_data = me_response.json()
    if me_data["email"] != email:
        print(f"Profile email mismatch: expected {email}, got {me_data['email']}")
        return False
        
    print("Profile retrieval successful.")
    
    # 3. Refresh Token
    print("Testing Token Refresh...")
    refresh_response = requests.post(f"{BASE_URL}/auth/refresh", json={
        "refresh_token": refresh_token
    })
    
    if refresh_response.status_code != 200:
        print(f"Refresh failed: {refresh_response.text}")
        return False
        
    refresh_data = refresh_response.json()
    new_access_token = refresh_data.get("access_token")
    
    if not new_access_token:
        print("New access token missing in refresh response")
        return False
        
    print("Token refresh successful.")
    return True

if __name__ == "__main__":
    try:
        if verify_auth_flow():
            print("\n✅ Verification PASSED")
        else:
            print("\n❌ Verification FAILED")
    except Exception as e:
        print(f"\n❌ Verification ERROR: {e}")
