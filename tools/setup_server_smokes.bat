@ECHO OFF

REM - Use full path of this batch file to determine server-tests directory
set server_tests_path=%~f0
set server_tests_path=%server_tests_path:~0,-29%
set server_tests_path=%server_tests_path%test\smokes\server-tests

REM - Check for parameter
IF %1.==. GOTO Error

REM - Check for OS. This script works in Vista or later.
ver | findstr /i "5\.1\." > nul
IF %ERRORLEVEL% EQU 0 GOTO XPNotSupported

REM - Remove existing 'server-tests' directory (if present)
rmdir %1\server-tests

REM - Make symlink
REM   (doesn't work on XP - see instructions below)
mklink /d %1\server-tests %server_tests_path%

GOTO Exit

:Error
ECHO Usage: setup_server_smokes.bat server_root_path
ECHO Setup local server to access Brackets server smoke test files from GitHub
ECHO Parameters: server_root_path - local file path to server root folder
ECHO Example: setup_server_smokes.bat "c:\wamp\www"
GOTO Exit

:XPNotSupported
ECHO Sorry, this script doesn't run in Windows XP.
ECHO To enable hacking, use the junction tool (http://technet.microsoft.com/en-us/sysinternals/bb896768)
ECHO as follows: junction.exe %1\server-tests %server_tests_path%
ECHO (in the server root folder)

:Exit
