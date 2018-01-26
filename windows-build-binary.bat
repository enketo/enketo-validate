set OS=windows
set TARGET_BASE=enketo-validate-binaries
set TARGET_OS=%TARGET_BASE%\%OS%
set FILENAME=validate
set NODE_VERSION=8

echo Building binaries for %OS%...

rem Create the binary
mkdir %TARGET_OS%
echo Created folder %TARGET_OS%
call pkg validate --targets node%NODE_VERSION%-win-x64 --output %FILENAME%

echo Moving executable to %TARGET_OS%
move %FILENAME%.exe %TARGET_OS%

rem Copy the compiled libxmljs-mt files:
echo Copying the node_module packages
mkdir %TARGET_OS%\node_modules\libxmljs-mt\build\Release
copy node_modules\libxmljs-mt\build\Release\*.node %TARGET_OS%\node_modules\libxmljs-mt\build\Release\

rem Copy the compiled libxslt files:
mkdir %TARGET_OS%\node_modules\libxslt\build\Release
copy node_modules\libxslt\build\Release\*.node %TARGET_OS%\node_modules\libxslt\build\Release\

echo Done copying

echo All done, let us check if it works:
rem Test (a valid form, so it exits with 0) 
%TARGET_OS%\%FILENAME% test\xform\model-only.xml