describe("FileCommandHandlers", function() {

    beforeEach(function() {
//        this.app = window.open(SpecRunnerUtils.getBracketsSourceRoot() + "/index.html");
        this.app = window.opener;
        this.testPath = SpecRunnerUtils.getTestPath("FileCommandHandlers-test-files");
        var isReady = false;
        $(this.app.document).ready(function() {
            isReady = true; 
        });
        waitsFor(function() { return isReady; }, 5000);
        // runs(function() {
        //     this.app.ProjectManager.loadProject(this.testPath);
        // });
        // waitsFor(function() { return this.app.ProjectManager.getProjectRoot() === this.testPath; } , 1000);
    });
    
    afterEach(function() {
       this.app.close(); 
       this.app = null;
    });
    
    describe("Open File", function() {
        it("should be able to read stuff from window", function() {
            expect(this.app.CommandManager).toBe("BLAH");
        });
        xit("should open a file in the editor", function() {
            var didOpen = true;
            this.app.CommandManager.execute(this.app.Commands.FILE_OPEN);
        });
    });
    
});
