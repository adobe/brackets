/*jshint node: true */
module.exports = function( grunt ) {

var // modules
	fs = require( "fs" ),
	path = require( "path" ),
	request = require( "request" ),

	// files
	coreFiles = [
		"jquery.ui.core.js",
		"jquery.ui.widget.js",
		"jquery.ui.mouse.js",
		"jquery.ui.draggable.js",
		"jquery.ui.droppable.js",
		"jquery.ui.resizable.js",
		"jquery.ui.selectable.js",
		"jquery.ui.sortable.js",
		"jquery.effects.core.js"
	],

	uiFiles = coreFiles.map(function( file ) {
		return "ui/" + file;
	}).concat( grunt.file.expandFiles( "ui/*.js" ).filter(function( file ) {
		return coreFiles.indexOf( file.substring(3) ) === -1;
	})),

	allI18nFiles = grunt.file.expandFiles( "ui/i18n/*.js" ),

	cssFiles = [
		"core",
		"accordion",
		"autocomplete",
		"button",
		"datepicker",
		"dialog",
		"menu",
		"progressbar",
		"resizable",
		"selectable",
		"slider",
		"spinner",
		"tabs",
		"tooltip",
		"theme"
	].map(function( component ) {
		return "themes/base/jquery.ui." + component + ".css";
	}),

	// minified files
	minify = {
		"dist/jquery-ui.min.js": [ "<banner:meta.bannerAll>", "dist/jquery-ui.js" ],
		"dist/i18n/jquery-ui-i18n.min.js": [ "<banner:meta.bannerI18n>", "dist/i18n/jquery-ui-i18n.js" ]
	},

	minifyCSS = {
		"dist/jquery-ui.min.css": "dist/jquery-ui.css"
	},

	compareFiles = {
		all: [
			"dist/jquery-ui.js",
			"dist/jquery-ui.min.js"
		]
	};

function mapMinFile( file ) {
	return "dist/" + file.replace( /\.js$/, ".min.js" ).replace( /ui\//, "minified/" );
}

uiFiles.concat( allI18nFiles ).forEach(function( file ) {
	minify[ mapMinFile( file ) ] = [ "<banner>", file ];
});

cssFiles.forEach(function( file ) {
	minifyCSS[ "dist/" + file.replace( /\.css$/, ".min.css" ).replace( /themes\/base\//, "themes/base/minified/" ) ] = [ "<banner>", "<strip_all_banners:" + file + ">" ];
});

uiFiles.forEach(function( file ) {
	compareFiles[ file ] = [ file,  mapMinFile( file ) ];
});

// csslint and cssmin tasks
grunt.loadNpmTasks( "grunt-css" );
// file size comparison tasks
grunt.loadNpmTasks( "grunt-compare-size" );
// html validation task
grunt.loadNpmTasks( "grunt-html" );
// local testswarm and build tasks
grunt.loadTasks( 'build/tasks');

grunt.registerHelper( "strip_all_banners", function( filepath ) {
	return grunt.file.read( filepath ).replace( /^\s*\/\*[\s\S]*?\*\/\s*/g, "" );
});

function stripBanner( files ) {
	return files.map(function( file ) {
		return "<strip_all_banners:" + file + ">";
	});
}

function stripDirectory( file ) {
	// TODO: we're receiving the directive, so we need to strip the trailing >
	// we should be receving a clean path without the directive
	return file.replace( /.+\/(.+?)>?$/, "$1" );
}
// allow access from banner template
global.stripDirectory = stripDirectory;

function createBanner( files ) {
	// strip folders
	var fileNames = files && files.map( stripDirectory );
	return "/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - " +
		"<%= grunt.template.today('isoDate') %>\n" +
		"<%= pkg.homepage ? '* ' + pkg.homepage + '\n' : '' %>" +
		"* Includes: " + (files ? fileNames.join(", ") : "<%= stripDirectory(grunt.task.current.file.src[1]) %>") + "\n" +
		"* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
		" Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */";
}

grunt.initConfig({
	pkg: "<json:package.json>",
	files: {
		dist: "<%= pkg.name %>-<%= pkg.version %>",
		cdn: "<%= pkg.name %>-<%= pkg.version %>-cdn",
		themes: "<%= pkg.name %>-themes-<%= pkg.version %>"
	},
	meta: {
		banner: createBanner(),
		bannerAll: createBanner( uiFiles ),
		bannerI18n: createBanner( allI18nFiles ),
		bannerCSS: createBanner( cssFiles )
	},
	compare_size: compareFiles,
	concat: {
		ui: {
			src: [ "<banner:meta.bannerAll>", stripBanner( uiFiles ) ],
			dest: "dist/jquery-ui.js"
		},
		i18n: {
			src: [ "<banner:meta.bannerI18n>", allI18nFiles ],
			dest: "dist/i18n/jquery-ui-i18n.js"
		},
		css: {
			src: [ "<banner:meta.bannerCSS>", stripBanner( cssFiles ) ],
			dest: "dist/jquery-ui.css"
		}
	},
	min: minify,
	cssmin: minifyCSS,
	htmllint: {
		// ignore files that contain invalid html, used only for ajax content testing
		all: grunt.file.expand( [ "demos/**/*.html", "tests/**/*.html" ] ).filter(function( file ) {
			return !/(?:ajax\/content\d\.html|tabs\/data\/test\.html|tests\/unit\/core\/core\.html)/.test( file );
		})
	},
	copy: {
		dist: {
			src: [
				"AUTHORS.txt",
				"GPL-LICENSE.txt",
				"jquery-*.js",
				"MIT-LICENSE.txt",
				"README.md",
				"grunt.js",
				"package.json",
				"ui/**/*",
				"demos/**/*",
				"themes/**/*",
				"external/**/*",
				"tests/**/*"
			],
			renames: {
				"dist/jquery-ui.js": "ui/jquery-ui.js",
				"dist/jquery-ui.min.js": "ui/minified/jquery-ui.min.js",
				"dist/i18n/jquery-ui-i18n.js": "ui/i18n/jquery-ui-i18n.js",
				"dist/i18n/jquery-ui-i18n.min.js": "ui/minified/i18n/jquery-ui-i18n.min.js",
				"dist/jquery-ui.css": "themes/base/jquery-ui.css",
				"dist/jquery-ui.min.css": "themes/base/minified/jquery-ui.min.css"
			},
			dest: "dist/<%= files.dist %>"
		},
		dist_min: {
			src: "dist/minified/**/*",
			strip: /^dist/,
			dest: "dist/<%= files.dist %>/ui"
		},
		dist_css_min: {
			src: "dist/themes/base/minified/*.css",
			strip: /^dist/,
			dest: "dist/<%= files.dist %>"
		},
		dist_units_images: {
			src: "themes/base/images/*",
			strip: /^themes\/base\//,
			dest: "dist/"
		},
		dist_min_images: {
			src: "themes/base/images/*",
			strip: /^themes\/base\//,
			dest: "dist/<%= files.dist %>/themes/base/minified"
		},
		cdn: {
			src: [
				"AUTHORS.txt",
				"GPL-LICENSE.txt",
				"MIT-LICENSE.txt",
				"ui/*.js",
				"package.json"
			],
			renames: {
				"dist/jquery-ui.js": "jquery-ui.js",
				"dist/jquery-ui.min.js": "jquery-ui.min.js",
				"dist/i18n/jquery-ui-i18n.js": "i18n/jquery-ui-i18n.js",
				"dist/i18n/jquery-ui-i18n.min.js": "i18n/jquery-ui-i18n.min.js",
				"dist/jquery-ui.css": "themes/base/jquery-ui.css",
				"dist/jquery-ui.min.css": "themes/base/minified/jquery-ui.min.css"
			},
			dest: "dist/<%= files.cdn %>"
		},
		cdn_i18n: {
			src: "ui/i18n/jquery.ui.datepicker-*.js",
			strip: "ui/",
			dest: "dist/<%= files.cdn %>"
		},
		cdn_i18n_min: {
			src: "dist/minified/i18n/jquery.ui.datepicker-*.js",
			strip: "dist/minified",
			dest: "dist/<%= files.cdn %>"
		},
		cdn_min: {
			src: "dist/minified/*.js",
			strip: /^dist\/minified/,
			dest: "dist/<%= files.cdn %>/ui"
		},
		cdn_min_images: {
			src: "themes/base/images/*",
			strip: /^themes\/base\//,
			dest: "dist/<%= files.cdn %>/themes/base/minified"
		},
		cdn_themes: {
			src: "dist/<%= files.themes %>/themes/**/*",
			strip: "dist/<%= files.themes %>",
			dest: "dist/<%= files.cdn %>"
		},
		themes: {
			src: [
				"AUTHORS.txt",
				"GPL-LICENSE.txt",
				"MIT-LICENSE.txt",
				"package.json"
			],
			dest: "dist/<%= files.themes %>"
		}
	},
	zip: {
		dist: {
			src: "<%= files.dist %>",
			dest: "<%= files.dist %>.zip"
		},
		cdn: {
			src: "<%= files.cdn %>",
			dest: "<%= files.cdn %>.zip"
		},
		themes: {
			src: "<%= files.themes %>",
			dest: "<%= files.themes %>.zip"
		}
	},
	md5: {
		dist: {
			src: "dist/<%= files.dist %>",
			dest: "dist/<%= files.dist %>/MANIFEST"
		},
		cdn: {
			src: "dist/<%= files.cdn %>",
			dest: "dist/<%= files.cdn %>/MANIFEST"
		},
		themes: {
			src: "dist/<%= files.themes %>",
			dest: "dist/<%= files.themes %>/MANIFEST"
		}
	},
	qunit: {
		files: grunt.file.expandFiles( "tests/unit/**/*.html" ).filter(function( file ) {
			// disabling everything that doesn't (quite) work with PhantomJS for now
			// TODO except for all|index|test, try to include more as we go
			return !( /(all|all-active|index|test|draggable|droppable|selectable|resizable|sortable|dialog|slider|datepicker|tabs|tabs_deprecated)\.html$/ ).test( file );
		})
	},
	lint: {
		ui: grunt.file.expandFiles( "ui/*.js" ).filter(function( file ) {
			// TODO remove items from this list once rewritten
			return !( /(mouse|datepicker|draggable|droppable|resizable|selectable|sortable)\.js$/ ).test( file );
		}),
		grunt: [ "grunt.js", "build/tasks/*.js" ],
		tests: "tests/unit/**/*.js"
	},
	csslint: {
		// nothing: []
		// TODO figure out what to check for, then fix and enable
		base_theme: {
			src: grunt.file.expandFiles( "themes/base/*.css" ).filter(function( file ) {
				// TODO remove items from this list once rewritten
				return !( /(button|datepicker|core|dialog|theme)\.css$/ ).test( file );
			}),
			// TODO consider reenabling some of these rules
			rules: {
				"import": false,
				"important": false,
				"outline-none": false,
				// especially this one
				"overqualified-elements": false
			}
		}
	},
	jshint: (function() {
		function parserc( path ) {
			var rc = grunt.file.readJSON( (path || "") + ".jshintrc" ),
				settings = {
					options: rc,
					globals: {}
				};

			(rc.predef || []).forEach(function( prop ) {
				settings.globals[ prop ] = true;
			});
			delete rc.predef;

			return settings;
		}

		return {
			// TODO: use "faux strict mode" https://github.com/jshint/jshint/issues/504
			// TODO: limit `smarttabs` to multi-line comments https://github.com/jshint/jshint/issues/503
			options: parserc(),
			ui: parserc( "ui/" ),
			// TODO: `evil: true` is only for document.write() https://github.com/jshint/jshint/issues/519
			// TODO: don't create so many globals in tests
			tests: parserc( "tests/" )
		};
	})()
});

grunt.registerTask( "default", "lint csslint htmllint qunit" );
grunt.registerTask( "sizer", "concat:ui min:dist/jquery-ui.min.js compare_size:all" );
grunt.registerTask( "sizer_all", "concat:ui min compare_size" );
grunt.registerTask( "build", "concat min cssmin copy:dist_units_images" );
grunt.registerTask( "release", "clean build copy:dist copy:dist_min copy:dist_min_images copy:dist_css_min md5:dist zip:dist" );
grunt.registerTask( "release_themes", "release download_themes copy_themes copy:themes md5:themes zip:themes" );
grunt.registerTask( "release_cdn", "release_themes copy:cdn copy:cdn_min copy:cdn_i18n copy:cdn_i18n_min copy:cdn_min_images copy:cdn_themes md5:cdn zip:cdn" );

};
