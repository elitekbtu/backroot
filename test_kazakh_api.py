#!/usr/bin/env python3
"""
Test script for Kazakh language API endpoints
"""

import requests
import json

def test_kazakh_api():
    """Test Kazakh language support via API"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Kazakh language API...")
    
    # Test text input endpoint
    text_data = {
        "text": "Сәлем! Қалайсыз? Менің атым Айша.",
        "location_context": {
            "city": {"name": "Almaty", "country": "Kazakhstan"},
            "localTime": "2024-01-01 12:00:00",
            "timezone": "UTC"
        }
    }
    
    try:
        print("\n📝 Testing text input with Kazakh text...")
        print(f"Input text: {text_data['text']}")
        
        # Test the V2V text endpoint
        response = requests.post(
            f"{base_url}/api/v1/voice/text",
            json=text_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response: {result.get('ai_response', 'No response')}")
            print(f"   Language: {result.get('lip_sync_data', {}).get('language', 'Unknown')}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("Make sure the backend server is running on localhost:8000")

if __name__ == "__main__":
    test_kazakh_api()
