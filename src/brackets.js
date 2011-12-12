/* TODO: copyright notice, etc. */

// Define core brackets namespace
brackets = {};

brackets.inBrowser = true;	// FIXME: check for Brackets API availability


$(document).ready(function() {
	var myCodeMirror = CodeMirror($('#editor').get(0), {
		value: 'var myResponse="Yes, it will be!"\n'
	});

	ProjectManager.loadProject("DummyProject");
});
