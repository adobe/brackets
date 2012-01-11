define(function(require, exports, module) {
    // Load dependent modules
    var PreferencesManager      = require("PreferencesManager")
    ,   SpecRunnerUtils         = require("./SpecRunnerUtils.js")
    ;

    var PREFERENCES_CLIENT_ID = "PreferencesManager-test";

    describe("PreferencesManager", function() {

        beforeEach(function() {
            // TODO (jasonsj): configure PreferencesManager for unit testing
            //                 localStorage will be the same for SpecRunner and
            //                 brackets/src (same origin).

            // keep default storage impl to restore after testing
            this.persistentStorage = PreferencesManager._getStorage();

            // reset session storage
            sessionStorage.clear();
        });

        afterEach(function() {
            // restore persistent storage
            PreferencesManager._setStorage( this.persistentStorage );
        });

        function initTestData() {
            // mock preferences
            var prefs = {};
            prefs[ PREFERENCES_CLIENT_ID ] = { test: "dummy data" };
            sessionStorage.setItem( PreferencesManager._PREFERENCES_KEY, JSON.stringify( prefs ) );
            PreferencesManager._setStorage( sessionStorage );
        };

        it("should load preferences from storage", function() {
            initTestData();

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