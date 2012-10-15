test( "$.widget.extend()", function() {
	expect( 26 );

	var ret, empty, optionsWithLength, optionsWithDate, myKlass, customObject, optionsWithCustomObject, nullUndef,
		target, recursive, obj, input, output,
		settings = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" },
		options = { xnumber2: 1, xstring2: "x", xxx: "newstring" },
		optionsCopy = { xnumber2: 1, xstring2: "x", xxx: "newstring" },
		merged = { xnumber1: 5, xnumber2: 1, xstring1: "peter", xstring2: "x", xxx: "newstring" },
		deep1 = { foo: { bar: true } },
		deep2 = { foo: { baz: true }, foo2: document },
		deep2copy = { foo: { baz: true }, foo2: document },
		deepmerged = { foo: { bar: true, baz: true }, foo2: document },
		arr = [1, 2, 3],
		nestedarray = { arr: arr },
		defaults = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" },
		defaultsCopy = { xnumber1: 5, xnumber2: 7, xstring1: "peter", xstring2: "pan" },
		options1 = { xnumber2: 1, xstring2: "x" },
		options1Copy = { xnumber2: 1, xstring2: "x" },
		options2 = { xstring2: "xx", xxx: "newstringx" },
		options2Copy = { xstring2: "xx", xxx: "newstringx" },
		merged2 = { xnumber1: 5, xnumber2: 1, xstring1: "peter", xstring2: "xx", xxx: "newstringx" };

	$.widget.extend( settings, options );
	deepEqual( settings, merged, "Check if extended: settings must be extended" );
	deepEqual( options, optionsCopy, "Check if not modified: options must not be modified" );

	$.widget.extend( deep1, deep2 );
	deepEqual( deep1.foo, deepmerged.foo, "Check if foo: settings must be extended" );
	deepEqual( deep2.foo, deep2copy.foo, "Check if not deep2: options must not be modified" );
	equal( deep1.foo2, document, "Make sure that a deep clone was not attempted on the document" );

	strictEqual( $.widget.extend({}, nestedarray).arr, arr, "Don't clone arrays" );
	ok( $.isPlainObject( $.widget.extend({ arr: arr }, { arr: {} }).arr ), "Cloned object heve to be an plain object" );

	empty = {};
	optionsWithLength = { foo: { length: -1 } };
	$.widget.extend( empty, optionsWithLength );
	deepEqual( empty.foo, optionsWithLength.foo, "The length property must copy correctly" );

	empty = {};
	optionsWithDate = { foo: { date: new Date() } };
	$.widget.extend( empty, optionsWithDate );
	deepEqual( empty.foo, optionsWithDate.foo, "Dates copy correctly" );

	myKlass = function() {};
	customObject = new myKlass();
	optionsWithCustomObject = { foo: { date: customObject } };
	empty = {};
	$.widget.extend( empty, optionsWithCustomObject );
	strictEqual( empty.foo.date, customObject, "Custom objects copy correctly (no methods)" );

	// Makes the class a little more realistic
	myKlass.prototype = { someMethod: function(){} };
	empty = {};
	$.widget.extend( empty, optionsWithCustomObject );
	strictEqual( empty.foo.date, customObject, "Custom objects copy correctly" );

	ret = $.widget.extend({ foo: 4 }, { foo: Number(5) } );
	equal( ret.foo, 5, "Wrapped numbers copy correctly" );

	nullUndef = $.widget.extend( {}, options, { xnumber2: null } );
	strictEqual( nullUndef.xnumber2, null, "Check to make sure null values are copied");

	nullUndef = $.widget.extend( {}, options, { xnumber2: undefined } );
	strictEqual( nullUndef.xnumber2, options.xnumber2, "Check to make sure undefined values are not copied");

	nullUndef = $.widget.extend( {}, options, { xnumber0: null } );
	strictEqual( nullUndef.xnumber0, null, "Check to make sure null values are inserted");

	target = {};
	recursive = { foo:target, bar:5 };
	$.widget.extend( target, recursive );
	deepEqual( target, { foo: {}, bar: 5 }, "Check to make sure a recursive obj doesn't go never-ending loop by not copying it over" );

	ret = $.widget.extend( { foo: [] }, { foo: [0] } ); // 1907
	equal( ret.foo.length, 1, "Check to make sure a value with coersion 'false' copies over when necessary to fix #1907" );

	ret = $.widget.extend( { foo: "1,2,3" }, { foo: [1, 2, 3] } );
	strictEqual( typeof ret.foo, "object", "Check to make sure values equal with coersion (but not actually equal) overwrite correctly" );

	ret = $.widget.extend( { foo:"bar" }, { foo:null } );
	strictEqual( typeof ret.foo, "object", "Make sure a null value doesn't crash with deep extend, for #1908" );

	obj = { foo:null };
	$.widget.extend( obj, { foo:"notnull" } );
	equal( obj.foo, "notnull", "Make sure a null value can be overwritten" );

	settings = $.widget.extend( {}, defaults, options1, options2 );
	deepEqual( settings, merged2, "Check if extended: settings must be extended" );
	deepEqual( defaults, defaultsCopy, "Check if not modified: options1 must not be modified" );
	deepEqual( options1, options1Copy, "Check if not modified: options1 must not be modified" );
	deepEqual( options2, options2Copy, "Check if not modified: options2 must not be modified" );

	input = {
		key: [ 1, 2, 3 ]
	};
	output = $.widget.extend( {}, input );
	deepEqual( input, output, "don't clone arrays" );
	input.key[0] = 10;
	deepEqual( input, output, "don't clone arrays" );
});
