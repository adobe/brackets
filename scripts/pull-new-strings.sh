#!/bin/bash
set -e # exit with nonzero exit code if anything fails

if [ "$UPDATE_STRINGS" == "true" ]
then
    git config user.name "Travis CI"
    git config user.email "gideon@mozillafoundation.org"

    # Temporarily stash any changes that were made
    git stash

    # Fetch the latest Brackets master branch
    git fetch -f https://github.com/mozilla/brackets.git master:master

    # Switch to the updated master branch
    git checkout master

    # Get the latest tarball of Thimble and extract the locales/ directory
    node scripts/get-thimble-locale-files.js

    # Stage any changes between the thimble locales folder and the
    # Brackets locales folder
    git add locales

    # Commit the locale changes
    git commit -m "Thimble-L10N - Pull new strings from Thimble"

    # Push the changes to master (if possible)
    git push "https://${GH_TOKEN}@github.com/mozilla/brackets.git" master:master > /dev/null 2>&1

    # Reset the state of the build to what it was before
    git checkout - && git stash pop
fi
