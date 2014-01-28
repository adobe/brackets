#!/bin/bash

# Detect the user's operating system
platform=`uname -s`;
if [[ "$platform" == 'Linux' ]]; then
   # This is the default directory for Ubuntu installations (if installed with the *.deb).
   # May have to adjust if other operating systems use different directories.
   default_app_directory='/opt/brackets';
   symlink='dev';
elif [[ "$platform" == 'Darwin' ]]; then # MAC OSX
   default_app_directory='/Applications/Brackets.app';
   symlink='Contents/dev';
else
   # Warn for unknown operating system?
   default_app_directory='/opt/brackets';
   symlink='dev';
fi

# Make sure the appname was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: setup_for_hacking.sh <application>"
  echo "Setup Brackets to use the HTML/CSS/JS files pulled from GitHub."
  echo ""
  echo "Parameters: application - full path to the Brackets application"
  echo "Example: ./setup_for_hacking.sh \"$default_app_directory\""
  exit 0;
fi

if [ ! -d "${1}" ]; then
  echo "$1 not found."
  exit 1;
fi

# Get the full path of this script
if [[ ${0} == /* ]]; then
  full_path="$0"
else
  full_path="${PWD}/${0#./}"
fi;

# Remove /tools/setup_for_hacking.sh to get the root directory
root_dir=${full_path%/*/*}

link_name="${1}/$symlink"

# Remove existing symlink, if present
if [[ -L "$link_name" ]]; then
  rm "$link_name" || exit 1;
fi

# Make new symlink
ln -s "$root_dir" "$link_name" || exit 1;

echo "Brackets will now use the files in $root_dir"
echo "Run the restore_installed_build.sh script to revert back to the installed source files"
