import React, { useState, useEffect } from 'react';
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
import AR from '../components/AR';

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
  const [formData, setFormData] = useState<CoinCreate>({
    name: '',
    symbol: '',
    description: '',
    ar_model_url: '',
    ar_scale: 1.0,
    ar_position_x: 0,
    ar_position_y: 0,
    ar_position_z: -5
  });

  // Load coins
  const loadCoins = async (page: number = 1, search?: string, isActive?: boolean | null) => {
    try {
      setLoading(true);
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
  };

  // Initial load
  useEffect(() => {
    loadCoins();
  }, []);

  // Handle search
  const handleSearch = async (query: string) => {
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
  };

  // Handle filter
  const handleFilter = async (isActive: boolean | null) => {
    setFilterActive(isActive);
    loadCoins(1, searchQuery, isActive);
  };

  // Handle create coin
  const handleCreateCoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await createCoin(formData);
      if (response.success) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          symbol: '',
          description: '',
          ar_model_url: '',
          ar_scale: 1.0,
          ar_position_x: 0,
          ar_position_y: 0,
          ar_position_z: -5
        });
        loadCoins(currentPage, searchQuery, filterActive);
      } else {
        setError(response.error?.detail || 'Failed to create coin');
      }
    } catch (err) {
      setError('Failed to create coin');
      console.error('Error creating coin:', err);
    }
  };

  // Handle update coin
  const handleUpdateCoin = async (e: React.FormEvent) => {
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
        setFormData({
          name: '',
          symbol: '',
          description: '',
          ar_model_url: '',
          ar_scale: 1.0,
          ar_position_x: 0,
          ar_position_y: 0,
          ar_position_z: -5
        });
        loadCoins(currentPage, searchQuery, filterActive);
      } else {
        setError(response.error?.detail || 'Failed to update coin');
      }
    } catch (err) {
      setError('Failed to update coin');
      console.error('Error updating coin:', err);
    }
  };

  // Handle delete coin
  const handleDeleteCoin = async (coinId: number) => {
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
  };

  // Start editing
  const startEditing = (coin: CoinResponse) => {
    setEditingCoin(coin);
    setFormData({
      name: coin.name,
      symbol: coin.symbol,
      description: coin.description || '',
      ar_model_url: coin.ar_model_url || '',
      ar_scale: coin.ar_scale || 1.0,
      ar_position_x: coin.ar_position_x || 0,
      ar_position_y: coin.ar_position_y || 0,
      ar_position_z: coin.ar_position_z || -5
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCoin(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      symbol: '',
      description: '',
      ar_model_url: '',
      ar_scale: 1.0,
      ar_position_x: 0,
      ar_position_y: 0,
      ar_position_z: -5
    });
  };

  if (showAR) {
    return (
      <div className="min-h-screen">
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowAR(false)}
            className="px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-all"
          >
            ← Back to Management
          </button>
        </div>
        <AR />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AR Coin System</h1>
          <p className="text-gray-600">Manage and experience coins in augmented reality</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search coins..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="all">All Coins</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                + Add Coin
              </button>
              <button
                onClick={() => setShowAR(true)}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                🥽 Launch AR
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingCoin) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingCoin ? 'Edit Coin' : 'Create New Coin'}
            </h2>
            <form onSubmit={editingCoin ? handleUpdateCoin : handleCreateCoin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AR Model URL</label>
                  <input
                    type="url"
                    value={formData.ar_model_url}
                    onChange={(e) => setFormData({...formData, ar_model_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AR Scale</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={formData.ar_scale}
                    onChange={(e) => setFormData({...formData, ar_scale: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ar_position_x}
                    onChange={(e) => setFormData({...formData, ar_position_x: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ar_position_y}
                    onChange={(e) => setFormData({...formData, ar_position_y: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Z Position</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ar_position_z}
                    onChange={(e) => setFormData({...formData, ar_position_z: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  {editingCoin ? 'Update Coin' : 'Create Coin'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Coins List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Coins ({coins.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading coins...</p>
            </div>
          ) : coins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">🪙</div>
              <p>No coins found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {coins.map((coin) => (
                <div key={coin.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{coin.symbol}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{coin.name}</h3>
                        <p className="text-sm text-gray-600">{coin.description || 'No description'}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            coin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {coin.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {coin.ar_model_url && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              AR Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => startEditing(coin)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCoin(coin.id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {coin.ar_model_url && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p><strong>AR Scale:</strong> {coin.ar_scale}x</p>
                      <p><strong>Position:</strong> ({coin.ar_position_x}, {coin.ar_position_y}, {coin.ar_position_z})</p>
                      <a
                        href={coin.ar_model_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        View 3D Model →
                      </a>
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
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadCoins(currentPage + 1, searchQuery, filterActive)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ARPage;
