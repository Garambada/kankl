import requests
import json

try:
    response = requests.get("http://localhost:8000/api/v1/speakers")
    print(f"Status Code: {response.status_code}")
    print("Response Body:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
