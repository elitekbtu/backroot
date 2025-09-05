import React, { useState, useEffect } from 'react';
import { userService } from '../api/user';
import type { User, UserUpdateData, UserFormErrors } from '../types/user';

const Settings: React.FC = () => {
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
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
                        ? 'border-indigo-500 text-indigo-600'
                        : tab.disabled
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                    {tab.disabled && <span className="ml-2 text-xs">(Coming Soon)</span>}
                  </button>
                ))}
              </nav>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Success</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{success}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      value={profileData.first_name || ''}
                      onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                        errors.first_name ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      value={profileData.last_name || ''}
                      onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                      className={`mt-1 block w-full border rounded-md px-3 py-2 ${
                        errors.last_name ? 'border-red-300' : 'border-gray-300'
                      } focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    />
                    {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Management</h3>
                <p className="text-gray-600 mb-4">This feature is coming soon!</p>
                <p className="text-sm text-gray-500">Password change functionality will be available in a future update.</p>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚙️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Management</h3>
                <p className="text-gray-600 mb-4">This feature is coming soon!</p>
                <p className="text-sm text-gray-500">Account deactivation and reactivation functionality will be available in a future update.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
