import React, { useState, useEffect } from 'react';
import { userService } from '../api/user';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import type { User, UserUpdateData, UserFormErrors } from '../types/user';

const Settings: React.FC = () => {
  const deviceInfo = useDeviceDetection();
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'account'>('profile');

  // Profile form state
  const [profileData, setProfileData] = useState<UserUpdateData>({
    first_name: '',
    last_name: '',
  });

  // Password form state removed - feature coming soon

  // Form errors
  const [errors, setErrors] = useState<UserFormErrors>({});

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userService.getCurrentUser();
      setUser(userData);
      setProfileData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateProfileForm = (): boolean => {
    const newErrors: UserFormErrors = {};

    if (profileData.first_name && profileData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (profileData.last_name && profileData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password validation removed - feature coming soon

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setErrors({}); // Clear previous errors

      const updatedUser = await userService.updateCurrentUser(profileData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      
      // If it's a validation error, try to parse field-specific errors
      if (errorMessage.includes('Validation error:')) {
        // You could parse the error message to set specific field errors here
        console.error('Validation error details:', errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  // Password submit removed - feature coming soon

  // Account action removed - feature coming soon

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
    setErrors({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className={`animate-spin rounded-full border-b-2 border-gray-900 mx-auto mb-4 ${
            deviceInfo.isKiosk ? 'h-16 w-16' : 
            deviceInfo.isMobile ? 'h-8 w-8' : 'h-12 w-12'
          }`}></div>
          <div className={`text-gray-600 ${
            deviceInfo.isKiosk ? 'text-xl' : 
            deviceInfo.isMobile ? 'text-sm' : 'text-base'
          }`}>
            Loading settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`font-light text-gray-900 mb-4 ${
            deviceInfo.isKiosk ? 'text-4xl' : 
            deviceInfo.isMobile ? 'text-2xl' : 'text-3xl'
          }`}>
            Settings
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex justify-center space-x-8">
            {[
              { id: 'profile', name: 'Profile', icon: '👤' },
              { id: 'password', name: 'Password', icon: '🔒', disabled: true },
              { id: 'account', name: 'Account', icon: '⚙️', disabled: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (!tab.disabled) {
                    setActiveTab(tab.id as any);
                    clearMessages();
                  }
                }}
                disabled={tab.disabled}
                className={`${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : tab.disabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium ${
                  deviceInfo.isKiosk ? 'text-lg' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-base'
                }`}
              >
                <span className={`${deviceInfo.isKiosk ? 'mr-3' : 'mr-2'}`}>{tab.icon}</span>
                {tab.name}
                {tab.disabled && <span className={`ml-2 ${
                  deviceInfo.isKiosk ? 'text-sm' : 'text-xs'
                }`}>(Coming Soon)</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Messages */}
        {error && (
          <div className={`mb-6 bg-white border border-gray-200 rounded-lg ${
            deviceInfo.isKiosk ? 'p-6' : 
            deviceInfo.isMobile ? 'p-4' : 'p-5'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="text-red-500 mr-2">⚠️</div>
              </div>
              <div className="ml-3">
                <h3 className={`font-medium text-gray-900 ${
                  deviceInfo.isKiosk ? 'text-lg' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-base'
                }`}>Error</h3>
                <div className={`mt-2 text-gray-600 ${
                  deviceInfo.isKiosk ? 'text-base' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-sm'
                }`}>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className={`mb-6 bg-white border border-gray-200 rounded-lg ${
            deviceInfo.isKiosk ? 'p-6' : 
            deviceInfo.isMobile ? 'p-4' : 'p-5'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="text-green-500 mr-2">✓</div>
              </div>
              <div className="ml-3">
                <h3 className={`font-medium text-gray-900 ${
                  deviceInfo.isKiosk ? 'text-lg' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-base'
                }`}>Success</h3>
                <div className={`mt-2 text-gray-600 ${
                  deviceInfo.isKiosk ? 'text-base' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-sm'
                }`}>
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={`bg-white border border-gray-200 rounded-lg ${
            deviceInfo.isKiosk ? 'p-8' : 
            deviceInfo.isMobile ? 'p-4' : 'p-6'
          }`}>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className={`block font-medium text-gray-700 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    value={profileData.first_name || ''}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                      errors.first_name ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}
                  />
                  {errors.first_name && <p className={`mt-1 text-red-600 ${
                    deviceInfo.isKiosk ? 'text-base' : 
                    deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                  }`}>{errors.first_name}</p>}
                </div>

                <div>
                  <label htmlFor="last_name" className={`block font-medium text-gray-700 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    value={profileData.last_name || ''}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                      errors.last_name ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}
                  />
                  {errors.last_name && <p className={`mt-1 text-red-600 ${
                    deviceInfo.isKiosk ? 'text-base' : 
                    deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                  }`}>{errors.last_name}</p>}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={saving}
                  className={`bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors ${
                    deviceInfo.isKiosk ? 'py-4 px-6 text-lg' : 
                    deviceInfo.isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-4'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className={`bg-white border border-gray-200 rounded-lg ${
            deviceInfo.isKiosk ? 'p-8' : 
            deviceInfo.isMobile ? 'p-4' : 'p-6'
          }`}>
            <div className="text-center py-12">
              <div className={`mb-4 ${
                deviceInfo.isKiosk ? 'text-8xl' : 
                deviceInfo.isMobile ? 'text-4xl' : 'text-6xl'
              }`}>🔒</div>
              <h3 className={`font-medium text-gray-900 mb-2 ${
                deviceInfo.isKiosk ? 'text-2xl' : 
                deviceInfo.isMobile ? 'text-lg' : 'text-xl'
              }`}>Password Management</h3>
              <p className={`text-gray-500 mb-4 ${
                deviceInfo.isKiosk ? 'text-lg' : 
                deviceInfo.isMobile ? 'text-sm' : 'text-base'
              }`}>This feature is coming soon!</p>
              <p className={`text-gray-400 ${
                deviceInfo.isKiosk ? 'text-base' : 
                deviceInfo.isMobile ? 'text-xs' : 'text-sm'
              }`}>Password change functionality will be available in a future update.</p>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className={`bg-white border border-gray-200 rounded-lg ${
            deviceInfo.isKiosk ? 'p-8' : 
            deviceInfo.isMobile ? 'p-4' : 'p-6'
          }`}>
            <div className="text-center py-12">
              <div className={`mb-4 ${
                deviceInfo.isKiosk ? 'text-8xl' : 
                deviceInfo.isMobile ? 'text-4xl' : 'text-6xl'
              }`}>⚙️</div>
              <h3 className={`font-medium text-gray-900 mb-2 ${
                deviceInfo.isKiosk ? 'text-2xl' : 
                deviceInfo.isMobile ? 'text-lg' : 'text-xl'
              }`}>Account Management</h3>
              <p className={`text-gray-500 mb-4 ${
                deviceInfo.isKiosk ? 'text-lg' : 
                deviceInfo.isMobile ? 'text-sm' : 'text-base'
              }`}>This feature is coming soon!</p>
              <p className={`text-gray-400 ${
                deviceInfo.isKiosk ? 'text-base' : 
                deviceInfo.isMobile ? 'text-xs' : 'text-sm'
              }`}>Account deactivation and reactivation functionality will be available in a future update.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
