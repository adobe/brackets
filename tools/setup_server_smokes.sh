#!/bin/sh

# Make sure the server root folder was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: setup_server_smokes.sh <server-root-path>"
  echo "Setup local server to access Brackets server smoke test files from GitHub"
  echo ""
  echo "Parameters: server-root-path - local file path to server root folder"
  echo "Example: ./setup_server_smokes.sh \"/Library/WebServer/Documents\""
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

# Remove /tools/setup_server_smokes.sh to get the root directory
root_dir=${full_path%/*/*}

# Add server-tests path to root directory to get test file directory
server_test_dir="$root_dir/test/smokes/server-tests"

# Remove existing "server-tests" symlink, if present
if [ -d "${1}/server-tests" ]; then
  rm "${1}/server-tests"
fi

# Make new symlink
ln -s "$server_test_dir" "${1}/server-tests"

echo "Local server now has access to Brackets server-tests smoke test files"
