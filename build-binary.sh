#!/bin/sh
echo "TRAVIS_OS_NAME:${TRAVIS_OS_NAME}"

if [ "$TRAVIS_OS_NAME" = "osx" ] ; then
  OS="macos"
elif [ "$TRAVIS_OS_NAME" = "linux" -o  "$TRAVIS_OS_NAME" = "macos" ] ; then
  OS=$TRAVIS_OS_NAME
else
  echo "This script needs to be run with \$TRAVIS_OS_NAME value 'linux', 'macos' or 'osx'"
  exit 1
fi

echo "Building binaries for ${OS}..."

TARGET_BASE="../enketo-validate-binaries"
TARGET_OS="$TARGET_BASE/${OS}"
FILENAME="validate"
NODE_VERSION="8"

# assuming npm modules are currently installed for different OS
# rm -R node_modules
# npm install

# Install pkg module if it doesn't already exist
# sudo npm install -g pkg

# default linux
# run build again just in case the current build is a custom build
# npm run build 
pkg validate --targets node${NODE_VERSION}-${OS}-x64 --output validate-${OS}
mkdir -p ${TARGET_OS}
mv ./validate-${OS} ${TARGET_OS}/${FILENAME}

# Copy the compiled libxmljs-mt files:
mkdir -p ${TARGET_OS}/node_modules/libxmljs-mt/build/Release
cp -r node_modules/libxmljs-mt/build/Release ${TARGET_OS}/node_modules/libxmljs-mt/build/

# Copy the compiled libxslt files:
mkdir -p ${TARGET_OS}/node_modules/libxslt/build/Release
cp -r node_modules/libxslt/build/Release ${TARGET_OS}/node_modules/libxslt/build/

# Create a zip file
#tar czf ${OS}.tar.gz ${TARGET_OS}
zip -r9 ${OS}.zip ${TARGET_OS}

# custom oc build (for linux only)
if [ "$OS" = "linux" ] ; then
  npm run oc-build
  mkdir -p ${TARGET_OS}-oc
  pkg validate --targets node${NODE_VERSION}-${OS}-x64 --output validate-${OS}-oc
  mv ./validate-${OS}-oc ${TARGET_OS}/${FILENAME}
  cp -r ${TARGET_OS}/node_modules/libxmljs-mt/build/ ${TARGET_OS}-oc/node_modules/libxmljs-mt/build/
  cp -r ${TARGET_OS}/node_modules/libxslt/build/ ${TARGET_OS}-oc/node_modules/libxslt/build/
  zip -r9 ${OS}-oc.zip ${TARGET_OS}
fi

# Test
${TARGET_OS}/${FILENAME} test/xform/xpath-fails.xml