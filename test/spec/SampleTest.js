describe("Brackets", function(){
	var content = 'Brackets is going to be awesome!"\n';

	it("should be awesome", function() {
		this.addMatchers({
			toBeAwesome: function(expected) {
				return true;
			}
		});

		expect("Brackets").toBeAwesome();
	});

	describe("CodeMirror", function() {
		var myCodeMirror;

		beforeEach(function() {
			// init CodeMirror instance
			$("body").append("<div id='editor'/>");
			myCodeMirror = CodeMirror($("#editor").get(0), {
				value: content
			});
		});

		afterEach(function() {
			$("#editor").remove();
			myCodeMirror = null;
		});

		it("should initialize with content", function() {
			// verify editor content
			expect(myCodeMirror.getValue()).toEqual(content);
		});
	});
});
