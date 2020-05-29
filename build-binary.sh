#!/bin/sh
echo "TRAVIS_OS_NAME: ${TRAVIS_OS_NAME}"

if [ "$TRAVIS_OS_NAME" = "osx" ] ; then
  OS="macos"
elif [ "$TRAVIS_OS_NAME" = "linux" -o  "$TRAVIS_OS_NAME" = "macos" ] ; then
  OS=$TRAVIS_OS_NAME
elif [ "$APPVEYOR_OS_NAME" = "windows" ] ; then
  OS=$APPVEYOR_OS_NAME
else
  echo "This script needs to be run with \$TRAVIS_OS_NAME value 'linux', 'macos' or 'osx'"
  exit 1
fi

echo "Building binaries for ${OS}..."

TARGET_BASE="../enketo-validate-binaries"
TARGET_OS="$TARGET_BASE/${OS}"
FILENAME="validate"
NODE_VERSION="12"

# Create the binary
npx pkg validate --targets node${NODE_VERSION}-${OS}-x64 --output validate-${OS}
mkdir -p ${TARGET_OS}
mv ./validate-${OS} ${TARGET_OS}/${FILENAME}

# Copy the compiled libxmljs-mt files:
mkdir -p ${TARGET_OS}/node_modules/node1-libxmljsmt/build/Release
cp -f node_modules/node1-libxmljsmt/build/Release/*.node ${TARGET_OS}/node_modules/node1-libxmljsmt/build/Release/

# Copy the compiled libxslt files:
mkdir -p ${TARGET_OS}/node_modules/libxslt/build/Release
cp -f node_modules/libxslt/build/Release/*.node ${TARGET_OS}/node_modules/libxslt/build/Release/

# Create a zip file
cd ${TARGET_BASE}
zip -r9 ${OS}.zip ${OS}

# Test (a valid form, so it exits with 0)
./${OS}/${FILENAME} ../enketo-validate/test/xform/model-only.xml
