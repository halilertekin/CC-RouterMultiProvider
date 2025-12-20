# Claude Code Router Config - Publishing Guide

## Attribution

This package provides configuration for @musistudio/claude-code-router.
Original project: https://github.com/musistudio/claude-code-router

## NPM Publishing

### 1. Update package.json
```bash
# Already updated with:
# - username: halilertekin
# - email: halil@ertekin.me
# - attribution to @musistudio/claude-code-router
```

### 2. Build and Test
```bash
# Test package locally
npm pack
npm test  # if tests exist
```

### 3. Publish to NPM
```bash
# Login to npm
npm login

# Publish
npm publish

# Or for public release
npm publish --access public
```

## Homebrew Publishing

### 1. Create Release Tag
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Get SHA256
```bash
# On macOS/Linux
sha256sum claude-code-router-config-1.0.0.tar.gz
# On Mac
shasum -a 256 claude-code-router-config-1.0.0.tar.gz

# Update the SHA256_PLACEHOLDER in the formula
```

### 3. Fork Homebrew Core
```bash
# Fork https://github.com/Homebrew/homebrew-core

# Clone your fork
git clone https://github.com/halilertekin/homebrew-core.git
cd homebrew-core

# Create branch
git checkout -b claude-code-router-config

# Copy formula
cp /Users/halil/code/homebrew-formula/claude-code-router-config.rb Formula/

# Test formula
brew install --build-from-source Formula/claude-code-router-config.rb

# Test removal
brew uninstall claude-code-router-config
```

### 4. Submit PR to Homebrew
```bash
git add Formula/claude-code-router-config.rb
git commit -m "claude-code-router-config 1.0.0"

# Push to your fork
git push origin claude-code-router-config

# Create PR at https://github.com/Homebrew/homebrew-core
```

## Alternative: Custom Tap

Instead of homebrew-core, you can create your own tap:

### 1. Create Tap Repository
```bash
# Create GitHub repo: homebrew-tap
git clone https://github.com/halilertekin/homebrew-tap.git
cd homebrew-tap
```

### 2. Add Formula
```bash
mkdir -p Formula
cp /Users/halil/code/homebrew-formula/claude-code-router-config.rb Formula/
```

### 3. Push and Use
```brew
git add Formula/claude-code-router-config.rb
git commit -m "Add claude-code-router-config"
git push origin main

# Users can install with:
brew tap halilertekin/homebrew-tap
brew install claude-code-router-config
```

## After Publishing

### Update README
Add installation instructions:

```markdown
## Installation

### Option 1: NPM
```bash
npm install -g claude-code-router-config
ccr-setup
```

### Option 2: Homebrew
```bash
brew install claude-code-router-config
```

### Option 3: Manual
```bash
git clone https://github.com/halilertekin/claude-code-router-config.git
cd claude-code-router-config
./install.sh
```
```

### GitHub Release
1. Go to Releases page
2. Create new release
3. Tag: v1.0.0
4. Release notes
5. Attach source code (auto-generated)

## Verification

After publishing, test:

```bash
# NPM
npm install -g claude-code-router-config
ccr-setup

# Homebrew
brew install claude-code-router-config

# Verify installation
ccr status
```