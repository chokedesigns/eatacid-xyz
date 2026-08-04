@echo off
setlocal
set "RUNNER_DIR=%~dp0"
for %%I in ("%RUNNER_DIR%\..\..") do set "REPO_ROOT=%%~fI"

pushd "%REPO_ROOT%"
call npm run thumbs:input
set "THUMBS_EXIT_CODE=%ERRORLEVEL%"
popd

echo.
if "%THUMBS_EXIT_CODE%"=="0" (
  echo Thumbnail input completed successfully.
) else (
  echo Thumbnail input FAILED with exit code %THUMBS_EXIT_CODE%.
)
echo Press any key to close this window.
pause >nul
exit /b %THUMBS_EXIT_CODE%