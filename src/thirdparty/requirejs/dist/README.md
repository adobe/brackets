# RequireJS dist

This directory contains the tools that are used to build distributions of RequireJS and its web site.

When doing a release, do the following:

* Update files to the new version number:
    * require.js, both places
    * docs/download.md: check for nested paths too, add new release section
    * pre.html
    * post.html
* Update version in x.js in the r.js project if necessary.
* .updatesubs.sh
* Check in changes to r.js project.
* Check in changes to sample projects:
  * requirejs/example-jquery-cdn
  * requirejs/example-jquery-shim
  * requirejs/example-multipage
  * requirejs/example-multipage-shim
  * requirejs/example-libglobal
  * volojs/create-template
  * volojs/create-responsive-template

* Tag the requirejs and r.js trees:
    * git tag -am "Release 0.0.0" 0.0.0
    * git push --tags

* UPDATE THE "latest" tags

* Commit changes to cajon, test
  * Rev cajon version
  * change package.json
  * tag it
* Update the requirejs-npm directory
  * Update version in package.json
  * Modify bin/r.js to add: #!/usr/bin/env node
  * npm uninstall -g requirejs
  * npm install . -g
  * r.js -v
  * node (then use repl to do require("requirejs"))
  * Try a local install.
  * npm publish (in the requirejs-npm/requirejs directory)
* Update requirejs-bower
  * tag the repo, with "latest" too.
  * git push
* Update the requirejs-nuget directory (DO ON WINDOWS)
  * Update the require.js and r.js versions in content/Scripts using `volo add -nostamp -f`
  * Update Package.nuspec to rev version number.
  * NuGet.exe Pack Package.nuspec
  * NuGet.exe Push RequireJS.0.0.0.nupkg

Now pull down the tagged version to do a distribution, do this in git/ directory:

* rm -rf ./requirejs-dist ./requirejs-build
* git clone git://github.com/jrburke/requirejs.git requirejs-dist
* cd requirejs-dist
* git checkout 0.0.0
* cd dist

Run the distribution tasks.

To generate a build

* ./dist-build.sh 0.0.0

To generate the web site:

* node dist-site.js
* cd dist-site
* zip -r docs.zip ./*
* mv docs.zip ../../../requirejs-build/

