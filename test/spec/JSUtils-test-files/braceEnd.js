function simpleFunction() {
    alert("foo");
}//END simpleFunction

function nestedBraces() {
    var x;
    if (x) {
        alert("foo");
    }
}//END nestedBraces

function nestedFunction() {
    var x;
    var myFunc = function () {
        alert("foo");
    };
}//END nestedFunction

function endBraceInString() {
    alert("this is a brace: }");
}//END endBraceInString

function endBraceInSingleQuoteString() {
    alert('this is a brace: }');
}//END endBraceInSingleQuoteString

function endBraceInLineComment() {
    // this is a brace: }
}//END endBraceInLineComment

function endBraceInBlockComment() {
    /* this is a brace: } */
}//END endBraceInBlockComment

function endBraceInMultilineBlockComment() {
    /* 
        this is a brace: } 
    */
}//END endBraceInMultilineBlockComment

function endBraceInRegexp() {
    /this is a brace \}/.exec("foo");
}//END endBraceInRegexp

function singleLine() { alert("foo"); }//END singleLine

function singleLineWithFakeBrace() { alert("this is a brace: }"); }//END singleLineWithFakeBrace

function itsComplicated() {
    var x;
    
    if (x) {
        /*
            here's a brace: {
            { and more braces }
        */
        {
            /some \} brace/;
        }
        // if (foo) { bar; }
        // if (foo) {
        //     bar;
        // }
    }
    
    alert("brace }");
    alert('{braces}');
}//END itsComplicated
