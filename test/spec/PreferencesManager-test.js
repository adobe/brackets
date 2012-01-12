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

        function initTestPreferences( data, newStorage ) {
            // mock persistent preference data to load
            var prefs = {};
            prefs[ CLIENT_ID ] = data;

            var storage = PreferencesManager._getStorage();
            storage.setItem( PreferencesManager._TEST_PREFERENCES_KEY, JSON.stringify( prefs ) );

            // init storage, update in-memory data
            PreferencesManager._initStorage( storage );
        };

        it("should load preferences from storage", function() {
            initTestPreferences( { test: "dummy data" } );

            var actual = PreferencesManager.getPreferences( CLIENT_ID );
            expect( actual.test ).toBe( "dummy data" );
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

        it("should throw an error when the client is not found", function() {
            var pass = false;

            try {
                PreferencesManager.getPreferences( CLIENT_ID );
            }
            catch ( err ) {
                pass = true;
            }

            expect( pass ).toBeTruthy();
        });

        it("should fail when storing an invalid JSON object", function() {
            function callback( storage ) {
                storage.badJSON = function(){};
            };

            // register listener twice
            PreferencesManager.addPreferencesClient( CLIENT_ID, callback );
            PreferencesManager.savePreferences();

            var actual = PreferencesManager.getPreferences( CLIENT_ID );

            expect( actual.badJSON ).toEqual( undefined );
        });
    });
});