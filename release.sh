#!/bin/bash

# Configuration
TAP_DIR="$HOME/homebrew-tap"
FORMULA_FILE="$TAP_DIR/Formula/claude-code-router-config.rb"
REPO_URL="https://github.com/halilertekin/CC-RouterMultiProvider"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting release process...${NC}"

# 1. Choose version bump type
echo -e "${YELLOW}Select version bump type:${NC}"
echo "1) patch (1.0.0 -> 1.0.1)"
echo "2) minor (1.0.0 -> 1.1.0)"
echo "3) major (1.0.0 -> 2.0.0)"
read -p "Enter choice [1-3]: " BUMP_CHOICE

case $BUMP_CHOICE in
    1) BUMP_TYPE="patch" ;;
    2) BUMP_TYPE="minor" ;;
    3) BUMP_TYPE="major" ;;
    *) echo -e "${RED}Invalid choice. Exiting.${NC}"; exit 1 ;;
esac

# 2. Check for uncommitted changes and commit if needed
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📝 Uncommitted changes detected. Committing...${NC}"
    git add .
    git commit -m "chore: prepare release for v$BUMP_TYPE"
fi

# 3. Bump version using npm
echo -e "${BLUE}🔢 Bumping $BUMP_TYPE version...${NC}"
npm version $BUMP_TYPE -m "chore: release v%s" || { echo -e "${RED}Failed to bump version.${NC}"; exit 1; }

# 3. Get new version
VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}📦 New version: v$VERSION${NC}"

# 4. Push to GitHub (this will trigger CI/CD)
echo -e "${BLUE}⬆️  Pushing to GitHub (Main and Tags)...${NC}"
git push origin main && git push origin v$VERSION || { echo -e "${RED}Failed to push to GitHub.${NC}"; exit 1; }

# 5. Calculate SHA256 for Homebrew
TARBALL_URL="$REPO_URL/archive/refs/tags/v$VERSION.tar.gz"
echo -e "${BLUE}📥 Downloading tarball to calculate SHA256 for Homebrew...${NC}"
SHA256=$(curl -sL "$TARBALL_URL" | shasum -a 256 | awk '{print $1}')

if [ -z "$SHA256" ]; then
    echo -e "${YELLOW}⚠️  Could not calculate SHA256 automatically (maybe tag is not yet available on GitHub).${NC}"
    echo -e "${YELLOW}You might need to update the Homebrew formula manually later.${NC}"
else
    echo -e "${GREEN}✅ SHA256: $SHA256${NC}"
    
    # 6. Update Homebrew Formula (if tap directory exists)
    if [ -d "$TAP_DIR" ] && [ -f "$FORMULA_FILE" ]; then
        echo -e "${BLUE}🍺 Updating Homebrew formula in $TAP_DIR...${NC}"
        
        # Update URL and SHA256
        sed -i '' "s|url \".*\"|url \"$TARBALL_URL\"|" "$FORMULA_FILE"
        sed -i '' "s|sha256 \".*\"|sha256 \"$SHA256\"|" "$FORMULA_FILE"
        
        # Commit and Push Tap
        cd "$TAP_DIR"
        git add Formula/claude-code-router-config.rb
        git commit -m "update: claude-code-router-config v$VERSION"
        git push origin main
        cd - > /dev/null
        echo -e "${GREEN}✅ Homebrew tap updated!${NC}"
    else
        echo -e "${YELLOW}ℹ️  Homebrew tap directory or formula not found at $TAP_DIR. Skipping formula update.${NC}"
    fi
fi

echo -e "${GREEN}🎉 Release v$VERSION complete!${NC}"
echo -e "${BLUE}GitHub Actions will now handle the NPM publication.${NC}"
