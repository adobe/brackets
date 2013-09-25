
var isPromise = function (value) {
    return value && typeof value.then === "function";
};

var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = ref(_value);
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    value.then.apply(value, pending[i]);
                }
                pending = undefined;
            }
        },
        promise: {
            then: function (_callback, _errback) {
                var result = defer();
                // provide default callbacks and errbacks
                _callback = _callback || function (value) {
                    // by default, forward fulfillment
                    return value;
                };
                _errback = _errback || function (reason) {
                    // by default, forward rejection
                    return reject(reason);
                };
                var callback = function (value) {
                    result.resolve(_callback(value));
                };
                var errback = function (reason) {
                    result.resolve(_errback(reason));
                };
                if (pending) {
                    pending.push([callback, errback]);
                } else {
                    value.then(callback, errback);
                }
                return result.promise;
            }
        }
    };
};

var ref = function (value) {
    if (value && typeof value.then === "function")
        return value;
    return {
        then: function (callback) {
            return ref(callback(value));
        }
    };
};

var reject = function (reason) {
    return {
        then: function (callback, errback) {
            return ref(errback(reason));
        }
    };
};

