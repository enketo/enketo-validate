#!/bin/sh
if [ $1 = "linux" -o $1 = "macos" ] ; then
  OS=$1
else
  echo "This script needs to be run with either the 'linux' or 'macos' parameter"
  exit 1
fi

echo "Building binaries for ${OS}..."

TARGET_MAIN="../enketo-validate-binaries/${OS}"
NODE_VERSION="8"

# assuming npm modules are currently installed for different OS
rm -R node_modules
npm install

# Install pkg module if it doesn't already exist
sudo npm install -g pkg

# default linux
# run build again just in case the current build is a custom build
npm run build 
pkg validate --targets node${NODE_VERSION}-${OS}-x64 --output validate-${OS}

# custom oc build (for linux)
if [ $OS = 'linux'] ; then
  npm run oc-build
  pkg validate --targets node${NODE_VERSION}-${OS}-x64 --output validate-${OS}-oc
fi

# Copy binaries
mkdir -p ${TARGET_MAIN}
cp ./validate-${OS} ${TARGET_MAIN}/validate-${OS}
cp ./validate-${OS}-oc ${TARGET_MAIN}/validate-${OS}-oc

# Copy the compiled libxmljs-mt files:
mkdir -p ${TARGET_MAIN}/node_modules/libxmljs-mt/build/Release
cp -r node_modules/libxmljs-mt/build/Release ${TARGET_MAIN}/node_modules/libxmljs-mt/build/

# Copy the compiled libxslt files:
mkdir -p ${TARGET_MAIN}/node_modules/libxslt/build/Release
cp -r node_modules/libxslt/build/Release ${TARGET_MAIN}/node_modules/libxslt/build/

# Test
${TARGET_MAIN}/validate-${OS} --help