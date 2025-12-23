#!/bin/bash

# Configuration
TAP_DIR="$HOME/homebrew-tap"
FORMULA_FILE="$TAP_DIR/Formula/claude-code-router-config.rb"
REPO_URL="https://github.com/halilertekin/CC-RouterMultiProvider"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting release process...${NC}"

# 1. Get current version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}📦 Current version: v$VERSION${NC}"

# 2. Push to GitHub
echo -e "${BLUE}⬆️  Pushing to GitHub...${NC}"
git push origin main
git push origin v$VERSION || {
    echo -e "${BLUE}ℹ️  Tag v$VERSION does not exist on remote. Creating and pushing...${NC}"
    git tag v$VERSION
    git push origin v$VERSION
}

# 3. Calculate SHA256
TARBALL_URL="$REPO_URL/archive/refs/tags/v$VERSION.tar.gz"
echo -e "${BLUE}📥 Downloading tarball to calculate SHA256...${NC}"
echo "URL: $TARBALL_URL"

# Download with curl and calculate sha256 (macOS compatible)
SHA256=$(curl -sL "$TARBALL_URL" | shasum -a 256 | awk '{print $1}')

if [ -z "$SHA256" ]; then
    echo -e "${RED}❌ Failed to calculate SHA256${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SHA256: $SHA256${NC}"

# 4. Update Homebrew Formula
echo -e "${BLUE}🍺 Updating Homebrew formula...${NC}"

# Update URL
sed -i '' "s|url ".*"|url \"$TARBALL_URL\"|" "$FORMULA_FILE"

# Update SHA256
sed -i '' "s|sha256 ".*"|sha256 \"$SHA256\"|" "$FORMULA_FILE"

# Show diff
echo -e "${BLUE}📝 Formula changes:${NC}"
cd "$TAP_DIR"
git diff Formula/claude-code-router-config.rb

# 5. Commit and Push Homebrew Tap
read -p "Commit and push Homebrew tap changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$TAP_DIR"
    git add Formula/claude-code-router-config.rb
    git commit -m "update: claude-code-router-config v$VERSION"
    git push origin main
    echo -e "${GREEN}✅ Homebrew tap updated!${NC}"
else
    echo -e "${BLUE}ℹ️  Skipping Homebrew update${NC}"
fi

# 6. Publish to NPM
read -p "Publish to NPM? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd - > /dev/null
    npm publish --access public
    echo -e "${GREEN}✅ Published to NPM!${NC}"
fi

echo -e "${GREEN}🎉 Release v$VERSION complete!${NC}"
