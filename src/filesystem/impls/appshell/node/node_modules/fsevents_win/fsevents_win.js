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
  
/* This implementation based on code originally written by
 *   (c) 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License
 *   https://github.com/phidelta/fsevents.git
 */

var util = require('util');
var events = require('events');

// link to native (C++) node_modules addon
var binding = require('./build/Release/fswatch_win');

module.exports = function(path) {
    // create node object and kick-off file watcher thread on this path
    var fsevents = new FSEvents(path);
    
    // process file change events emitted by node object
    fsevents.on('fsevent', function(path, action) {
        var info = {
            event:'unknown',
            path: path,
        };
        
        if (action === 1) {
            info.event = 'rename';
        } else {
            info.event = 'modified';
        }
                    
        fsevents.emit('change', path, info);
    });
        
    return fsevents;
};

var FSEvents = binding.FSEvents;
util.inherits(FSEvents, events.EventEmitter);