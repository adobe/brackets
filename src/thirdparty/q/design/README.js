/*
This document is intended to explain how promises work and why this
implementation works its particular way by building a promise library
incrementally and reviewing all of its major design decisions.  This is
intended to leave the reader at liberty to experiment with variations
of this implementation that suit their own requirements, without missing
any important details.

-

Suppose that you're writing a function that can't return a value immediately.
The most obvious API is to forward the eventual value to a callback as an
argument instead of returning the value.
*/

var oneOneSecondLater = function (callback) {
    setTimeout(function () {
        callback(1);
    }, 1000);
};

/*
This is a very simple solution to a trival problem, but there is a lot of room
for improvement.

A more general solution would provide analogous tools for both return values
and thrown exceptions.  There are several obvious ways to extend the callback
pattern to handle exceptions.  One is to provide both a callback and an
errback.
*/

var maybeOneOneSecondLater = function (callback, errback) {
    setTimeout(function () {
        if (Math.random() < .5) {
            callback(1);
        } else {
            errback(new Error("Can't provide one."));
        }
    }, 1000);
};

/*
There are other approaches, variations on providing the error as an argument
to the callback, either by position or a distinguished sentinel value.
However, none of these approaches actually model thrown exceptions.  The
purpose of exceptions and try/catch blocks is to postpone the explicit
handling of exceptions until the program has returned to a point where it
makes sense to attempt to recover.  There needs to be some mechanism for
implicitly propagating exceptions if they are not handled.


Promises
========

Consider a more general approach, where instead of returning values or
throwing exceptions, functions return an object that represents the eventual
result of the function, either sucessful or failed.  This object is a promise,
both figuratively and by name, to eventually resolve.  We can call a function
on the promise to observe either its fulfillment or rejection.  If the promise
is rejected and the rejection is not explicitly observed, any derrived
promises will be implicitly rejected for the same reason.

In this particular iteration of the design, we'll model a promise as an object
with a "then" function that registers the callback.
*/

var maybeOneOneSecondLater = function () {
    var callback;
    setTimeout(function () {
        callback(1);
    }, 1000);
    return {
        then: function (_callback) {
            callback = _callback;
        }
    };
};

maybeOneOneSecondLater().then(callback);

/*
This design has two weaknesses: 

- The first caller of the then method determines the callback that is used.
  It would be more useful if every registered callback were notified of
  the resolution.
- If the callback is registered more than a second after the promise was
  constructed, it won't be called.

A more general solution would accept any number of callbacks and permit them
to be registered either before or after the timeout, or generally, the
resolution event.  We accomplish this by making the promise a two-state object.

A promise is initially unresolved and all callbacks are added to an array of
pending observers.  When the promise is resolved, all of the observers are
notified.  After the promise has been resolved, new callbacks are called
immediately.  We distinguish the state change by whether the array of pending
callbacks still exists, and we throw them away after resolution.
*/

var maybeOneOneSecondLater = function () {
    var pending = [], value;
    setTimeout(function () {
        value = 1;
        for (var i = 0, ii = pending.length; i < ii; i++) {
            var callback = pending[i];
            callback(value);
        }
        pending = undefined;
    }, 1000);
    return {
        then: function (callback) {
            if (pending) {
                pending.push(callback);
            } else {
                callback(value);
            }
        }
    };
};

/*
This is already doing enough that it would be useful to break it into a
utility function.  A deferred is an object with two parts: one for registering
observers and another for notifying observers of resolution.
(see design/q0.js)
*/

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

var oneOneSecondLater = function () {
    var result = defer();
    setTimeout(function () {
        result.resolve(1);
    }, 1000);
    return result;
};

oneOneSecondLater().then(callback);

/*
The resolve function now has a flaw: it can be called multiple times, changing
the value of the promised result.  This fails to model the fact that a
function only either returns one value or throws one error.  We can protect
against accidental or malicious resets by only allowing only the first call to
resolve to set the resolution.
*/

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

