BracketsTest = TestCase("BracketsTest");

BracketsTest.prototype.testCodeMirrorInit = function() {
	// add #editor to document
	/*:DOC += <div id="editor"/> */

	// init CodeMirror instance
	var content = 'Brackets is going to be awesome!"\n';
	var myCodeMirror = CodeMirror($('#editor').get(0), {
		value: content
	});

	// verify editor content
	assertEquals(content, myCodeMirror.getValue());

	// print to console
	jstestdriver.console.log("CodeMirror.getValue() = ", myCodeMirror.getValue());
};