$(function() {

$( "#main" )
	.addClass( "ui-widget" )
	.find( "h1, h2" )
		.addClass( "ui-widget-header ui-corner-top" )
		.next()
			.addClass( "ui-widget-content ui-corner-bottom" );

});