/*
You can make an argument either for throwing an error or for ignoring all
subsequent resolutions.  One use-case is to give the resolver to a bunch of
workers and have a race to resolve the promise, where subsequent resolutions
would be ignored.  It's also possible that you do not want the workers to know
which won.  Hereafter, all examples will ignore rather than fault on multiple
resolution.

At this point, defer can handle both multiple resolution and multiple
observation. (see design/q1.js)

--------------------------------

There are a few variations on this design which arise from two separate
tensions.  The first tension is that it is both useful to separate or combine
the promise and resolver parts of the deferred.  It is also useful to have
some way of distinguishing promises from other values.

-

Separating the promise portion from the resolver allows us to code within the
principle of least authority.  Giving someone a promise should give only the
authority to observe the resolution and giving someone a resolver should only
give the authority to determine the resolution.  One should not implicitly
give the other.  The test of time shows that any excess authority will
inevitably be abused and will be very difficult to redact.

The disadvantage of separation, however, is the additional burden on the
garbage collector to quickly dispose of used promise objects.

-

Also, there are a variety of ways to distinguish a promise from other values.
The most obvious and strongest distinction is to use prototypical inheritance.
(design/q2.js)
*/

var Promise = function () {
};

var isPromise = function (value) {
    return value instanceof Promise;
};

var defer = function () {
    var pending = [], value;
    var promise = new Promise();
    promise.then = function (callback) {
        if (pending) {
            pending.push(callback);
        } else {
            callback(value);
        }
    };
    return {
        resolve: function (_value) {
            if (pending) {
                value = _value;
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    var callback = pending[i];
                    callback(value);
                }
                pending = undefined;
            }
        },
        promise: promise
    };
};


/*
Using prototypical inheritance has the disadvantage that only one instance of
a promise library can be used in a single program.  This can be difficult to
enforce, leading to dependency enforcement woes.

Another approach is to use duck-typing, distinguishing promises from other
values by the existence of a conventionally named method.  In our case,
CommonJS/Promises/A establishes the use of "then" to distinguish its brand of
promises from other values.  This has the disadvantage of failing to
distinguish other objects that just happen to have a "then" method.  In
practice, this is not a problem, and the minor variations in "thenable"
implementations in the wild are manageable.
*/

var isPromise = function (value) {
    return value && typeof value.then === "function";
};

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
            }
        },
        promise: {
            then: function (callback) {
                if (pending) {
                    pending.push(callback);
                } else {
                    callback(value);
                }
            }
        }
    };
};

/*
The next big step is making it easy to compose promises, to make new promises
using values obtained from old promises.  Supposing that you have received
promises for two numbers from a couple function calls, we would like to be
able to create a promise for their sum.  Consider how this is achieved with
callbacks.
*/

var twoOneSecondLater = function (callback) {
    var a, b;
    var consider = function () {
        if (a === undefined || b === undefined)
            return;
        callback(a + b);
    };
    oneOneSecondLater(function (_a) {
        a = _a;
        consider();
    });
    oneOneSecondLater(function (_b) {
        b = _b;
        consider();
    });
};

twoOneSecondLater(function (c) {
    // c === 2
});

/*
This approach is fragile for a number of reasons, particularly that there
needs to be code to explicitly notice, in this case by a sentinel value,
whether a callback has been called.  One must also take care to account for cases
where callbacks are issued before the end of the event loop turn: the `consider`
function must appear before it is used.

In a few more steps, we will be able to accomplish this using promises in less
code and handling error propagation implicitly.
*/

var a = oneOneSecondLater();
var b = oneOneSecondLater();
var c = a.then(function (a) {
    return b.then(function (b) {
        return a + b;
    });
});

/*
For this to work, several things have to fall into place:

 - The "then" method must return a promise.
 - The returned promise must be eventually resolved with the
   return value of the callback.
 - The return value of the callback must be either a fulfilled
   value or a promise.

Converting values into promises that have already been fulfilled
is straightforward.  This is a promise that immediately informs
any observers that the value has already been fulfilled.
*/

var ref = function (value) {
    return {
        then: function (callback) {
            callback(value);
        }
    };
};

/*
This method can be altered to coerce the argument into a promise
regardless of whether it is a value or a promise already.
*/

var ref = function (value) {
    if (value && typeof value.then === "function")
        return value;
    return {
        then: function (callback) {
            callback(value);
        }
    };
};

/*
Now, we need to start altering our "then" methods so that they
return promises for the return value of their given callback.
The "ref" case is simple.  We'll coerce the return value of the
callback to a promise and return that immediately.
*/

var ref = function (value) {
    if (value && typeof value.then === "function")
        return value;
    return {
        then: function (callback) {
            return ref(callback(value));
        }
    };
};

