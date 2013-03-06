/*
 postal.diagnostics
 Author: Jim Cowart (http://freshbrewedcode.com/jimcowart)
 License: Dual licensed MIT (http://www.opensource.org/licenses/mit-license) & GPL (http://www.opensource.org/licenses/gpl-license)
 Version 0.7.0
 */
(function ( root, factory ) {
	if ( typeof module === "object" && module.exports ) {
		// Node, or CommonJS-Like environments
		module.exports = function( _, postal ) {
			return factory( _, postal );
		}
	} else if ( typeof define === "function" && define.amd ) {
		// AMD. Register as an anonymous module.
		define( ["thirdparty/underscore", "thirdparty/postal"], function ( _, postal ) {
			return factory( _, postal, root );
		} );
	} else {
		// Browser globals
		factory( root._, root.postal, root );
	}
}( typeof window !== 'undefined' ? window : this, function ( _, postal, global, undefined ) {

	postal.diagnostics = {};

	var DiagnosticsWireTap = function ( options ) {
		options = options || {};
		_.extend(this, { active: true, filters: [], name: _.uniqueId('wiretap_')}, options);

		this.removeWireTap = postal.addWireTap( _.bind(this.wiretapFn, this) );

		if ( postal.diagnostics[this.name] ) {
			postal.diagnostics[this.name].removeWireTap();
		}
		postal.diagnostics[this.name] = this;
	};

	DiagnosticsWireTap.prototype.wiretapFn = function ( data, envelope ) {
		if( !this.active ) {
			return;
		}
		if( !this.filters.length || _.any( this.filters, function ( filter ) {
			return this.applyFilter( filter, envelope );
		}, this)) {
			try {
				this.writer( this.serialize( envelope ) );
			}
			catch ( exception ) {
				this.writer( "Unable to serialize envelope: " + exception );
			}
		}
	};

	DiagnosticsWireTap.prototype.applyFilter = function ( filter, env ) {
		var match = 0, possible = 0;
		_.each( filter, function ( item, key ) {
			if ( env[key] ) {
				possible++;
				if ( _.isRegExp( item ) && item.test( env[key] ) ) {
					match++;
				}
				else if ( _.isObject( env[key] ) && !_.isArray( env[key] ) ) {
					if ( this.applyFilter( item, env[key] ) ) {
						match++;
					}
				}
				else {
					if ( _.isEqual( env[key], item ) ) {
						match++;
					}
				}
			}
		}, this );
		return match === possible;
	};

	DiagnosticsWireTap.prototype.clearFilters = function () {
		this.filters = [];
	};

	DiagnosticsWireTap.prototype.removeFilter = function ( filter ) {
		this.filters = _.filter( this.filters, function ( item ) {
			return !_.isEqual( item, filter );
		} );
	};

	DiagnosticsWireTap.prototype.addFilter = function ( constraint ) {
		if ( !_.isArray( constraint ) ) {
			constraint = [ constraint ];
		}
		_.each( constraint, function ( item ) {
			if ( this.filters.length === 0 || !_.any( this.filters, function ( filter ) {
				return _.isEqual( filter, item );
			} ) ) {
				this.filters.push( item );
			}
		}, this );
	};

	DiagnosticsWireTap.prototype.serialize = function(env) {
		if ( typeof JSON === 'undefined' ) {
			throw new Error("This browser or environment does not provide JSON support");
		}
		return JSON.stringify(env, null, 4);
	};

	DiagnosticsWireTap.prototype.writer = function(output) {
		console.log(output);
	};

	postal.diagnostics.DiagnosticsWireTap = DiagnosticsWireTap;

	return DiagnosticsWireTap;

} ));