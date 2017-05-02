function simple1() {
    // this function starts at line 0, char 0
}

/*
 * simple functions
 */
var simple2 = function () {

};

simple3: function () {
    
}
    
/*
 * parameterized functions
 */
function param1(p1) {
}

/*
 * simple functions
 */
var param2 = function (p1, p2) {

};

param3: function (longParameterName1,
                  longParameterName2,
                  longParameterName3) {
    
}
    
// single line functions
function single1() { return true; }
var single2 = function (param1) { /* does nothing */ };
single3: function () { return false; }  // comment after end of function, on same line

/*
 * nested functions
 */
var nested1 = function (param1) {

    nested2: function () {
        
        /* nested functions */
        function nested3() {
        }
    }
};

// function keyword in name, no empty line between functions
function functionX() {
    return true;
}
var my_function = function (param1) {
};
function3: function () {
    /* comment */
}

// functions with invalid identifiers
function invalid identifier () {}