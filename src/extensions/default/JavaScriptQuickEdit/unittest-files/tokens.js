function foo () {
}

var regExp = /{{0}}foo()/;
/*
{{1}}foo()
*/
// {{2}}foo()
var str1 = "{{3}}foo()", str2 = '{{4}}foo()';