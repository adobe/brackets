define(['base'], function (base) {
    return {
        name: 'a',
        counter: 0,
        doSomething: function () {
            this.counter += 1;
            this.base = base;
            //This should not cause double notifications.
            require(['base'], function () {
            });
        }
    };
});
