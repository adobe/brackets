//
//  Test comment
//
define('one',
    [
     "require", "two"
    ],
  function(require) {
    var one = {
      size: "large",
      doSomething: function() {
        return require("two");
      }
    };

    return one;
  }
)
