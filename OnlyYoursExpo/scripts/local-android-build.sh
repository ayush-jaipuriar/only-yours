#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Enforce Node 24+ because Expo SDK 54 / RN 0.81 expect modern Node.
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 24 ]; then
  echo "Error: Node 24+ is required. Current: $(node -v)"
  echo "Run: nvm use 24"
  exit 1
fi

# Prefer Java 17 for Android Gradle compatibility.
if [ -z "${JAVA_HOME:-}" ]; then
  export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
fi

# Set Android SDK env vars if they are missing.
if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
if [ -z "${ANDROID_SDK_ROOT:-}" ] && [ -n "${ANDROID_HOME:-}" ]; then
  export ANDROID_SDK_ROOT="$ANDROID_HOME"
fi

if [ -z "${ANDROID_HOME:-}" ] || [ ! -d "${ANDROID_HOME}" ]; then
  echo "Error: ANDROID_HOME is not configured correctly."
  echo "Expected SDK at: \$HOME/Library/Android/sdk"
  exit 1
fi

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

echo "Using Node: $(node -v)"
echo "Using npm: $(npm -v)"
echo "Using JAVA_HOME: $JAVA_HOME"
echo "Using ANDROID_HOME: $ANDROID_HOME"

# Generate native android project from app.json/plugins config.
# To force sync after native config changes (plugins/google-services), run:
# EXPO_FORCE_PREBUILD=1 npm run android:local-build
if [ "${EXPO_FORCE_PREBUILD:-0}" = "1" ]; then
  echo "EXPO_FORCE_PREBUILD=1 detected; regenerating android/ with expo prebuild --clean"
  CI=1 npx expo prebuild --platform android --clean --no-install
elif [ ! -d "$PROJECT_ROOT/android" ]; then
  CI=1 npx expo prebuild --platform android --no-install
else
  echo "android/ already exists; skipping expo prebuild (set EXPO_FORCE_PREBUILD=1 to resync native config)."
fi

# If Firebase config exists at project root, copy it into android app module.
if [ -f "$PROJECT_ROOT/google-services.json" ]; then
  mkdir -p "$PROJECT_ROOT/android/app"
  cp "$PROJECT_ROOT/google-services.json" "$PROJECT_ROOT/android/app/google-services.json"
  echo "Firebase config copied to android/app/google-services.json"
else
  echo "Warning: google-services.json not found in project root."
  echo "Push notifications will not work on Android dev client until this file is added."
fi

# Compile local debug APK (device/emulator install can be done separately).
cd android
./gradlew assembleDebug

echo "Local Android build complete."
echo "APK path: $PROJECT_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
