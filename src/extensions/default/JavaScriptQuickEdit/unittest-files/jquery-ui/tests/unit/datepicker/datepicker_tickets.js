/*
 * datepicker_tickets.js
 */
(function($) {

module("datepicker: tickets");

// http://forum.jquery.com/topic/several-breaking-changes-in-jquery-ui-1-8rc1
test('beforeShowDay-getDate', function() {
	var inp = init('#inp', {beforeShowDay: function(date) { inp.datepicker('getDate'); return [true, '']; }}),
	   dp = $('#ui-datepicker-div');
	inp.val('01/01/2010').datepicker('show');
	// contains non-breaking space
	equal($('div.ui-datepicker-title').text(), 'January 2010', 'Initial month');
	$('a.ui-datepicker-next', dp).click();
	$('a.ui-datepicker-next', dp).click();
	// contains non-breaking space
	equal($('div.ui-datepicker-title').text(), 'March 2010', 'After next clicks');
	inp.datepicker('hide').datepicker('show');
	$('a.ui-datepicker-prev', dp).click();
	$('a.ui-datepicker-prev', dp).click();
	// contains non-breaking space
	equal($('div.ui-datepicker-title').text(), 'November 2009', 'After prev clicks');
	inp.datepicker('hide');
});

test('Ticket 7602: Stop datepicker from appearing with beforeShow event handler', function(){
    var inp = init('#inp',{
            beforeShow: function(){
                return false;
            }
        }),
        dp = $('#ui-datepicker-div');
    inp.datepicker('show');
    equal(dp.css('display'), 'none',"beforeShow returns false");
    inp.datepicker('destroy');

    inp = init('#inp',{
        beforeShow: function(){
        }
    });
    dp = $('#ui-datepicker-div');
    inp.datepicker('show');
    equal(dp.css('display'), 'block',"beforeShow returns nothing");
	inp.datepicker('hide');
    inp.datepicker('destroy');

    inp = init('#inp',{
        beforeShow: function(){
            return true;
        }
    });
    dp = $('#ui-datepicker-div');
    inp.datepicker('show');
    equal(dp.css('display'), 'block',"beforeShow returns true");
	inp.datepicker('hide');
    inp.datepicker('destroy');
});

test('Ticket 6827: formatDate day of year calculation is wrong during day lights savings time', function(){
    var time = $.datepicker.formatDate("oo", new Date("2010/03/30 12:00:00 CDT"));
    equal(time, "089");
});

test('Ticket #7244: date parser does not fail when too many numbers are passed into the date function', function() {
    var date;
    try{
        date = $.datepicker.parseDate('dd/mm/yy', '18/04/19881');
        ok(false, "Did not properly detect an invalid date");
    }catch(e){
        ok("invalid date detected");
    }

    try {
      date = $.datepicker.parseDate('dd/mm/yy', '18/04/1988 @ 2:43 pm');
      equal(date.getDate(), 18);
      equal(date.getMonth(), 3);
      equal(date.getFullYear(), 1988);
    } catch(e) {
      ok(false, "Did not properly parse date with extra text separated by whitespace");
    }
});

})(jQuery);
