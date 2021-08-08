define(['text!test.txt'], function (text) {
    return {
        load: function (name, req, load, config) {
            load(text);
        }
    };
});
