#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Тестирование AR функциональности...\n');

// Проверяем наличие необходимых файлов
const requiredFiles = [
  'components/ar/SimpleARScreen.tsx',
  'components/ar/ViroARScreen.tsx',
  'app/ar-test.tsx',
  'AR_README.md'
];

console.log('📁 Проверка файлов:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - НЕ НАЙДЕН`);
    allFilesExist = false;
  }
});

console.log('\n📦 Проверка зависимостей:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  
  const requiredDeps = [
    'expo-camera',
    'expo-location',
    '@reactvision/react-viro'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - НЕ УСТАНОВЛЕН`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Ошибка чтения package.json');
  allFilesExist = false;
}

console.log('\n🔧 Проверка конфигурации:');
try {
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
  
  if (appJson.expo && appJson.expo.plugins) {
    const hasCameraPlugin = appJson.expo.plugins.some(plugin => 
      typeof plugin === 'string' ? plugin === 'expo-camera' : plugin[0] === 'expo-camera'
    );
    
    if (hasCameraPlugin) {
      console.log('✅ expo-camera плагин настроен');
    } else {
      console.log('⚠️  expo-camera плагин не найден в app.json');
    }
  } else {
    console.log('⚠️  Плагины не настроены в app.json');
  }
} catch (error) {
  console.log('❌ Ошибка чтения app.json');
}

console.log('\n📱 Инструкции для тестирования:');
console.log('1. Запустите приложение: npm start');
console.log('2. Откройте приложение на устройстве или эмуляторе');
console.log('3. На главном экране найдите кнопку "AR Опыт" или "AR Тест"');
console.log('4. Нажмите на кнопку для перехода к AR экрану');
console.log('5. Разрешите доступ к камере и геолокации');
console.log('6. Нажмите "Начать игру" для старта AR опыта');
console.log('7. Нажимайте на AR объекты для сбора очков');

console.log('\n🚀 Быстрый запуск:');
console.log('cd frontend && npm start');

if (allFilesExist) {
  console.log('\n🎉 Все проверки пройдены! AR функциональность готова к использованию.');
} else {
  console.log('\n⚠️  Обнаружены проблемы. Проверьте отсутствующие файлы и зависимости.');
  process.exit(1);
}
