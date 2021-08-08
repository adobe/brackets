define({
    load: function (name, require, load, config) {
        require([name], load);
    }
});
