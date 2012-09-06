#!/bin/sh

# Make sure the appname was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: restore_installed_build.sh /path/to/Brackets.app"
  exit;
fi

if [ ! -d ${1} ]; then
  echo "$1 not found."
  exit;
fi

if [ -d "${1}/Contents/dev" ]; then
  rm "${1}/Contents/dev"
  echo "$1 has been restored to the installed configuration."
fi
