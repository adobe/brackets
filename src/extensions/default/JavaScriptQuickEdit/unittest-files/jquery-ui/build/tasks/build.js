module.exports = function( grunt ) {

var path = require( "path" );

grunt.registerMultiTask( "copy", "Copy files to destination folder and replace @VERSION with pkg.version", function() {
	function replaceVersion( source ) {
		return source.replace( /@VERSION/g, grunt.config( "pkg.version" ) );
	}
	function copyFile( src, dest ) {
		if ( /(js|css)$/.test( src ) ) {
			grunt.file.copy( src, dest, {
				process: replaceVersion
			});
		} else {
			grunt.file.copy( src, dest );
		}
	}
	var files = grunt.file.expandFiles( this.file.src ),
		target = this.file.dest + "/",
		strip = this.data.strip,
		renameCount = 0,
		fileName;
	if ( typeof strip === "string" ) {
		strip = new RegExp( "^" + grunt.template.process( strip, grunt.config() ).replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" ) );
	}
	files.forEach(function( fileName ) {
		var targetFile = strip ? fileName.replace( strip, "" ) : fileName;
		copyFile( fileName, target + targetFile );
	});
	grunt.log.writeln( "Copied " + files.length + " files." );
	for ( fileName in this.data.renames ) {
		renameCount += 1;
		copyFile( fileName, target + grunt.template.process( this.data.renames[ fileName ], grunt.config() ) );
	}
	if ( renameCount ) {
		grunt.log.writeln( "Renamed " + renameCount + " files." );
	}
});


grunt.registerMultiTask( "zip", "Create a zip file for release", function() {
	// TODO switch back to adm-zip for better cross-platform compability once it actually works
	// 0.1.3 works, but result can't be unzipped
	// its also a lot slower then zip program, probably due to how its used...
	// var files = grunt.file.expandFiles( "dist/" + this.file.src + "/**/*" );
	// grunt.log.writeln( "Creating zip file " + this.file.dest );

	//var AdmZip = require( "adm-zip" );
	//var zip = new AdmZip();
	//files.forEach(function( file ) {
	//	grunt.verbose.writeln( "Zipping " + file );
	//	// rewrite file names from dist folder (created by build), drop the /dist part
	//	zip.addFile(file.replace(/^dist/, "" ), fs.readFileSync( file ) );
	//});
	//zip.writeZip( "dist/" + this.file.dest );
	//grunt.log.writeln( "Wrote " + files.length + " files to " + this.file.dest );

	var done = this.async(),
		dest = this.file.dest,
		src = grunt.template.process( this.file.src, grunt.config() );
	grunt.utils.spawn({
		cmd: "zip",
		args: [ "-r", dest, src ],
		opts: {
			cwd: 'dist'
		}
	}, function( err, result ) {
		if ( err ) {
			grunt.log.error( err );
			done();
			return;
		}
		grunt.log.writeln( "Zipped " + dest );
		done();
	});
});

grunt.registerMultiTask( "md5", "Create list of md5 hashes for CDN uploads", function() {
	// remove dest file before creating it, to make sure itself is not included
	if ( path.existsSync( this.file.dest ) ) {
		fs.unlinkSync( this.file.dest );
	}
	var crypto = require( "crypto" ),
		dir = this.file.src + "/",
		hashes = [];
	grunt.file.expandFiles( dir + "**/*" ).forEach(function( fileName ) {
		var hash = crypto.createHash( "md5" );
		hash.update( grunt.file.read( fileName, "ascii" ) );
		hashes.push( fileName.replace( dir, "" ) + " " + hash.digest( "hex" ) );
	});
	grunt.file.write( this.file.dest, hashes.join( "\n" ) + "\n" );
	grunt.log.writeln( "Wrote " + this.file.dest + " with " + hashes.length + " hashes" );
});

// only needed for 1.8
grunt.registerTask( "download_docs", function() {
	function capitalize(value) {
		return value[0].toUpperCase() + value.slice(1);
	}
	// should be grunt.config("pkg.version")?
	var version = "1.8",
		docsDir = "dist/docs",
		files = "draggable droppable resizable selectable sortable accordion autocomplete button datepicker dialog progressbar slider tabs position"
		.split(" ").map(function(widget) {
			return {
				url: "http://docs.jquery.com/action/render/UI/API/" + version + "/" + capitalize(widget),
				dest: docsDir + '/' + widget + '.html'
			};
		});
	files = files.concat("animate addClass effect hide removeClass show switchClass toggle toggleClass".split(" ").map(function(widget) {
		return {
			url: "http://docs.jquery.com/action/render/UI/Effects/" + widget,
			dest: docsDir + '/' + widget + '.html'
		};
	}));
	files = files.concat("Blind Clip Drop Explode Fade Fold Puff Slide Scale Bounce Highlight Pulsate Shake Size Transfer".split(" ").map(function(widget) {
		return {
			url: "http://docs.jquery.com/action/render/UI/Effects/" + widget,
			dest: docsDir + '/effect-' + widget.toLowerCase() + '.html'
		};
	}));
	grunt.file.mkdir( "dist/docs" );
	grunt.utils.async.forEach( files, function( file, done ) {
		var out = fs.createWriteStream( file.dest );
		out.on( "close", done );
		request( file.url ).pipe( out );
	}, this.async() );
});

grunt.registerTask( "download_themes", function() {
	// var AdmZip = require('adm-zip');
	var done = this.async(),
		themes = grunt.file.read( "build/themes" ).split(","),
		requests = 0;
	grunt.file.mkdir( "dist/tmp" );
	themes.forEach(function( theme, index ) {
		requests += 1;
		grunt.file.mkdir( "dist/tmp/" + index );
		var zipFileName = "dist/tmp/" + index + ".zip",
			out = fs.createWriteStream( zipFileName );
		out.on( "close", function() {
			grunt.log.writeln( "done downloading " + zipFileName );
			// TODO AdmZip produces "crc32 checksum failed", need to figure out why
			// var zip = new AdmZip(zipFileName);
			// zip.extractAllTo('dist/tmp/' + index + '/');
			// until then, using cli unzip...
			grunt.utils.spawn({
				cmd: "unzip",
				args: [ "-d", "dist/tmp/" + index, zipFileName ]
			}, function( err, result ) {
				grunt.log.writeln( "Unzipped " + zipFileName + ", deleting it now" );
				fs.unlinkSync( zipFileName );
				requests -= 1;
				if (requests === 0) {
					done();
				}
			});
		});
		request( "http://ui-dev.jquery.com/download/?" + theme ).pipe( out );
	});
});

grunt.registerTask( "copy_themes", function() {
	// each package includes the base theme, ignore that
	var filter = /themes\/base/,
		files = grunt.file.expandFiles( "dist/tmp/*/development-bundle/themes/**/*" ).filter(function( file ) {
			return !filter.test( file );
		}),
		// TODO the grunt.template.process call shouldn't be necessary
		target = "dist/" + grunt.template.process( grunt.config( "files.themes" ), grunt.config() ) + "/",
		distFolder = "dist/" + grunt.template.process( grunt.config( "files.dist" ), grunt.config() );
	files.forEach(function( fileName ) {
		var targetFile = fileName.replace( /dist\/tmp\/\d+\/development-bundle\//, "" ).replace( "jquery-ui-.custom", "jquery-ui" );
		grunt.file.copy( fileName, target + targetFile );
	});

	// copy minified base theme from regular release
	files = grunt.file.expandFiles( distFolder + "/themes/base/**/*" );
	files.forEach(function( fileName ) {
		grunt.file.copy( fileName, target + fileName.replace( distFolder, "" ) );
	});
});

grunt.registerTask( "clean", function() {
	require( "rimraf" ).sync( "dist" );
});

grunt.registerTask( "authors", function() {
	var done = this.async();

	grunt.utils.spawn({
		cmd: "git",
		args: [ "log", "--pretty=%an <%ae>" ]
	}, function( err, result ) {
		if ( err ) {
			grunt.log.error( err );
			return done( false );
		}

		var authors,
			tracked = {};
		authors = result.split( "\n" ).reverse().filter(function( author ) {
			var first = !tracked[ author ];
			tracked[ author ] = true;
			return first;
		}).join( "\n" );
		grunt.log.writeln( authors );
		done();
	});
});

};