:warning: Warning: The behavior described here is likely to be quickly
obseleted by developments in standardization and implementation.  Tread with
care.

Q has an `async` function.  This can be used to decorate a generator function
such that `yield` is effectively equivalent to `await` or `defer` syntax as
supported by languages like Go and C# 5.

Generator functions are presently on the standards track for ES6.  As of July
2013, they are only fully supported by bleeding edge V8, which hasn't made it
out to a released Chromium yet but will probably be in Chromium 29. Even then,
they must be enabled from [chrome://flags](chrome://flags) as "Experimental
JavaScript features." SpiderMonkey (used in Firefox) includes an older style of
generators, but these are not supported by Q.

Here's an example of using generators by themselves, without any Q features:

```js
function* count() {
    var i = 0;
    while (true) {
        yield i++;
    }
}

var counter = count();
count.next().value === 0;
count.next().value === 1;
count.next().value === 2;
```

`yield` can also return a value, if the `next` method of the generator is
called with a parameter:

```js
var buffer = (function* () {
    var x;
    while (true) {
        x = yield x;
    }
}());

buffer.next(1).value === undefined;
buffer.next("a").value === 1;
buffer.value(2).value === "a";
buffer.next().value === 2;
buffer.next().value === undefined;
buffer.next().value === undefined;
```

Inside functions wrapped with `Q.async`, we can use `yield` to wait for a
promise to settle:

```js
var eventualAdd = Q.async(function* (oneP, twoP) {
    var one = yield oneP;
    var two = yield twoP;
    return one + two;
});

eventualAdd(eventualOne, eventualTwo).then(function (three) {
    three === 3;
});
```
You can see more examples of how this works, as well as the `Q.spawn` function,
in the other files in this folder.