/*
This is more complicated for the deferred since the callback
will be called in a future turn.  In this case, we recur on "defer"
and wrap the callback.  The value returned by the callback will
resolve the promise returned by "then".

Furthermore, the "resolve" method needs to handle the case where the
resolution is itself a promise to resolve later.  This is accomplished by
changing the resolution value to a promise.  That is, it implements a "then"
method, and can either be a promise returned by "defer" or a promise returned
by "ref".  If it's a "ref" promise, the behavior is identical to before: the
callback is called immediately by "then(callback)".  If it's a "defer"
promise, the callback is passed forward to the next promise by calling
"then(callback)".  Thus, your callback is now observing a new promise for a
more fully resolved value.  Callbacks can be forwarded many times, making
"progress" toward an eventual resolution with each forwarding.
*/

var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = ref(_value); // values wrapped in a promise
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    var callback = pending[i];
                    value.then(callback); // then called instead
                }
                pending = undefined;
            }
        },
        promise: {
            then: function (_callback) {
                var result = defer();
                // callback is wrapped so that its return
                // value is captured and used to resolve the promise
                // that "then" returns
                var callback = function (value) {
                    result.resolve(_callback(value));
                };
                if (pending) {
                    pending.push(callback);
                } else {
                    value.then(callback);
                }
                return result.promise;
            }
        }
    };
};

/*
The implementation at this point uses "thenable" promises and separates the
"promise" and "resolve" components of a "deferred".
(see design/q4.js)


Error Propagation
=================

To achieve error propagation, we need to reintroduce errbacks.  We use a new
type of promise, analogous to a "ref" promise, that instead of informing a
callback of the promise's fulfillment, it will inform the errback of its
rejection and the reason why.
*/

var reject = function (reason) {
    return {
        then: function (callback, errback) {
            return ref(errback(reason));
        }
    };
};

/*
The simplest way to see this in action is to observe the resolution of
an immediate rejection.
*/

reject("Meh.").then(function (value) {
    // we never get here
}, function (reason) {
    // reason === "Meh."
});

/*
We can now revise our original errback use-case to use the promise
API.
*/

var maybeOneOneSecondLater = function (callback, errback) {
    var result = defer();
    setTimeout(function () {
        if (Math.random() < .5) {
            result.resolve(1);
        } else {
            result.resolve(reject("Can't provide one."));
        }
    }, 1000);
    return result.promise;
};

/*
To make this example work, the defer system needs new plumbing so that it can
forward both the callback and errback components.  So, the array of pending
callbacks will be replaced with an array of arguments for "then" calls.
*/

var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = ref(_value);
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    // apply the pending arguments to "then"
                    value.then.apply(value, pending[i]);
                }
                pending = undefined;
            }
        },
        promise: {
            then: function (_callback, _errback) {
                var result = defer();
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

/*
There is, however, a subtle problem with this version of "defer".  It mandates
that an errback must be provided on all "then" calls, or an exception will be
thrown when trying to call a non-existant function.  The simplest solution to
this problem is to provide a default errback that forwards the rejection.  It
is also reasonable for the callback to be omitted if you're only interested in
observing rejections, so we provide a default callback that forwards the
fulfilled value.
*/

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

/*
At this point, we've achieved composition and implicit error propagation.  We
can now very easily create promises from other promises either in serial or in
parallel (see design/q6.js).  This example creates a promise for the eventual
sum of promised values.
*/

promises.reduce(function (accumulating, promise) {
    return accumulating.then(function (accumulated) {
        return promise.then(function (value) {
            return accumulated + value;
        });
    });
}, ref(0)) // start with a promise for zero, so we can call then on it
           // just like any of the combined promises
.then(function (sum) {
    // the sum is here
});

/*


Safety and Invariants
=====================

Another incremental improvement is to make sure that callbacks and errbacks
are called in future turns of the event loop, in the same order that they
were registered.  This greatly reduces the number of control-flow hazards
inherent to asynchronous programming.  Consider a brief and contrived example:
*/

var blah = function () {
    var result = foob().then(function () {
        return barf();
    });
    var barf = function () {
        return 10;
    };
    return result;
};

/*
This function will either throw an exception or return a promise that will
quickly be fulfilled with the value of 10.  It depends on whether foob()
resolves in the same turn of the event loop (issuing its callback on the same
stack immediately) or in a future turn.  If the callback is delayed to a
future turn, it will allways succeed.
(see design/q7.js)
*/

var enqueue = function (callback) {
    //process.nextTick(callback); // NodeJS
    setTimeout(callback, 1); // Naïve browser solution
};

var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = ref(_value);
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    // XXX
                    enqueue(function () {
                        value.then.apply(value, pending[i]);
                    });
                }
                pending = undefined;
            }
        },
        promise: {
            then: function (_callback, _errback) {
                var result = defer();
                _callback = _callback || function (value) {
                    return value;
                };
                _errback = _errback || function (reason) {
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
                    // XXX
                    enqueue(function () {
                        value.then(callback, errback);
                    });
                }
                return result.promise;
            }
        }
    };
};

