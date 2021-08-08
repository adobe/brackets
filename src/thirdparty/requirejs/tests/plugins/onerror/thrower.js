
define({
    load: function (name, req, load, config) {
        req(['fake'], load, load.error);
    }
});
