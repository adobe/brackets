/*
 * Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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
/*global define, $ */

/**
 * Utilities for dealing with animations in the UI.
 */
define(function (require, exports, module) {
    "use strict";
    
    /**
     * Start an animation by adding the given class to the given target. When the
     * animation is complete, removes the class, clears the event handler we attach
     * to watch for the animation to finish, and resolves the returned promise.
     *
     * @param {Element} target The DOM node to animate.
     * @param {string} animClass The class that applies the animation/transition to the target.
     * @return {$.Promise} A promise that is resolved when the animation completes. Never rejected.
     */
    function animateUsingClass(target, animClass) {
        var result = new $.Deferred();
        
        function finish(e) {
            if (e.target === target) {
                $(target)
                    .removeClass(animClass)
                    .off("webkitTransitionEnd", finish);
                result.resolve();
            }
        }
        
        // Note that we can't just use $.one() here because we only want to remove
        // the handler when we get the transition end event for the correct target (not
        // a child).
        $(target)
            .addClass(animClass)
            .on("webkitTransitionEnd", finish);
        
        return result.promise();
    }
    
    exports.animateUsingClass = animateUsingClass;
});