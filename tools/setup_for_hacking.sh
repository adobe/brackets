#!/bin/bash

# Make sure the appname was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: setup_for_hacking.sh <application>"
  echo "Setup Brackets to use the HTML/CSS/JS files pulled from GitHub."
  echo ""
  echo "Parameters: application - full path to the Brackets application"
  echo "Example: ./setup_for_hacking.sh \"/Applications/Brackets Sprint 14.app\""
  exit;
fi

if [ ! -d "${1}" ]; then
  echo "$1 not found."
  exit;
fi

# Get the full path of this script
if [[ ${0} == /* ]]; then
  full_path="$0"
else
  full_path="${PWD}/${0#./}"
fi;

# Remove /tools/setup_for_hacking.sh to get the root directory
root_dir=${full_path%/*/*}

os=${OSTYPE//[0-9.]/}
if [ "$os" = "darwin" ]; then 
  dev="${1}/Contents/dev"
else
  dev="${1}/dev"
fi

# Remove existing "dev" symlink, if present
if [[ -d "$dev" || -n $(find -L "$dev" -type l) ]]; then
  rm "$dev"
fi

# Make new symlink
ln -s "$root_dir" "$dev"

echo "Brackets will now use the files in $root_dir"
echo "Run the restore_installed_build.sh script to revert back to the installed source files"
