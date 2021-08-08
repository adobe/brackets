define('plugin', [], {
    load: function (name, req, load, config) {
        req([name], function (value) {
            load(value);
        });
    }
});
