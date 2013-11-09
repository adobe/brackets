/**
 * Smart Auto Complete plugin 
 * 
 * Copyright (c) 2011 Lakshan Perera (laktek.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)  licenses.
 * 
*/

/*
 Requirements: jQuery 1.5 or above

  Usage:
  $(target).smartAutoComplete({options})

  Options:
  minCharLimit: (integer) minimum characters user have to type before invoking the autocomplete (default: 1)
  maxCharLimit: (integer) maximum characters user can type while invoking the autocomplete (default: null (unlimited))
  maxResults: (integer) maximum number of results to return (default: null (unlimited))
  delay: (integer) delay before autocomplete starts (default: 0)
  disabled: (boolean) whether autocomplete disabled on the field (default: false)
  forceSelect: (boolean) If set to true, field will be always filled with best matching result, without leaving the custom input.
               Better to enable this option, if you want autocomplete field to behave similar to a HTML select field. (Check Example 2 in the demo)
               (default: false)
  typeAhead: (boolean) If set to true, it will offer the best matching result in grey within the field; that can be auto-completed by pressing the right arrow-key or enter.
             This is similar to behaviour in Google Instant Search's query field (Check Example 3 in the demo) 
             (default: false)
  source:  (string/array) you can supply an array with items or a string containing a URL to fetch items for the source
           this is optional if you prefer to have your own filter method 
  filter: (function) define a custom function that would return matching items to the entered text (this will override the default filtering algorithm)
          should return an array or a Deferred object (ajax call)
          parameters available: term, source 
  resultFormatter: (function) the function you supply here will be called to format the output of an individual result.
                   should return a string
                   parameters available: result 
  resultsContainer: (selector) to which element(s) the result should be appended.
  resultElement: (selector) references to the result elements collection (e.g. li, div.result) 

  Events:
  keyIn: fires when user types into the field (parameters: query)
  resultsReady: fires when the filter function returns (parameters: results)
  showResults: fires when results are shown (parameters: results)
  noResults: fires when filter returns an empty array
  itemSelect: fires when user selects an item from the result list (paramters: item)
  itemFocus: fires when user highlights an item with mouse or arrow keys (paramters: item)
  itemUnfocus: fires when user moves out from an highlighted item (paramters: item)
  lostFocus: fires when autocomplete field loses focus by user clicking outside of the field or focusing on another field. Also, this event is fired when a value is selected

 })
*/

