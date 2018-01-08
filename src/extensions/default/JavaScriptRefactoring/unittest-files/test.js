// Extract to Variable

// Declarations
var x;
var y = 34;

function test() {
    console.log("Testing");
}

// Literal
x = 923;

// Array
x = [1, 2, 3];

// Object
x = {
    test1: 12,
    test2: 45
};

// Property
x = x.test1;

// Function Expression
x = function() {
    console.log("hello world");
};

// Unary Expression
x = ++y;

// Binary Expression
x = 1 + 2 + 3;
x = 2 ** 3;

// Assignment Expression
x = 23;

// Logical Expression
x = true || false;

// Conditional Expression
x = (2 < 3)? 34: 45;

// Call Expression
test();

// New Expression
x = new Square();

// Sequence Expression
x = 1, 2, 3;

// Arrow functions
x = y => y ** 2;
x = (a, b) => {
    return a + b;
};

// Template Literals
x = `Template Literal`;

// Tagged Template Literal
x = String.raw`Hi${2 + 3}!`;

// Await Expression example
function resolveAfter2Seconds(x) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(x);
        }, 2000);
    });
}

async function f1() {
    var x = await resolveAfter2Seconds(10);
}

// Yield expression syntax
function* countAppleSales () {
    var saleList = [3, 7, 5];
    for (var i = 0; i < saleList.length; i++) {
        yield saleList[i];
    }
}

// Super expression example
class Polygon {
    constructor(height, width) {
        this.name = 'Polygon';
        this.height = height;
        this.width = width;
    }
    sayName() {
        console.log('Hi, I am a ', this.name + '.');
    }
}

class Square extends Polygon {
    constructor(length) {
        // the expression
        super(length, length);
        this.name = 'Square';
    }
}

// Class Expression
x = class {
    constructor (height, width) {
        this.a = height;
        this.b = width;
    }
};

// Multiple references of 34
function MultiReferences() {
    var x = 34;
    var y = 34;
    var z = 34;
}

// Unique name
function testUniqueName() {
    var extracted1 = 23;
    var x = 45;
}