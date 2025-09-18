import React, { useState, useEffect } from 'react';
import { userService } from '../api/user';
import type { User } from '../types/user';

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isKioskMode, setIsKioskMode] = useState(false);

  const toggleKioskMode = () => {
    setIsKioskMode(!isKioskMode);
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-md p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading profile</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadUserProfile}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No profile found</h2>
          <p className="mt-2 text-gray-600">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12 ${isKioskMode ? 'text-2xl' : ''}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Kiosk Mode Toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleKioskMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isKioskMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } ${isKioskMode ? 'text-xl' : 'text-sm'}`}
            title={isKioskMode ? 'Exit Kiosk Mode' : 'Enter Kiosk Mode'}
          >
            {isKioskMode ? '🖥️ Exit Kiosk' : '📱 Kiosk Mode'}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className={`${isKioskMode ? 'p-6 sm:p-8' : 'px-4 py-5 sm:p-6'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className={`font-bold text-gray-900 ${
                isKioskMode ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'
              }`}>
                Profile
              </h1>
              <span className={`inline-flex items-center rounded-full font-medium ${
                isKioskMode ? 'px-4 py-2 text-lg' : 'px-2.5 py-0.5 text-xs'
              } ${
                user.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className={`mt-6 sm:mt-8 grid grid-cols-1 gap-4 sm:gap-6 ${
              isKioskMode ? 'gap-8' : 'gap-4 sm:gap-6'
            } sm:grid-cols-2`}>
              {/* Basic Information */}
              <div className={`bg-gray-50 rounded-lg ${
                isKioskMode ? 'p-6 sm:p-8' : 'px-4 py-5'
              }`}>
                <h3 className={`font-medium text-gray-900 mb-4 ${
                  isKioskMode ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                }`}>
                  Basic Information
                </h3>
                <dl className={`space-y-3 ${
                  isKioskMode ? 'space-y-4' : 'space-y-3'
                }`}>
                  <div>
                    <dt className={`font-medium text-gray-500 ${
                      isKioskMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}>Username</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                    }`}>{user.username}</dd>
                  </div>
                  <div>
                    <dt className={`font-medium text-gray-500 ${
                      isKioskMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}>First Name</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                    }`}>{user.first_name || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className={`font-medium text-gray-500 ${
                      isKioskMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}>Last Name</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                    }`}>{user.last_name || 'Not provided'}</dd>
                  </div>
                </dl>
              </div>

              {/* Account Information */}
              <div className={`bg-gray-50 rounded-lg ${
                isKioskMode ? 'p-6 sm:p-8' : 'px-4 py-5'
              }`}>
                <h3 className={`font-medium text-gray-900 mb-4 ${
                  isKioskMode ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
                }`}>
                  Account Information
                </h3>
                <dl className={`space-y-3 ${
                  isKioskMode ? 'space-y-4' : 'space-y-3'
                }`}>
                  <div>
                    <dt className={`font-medium text-gray-500 ${
                      isKioskMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}>User ID</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                    }`}>{user.id}</dd>
                  </div>
                  <div>
                    <dt className={`font-medium text-gray-500 ${
                      isKioskMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}>Account Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center rounded-full font-medium ${
                        isKioskMode ? 'px-4 py-2 text-lg' : 'px-2.5 py-0.5 text-xs'
                      } ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className={`font-medium text-gray-500 ${
                      isKioskMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}>Member Since</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                    }`}>{formatDate(user.created_at)}</dd>
                  </div>
                  <div>
                    <dt className={`font-medium text-gray-500 ${
                      isKioskMode ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'
                    }`}>Last Updated</dt>
                    <dd className={`mt-1 text-gray-900 ${
                      isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
                    }`}>{formatDate(user.updated_at)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={loadUserProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Refresh Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
