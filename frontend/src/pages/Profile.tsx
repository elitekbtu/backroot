import React, { useState, useEffect } from 'react';
import { userService } from '../api/user';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import type { User } from '../types/user';

const Profile: React.FC = () => {
  const deviceInfo = useDeviceDetection();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className={`w-full text-center ${
          deviceInfo.isKiosk ? 'max-w-lg' : 'max-w-md'
        }`}>
          <div className={`text-red-500 mb-4 ${
            deviceInfo.isKiosk ? 'text-2xl' : 
            deviceInfo.isMobile ? 'text-base' : 'text-lg'
          }`}>
            ⚠️ {error}
          </div>
          <button
            onClick={loadUserProfile}
            className={`bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors ${
              deviceInfo.isKiosk ? 'py-4 px-6 text-lg' : 
              deviceInfo.isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-4'
            }`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className={`text-center ${
          deviceInfo.isKiosk ? 'text-2xl' : 
          deviceInfo.isMobile ? 'text-lg' : 'text-xl'
        }`}>
          <h2 className="font-light text-gray-900 mb-2">No profile found</h2>
          <p className="text-gray-500">Unable to load your profile information.</p>
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
            Profile
          </h1>
          <div className="flex justify-center">
            <span className={`inline-flex items-center rounded-full font-medium ${
              deviceInfo.isKiosk ? 'px-4 py-2 text-lg' : 
              deviceInfo.isMobile ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
            } ${
              user.is_active 
                ? 'bg-gray-100 text-gray-900' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {/* Profile Information */}
        <div className={`bg-white border border-gray-200 rounded-lg mb-8 ${
          deviceInfo.isKiosk ? 'p-8' : 
          deviceInfo.isMobile ? 'p-4' : 'p-6'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div>
              <h3 className={`font-medium text-gray-900 mb-6 ${
                deviceInfo.isKiosk ? 'text-2xl' : 
                deviceInfo.isMobile ? 'text-lg' : 'text-xl'
              }`}>
                Basic Information
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className={`font-medium text-gray-500 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>Username</dt>
                  <dd className={`mt-1 text-gray-900 ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-lg'
                  }`}>{user.username}</dd>
                </div>
                <div>
                  <dt className={`font-medium text-gray-500 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>First Name</dt>
                  <dd className={`mt-1 text-gray-900 ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-lg'
                  }`}>{user.first_name || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className={`font-medium text-gray-500 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>Last Name</dt>
                  <dd className={`mt-1 text-gray-900 ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-lg'
                  }`}>{user.last_name || 'Not provided'}</dd>
                </div>
              </dl>
            </div>

            {/* Account Information */}
            <div>
              <h3 className={`font-medium text-gray-900 mb-6 ${
                deviceInfo.isKiosk ? 'text-2xl' : 
                deviceInfo.isMobile ? 'text-lg' : 'text-xl'
              }`}>
                Account Information
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className={`font-medium text-gray-500 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>User ID</dt>
                  <dd className={`mt-1 text-gray-900 ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-lg'
                  }`}>{user.id}</dd>
                </div>
                <div>
                  <dt className={`font-medium text-gray-500 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>Account Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center rounded-full font-medium ${
                      deviceInfo.isKiosk ? 'px-4 py-2 text-lg' : 
                      deviceInfo.isMobile ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
                    } ${
                      user.is_active 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className={`font-medium text-gray-500 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>Member Since</dt>
                  <dd className={`mt-1 text-gray-900 ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-lg'
                  }`}>{formatDate(user.created_at)}</dd>
                </div>
                <div>
                  <dt className={`font-medium text-gray-500 ${
                    deviceInfo.isKiosk ? 'text-lg' : 
                    deviceInfo.isMobile ? 'text-sm' : 'text-base'
                  }`}>Last Updated</dt>
                  <dd className={`mt-1 text-gray-900 ${
                    deviceInfo.isKiosk ? 'text-xl' : 
                    deviceInfo.isMobile ? 'text-base' : 'text-lg'
                  }`}>{formatDate(user.updated_at)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <button
            onClick={loadUserProfile}
            className={`bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors ${
              deviceInfo.isKiosk ? 'py-4 px-6 text-lg' : 
              deviceInfo.isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-4'
            }`}
          >
            Refresh Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
