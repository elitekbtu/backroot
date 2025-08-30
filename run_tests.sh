#!/bin/bash

echo "🚀 Starting V2V TalkingHead Integration Tests"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "backend/app/services/voice/v2v_service.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Test 1: Backend lip-sync functionality
echo ""
echo "🧪 Test 1: Backend Lip-Sync Generation"
echo "---------------------------------------"
cd backend

if command -v python3 &> /dev/null; then
    echo "Running Python lip-sync tests..."
    python3 test_lip_sync.py
elif command -v python &> /dev/null; then
    echo "Running Python lip-sync tests..."
    python test_lip_sync.py
else
    echo "❌ Python not found. Skipping backend tests."
fi

cd ..

# Test 2: Frontend dependencies
echo ""
echo "🧪 Test 2: Frontend Dependencies"
echo "--------------------------------"
cd frontend

if [ -f "package.json" ]; then
    echo "Checking React Native dependencies..."
    
    if grep -q "react-native-webview" package.json; then
        echo "✅ react-native-webview found in package.json"
    else
        echo "❌ react-native-webview not found in package.json"
        echo "Installing react-native-webview..."
        npm install react-native-webview
    fi
    
    echo "Checking other dependencies..."
    npm list --depth=0 | grep -E "(expo-av|react-native-safe-area-context)"
else
    echo "❌ package.json not found in frontend directory"
fi

cd ..

# Test 3: File structure
echo ""
echo "🧪 Test 3: File Structure"
echo "-------------------------"
echo "Checking required files..."

files_to_check=(
    "backend/app/services/voice/v2v_service.py"
    "backend/app/services/voice/websocket_handler.py"
    "backend/app/services/voice/router.py"
    "frontend/components/V2VComponent.tsx"
    "frontend/test_talkinghead.html"
    "README_TALKINGHEAD_INTEGRATION.md"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
    fi
done

# Test 4: WebView test
echo ""
echo "🧪 Test 4: WebView Integration"
echo "------------------------------"
if [ -f "frontend/test_talkinghead.html" ]; then
    echo "✅ HTML test file found"
    echo "💡 You can open frontend/test_talkinghead.html in a browser to test TalkingHead"
else
    echo "❌ HTML test file not found"
fi

echo ""
echo "=============================================="
echo "🎯 Testing Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the backend: cd backend && uvicorn app.main:app --reload"
echo "2. Start the frontend: cd frontend && npm start"
echo "3. Test the HTML file: open frontend/test_talkinghead.html in a browser"
echo "4. Test the React Native app with the new V2VComponent"
echo ""
echo "📚 Documentation: README_TALKINGHEAD_INTEGRATION.md"
echo "🔧 Troubleshooting: Check the logs above for any errors"
