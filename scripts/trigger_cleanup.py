import requests

try:
    response = requests.post("http://localhost:8000/api/v1/speakers/cleanup")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
