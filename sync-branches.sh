#!/bin/bash

# Exit if any command fails
set -e

# Ensure we are on develop before starting
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ]; then
    echo "Error: You must be on the 'develop' branch to run this script."
    exit 1
fi

echo "========================================="
echo "1. Ensuring all changes in develop are pushed..."
echo "========================================="
git push origin develop

echo ""
echo "========================================="
echo "2. Switching to production and merging develop..."
echo "========================================="

# Create production branch if it doesn't exist, otherwise checkout
git checkout production 2>/dev/null || git checkout -b production

# Merge develop into production
git merge develop --no-edit

echo ""
echo "========================================="
echo "3. Pushing production to GitHub..."
echo "========================================="
git push origin production

echo ""
echo "========================================="
echo "4. Cleaning up..."
echo "========================================="
# Switch back to develop
git checkout develop

echo "✅ Successfully merged develop into production and pushed!"
echo "🚀 The GitHub Action will now automatically update all your tenant branches in the background."

