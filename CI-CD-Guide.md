# 🚀 木鱼应用 CI/CD 自动化构建指南

本指南详细说明如何使用已配置的 GitHub Actions 来自动化构建和发布木鱼应用。

## 📋 概览

我们配置了完整的 CI/CD 流水线，支持：
- ✅ macOS、Windows、Linux 三平台自动构建
- ✅ 自动创建 GitHub Release
- ✅ 代码质量检查 (ESLint)
- ✅ 测试构建支持
- ✅ 手动触发构建

## 🎯 快速开始

### 1. 发布新版本（推荐流程）

```bash
# 1. 验证当前配置
npm run validate-ci

# 2. 代码质量检查
npm run lint

# 3. 本地测试构建
npm run pack

# 4. 更新版本并发布
npm version patch  # 修复版本 (1.0.5 -> 1.0.6)
# 或者
npm version minor  # 功能版本 (1.0.5 -> 1.1.0)
# 或者  
npm version major  # 重大版本 (1.0.5 -> 2.0.0)

# 5. 推送 tag 触发自动构建
git push origin --tags
```

### 2. 手动测试构建

在 GitHub 网站上：
1. 进入你的仓库
2. 点击 "Actions" 标签
3. 选择 "Test Build" workflow
4. 点击 "Run workflow"
5. 选择要构建的平台（或选择 "all"）

## 📦 构建产物说明

每次发布会生成以下文件：

### macOS 平台
- `木鱼-1.0.x.dmg` - 标准 DMG 安装包
- `木鱼-1.0.x-mac.zip` - 压缩包版本

### Windows 平台  
- `木鱼 Setup 1.0.x.exe` - NSIS 安装程序
- `木鱼 1.0.x.exe` - 便携版本

### Linux 平台
- `木鱼-1.0.x.AppImage` - 通用 Linux 应用
- `木鱼_1.0.x_amd64.deb` - Ubuntu/Debian 包

## 🔧 配置文件说明

### GitHub Actions Workflows

#### `.github/workflows/build.yml` - 自动发布构建
- **触发条件**: 推送以 'v' 开头的 tag (如 v1.0.6)
- **功能**: 
  - 三平台并行构建
  - 自动创建 GitHub Release
  - 上传所有构建产物
  - 生成详细的发布说明

#### `.github/workflows/test-build.yml` - 测试构建
- **触发条件**: 
  - 手动触发（支持选择平台）
  - Pull Request 到 main/master 分支
- **功能**:
  - 代码质量检查
  - 快速打包测试
  - 上传测试产物（1天后自动清理）

### 验证脚本

#### `.github/validate-workflow.js`
- 验证 GitHub Actions 配置完整性
- 检查 package.json 必要字段
- 提供使用建议

使用方法：
```bash
npm run validate-ci
```

## ⚙️ 配置详解

### package.json 关键配置

```json
{
  "scripts": {
    "validate-ci": "node .github/validate-workflow.js",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  },
  "build": {
    "appId": "com.woodfish.app",
    "productName": "木鱼",
    "mac": {
      "target": ["dmg", "zip"]
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "linux": {
      "target": ["AppImage", "deb"]
    }
  }
}
```

### 环境变量说明

GitHub Actions 中使用的环境变量：
- `CI=true` - 标识 CI 环境
- `CSC_IDENTITY_AUTO_DISCOVERY=false` - 禁用 macOS 自动签名发现
- `GITHUB_TOKEN` - 自动提供，用于创建 Release

## 🔐 代码签名（可选）

### macOS 代码签名
如果你有 Apple Developer 账户：

1. 在 GitHub Secrets 中添加：
   - `CSC_LINK` - p12 证书文件的 base64 编码
   - `CSC_KEY_PASSWORD` - 证书密码

2. 移除 workflow 中的 `CSC_IDENTITY_AUTO_DISCOVERY: false`

### Windows 代码签名
如果你有 Windows 代码签名证书：

1. 在 GitHub Secrets 中添加证书信息
2. 修改 workflow 添加签名步骤

## 📊 监控和调试

### 查看构建状态
- 在仓库页面可以看到 Actions 状态徽章
- 点击 Actions 标签查看详细日志
- 每个步骤都有详细的输出信息

### 常见问题排查

#### 构建失败
1. **依赖问题**: 检查 package-lock.json 是否包含所有依赖
2. **权限问题**: 确保有 Actions 和 Releases 权限
3. **资源问题**: GitHub Actions 有时间和存储限制

#### 发布失败
1. **Tag 格式**: 确保 tag 以 'v' 开头（如 v1.0.6）
2. **重复发布**: 不能发布同名的 Release
3. **权限问题**: 需要仓库的 write 权限

#### 平台特定问题
- **Linux**: 系统依赖缺失，已在 workflow 中预装
- **Windows**: node-gyp 编译问题，通常自动解决
- **macOS**: Xcode 工具链问题，已配置环境

### 性能优化

1. **缓存依赖**: 使用 `cache: 'npm'` 加速 node_modules 安装
2. **并行构建**: 三个平台同时构建，节省时间
3. **选择性构建**: 测试时可以只构建单个平台

## 📈 最佳实践

### 版本管理
- 使用语义化版本 (Semantic Versioning)
- 主版本号：重大变更
- 次版本号：新功能
- 修订版本：bug 修复

### 发布流程
1. **开发** → 功能开发和 bug 修复
2. **测试** → 使用 Test Build 验证
3. **代码审查** → Pull Request 流程
4. **发布** → 创建 tag 触发自动构建
5. **验证** → 下载测试发布的产物

### 分支策略
- `main/master` - 主分支，用于发布
- `develop` - 开发分支
- `feature/*` - 功能分支
- `hotfix/*` - 紧急修复分支

## 🚨 注意事项

### 安全考虑
- 不要在代码中包含敏感信息
- 使用 GitHub Secrets 管理证书和密钥
- 定期检查依赖的安全漏洞

### 成本控制
- GitHub Actions 有免费额度限制
- 私有仓库的构建时间会消耗免费额度
- 考虑使用自托管 runner 降低成本

### 合规性
- 确保生成的应用符合各平台的分发要求
- macOS 应用最好通过公证
- Windows 应用考虑代码签名

## 🔄 持续改进

### 可能的优化方向
1. **添加自动化测试** - 单元测试、集成测试
2. **增强通知机制** - Slack、邮件通知
3. **支持预发布版本** - beta、alpha 版本
4. **添加性能监控** - 构建时间、产物大小跟踪
5. **多环境支持** - 开发、测试、生产环境

### 定期维护
- 更新 GitHub Actions 版本
- 检查依赖安全更新
- 优化构建速度
- 清理过期的 Artifacts

---

有任何问题或需要进一步优化，请查看 `.github/README.md` 或提交 Issue。 