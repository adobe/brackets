#!/bin/bash

# This script updates the sub projects that depend on the main requirejs
# project. It is assumed the sub projects are siblings to this project
# the the names specified below.

echo "Updating r.js"
cp require.js ../r.js/require.js
cd ../r.js
node dist.js
cd ../requirejs

# The RequireJS+jQuery sample project.
echo "Updating jQuery sample project"
cp require.js ../require-jquery/parts/require.js
cp ../r.js/r.js ../require-jquery/jquery-require-sample/r.js
cd ../require-jquery/parts
./update.sh
cd ../../requirejs

# The sample projects

echo "Updating requirejs/example-jquery-cdn"
cp require.js ../example-jquery-cdn/www/js/lib/require.js
cp ../r.js/r.js ../example-jquery-cdn/tools/r.js

echo "Updating requirejs/example-jquery-shim"
cp require.js ../example-jquery-shim/www/js/lib/require.js
cp ../r.js/r.js ../example-jquery-shim/tools/r.js

echo "Updating requirejs/example-multipage"
cp require.js ../example-multipage/www/js/lib/require.js
cp ../r.js/r.js ../example-multipage/tools/r.js

echo "Updating requirejs/example-multipage-shim"
cp require.js ../example-multipage-shim/www/js/lib/require.js
cp ../r.js/r.js ../example-multipage-shim/tools/r.js

echo "Updating requirejs/example-libglobal"
cp require.js ../example-libglobal/lib/require.js
cp ../r.js/r.js ../example-libglobal/tools/r.js

echo "Updating volojs/create-template"
cp require.js ../../volojs/create-template/www/lib/require.js
cp ../r.js/r.js ../../volojs/create-template/tools/r.js

echo "Updating volojs/create-responsive-template"
cp require.js ../../volojs/create-responsive-template/www/js/lib/require.js
cp ../r.js/r.js ../../volojs/create-responsive-template/tools/r.js

# The cajon project
echo "Updating the cajon project"
cp require.js ../cajon/tools/require.js
cp ../r.js/r.js ../cajon/tools/r.js
cd ../cajon/tools
./build-cajon.js
cd ../../requirejs

# The require-cs project
echo "Updating the require-cs CoffeeScript plugin"
cp require.js ../require-cs/demo/lib/require.js
cp ../r.js/r.js ../require-cs/tools/r.js

# The npm container stuff
echo "Updating requirejs-npm"
cp require.js ../requirejs-npm/requirejs/require.js
cp ../r.js/r.js ../requirejs-npm/requirejs/bin/r.js

# The bower container stuff
echo "Updating requirejs-bower"
cp require.js ../requirejs-bower/require.js
