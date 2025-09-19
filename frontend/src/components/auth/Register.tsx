import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { RegisterFormData, RegisterRequest } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Partial<RegisterFormData>>({});

  const validateForm = (): boolean => {
    const errors: Partial<RegisterFormData> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: RegisterFormData) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof RegisterFormData]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const registerData: RegisterRequest = {
      username: formData.username,
      password: formData.password,
      first_name: formData.firstName || undefined,
      last_name: formData.lastName || undefined
    };

    try {
      const success = await register(registerData);
      if (success) {
        navigate('/');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.status === 409) {
        setError('Username already exists');
      } else if (error.response?.status === 400) {
        setError('Invalid registration data');
      } else if (error.response?.status === 429) {
        setError('Too many attempts. Please try again later.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (error.message === 'Network Error') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  };

  const handleInputFocus = (fieldName: keyof RegisterFormData) => {
    // Clear field error on focus
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: undefined
      }));
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-light text-gray-900">
            Create account
          </h2>
          <p className="mt-2 text-gray-500">
            Join BackRoot community
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm">
              <div className="flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus('username')}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.username ? 'border-red-300' : 'border-gray-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors`}
                placeholder="Enter username"
              />
              {fieldErrors.username && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
                  placeholder="Optional"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus('password')}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.password ? 'border-red-300' : 'border-gray-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors`}
                placeholder="At least 6 characters"
              />
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onFocus={() => handleInputFocus('confirmPassword')}
                required
                className={`w-full px-3 py-2 border ${
                  fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } rounded focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors`}
                placeholder="Confirm your password"
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2 px-4 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
            
            <div className="text-center">
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;