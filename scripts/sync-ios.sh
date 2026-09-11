#!/bin/bash
# Re-copies the web app into www/ and syncs it into the native iOS project.
# Run this after editing index.html, styles.css, app.js, manifest.json, or any icon.
set -euo pipefail
cd "$(dirname "$0")/.."

cp index.html styles.css app.js manifest.json \
   icon-180.png icon-192.png icon-512.png icon-32.png apple-touch-icon.png \
   www/

npx cap copy ios
echo "Synced. Reopen/rebuild ios/App/App.xcodeproj in Xcode to see the changes."
