/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache */

/*
 * UI for the Find/Replace and Find in Files modal bar.
 */
define(function (require, exports, module) {
    "use strict";
    
    var _                  = require("thirdparty/lodash"),
        EventDispatcher    = require("utils/EventDispatcher"),
        Commands           = require("command/Commands"),
        KeyBindingManager  = require("command/KeyBindingManager"),
        KeyEvent           = require("utils/KeyEvent"),
        ModalBar           = require("widgets/ModalBar").ModalBar,
        PreferencesManager = require("preferences/PreferencesManager"),
        MainViewManager    = require("view/MainViewManager"),
        Strings            = require("strings"),
        ViewUtils          = require("utils/ViewUtils"),
        FindUtils          = require("search/FindUtils"),
        HealthLogger       = require("utils/HealthLogger");
    
    /**
     * @private
     * The template we use for all Find bars.
     * @type {string}
     */
    var _searchBarTemplate = require("text!htmlContent/findreplace-bar.html");
    
    var lastTypedTime = 0,
        currentTime = 0,
        intervalId = 0,
        lastQueriedText = "",
        lastTypedText = "",
        lastKeyCode;

    /**
     * @constructor
     * Find Bar UI component, used for both single- and multi-file find/replace. This doesn't actually
     * create and add the FindBar to the DOM - for that, call open().
     *
     * Dispatches these events:
     *
     * - queryChange - when the user types in the input field or sets a query option. Use getQueryInfo()
     *      to get the current query state.
     * - doFind - when the user chooses to do a Find Previous or Find Next.
     *      Parameters are:
     *          shiftKey - boolean, false for Find Next, true for Find Previous
     * - doReplace - when the user chooses to do a single replace. Use getReplaceText() to get the current replacement text.
     * - doReplaceAll - when the user chooses to initiate a Replace All. Use getReplaceText() to get the current replacement text.
     *-  close - when the find bar is closed
     *
     * @param {boolean=} options.multifile - true if this is a Find/Replace in Files (changes the behavior of Enter in
     *      the fields, hides the navigator controls, shows the scope/filter controls, and if in replace mode, hides the
     *      Replace button (so there's only Replace All)
     * @param {boolean=} options.replace - true to show the Replace controls - default false
     * @param {string=}  options.queryPlaceholder - label to show in the Find field - default empty string
     * @param {string=}  options.initialQuery - query to populate in the Find field on open - default empty string
     * @param {string=}  scopeLabel - HTML label to show for the scope of the search, expected to be already escaped - default empty string
     */
    function FindBar(options) {
        var defaults = {
            multifile: false,
            replace: false,
            queryPlaceholder: "",
            initialQuery: "",
            initialReplaceText: "",
            scopeLabel: ""
        };
        this._options = _.extend(defaults, options);
        this._closed = false;
        this._enabled = true;
        this.lastQueriedText = "";
        this.lastTypedText = "";
    }
    EventDispatcher.makeEventDispatcher(FindBar.prototype);
    
    /*
     * Global FindBar functions for making sure only one is open at a time.
     */
    
    // TODO: this is temporary - we should do this at the ModalBar level, but can't do that until
    // we land the simplified Quick Open UI (#7227) that eliminates some asynchronicity in closing
    // its ModalBar.
    
    /**
     * @private
     * Register a find bar so we can close it later if another one tries to open.
     * Note that this is a global function, not an instance function.
     * @param {!FindBar} findBar The find bar to register.
     */
    FindBar._addFindBar = function (findBar) {
        FindBar._bars = FindBar._bars || [];
        FindBar._bars.push(findBar);
    };
    
    /**
     * @private
     * Remove a find bar from the list.
     * Note that this is a global function, not an instance function.
     * @param {FindBar} findBar The bar to remove.
     */
    FindBar._removeFindBar = function (findBar) {
        if (FindBar._bars) {
            _.pull(FindBar._bars, findBar);
        }
    };
    
    /**
     * @private
     * Close all existing find bars. In theory there should be only one, but since there can be
     * timing issues due to animation we maintain a list.
     * Note that this is a global function, not an instance function.
     */
    FindBar._closeFindBars = function () {
        var bars = FindBar._bars;
        if (bars) {
            bars.forEach(function (bar) {
                bar.close(true, false);
            });
            bars = [];
        }
    };
    
    /*
     * Instance properties/functions
     */
    
    /**
     * @private
     * Options passed into the FindBar.
     * @type {!{multifile: boolean, replace: boolean, queryPlaceholder: string, initialQuery: string, scopeLabel: string}}
     */
    FindBar.prototype._options = null;
    
    /**
     * @private
     * Whether the FindBar has been closed.
     * @type {boolean}
     */
    FindBar.prototype._closed = false;
    
    /**
     * @private
     * Whether the FindBar is currently enabled.
     * @type {boolean}
     */
    FindBar.prototype._enabled = true;
    
    /** 
     * @private
     * @type {?ModalBar} Modal bar containing this find bar's UI
     */
    FindBar.prototype._modalBar = null;
    
    /**
     * @private
     * Returns the jQuery object for an element in this Find bar.
     * @param {string} selector The selector for the element.
     * @return {jQueryObject} The jQuery object for the element, or an empty object if the Find bar isn't yet
     *      in the DOM or the element doesn't exist.
     */
    FindBar.prototype.$ = function (selector) {
        if (this._modalBar) {
            return $(selector, this._modalBar.getRoot());
        } else {
            return $();
        }
    };
    
    // TODO: change IDs to classes
    
    /**
     * @private
     * Set the state of the toggles in the Find bar to the saved prefs state.
     */
    FindBar.prototype._updateSearchBarFromPrefs = function () {
        // Have to make sure we explicitly cast the second parameter to a boolean, because
        // toggleClass expects literal true/false.
        this.$("#find-case-sensitive").toggleClass("active", !!PreferencesManager.getViewState("caseSensitive"));
        this.$("#find-regexp").toggleClass("active", !!PreferencesManager.getViewState("regexp"));
    };
    
    /**
     * @private
     * Save the prefs state based on the state of the toggles.
     */
    FindBar.prototype._updatePrefsFromSearchBar = function () {
        PreferencesManager.setViewState("caseSensitive", this.$("#find-case-sensitive").is(".active"));
        PreferencesManager.setViewState("regexp",        this.$("#find-regexp").is(".active"));
    };
    
    /**
     * @private
     * Shows the keyboard shortcut for the given command in the element's tooltip.
     * @param {jQueryObject} $elem The element to add the shortcut to.
     * @param {string} commandId The ID for the command whose keyboard shortcut to show.
     */
    FindBar.prototype._addShortcutToTooltip = function ($elem, commandId) {
        var replaceShortcut = KeyBindingManager.getKeyBindings(commandId)[0];
        if (replaceShortcut) {
            var oldTitle = $elem.attr("title");
            oldTitle = (oldTitle ? oldTitle + " " : "");
            $elem.attr("title", oldTitle + "(" + KeyBindingManager.formatKeyDescriptor(replaceShortcut.displayKey) + ")");
        }
    };

    /**
     * Opens the Find bar, closing any other existing Find bars.
     */
    FindBar.prototype.open = function () {
        var self = this;
        
        // Normally, creating a new Find bar will simply cause the old one to close
        // automatically. This can cause timing issues because the focus change might
        // cause the new one to think it should close, too. So we simply explicitly
        // close the old Find bar (with no animation) before creating a new one. 
        // TODO: see note above - this will move to ModalBar eventually.
        FindBar._closeFindBars();
        if (this._options.multifile) {
            HealthLogger.searchDone(HealthLogger.SEARCH_NEW);
        }
        
        var templateVars = _.clone(this._options);
        templateVars.Strings = Strings;
        templateVars.replaceAllLabel = (templateVars.multifile ? Strings.BUTTON_REPLACE_ALL_IN_FILES : Strings.BUTTON_REPLACE_ALL);
        
        this._modalBar = new ModalBar(Mustache.render(_searchBarTemplate, templateVars), true);  // 2nd arg = auto-close on Esc/blur
        
        // When the ModalBar closes, clean ourselves up.
        this._modalBar.on("close", function (event) {
            // Hide error popup, since it hangs down low enough to make the slide-out look awkward
            self.showError(null);
            self._modalBar = null;
            self._closed = true;
            window.clearInterval(intervalId);
            intervalId = 0;
            lastTypedTime = 0;
            FindBar._removeFindBar(self);
            MainViewManager.focusActivePane();
            self.trigger("close");
        });
        
        FindBar._addFindBar(this);
        
        var $root = this._modalBar.getRoot();
        $root
            .on("input", "#find-what", function () {
                self.trigger("queryChange");
                lastTypedText = self.getQueryInfo().query;
            })
            .on("click", "#find-case-sensitive, #find-regexp", function (e) {
                $(e.currentTarget).toggleClass("active");
                self._updatePrefsFromSearchBar();
                self.trigger("queryChange");
                if (self._options.multifile) {  //instant search
                    self.trigger("doFind");
                }
            })
            .on("keydown", "#find-what, #replace-with", function (e) {
                lastTypedTime = new Date().getTime();
                lastKeyCode = e.keyCode;
                var executeSearchIfNeeded = function () {
                    // We only do instant search via node.
                    if (FindUtils.isNodeSearchDisabled() || FindUtils.isInstantSearchDisabled()) {
                        // we still keep the intrval timer up as instant search could get enabled/disabled based on node busy state
                        return;
                    }
                    if (self._closed) {
                        return;
                    }
                    currentTime = new Date().getTime();
                    if (lastTypedTime && (currentTime - lastTypedTime >= 100) && self.getQueryInfo().query !==  lastQueriedText &&
                            !FindUtils.isNodeSearchInProgress()) {
                        // init Search
                        if (self._options.multifile) {
                            if ($(e.target).is("#find-what")) {
                                if (!self._options.replace) {
                                    HealthLogger.searchDone(HealthLogger.SEARCH_INSTANT);
                                    self.trigger("doFind");
                                    lastQueriedText = self.getQueryInfo().query;
                                }
                            }
                        }
                    }
                };
                if (intervalId === 0) {
                    intervalId = window.setInterval(executeSearchIfNeeded, 50);
                }
                if (e.keyCode === KeyEvent.DOM_VK_RETURN) {
                    e.preventDefault();
                    e.stopPropagation();
                    lastQueriedText = self.getQueryInfo().query;
                    if (self._options.multifile) {
                        if ($(e.target).is("#find-what")) {
                            if (self._options.replace) {
                                // Just set focus to the Replace field.
                                self.focusReplace();
                            } else {
                                HealthLogger.searchDone(HealthLogger.SEARCH_ON_RETURN_KEY);
                                // Trigger a Find (which really means "Find All" in this context).
                                self.trigger("doFind");
                            }
                        } else {
                            HealthLogger.searchDone(HealthLogger.SEARCH_REPLACE_ALL);
                            self.trigger("doReplaceAll");
                        }
                    } else {
                        // In the single file case, we just want to trigger a Find Next (or Find Previous
                        // if Shift is held down).
                        self.trigger("doFind", e.shiftKey);
                    }
                }
            });
        
        if (!this._options.multifile) {
            this._addShortcutToTooltip($("#find-next"), Commands.CMD_FIND_NEXT);
            this._addShortcutToTooltip($("#find-prev"), Commands.CMD_FIND_PREVIOUS);
            $root
                .on("click", "#find-next", function (e) {
                    self.trigger("doFind", false);
                })
                .on("click", "#find-prev", function (e) {
                    self.trigger("doFind", true);
                });
        }
        
        if (this._options.replace) {
            this._addShortcutToTooltip($("#replace-yes"), Commands.CMD_REPLACE);
            $root
                .on("click", "#replace-yes", function (e) {
                    self.trigger("doReplace");
                })
                .on("click", "#replace-all", function (e) {
                    self.trigger("doReplaceAll");
                })
                // One-off hack to make Find/Replace fields a self-contained tab cycle
                // TODO: remove once https://trello.com/c/lTSJgOS2 implemented
                .on("keydown", function (e) {
                    if (e.keyCode === KeyEvent.DOM_VK_TAB && !e.ctrlKey && !e.metaKey && !e.altKey) {
                        if (e.target.id === "replace-with" && !e.shiftKey) {
                            self.$("#find-what").focus();
                            e.preventDefault();
                        } else if (e.target.id === "find-what" && e.shiftKey) {
                            self.$("#replace-with").focus();
                            e.preventDefault();
                        }
                    }
                });
        }
        
        if (this._options.multifile && FindUtils.isIndexingInProgress()) {
            this.showIndexingSpinner();
        }

        // Set up the initial UI state.
        this._updateSearchBarFromPrefs();
        this.focusQuery();
    };

    /**
     * Closes this Find bar. If already closed, does nothing.
     * @param {boolean} suppressAnimation If true, don't do the standard closing animation. Default false.
     */
    FindBar.prototype.close = function (suppressAnimation) {
        if (this._modalBar) {
            // 1st arg = restore scroll pos; 2nd arg = no animation, since getting replaced immediately
            this._modalBar.close(true, !suppressAnimation);
        }
    };
    
    /**
     * @return {boolean} true if this FindBar has been closed.
     */
    FindBar.prototype.isClosed = function () {
        return this._closed;
    };
    
    /**
     * @return {Object} The options passed into the FindBar.
     */
    FindBar.prototype.getOptions = function () {
        return this._options;
    };
    
    /**
     * Returns the current query and parameters.
     * @return {{query: string, caseSensitive: boolean, isRegexp: boolean}}
     */
    FindBar.prototype.getQueryInfo = function () {
        return {
            query:           this.$("#find-what").val() || "",
            isCaseSensitive: this.$("#find-case-sensitive").is(".active"),
            isRegexp:        this.$("#find-regexp").is(".active")
        };
    };
    
    /**
     * Show or clear an error message related to the query.
     * @param {?string} error The error message to show, or null to hide the error display.
     * @param {boolean=} isHTML Whether the error message is HTML that should remain unescaped.
     */
    FindBar.prototype.showError = function (error, isHTML) {
        var $error = this.$(".error");
        if (error) {
            if (isHTML) {
                $error.html(error);
            } else {
                $error.text(error);
            }
            $error.show();
        } else {
            $error.hide();
        }
    };
    
    /**
     * Set the find count.
     * @param {string} count The find count message to show. Can be the empty string to hide it.
     */
    FindBar.prototype.showFindCount = function (count) {
        this.$("#find-counter").text(count);
    };
    
    /**
     * Show or hide the no-results indicator and optional message. This is also used to
     * indicate regular expression errors.
     * @param {boolean} showIndicator
     * @param {boolean} showMessage
     */
    FindBar.prototype.showNoResults = function (showIndicator, showMessage) {
        ViewUtils.toggleClass(this.$("#find-what"), "no-results", showIndicator);
        
        var $msg = this.$(".no-results-message");
        if (showMessage) {
            $msg.show();
        } else {
            $msg.hide();
        }
    };
    
    /**
     * Returns the current replace text.
     * @return {string}
     */
    FindBar.prototype.getReplaceText = function () {
        return this.$("#replace-with").val() || "";
    };
    
    /**
     * Enables or disables the controls in the Find bar. Note that if enable is true, *all* controls will be
     * re-enabled, even if some were previously disabled using enableNavigation() or enableReplace(), so you
     * will need to refresh their enable state after calling this.
     * @param {boolean} enable Whether to enable or disable the controls.
     */
    FindBar.prototype.enable = function (enable) {
        this.$("#find-what, #replace-with, #find-prev, #find-next, #find-case-sensitive, #find-regexp").prop("disabled", !enable);
        this._enabled = enable;
    };
    
    FindBar.prototype.focus = function (enable) {
        this.$("#find-what").focus();
    };
    
    /**
     * @return {boolean} true if the FindBar is enabled.
     */
    FindBar.prototype.isEnabled = function () {
        return this._enabled;
    };
    
    /**
     * @return {boolean} true if the Replace button is enabled.
     */
    FindBar.prototype.isReplaceEnabled = function () {
        return this.$("#replace-yes").is(":enabled");
    };
    
    /**
     * Enable or disable the navigation controls if present. Note that if the Find bar is currently disabled
     * (i.e. isEnabled() returns false), this will have no effect.
     * @param {boolean} enable Whether to enable the controls.
     */
    FindBar.prototype.enableNavigation = function (enable) {
        if (this.isEnabled()) {
            this.$("#find-prev, #find-next").prop("disabled", !enable);
        }
    };
    
    /**
     * Enable or disable the replace controls if present. Note that if the Find bar is currently disabled
     * (i.e. isEnabled() returns false), this will have no effect.
     * @param {boolean} enable Whether to enable the controls.
     */
    FindBar.prototype.enableReplace = function (enable) {
        if (this.isEnabled) {
            this.$("#replace-yes, #replace-all").prop("disabled", !enable);
        }
    };

    /**
     * @private
     * Focus and select the contents of the given field.
     * @param {string} selector The selector for the field.
     */
    FindBar.prototype._focus = function (selector) {
        this.$(selector)
            .focus()
            .get(0).select();
    };
    
    /**
     * Sets focus to the query field and selects its text.
     */
    FindBar.prototype.focusQuery = function () {
        this._focus("#find-what");
    };
    
    /**
     * Sets focus to the replace field and selects its text.
     */
    FindBar.prototype.focusReplace = function () {
        this._focus("#replace-with");
    };
    
    /**
     * The indexing spinner is usually shown when node is indexing files
     */
    FindBar.prototype.showIndexingSpinner = function () {
        this.$("#indexing-spinner").removeClass("forced-hidden");
    };

    FindBar.prototype.hideIndexingSpinner = function () {
        this.$("#indexing-spinner").addClass("forced-hidden");
    };

    /**
     * Force a search again
     */
    FindBar.prototype.redoInstantSearch = function () {
        this.trigger("doFind");
    };

    /**
     * Gets you the right query and replace text to prepopulate the Find Bar.
     * @static
     * @param {?FindBar} currentFindBar The currently open Find Bar, if any
     * @param {?Editor} The active editor, if any
     * @return {query: string, replaceText: string} Query and Replace text to prepopulate the Find Bar with
     */
    FindBar.getInitialQuery = function (currentFindBar, editor) {
        var query = lastTypedText,
            replaceText = "";

        /*
         * Returns the string used to prepopulate the find bar
         * @param {!Editor} editor
         * @return {string} first line of primary selection to populate the find bar
         */
        function getInitialQueryFromSelection(editor) {
            var selectionText = editor.getSelectedText();
            if (selectionText) {
                return selectionText
                    .replace(/^\n*/, "") // Trim possible newlines at the very beginning of the selection
                    .split("\n")[0];
            }
            return "";
        }

        if (currentFindBar && !currentFindBar.isClosed()) {
            // The modalBar was already up. When creating the new modalBar, copy the
            // current query instead of using the passed-in selected text.
            query = currentFindBar.getQueryInfo().query;
            replaceText = currentFindBar.getReplaceText();
        } else {
            var openedFindBar = FindBar._bars && _.find(FindBar._bars, function (bar) {
                    return !bar.isClosed();
                });

            if (openedFindBar) {
                query = openedFindBar.getQueryInfo().query;
                replaceText = openedFindBar.getReplaceText();
            } else if (editor) {
                query = getInitialQueryFromSelection(editor) || lastTypedText;
            }
        }

        return {query: query, replaceText: replaceText};
    };

    PreferencesManager.stateManager.definePreference("caseSensitive", "boolean", false);
    PreferencesManager.stateManager.definePreference("regexp", "boolean", false);
    PreferencesManager.convertPreferences(module, {"caseSensitive": "user", "regexp": "user"}, true);
    
    exports.FindBar = FindBar;
});
