import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
SPEAKER_ID = 1 # Assuming "Park Taewung" is ID 1

def verify_rag_flow():
    # 1. Login to get token
    print("Logging in...")
    login_response = requests.post(f"{BASE_URL}/auth/login", data={
        "username": "test_vwxamacuiz@example.com", # Use the user created in previous step
        "password": "securepassword123"
    })
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        # Try registering if login fails (user might not exist if DB was reset)
        print("Login failed, trying to register...")
        reg_response = requests.post(f"{BASE_URL}/auth/register", json={
            "email": "rag_test@example.com",
            "password": "securepassword123",
            "name": "RAG Tester"
        })
        if reg_response.status_code != 200:
             print(f"Registration failed: {reg_response.text}")
             return False
        token = reg_response.json()["access_token"]
    else:
        token = login_response.json()["access_token"]
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Start a New Chat
    print(f"\nSending Chat Message to Speaker {SPEAKER_ID}...")
    chat_payload = {
        "speaker_id": SPEAKER_ID,
        "message": "AI 도입 시 가장 중요한 고려사항은 무엇인가요?"
    }
    
    try:
        chat_response = requests.post(f"{BASE_URL}/advisory/chat", json=chat_payload, headers=headers)
    except Exception as e:
        print(f"Chat request failed: {e}")
        return False
        
    if chat_response.status_code != 200:
        print(f"Chat API failed: {chat_response.text}")
        return False
        
    chat_data = chat_response.json()
    conversation_id = chat_data.get("conversation_id")
    ai_response = chat_data.get("response")
    
    print(f"✅ Chat Success!")
    print(f"Conversation ID: {conversation_id}")
    print(f"AI Response: {ai_response[:100]}...") # Print first 100 chars
    
    if not conversation_id:
        print("❌ No conversation_id returned")
        return False

    # 3. Retrieve Conversation History
    print(f"\nFetching Conversation History ({conversation_id})...")
    time.sleep(1) # Wait a bit to ensure DB write
    
    history_response = requests.get(f"{BASE_URL}/advisory/conversations/{conversation_id}", headers=headers)
    
    if history_response.status_code != 200:
        print(f"Get History failed: {history_response.text}")
        return False
        
    history_data = history_response.json()
    messages = history_data.get("messages", [])
    
    print(f"✅ History Retrieved!")
    print(f"Total Messages: {len(messages)}")
    
    if len(messages) < 2:
        print("❌ Expected at least 2 messages (User + AI)")
        return False
        
    # Check if AI message is present
    ai_msgs = [m for m in messages if m["role"] == "assistant"]
    if not ai_msgs:
        print("❌ No AI message found in history")
        return False
        
    print("✅ RAG Verification PASSED")
    return True

if __name__ == "__main__":
    verify_rag_flow()
