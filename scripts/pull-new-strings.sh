#!/bin/bash
set -e # exit with nonzero exit code if anything fails

if [ "$UPDATE_STRINGS" == "true" ]
then
    # Get the latest tarball of Thimble and extract the locales/ directory
    curl -L https://api.github.com/repos/mozilla/thimble.mozilla.org/tarball/master | \
        tar -xv --strip-components=1 *locales*

    # Temporarily stage any changes between the thimble locales folder and the
    # Brackets locales folder so that we can diff them
    git add locales

    # Get the list of files that are new or that were changed
    CHANGED="$(git diff --cached --name-only --diff-filter=M locales)"
    ADDED="$(git diff --cached --name-only --diff-filter=A locales)"

    for CHANGED_FILE in $CHANGED
    do
        # Get the SHA of the existing version of the locale file in Brackets
        sha="$(node scripts/get-file-sha.js $CHANGED_FILE)"
        # Get the locale that was changed
        locale="$(echo $CHANGED_FILE | sed -e 's/locales\///g' -e 's/\/editor\.properties//g')"
        # Base64 encode the new file's contents
        content="$(base64 $CHANGED_FILE)"
        body="{ \
            \"message\": \"Thimble-L10N - Update strings for $locale\", \
            \"content\": \"$content\", \
            \"sha\": \"$sha\" \
        }"

        # Commit the change to the repo
        curl -X PUT \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -H "Authorization: token $GH_TOKEN" \
            -d "$body"
            "https://api.github.com/repos/mozilla/brackets/contents/$CHANGED_FILE"

        echo "Successfully updated strings for $locale"
    done

    for ADDED_FILE in $ADDED
    do
        # Get the locale that was changed
        locale="$(echo $ADDED_FILE | sed -e 's/locales\///g' -e 's/\/editor\.properties//g')"
        # Base64 encode the new file's contents
        content="$(base64 $ADDED_FILE)"
        body="{ \
            \"message\": \"Thimble-L10N - Add strings for $locale\", \
            \"content\": \"$content\", \
        }"

        # Commit the new file to the repo
        curl -X PUT \
            -H "Content-Type: application/json" \
            -H "Accept: application/json" \
            -H "Authorization: token $GH_TOKEN" \
            -d "$body"
            "https://api.github.com/repos/mozilla/brackets/contents/$ADDED_FILE"
        echo "Successfully added strings for $locale"
    done

    git reset locales
fi
