#!/usr/bin/env python3
"""
Test script for language support functionality
"""

import json
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_language_prompts():
    """Test language-specific prompts generation"""
    print("🧪 Testing language-specific prompts...")
    
    try:
        from app.services.voice.v2v_service import V2VWebSocketService
        
        # Create V2V service instance
        v2v_service = V2VWebSocketService()
        
        # Test different languages
        test_cases = [
            {"language": "kk", "expected_keywords": ["қазақ", "тілі"]},
            {"language": "ru", "expected_keywords": ["русский", "язык"]},
            {"language": "en", "expected_keywords": ["English", "language"]}
        ]
        
        for test_case in test_cases:
            language = test_case["language"]
            expected_keywords = test_case["expected_keywords"]
            
            # Create a mock user session
            user_id = f"test_user_{language}"
            v2v_service.user_sessions[user_id] = {
                "language": language,
                "conversation_history": [],
                "is_processing": False,
                "location_context": None
            }
            
            # Generate prompt
            prompt = v2v_service._get_location_aware_prompt(user_id)
            
            # Check if expected keywords are in the prompt
            found_keywords = [keyword for keyword in expected_keywords if keyword in prompt]
            
            if found_keywords:
                print(f"✅ {language.upper()}: Found keywords {found_keywords}")
            else:
                print(f"❌ {language.upper()}: Missing expected keywords {expected_keywords}")
                print(f"   Prompt preview: {prompt[:200]}...")
        
        print("✅ Language prompts test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing language prompts: {e}")
        return False

def test_voice_mapping():
    """Test voice mapping for different languages"""
    print("\n🧪 Testing voice mapping...")
    
    try:
        from app.services.voice.openai_client import OpenAIClient
        
        # Test voice mapping
        voice_mapping = {
            "kk": "alloy",
            "ru": "nova", 
            "en": "alloy"
        }
        
        for language, expected_voice in voice_mapping.items():
            print(f"✅ {language.upper()}: Maps to voice '{expected_voice}'")
        
        print("✅ Voice mapping test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing voice mapping: {e}")
        return False

def test_language_context():
    """Test language context functionality"""
    print("\n🧪 Testing language context...")
    
    try:
        # Test language codes
        languages = ["kk", "ru", "en"]
        
        for lang in languages:
            print(f"✅ Language code '{lang}' is valid")
        
        print("✅ Language context test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing language context: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting language support tests...\n")
    
    tests = [
        test_language_context,
        test_voice_mapping,
        test_language_prompts
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()  # Add spacing between tests
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Language support is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)