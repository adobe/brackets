define(function (require) {
    //Important, notice the space between require and arg calls
    var b = require ('b');

    return (a = {
        name: 'a',
        b: b,
        ids: [],
        add: function (id) {
            this.ids.push(id);
        }
    });
});
