import React, { useState, useEffect } from 'react';
import { getARCapabilities } from '../lib/ar-utils';

const ARTest: React.FC = () => {
  const [capabilities, setCapabilities] = useState<{
    arSupported: boolean;
    cameraAccess: boolean;
    canRunAR: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCapabilities = async () => {
      try {
        const caps = await getARCapabilities();
        setCapabilities(caps);
      } catch (error) {
        console.error('Error checking AR capabilities:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCapabilities();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Checking AR capabilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">AR Capabilities Test</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Device Capabilities</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">WebXR AR Support:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  capabilities?.arSupported 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {capabilities?.arSupported ? 'Supported' : 'Not Supported'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Camera Access:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  capabilities?.cameraAccess 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {capabilities?.cameraAccess ? 'Available' : 'Not Available'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">AR Ready:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  capabilities?.canRunAR 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {capabilities?.canRunAR ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Browser Information:</h3>
              <p className="text-sm text-blue-800">
                <strong>User Agent:</strong> {navigator.userAgent}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Platform:</strong> {navigator.platform}
              </p>
            </div>

            {!capabilities?.canRunAR && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold text-yellow-900 mb-2">Requirements for AR:</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• WebXR AR support (Chrome on Android, Safari on iOS 15+)</li>
                  <li>• Camera access permission</li>
                  <li>• HTTPS connection (required for camera access)</li>
                  <li>• Compatible device with AR capabilities</li>
                </ul>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                Refresh Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ARTest;
