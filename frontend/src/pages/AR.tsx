import React, { useState, useEffect, useCallback } from 'react';
import { 
  getCoins, 
  createCoin, 
  updateCoin, 
  deleteCoin, 
  searchCoins
} from '../api/coin';
import type { 
  CoinResponse,
  CoinCreate,
  CoinUpdate
} from '../types/coin';
import SimpleAR from '../components/SimpleAR';

const ARPage: React.FC = () => {
  const [coins, setCoins] = useState<CoinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAR, setShowAR] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoin, setEditingCoin] = useState<CoinResponse | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<CoinResponse | null>(null);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [formData, setFormData] = useState<CoinCreate>({
    name: '',
    symbol: '',
    description: '',
    ar_model_url: '',
    ar_scale: 1.0,
    ar_position_x: 0,
    ar_position_y: 0,
    ar_position_z: -2
  });

  const toggleKioskMode = () => {
    setIsKioskMode(!isKioskMode);
  };

  // Load coins with error handling
  const loadCoins = useCallback(async (page: number = 1, search?: string, isActive?: boolean | null) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getCoins(page, 10, isActive ?? undefined, search);
      if (response.success && response.data) {
        setCoins(response.data.coins);
        setTotalPages(response.data.pages);
        setCurrentPage(page);
      } else {
        setError(response.error?.detail || 'Failed to load coins');
      }
    } catch (err) {
      setError('Failed to load coins');
      console.error('Error loading coins:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCoins();
  }, [loadCoins]);

  // Search handler with debouncing
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const response = await searchCoins(query, 1, 10);
      if (response.success && response.data) {
        setCoins(response.data.coins);
        setTotalPages(response.data.pages);
        setCurrentPage(1);
      }
    } else {
      loadCoins(1);
    }
  }, [loadCoins]);

  // Filter handler
  const handleFilter = useCallback(async (isActive: boolean | null) => {
    setFilterActive(isActive);
    loadCoins(1, searchQuery, isActive);
  }, [loadCoins, searchQuery]);

  // Create coin handler
  const handleCreateCoin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createCoin(formData);
      if (response.success) {
        setShowCreateForm(false);
        resetForm();
        loadCoins(currentPage, searchQuery, filterActive);
      } else {
        setError(response.error?.detail || 'Failed to create coin');
      }
    } catch (err) {
      setError('Failed to create coin');
      console.error('Error creating coin:', err);
    }
  }, [formData, currentPage, searchQuery, filterActive, loadCoins]);

  // Update coin handler
  const handleUpdateCoin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoin) return;
    
    try {
      const updateData: CoinUpdate = {
        name: formData.name,
        symbol: formData.symbol,
        description: formData.description,
        ar_model_url: formData.ar_model_url,
        ar_scale: formData.ar_scale,
        ar_position_x: formData.ar_position_x,
        ar_position_y: formData.ar_position_y,
        ar_position_z: formData.ar_position_z
      };
      
      const response = await updateCoin(editingCoin.id, updateData);
      if (response.success) {
        setEditingCoin(null);
        resetForm();
        loadCoins(currentPage, searchQuery, filterActive);
      } else {
        setError(response.error?.detail || 'Failed to update coin');
      }
    } catch (err) {
      setError('Failed to update coin');
      console.error('Error updating coin:', err);
    }
  }, [editingCoin, formData, currentPage, searchQuery, filterActive, loadCoins]);

  // Delete coin handler
  const handleDeleteCoin = useCallback(async (coinId: number) => {
    if (!window.confirm('Are you sure you want to delete this coin?')) return;
    
    try {
      const response = await deleteCoin(coinId);
      if (response.success) {
        loadCoins(currentPage, searchQuery, filterActive);
      } else {
        setError(response.error?.detail || 'Failed to delete coin');
      }
    } catch (err) {
      setError('Failed to delete coin');
      console.error('Error deleting coin:', err);
    }
  }, [currentPage, searchQuery, filterActive, loadCoins]);

  // Start editing
  const startEditing = useCallback((coin: CoinResponse) => {
    setEditingCoin(coin);
    setFormData({
      name: coin.name,
      symbol: coin.symbol,
      description: coin.description || '',
      ar_model_url: coin.ar_model_url || '',
      ar_scale: coin.ar_scale || 1.0,
      ar_position_x: coin.ar_position_x || 0,
      ar_position_y: coin.ar_position_y || 0,
      ar_position_z: coin.ar_position_z || -2
    });
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      symbol: '',
      description: '',
      ar_model_url: '',
      ar_scale: 1.0,
      ar_position_x: 0,
      ar_position_y: 0,
      ar_position_z: -2
    });
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingCoin(null);
    setShowCreateForm(false);
    resetForm();
  }, [resetForm]);


  // Close coin details
  const closeCoinDetails = useCallback(() => {
    setSelectedCoin(null);
  }, []);

  if (showAR) {
    return (
      <div className="min-h-screen">
        <SimpleAR onBack={() => setShowAR(false)} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${isKioskMode ? 'text-2xl' : ''}`}>
      <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8">
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

        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className={`font-bold text-gray-900 mb-4 ${
            isKioskMode 
              ? 'text-6xl sm:text-8xl' 
              : 'text-3xl sm:text-4xl lg:text-5xl'
          }`}>
            🥽 AR Coin System
          </h1>
          <p className={`text-gray-600 max-w-2xl mx-auto ${
            isKioskMode 
              ? 'text-2xl sm:text-3xl' 
              : 'text-lg sm:text-xl'
          }`}>
            Create, manage, and experience cryptocurrency coins in augmented reality
          </p>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 ${
          isKioskMode ? 'gap-8' : 'gap-4 sm:gap-6'
        }`}>
          <div className={`bg-white rounded-xl shadow-lg text-center ${
            isKioskMode ? 'p-8 sm:p-10' : 'p-4 sm:p-6'
          }`}>
            <div className={`font-bold text-yellow-500 mb-2 ${
              isKioskMode ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl'
            }`}>
              {coins.filter(coin => coin.is_active).length}
            </div>
            <div className={`text-gray-600 ${
              isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
            }`}>Active Coins</div>
          </div>
          <div className={`bg-white rounded-xl shadow-lg text-center ${
            isKioskMode ? 'p-8 sm:p-10' : 'p-4 sm:p-6'
          }`}>
            <div className={`font-bold text-blue-500 mb-2 ${
              isKioskMode ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl'
            }`}>
              {coins.filter(coin => coin.ar_model_url).length}
            </div>
            <div className={`text-gray-600 ${
              isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
            }`}>AR Ready</div>
          </div>
          <div className={`bg-white rounded-xl shadow-lg text-center ${
            isKioskMode ? 'p-8 sm:p-10' : 'p-4 sm:p-6'
          }`}>
            <div className={`font-bold text-green-500 mb-2 ${
              isKioskMode ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl'
            }`}>
              {coins.length}
            </div>
            <div className={`text-gray-600 ${
              isKioskMode ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base'
            }`}>Total Coins</div>
          </div>
        </div>

        {/* Controls */}
        <div className={`bg-white rounded-xl shadow-lg mb-4 sm:mb-6 ${
          isKioskMode ? 'p-6 sm:p-8' : 'p-4 sm:p-6'
        }`}>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search coins..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-full sm:w-64"
                />
                <div className="absolute left-3 top-3.5 text-gray-400">
                  🔍
                </div>
              </div>

              {/* Filter */}
              <select
                value={filterActive === null ? 'all' : filterActive.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilter(value === 'all' ? null : value === 'true');
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Coins</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                + Add Coin
              </button>
              <button
                onClick={() => setShowAR(true)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all font-semibold shadow-lg"
              >
                🥽 Launch AR
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 font-bold text-xl"
            >
              ×
            </button>
          </div>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingCoin) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-6">
              {editingCoin ? 'Edit Coin' : 'Create New Coin'}
            </h2>
            <form onSubmit={editingCoin ? handleUpdateCoin : handleCreateCoin} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AR Model URL</label>
                  <input
                    type="url"
                    value={formData.ar_model_url}
                    onChange={(e) => setFormData({...formData, ar_model_url: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="https://example.com/model.glb"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AR Scale</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={formData.ar_scale}
                    onChange={(e) => setFormData({...formData, ar_scale: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">X Position</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ar_position_x}
                    onChange={(e) => setFormData({...formData, ar_position_x: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Y Position</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ar_position_y}
                    onChange={(e) => setFormData({...formData, ar_position_y: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Z Position</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ar_position_z}
                    onChange={(e) => setFormData({...formData, ar_position_z: parseFloat(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
                >
                  {editingCoin ? 'Update Coin' : 'Create Coin'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coins List */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold">Coins ({coins.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading coins...</p>
            </div>
          ) : coins.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-8xl mb-6">🪙</div>
              <h3 className="text-2xl font-semibold mb-2">No coins found</h3>
              <p className="text-lg">Create your first coin to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {coins.map((coin) => (
                <div key={coin.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">{coin.symbol}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{coin.name}</h3>
                        <p className="text-gray-600">{coin.description || 'No description'}</p>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                            coin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {coin.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {coin.ar_model_url && (
                            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full font-medium">
                              AR Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(coin)}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCoin(coin.id)}
                        className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {coin.ar_model_url && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">AR Scale:</span>
                          <span className="ml-2 text-gray-600">{coin.ar_scale}x</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Position:</span>
                          <span className="ml-2 text-gray-600">
                            ({coin.ar_position_x}, {coin.ar_position_y}, {coin.ar_position_z})
                          </span>
                        </div>
                        <div className="md:col-span-2">
                          <a
                            href={coin.ar_model_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            View 3D Model →
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadCoins(currentPage - 1, searchQuery, filterActive)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadCoins(currentPage + 1, searchQuery, filterActive)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coin Details Modal */}
      {selectedCoin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">{selectedCoin.name}</h3>
              <button
                onClick={closeCoinDetails}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">{selectedCoin.symbol}</span>
                </div>
                <p className="text-gray-600">{selectedCoin.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    selectedCoin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedCoin.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">AR Scale:</span>
                  <span className="ml-2">{selectedCoin.ar_scale}x</span>
                </div>
              </div>
              <button
                onClick={closeCoinDetails}
                className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARPage;