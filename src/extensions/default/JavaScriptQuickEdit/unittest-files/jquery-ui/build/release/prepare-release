#!/bin/sh

base_dir="`pwd`/jquery-ui-release"
repo_dir="$base_dir/jquery-ui"
release_dir="$repo_dir/build/release"

github_repo="git@github.com:jquery/jquery-ui.git"
remote_cmd="ssh jqadmin@ui-dev.jquery.com /srv/dev.jqueryui.com/prepare-release"



#
# Setup environment
#

echo
echo "--------------------------"
echo "| SETTING UP ENVIRONMENT |"
echo "--------------------------"
echo

mkdir $base_dir
cd $base_dir

echo "Cloning repo from $github_repo..."
git clone $github_repo
cd $repo_dir

echo
echo "Environment setup complete."
echo



#
# Figure out which versions we're dealing with
#

echo
echo "------------------------"
echo "| CALCULATING VERSIONS |"
echo "------------------------"
echo

# NOTE: this will be different for minor and major releases
version=`$remote_cmd/get-latest-version`
major_minor=${version%.*}
point=${version##*.}
version_new="${major_minor}.$(($point + 1))"
version_next=`cat version.txt`

echo "We are going from $version to $version_new."
echo "version.txt will be set to $version_next when complete."
echo "Press enter to continue, or ctrl+c to cancel."
read


#
# Generate shell for changelog
#

echo
echo "------------------------"
echo "| GENERATING CHANGELOG |"
echo "------------------------"
echo

echo "Creating shell for changelog..."
changelog_url="http:\/\/docs.jquery.com\/action\/edit\/UI\/Changelog\/$version_new"
`sed "s/CHANGELOG_URL/$changelog_url/" <$release_dir/changelog-shell >$base_dir/changelog`


# find all commits
echo "Adding commits to changelog..."
format_ticket='[http://dev.jqueryui.com/ticket/XXXX #XXXX]'
format_commit='[http://github.com/jquery/jquery-ui/commit/%H %h]'
format_full="* %s ($format_ticket, $format_commit)"
git whatchanged $version... --pretty=format:"$format_full" \
  -- ui themes demos build \
| sed '/^:/ d' \
| sed '/^$/ d' \
| sed 's/\(Fixe[sd] #\)\([0-9][0-9]*\)\(.*\)\(XXXX #XXXX\)/Fixed #\2\3\2 #\2/' \
| LC_ALL='C' sort -f \
>> $base_dir/changelog

# find all fixed tickets
echo "Adding Trac tickets to changelog..."
$remote_cmd/generate-changelog >> $base_dir/changelog

echo
echo "Changelog complete."
echo



#
# Generate list of contributors
#

echo
echo "--------------------------"
echo "| GATHERING CONTRIBUTORS |"
echo "--------------------------"
echo


# find all committers and authors
echo "Adding commiters and authors..."
format_contributors='%aN%n%cN'
git whatchanged $version... --pretty=format:"$format_contributors" \
| sed '/^:/ d' \
| sed '/^$/ d' \
> $base_dir/thankyou

# find all reporters and commenters from Trac
echo "Adding reporters and commenters from Trac..."
$remote_cmd/generate-contributors >> $base_dir/thankyou

# sort names
echo "Sorting contributors..."
LC_ALL='C' sort -f $base_dir/thankyou | uniq > $base_dir/_thankyou
mv $base_dir/_thankyou $base_dir/thankyou

# find all people that were thanked
echo "Adding people thanked in commits..."
git whatchanged $version... \
| grep -i thank \
>> $base_dir/thankyou

echo
echo "Find contributors from duplicates of fixed tickets and add them to:"
echo "$base_dir/thankyou"
echo "Press enter when done."
read

echo
echo "Contributors list complete."
echo



#
# Update version
#

echo
echo "--------------------"
echo "| UPDATING VERSION |"
echo "--------------------"
echo

echo "Updating version.txt to $version_new..."
echo $version_new > version.txt

git commit -a -m "Tagging the $version_new release."
version_new_time=`git log -1 --pretty=format:"%ad"`
echo "Committed version.txt at $version_new_time..."

echo "Tagging $version_new..."
git tag $version_new

echo "Updating version.txt to $version_next..."
echo $version_next > version.txt

git commit -a -m "Updating the master version to $version_next"
echo "Committed version.txt..."

echo
echo "Version update complete."
echo



#
# Push to GitHub
#

echo
echo "---------------------"
echo "| PUSHING TO GITHUB |"
echo "---------------------"
echo

echo "Please review the output and generated files as a sanity check."
echo "Press enter to continue or ctrl+c to abort."
read

git push
git push --tags

echo
echo "Push to GitHub complete."
echo



#
# Update Trac
#

echo
echo "-----------------"
echo "| UPDATING TRAC |"
echo "-----------------"
echo

# TODO: automate this
# NOTE: this will be different for minor and major releases
milestone=`$remote_cmd/get-latest-milestone`

# Create new milestrone and version
echo "$version_new was tagged at $version_new_time."
echo "Create and close the $version_new Milestone with the above date and time."
echo "Create the $version_new Version with the above date and time."
echo "Press enter when done."
read

# Update milestone for all fixed tickets
echo "Change all $milestone fixed tickets to $version_new."
echo "Press enter when done."
read

echo
echo "Trac updates complete."
echo



#
# Build jQuery UI
#

echo
echo "----------------------"
echo "| BUILDING JQUERY UI |"
echo "----------------------"
echo

# check out the tagged version
echo "Checking out $version_new..."
git checkout $version_new
cd build

# Update the link to the docs (never contains the patch version)
echo "Updating URL for API docs..."
sed "s/UI\/API\/\${release\.version}/UI\/API\/$major_minor/" build.xml >build.xml.tmp
mv build.xml.tmp build.xml

# Run the build
echo "Running build..."
ant

echo
echo "Build complete."
echo



#
# Upload zip to Google Code
#

echo
echo "----------------------"
echo "| UPDATE GOOGLE CODE |"
echo "----------------------"
echo

echo "Upload zip to Google Code."
echo "  http://code.google.com/p/jquery-ui/downloads/entry"
echo "  Summary: jQuery UI $version_new (Source, demos, docs, themes, tests) STABLE"
echo "  Labels: Featured, Type-Source, OpSys-All"
echo "Modify the previous release to no longer say STABLE at the end."
echo "Remove the featured label from the previous release."
echo "Press enter when done."
read

echo
echo "Google Code update complete."
echo



#
# Update SVN
#

echo
echo "----------------"
echo "| UPDATING SVN |"
echo "----------------"
echo

cd $base_dir
mkdir svn
cd svn

echo "Checking out SVN tags..."
svn co --depth immediates https://jquery-ui.googlecode.com/svn/tags
cd tags

echo "Unzipping build into tags/$version_new..."
unzip $repo_dir/build/dist/jquery-ui-$version_new.zip
mv jquery-ui-$version_new $version_new

echo "Adding files to SVN..."
svn add $version_new

echo "Setting svn:mime-type..."
find $version_new -name \*.js -exec svn propset svn:mime-type text/javascript {} \;
find $version_new -name \*.css -exec svn propset svn:mime-type text/css {} \;
find $version_new -name \*.html -exec svn propset svn:mime-type text/html {} \;
find $version_new -name \*.png -exec svn propset svn:mime-type image/png {} \;
find $version_new -name \*.gif -exec svn propset svn:mime-type image/gif {} \;

# TODO: commit
echo
echo "svn commit with the following message:"
echo "Created $version_new tag from http://jquery-ui.googlecode.com/files/jquery-ui-$version_new.zip"
echo "Press enter when done."
read

echo
echo "SVN update complete."
echo



#
# Generate themes
# 




# ruby -e 'puts File.read("thankyou").split("\n").join(", ")' > thankyou2
