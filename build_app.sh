#!/bin/bash
set -e

echo "Building web client..."
npm install --legacy-peer-deps
npm run build
rm -rf cpp/public/*
cp -r dist/* cpp/public/

# Generate project
echo "Generating Xcode project..."
xcodegen generate

# Build the Xcode Project using xcodebuild
echo "Building FluxTorrent Xcode Project..."
xcodebuild -project FluxTorrent.xcodeproj -scheme FluxTorrent build -configuration Release CONFIGURATION_BUILD_DIR="${PWD}/build"

echo "Fixing permissions..."
chmod -R u+w "${PWD}/build/FluxTorrent.app"

echo "Clearing xattrs..."
xattr -cr "${PWD}/build/FluxTorrent.app" || true

echo "Force re-signing..."
codesign -f -s - --deep "${PWD}/build/FluxTorrent.app"

echo "Verifying signature..."
codesign -vvv --deep --strict "${PWD}/build/FluxTorrent.app"

# Clean up old app
rm -rf ~/Desktop/FluxTorrent.app
echo "Copying to Desktop..."
ditto "${PWD}/build/FluxTorrent.app" ~/Desktop/FluxTorrent.app

echo "Done! The app is available at ~/Desktop/FluxTorrent.app"
