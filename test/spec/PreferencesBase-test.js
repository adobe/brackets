/*
 * Copyright (c) 2013 - present Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*global describe, it, expect, beforeEach, afterEach, waitsFor, waitsForDone, runs, beforeFirst */
/*unittests: Preferences Base*/

define(function (require, exports, module) {
    'use strict';

    // Load dependent modules
    var PreferencesBase         = require("preferences/PreferencesBase"),
        FileSystem              = require("filesystem/FileSystem"),
        SpecRunnerUtils         = require("spec/SpecRunnerUtils"),
        _                       = require("thirdparty/lodash");

    var testPath = SpecRunnerUtils.getTestPath("/spec/PreferencesBase-test-files");

    describe("Preferences Base", function () {
        describe("Memory Storage", function () {
            it("should support get and save operations", function () {
                var sampleData = {
                    foo: 1,
                    bar: 2
                };

                var storage = new PreferencesBase.MemoryStorage(sampleData);

                // This storage is synchronous
                storage.load().then(function (data) {
                    expect(data).toEqual(sampleData);
                });

                storage.save({
                    foo: 3
                }).then(function () {
                    expect(storage.data).not.toEqual(sampleData);
                    expect(storage.data.foo).toEqual(3);
                    expect(storage.data.bar).not.toBeDefined();
                });
            });
        });

        describe("Path Layer", function () {
            it("handles a variety of glob patterns", function () {
                var data = {
                    "**.html": {
                        spaceUnits: 2
                    },
                    "lib/*.js": {
                        spaceUnits: 3
                    },
                    "lib/**.css": {
                        spaceUnits: 4
                    },
                    "*.{md,txt}": {
                        spaceUnits: 5
                    }
                };

                var layer = new PreferencesBase.PathLayer("/.brackets.json");

                expect(layer.get(data, "spaceUnits", {
                    path: "/public/index.html"
                })).toBe(2);

                expect(layer.get(data, "spaceUnits", {
                    path: "/lib/script.js"
                })).toBe(3);

                expect(layer.get(data, "spaceUnits", {
                    path: "/lib/foo/script.js"
                })).toBeUndefined();

                expect(layer.get(data, "spaceUnits", {
                    path: "/lib/foo/styles.css"
                })).toBe(4);

                expect(layer.get(data, "spaceUnits", {
                    path: "/README.md"
                })).toBe(5);

                expect(layer.get(data, "spaceUnits", {
                    path: "foo.js"
                })).toBeUndefined();
            });

            it("can retrieve the location of the pref value", function () {
                var data = {
                    "**.html": {
                        spaceUnits: 2
                    },
                    "lib/*.js": {
                        soaceUnits: 3
                    }
                };

                var layer = new PreferencesBase.PathLayer("/.brackets.json");
                expect(layer.getPreferenceLocation(data, "spaceUnits", {
                    path: "/foo.txt"
                })).toBeUndefined();

                expect(layer.getPreferenceLocation(data, "spaceUnits", {
                    path: "/index.html"
                })).toEqual("**.html");

                expect(layer.getPreferenceLocation(data, "spaceUnits", {
                    path: "/lib/brackets.js"
                })).toEqual("lib/*.js");
            });

            it("can set values in any of the patterns", function () {
                var data = {
                    "**.html": {
                        spaceUnits: 2
                    },
                    "lib/*.js": {
                        spaceUnits: 3
                    }
                };

                var originalData = _.clone(data, true);

                var layer = new PreferencesBase.PathLayer("/.brackets.json");
                expect(layer.set(data, "spaceUnits", 10, {
                    path: "/foo.txt"
                })).toBe(false);

                expect(data).toEqual(originalData);

                expect(layer.set(data, "spaceUnits", 11, {
                    path: "/index.html"
                })).toBe(true);
                expect(data).toEqual({
                    "**.html": {
                        spaceUnits: 11
                    },
                    "lib/*.js": {
                        spaceUnits: 3
                    }
                });

                expect(layer.set(data, "spaceUnits", 12, {
                    path: "/index.html"
                }, "lib/*.js")).toBe(true);

                expect(data).toEqual({
                    "**.html": {
                        spaceUnits: 11
                    },
                    "lib/*.js": {
                        spaceUnits: 12
                    }
                });

                expect(layer.set(data, "spaceUnits", 13, {}, "**.md")).toBe(true);
            });

            it("should not set the same value twice", function () {
                var data = {
                    "**.html": {
                        spaceUnits: 2
                    },
                    "lib/*.js": {
                        spaceUnits: 3
                    }
                };

                var layer = new PreferencesBase.PathLayer("/.brackets.json");

                expect(layer.set(data, "spaceUnits", 11, {
                    path: "/index.html"
                })).toBe(true);

                // Try to set the same value again.
                expect(layer.set(data, "spaceUnits", 11, {
                    path: "/index.html"
                })).toBe(false);

                expect(data).toEqual({
                    "**.html": {
                        spaceUnits: 11
                    },
                    "lib/*.js": {
                        spaceUnits: 3
                    }
                });
            });
        });

        describe("Language Layer", function () {

            it("returns the setting for the corresponding language", function () {
                var data = {
                    "html": {
                        spaceUnits: 2
                    },
                    "json": {
                        spaceUnits: 3
                    },
                    "css": {
                        spaceUnits: 4
                    },
                    "javascript": {
                        spaceUnits: 5
                    }
                };

                var layer = new PreferencesBase.LanguageLayer();

                expect(layer.get(data, "spaceUnits", {language: "html"})).toBe(2);

                expect(layer.get(data, "spaceUnits", {language: "json"})).toBe(3);

                expect(layer.get(data, "spaceUnits", {language: "javascript"})).toBe(5);

                expect(layer.get(data, "spaceUnits", {language: "cobol"})).toBeUndefined();

                expect(layer.get(data, "spaceUnits", {language: "css"})).toBe(4);

            });

            it("can retrieve the location of the pref value", function () {
                var data = {
                    "html": {
                        spaceUnits: 2
                    },
                    "javascript": {
                        spaceUnits: 3
                    }
                };

                var layer = new PreferencesBase.LanguageLayer();

                expect(layer.getPreferenceLocation(data, "spaceUnits", {language: "text"})).toBeUndefined();

                expect(layer.getPreferenceLocation(data, "spaceUnits", {language: "html"})).toEqual("html");

                expect(layer.getPreferenceLocation(data, "spaceUnits", {language: "javascript"})).toEqual("javascript");
            });

            it("can set values in any of the patterns", function () {
                var data = {
                    "html": {
                        spaceUnits: 2,
                        niceBooleanOption: true
                    },
                    "css": {
                        spaceUnits: 3
                    }
                };

                var originalData = _.clone(data, true);

                var layer = new PreferencesBase.LanguageLayer();

                expect(layer.set(data, "spaceUnits", 10, {}, "javascript")).toBe(true);

                expect(data).toEqual({
                    "html": {
                        spaceUnits: 2,
                        niceBooleanOption: true
                    },
                    "css": {
                        spaceUnits: 3
                    },
                    "javascript": {
                        spaceUnits: 10
                    }
                });

                expect(layer.set(data, "spaceUnits", undefined, {}, "javascript")).toBe(true);
                expect(data).toEqual(originalData);

                expect(layer.set(data, "spaceUnits", 11, {}, "html")).toBe(true);
                expect(data).toEqual({
                    "html": {
                        spaceUnits: 11,
                        niceBooleanOption: true
                    },
                    "css": {
                        spaceUnits: 3
                    }
                });

                expect(layer.set(data, "spaceUnits", 12, {language: "css"})).toBe(true);
                expect(data).toEqual({
                    "html": {
                        spaceUnits: 11,
                        niceBooleanOption: true
                    },
                    "css": {
                        spaceUnits: 12
                    }
                });

                expect(layer.set(data, "niceBooleanOption", false, {language: "html"})).toBe(true);
                expect(data).toEqual({
                    "html": {
                        spaceUnits: 11,
                        niceBooleanOption: false
                    },
                    "css": {
                        spaceUnits: 12
                    }
                });

                expect(layer.set(data, "niceBooleanOption", undefined, {language: "html"})).toBe(true);
                expect(layer.set(data, "niceBooleanOption", false, {language: "css"}, "css")).toBe(true);
                expect(layer.set(data, "niceBooleanOption", undefined, {language: "javascript"}, "javascript")).toBe(false);
                expect(layer.set(data, "niceBooleanOption", true, {language: "php"}, "php")).toBe(true);
                expect(data).toEqual({
                    "html": {
                        spaceUnits: 11
                    },
                    "css": {
                        spaceUnits: 12,
                        niceBooleanOption: false
                    },
                    "javascript": {

                    },
                    "php": {
                        niceBooleanOption: true
                    }
                });

            });

            it("should not set the same value twice", function () {
                var data = {
                    "html": {
                        spaceUnits: 2
                    },
                    "javascript": {
                        spaceUnits: 4
                    }
                };

                var layer = new PreferencesBase.LanguageLayer();

                expect(layer.set(data, "spaceUnits", 11, {}, "javascript")).toBe(true);

                // Try to set the same value again.
                expect(layer.set(data, "spaceUnits", 11, {}, "javascript")).toBe(false);

                // And again with the language set
                expect(layer.set(data, "spaceUnits", 11, {language: "javascript"})).toBe(false);

                expect(data).toEqual({
                    "html": {
                        spaceUnits: 2
                    },
                    "javascript": {
                        spaceUnits: 11
                    }
                });
            });
        });

        describe("Scope", function () {
            it("should look up a value", function () {
                var data = {
                    spaceUnits: 4,
                    useTabChar: false
                };

                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                // MemoryStorage operates synchronously
                scope.load();

                expect(scope.get("spaceUnits")).toBe(4);
                expect(scope.getKeys().sort()).toEqual(["spaceUnits", "useTabChar"].sort());
            });

            it("should not set the same value twice", function () {
                var data = {
                    spaceUnits: 4,
                    useTabChar: false
                };

                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                // MemoryStorage operates synchronously
                scope.load();

                expect(scope.get("spaceUnits")).toBe(4);

                expect(scope.set("spaceUnits", 12)).toBe(true);
                expect(scope._dirty).toBe(true);

                // Explicitly save it in order to clear dirty flag.
                scope.save();
                expect(scope._dirty).toBe(false);

                // Try to set the same value again and verify that the dirty flag is not set.
                expect(scope.set("spaceUnits", 12)).toBe(false);
                expect(scope.get("spaceUnits")).toBe(12);
                expect(scope._dirty).toBe(false);
            });

            it("should correctly handle changes on objects", function () {
                var foo = {
                    value: 42
                };

                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage()),
                    pm = new PreferencesBase.PreferencesSystem();

                // Explicitly create a PreferencesSystem and add the scope object to it
                // so that we can call set/get functions on the PreferencesSystem instead
                // of calling directly on scope object. Note that calling 'get' function on
                // scope object will not clone a preference object as it does in 'get' function
                // on PreferencesSystem object.
                pm.addScope("test", scope);

                // MemoryStorage operates synchronously
                scope.load();

                expect(pm.set("foo", foo).stored).toBe(true);

                expect(pm.get("foo").value).toBe(42);
                expect(scope._dirty).toBe(false);

                // Explicitly save it in order to clear dirty flag.
                pm.save();
                expect(scope._dirty).toBe(false);

                foo.value = "!!!";
                expect(foo.value).toBe("!!!");
                expect(pm.set("foo", foo, undefined, true).stored).toBe(true);
                expect(scope._dirty).toBe(true);
                pm.save();
                expect(scope._dirty).toBe(false);

                var fooCopyFromPref = pm.get("foo");
                expect(fooCopyFromPref.value).toBe("!!!");

                // Add 'bar' to our local copy and then
                // verify that our change is not in the pref.
                fooCopyFromPref.bar = "'bar' should not be in pref";
                expect(pm.get("foo").bar).toBe(undefined);
            });

            it("should remove the preference when setting it with 'undefined' value", function () {
                var data = {
                    spaceUnits: 0,
                    useTabChar: false
                };

                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                // MemoryStorage operates synchronously
                scope.load();

                expect(scope.get("spaceUnits")).toBe(0);

                // Remove 'spaceUnits' by calling set with 'undefined' second argument
                expect(scope.set("spaceUnits")).toBe(true);
                expect(scope._dirty).toBe(true);
                expect(scope.getKeys()).toEqual(["useTabChar"]);

                expect(scope.get("useTabChar")).toBe(false);

                // Remove 'useTabChar' by calling set with 'undefined' second argument
                expect(scope.set("useTabChar")).toBe(true);
                expect(scope._dirty).toBe(true);
                expect(scope.getKeys()).toEqual([]);
            });

            it("should look up a value with a path layer", function () {
                var data = {
                    spaceUnits: 4,
                    path: {
                        "src/*js": {
                            spaceUnits: 2
                        }
                    }
                };

                var layer = new PreferencesBase.PathLayer("/");
                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                scope.load();

                scope.addLayer(layer);

                expect(scope.get("path")).toBeUndefined();
                expect(scope.get("spaceUnits")).toBe(4);

                expect(scope.get("spaceUnits", {
                    path: "/src/foo.js"
                })).toBe(2);

                expect(scope.get("spaceUnits", {
                    path: "/top.js"
                })).toBe(4);
            });

            it("should look up a value using language layer", function () {
                var data = {
                    spaceUnits: 4,
                    language: {
                        html: {
                            spaceUnits: 2
                        },
                        javascript: {
                            someBooleanOption: false
                        }
                    }
                };
                var layer = new PreferencesBase.LanguageLayer();
                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                scope.load();

                expect(scope.get("language")).toBeDefined();

                scope.addLayer(layer);
                expect(scope.get("language")).toBeUndefined();

                expect(scope.get("spaceUnits")).toBe(4);
                expect(scope.get("spaceUnits", {language: "html"})).toBe(2);

                expect(scope.get("someBooleanOption", {language: "javascript"})).toBe(false);
            });

            it("can look up the location of a preference", function () {
                var data = {
                    spaceUnits: 4,
                    path: {
                        "src/*js": {
                            spaceUnits: 2
                        }
                    },
                    language: {
                        "cobol": {
                            spaceUnits: 5
                        }
                    }
                };

                var pathLayer = new PreferencesBase.PathLayer("/.brackets.json");
                var languageLayer = new PreferencesBase.LanguageLayer();
                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                scope.load();

                scope.addLayer(pathLayer);
                scope.addLayer(languageLayer);

                expect(scope.getPreferenceLocation("unknown")).toBeUndefined();
                expect(scope.getPreferenceLocation("path")).toBeUndefined();
                expect(scope.getPreferenceLocation("language")).toBeUndefined();
                expect(scope.getPreferenceLocation("spaceUnits")).toEqual({});

                expect(scope.getPreferenceLocation("spaceUnits", {
                    path: "/src/brackets.js"
                })).toEqual({
                    layer: "path",
                    layerID: "src/*js"
                });

                expect(scope.getPreferenceLocation("spaceUnits", {
                    path: "/index.md"
                })).toEqual({});

                expect(scope.getPreferenceLocation("spaceUnits", {language: "cobol"})).toEqual({
                    layer: "language",
                    layerID: "cobol"
                });
            });

            it("can set a preference at any layer", function () {
                var data = {
                    spaceUnits: 4,
                    path: {
                        "src/*js": {
                            spaceUnits: 2
                        },
                        "*.html": {
                            spaceUnits: 1
                        }
                    },
                    language: {
                        html: {
                            spaceUnits: 11,
                            niceBooleanOption: false
                        },
                        css: {
                            spaceUnits: 13
                        }
                    }
                };

                var pathLayer = new PreferencesBase.PathLayer("/.brackets.json");
                var languageLayer = new PreferencesBase.LanguageLayer();
                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                scope.load();

                scope.addLayer(pathLayer);
                scope.addLayer(languageLayer);

                expect(scope.set("spaceUnits", 5)).toBe(true);
                expect(data.spaceUnits).toBe(5);
                expect(scope._dirty).toBe(true);
                scope._dirty = false;

                expect(scope.set("spaceUnits", 6, {
                    path: "/src/brackets.js"
                })).toBe(true);
                expect(data.spaceUnits).toBe(5);
                expect(data.path["src/*js"].spaceUnits).toBe(6);
                expect(scope._dirty).toBe(true);
                scope._dirty = false;

                expect(scope.set("spaceUnits", 7, {
                    path: "/foo.md"
                }, {
                    layer: "path"
                })).toBe(false);
                expect(data.spaceUnits).toBe(5);
                expect(data.path["src/*js"].spaceUnits).toBe(6);
                expect(scope._dirty).toBe(false);

                expect(scope.set("spaceUnits", 8, { }, {
                    layer: "path",
                    layerID: "**.md"
                })).toBe(true);
                expect(data.spaceUnits).toBe(5);
                expect(data.path["src/*js"].spaceUnits).toBe(6);
                expect(data.path["**.md"].spaceUnits).toBe(8);
                expect(scope._dirty).toBe(true);

                scope._dirty = false;
                expect(scope.set("spaceUnits", 9, {
                    path: "index.html"
                }, { })).toBe(true);
                expect(data.spaceUnits).toBe(9);
                expect(data.path["*.html"].spaceUnits).toBe(1);
                expect(scope._dirty).toBe(true);

                expect(scope.set("spaceUnits", 12, {}, {
                    layer: "language",
                    layerID: "html"
                })).toBe(true);
                expect(data.spaceUnits).toBe(9);
                expect(data.path["*.html"].spaceUnits).toBe(1);
                expect(data.language.html.spaceUnits).toBe(12);
                expect(scope._dirty).toBe(true);

                expect(scope.set("spaceUnits", undefined, {}, {
                    layer: "language",
                    layerID: "css"
                })).toBe(true);
                expect(data.spaceUnits).toBe(9);
                expect(data.path["*.html"].spaceUnits).toBe(1);
                expect(data.language.html.spaceUnits).toBe(12);
                expect(data.language.css).toBeUndefined();
                expect(scope._dirty).toBe(true);

                expect(scope.set("spaceUnits", undefined, {}, {})).toBe(true);
                expect(data.spaceUnits).toBeUndefined();
                expect(Object.keys(data)).toEqual(["path", "language"]);

                expect(scope.set("spaceUnits", undefined, {}, {
                    layer: "path",
                    layerID: "*.html"
                })).toBe(true);
                expect(Object.keys(data.path["*.html"])).toEqual([]);

                expect(scope.get("niceBooleanOption", {language: "html"})).toBe(false);

            });

            it("can return its keys", function () {
                var data = {
                    spaceUnits: 4,
                    useEmojiForTabs: true,
                    path: {
                        "**.js": {
                            spaceUnits: 3,
                            showNonWhitespace: false
                        },
                        "README.md": {
                            markdown: false,
                            useEmojiForTabs: false
                        }
                    },
                    language: {
                        "html": {
                            niceHTMLOption: true
                        }
                    }
                };

                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                scope.addLayer(new PreferencesBase.PathLayer("/"));
                scope.addLayer(new PreferencesBase.LanguageLayer());
                scope.load();

                var keys = scope.getKeys();
                var expected = ["spaceUnits", "useEmojiForTabs", "showNonWhitespace", "markdown", "niceHTMLOption"];
                expect(keys.sort()).toEqual(expected.sort());

                keys = scope.getKeys({
                    path: "/coffeescript.ts"
                });
                expected = ["spaceUnits", "useEmojiForTabs"];
                expect(keys.sort()).toEqual(expected.sort());

                keys = scope.getKeys({
                    path: "/README.md"
                });
                expected = ["spaceUnits", "useEmojiForTabs", "markdown"];
                expect(keys.sort()).toEqual(expected.sort());

                keys = scope.getKeys({
                    path: "/test.js",
                    language: "html"
                });
                expected = ["spaceUnits", "useEmojiForTabs", "showNonWhitespace", "niceHTMLOption"];
                expect(keys.sort()).toEqual(expected.sort());
            });

            it("notifies of changes", function () {
                var data1 = {
                    spaceUnits: 4,
                    cursorSize: 27,
                    path: {
                        "**.js": {
                            statusBarElephants: false
                        }
                    }
                };

                var storage = new PreferencesBase.MemoryStorage(data1);
                var scope = new PreferencesBase.Scope(storage);
                scope.addLayer(new PreferencesBase.PathLayer("/"));
                scope.addLayer(new PreferencesBase.LanguageLayer());
                scope.load();

                var data2 = {
                    spaceUnits: 4,
                    path: {
                        "**.js": {
                            trafficLight: "green"
                        },
                        "**.md": {
                            statusBarElephants: true
                        }
                    },
                    language: {
                        javascript: {
                            niceBooleanOption: true
                        }
                    }
                };

                storage.data = data2;
                var events1 = [];
                scope.on("change", function (e, data) {
                    events1.push(data);
                });
                scope.load();

                expect(events1.length).toBe(1);
                expect(events1[0].ids.sort()).toEqual(
                    ["spaceUnits", "niceBooleanOption", "cursorSize", "statusBarElephants", "trafficLight"].sort()

                );
                var data3 = {
                    spaceUnits: 4,
                    path: {
                        "**.js": {
                            trafficLight: "green"
                        },
                        "**.md": {
                            statusBarElephants: true
                        }
                    },
                    language: {
                        html: {
                            spaceshipColor: "silver"
                        }
                    }
                };

                storage.data = data3;
                var events2 = [];
                scope.on("change", function (e, data) {
                    events2.push(data);
                });
                scope.load();

                expect(events2.length).toBe(1);
                expect(events2[0].ids.sort()).toEqual(["niceBooleanOption", "spaceUnits", "statusBarElephants", "trafficLight", "spaceshipColor"].sort());

            });
        });

        describe("PreferencesSystem", function () {
            it("should yield an error if a preference is redefined", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.definePreference("foo.bar", "string");
                try {
                    pm.definePreference("foo.bar", "string");
                    expect("We should have gotten an exception").toEqual("but we didn't");
                } catch (e) {
                }
            });


            it("will automatically wrap a Storage with a Scope", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.addScope("test", new PreferencesBase.MemoryStorage());
                pm.set("testval", 27);
                expect(pm.get("testval")).toBe(27);
            });

            it("should find the default values", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.definePreference("foo.bar", "number", 0);
                expect(pm.get("nonexistent")).toBeUndefined();
                expect(pm.get("foo.bar")).toBe(0);
            });

            it("should produce an error for setValue on undefined scope", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                expect(pm.set("foo", false, {
                    location: {
                        scope: "nonscope"
                    }
                }).stored).toBe(false);
            });

            it("supports nested scopes", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.definePreference("useTabChar", "boolean", false);
                pm.definePreference("tabSize", "number", 4);
                pm.definePreference("spaceUnits", "number", 4);
                var userScope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage());
                var projectScope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage());
                pm.addScope("user", userScope);
                pm.addScope("project", projectScope);

                expect(pm.get("spaceUnits")).toEqual(4);

                var userLocation = {
                    location: {
                        scope: "user"
                    }
                };
                pm.set("useTabChar", true, userLocation);
                pm.set("tabSize", 8, userLocation);
                pm.set("spaceUnits", 8, userLocation);
                pm.set("spaceUnits", 2, {
                    location: {
                        scope: "project"
                    }
                });

                expect(pm.get("spaceUnits")).toBe(2);
                expect(pm.get("useTabChar")).toBe(true);
                expect(pm.get("tabSize")).toBe(8);
            });

            it("handles asynchronously loaded scopes", function () {
                var storage1 = new PreferencesBase.MemoryStorage({
                    testKey: 1
                });

                var deferred1 = $.Deferred();
                storage1.load = function () {
                    return deferred1;
                };

                var storage2 = new PreferencesBase.MemoryStorage({
                    testKey: 2
                });

                var deferred2 = $.Deferred();
                storage2.load = function () {
                    return deferred2;
                };

                var pm = new PreferencesBase.PreferencesSystem();
                pm.definePreference("testKey", "number", 0);
                pm.addScope("storage1", new PreferencesBase.Scope(storage1), {
                    before: "storage2"
                });
                pm.addScope("storage2", new PreferencesBase.Scope(storage2), {
                    before: "default"
                });

                expect(pm.get("testKey")).toBe(0);

                deferred1.resolve(storage1.data);
                expect(pm.get("testKey")).toBe(0);

                deferred2.resolve(storage2.data);
                expect(pm.get("testKey")).toBe(1);
            });

            it("can notify of preference changes through set", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.definePreference("spaceUnits", "number", 4);
                pm.addScope("user", new PreferencesBase.MemoryStorage());
                var eventData;
                pm.on("change", function (e, data) {
                    eventData = data;
                });

                pm.set("testing", true);
                expect(eventData).toEqual({
                    ids: ["testing"]
                });

                eventData = undefined;
                pm.set("spaceUnits", 4);
                expect(eventData).toEqual({
                    ids: ["spaceUnits"]
                });
            });

            it("can notify of preference changes via scope changes and scope changes", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.definePreference("spaceUnits", "number", 4);

                var eventData = [],
                    scopeEvents = [];

                pm.on("change", function (e, data) {
                    eventData.push(data);
                });

                pm.on("scopeOrderChange", function (e, data) {
                    scopeEvents.push(data);
                });

                pm.addScope("user", new PreferencesBase.MemoryStorage({
                    spaceUnits: 4,
                    elephants: "charging"
                }));

                expect(pm._defaults.scopeOrder).toEqual(["user", "default"]);

                expect(eventData).toEqual([{
                    ids: ["spaceUnits", "elephants"]
                }]);

                expect(scopeEvents).toEqual([{
                    id: "user",
                    action: "added"
                }]);

                scopeEvents = [];
                eventData = [];
                pm.removeScope("user");
                expect(pm._defaults.scopeOrder).toEqual(["default"]);
                expect(eventData).toEqual([{
                    ids: ["spaceUnits", "elephants"]
                }]);

                expect(scopeEvents).toEqual([{
                    id: "user",
                    action: "removed"
                }]);
            });

            it("notifies when there are layer changes", function () {
                var pm = new PreferencesBase.PreferencesSystem();

                var data = {
                    spaceUnits: 4,
                    useTabChar: false,
                    path: {
                        "*.txt": {
                            spaceUnits: 2,
                            alpha: "bravo"
                        }
                    }
                };

                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage(data));
                pm.addScope("user", scope);

                var eventData = [];
                pm.on("change", function (e, data) {
                    eventData.push(data);
                });

                scope.addLayer(new PreferencesBase.PathLayer("/"));

                expect(eventData).toEqual([{
                    ids: ["spaceUnits", "alpha"]
                }]);

                // Extra verification that layer keys works correctly
                var keys = scope._layers[0].getKeys(scope.data.path, {
                    path: "/bar.md"
                });

                expect(keys).toEqual([]);
                keys = scope._layers[0].getKeys(scope.data.path, {
                    path: "/foo.txt"
                });
                expect(keys.sort()).toEqual(["spaceUnits", "alpha"].sort());

                expect(pm.get("spaceUnits")).toBe(4);
                expect(pm.get("spaceUnits", {path: "/foo.txt"})).toBe(2);

                eventData = [];
                pm.signalContextChanged({path: "/README.md"}, {path: "/README.txt"});
                expect(eventData).toEqual([{
                    ids: ["spaceUnits", "alpha"]
                }]);

                eventData = [];
                pm.signalContextChanged({path: "/foo.txt"}, {path: "/README.txt"});
                expect(eventData).toEqual([]);

                // Test to make sure there are no exceptions when there is no path data
                delete data.path;
                scope.load();
                expect(scope.data).toEqual(data);
            });

            it("can notify changes for single preference objects", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                var pref = pm.definePreference("spaceUnits", "number", 4);
                var retrievedPref = pm.getPreference("spaceUnits");
                expect(retrievedPref).toBe(pref);
                var changes = 0;
                pref.on("change", function (e) {
                    changes++;
                });
                var newScope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage({
                    spaceUnits: 2
                }));
                pm.addScope("new", newScope);
                expect(changes).toEqual(1);

                pref.off("change");
                pm.set("spaceUnits", 10, {
                    location: {
                        scope: "new"
                    }
                });
                expect(changes).toEqual(1);

                changes = 0;
                pm.on("change", "spaceUnits", function () {
                    changes++;
                });
                pm.set("spaceUnits", 11, {
                    location: {
                        scope: "new"
                    }
                });
                expect(changes).toEqual(1);
            });

            it("can pause and resume broadcast of events", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.addScope("user", new PreferencesBase.MemoryStorage());
                pm.pauseChangeEvents();

                var spaceUnitChanges = 0,
                    fooChanges = 0,
                    globalChangeMessages = [];
                pm.definePreference("spaceUnits", "number", 4).on("change", function () {
                    spaceUnitChanges++;
                });
                pm.definePreference("foo", "string", "bar").on("change", function () {
                    fooChanges++;
                });
                pm.on("change", function (e, data) {
                    globalChangeMessages.push(data);
                });

                pm.set("spaceUnits", 8);
                pm.set("foo", "baz");
                expect(spaceUnitChanges).toBe(0);
                expect(fooChanges).toBe(0);
                expect(globalChangeMessages).toEqual([]);

                pm.resumeChangeEvents();
                expect(spaceUnitChanges).toBe(1);
                expect(fooChanges).toBe(1);
                expect(globalChangeMessages).toEqual([{
                    ids: ["spaceUnits", "foo"]
                }]);

                pm.set("foo", "zippy");
                expect(fooChanges).toBe(2);
            });

            it("can dynamically modify the default scope order", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.addScope("user", new PreferencesBase.MemoryStorage({
                    spaceUnits: 1
                }));
                pm.addScope("project", new PreferencesBase.MemoryStorage({
                    spaceUnits: 2
                }));
                pm.addScope("session", new PreferencesBase.MemoryStorage());
                expect(pm.get("spaceUnits")).toBe(2);
                expect(pm._defaults.scopeOrder).toEqual(["session", "project", "user", "default"]);

                var eventData = [];
                pm.on("change", function (e, data) {
                    eventData.push(data);
                });
                pm.removeFromScopeOrder("project");
                expect(pm._defaults.scopeOrder).toEqual(["session", "user", "default"]);
                expect(eventData).toEqual([{
                    ids: ["spaceUnits"]
                }]);

                expect(pm.get("spaceUnits")).toBe(1);
                expect(pm.get("spaceUnits", {
                    scopeOrder: ["session", "project", "user", "default"]
                })).toBe(2);

                eventData = [];
                pm.addToScopeOrder("project", "user");
                expect(pm._defaults.scopeOrder).toEqual(["session", "project", "user", "default"]);
                expect(eventData).toEqual([{
                    ids: ["spaceUnits"]
                }]);
                expect(pm.get("spaceUnits")).toBe(2);
            });

            it("can set preference values at any level", function () {
                var pm = new PreferencesBase.PreferencesSystem(),
                    pref = pm.definePreference("spaceUnits", "number", 4),
                    user = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage()),
                    project = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage({
                        path: {
                            "**.html": {
                                spaceUnits: 2
                            }
                        }
                    })),
                    session = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage());

                project.addLayer(new PreferencesBase.PathLayer("/"));
                pm.addScope("user", user);
                pm.addScope("project", project);
                pm.addScope("session", session);

                var changes = 0;
                pref.on("change", function (e) {
                    changes++;
                });

                expect(pm.set("spaceUnits", 5, {
                    location: {
                        scope: "doesNotExist"
                    }
                }).stored).toBe(false);
                expect(pm.get("spaceUnits")).toBe(4);
                expect(changes).toBe(0);
                expect(pm.getPreferenceLocation("spaceUnits")).toEqual({
                    scope: "default"
                });

                expect(pm.set("spaceUnits", 6).stored).toBe(true);
                expect(user.data).toEqual({
                    spaceUnits: 6
                });
                expect(changes).toBe(1);

                expect(pm.set("spaceUnits", 7).stored).toBe(true);
                expect(user.data).toEqual({
                    spaceUnits: 7
                });
                expect(changes).toBe(2);

                expect(pm.set("spaceUnits", 8, {
                    location: {
                        scope: "session"
                    }
                }).stored).toBe(true);
                expect(user.data).toEqual({
                    spaceUnits: 7
                });
                expect(session.data).toEqual({
                    spaceUnits: 8
                });
                expect(changes).toBe(3);

                expect(pm.set("spaceUnits", 9).stored).toBe(true);
                expect(changes).toBe(4);
                expect(session.data).toEqual({
                    spaceUnits: 9
                });

                expect(pm.set("spaceUnits", undefined, {
                    location: {
                        scope: "session"
                    }
                }).stored).toBe(true);
                expect(changes).toBe(5);
                expect(session.data.spaceUnits).toBeUndefined();
                expect(pm.get("spaceUnits")).toBe(7);
                expect(Object.keys(session.data)).toEqual([]);

                pm.signalContextChanged({}, {path: "/index.html"});
                expect(changes).toBe(6);
                expect(pm.get("spaceUnits", {path: "/index.html"})).toBe(2);
                expect(pm.set("spaceUnits", 10, {context: {path: "/index.html"}}).stored).toBe(true);
                expect(changes).toBe(7);
                expect(project.data.path["**.html"].spaceUnits).toBe(10);

                pm.signalContextChanged({path: "/index.html"}, {path: "/foo.txt"});
                expect(pm.getPreferenceLocation("spaceUnits")).toEqual({
                    scope: "user"
                });
                expect(pm.set("spaceUnits", 11, {
                    location: {
                        scope: "project"
                    }
                }).stored).toBe(true);
                expect(pm.getPreferenceLocation("spaceUnits")).toEqual({
                    scope: "project"
                });
                expect(pm.set("spaceUnits", 12).stored).toBe(true);
                expect(project.data.spaceUnits).toBe(12);

                expect(pm.set("spaceUnits", 13, {
                    location: {
                        scope: "project",
                        layer: "path",
                        layerID: "**.js"
                    }
                }).stored).toBe(true);
                expect(pm.getPreferenceLocation("spaceUnits")).toEqual({
                    scope: "project"
                });

                expect(pm.getPreferenceLocation("spaceUnits", {
                    path: "/Gruntfile.js"
                })).toEqual({
                    scope: "project",
                    layer: "path",
                    layerID: "**.js"
                });
                expect(pm.get("spaceUnits", {
                    path: "/Gruntfile.js"
                })).toBe(13);
            });

            it("supports removal of scopes", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                var events = [];
                pm.on("change", function (e, data) {
                    events.push(data);
                });

                pm.addScope("first", new PreferencesBase.MemoryStorage({
                    spaceUnits: 1
                }));
                pm.addScope("second", new PreferencesBase.MemoryStorage({
                    spaceUnits: 2
                }));

                events = [];
                expect(pm.get("spaceUnits")).toBe(2);
                pm.removeScope("second");
                expect(pm.get("spaceUnits")).toBe(1);
                expect(events).toEqual([
                    {
                        ids: ["spaceUnits"]
                    }
                ]);
            });

            it("can provide an automatically prefixed version of itself", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                var scope = new PreferencesBase.Scope(new PreferencesBase.MemoryStorage());
                pm.addScope("user", scope);
                pm.set("spaceUnits", 10);
                pm.set("linting.enabled", true);

                var prefixedPM = pm.getPrefixedSystem("linting");
                prefixedPM.definePreference("collapsed", "boolean", true);
                var events = [];

                prefixedPM.on("change", function (e, data) {
                    events.push(data);
                });

                expect(prefixedPM.get("spaceUnits")).toBeUndefined();
                expect(prefixedPM.getPreferenceLocation("spaceUnits")).toBeUndefined();
                expect(prefixedPM.get("enabled")).toBe(true);
                expect(prefixedPM.getPreferenceLocation("enabled")).toEqual({
                    scope: "user"
                });

                // set the value with doNotSave set. Will check to verify that save did not occur.
                prefixedPM.set("collapsed", false, undefined, true);

                expect(events).toEqual([{
                    ids: ["collapsed"]
                }]);

                expect(prefixedPM.get("collapsed")).toBe(false);

                // verify that the scope was not saved automatically
                expect(scope._dirty).toBe(true);
                expect(pm.get("collapsed")).toBeUndefined();
                expect(pm.get("linting.collapsed")).toBe(false);

                var pref = prefixedPM.getPreference("collapsed");
                expect(pref).toBeDefined();
                expect(pm.getPreference("linting.collapsed")).toBeDefined();

                var prefEvents = 0;
                pref.on("change", function (e, data) {
                    prefEvents += 1;
                });

                events = [];
                prefixedPM.set("collapsed", true);

                expect(prefEvents).toBe(1);
                expect(events.length).toBe(1);

                var saveDone = false;
                prefixedPM.save().done(function () {
                    saveDone = true;
                });

                expect(saveDone).toBe(true);
            });

            it("should support validator to ignore invalid values", function () {
                var pm = new PreferencesBase.PreferencesSystem();
                pm.addScope("user", new PreferencesBase.MemoryStorage());
                pm.definePreference("spaceUnits", "number", 4, {
                    validator: function (value) {
                        return (value >= 0 && value <= 10);
                    }
                });

                expect(pm.set("spaceUnits", 12).valid).toBe(false); // fail: out-of-range upper
                expect(pm.get("spaceUnits")).toBe(4);               // expect default

                expect(pm.set("spaceUnits", -1).valid).toBe(false); // fail: out-of-range lower
                expect(pm.get("spaceUnits")).toBe(4);               // expect default
            });

            it("should handle context normalization", function () {
                var normalizer = function (context) {
                    if (typeof context === "string") {
                        return {
                            scopeOrder: [context]
                        };
                    }
                    return context;
                };

                var pm = new PreferencesBase.PreferencesSystem(normalizer);
                pm.addScope("user", new PreferencesBase.MemoryStorage({
                    value: 1
                }));
                pm.addScope("session", new PreferencesBase.MemoryStorage({
                    value: 2
                }));
                expect(pm.get("value")).toBe(2);

                // Test passing in a string for the get context
                expect(pm.get("value", "user")).toBe(1);

                // This will set in the scope in which the value was set. Without a context,
                // that means "session".
                pm.set("value", 3);
                expect(pm.get("value")).toBe(3);
                expect(pm.get("value", "user")).toBe(1);

                // Now, set with a context. This should cause the value to be set in "user"
                // scope.
                pm.set("value", 4, {
                    context: "user"
                });
                expect(pm.get("value")).toBe(3);
                expect(pm.get("value", "user")).toBe(4);

                expect(pm.getPreferenceLocation("value").scope).toBe("session");
                expect(pm.getPreferenceLocation("value", "user").scope).toBe("user");
            });
        });

        describe("File Storage", function () {
            var settingsFile      = FileSystem.getFileForPath(testPath + "/.brackets.json"),
                newSettingsFile   = FileSystem.getFileForPath(testPath + "/new.prefs"),
                emptySettingsFile = FileSystem.getFileForPath(testPath + "/empty.json"),
                filestorage,
                originalText;

            beforeFirst(function () {
                var deferred = $.Deferred();
                settingsFile.read({}, function (err, text) {
                    if (err) {
                        deferred.reject(err);
                        return;
                    }
                    originalText = text;
                    deferred.resolve();
                });
                waitsForDone(deferred.promise());
            });

            beforeEach(function () {
                filestorage = new PreferencesBase.FileStorage(settingsFile.fullPath);
            });

            afterEach(function () {
                var deferred = $.Deferred();
                settingsFile.write(originalText, {}, function (err) {
                    if (err) {
                        deferred.reject(err);
                    } else {
                        deferred.resolve();
                    }
                });
                waitsForDone(deferred.promise());

                var deleted = false;
                runs(function () {
                    newSettingsFile.unlink(function () {
                        deleted = true;
                    });
                });
                waitsFor(function () {
                    return deleted;
                });
            });

            it("can load preferences from disk", function () {
                var filestorage = new PreferencesBase.FileStorage(settingsFile.fullPath);
                var pm = new PreferencesBase.PreferencesSystem();
                var projectScope = new PreferencesBase.Scope(filestorage);
                waitsForDone(pm.addScope("project", projectScope));
                runs(function () {
                    projectScope.addLayer(new PreferencesBase.PathLayer("/"));
                    expect(pm.get("spaceUnits")).toBe(9);

                    expect(pm.get("spaceUnits", {
                        scopeOrder: ["project"],
                        path: "/foo.go"
                    })).toBe(7);
                });
            });

            it("can validate preferences loaded from disk", function () {
                var filestorage = new PreferencesBase.FileStorage(settingsFile.fullPath);
                var pm = new PreferencesBase.PreferencesSystem();
                var projectScope = new PreferencesBase.Scope(filestorage);
                waitsForDone(pm.addScope("project", projectScope));
                runs(function () {
                    projectScope.addLayer(new PreferencesBase.PathLayer("/"));
                    pm.definePreference("spaceUnits", "number", 3, {
                        validator: function (value) {
                            return (value >= 0 && value <= 8);
                        }
                    });
                    // Value on disk (9) is out-of-range, so expect default (3)
                    expect(pm.get("spaceUnits")).toBe(3);
                });
            });

            it("can save preferences", function () {
                var filestorage = new PreferencesBase.FileStorage(settingsFile.fullPath);
                var pm = new PreferencesBase.PreferencesSystem();
                var projectScope = new PreferencesBase.Scope(filestorage);
                waitsForDone(pm.addScope("project", projectScope));
                runs(function () {
                    var memstorage = new PreferencesBase.MemoryStorage();
                    pm.addScope("session", new PreferencesBase.Scope(memstorage));
                    pm.set("unicorn-filled", true, {
                        location: {
                            scope: "session"
                        }
                    });
                    pm.set("unicorn-filled", false, {
                        location: {
                            scope: "project"
                        }
                    });
                    waitsForDone(pm.save());
                    runs(function () {
                        expect(memstorage.data["unicorn-filled"]).toBe(true);
                    });
                });
            });

            it("can create a new pref file", function () {
                var filestorage = new PreferencesBase.FileStorage(newSettingsFile.fullPath, true);
                var pm = new PreferencesBase.PreferencesSystem();
                var newScope = new PreferencesBase.Scope(filestorage);
                waitsForDone(pm.addScope("new", newScope), "adding scope");
                runs(function () {
                    pm.set("unicorn-filled", true, {
                        location: {
                            scope: "new"
                        }
                    });
                    expect(pm.get("unicorn-filled")).toBe(true);

                    waitsForDone(pm.save(), "saving prefs");

                    var deferred = $.Deferred();
                    runs(function () {
                        newSettingsFile.exists(function (err, exists) {
                            if (err || !exists) {
                                deferred.reject(err);
                            } else {
                                deferred.resolve();
                            }
                        });
                    });

                    waitsForDone(deferred.promise(), "checking file");
                });

            });

            it("can load preferences later", function () {
                var filestorage = new PreferencesBase.FileStorage();
                var pm = new PreferencesBase.PreferencesSystem();
                var newScope = new PreferencesBase.Scope(filestorage);
                newScope.addLayer(new PreferencesBase.PathLayer("/"));
                var changes = [];
                waitsForDone(pm.addScope("new", newScope), "adding scope");
                pm.on("change", function (change, data) {
                    changes.push(data);
                });
                runs(function () {
                    expect(pm.get("spaceUnits")).toBeUndefined();
                    filestorage.setPath(settingsFile.fullPath);
                });
                waitsFor(function () {
                    return changes.length > 0;
                });
                runs(function () {
                    expect(pm.get("spaceUnits")).toBe(9);
                    expect(changes).toEqual([{
                        ids: ["spaceUnits"]
                    }]);
                });
            });

            it("is fine with empty preferences files", function () {
                var filestorage = new PreferencesBase.FileStorage(emptySettingsFile.fullPath),
                    promise = filestorage.load();

                waitsForDone(promise, "loading empty JSON file");
                runs(function () {
                    promise.then(function (data) {
                        expect(data).toEqual({});
                    });
                });
            });
        });
    });
});
