# GitHub Actions 构建说明

本项目配置了两个 GitHub Actions workflow，用于自动化构建和测试木鱼应用。

## 📦 自动发布构建 (build.yml)

### 触发条件
当你创建并推送一个 tag 时，会自动触发跨平台构建和发布。

### 使用方法
```bash
# 1. 更新版本号（在 package.json 中）
npm version patch   # 小版本更新 (1.0.0 -> 1.0.1)
npm version minor   # 中版本更新 (1.0.0 -> 1.1.0)  
npm version major   # 大版本更新 (1.0.0 -> 2.0.0)

# 2. 推送 tag
git push origin --tags

# 或者手动创建 tag
git tag v1.0.6
git push origin v1.0.6
```

### 构建产物
每个平台会生成以下文件：

**macOS:**
- `.dmg` - 磁盘镜像安装包
- `.zip` - 压缩包版本

**Windows:**
- `.exe` - NSIS 安装程序
- `-portable.exe` - 便携版本

**Linux:**
- `.AppImage` - 通用 Linux 应用
- `.deb` - Debian/Ubuntu 包

### 自动发布
构建完成后会自动创建 GitHub Release，包含：
- 所有平台的构建产物
- 详细的发布说明
- 安装指导

## 🧪 测试构建 (test-build.yml)

### 触发条件
1. **手动触发**: 在 GitHub Actions 页面点击 "Run workflow"
2. **Pull Request**: 当 PR 涉及源码变更时自动运行

### 手动触发选项
- `all` - 在所有平台上构建（默认）
- `macos` - 仅在 macOS 上构建
- `windows` - 仅在 Windows 上构建  
- `linux` - 仅在 Linux 上构建

### 测试内容
- 代码检查 (ESLint)
- 依赖安装测试
- 打包测试（不生成分发文件，速度更快）
- 上传测试构建产物（保留1天）

## ⚠️ 注意事项

### macOS 签名
- 当前配置不包含代码签名
- 生成的 .dmg 文件是未签名的
- 如需签名，需要添加 Apple Developer 证书到 GitHub Secrets

### Windows 签名
- 当前配置不包含代码签名
- 生成的 .exe 文件可能触发 SmartScreen 警告
- 如需签名，需要添加 Windows 代码签名证书

### 构建时间
- 完整构建（3个平台）约需要 15-20 分钟
- 单平台测试构建约需要 5-8 分钟

### 存储限制
- 构建产物会占用 GitHub Actions 存储空间
- 正式发布的文件没有大小限制
- 测试构建产物会在1天后自动清理

## 🔧 故障排除

### 构建失败
1. 检查 package.json 中的版本号是否有效
2. 确保所有依赖都在 package-lock.json 中
3. 查看 Actions 日志了解具体错误信息

### 发布失败
1. 确保 tag 格式正确（以 'v' 开头，如 v1.0.0）
2. 检查是否有权限创建 Release
3. 确保没有同名的 Release 已存在

### 依赖问题
- Linux 构建失败通常是系统依赖缺失
- Windows 构建失败可能是 node-gyp 编译问题
- macOS 构建失败可能是 Xcode 工具链问题

## 📚 进一步配置

### 添加代码签名
如果你有开发者证书，可以参考以下步骤：

1. **macOS 签名**: 在 GitHub Secrets 中添加 `CSC_LINK` 和 `CSC_KEY_PASSWORD`
2. **Windows 签名**: 在 GitHub Secrets 中添加证书信息
3. **修改 workflow**: 移除 `CSC_IDENTITY_AUTO_DISCOVERY: false` 设置

### 自定义构建配置
- 修改 `package.json` 中的 `build` 配置
- 调整 workflow 中的平台特定设置
- 添加额外的构建步骤或测试

### 通知设置
可以添加 Slack、Discord 或邮件通知：
```yaml
- name: Notify on success
  if: success()
  # 添加通知逻辑
``` 