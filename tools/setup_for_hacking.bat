@ECHO OFF

REM - Use full path of this batch file to determine root directory
set root_path=%~f0
set root_path=%root_path:~0,-27%

REM - Check for OS. This script works in Vista or later.
ver | findstr /i "5\.1\." > nul
IF %ERRORLEVEL% EQU 0 GOTO XPNotSupported

REM - Check for parameter
IF %1.==. GOTO Error

REM - Remove existing 'dev' directory (if present)
rmdir %1\dev

REM - Make symlink
mklink /d %1\dev %root_path%

GOTO Exit

:Error
ECHO Usage: setup_for_hacking.bat application_path
ECHO Setup Brackets to use the HTML/CSS/JS files pulled from GitHub.
ECHO Parameters: application_path - path that contains the Brackets application
ECHO Example: setup_for_hacking.bat "c:\Program Files (x86)\Brackets Sprint 14"
GOTO Exit

:XPNotSupported
ECHO Sorry, this script doesn't run in Windows XP.
ECHO To enable hacking, make a shortcut to 
ECHO %root_path%, name it
ECHO "dev", and put it next to your Brackets.exe file

:Exit
