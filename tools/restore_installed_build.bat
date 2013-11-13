@ECHO OFF

REM - Check for parameter
IF %1.==. GOTO Error

REM - Remove 'dev' directory
ECHO Removing %1\dev
rmdir %1\dev

GOTO Exit

:Error
ECHO Usage: restore_installed_build.bat application_path
ECHO Restore Brackets to use the installed HTML/CSS/JS files.
ECHO Parameters: application_path - path that contains the Brackets application
ECHO Example: restore_installed_build.bat "c:\Program Files (x86)\Brackets"

:Exit
