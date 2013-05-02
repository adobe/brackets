#!/bin/bash

# Make sure the appname was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: restore_installed_build.sh <application>"
  echo "Restore Brackets to use the installed HTML/CSS/JS files."
  echo ""
  echo "Parameters: application - full path to the Brackets application"
  echo "Mac Example: ./restore_installed_build.sh \"/Applications/Brackets Sprint 14.app\""
  exit;
fi

if [ ! -d "${1}" ]; then
  echo "$1 not found."
  exit;
fi

os=${OSTYPE//[0-9.]/}
if [ "$os" = "darwin" ]; then 
  dev="${1}/Contents/dev"
else
  dev="${1}/dev"
fi

if [[ -d "$dev" || -n $(find -L "$dev" -type l) ]]; then
  rm "$dev"
  echo "$1 has been restored to the installed configuration."
fi
