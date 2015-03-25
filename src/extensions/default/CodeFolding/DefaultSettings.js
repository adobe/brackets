/**
 * JSON values for default settings
 * @author Patrick Oladimeji
 * @date 8/23/14 15:45:35 PM
 */
/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, require, brackets, window */
define(function (require, exports, module) {
	"use strict";
    
	module.exports = {
		minFoldSize: 2,
		saveFoldStates: true,
		alwaysUseIndentFold: true,
		enableRegionFolding: true,
		fadeFoldButtons: false,
        maxFoldLevel: 2 // this value is only used when fold all is called
	};
});