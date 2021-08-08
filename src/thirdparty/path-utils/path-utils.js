/** 
 * @license
 * path-utils.js - version 0.0.2
 * Copyright (c) 2011, Kin Blas
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else if (typeof module === 'object' && module.exports) {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.PathUtils = factory();
	}
}(this, function(){
	
	var PathUtils = {
		// This scary looking regular expression parses an absolute URL or its relative
		// variants (protocol, site, document, query, and hash), into the various
		// components (protocol, host, path, query, fragment, etc that make up the
		// URL as well as some other commonly used sub-parts. When used with RegExp.exec()
		// or String.match, it parses the URL into a results array that looks like this:
		//
		//     [0]: http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread#msg-content
		//     [1]: http://jblas:password@mycompany.com:8080/mail/inbox?msg=1234&type=unread
		//     [2]: http://jblas:password@mycompany.com:8080/mail/inbox
		//     [3]: http://jblas:password@mycompany.com:8080
		//     [4]: http:
		//     [5]: //
		//     [6]: jblas:password@mycompany.com:8080
		//     [7]: jblas:password
		//     [8]: jblas
		//     [9]: password
		//    [10]: mycompany.com:8080
		//    [11]: mycompany.com
		//    [12]: 8080
		//    [13]: /mail/inbox
		//    [14]: /mail/
		//    [15]: inbox
		//    [16]: ?msg=1234&type=unread
		//    [17]: #msg-content
		//
		urlParseRE: /^(((([^:\/#\?]+:)?(?:(\/\/)((?:(([^:@\/#\?]+)(?:\:([^:@\/#\?]+))?)@)?(([^:\/#\?\]\[]+|\[[^\/\]@#?]+\])(?:\:([0-9]+))?))?)?)?((\/?(?:[^\/\?#]+\/+)*)([^\?#\.]*(?:\.[^\?#\.]+)*(\.[^\?#\.]+)|[^\?#]*)))?(\?[^#]+)?)(#.*)?/,

		// These are the property names we set on the parsed url object. The order of the names
		// in this array must match the order of the sub-matches in urlParseRE!
		parsedUrlPropNames: [
				"href",
				"hrefNoHash",
				"hrefNoSearch",
				"domain",
				"protocol",
				"doubleSlash",
				"authority",
				"userinfo",
				"username",
				"password",
				"host",
				"hostname",
				"port",
				"pathname",
				"directory",
				"filename",
				"filenameExtension",
				"search",
				"hash"
		],

		defaultPorts: { http: "80", https: "443", ftp: "20", ftps: "990" },

		parseUrl: function( url ) {

			// If we're passed an object, we'll assume that it is
			// a parsed url object and just return it back to the caller.
			if ( url && typeof url === "object" ) {
				return url;
			}

			var matches = PathUtils.urlParseRE.exec( url || "" ) || [],
				props = PathUtils.parsedUrlPropNames,
				cnt = props.length,
				result = {},
				i;

			for ( i = 0; i < cnt; i++ ) {
				// Most browsers returns an empty string for empty sub-matches, but
				// IE returns undefined, so we need to make sure we normalize empty
				// sub-matches so results are consistent across all browsers.

				result[ props[ i ] ] = matches[ i ] || "";
			}

			return result;
		},

		port: function( url ) {
			var u = PathUtils.parseUrl( url );
			return u.port || PathUtils.defaultPorts[u.protocol];
		},

		isSameDomain: function( absUrl1, absUrl2 ) {
			return PathUtils.parseUrl( absUrl1 ).domain === PathUtils.parseUrl( absUrl2 ).domain;
		},

		//Returns true for any relative variant.
		isRelativeUrl: function( url ) {
			// All relative Url variants have one thing in common, no protocol.
			return PathUtils.parseUrl( url ).protocol === "";
		},

		//Returns true for an absolute url.
		isAbsoluteUrl: function( url ) {
			return PathUtils.parseUrl( url ).protocol !== "";
		},

		// Turn relPath into an asbolute path. absPath is
		// an optional absolute path which describes what
		// relPath is relative to.

		makePathAbsolute: function( relPath, absPath ) {
			if ( relPath && relPath.charAt( 0 ) === "/" ) {
				return relPath;
			}

			relPath = relPath || "";
			absPath = absPath ? absPath.replace( /^\/|(\/[^\/]*|[^\/]+)$/g, "" ) : "";

			var absStack = absPath ? absPath.split( "/" ) : [],
				relStack = relPath.split( "/" );
			for ( var i = 0; i < relStack.length; i++ ) {
				var d = relStack[ i ];
				switch ( d ) {
					case ".":
						break;
					case "..":
						if ( absStack.length ) {
							absStack.pop();
						}
						break;
					default:
						absStack.push( d );
						break;
				}
			}
			return "/" + absStack.join( "/" );
		},

		// Turn absolute pathA into a path that is
		// relative to absolute pathB.

		makePathRelative: function( pathA, pathB ) {
			// Remove any file reference in the path.
			pathB = pathB ? pathB.replace( /^\/|\/?[^\/]*$/g, "" ) : "";
			pathA = pathA ? pathA.replace( /^\//, "" ) : "";

			var stackB = pathB ? pathB.split( "/" ) : [],
				stackA = pathA.split( "/" ),
				stackC = [],
				len = stackB.length,
				upLevel = false,
				startIndex = 0;

			for ( var i = 0; i < len; i++ ) {
				upLevel = upLevel || stackA[ 0 ] !== stackB[ i ];
				if ( upLevel ) {
					stackC.push( ".." );
				} else {
					stackA.shift();
				}
			}
			return stackC.concat( stackA ).join( "/" );
		},

		// Turn any relative URL variant into an absolute URL.

		makeUrlAbsolute: function( relUrl, absUrl ) {
			if ( !PathUtils.isRelativeUrl( relUrl ) ) {
				return relUrl;
			}

			var relObj = PathUtils.parseUrl( relUrl ),
				absObj = PathUtils.parseUrl( absUrl ),
				protocol = relObj.protocol || absObj.protocol,
				doubleSlash = relObj.protocol ? relObj.doubleSlash : ( relObj.doubleSlash || absObj.doubleSlash ),
				authority = relObj.authority || absObj.authority,
				hasPath = relObj.pathname !== "",
				pathname = PathUtils.makePathAbsolute( relObj.pathname || absObj.filename, absObj.pathname ),
				search = relObj.search || ( !hasPath && absObj.search ) || "",
				hash = relObj.hash;

			return protocol + doubleSlash + authority + pathname + search + hash;
		}
	};

	// For every parsedUrlPropName, make sure there is a getter function defined on the PathUtils object.

	function getterFunc( propName )
	{
		return function( url ){
			return PathUtils.parseUrl( url )[ propName ];
		}
	}

	var i, prop, props = PathUtils.parsedUrlPropNames, cnt = props.length;
	for ( i = 0; i < cnt; i++ ) {
		prop = props[ i ];
		if ( !PathUtils[ prop ] ) {
			PathUtils[ prop ] = getterFunc( prop );
		}
	}

	// Expose PathUtils to the world.
	return PathUtils;
}));