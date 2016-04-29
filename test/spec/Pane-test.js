/*
 * Copyright (c) 2014 - present Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, describe, it, expect, beforeEach, afterEach, $, jasmine, spyOn */

define(function (require, exports, module) {
    'use strict';

    var Pane = require("view/Pane").Pane;

    describe("Pane", function () {
        var myPane,
            myView,
            $container = $("<div>");

        function createMockPane(name) {
            return new Pane(name, $container);
        }
        function createTestPane() {
            myPane = createMockPane("test-pane");
        }

        function createMockView(name) {
            var $view = $("<div>");
            return {
                $el: $view,
                file: {
                    fullPath: name
                },
                getFullPath : function () {
                    return this.file.fullPath;
                },
                getFile: function () {
                    return this.file;
                },
                updateLayout: function (hint) {
                },
                destroy: function () {
                },
                getScrollPos: function () {
                    return "1234";
                },
                adjustScrollPos: function () {
                },
                getViewState: function () {
                },
                notifyContainerChange: function () {
                },
                notifyVisibilityChange: function (visible) {
                    this._visible = visible;
                },
                markPaneId: function (id) {
                    this._paneId = id;
                }

            };
        }

        function createTestView() {
            myView = createMockView("test-view");
        }


        beforeEach(function () {
            createTestPane();
            createTestView();
        });

        afterEach(function () {
            myPane.destroy();
            myPane = null;
            myView = null;
            expect($container.contents().length).toEqual(0);
        });

        describe("Basic Pane Attributes", function () {
            it("should have an id", function () {
                expect(myPane.id).toEqual("test-pane");
            });
            it("should have an element", function () {
                expect(myPane.$el.length).toEqual(1);
                expect($container.find(myPane.$el).length).toEqual(1);
            });
            it("should not allow you to change the id", function () {
                myPane.id = "junk";
                expect(myPane.id).toEqual("test-pane");
            });
        });
        describe("View management", function () {
            beforeEach(function () {
                myPane.addView(myView);
            });
            it("should be added to pane's view map", function () {
                expect(myPane._views[myView.getFullPath()]).toEqual(myView);
            });
            it("should show a view", function () {
                spyOn(myView, "notifyVisibilityChange").andCallThrough();
                spyOn(myView, "getFile").andCallThrough();
                spyOn(myView, "updateLayout");

                myPane.showView(myView);

                expect(myView.notifyVisibilityChange).toHaveBeenCalled();
                expect(myView.updateLayout).toHaveBeenCalled();
                expect(myView.getFile).toHaveBeenCalled();
                expect(myView._visible).toBeTruthy();
            });
            it("should report currents", function () {
                myPane.showView(myView);
                expect(myPane._currentView).toEqual(myView);
                expect(myPane.getCurrentlyViewedFile()).toEqual(myView.getFile());
                expect(myPane.getCurrentlyViewedPath()).toEqual(myView.getFullPath());
            });
            it("should report whether or not view is needed", function () {
                expect(myPane._isViewNeeded(myView)).toBeFalsy();
                myPane.showView(myView);
                expect(myPane._isViewNeeded(myView)).toBeTruthy();
            });
            it("should not show interstitial page after showing a view", function () {
                myPane.showView(myView);
                expect(myPane.$el.find(".not-editor").css("display")).toEqual("none");
            });
            it("should destroy a view", function () {
                spyOn(myView, "destroy");

                myPane.showView(myView);
                myPane._reset();

                expect(Object.keys(myPane._views).length).toBe(0);
                expect(myView.destroy).toHaveBeenCalled();
            });
            it("should show interstitial page when no view is displayed", function () {
                expect(myPane.$el.find(".not-editor").css("display")).toBeFalsy();

                myPane.showView(myView);
                expect(myPane.$el.find(".not-editor").css("display")).toEqual("none");

                myPane._reset();
                expect(myPane.$el.find(".not-editor").css("display")).toBeFalsy();
            });
            it("should destroy view when new view is added", function () {
                var secondView = createMockView("second-view");
                spyOn(myView, "destroy");

                myPane.addView(secondView);
                myPane.showView(myView);
                myPane.showView(secondView);

                expect(myView.destroy).toHaveBeenCalled();
            });
            it("should remove view when file is deleted", function () {
                spyOn(myView, "destroy");
                myPane.showView(myView);
                myPane._handleFileDeleted(undefined, myView.getFullPath());

                expect(myView.destroy).toHaveBeenCalled();
                expect(myPane.$el.find(".not-editor").css("display")).toBeFalsy();
            });
            it("should rename view map entry when file is renamed", function () {
                myPane._handleFileNameChange(undefined, myView.getFullPath(), "xxxx");
                expect(myPane._views.xxxx).toEqual(myView);
            });
            it("should swap view container when pane is merged with another", function () {
                var secondView = createMockView("second-view"),
                    secondPane = createMockPane("second-pane");

                spyOn(secondView, "notifyContainerChange");
                spyOn(secondView, "destroy");

                myPane.addToViewList(myView.getFile());

                secondPane.addToViewList(secondView.getFile());
                secondPane.addView(secondView);

                myPane.showView(myView);
                secondPane.showView(secondView);

                myPane.mergeFrom(secondPane);
                expect(secondView.notifyContainerChange).toHaveBeenCalled();
                expect(secondView.destroy).not.toHaveBeenCalled();

                secondPane.destroy();
            });
            it("should destroy temporary views when merging panes", function () {
                var secondView = createMockView("second-view"),
                    secondPane = createMockPane("second-pane");

                spyOn(secondView, "destroy");

                myPane.addToViewList(myView.getFile());

                secondPane.addView(secondView);

                myPane.showView(myView);
                secondPane.showView(secondView);

                myPane.mergeFrom(secondPane);
                expect(secondView.destroy).toHaveBeenCalled();

                secondPane.destroy();
            });
            it("should interstitial page after merging", function () {
                var secondView = createMockView("second-view"),
                    secondPane = createMockPane("second-pane");

                myPane.addToViewList(myView.getFile());

                secondPane.addView(secondView);

                myPane.showView(myView);
                secondPane.showView(secondView);

                myPane.mergeFrom(secondPane);
                expect(secondPane.$el.find(".not-editor").css("display")).toBeFalsy();

                secondPane.destroy();
            });
            it("should hide current view when merging", function () {
                var secondView = createMockView("second-view"),
                    secondPane = createMockPane("second-pane");

                myPane.addToViewList(myView.getFile());

                secondPane.addToViewList(secondView.getFile());
                secondPane.addView(secondView);

                myPane.addView(myView, true);
                secondPane.addView(secondView, true);

                spyOn(secondPane, "_setViewVisibility");

                myPane.mergeFrom(secondPane);

                expect(secondPane._setViewVisibility).toHaveBeenCalled();
                expect(secondPane._setViewVisibility.calls[0].args[0]).toBe(secondView);
                expect(secondPane._setViewVisibility.calls[0].args[1]).toBeFalsy();

                secondPane.destroy();
            });
            it("should not switch views when adding another view", function () {
                var secondView = createMockView("second-view");

                myPane.showView(myView);
                myPane.addView(secondView);
                expect(myPane._currentView).toEqual(myView);
            });
            it("should switch views when removing view", function () {
                spyOn(myPane, "_execOpenFile").andCallFake(function (fullPath) {
                    myPane.showView(myPane._views[fullPath]);
                    return new $.Deferred().resolve().promise();
                });

                var secondView = createMockView("second-view");

                myPane.addToViewList(myView.getFile());
                myPane.addToViewList(secondView.getFile());
                myPane.addView(secondView);

                myPane.showView(myView);
                myPane.showView(secondView);

                myPane.removeView(secondView.getFile());
                expect(myPane._currentView).toEqual(myView);
            });
            it("should show interstitial when showing the next file fails", function () {
                spyOn(myPane, "_execOpenFile").andCallFake(function (fullPath) {
                    return new $.Deferred().reject().promise();
                });

                var secondView = createMockView("second-view");

                spyOn(myPane, "_hideCurrentView").andCallThrough();
                spyOn(myPane, "showInterstitial").andCallThrough();

                myPane.addToViewList(myView.getFile());
                myPane.addToViewList(secondView.getFile());
                myPane.addView(secondView);

                myPane.showView(myView);
                myPane.showView(secondView);

                myPane.removeView(secondView.getFile());
                expect(myPane._currentView).toEqual(null);
                // should be called twice --
                //  the second time to show the interstitial due to the removal
                expect(myPane.showInterstitial.calls[1].args[0]).toBeTruthy();
                expect(myPane._hideCurrentView).toHaveBeenCalled();
                expect(myPane._views.hasOwnProperty(secondView.getFile().fullPath)).toBeFalsy();
            });
            it("should not switch views when removing view", function () {
                spyOn(myPane, "_execOpenFile");

                var secondView = createMockView("second-view");

                myPane.addToViewList(myView.getFile());
                myPane.addToViewList(secondView.getFile());
                myPane.addView(secondView);

                myPane.showView(myView);
                myPane.showView(secondView);

                myPane.removeView(secondView.getFile(), true);
                expect(myPane._currentView).toEqual(null);
                expect(myPane._execOpenFile).not.toHaveBeenCalled();
            });
            it("should hide view when switching views", function () {
                var secondView = createMockView("second-view");

                myPane.addToViewList(myView.getFile());
                myPane.addToViewList(secondView.getFile());
                myPane.addView(secondView);

                myPane.showView(myView);
                myPane.showView(secondView);

                expect(myView._visible).toBeFalsy();
            });
        });
        describe("List Management", function () {
            it("should get added to all lists", function () {
                myPane.addToViewList(myView.getFile());

                expect(myPane._viewList.length).toEqual(1);
                expect(myPane._viewListAddedOrder.length).toEqual(1);
                expect(myPane._viewListMRUOrder.length).toEqual(1);
            });
            it("should get removed from all lists", function () {
                myPane.addToViewList(myView.getFile());
                myPane.addView(myView);
                myPane.showView(myView);
                myPane.removeView(myView.getFile());

                expect(myPane._viewList.length).toEqual(0);
                expect(myPane._viewListAddedOrder.length).toEqual(0);
                expect(myPane._viewListMRUOrder.length).toEqual(0);
                expect(myPane._views[myView.getFullPath()]).toBeFalsy();
            });
            it("should add all items to the list", function () {
                var secondView = createMockView("second-view");

                myPane.addListToViewList([myView.getFile(), secondView.getFile()]);

                expect(myPane._viewList.length).toEqual(2);
                expect(myPane._viewListAddedOrder.length).toEqual(2);
                expect(myPane._viewListMRUOrder.length).toEqual(2);
            });
            it("should remove all items to the list", function () {
                var secondView = createMockView("second-view");

                myPane.addListToViewList([myView.getFile(), secondView.getFile()]);
                myPane.removeViews([myView.getFile(), secondView.getFile()]);

                expect(myPane._viewList.length).toEqual(0);
                expect(myPane._viewListAddedOrder.length).toEqual(0);
                expect(myPane._viewListMRUOrder.length).toEqual(0);
            });
            it("should walk MRU list in order", function () {
                var i,
                    previous,
                    views = [],
                    files = [];

                for (i = 0; i < 5; i++) {
                    views[i] = createMockView("view/" + i.toString());
                    files[i] = views[i].getFile();
                }

                myPane.addListToViewList(files);

                for (i = 0; i < 5; i++) {
                    previous = myPane.traverseViewListByMRU(1, previous && previous.fullPath);
                    expect(previous.fullPath).toEqual("view/" + i.toString());
                }

                var order = [1, 3, 4, 2, 0];

                for (i = 0; i < order.length; i++) {
                    myPane.makeViewMostRecent(files[order[i]]);
                }

                for (previous = undefined, i = order.length; i > 0; i--) {
                    previous = myPane.traverseViewListByMRU(1, previous && previous.fullPath);
                    expect(previous).toEqual(files[order[i - 1]]);
                }
            });
            it("should swap indices", function () {
                var i,
                    views = [],
                    files = [];

                for (i = 0; i < 5; i++) {
                    views[i] = createMockView("view/" + i.toString());
                    files[i] = views[i].getFile();
                }

                myPane.addListToViewList(files);

                myPane.swapViewListIndexes(0, 4);
                myPane.swapViewListIndexes(1, 3);

                var order = [4, 3, 2, 1, 0];

                for (i = 0; i < order.length; i++) {
                    expect(myPane._viewList[i]).toEqual(files[order[i]]);
                }
            });
            it("should maintain order", function () {
                var i,
                    views = [],
                    files = [];

                for (i = 0; i < 5; i++) {
                    views[i] = createMockView("view/" + i.toString());
                    files[i] = views[i].getFile();
                }

                myPane.addListToViewList(files);

                var order = [1, 3, 4, 2, 0];

                for (i = 0; i < order.length; i++) {
                    myPane.makeViewMostRecent(files[order[i]]);
                }

                myPane.swapViewListIndexes(0, 4);
                myPane.swapViewListIndexes(1, 3);

                files.reverse();

                for (i = 0; i < files.length; i++) {
                    expect(myPane._viewListAddedOrder[i]).toEqual(files[i]);
                }
            });
        });
        describe("Dispatch events", function () {
            beforeEach(function () {
                myPane.addView(myView);
            });
            it("should dispatch events when a file is removed", function () {
                var eventHandler = jasmine.createSpy();

                myPane.on("viewListChange.test", eventHandler);

                myPane.addToViewList(myView.getFile());
                myPane.showView(myView);
                myPane._handleFileDeleted(undefined, myView.getFullPath());

                expect(eventHandler).toHaveBeenCalled();
                myPane.off(".test");
            });
            it("should dispatch events when file is renamed", function () {
                var eventHandler = jasmine.createSpy();

                myPane.on("viewListChange.test", eventHandler);

                myPane.addToViewList(myView.getFile());
                myPane.showView(myView);

                var oldPath = myView.getFullPath();
                myView.file.fullPath = "xxxx";

                myPane._handleFileNameChange(undefined, oldPath, myView.getFullPath());

                expect(eventHandler).toHaveBeenCalled();
                myPane.off(".test");
            });
            it("should dispatch events when the view has changed", function () {
                var eventHandler = jasmine.createSpy();

                myPane.on("currentViewChange.test", eventHandler);

                myPane.addToViewList(myView.getFile());
                myPane.showView(myView);

                expect(eventHandler).toHaveBeenCalled();
                myPane.off(".test");
            });
            it("should dispatch events when all views are closed", function () {
                var eventHandler = jasmine.createSpy();

                myPane.on("currentViewChange.test", eventHandler);

                myPane.addToViewList(myView.getFile());
                myPane.showView(myView);
                myPane._reset();

                expect(eventHandler.callCount).toBe(2);
                myPane.off(".test");
            });
        });
    });
});

