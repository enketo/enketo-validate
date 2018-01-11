SET OS=windows

ECHO "Building binaries for ${OS}..."

SET TARGET_BASE="enketo-validate-binaries"
SET TARGET_OS="%TARGET_BASE%\%OS%"
SET FILENAME="validate"
SET NODE_VERSION="8"

REM Create the binary 
pkg validate --targets node%NODE_VERSION%-win-x64 --output validate-%OS%
MKDIR %TARGET_OS%
MOVE validate-%OS%.exe %TARGET_OS%\%FILENAME%

REM Copy the compiled libxmljs-mt files:
MKDIR %TARGET_OS%\node_modules\libxmljs-mt\build\Release
COPY node_modules\libxmljs-mt\build\Release\*.node %TARGET_OS%\node_modules\libxmljs-mt\build\Release\

REM Copy the compiled libxslt files:
MKDIR %TARGET_OS%\node_modules\libxslt\build\Release
COPY node_modules\libxslt\build\Release\*.node %TARGET_OS%\node_modules\libxslt\build\Release\

ECHO "All done, let us check if it works:"
REM Test (a valid form, so it exits with 0) 
%OS%\%FILENAME% test\xform\model-only.xml