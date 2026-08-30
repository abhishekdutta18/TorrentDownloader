#!/bin/bash
set -e

echo "Building web client..."
npm install --legacy-peer-deps
npm run build
rm -rf cpp/public/*
rm -rf cpp/public/assets && cp -r dist/* cpp/public/

# Generate project
echo "Generating Xcode project..."
xcodegen generate

# Build the Xcode Project using xcodebuild
echo "Building OmniFlux Xcode Project..."
xcodebuild -project OmniFlux.xcodeproj -scheme OmniFlux build -configuration Release CONFIGURATION_BUILD_DIR="${PWD}/build"

echo "Fixing permissions..."
chmod -R u+w "${PWD}/build/OmniFlux.app"

echo "Clearing xattrs..."
xattr -cr "${PWD}/build/OmniFlux.app" || true

echo "Force re-signing..."
codesign -f -s - --deep "${PWD}/build/OmniFlux.app"

echo "Verifying signature..."
codesign -vvv --deep --strict "${PWD}/build/OmniFlux.app"

# Clean up old apps
rm -rf ~/Desktop/FluxTorrent.app
rm -rf ~/Desktop/OmniFlux.app

echo "Copying to Desktop..."
ditto "${PWD}/build/OmniFlux.app" ~/Desktop/OmniFlux.app

echo "Done! The app is available at ~/Desktop/OmniFlux.app"
