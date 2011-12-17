describe("FileCommandHandlers", function() {

    beforeEach(function() {
//        this.app = window.open(SpecRunnerUtils.getBracketsSourceRoot() + "/index.html");
        // TODO: this will only work if run from the main Brackets window (not from jasmine.sh)
        this.app = window.opener;
        this.app.location.reload();
        this.testPath = SpecRunnerUtils.getTestPath("/spec/FileCommandHandlers-test-files");
        var isReady = false;
        $(this.app.document).ready(function() {
            isReady = true; 
        });
        waitsFor(function() { return isReady; }, 5000);
        runs(function() {
            this.app.ProjectManager.loadProject(this.testPath);
        });
        waitsFor(function() { return this.app.ProjectManager.getProjectRoot(); } , 1000);
    });
    
    afterEach(function() {
//       this.app.close(); 
//       this.app = null;
    });
    
    describe("Open File", function() {
        it("should open a file in the editor", function() {
            var didOpen = false, gotError = false;
            this.app.CommandManager.execute(this.app.Commands.FILE_OPEN, this.testPath + "/test.js")
                .done(function() { didOpen = true; })
                .fail(function() { gotError = true; });
            waitsFor(function() { return didOpen || gotError; }, 1000);
            runs(function() {
                expect(this.app.FileCommandHandlers.getEditor().getValue()).toBe('var myContent="This is awesome!";'); 
            });
        });
    });
    
    describe("Save File", function() {
        
    });    
});