var ref = function (value) {
    if (value && value.then)
        return value;
    return {
        then: function (callback) {
            var result = defer();
            // XXX
            enqueue(function () {
                result.resolve(callback(value));
            });
            return result.promise;
        }
    };
};

var reject = function (reason) {
    return {
        then: function (callback, errback) {
            var result = defer();
            // XXX
            enqueue(function () {
                result.resolve(errback(reason));
            });
            return result.promise;
        }
    };
};

/*
There remains one safty issue, though.  Given that any object that implements
"then" is treated as a promise, anyone who calls "then" directly is at risk
of surprise.

 - The callback or errback might get called in the same turn
 - The callback and errback might both be called
 - The callback or errback might be called more than once

A "when" method wraps a promise and prevents these surprises.

We can also take the opportunity to wrap the callback and errback
so that any exceptions thrown get transformed into rejections.
*/

var when = function (value, _callback, _errback) {
    var result = defer();
    var done;

    _callback = _callback || function (value) {
        return value;
    };
    _errback = _errback || function (reason) {
        return reject(reason);
    };

    var callback = function (value) {
        try {
            return _callback(value);
        } catch (reason) {
            return reject(reason);
        }
    };
    var errback = function (reason) {
        try {
            return _errback(reason);
        } catch (reason) {
            return reject(reason);
        }
    };

    enqueue(function () {
        ref(value).then(function (value) {
            if (done)
                return;
            done = true;
            result.resolve(ref(value).then(callback, errback));
        }, function (reason) {
            if (done)
                return;
            done = true;
            result.resolve(errback(reason));
        });
    });

    return result.promise;
};

/*
At this point, we have the means to protect ourselves against several
surprises including unnecessary non-deterministic control-flow in the course
of an event and broken callback and errback control-flow invariants.
(see design/q7.js)


Message Passing
===============

If we take a step back, promises have become objects that receive "then"
messages.  Deferred promises forward those messages to their resolution
promise.  Fulfilled promises respond to then messages by calling the callback
with the fulfilled value.  Rejected promises respond to then messages by
calling the errback with the rejection reason.

We can generalize promises to be objects that receive arbitrary messages,
including "then/when" messages.  This is useful if there is a lot of latency
preventing the immediate observation of a promise's resolution, as in a
promise that is in another process or worker or another computer on a network.

If we have to wait for a message to make a full round-trip across a network to
get a value, the round-trips can add up a lot and much time will be wasted.
This ammounts to "chatty" network protocol problems, which are the downfall
of SOAP and RPC in general.

However, if we can send a message to a distant promise before it resolves, the
remote promise can send responses in rapid succession.  Consider the case
where an object is housed on a remote server and cannot itself be sent across
the network; it has some internal state and capabilities that cannot be
serialized, like access to a database.  Suppose we obtain a promise for
this object and can now send messages.  These messages would likely mostly
comprise method calls like "query", which would in turn send promises back.

---

We must found a new family of promises based on a new method that sends
arbitrary messages to a promise.  "promiseSend" is defined by
CommonJS/Promises/D.  Sending a "when" message is equivalent to calling the
"then" method.

*/

promise.then(callback, errback);
promise.promiseSend("when", callback, errback);

/*
We must revisit all of our methods, building them on "promiseSend" instead of
"then".  However, we do not abandon "then" entirely; we still produce and
consume "thenable" promises, routing their message through "promiseSend"
internally.
*/

function Promise() {}
Promise.prototype.then = function (callback, errback) {
    return when(this, callback, errback);
};

/*
If a promise does not recognize a message type (an "operator" like "when"),
it must return a promise that will be eventually rejected.

Being able to receive arbitrary messages means that we can also implement new
types of promise that serves as a proxy for a remote promise, simply
forwarding all messages to the remote promise and forwarding all of its
responses back to promises in the local worker.

Between the use-case for proxies and rejecting unrecognized messages, it
is useful to create a promise abstraction that routes recognized messages to
a handler object, and unrecognized messages to a fallback method.

*/

