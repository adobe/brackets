define(function(require, exports, module) {   
    
    // Load dependent modules
    var CommandManager      // loaded from brackets.test
    ,   Commands            // loaded from brackets.test
    ,   DocumentManager     // loaded from brackets.test
	,	ProjectManager		// loaded from brackets.test
	,	WorkingSetView		// loaded from brackets.test
    ,   SpecRunnerUtils     = require("./SpecRunnerUtils.js");
    ;
    
    
    // FIXME (jasonsj): these tests are ommitted when launching in the main app window
    if (window.opener) {

        beforeEach(function() {
    //        this.app = window.open(SpecRunnerUtils.getBracketsSourceRoot() + "/index.html");
            // TODO: this will only work if run from the main Brackets window (not from jasmine.sh)
            this.app = window.opener;
            
            // Load module instances from brackets.test
            CommandManager      = this.app.brackets.test.CommandManager;
            Commands            = this.app.brackets.test.Commands;
            DocumentManager     = this.app.brackets.test.DocumentManager;
			WorkingSetView		= this.app.brackets.test.WorkingSetView;
            ProjectManager	    = this.app.brackets.test.ProjectManager;            
            
            this.app.location.reload();
            this.testPath = SpecRunnerUtils.getTestPath("/spec/WorkingSetView-test-files/");
            var isReady = false;
            $(this.app.document).ready(function() {
                isReady = true;
            });
            waitsFor(function() { return isReady; }, 5000);
			
			var didOpen = false, gotError = false;

			// Open a directory
			ProjectManager.loadProject(this.testPath);
			
			var openAndMakeDirty = function (path){
				// open file
	            runs(function() {
	                CommandManager.execute(Commands.FILE_OPEN, path)
	                    .done(function() { didOpen = true; })
	                    .fail(function() { gotError = true; });
	            });
	            waitsFor(function() { return didOpen && !gotError; }, "FILE_OPEN on file timeout", 1000);

				// change editor content to make doc dirty
	            runs(function() {
	                var editor = DocumentManager.getCurrentDocument()._editor;
	                editor.setValue("dirty document");
	                expect(DocumentManager.getCurrentDocument().isDirty).toBe(true);
	            });
			
			};
			
			openAndMakeDirty(this.testPath + "/file_one.js");
			openAndMakeDirty(this.testPath + "/file_two.js");
			
        });

    describe("WorkingSetView", function(){

		it("should add a list item when a file is dirtied", function() {			
			// check if files are added to work set and dirty icons are present
			runs(function() {
				var listItems = this.app.$("#open-files-container").children("ul").children();
				expect( listItems.length ).toBe(2);
				expect( listItems.find("a").get(0).text == "file_one.js" ).toBeTruthy();
				expect( listItems.find(".file-status-icon").length).toBe(2);
			});
			
		});
		
		it("should remove a list item when a file is closed", function() {
			DocumentManager.getCurrentDocument().markClean(); // so we can close without a save dialog
           
			// close the document
	        runs(function() {
	            CommandManager.execute(Commands.FILE_CLOSE)
	                .done(function() { didClose = true; })
	                .fail(function() { gotError = true; });
	        });
					
			// check there are no list items
			runs(function() {
				var listItems = this.app.$("#open-files-container").children("ul").children();
				expect( listItems.length ).toBe(1);
			});
									
		});
		
		// TODO: need message to send from to cause rebuild		
		// it("should rebuild the ui from the model correctly", function() {
		// 				
		// 		});
		
		
		it("should close a file when the user clicks the close button", function() {
			
			// make both docs clean
			var docList = DocumentManager.getWorkingSet();
			docList[0].markClean();
			docList[1].markClean();
			
			// make the first one active
			DocumentManager.showInEditor( docList[0]);
			
			// click on close icon of 2nd one
			var listItems = this.app.$("#open-files-container").children("ul").children();
			var closeIcon = $($(listItems[1]).find(".file-status-icon"));
			//expect( closeIcon.toBe(1);
			
			// simulate click
			closeIcon.trigger('click');
			
			var listItems = this.app.$("#open-files-container").children("ul").children();
			expect( listItems.length ).toBe(1);
			expect( listItems.find("a").get(0).text == "file_one.js" ).toBeTruthy();
			
			
			
		});
		// 		
		// 		it("should make a file that is clicked the current one in the editor", function() {
		// 			
		// 		});
		
		
		
		});
	}	
});