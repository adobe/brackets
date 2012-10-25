#!/bin/sh

# Make sure the appname was passed in and is valid
if [[ ${1} == "" ]]; then
  echo "Usage: run_tests.sh <application> <results_path> <spec_name>"
  echo "Runs unit tests for Brackets"
  echo ""
  echo "Parameters: application  - full path to the Brackets application"
  echo "            results_path - URL encoded full path to output JSON results (defaults to results.json in current dir)"
  echo "            spec_name    - name of the suite or spec to run (default: all)"
  echo "Example: ./run_tests.sh /Applications/Brackets Sprint 16.app \"~/Desktop/Brackets%20Results/results.json\" \"all\""
  exit;
fi

if [ ! -d "${1}" ]; then
  echo "$1 not found."
  exit;
fi

# JSON results file path
results_path="${PWD}/results.json"
if [[ ${2} != "" ]]; then
  results_path="${2}"
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

# Remove /tools/setup_for_hacking.sh to get the root directory
root_dir=${full_path%/*/*}

#echo "$root_dir/test/SpecRunner.html?spec=$spec_name&resultsPath=$results_path"
open "${1}" --args --startup-path="$root_dir/test/SpecRunner.html?spec=$spec_name&resultsPath=$results_path"
