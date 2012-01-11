define(function(require, exports, module) {
    // Load dependent modules
    var PreferencesManager      = require("PreferencesManager")
    ,   SpecRunnerUtils         = require("./SpecRunnerUtils.js")
    ;

    var PREFERENCES_CLIENT_ID = "PreferencesManager-test";

    describe("PreferencesManager", function() {

        function initTestPreferences( data ) {
            // mock preferences
            var prefs = {};
            prefs[ PREFERENCES_CLIENT_ID ] = data;

            var storage = PreferencesManager._getStorage();
            storage.setItem( PreferencesManager._TEST_PREFERENCES_KEY, JSON.stringify( prefs ) );

            // init storage, update in-memory data
            PreferencesManager._initStorage( storage );
        };

        it("should load preferences from storage", function() {
            initTestPreferences( { test: "dummy data" } );

            var actual = PreferencesManager.getPreferences( PREFERENCES_CLIENT_ID );
            expect( actual.test ).toBe( "dummy data" );
        });

        it("should register clients", function() {

        });

        it("should register clients without duplicates", function() {

        });

        it("should use default preferences", function() {

        });

        it("should save preferences to localStorage", function() {

        });

        it("should get preferences from localStorage", function() {

        });

        it("should throw an error when the client is not found", function() {

        });

        it("should fail when storing an invalid JSON object", function() {

        });
    });
});