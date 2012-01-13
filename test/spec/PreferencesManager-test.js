define(function(require, exports, module) {
    // Load dependent modules
    var PreferencesManager      = require("PreferencesManager")
    ,   SpecRunnerUtils         = require("./SpecRunnerUtils.js")
    ;

    var CLIENT_ID = "PreferencesManager-test";

    describe("PreferencesManager", function() {

        beforeEach(function() {
            // SpecRunner.js already initializes the unit test instance of
            // PreferencesManager to use the unit test key. All we need to do
            // here is reset to clear callbacks and in-memory preferences.
            PreferencesManager._reset();
        });

        it("should register clients", function() {
            var pass1 = false
            ,   pass2 = false;

            function callback1( storage ) {
                pass1 = true;
            };
            function callback2( storage ) {
                pass2 = true;
            };

            PreferencesManager.addPreferencesClient( "client1", callback1 );
            PreferencesManager.addPreferencesClient( "client2", callback2 );
            PreferencesManager.savePreferences();

            expect( pass1 && pass2 ).toBeTruthy();
        });

        it("should assign 'this' object in callback", function() {
            var pass = false;
            var thisObj = { prop : "value" };

            function callback( storage ) {
                pass = ( this.prop === "value" );
            };

            PreferencesManager.addPreferencesClient( CLIENT_ID, callback, thisObj );
            PreferencesManager.savePreferences();

            expect( pass ).toBeTruthy();
        });

        it("should register clients without duplicates", function() {
            var count = 0;

            function callback( storage ) {
                count++;
            };

            // register listener twice
            PreferencesManager.addPreferencesClient( CLIENT_ID, callback );
            PreferencesManager.addPreferencesClient( CLIENT_ID, callback );

            PreferencesManager.savePreferences();

            expect( count ).toEqual( 1 );
        });

        it("should use default preferences", function() {
            var pass = false
            ,   defaults = { prop : "default value" };

            PreferencesManager.addPreferencesClient( CLIENT_ID, function(){}, null, defaults );
            var prefs = PreferencesManager.getPreferences( CLIENT_ID );

            expect( prefs.prop ).toEqual( "default value" );
        });

        it("should return undefined prefs for unregistered clients", function() {
            var pass = ( undefined === PreferencesManager.getPreferences( CLIENT_ID ) );
            expect( pass ).toBeTruthy();
        });

        it("should fail when storing an invalid JSON object", function() {
            // define a callback that stores a function value
            function callback( storage ) {
                storage.badJSON = function(){};
            };

            PreferencesManager.addPreferencesClient( CLIENT_ID, callback );
            PreferencesManager.savePreferences();

            // get prefs and confirm badJSON was never persisted
            var actual = PreferencesManager.getPreferences( CLIENT_ID );
            
            expect( actual.badJSON ).toEqual( undefined );
        });

        it("should only write to preferences during save", function() {
            var fooUndefined = false
            ,   fooValue     = null;

            function callback( storage ) {
                // storage.foo should not exist
                if ( storage.foo === undefined ) {
                    fooUndefined = true;
                }
                else {
                    // record previous value of foo
                    fooUndefined = false;
                    fooValue = storage.foo;
                }

                storage.foo = "callback";
            };

            PreferencesManager.addPreferencesClient( CLIENT_ID, callback );

            // try to modify preferences outside of savePreferences
            var before = PreferencesManager.getPreferences( CLIENT_ID );
            before.foo = "before";

            // storage.foo = "callback"
            PreferencesManager.savePreferences();

            var after1 = PreferencesManager.getPreferences( CLIENT_ID );

            expect( fooUndefined ).toBeTruthy();
            expect( fooValue ).toEqual( null );
            expect( after1.foo ).toEqual( "callback" );

            // try to modify preferences copy from getPreferences()
            after1.foo = "after";

            // save again, storage.foo = "callback"
            PreferencesManager.savePreferences();

            var after2 = PreferencesManager.getPreferences( CLIENT_ID );

            // foo should still be callback, after1.foo = "after" as no effect
            expect( fooUndefined ).toBeFalsy();
            expect( fooValue ).toEqual( "callback" );
            expect( after2.foo ).toEqual( "callback" );
        });
    });
});