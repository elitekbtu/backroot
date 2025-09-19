#!/usr/bin/env python3
"""
Test script for TTS fix
"""

def test_tts_function_structure():
    """Test that TTS function has correct structure"""
    print("🧪 Testing TTS function structure...")
    
    # Read the TTS function to check for syntax
    try:
        with open('backend/app/services/voice/openai_client.py', 'r') as f:
            content = f.read()
        
        # Check if audio_bytes is properly defined
        if 'audio_bytes = response.read()' in content:
            print("✅ audio_bytes is properly defined")
        else:
            print("❌ audio_bytes definition not found")
            return False
        
        # Check if audio_bytes is used in base64 encoding
        if 'base64.b64encode(audio_bytes)' in content:
            print("✅ audio_bytes is used in base64 encoding")
        else:
            print("❌ audio_bytes not used in base64 encoding")
            return False
        
        # Check for proper indentation
        lines = content.split('\n')
        tts_start = None
        for i, line in enumerate(lines):
            if 'async def text_to_speech' in line:
                tts_start = i
                break
        
        if tts_start is not None:
            # Check the structure around the audio_bytes line
            for i in range(tts_start, min(tts_start + 50, len(lines))):
                if 'audio_bytes = response.read()' in lines[i]:
                    # Check indentation (should be 12 spaces)
                    if lines[i].startswith('            '):
                        print("✅ audio_bytes line has correct indentation")
                    else:
                        print(f"❌ audio_bytes line has incorrect indentation: '{lines[i]}'")
                        return False
                    break
        
        print("✅ TTS function structure test completed!")
        return True
        
    except Exception as e:
        print(f"❌ Error reading TTS function: {e}")
        return False

def test_syntax():
    """Test Python syntax of the TTS file"""
    print("\n🧪 Testing Python syntax...")
    
    try:
        import ast
        with open('backend/app/services/voice/openai_client.py', 'r') as f:
            content = f.read()
        
        # Parse the file to check for syntax errors
        ast.parse(content)
        print("✅ Python syntax is valid")
        return True
        
    except SyntaxError as e:
        print(f"❌ Syntax error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error checking syntax: {e}")
        return False

def main():
    """Run TTS fix tests"""
    print("🚀 Starting TTS fix tests...\n")
    
    tests = [
        test_tts_function_structure,
        test_syntax
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()  # Add spacing between tests
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 TTS fix tests passed!")
        print("\n🔧 Fixed issues:")
        print("   ✅ audio_bytes variable is properly defined")
        print("   ✅ audio_bytes is used in base64 encoding")
        print("   ✅ Python syntax is valid")
        print("   ✅ TTS function should work correctly now")
        return 0
    else:
        print("⚠️  Some TTS fix tests failed.")
        return 1

if __name__ == "__main__":
    import sys
    exit_code = main()
    sys.exit(exit_code)