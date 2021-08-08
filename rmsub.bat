@echo off
set submodulename=src/thirdparty/i18n
echo removing %submodulename%

git config -f .git/config --remove-section submodule.%submodulename%
git config -f .gitmodules --remove-section submodule.%submodulename%

git rm --cached %submodulename%

@REM rmdir -R %submodulename%
@REM rmdir -R .git/modules/%submodulename%
