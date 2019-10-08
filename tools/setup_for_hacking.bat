@ECHO OFF

REM - Use full path of this batch file to determine root directory
set root_path=%~f0
set root_path=%root_path:~0,-27%

REM - Check for parameter
IF %1.==. GOTO Error

REM - Check for OS. This script works in Vista or later.
ver | findstr /i "5\.1\." > nul
IF %ERRORLEVEL% EQU 0 GOTO XPNotSupported

REM - Remove existing 'dev' directory (if present)
if exist %1\dev rmdir %1\dev

REM - Make symlink
REM   (doesn't work on XP - see instructions below)
mklink /d %1\dev "%root_path%"

GOTO Exit

:Error
ECHO Usage: setup_for_hacking.bat application_path
ECHO Setup Brackets to use the HTML/CSS/JS files pulled from GitHub.
ECHO Parameters: application_path - path that contains the Brackets application
ECHO Example: setup_for_hacking.bat "c:\Program Files (x86)\Brackets"
GOTO Exit

:XPNotSupported
ECHO Sorry, this script is not supported on XP.
ECHO To enable hacking, use the junction tool (http://technet.microsoft.com/en-us/sysinternals/bb896768)
ECHO as follows: junction.exe %1\dev "%root_path%"
ECHO (in the folder containing Brackets.exe)

:Exit
