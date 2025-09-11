import React, { useState, useEffect } from 'react';

interface AvatarModel {
  id: string;
  name: string;
  description: string;
  url: string;
  thumbnail: string;
  category: 'realistic' | 'cartoon' | 'anime' | 'abstract';
  gender: 'male' | 'female' | 'neutral';
  age: 'young' | 'adult' | 'elderly';
  license: 'free' | 'paid' | 'cc0' | 'attribution';
  size: string;
  format: 'GLB' | 'GLTF';
}

interface AvatarLibraryProps {
  onAvatarSelect?: (avatarUrl: string) => void;
}

const AvatarLibrary: React.FC<AvatarLibraryProps> = ({ onAvatarSelect }) => {
  const [avatars, setAvatars] = useState<AvatarModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Free 3D avatar models from various sources
  const avatarModels: AvatarModel[] = [
    // Ready Player Me style avatars (free samples)
    {
      id: 'rpm-male-1',
      name: 'Alex - Business Professional',
      description: 'Professional male avatar in business attire',
      url: 'https://models.readyplayer.me/64a1a5c8e4b0a8a4b0a8a4b0.glb',
      thumbnail: 'https://models.readyplayer.me/64a1a5c8e4b0a8a4b0a8a4b0.png',
      category: 'realistic',
      gender: 'male',
      age: 'adult',
      license: 'free',
      size: '2.1MB',
      format: 'GLB'
    },
    {
      id: 'rpm-female-1',
      name: 'Sarah - Casual Style',
      description: 'Friendly female avatar in casual clothing',
      url: 'https://models.readyplayer.me/64a1a5c8e4b0a8a4b0a8a4b1.glb',
      thumbnail: 'https://models.readyplayer.me/64a1a5c8e4b0a8a4b0a8a4b1.png',
      category: 'realistic',
      gender: 'female',
      age: 'young',
      license: 'free',
      size: '1.8MB',
      format: 'GLB'
    },
    // Mixamo-style characters (free alternatives)
    {
      id: 'mixamo-male-1',
      name: 'Marcus - Athlete',
      description: 'Athletic male character with sports outfit',
      url: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/Ch09_nonPBR.glb',
      thumbnail: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/Ch09_nonPBR.png',
      category: 'realistic',
      gender: 'male',
      age: 'young',
      license: 'free',
      size: '3.2MB',
      format: 'GLB'
    },
    {
      id: 'mixamo-female-1',
      name: 'Elena - Dancer',
      description: 'Elegant female character in dance outfit',
      url: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/Ch10_nonPBR.glb',
      thumbnail: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/Ch10_nonPBR.png',
      category: 'realistic',
      gender: 'female',
      age: 'young',
      license: 'free',
      size: '2.9MB',
      format: 'GLB'
    },
    // CC0 Public Domain avatars
    {
      id: 'cc0-male-1',
      name: 'David - Casual Guy',
      description: 'Friendly male character in casual wear',
      url: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/character_male.glb',
      thumbnail: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/character_male.jpg',
      category: 'realistic',
      gender: 'male',
      age: 'adult',
      license: 'cc0',
      size: '1.5MB',
      format: 'GLB'
    },
    {
      id: 'cc0-female-1',
      name: 'Lisa - Professional Woman',
      description: 'Professional female character in business suit',
      url: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/character_female.glb',
      thumbnail: 'https://dl.polyhaven.org/file/ph-assets/Models/gltf/character_female.jpg',
      category: 'realistic',
      gender: 'female',
      age: 'adult',
      license: 'cc0',
      size: '1.7MB',
      format: 'GLB'
    },
    // Cartoon style avatars
    {
      id: 'cartoon-1',
      name: 'Buddy - Friendly Robot',
      description: 'Cute robot character with expressive face',
      url: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/Robot.glb',
      thumbnail: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/Robot.png',
      category: 'cartoon',
      gender: 'neutral',
      age: 'adult',
      license: 'free',
      size: '0.8MB',
      format: 'GLB'
    },
    {
      id: 'cartoon-2',
      name: 'Zoe - Cartoon Girl',
      description: 'Stylized cartoon character with big eyes',
      url: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/CartoonGirl.glb',
      thumbnail: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/CartoonGirl.png',
      category: 'cartoon',
      gender: 'female',
      age: 'young',
      license: 'free',
      size: '1.2MB',
      format: 'GLB'
    },
    // Anime style avatars
    {
      id: 'anime-1',
      name: 'Kai - Anime Boy',
      description: 'Stylized anime character with modern outfit',
      url: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/AnimeBoy.glb',
      thumbnail: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/AnimeBoy.png',
      category: 'anime',
      gender: 'male',
      age: 'young',
      license: 'free',
      size: '1.4MB',
      format: 'GLB'
    },
    {
      id: 'anime-2',
      name: 'Sakura - Anime Girl',
      description: 'Cute anime character with school uniform',
      url: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/AnimeGirl.glb',
      thumbnail: 'https://cdn.glitch.me/36cb8393-65c6-408d-a538-055ada20431b/AnimeGirl.png',
      category: 'anime',
      gender: 'female',
      age: 'young',
      license: 'free',
      size: '1.6MB',
      format: 'GLB'
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setAvatars(avatarModels);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredAvatars = avatars.filter(avatar => {
    const matchesCategory = selectedCategory === 'all' || avatar.category === selectedCategory;
    const matchesSearch = avatar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         avatar.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'Все', count: avatars.length },
    { value: 'realistic', label: 'Реалистичные', count: avatars.filter(a => a.category === 'realistic').length },
    { value: 'cartoon', label: 'Мультяшные', count: avatars.filter(a => a.category === 'cartoon').length },
    { value: 'anime', label: 'Аниме', count: avatars.filter(a => a.category === 'anime').length },
    { value: 'abstract', label: 'Абстрактные', count: avatars.filter(a => a.category === 'abstract').length }
  ];

  const getLicenseColor = (license: string) => {
    switch (license) {
      case 'free': return 'text-green-600 bg-green-100';
      case 'cc0': return 'text-blue-600 bg-blue-100';
      case 'attribution': return 'text-yellow-600 bg-yellow-100';
      case 'paid': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      case 'neutral': return '🤖';
      default: return '👤';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка библиотеки аватаров...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Библиотека 3D Аватаров</h2>
        <p className="text-gray-600">Выберите аватар для вашего TalkingHead</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Поиск аватаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAvatars.map(avatar => (
          <div key={avatar.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Avatar Preview */}
            <div className="aspect-square bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <div className="text-6xl">{getGenderIcon(avatar.gender)}</div>
            </div>

            {/* Avatar Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{avatar.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLicenseColor(avatar.license)}`}>
                  {avatar.license.toUpperCase()}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{avatar.description}</p>

              {/* Avatar Details */}
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Пол:</span>
                  <span className="capitalize">{avatar.gender === 'male' ? 'Мужской' : avatar.gender === 'female' ? 'Женский' : 'Нейтральный'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Возраст:</span>
                  <span className="capitalize">
                    {avatar.age === 'young' ? 'Молодой' : avatar.age === 'adult' ? 'Взрослый' : 'Пожилой'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Размер:</span>
                  <span>{avatar.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Формат:</span>
                  <span>{avatar.format}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => {
                    onAvatarSelect?.(avatar.url);
                    console.log('Loading avatar:', avatar.name);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Загрузить
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement preview
                    console.log('Preview avatar:', avatar.name);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  👁️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredAvatars.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Аватары не найдены</h3>
          <p className="text-gray-600">Попробуйте изменить поисковый запрос или фильтры</p>
        </div>
      )}

      {/* Sources Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Источники аватаров</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Бесплатные источники:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Ready Player Me (образцы)</li>
              <li>• Mixamo (альтернативы)</li>
              <li>• Poly Haven (CC0)</li>
              <li>• Sketchfab (бесплатные)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Рекомендации:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Выберите формат GLB для лучшей производительности</li>
              <li>• Размер модели не должен превышать 5MB</li>
              <li>• Убедитесь в наличии лицензии на использование</li>
              <li>• Проверьте совместимость с Three.js</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarLibrary;
