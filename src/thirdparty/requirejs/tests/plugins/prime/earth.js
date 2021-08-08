define(function (require) {
   return {
        getA: function () {
            return require("../index!0?./a:./b:./c");
        },
        getC: function () {
            return require("../index!2?./a:./b:./c");
        },
        getB: function () {
            return require("../index!1?./a:./b:./c");
        }
   };
});
