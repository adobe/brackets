/*
// LEAN-MDN is a node application that gets data from MDN website via JSON requests
// and formats it into a new, more lean JSON structure.
// Type 'node app' to run the application.
// Generated documents are located in /json
*/

var fs 		= require("fs");
var request	= require("request");

//File names for output
var MDN_CSS_DOC_FILENAME = "css";
var MDN_HTML_DOC_FILENAME = "html";

//Language setting to retrieve localized, ex "/en-US", blank for default
var DOC_LANG = "";

//Links to MDN pages
var MDN_URL 			= "https://developer.mozilla.org/en-US/";
var MDN_HTML_DOC_URL 	= "https://developer.mozilla.org" + DOC_LANG + "/docs/Web/HTML/Element$children?expand";
var MDN_CSS_DOC_URL 	= "https://developer.mozilla.org" + DOC_LANG + "/docs/Web/CSS$children?expand";

//JSON object to put newly constructed data

function generate(url, filename) {
	var docData = {};
	console.log("Fetching and constructing " + filename + " documentation...");
	request(url, function(error, response, body){
		if(!error && response.statusCode == 200){
			var rawData = JSON.parse(body).subpages;

			for(var i = 0; i < rawData.length; i++) {
				var obj = rawData[i];
				
				docData[obj.title] = {
					"URL": obj.url,
					"SUMMARY": obj.summary
				};
			}
		}
		fs.writeFile("../../" + filename + ".json", JSON.stringify(docData, null, 0), function(err){
			console.log(filename + ".json has been written.")
		});
	});
}

generate(MDN_HTML_DOC_URL, MDN_HTML_DOC_FILENAME);
generate(MDN_CSS_DOC_URL, MDN_CSS_DOC_FILENAME);
