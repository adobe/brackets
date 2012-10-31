#!/bin/sh

# Make sure the appname was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: run_tests.sh <application> <results_path> <spec_name>"
  echo "Runs unit tests for Brackets"
  echo ""
  echo "Parameters: application  - full path to the Brackets application"
  echo "            results_path - path to output JSON results (defaults to results.json in current dir)"
  echo "                           ~ tilde will expand, use URL encoding otherwise. Slashes are ok."
  echo "            spec_name    - name of the suite or spec to run (default: all)"
  if [[ "$OSTYPE" == "msys"* ]]; then
    echo "Example: ./run_tests.sh /c/Program\ Files\ \(x86\)/Brackets\ Sprint\ 16/Brackets.exe /c/Brackets%20Results/results.json all"
  else
    echo "Example: ./run_tests.sh /Applications/Brackets\ Sprint\ 16.app ~/Desktop/Brackets%20Results/results.json all"
  fi
  exit;
fi

# Check for Brackets.exe file on windows, Brackets.app directory on mac
if [[ "$OSTYPE" == "msys"* && ! -f "${1}" ]]; then
  echo "$1 not found."
  exit;
elif [[ "$OSTYPE" == "darwin"* && ! -d "${1}" ]]; then
  echo "$1 not found."
  exit;
fi

# JSON results file path
results_path="${PWD}/results.json"
if [[ ${2} != "" ]]; then
  results_path="${2}"
fi

# Check if results.json file already exists
if [[ -f "${results_path}" ]]; then
  echo "File $results_path already exists. Choose another results JSON file destination."
  exit;
fi

# Spec name filter
spec_name="all"
if [[ ${3} != "" ]]; then
  spec_name="${3}"
fi

# Get the full path of this script
if [[ ${0} == /* ]]; then
  full_path="$0"
else
  full_path="${PWD}/${0#./}"
fi;

# Remove /tools/run_tests.sh to get the root directory
root_dir=${full_path%/*/*}

# Fix drive letter
# TODO regex match drive letter
if [[ "$OSTYPE" == "msys"* ]]; then
  root_dir=${root_dir/\/c\//c:\\}
  results_path=${results_path/\/c\//c:\\}
fi

args="--startup-path=$root_dir/test/SpecRunner.html?spec=$spec_name&resultsPath=$results_path"

if [[ "$OSTYPE" == "darwin"* ]]; then
  open "${1}" --args $args
else
  # convert slashes
  args=${args//\//\\}
  echo $args
  "${1}" $args
fi;
