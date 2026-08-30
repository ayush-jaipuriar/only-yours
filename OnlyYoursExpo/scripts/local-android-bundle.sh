#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Load nvm in non-interactive shells (npm scripts) and force Node 24 onto PATH.
NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  unset npm_config_prefix
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use 24 >/dev/null 2>&1 || true
  if [ -n "${NVM_BIN:-}" ] && [ -x "${NVM_BIN}/node" ]; then
    export PATH="${NVM_BIN}:${PATH}"
    hash -r
  fi
fi

# Enforce Node 24+ because Expo SDK 54 / RN 0.81 expect modern Node.
NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 24 ]; then
  echo "Error: Node 24+ is required. Current: $(node -v)"
  echo "Run: source \"\$HOME/.nvm/nvm.sh\" && nvm use 24 && export PATH=\"\$NVM_BIN:\$PATH\""
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
if [ "${EXPO_FORCE_PREBUILD:-0}" = "1" ] || [ ! -d "$PROJECT_ROOT/android" ]; then
  echo "Regenerating android/ with expo prebuild --clean"
  CI=1 npx expo prebuild --platform android --clean --no-install
else
  echo "android/ already exists; continuing with existing native config (set EXPO_FORCE_PREBUILD=1 to resync)."
fi

# If Firebase config exists at project root, copy it into android app module.
if [ -f "$PROJECT_ROOT/google-services.json" ]; then
  mkdir -p "$PROJECT_ROOT/android/app"
  cp "$PROJECT_ROOT/google-services.json" "$PROJECT_ROOT/android/app/google-services.json"
  echo "Firebase config copied to android/app/google-services.json"
else
  echo "Warning: google-services.json not found in project root."
fi

# Ensure android/local.properties points to Android SDK.
if [ -d "$PROJECT_ROOT/android" ] && [ ! -f "$PROJECT_ROOT/android/local.properties" ]; then
  echo "sdk.dir=$ANDROID_HOME" > "$PROJECT_ROOT/android/local.properties"
  echo "Created android/local.properties pointing to $ANDROID_HOME"
fi

# Compile local production Android App Bundle (.aab).
cd android
./gradlew bundleRelease

echo "Local Android Release Bundle complete."
echo "AAB path: $PROJECT_ROOT/android/app/build/outputs/bundle/release/app-release.aab"