var makePromise = function (handler, fallback) {
    var promise = new Promise();
    handler = handler || {};
    fallback = fallback || function (op) {
        return reject("Can't " + op);
    };
    promise.promiseSend = function (op, callback) {
        var args = Array.prototype.slice.call(arguments, 2);
        var result;
        callback = callback || function (value) {return value};
        if (handler[op]) {
            result = handler[op].apply(handler, args);
        } else {
            result = fallback.apply(handler, [op].concat(args));
        }
        return callback(result);
    };
    return promise;
};

/*
Each of the handler methods and the fallback method are all expected to return
a value which will be forwarded to the callback.  The handlers do not receive
their own name, but the fallback does receive the operator name so it can
route it.  Otherwise, arguments are passed through.
*/

/*
For the "ref" method, we still only coerce values that are not already
promises.  We also coerce "thenables" into "promiseSend" promises.
We provide methods for basic interaction with a fulfilled value, including
property manipulation and method calls.
*/

var ref = function (object) {
    if (object && typeof object.promiseSend !== "undefined") {
        return object;
    }
    if (object && typeof object.then !== "undefined") {
        return makePromise({
            when: function () {
                var result = defer();
                object.then(result.resolve, result.reject);
                return result;
            }
        }, function fallback(op) {
            return Q.when(object, function (object) {
                return Q.ref(object).promiseSend.apply(object, arguments);
            });
        });
    }
    return makePromise({
        when: function () {
            return object;
        },
        get: function (name) {
            return object[name];
        },
        put: function (name, value) {
            object[name] = value;
        },
        del: function (name) {
            delete object[name];
        }
    }); 
};

/*
Rejected promises simply forward their rejection to any message.
*/

var reject = function (reason) {
    var forward = function (reason) {
        return reject(reason);
    };
    return makePromise({
        when: function (errback) {
            errback = errback || forward;
            return errback(reason);
        }
    }, forward);
};

/*
Defer sustains very little damage.  Instead of having an array of arguments to
forward to "then", we have an array of arguments to forward to "promiseSend".
"makePromise" and "when" absorb the responsibility for handling the callback
and errback argument defaults and wrappers.
*/

var defer = function () {
    var pending = [], value;
    return {
        resolve: function (_value) {
            if (pending) {
                value = ref(_value);
                for (var i = 0, ii = pending.length; i < ii; i++) {
                    enqueue(function () {
                        value.promiseSend.apply(value, pending[i]);
                    });
                }
                pending = undefined;
            }
        },
        promise: {
            promiseSend: function () {
                var args = Array.prototype.slice.call(arguments);
                var result = defer();
                if (pending) {
                    pending.push(args);
                } else {
                    enqueue(function () {
                        value.promiseSend.apply(value, args);
                    });
                }
            }
        }
    };
};

/*
The last step is to make it syntactically convenient to send messages to
promises.  We create "get", "put", "post" and "del" functions that send
the corresponding messages and return promises for the results.  They
all look very similar.
*/

var get = function (object, name) {
    var result = defer();
    ref(object).promiseSend("get", result.resolve, name);
    return result.promise;
};

get({"a": 10}, "a").then(function (ten) {
    // ten === ten
});

/*

The last improvment to get promises up to the state-of-the-art is to rename
all of the callbacks to "win" and all of the errbacks to "fail".  I've left
this as an exercise.


Future
======


Andrew Sutherland did a great exercise in creating a variation of the Q
library that supported annotations so that waterfalls of promise creation,
resolution, and dependencies could be graphically depicited.  Optional
annotations and a debug variation of the Q library would be a logical
next-step.

There remains some question about how to ideally cancel a promise.  At the
moment, a secondary channel would have to be used to send the abort message.
This requires further research.

CommonJS/Promises/A also supports progress notification callbacks.  A
variation of this library that supports implicit composition and propagation
of progress information would be very awesome.

It is a common pattern that remote objects have a fixed set of methods, all
of which return promises.  For those cases, it is a common pattern to create
a local object that proxies for the remote object by forwarding all of its
method calls to the remote object using "post".  The construction of such
proxies could be automated.  Lazy-Arrays are certainly one use-case.

*/
