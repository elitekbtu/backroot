import React, { useState, useEffect } from 'react';
import { userService } from '../api/user';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import type { User, UserUpdateData, UserFormErrors, PasswordChangeData } from '../types/user';

const Settings: React.FC = () => {
  const deviceInfo = useDeviceDetection();
  const [user, setUser] = useState<User | null>(null);
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

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Form errors
  const [errors, setErrors] = useState<UserFormErrors>({});

  // Account deactivation confirmation
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

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

  const validatePasswordForm = (): boolean => {
    const newErrors: UserFormErrors = {};

    if (!passwordData.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 6) {
      newErrors.new_password = 'New password must be at least 6 characters';
    }

    if (!passwordData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your new password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (passwordData.current_password === passwordData.new_password) {
      newErrors.new_password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setErrors({});

      const updatedUser = await userService.updateCurrentUser(profileData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setErrors({});

      await userService.changePassword(passwordData);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      setSuccess('Password changed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await userService.deactivateUser();
      setSuccess('Account has been deactivated successfully. You will be logged out shortly.');
      
      // Log out user after a delay
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deactivate account';
      setError(errorMessage);
    } finally {
      setSaving(false);
      setShowDeactivateConfirm(false);
    }
  };

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
              { id: 'password', name: 'Password', icon: '🔒' },
              { id: 'account', name: 'Account', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  clearMessages();
                }}
                className={`${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium ${
                  deviceInfo.isKiosk ? 'text-lg' : 
                  deviceInfo.isMobile ? 'text-sm' : 'text-base'
                }`}
              >
                <span className={`${deviceInfo.isKiosk ? 'mr-3' : 'mr-2'}`}>{tab.icon}</span>
                {tab.name}
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
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="current_password" className={`block font-medium text-gray-700 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current_password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                      errors.current_password ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}
                  />
                  {errors.current_password && <p className={`mt-1 text-red-600 ${
                    deviceInfo.isKiosk ? 'text-base' : 
                    deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                  }`}>{errors.current_password}</p>}
                </div>

                <div>
                  <label htmlFor="new_password" className={`block font-medium text-gray-700 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                      errors.new_password ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}
                  />
                  {errors.new_password && <p className={`mt-1 text-red-600 ${
                    deviceInfo.isKiosk ? 'text-base' : 
                    deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                  }`}>{errors.new_password}</p>}
                </div>

                <div>
                  <label htmlFor="confirm_password" className={`block font-medium text-gray-700 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                      errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}
                  />
                  {errors.confirm_password && <p className={`mt-1 text-red-600 ${
                    deviceInfo.isKiosk ? 'text-base' : 
                    deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                  }`}>{errors.confirm_password}</p>}
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
                  {saving ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className={`bg-white border border-gray-200 rounded-lg ${
            deviceInfo.isKiosk ? 'p-8' : 
            deviceInfo.isMobile ? 'p-4' : 'p-6'
          }`}>
            <div className="space-y-8">
              {/* Account Information */}
              <div>
                <h3 className={`font-medium text-gray-900 mb-4 ${
                  deviceInfo.isKiosk ? 'text-2xl' : 
                  deviceInfo.isMobile ? 'text-lg' : 'text-xl'
                }`}>Account Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className={`bg-gray-50 rounded-lg ${
                    deviceInfo.isKiosk ? 'p-6' : 
                    deviceInfo.isMobile ? 'p-3' : 'p-4'
                  }`}>
                    <dt className={`font-medium text-gray-500 ${
                      deviceInfo.isKiosk ? 'text-base' : 
                      deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                    }`}>Username</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}>{user?.username}</dd>
                  </div>
                  <div className={`bg-gray-50 rounded-lg ${
                    deviceInfo.isKiosk ? 'p-6' : 
                    deviceInfo.isMobile ? 'p-3' : 'p-4'
                  }`}>
                    <dt className={`font-medium text-gray-500 ${
                      deviceInfo.isKiosk ? 'text-base' : 
                      deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                    }`}>Account Status</dt>
                    <dd className={`mt-1 ${
                      user?.is_active ? 'text-green-600' : 'text-red-600'
                    } ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}>
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </dd>
                  </div>
                  <div className={`bg-gray-50 rounded-lg ${
                    deviceInfo.isKiosk ? 'p-6' : 
                    deviceInfo.isMobile ? 'p-3' : 'p-4'
                  }`}>
                    <dt className={`font-medium text-gray-500 ${
                      deviceInfo.isKiosk ? 'text-base' : 
                      deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                    }`}>Member Since</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}>
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </dd>
                  </div>
                  <div className={`bg-gray-50 rounded-lg ${
                    deviceInfo.isKiosk ? 'p-6' : 
                    deviceInfo.isMobile ? 'p-3' : 'p-4'
                  }`}>
                    <dt className={`font-medium text-gray-500 ${
                      deviceInfo.isKiosk ? 'text-base' : 
                      deviceInfo.isMobile ? 'text-xs' : 'text-sm'
                    }`}>Last Updated</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      deviceInfo.isKiosk ? 'text-lg' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-base'
                    }`}>
                      {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Unknown'}
                    </dd>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              {user?.is_active && (
                <div className="border-t border-gray-200 pt-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className={`font-medium text-red-900 mb-2 ${
                      deviceInfo.isKiosk ? 'text-xl' : 
                      deviceInfo.isMobile ? 'text-base' : 'text-lg'
                    }`}>Danger Zone</h3>
                    <p className={`text-red-700 mb-4 ${
                      deviceInfo.isKiosk ? 'text-base' : 
                      deviceInfo.isMobile ? 'text-sm' : 'text-sm'
                    }`}>
                      Once you deactivate your account, you will lose access to the application. This action can be reversed by an administrator.
                    </p>
                    
                    {!showDeactivateConfirm ? (
                      <button
                        onClick={() => setShowDeactivateConfirm(true)}
                        className={`bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                          deviceInfo.isKiosk ? 'py-3 px-4 text-base' : 
                          deviceInfo.isMobile ? 'py-2 px-3 text-sm' : 'py-2 px-3 text-sm'
                        }`}
                      >
                        Deactivate Account
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <p className={`font-medium text-red-900 ${
                          deviceInfo.isKiosk ? 'text-base' : 
                          deviceInfo.isMobile ? 'text-sm' : 'text-sm'
                        }`}>
                          Are you sure you want to deactivate your account?
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={handleDeactivateAccount}
                            disabled={saving}
                            className={`bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors ${
                              deviceInfo.isKiosk ? 'py-2 px-4 text-base' : 
                              deviceInfo.isMobile ? 'py-2 px-3 text-sm' : 'py-2 px-3 text-sm'
                            }`}
                          >
                            {saving ? 'Deactivating...' : 'Yes, Deactivate'}
                          </button>
                          <button
                            onClick={() => setShowDeactivateConfirm(false)}
                            disabled={saving}
                            className={`bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 transition-colors ${
                              deviceInfo.isKiosk ? 'py-2 px-4 text-base' : 
                              deviceInfo.isMobile ? 'py-2 px-3 text-sm' : 'py-2 px-3 text-sm'
                            }`}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
