/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/**
 * Utilities for managing pop-ups.
 */
define(function (require, exports, module) {
    "use strict";
    
    var EditorManager = require("editor/EditorManager");
    
    var _popUps = [];
        
    /**
     * Add Esc key handling for a popup DOM element.
     *
     * @param {!jQuery} $popUp jQuery object for the DOM element pop-up
     * @param {function} removeHandler Pop-up specific remove (e.g. display:none or DOM removal)
     * @param {?Boolean} autoAddRemove - Specify true to indicate the PopUpManager should 
     *      add/remove the popup from the DOM when the popup is open/closed. Specify false
     *      when the popup is either always persistant in the DOM or the add/remove is handled 
     *      external to the PopupManager 
     *      
     */
    function addPopUp($popUp, removeHandler, autoAddRemove) {
        autoAddRemove = autoAddRemove || false;
        
        _popUps.push($popUp[0]);
        $popUp.data("PopUpManager-autoAddRemove", autoAddRemove);
        $popUp.data("PopUpManager-removeHandler", removeHandler);
        
        if (autoAddRemove) {
            $(window.document.body).append($popUp);
        }
    }
    
    /**
     * Remove Esc key handling for a pop-up. Removes the pop-up from the DOM
     * if the pop-up is currently visible and was not originally attached.
     *
     * @param {!jQuery} $popUp
     */
    function removePopUp($popUp) {
        var index = _popUps.indexOf($popUp[0]);
        if (index >= 0) {
            var autoAddRemove = $popUp.data("PopUpManager-autoAddRemove"),
                removeHandler = $popUp.data("PopUpManager-removeHandler");
            
            if (removeHandler && $popUp.find(":visible").length > 0) {
                removeHandler();
            }
            
            if (autoAddRemove) {
                $popUp.remove();
                _popUps = _popUps.slice(index);
            }
        }
    }
    
    function _keydownCaptureListener(keyEvent) {
        if (keyEvent.keyCode !== 27) { // escape key
            return;
        }
        
        // allow the popUp to prevent closing
        var $popUp,
            i,
            event = new $.Event("popUpClose");
        
        for (i = _popUps.length - 1; i >= 0; i--) {
            $popUp = $(_popUps[i]);
            
            if ($popUp.find(":visible").length > 0) {
                $popUp.trigger(event);
                
                if (!event.isDefaultPrevented()) {
                    // Stop the DOM event from propagating
                    keyEvent.stopImmediatePropagation();
                    
                    removePopUp($popUp);
                    EditorManager.focusEditor();
                }
                
                break;
            }
        }
    }
    
    window.document.body.addEventListener("keydown", _keydownCaptureListener, true);
    
    exports.addPopUp        = addPopUp;
    exports.removePopUp     = removePopUp;
});