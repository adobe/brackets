@ECHO OFF

REM - Check for parameter
IF %1.==. GOTO Error

REM - Use full path of this batch file to determine root directory
set root_path=%~f0
set root_path=%root_path:~0,-27%
ECHO %root_path%

REM - Remove existing 'dev' directory (if present)
rmdir %1\\dev

REM - Make symlink
mklink /d %1\\dev %root_path%

GOTO Exit

:Error
ECHO Usage: setup_for_hacking.bat  \path\to\Brackets\

:Exit
