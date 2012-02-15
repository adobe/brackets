/*
 * Copyright 2011 Adobe Systems Incorporated. All Rights Reserved.
 */

/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4, maxerr: 50 */
/*global define: false, $: false */


define(function (require, exports, module) {
    'use strict';
    
    // var NativeFileSystem    = require("NativeFileSystem").NativeFileSystem,
    //     ProjectManager      = require("ProjectManager"),
    //     PreferencesManager  = require("PreferencesManager"),
    //     EditorUtils         = require("EditorUtils"),
    //     CommandManager      = require("CommandManager"),
    //     Commands  


    var _fileList = [];


    function buildFileTree (rootPath) {
		NativeFileSystem.requestNativeFileSystem(rootPath,
            function (rootEntry) {
                // Success!
                _projectRoot = rootEntry;
            },
            function (error){
            	// TODO
            }
        );
    }

    function _scanDirectory (dirEntry) {
		dirEntry.createReader().readEntries(
            function (entries) {
                for (entryI = 0; entryI < entries.length; entryI++) {
            		entry = entries[entryI];

            		if (entry.isFile) {
            			_fileList.push( { name: entry.name, entry: entry } );

            			console.log( entry: entry );
            		} else if(entry.IsDirectory) {
            			_scanDirectory(entry);
            		}
            	}
            },
            function (error) {
                // TODO
            }
        );
    }

    function findByFileName ( matcher ) {

    }

});