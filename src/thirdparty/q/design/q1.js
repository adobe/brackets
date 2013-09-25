
var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = _value;
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    var callback = pending[i];
                    callback(value);
                }
                pending = undefined;
            } else {
                throw new Error("A promise can only be resolved once.");
            }
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

