import requests
import json

try:
    print("Sending request to backend...")
    response = requests.get("http://localhost:8000/api/v1/briefings/today", timeout=300)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Response JSON:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print(f"Error Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
