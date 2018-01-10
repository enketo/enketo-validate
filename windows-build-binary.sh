#!/bin/sh
if [ "$TRAVIS_OS_NAME" = "osx" ] ; then
  OS="macos"
elif [  "$TRAVIS_OS_NAME" = "linux" ] || [ "$TRAVIS_OS_NAME" = "macos" ] ; then
  OS=$TRAVIS_OS_NAME
elif [ "$APPVEYOR_OS_NAME" = "windows" ] ; then
  OS=$APPVEYOR_OS_NAME
else
  echo "This script needs to be run with \$TRAVIS_OS_NAME value 'linux', 'macos' or 'osx'"
  exit 1
fi

echo "Building binaries for ${OS}..."

TARGET_BASE="enketo-validate-binaries"
TARGET_OS="$TARGET_BASE/${OS}"
FILENAME="validate"
NODE_VERSION="8"

# Create the binary 
pkg validate --targets node"$NODE_VERSION"-win-x64 --output validate-"$OS"
mkdir -p "$TARGET_OS"
mv ./validate-"$OS" "$TARGET_OS"/"$FILENAME"

# Copy the compiled libxmljs-mt files:
mkdir -p "$TARGET_OS"/node_modules/libxmljs-mt/build/Release
cp -f node_modules/libxmljs-mt/build/Release/*.node "$TARGET_OS"/node_modules/libxmljs-mt/build/Release/

# Copy the compiled libxslt files:
mkdir -p "$TARGET_OS"/node_modules/libxslt/build/Release
cp -f node_modules/libxslt/build/Release/*.node "$TARGET_OS"/node_modules/libxslt/build/Release/

# Custom oc build (for linux only)
if [ "$OS" = "linux" ] ; then
  npm run oc-build
  mkdir -p "$TARGET_OS"-oc
  pkg validate --targets node"$NODE_VERSION"-"$OS"-x64 --output validate-"$OS"-oc
  mv ./validate-"$OS"-oc "$TARGET_OS"-oc/"$FILENAME"
  cp -r "$TARGET_OS"/node_modules/libxmljs-mt/build/ "$TARGET_OS"-oc/node_modules/libxmljs-mt/build/
  cp -r "$TARGET_OS"/node_modules/libxslt/build/ "$TARGET_OS"-oc/node_modules/libxslt/build/
fi

# Create a zip file
cd "$TARGET_BASE" || exit
7z a -r "$OS".zip "$OS"
if [ "$OS" = "linux" ] ; then
  7z a -r "$OS"-oc.zip "$OS"-oc
fi

echo "All done, let us check if it works:"
# Test (a valid form, so it exits with 0)
./"$OS"/"$FILENAME" ../enketo-validate/test/xform/model-only.xml