(function($){
  $.fn.smartAutoComplete = function(){    

    if(arguments.length < 1){
      // get the smart autocomplete object of the first element and return 
      var first_element = this[0];
      return $(first_element).data("smart-autocomplete")
    }

    var default_filter_matcher = function(term, source, context){
                                    var matcher = new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i" );

                                    return $.grep(source, function(value) {
                                      return matcher.test( value );
                                    });

                                 }

    var default_options = {
                            minCharLimit: 1, 
                            maxCharLimit: null, 
                            maxResults: null,
                            delay: 0,
                            disabled: false,
                            forceSelect: false,
                            typeAhead: false,
                            resultElement: "li",
                            resultFormatter: function(r){ return ("<li>" + r + "</li>"); },
                            filter: function(term, source){    
                              var context = this;
                              var options = $(context).data("smart-autocomplete");
                              

                              //when source is an array
                              if($.type(source) === "array") {
                                // directly map
                                var results = default_filter_matcher(term, source, context);
                                return results; 
                              }
                              //when source is a string
                              else if($.type(source) === "string"){
                                // treat the string as a URL endpoint
                                // pass the query as 'term'
                                
                                return $.Deferred(function(dfd){ 
                                  $.ajax({
                                    url: source,
                                    data: {"term": term},
                                    dataType: "json"
                                  }).done( function(data){
                                    dfd.resolve( default_filter_matcher(term, data, context) );          
                                  }); 
                                }).promise();
                                
                              }

                            },

                            alignResultsContainer: false,

                            clearResults: function(){
                              //remove type ahead field
                              var type_ahead_field = $(this.context).prev(".smart_autocomplete_type_ahead_field");
                              $(this.context).css({ background: type_ahead_field.css("background") });
                              type_ahead_field.remove();
                              
                              //clear results div
                              $(this.resultsContainer).html("");
                            },

                            setCurrentSelectionToContext: function(){
                                if(this.rawResults.length > 0 && this.currentSelection >= 0)
                                  $(this.context).val(this.rawResults[(this.currentSelection)]);
                            },

                            setItemSelected: function(val){
                              this.itemSelected = val;
                            },

                            autocompleteFocused: false,

                            setAutocompleteFocused: function(val){
                              this.autocompleteFocused = val;
                            }

    };

    //define the default events
    $.event.special.keyIn = {
      setup: function(){ return false; }, 

      _default: function(ev){
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");
        var source = options.source || null;
        var filter = options.filter;
        var maxChars = (options.maxCharLimit > 0 ?  options.maxCharLimit : Number.POSITIVE_INFINITY)

        //event specific data
        var query = ev.smartAutocompleteData.query;

        if(options.disabled || (query.length > maxChars)){
          $(context).trigger("lostFocus");
          return false;
        }

        //set item selected property
        options.setItemSelected(false);

        //set autocomplete focused
        options.setAutocompleteFocused(true);

        //call the filter function with delay
        setTimeout(function(){
          $.when( filter.apply(options, [query, options.source]) ).done(function( results ){
            //do the trimming
            var trimmed_results = (options.maxResults > 0 ? results.splice(0, options.maxResults) : results);

            $(context).trigger("resultsReady", [trimmed_results]);
          });
        }, options.delay);
      }
    };

    $.event.special.resultsReady = {
      setup: function(){ return false },

      _default: function(ev){
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");

        //event specific data
        var results = ev.smartAutocompleteData.results;

        //exit if smart complete is disabled
        if(options.disabled)
          return false;

        //clear all previous results 
        $(context).smartAutoComplete().clearResults();

        //save the raw results
        options.rawResults = results;

        //fire the no match event and exit if no matching results
        if(results.length < 1){
          $(context).trigger("noResults");
          return false
        }

        //call the results formatter function
        var formatted_results = $.map(results, function(result){
          return options.resultFormatter.apply(options, [result]);
        });

        var formatted_results_html = formatted_results.join("");

        //append the results to the container
        if(options.resultsContainer)
          $(options.resultsContainer).append(formatted_results_html);

        //trigger results ready event
        $(context).trigger("showResults", [results]);
      }             
    };

    $.event.special.showResults = {
      setup: function(){ return false },

      _default: function(ev){    
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");
        var results_container = $(options.resultsContainer);

        //event specific data
        var raw_results = ev.smartAutocompleteData.results; 

        //type ahead
        if(options.typeAhead && (raw_results[0].substr(0, $(context).val().length) == $(context).val()) ){
          var suggestion = raw_results[0]; //options.typeAheadExtractor($(context).val(), raw_results[0]); 
          
          //add new typeAhead field
          $(context).before("<input class='smart_autocomplete_type_ahead_field' type='text' autocomplete='off' disabled='disabled' value='" + suggestion + "'/>");

          $(context).css({
            position: "relative",
            zIndex: 2,
            background: "transparent"
          });

          var typeAheadField = $(context).prev("input");
          typeAheadField.css({
            position: "absolute",
            zIndex: 1,
            overflow: "hidden",
            background: $(context).css("background"),
            borderColor: "transparent",
            width: $(context).width(),
            color: "silver"
          });

          //trigger item over for first item
          options.currentSelection = 0;
          if(results_container)
            $(context).trigger("itemFocus", results_container.children()[options.currentSelection]);
        }

        //show the results container after aligning it with the field 
        if(results_container){
          if(options.alignResultsContainer){
            results_container.css({ 
                  position: "absolute",
                  top: function(){ return $(context).offset().top + $(context).height(); }, 
                  left: function(){ return $(context).offset().left; }, 
                  width: function(){ return $(context).width(); }, 
                  zIndex: 1000
            })
          }  
          results_container.show();
        }

      }
    };

    $.event.special.noResults = {
      setup: function(){ return false },

      _default: function(ev){    
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");
        var result_container = $(options.resultsContainer);

        if(result_container){
         //clear previous results
         options.clearResults(); 
        }

      }
    };

    $.event.special.itemSelect = { 
      setup: function(){ return false },

      _default: function(ev){    
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");

        //event specific data
        var selected_item = ev.smartAutocompleteData.item;

        //get the text from selected item
        var selected_value = $(selected_item).text() || $(selected_item).val();
        //set it as the value of the autocomplete field
        $(context).val(selected_value); 

        //set item selected property
        options.setItemSelected(true);

        //set number of current chars in field 
        options.originalCharCount = $(context).val().length;
        
        //trigger lost focus
        $(context).trigger('lostFocus');
      }
    };

    $.event.special.itemFocus = {
      setup: function(){ return false },

      _default: function(ev){    

        //event specific data
        var item = ev.smartAutocompleteData.item;

        $(item).addClass("smart_autocomplete_highlight");
      }
    };

    $.event.special.itemUnfocus = { 
      setup: function(){ return false },

      _default: function(ev){    

        //event specific data
        var item = ev.smartAutocompleteData.item;

        $(item).removeClass("smart_autocomplete_highlight");
      }
    }

    $.event.special.lostFocus = {
      setup: function(){ return false },

      _default: function(ev){    
        var context = ev.target;
        var options = $(context).data("smart-autocomplete");

        //if force select is selected and no item is selected, clear currently entered text 
        if(options.forceSelect && !options.itemSelected)
          $(options.context).val("");

        //unset autocomplete focused
        options.setAutocompleteFocused(false);

        //clear results
        options.clearResults(); 

        //hide the results container
        if(options.resultsContainer)
          $(options.resultsContainer).hide();

        //set current selection to null
        options.currentSelection = null;
      }
    };

    var passed_options = arguments[0];

    return this.each(function(i) { 
      //set the options
      var options = $.extend(default_options, $(this).data("smart-autocomplete"), passed_options);
      //set the context
      options["context"] = this;

      //if a result container is not defined
      if($.type(options.resultsContainer) === "undefined" ){
        //define the default result container if it is already not defined
        var default_container = $("<ul class='smart_autocomplete_container' style='display:none'></ul>");
        default_container.appendTo("body");

        options.resultsContainer = default_container;
        options.alignResultsContainer = true;
      }

      $(this).data("smart-autocomplete", options);

      // bind user events
      // Brackets monkeypatch: revert this to keyup because keydown breaks Quick Open
      $(this).on("keyup", function(ev){
        //get the options
        var options = $(this).data("smart-autocomplete");

        //up arrow
        if(ev.keyCode === 38){

          if(options.resultsContainer){
            var current_selection = options.currentSelection || 0;
            var result_suggestions = $(options.resultsContainer).children();

            if(current_selection > 0) {
              $(options.context).trigger("itemUnfocus", result_suggestions[current_selection] );
              current_selection--;
            } else if((current_selection-1) < 0) {
              $(options.context).trigger("itemUnfocus", result_suggestions[current_selection] );
              current_selection = result_suggestions.length-1;
            }

            options.currentSelection = current_selection;

            $(options.context).trigger("itemFocus", [ result_suggestions[current_selection] ] );
          }
        }

        //down arrow
        else if(ev.keyCode === 40){

          if(options.resultsContainer && options.resultsContainer.is(':visible')){
            var current_selection = options.currentSelection;
            var result_suggestions = $(options.resultsContainer).children();

            if(current_selection >= 0)
              $(options.context).trigger("itemUnfocus", result_suggestions[current_selection] );

            if(isNaN(current_selection) || null == current_selection || (++current_selection >= result_suggestions.length) )
              current_selection = 0;

            options["currentSelection"] = current_selection;

            $(options.context).trigger("itemFocus", [ result_suggestions[current_selection] ] );
          }
          //trigger keyIn event on down key
          else {
            $(options.context).trigger("keyIn", [$(this).val()]); 
          }
          
        }

        //right arrow & enter key
        else if(ev.keyCode === 39 || ev.keyCode === 13){
          var type_ahead_field = $(options.context).prev(".smart_autocomplete_type_ahead_field");
          if(options.resultsContainer && $(options.resultsContainer).is(':visible')){
            var current_selection = options.currentSelection;
            var result_suggestions = $(options.resultsContainer).children();

            $(options.context).trigger("itemSelect", [ result_suggestions[current_selection] ] );
          }
          else if(options.typeAhead && type_ahead_field.is(":visible"))
            $(options.context).trigger("itemSelect", [ type_ahead_field ] );

          return false;
        }

        else if(ev.keyCode !== 255) {
         var current_char_count = $(options.context).val().length;
         //check whether the string has modified
         if(options.originalCharCount == current_char_count)
           return;

         //check minimum and maximum number of characters are typed
         if(current_char_count >= options.minCharLimit){
          $(options.context).trigger("keyIn", [$(this).val()]); 
         }
         else{
            if(options.autocompleteFocused){ 
              options.currentSelection = null;
              $(options.context).trigger("lostFocus");
            }
         }

        }
      });

      $(this).focus(function(){
        //if the field is in a form capture the return key event 
        $(this).closest("form").bind("keydown.block_for_smart_autocomplete", function(ev){
          var type_ahead_field = $(options.context).prev(".smart_autocomplete_type_ahead_field");
          if(ev.keyCode === 13){
            if(options.resultsContainer && $(options.resultsContainer).is(":visible")){
              var current_selection = options.currentSelection;
              var result_suggestions = $(options.resultsContainer).children();

              $(options.context).trigger("itemSelect", [ result_suggestions[current_selection] ] );
              return false;
            }
            else if(options.typeAhead && type_ahead_field.is(":visible") ){
              $(options.context).trigger("itemSelect", [ type_ahead_field ] );
              return false;
            }
          }
        });

        if(options.forceSelect){
          $(this).select(); 
        }
      });

      //check for loosing focus on smart complete field and results container
      //$(this).blur(function(ev){
      $(document).bind("focusin click", function(ev){
        if(options.autocompleteFocused){ 
          var elemIsParent = $.contains(options.resultsContainer[0], ev.target);
          if(ev.target == options.resultsContainer[0] || ev.target == options.context || elemIsParent) return

          $(options.context).closest("form").unbind("keydown.block_for_smart_autocomplete");
          $(options.context).trigger("lostFocus");
        }
      });

      // Brackets monkeypatch: don't trigger item focus/unfocus events on mouseenter/mouseleave, since we don't
      // want to select an item just by mousing over it. We just want an ordinary hover highlight, which we apply
      // through CSS directly.
/*
      //bind events to results container
      $(options.resultsContainer).delegate(options.resultElement, "mouseenter.smart_autocomplete", function(){
        var old_selection = options.currentSelection || 0;
        var result_suggestions = $(options.resultsContainer).children();

        options["currentSelection"] = $(this).prevAll().length;
        
        if (old_selection != options.currentSelection) {
          $(options.context).trigger("itemUnfocus", result_suggestions[old_selection]);
        }

        $(options.context).trigger("itemFocus", [this] );
          
      });

      $(options.resultsContainer).delegate(options.resultElement, "mouseleave.smart_autocomplete", function(){
        $(options.context).trigger("itemUnfocus", [this] );
      });
*/

      $(options.resultsContainer).delegate(options.resultElement, "mousedown.smart_autocomplete", function(){
        $(options.context).trigger("itemSelect", [this]);
        return false
      });

      //bind plugin specific events
      $(this).bind({
        keyIn: function(ev, query){ ev.smartAutocompleteData  = {"query": query }; },
        resultsReady: function(ev, results){ ev.smartAutocompleteData  = {"results": results }; }, 
        showResults: function(ev, results){ ev.smartAutocompleteData = {"results": results } },
        noResults: function(){},
        lostFocus: function(){},
        itemSelect: function(ev, item){ ev.smartAutocompleteData = {"item": item }; },
        itemFocus: function(ev, item){ ev.smartAutocompleteData = {"item": item }; },
        itemUnfocus: function(ev, item){ ev.smartAutocompleteData = {"item": item }; }
      });
    });
      
  }
})(jQuery);
