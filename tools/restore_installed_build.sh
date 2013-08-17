#!/bin/bash

# Detect the user's operating system
platform=`uname -s`;
if [[ "$platform" == 'Linux' ]]; then
   # This is the default directory for Ubuntu installations (if installed with the *.deb).
   # May have to adjust if other operating systems use different directories.
   default_app_directory='/opt/brackets';
   symlink='dev';
elif [[ "$platform" == 'Darwin' ]]; then # MAC OSX
   default_app_directory='/Applications/Brackets Sprint 14.app';
   symlink='Contents/dev';
else
   # Warn for unknown operating system?
   default_app_directory='/opt/brackets';
   symlink='dev';
fi

# Make sure the appname was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: restore_installed_build.sh <application>"
  echo "Restore Brackets to use the installed HTML/CSS/JS files."
  echo ""
  echo "Parameters: application - full path to the Brackets application"
  echo "Example: ./setup_for_hacking.sh \"$default_app_directory\""
  exit;
fi

if [ ! -d "${1}" ]; then
  echo "$1 not found."
  exit;
fi

link_name="${1}/$symlink"

if [[ -d "$link_name" || -n $(find -L "$link_name" -type l) ]]; then
  rm "$link_name"
  echo "$1 has been restored to the installed configuration."
fi
