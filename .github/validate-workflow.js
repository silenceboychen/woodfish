#!/usr/bin/env node

/**
 * GitHub Actions Workflow 验证脚本
 * 用于在推送前验证 workflow 配置的正确性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 GitHub Actions 配置...\n');

// 检查必要的文件
const requiredFiles = [
  '.github/workflows/build.yml',
  '.github/workflows/test-build.yml',
  'package.json'
];

console.log('📋 检查必要文件:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    process.exit(1);
  }
});

// 检查 package.json 配置
console.log('\n📦 检查 package.json 配置:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 检查必要的脚本
const requiredScripts = ['start', 'build', 'pack', 'dist'];
requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`✅ scripts.${script}: ${packageJson.scripts[script]}`);
  } else {
    console.log(`❌ scripts.${script} - 脚本缺失`);
  }
});

// 检查构建配置
if (packageJson.build) {
  console.log('✅ build 配置存在');
  
  // 检查平台配置
  const platforms = ['mac', 'win', 'linux'];
  platforms.forEach(platform => {
    if (packageJson.build[platform]) {
      console.log(`✅ build.${platform} 配置存在`);
    } else {
      console.log(`⚠️  build.${platform} 配置缺失`);
    }
  });
} else {
  console.log('❌ build 配置缺失');
}

// 检查版本号格式
if (packageJson.version) {
  const version = packageJson.version;
  const versionRegex = /^\d+\.\d+\.\d+$/;
  if (versionRegex.test(version)) {
    console.log(`✅ version: ${version} (格式正确)`);
  } else {
    console.log(`⚠️  version: ${version} (建议使用语义化版本格式，如 1.0.0)`);
  }
} else {
  console.log('❌ version 字段缺失');
}

// 检查必要的开发依赖
console.log('\n🔧 检查开发依赖:');
const requiredDevDeps = ['electron', 'electron-builder'];
requiredDevDeps.forEach(dep => {
  if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - 开发依赖缺失`);
  }
});

// 提供使用建议
console.log('\n🚀 使用建议:');
console.log('1. 测试本地构建:');
console.log('   npm run pack    # 快速打包测试');
console.log('   npm run dist    # 完整构建');
console.log('');
console.log('2. 触发自动构建:');
console.log('   npm version patch && git push origin --tags');
console.log('');
console.log('3. 手动测试构建:');
console.log('   在 GitHub Actions 页面运行 "Test Build" workflow');

console.log('\n✅ 配置验证完成！'); 