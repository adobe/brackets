define(function (require, exports, module) {
    "use strict";
    
    // Modules from the SpecRunner window
    var SpecRunnerUtils     = brackets.getModule("spec/SpecRunnerUtils"),
        Filesystem          = brackets.getModule("filesystem/FileSystem"),
        testHtmlContent     = require("text!unittest-files/test.html"),
        StringMatch         = brackets.getModule("utils/StringMatch"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        Document            = brackets.getModule("document/Document"),
        RelatedFiles        = require("main");
    
    var absPathPrefix = (brackets.platform === "win" ? "c:/" : "/");
    var testWindow, testDocument;
    
    var testObj = [
        [absPathPrefix + "_unitTestDummyPath_" + "/index.css", "index.css", "true", false],
        [absPathPrefix + "_unitTestDummyPath_" + "/css/bootstrap-4.0.0.css", "bootstrap-4.0.0.css", true, false],
        ["https://code.jquery.com/jquery-3.3.1.js", "code.jquery.com", false, true],
        ["http://www.google.com", "www.google.com", false, true]
    ];
    
    describe("RealtedFiles", function () {
        beforeEach(function () {
            SpecRunnerUtils.createTestWindowAndRun(this, function (w) {
            testWindow = w;
            });
            var mock = SpecRunnerUtils.createMockEditor(testHtmlContent, "html");
            testDocument = mock.doc;
        });
            
        afterEach(function () {
            SpecRunnerUtils.closeTestWindow();
            testWindow = null;
        });
        
        // Creates object for expected output of test.html file.
        function createExpetcedSearchResults() {
            var expectedFiles = [];
            
            for (var i = 0; i < testObj.length; i++){
                var searchResult = new StringMatch.SearchResult (testObj[i][0]);
                searchResult.fullPath = testObj[i][0];
                searchResult.label = testObj[i][1];
                searchResult.stringRanges = [{
                    text: testObj[i][0],
                    matched: false,
                    includesLastSegment: testObj[i][2],
                    includesFirstSegment: testObj[i][3]
                }];
                expectedFiles.push(searchResult);
            }
            
            return expectedFiles;
        }
        
        describe ("test parseHTML", function () {
            spyOn(DocumentManager, "getCurrentDocument").andReturn(testDocument);

            // Test to see if the given html (test.html) is parsed as expected. It compares the output of this file with expected output. 
            it("should parse given html", function() {
                var expectedOutput = createExpetcedSearchResults();
                var actualOutput = RelatedFiles.relatedFiles.getRelatedFiles();
                for (var i = 0; i < actualOutput.length; i++) {
                    expect(expectedOutput[i].fullPath).toBe(actualOutput[i].fullPath);
                    expect(expectedOutput[i].label).toBe(actualOutput[i].label);
                    expect(expectedOutput[i].stringRanges.text).toBe(actualOutput[i].stringRanges.text);
                    expect(expectedOutput[i].stringRanges.matched).toBe(actualOutput[i].stringRanges.matched);
                    expect(expectedOutput[i].stringRanges.includesLastSegment).toBe(actualOutput[i].stringRanges.includesLastSegment);
                    expect(expectedOutput[i].stringRanges.includesFirstSegment).toBe(actualOutput[i].stringRanges.includesFirstSegment);
                }
            });
        });   
    });
});