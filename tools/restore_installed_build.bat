@ECHO OFF

REM - Check for parameter
IF %1.==. GOTO Error

REM - Remove 'dev' directory
rmdir %1\\dev

GOTO Exit

:Error
ECHO Usage: restore_installed_build.bat  \path\to\Brackets\

:Exit
