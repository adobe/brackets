#!/bin/sh

# Make sure the appname was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: restore_installed_build.sh <application>"
  echo "Restore Brackets to use the installed HTML/CSS/JS files."
  echo ""
  echo "Parameters: application - full path to the Brackets application"
  echo "Example: ./restore_installed_build.sh \"/Applications/Brackets Sprint 14.app\""
  exit;
fi

if [ ! -d "${1}" ]; then
  echo "$1 not found."
  exit;
fi

if [[ -d "${1}/Contents/dev" || -n $(find -L "${1}/Contents/dev" -type l) ]]; then
  rm "${1}/Contents/dev"
  echo "$1 has been restored to the installed configuration."
fi
