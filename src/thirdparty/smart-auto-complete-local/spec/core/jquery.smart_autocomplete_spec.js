describe('Smart AutoComplete', function () {
    
    beforeEach(function () {
      setFixtures("<input id='autoCompleteField'/>");
    });

    describe('initializing with default values', function(){

      var smart_autocomplete_options;

      beforeEach(function(){
        $("#autoCompleteField").smartAutoComplete({});
        smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");
      });

      it('minimum character length should be 1', function () {
        expect(smart_autocomplete_options.minCharLimit).toEqual(1);
      });

      it('maximum results should be unlimited', function () {
        expect(smart_autocomplete_options.maxResults).toEqual(null);
      });

      it('delay should be 0ms', function () {
        expect(smart_autocomplete_options.delay).toEqual(0);
      });

      it('disabled should be false', function () {
        expect(smart_autocomplete_options.disabled).toEqual(false);
      });

      it('force select should be false', function () {
        expect(smart_autocomplete_options.forceSelect).toEqual(false);
      });

      it('result element should be a li', function () {
        expect(smart_autocomplete_options.resultElement).toEqual("li");
      });

      it('type ahead should be a false', function () {
        expect(smart_autocomplete_options.typeAhead).toEqual(false);
      });

    });

    describe('overriding default values', function(){

      it('takes hardcoded options', function(){
       setFixtures("<input id='autoCompleteFieldHardCoded' data-smart-autocomplete='{\"minCharLimit\": 4 }'/>");
       $("#autoCompleteFieldHardCoded").smartAutoComplete({});
       smart_autocomplete_options = $("#autoCompleteFieldHardCoded").data("smart-autocomplete");

       expect(smart_autocomplete_options.minCharLimit).toEqual(4);
      });

      it('minimum character limit set to 4', function () {
       $("#autoCompleteField").smartAutoComplete({minCharLimit: 4});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.minCharLimit).toEqual(4);
      });

      it('maximum results set to 10', function () {
       $("#autoCompleteField").smartAutoComplete({maxResults: 10});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.maxResults).toEqual(10);
      });

      it('delay set to 10ms', function () {
       $("#autoCompleteField").smartAutoComplete({delay: 10});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.delay).toEqual(10);
      });

      it('disabled set to true', function () {
       $("#autoCompleteField").smartAutoComplete({disabled: true});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.disabled).toEqual(true);
      });

      it('force select set to true', function () {
       $("#autoCompleteField").smartAutoComplete({forceSelect: true});
       smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

       expect(smart_autocomplete_options.forceSelect).toEqual(true);
      });

      it('result element set to be a div', function () {
        $("#autoCompleteField").smartAutoComplete({resultElement: "div"});
        smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

        expect(smart_autocomplete_options.resultElement).toEqual("div");
      });

      it('type ahead is set to true', function () {
        $("#autoCompleteField").smartAutoComplete({typeAhead: true});
        smart_autocomplete_options = $("#autoCompleteField").data("smart-autocomplete");

        expect(smart_autocomplete_options.typeAhead).toEqual(true);
      });

    });

    describe('keyIn event', function(){

      it("should be fired if the maximum char limit is reached", function(){
        $("#autoCompleteField").smartAutoComplete({minCharLimit: 2 });

        var output_buffer = "";
        $("#autoCompleteField").bind('keyIn', function(ev){ output_buffer = "keyin called"; ev.preventDefault(); });

        $("#autoCompleteField").val("test");
        $("#autoCompleteField").trigger('keyup');

        expect(output_buffer).toEqual("keyin called");
      });

      it("should not be fired if the maximum char limit is not reached", function(){
        $("#autoCompleteField").smartAutoComplete({minCharLimit: 4});

        var output_buffer = "";
        $("#autoCompleteField").bind('keyIn', function(ev){ output_buffer = "keyin called"; ev.preventDefault(); });

        $("#autoCompleteField").val("te");
        $("#autoCompleteField").trigger('keyup');

        expect(output_buffer).not.toEqual("keyin called");
      });

      it("performs no action if disabled", function(){
        var mock_autocomplete_obj = {filter: function(){}, source: 'test', disabled: true};
        spyOn(mock_autocomplete_obj, 'filter');

        $("#autoCompleteField").smartAutoComplete({});
        $("#autoCompleteField").data("smart-autocomplete", mock_autocomplete_obj); //replace with the mock
        $("#autoCompleteField").trigger("keyIn", "t");

        expect(mock_autocomplete_obj.filter).not.toHaveBeenCalledWith('t', 'test');
      });

      it("should set the item selected property to false", function(){
        $("#autoCompleteField").smartAutoComplete({});
        spyOn(window, 'setTimeout').andReturn(true);

        $("#autoCompleteField").trigger('keyIn', "t");
        expect($("#autoCompleteField").smartAutoComplete().itemSelected).toBeFalsy();
      });

      it("waits for the miliseconds set as the delay before running the filter", function(){
        var output_buffer;
        $("#autoCompleteField").smartAutoComplete({filter: function(q, s){ output_buffer = "received " + q + " & " + s; return [] }, source: "test", delay: 10});
        $("#autoCompleteField").bind('resultsReady', function(ev){ ev.preventDefault(); });
        $("#autoCompleteField").trigger("keyIn", "t");

        waits(10); //this is deprecated
        runs(function(){
          expect(output_buffer).toEqual("received t & test");
        });
      });
      
      it("if custom filter function is defined, call it with query and source", function(){
        var output_buffer;
        $("#autoCompleteField").smartAutoComplete({filter: function(q, s){ output_buffer = "received " + q + " & " + s; return [] }, source: "test"});
        $("#autoCompleteField").bind('resultsReady', function(ev){ ev.preventDefault(); });
        $("#autoCompleteField").trigger("keyIn", "t");

        waits(0); //this is deprecated
        runs(function(){
          expect(output_buffer).toEqual("received t & test");
        });
      });
  
      it("if custom filter function is not defined, call default filter with query and source", function(){
        var mock_autocomplete_obj = {filter: function(){}, source: 'test', clearResults: function(){}, setItemSelected: function(){} };
        spyOn(mock_autocomplete_obj, 'filter').andReturn([]);

        $("#autoCompleteField").smartAutoComplete({});
        $("#autoCompleteField").data("smart-autocomplete", mock_autocomplete_obj); //replace with the mock
        $("#autoCompleteField").bind('resultsReady', function(ev){ ev.preventDefault(); });
        $("#autoCompleteField").trigger("keyIn", "t");

        waits(0); //this is deprecated
        runs(function(){
          expect(mock_autocomplete_obj.filter).toHaveBeenCalledWith('t', 'test');
        });
      });

    });

    describe('resultsReady event', function(){

      var result_formatter_called = false;
      var result_formatter_function = function(r){ result_formatter_called = true; return r };

      it("persists the raw results", function(){
        $("#autoCompleteField").smartAutoComplete({});
        $("#autoCompleteField").bind('showResults', function(ev){ ev.preventDefault(); });
        $("#autoCompleteField").trigger('resultsReady', [["a", "b", "c"]]);

        expect($("#autoCompleteField").data("smart-autocomplete").rawResults).toEqual(["a", "b", "c"]);
 
      });

      it("format the results using the result formatter function", function(){
        $("#autoCompleteField").smartAutoComplete({resultFormatter: result_formatter_function });
        $("#autoCompleteField").bind('showResults', function(ev){ ev.preventDefault(); });
        $("#autoCompleteField").trigger('resultsReady', [["a", "b", "c"]]);

        expect(result_formatter_called).toBeTruthy();
      });

      it("should call clearResults method", function(){

        var mock_autocomplete_obj = {clearResults: function(){}, resultFormatter: function(){} };
        spyOn(mock_autocomplete_obj, 'clearResults');

        $("#autoCompleteField").smartAutoComplete({});
        $("#autoCompleteField").data("smart-autocomplete", mock_autocomplete_obj); //replace with the mock
        $("#autoCompleteField").trigger('resultsReady', [["a", "b", "c"]]);

        expect(mock_autocomplete_obj.clearResults).toHaveBeenCalled();
      });

      it("should append the results to given result container", function(){
        setFixtures("<input id='autoCompleteField'/><div id='autoCompleteAppendToBlock'></div>");
        $("#autoCompleteField").smartAutoComplete({resultFormatter: result_formatter_function, resultsContainer: "#autoCompleteAppendToBlock" });
        $("#autoCompleteField").bind('showResults', function(ev){ ev.preventDefault(); });
        $("#autoCompleteField").trigger('resultsReady', [["a", "b", "c"]]);

        expect($("#autoCompleteAppendToBlock")).toHaveHtml("abc");
      });

      it("fires the show results event", function(){
        var event_output = "";
        $("#autoCompleteField").bind('showResults', function(ev){ event_output = "show results"; ev.preventDefault(); });

        $("#autoCompleteField").smartAutoComplete({resultFormatter: result_formatter_function });
        $("#autoCompleteField").trigger('resultsReady', [["a", "b", "c"]]);

        expect(event_output).toEqual("show results");
      });

      it("fires the no match event if filter returns empty", function(){
        var event_output = "";
        $("#autoCompleteField").bind('noResults', function(ev){ event_output = "no match"; ev.preventDefault(); });

        $("#autoCompleteField").smartAutoComplete({resultFormatter: result_formatter_function });
        $("#autoCompleteField").trigger('resultsReady', [[]]);

        expect(event_output).toEqual("no match");
      }); 
    
    });

    describe('no results event', function(){

      it("should call clearResults method", function(){

        var mock_autocomplete_obj = {clearResults: function(){}, resultFormatter: function(){} };
        spyOn(mock_autocomplete_obj, 'clearResults');

        $("#autoCompleteField").smartAutoComplete({});
        $("#autoCompleteField").data("smart-autocomplete", mock_autocomplete_obj); //replace with the mock
        $("#autoCompleteField").trigger('noResults');

        expect(mock_autocomplete_obj.clearResults).toHaveBeenCalled();
      });

    });

    describe('show results event', function(){

      it("should show type ahead field if the type ahead option is enabled", function(){
        setFixtures("<input id='autoCompleteField'/>");

        $("#autoCompleteField").smartAutoComplete({ typeAhead: true });
        $("#autoCompleteField").val("te");
        $("#autoCompleteField").trigger('showResults', [["test"]]);

        expect($("#autoCompleteField").prev('.smart_autocomplete_type_ahead_field').length).toEqual(1);
      });

      it("should apply styles to container relative to field", function(){
        setFixtures("<input id='autoCompleteField'/><div id='resultsContainer' style='display:none'></div>");

        $("#autoCompleteField").smartAutoComplete({ resultsContainer: "#resultsContainer" });
        $("#autoCompleteField").trigger('showResults', [[]]);

        expect($("#resultsContainer").attr('style')).not.toBeEmpty();

      });

      it("should make result container visible", function(){
        setFixtures("<input id='autoCompleteField'/><div id='resultsContainer' style='display:none'></div>");
        $("#autoCompleteField").smartAutoComplete({ resultsContainer: "#resultsContainer" });
        $("#autoCompleteField").trigger('showResults', [[]]);

        expect($("#resultsContainer")).toBeVisible();

      });

    });

    describe('lost focus event', function(){

      it("should call clearResults method", function(){
        var mock_autocomplete_obj = {clearResults: function(){}, resultFormatter: function(){} };
        spyOn(mock_autocomplete_obj, 'clearResults');

        $("#autoCompleteField").smartAutoComplete({});
        $("#autoCompleteField").data("smart-autocomplete", mock_autocomplete_obj); //replace with the mock
        $("#autoCompleteField").trigger('noResults');

        expect(mock_autocomplete_obj.clearResults).toHaveBeenCalled();
      });

      it("should make result container hidden", function(){
        setFixtures("<input id='autoCompleteField'/><div id='resultsContainer'></div>");
        $("#autoCompleteField").smartAutoComplete({ resultsContainer: "#resultsContainer" });
        $("#autoCompleteField").trigger('lostFocus');

        expect($("#resultsContainer")).not.toBeVisible();

      });

      it("fill in the field with best matching value if force select is enabled and no item is selected", function(){
        $("#autoCompleteField").smartAutoComplete({ resultsContainer: "#resultsContainer", forceSelect: true, rawResults: ['Apple','Banana', 'Orange'], itemSelected: false, currentSelection: 0 });
        $("#autoCompleteField").trigger('lostFocus');

        expect($("#autoCompleteField")).toHaveValue('');
      });

    });

    describe('item select event', function(){

      it('should set the text of selected item as the value of field', function(){
        setFixtures("<input id='autoCompleteField'/><div id='selectedField'>I was selected!</div>");
        $("#autoCompleteField").smartAutoComplete({});

        $("#autoCompleteField").trigger('itemSelect', [$("#selectedField")]);
        expect($("#autoCompleteField")).toHaveValue('I was selected!');
      });

      it("should set the item selected property to true", function(){
        setFixtures("<input id='autoCompleteField'/><div id='selectedField'>I was selected!</div>");
        $("#autoCompleteField").smartAutoComplete({});

        $("#autoCompleteField").trigger('itemSelect', [$("#selectedField")]);
        expect($("#autoCompleteField").smartAutoComplete().itemSelected).toBeTruthy();

      });

      it("should trigger the lost focus event after a value is selected", function(){
        setFixtures("<input id='autoCompleteField'/><div id='selectedField'>I was selected!</div>");
        var output_buffer = "";
        $("#autoCompleteField").smartAutoComplete({});
        $("#autoCompleteField").bind('lostFocus', function(){ output_buffer = "lost focus called"});

        $("#autoCompleteField").trigger('itemSelect', [$("#selectedField")]);
        expect(output_buffer).toEqual("lost focus called");
      });

    });

    describe('item focus event', function(){

      it('should add highlight class to the element', function(){
        setFixtures("<input id='autoCompleteField'/><div id='highlightedField'>I was highlighted!</div>");
        $("#autoCompleteField").smartAutoComplete({});

        $("#autoCompleteField").trigger('itemFocus', [$("#highlightedField")]);
        expect($("#highlightedField")).toHaveClass('smart_autocomplete_highlight');
      });

    })

    describe('item unfocus event', function(){

      it('should remove highlight class from the element', function(){
        setFixtures("<input id='autoCompleteField'/><div class='smart_autocomplete_highlight' id='highlightedField'>I was highlighted!</div>");
        $("#autoCompleteField").smartAutoComplete({});

        $("#autoCompleteField").trigger('itemUnfocus', [$("#highlightedField")]);
        expect($("#highlightedField")).not.toHaveClass('smart_autocomplete_highlight');
      });

    })

    describe('default filter', function(){

      beforeEach(function(){
        $("#autoCompleteField").smartAutoComplete({maxResults: 2});
      });

      it("returns the matching results when using an array as the source", function(){
        expect( $("#autoCompleteField").smartAutoComplete().filter.call($("#autoCompleteField"), 't', ['test', 'table', 'abc']) ).toEqual(['test', 'table']);
      }); 

      it("initates an deferred ajax call when source is given as a string", function(){
        spyOn($, 'Deferred').andReturn({promise: function(){} });

        $("#autoCompleteField").smartAutoComplete().filter.call($("#autoCompleteField"), 't', 'http://localhost/autocomplete');
        expect($.Deferred).toHaveBeenCalled();
      }); 

    });

    describe('default clear results method', function(){

      it("should remove type ahead field", function(){
        setFixtures("<input class='smart_autocomplete_type_ahead_field'/><input id='autoCompleteField'/>");

        $("#autoCompleteField").smartAutoComplete({ typeAhead: true });
        $("#autoCompleteField").smartAutoComplete().clearResults();

        expect($('.smart_autocomplete_type_ahead_field').length).toEqual(0);
      });

      it("should remove exisiting results", function(){
        setFixtures("<input id='autoCompleteField'/><div id='autoCompleteAppendToBlock'><span class='smart_autocomplete_result'>test</span></div>");
        $("#autoCompleteField").smartAutoComplete({resultsContainer: "#autoCompleteAppendToBlock" });
        $("#autoCompleteField").smartAutoComplete().clearResults();

        expect($("#autoCompleteAppendToBlock")).toHaveHtml("");
      });


    });
});
