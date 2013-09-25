
var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            value = _value;
            for (var i = 0, ii = pending.length; i < ii; i++) {
                var callback = pending[i];
                callback(value);
            }
            pending = undefined;
        },
        then: function (callback) {
            if (pending) {
                pending.push(callback);
            } else {
                callback(value);
            }
        }
    }
};

