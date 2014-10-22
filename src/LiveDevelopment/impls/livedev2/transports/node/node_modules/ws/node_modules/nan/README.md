Native Abstractions for Node.js
===============================

**A header file filled with macro and utility goodness for making addon development for Node.js easier across versions 0.8, 0.10 and 0.11, and eventually 0.12.**

***Current version: 0.3.2*** *(See [nan.h](https://github.com/rvagg/nan/blob/master/nan.h) for changelog)*

[![NPM](https://nodei.co/npm/nan.png?downloads=true&stars=true)](https://nodei.co/npm/nan/) [![NPM](https://nodei.co/npm-dl/nan.png?months=6)](https://nodei.co/npm/nan/)

Thanks to the crazy changes in V8 (and some in Node core), keeping native addons compiling happily across versions, particularly 0.10 to 0.11/0.12, is a minor nightmare. The goal of this project is to store all logic necessary to develop native Node.js addons without having to inspect `NODE_MODULE_VERSION` and get yourself into a macro-tangle.

This project also contains some helper utilities that make addon development a bit more pleasant.

 * **[Usage](#usage)**
 * **[Example](#example)**
 * **[API](#api)**

<a name="usage"></a>
## Usage

Simply add **NAN** as a dependency in the *package.json* of your Node addon:

```js
"dependencies": {
    ...
    "nan" : "~0.3.1"
    ...
}
```

Pull in the path to **NAN** in your *binding.gyp* so that you can use `#include "nan.h"` in your *.cpp*:

```js
"include_dirs" : [
    ...
    "<!(node -p -e \"require('path').dirname(require.resolve('nan'))\")"
    ...
]
```

This works like a `-I<path-to-NAN>` when compiling your addon.

<a name="example"></a>
## Example

See **[LevelDOWN](https://github.com/rvagg/node-leveldown/pull/48)** for a full example of **NAN** in use.

For a simpler example, see the **[async pi estimation example](https://github.com/rvagg/nan/tree/master/examples/async_pi_estimate)** in the examples directory for full code and an explanation of what this Monte Carlo Pi estimation example does. Below are just some parts of the full example that illustrate the use of **NAN**.

Compare to the current 0.10 version of this example, found in the [node-addon-examples](https://github.com/rvagg/node-addon-examples/tree/master/9_async_work) repository and also a 0.11 version of the same found [here](https://github.com/kkoopa/node-addon-examples/tree/5c01f58fc993377a567812597e54a83af69686d7/9_async_work).

Note that there is no embedded version sniffing going on here and also the async work is made much simpler, see below for details on the `NanAsyncWorker` class.

```c++
// addon.cc
#include <node.h>
#include "nan.h"
// ...

using namespace v8;

void InitAll(Handle<Object> exports) {
  exports->Set(NanSymbol("calculateSync"),
    FunctionTemplate::New(CalculateSync)->GetFunction());

  exports->Set(NanSymbol("calculateAsync"),
    FunctionTemplate::New(CalculateAsync)->GetFunction());
}

NODE_MODULE(addon, InitAll)
```

```c++
// sync.h
#include <node.h>
#include "nan.h"

NAN_METHOD(CalculateSync);
```

```c++
// sync.cc
#include <node.h>
#include "nan.h"
#include "sync.h"
// ...

using namespace v8;

// Simple synchronous access to the `Estimate()` function
NAN_METHOD(CalculateSync) {
  NanScope();

  // expect a number as the first argument
  int points = args[0]->Uint32Value();
  double est = Estimate(points);

  NanReturnValue(Number::New(est));
}
```

```c++
// async.cc
#include <node.h>
#include "nan.h"
#include "async.h"

// ...

using namespace v8;

class PiWorker : public NanAsyncWorker {
 public:
  PiWorker(NanCallback *callback, int points)
    : NanAsyncWorker(callback), points(points) {}
  ~PiWorker() {}

  // Executed inside the worker-thread.
  // It is not safe to access V8, or V8 data structures
  // here, so everything we need for input and output
  // should go on `this`.
  void Execute () {
    estimate = Estimate(points);
  }

  // Executed when the async work is complete
  // this function will be run inside the main event loop
  // so it is safe to use V8 again
  void HandleOKCallback () {
    NanScope();

    Local<Value> argv[] = {
        Local<Value>::New(Null())
      , Number::New(estimate)
    };

    callback->Call(2, argv);
  };

 private:
  int points;
  double estimate;
};

// Asynchronous access to the `Estimate()` function
NAN_METHOD(CalculateAsync) {
  NanScope();

  int points = args[0]->Uint32Value();
  NanCallback *callback = new NanCallback(args[1].As<Function>());

  NanAsyncQueueWorker(new PiWorker(callback, points));
  NanReturnUndefined();
}
```

<a name="api"></a>
## API

 * <a href="#api_nan_method"><b><code>NAN_METHOD</code></b></a>
 * <a href="#api_nan_getter"><b><code>NAN_GETTER</code></b></a>
 * <a href="#api_nan_setter"><b><code>NAN_SETTER</code></b></a>
 * <a href="#api_nan_property_getter"><b><code>NAN_PROPERTY_GETTER</code></b></a>
 * <a href="#api_nan_property_setter"><b><code>NAN_PROPERTY_SETTER</code></b></a>
 * <a href="#api_nan_property_enumerator"><b><code>NAN_PROPERTY_ENUMERATOR</code></b></a>
 * <a href="#api_nan_property_deleter"><b><code>NAN_PROPERTY_DELETER</code></b></a>
 * <a href="#api_nan_property_query"><b><code>NAN_PROPERTY_QUERY</code></b></a>
 * <a href="#api_nan_weak_callback"><b><code>NAN_WEAK_CALLBACK</code></b></a>
 * <a href="#api_nan_return_value"><b><code>NanReturnValue</code></b></a>
 * <a href="#api_nan_return_undefined"><b><code>NanReturnUndefined</code></b></a>
 * <a href="#api_nan_return_null"><b><code>NanReturnNull</code></b></a>
 * <a href="#api_nan_return_empty_string"><b><code>NanReturnEmptyString</code></b></a>
 * <a href="#api_nan_scope"><b><code>NanScope</code></b></a>
 * <a href="#api_nan_locker"><b><code>NanLocker</code></b></a>
 * <a href="#api_nan_unlocker"><b><code>NanUnlocker</code></b></a>
 * <a href="#api_nan_get_internal_field_pointer"><b><code>NanGetInternalFieldPointer</code></b></a>
 * <a href="#api_nan_set_internal_field_pointer"><b><code>NanSetInternalFieldPointer</code></b></a>
 * <a href="#api_nan_object_wrap_handle"><b><code>NanObjectWrapHandle</code></b></a>
 * <a href="#api_nan_make_weak"><b><code>NanMakeWeak</code></b></a>
 * <a href="#api_nan_symbol"><b><code>NanSymbol</code></b></a>
 * <a href="#api_nan_get_pointer_safe"><b><code>NanGetPointerSafe</code></b></a>
 * <a href="#api_nan_set_pointer_safe"><b><code>NanSetPointerSafe</code></b></a>
 * <a href="#api_nan_from_v8_string"><b><code>NanFromV8String</code></b></a>
 * <a href="#api_nan_boolean_option_value"><b><code>NanBooleanOptionValue</code></b></a>
 * <a href="#api_nan_uint32_option_value"><b><code>NanUInt32OptionValue</code></b></a>
 * <a href="#api_nan_throw_error"><b><code>NanThrowError</code></b>, <b><code>NanThrowTypeError</code></b>, <b><code>NanThrowRangeError</code></b>, <b><code>NanThrowError(Handle<Value>)</code></b>, <b><code>NanThrowError(Handle<Value>, int)</code></b></a>
 * <a href="#api_nan_new_buffer_handle"><b><code>NanNewBufferHandle(char *, size_t, FreeCallback, void *)</code></b>, <b><code>NanNewBufferHandle(char *, uint32_t)</code></b>, <b><code>NanNewBufferHandle(uint32_t)</code></b></a>
 * <a href="#api_nan_buffer_use"><b><code>NanBufferUse(char *, uint32_t)</code></b></a>
 * <a href="#api_nan_new_context_handle"><b><code>NanNewContextHandle</code></b></a>
 * <a href="#api_nan_has_instance"><b><code>NanHasInstance</code></b></a>
 * <a href="#api_nan_persistent_to_local"><b><code>NanPersistentToLocal</code></b></a>
 * <a href="#api_nan_dispose"><b><code>NanDispose</code></b></a>
 * <a href="#api_nan_assign_persistent"><b><code>NanAssignPersistent</code></b></a>
 * <a href="#api_nan_init_persistent"><b><code>NanInitPersistent</code></b></a>
 * <a href="#api_nan_callback"><b><code>NanCallback</code></b></a>
 * <a href="#api_nan_async_worker"><b><code>NanAsyncWorker</code></b></a>
 * <a href="#api_nan_async_queue_worker"><b><code>NanAsyncQueueWorker</code></b></a>

<a name="api_nan_method"></a>
### NAN_METHOD(methodname)

Use `NAN_METHOD` to define your V8 accessible methods:

```c++
// .h:
class Foo : public node::ObjectWrap {
  ...

  static NAN_METHOD(Bar);
  static NAN_METHOD(Baz);
}


// .cc:
NAN_METHOD(Foo::Bar) {
  ...
}

NAN_METHOD(Foo::Baz) {
  ...
}
```

The reason for this macro is because of the method signature change in 0.11:

```c++
// 0.10 and below:
Handle<Value> name(const Arguments& args)

// 0.11 and above
void name(const FunctionCallbackInfo<Value>& args)
```

The introduction of `FunctionCallbackInfo` brings additional complications:

<a name="api_nan_getter"></a>
### NAN_GETTER(methodname)

Use `NAN_GETTER` to declare your V8 accessible getters. You get a `Local<String>` `property` and an appropriately typed `args` object that can act like the `args` argument to a `NAN_METHOD` call.

You can use `NanReturnNull()`, `NanReturnEmptyString()`, `NanReturnUndefined()` and `NanReturnValue()` in a `NAN_GETTER`.

<a name="api_nan_setter"></a>
### NAN_SETTER(methodname)

Use `NAN_SETTER` to declare your V8 accessible setters. Same as `NAN_GETTER` but you also get a `Local<Value>` `value` object to work with.

You can use `NanReturnNull()`, `NanReturnEmptyString()`, `NanReturnUndefined()` and `NanReturnValue()` in a `NAN_SETTER`.

<a name="api_nan_property_getter"></a>
### NAN_PROPERTY_GETTER(cbname)
Use `NAN_PROPERTY_GETTER` to declare your V8 accessible property getters. You get a `Local<String>` `property` and an appropriately typed `args` object that can act similar to the `args` argument to a `NAN_METHOD` call.

You can use `NanReturnNull()`, `NanReturnEmptyString()`, `NanReturnUndefined()` and `NanReturnValue()` in a `NAN_PROPERTY_GETTER`.

<a name="api_nan_property_setter"></a>
### NAN_PROPERTY_SETTER(cbname)
Use `NAN_PROPERTY_SETTER` to declare your V8 accessible property setters. Same as `NAN_PROPERTY_GETTER` but you also get a `Local<Value>` `value` object to work with.

You can use `NanReturnNull()`, `NanReturnEmptyString()`, `NanReturnUndefined()` and `NanReturnValue()` in a `NAN_PROPERTY_SETTER`.

<a name="api_nan_property_enumerator"></a>
### NAN_PROPERTY_ENUMERATOR(cbname)
Use `NAN_PROPERTY_ENUMERATOR` to declare your V8 accessible property enumerators. You get an appropriately typed `args` object like the `args` argument to a `NAN_PROPERTY_GETTER` call.

You can use `NanReturnNull()`, `NanReturnEmptyString()`, `NanReturnUndefined()` and `NanReturnValue()` in a `NAN_PROPERTY_ENUMERATOR`.

<a name="api_nan_property_deleter"></a>
### NAN_PROPERTY_DELETER(cbname)
Use `NAN_PROPERTY_DELETER` to declare your V8 accessible property deleters. Same as `NAN_PROPERTY_GETTER`.

You can use `NanReturnNull()`, `NanReturnEmptyString()`, `NanReturnUndefined()` and `NanReturnValue()` in a `NAN_PROPERTY_DELETER`.

<a name="api_nan_property_query"></a>
### NAN_PROPERTY_QUERY(cbname)
Use `NAN_PROPERTY_QUERY` to declare your V8 accessible property queries. Same as `NAN_PROPERTY_GETTER`.

You can use `NanReturnNull()`, `NanReturnEmptyString()`, `NanReturnUndefined()` and `NanReturnValue()` in a `NAN_PROPERTY_QUERY`.

<a name="api_nan_weak_callback"></a>
### NAN_WEAK_CALLBACK(type, cbname)

Use `NAN_WEAK_CALLBACK` to declare your V8 WeakReference callbacks. There is an object argument accessible through `NAN_WEAK_CALLBACK_OBJECT`. The `type` argument gives the type of the `data` argument, accessible through `NAN_WEAK_CALLBACK_DATA(type)`.

```c++
static NAN_WEAK_CALLBACK(BufferReference*, WeakCheck) {
  if (NAN_WEAK_CALLBACK_DATA(BufferReference*)->noLongerNeeded_) {
    delete NAN_WEAK_CALLBACK_DATA(BufferReference*);
  } else {
    // Still in use, revive, prevent GC
    NanMakeWeak(NAN_WEAK_CALLBACK_OBJECT, NAN_WEAK_CALLBACK_DATA(BufferReference*), &WeakCheck);
  }
}

```
<a name="api_nan_return_value"></a>
### NanReturnValue(Handle&lt;Value&gt;)

Use `NanReturnValue` when you want to return a value from your V8 accessible method:

```c++
NAN_METHOD(Foo::Bar) {
  ...

  NanReturnValue(String::New("FooBar!"));
}
```

No `return` statement required.

<a name="api_nan_return_undefined"></a>
### NanReturnUndefined()

Use `NanReturnUndefined` when you don't want to return anything from your V8 accessible method:

```c++
NAN_METHOD(Foo::Baz) {
  ...

  NanReturnUndefined();
}
```

<a name="api_nan_return_null"></a>
### NanReturnNull()

Use `NanReturnNull` when you want to return `Null` from your V8 accessible method:

```c++
NAN_METHOD(Foo::Baz) {
  ...

  NanReturnNull();
}
```

<a name="api_nan_return_empty_string"></a>
### NanReturnEmptyString()

Use `NanReturnEmptyString` when you want to return an empty `String` from your V8 accessible method:

```c++
NAN_METHOD(Foo::Baz) {
  ...

  NanReturnEmptyString();
}
```

<a name="api_nan_scope"></a>
### NanScope()

The introduction of `isolate` references for many V8 calls in Node 0.11 makes `NanScope()` necessary, use it in place of `HandleScope scope`:

```c++
NAN_METHOD(Foo::Bar) {
  NanScope();

  NanReturnValue(String::New("FooBar!"));
}
```

<a name="api_nan_locker"></a>
### NanLocker()

The introduction of `isolate` references for many V8 calls in Node 0.11 makes `NanLocker()` necessary, use it in place of `Locker locker`:

```c++
NAN_METHOD(Foo::Bar) {
  NanLocker();
  ...
  NanUnlocker();
}
```

<a name="api_nan_unlocker"></a>
### NanUnlocker()

The introduction of `isolate` references for many V8 calls in Node 0.11 makes `NanUnlocker()` necessary, use it in place of `Unlocker unlocker`:

```c++
NAN_METHOD(Foo::Bar) {
  NanLocker();
  ...
  NanUnlocker();
}
```

<a name="api_nan_get_internal_field_pointer"></a>
### void * NanGetInternalFieldPointer(Handle&lt;Object&gt;, int)

Gets a pointer to the internal field with at `index` from a V8 `Object` handle.

```c++
Local<Object> obj;
...
NanGetInternalFieldPointer(obj, 0);
```
<a name="api_nan_set_internal_field_pointer"></a>
### void NanSetInternalFieldPointer(Handle&lt;Object&gt;, int, void *)

Sets the value of the internal field at `index` on a V8 `Object` handle.

```c++
static Persistent<Function> dataWrapperCtor;
...
Local<Object> wrapper = NanPersistentToLocal(dataWrapperCtor)->NewInstance();
NanSetInternalFieldPointer(wrapper, 0, this);
```

<a name="api_nan_object_wrap_handle"></a>
### Local&lt;Object&gt; NanObjectWrapHandle(Object)

When you want to fetch the V8 object handle from a native object you've wrapped with Node's `ObjectWrap`, you should use `NanObjectWrapHandle`:

```c++
NanObjectWrapHandle(iterator)->Get(String::NewSymbol("end"))
```

<a name="api_nan_make_weak"></a>
### NanMakeWeak(Persistent&lt;T&gt;, parameter, callback)

Make a persistent reference weak.

<a name="api_nan_symbol"></a>
### String NanSymbol(char *)

This isn't strictly about compatibility, it's just an easier way to create string symbol objects (i.e. `String::NewSymbol(x)`), for getting and setting object properties, or names of objects.

```c++
bool foo = false;
if (obj->Has(NanSymbol("foo")))
  foo = optionsObj->Get(NanSymbol("foo"))->BooleanValue()
```

<a name="api_nan_get_pointer_safe"></a>
### Type NanGetPointerSafe(Type *[, Type])

A helper for getting values from optional pointers. If the pointer is `NULL`, the function returns the optional default value, which defaults to `0`.  Otherwise, the function returns the value the pointer points to.

```c++
char *plugh(uint32_t *optional) {
  char res[] = "xyzzy";
  uint32_t param = NanGetPointerSafe<uint32_t>(optional, 0x1337);
  switch (param) {
    ...
  }
  NanSetPointerSafe<uint32_t>(optional, 0xDEADBEEF);
}  
```

<a name="api_nan_set_pointer_safe"></a>
### bool NanSetPointerSafe(Type *, Type)

A helper for setting optional argument pointers. If the pointer is `NULL`, the function simply return `false`.  Otherwise, the value is assigned to the variable the pointer points to.

```c++
const char *plugh(size_t *outputsize) {
  char res[] = "xyzzy";
  if !(NanSetPointerSafe<size_t>(outputsize, strlen(res) + 1)) {
    ...
  }

  ...
}
```

<a name="api_nan_from_v8_string"></a>
### char* NanFromV8String(Handle&lt;Value&gt;[, enum Nan::Encoding, size_t *, char *, size_t, int])

When you want to convert a V8 `String` to a `char*` use `NanFromV8String`. It is possible to define an encoding that defaults to `Nan::UTF8` as well as a pointer to a variable that will be assigned the number of bytes in the returned string. It is also possible to supply a buffer and its length to the function in order not to have a new buffer allocated. The final argument allows optionally setting `String::WriteOptions`, which default to `String::HINT_MANY_WRITES_EXPECTED | String::NO_NULL_TERMINATION`.
Just remember that you'll end up with an object that you'll need to `delete[]` at some point unless you supply your own buffer:

```c++
size_t count;
char* name = NanFromV8String(args[0]);
char* decoded = NanFromV8String(args[1], Nan::BASE64, &count, NULL, 0, String::HINT_MANY_WRITES_EXPECTED);
char param_copy[count];
memcpy(param_copy, decoded, count);
delete[] decoded;
```

<a name="api_nan_boolean_option_value"></a>
### bool NanBooleanOptionValue(Handle&lt;Value&gt;, Handle&lt;String&gt;[, bool])

When you have an "options" object that you need to fetch properties from, boolean options can be fetched with this pair. They check first if the object exists (`IsEmpty`), then if the object has the given property (`Has`) then they get and convert/coerce the property to a `bool`.

The optional last parameter is the *default* value, which is `false` if left off:

```c++
// `foo` is false unless the user supplies a truthy value for it
bool foo = NanBooleanOptionValue(optionsObj, NanSymbol("foo"));
// `bar` is true unless the user supplies a falsy value for it
bool bar = NanBooleanOptionValueDefTrue(optionsObj, NanSymbol("bar"), true);
```

<a name="api_nan_uint32_option_value"></a>
### uint32_t NanUInt32OptionValue(Handle&lt;Value&gt;, Handle&lt;String&gt;, uint32_t)

Similar to `NanBooleanOptionValue`, use `NanUInt32OptionValue` to fetch an integer option from your options object. Can be any kind of JavaScript `Number` and it will be coerced to an unsigned 32-bit integer.

Requires all 3 arguments as a default is not optional:

```c++
uint32_t count = NanUInt32OptionValue(optionsObj, NanSymbol("count"), 1024);
```

<a name="api_nan_throw_error"></a>
### NanThrowError(message), NanThrowTypeError(message), NanThrowRangeError(message), NanThrowError(Local&lt;Value&gt;), NanThrowError(Local&lt;Value&gt;, int)

For throwing `Error`, `TypeError` and `RangeError` objects. You should `return` this call:

```c++
return NanThrowError("you must supply a callback argument");
```

Can also handle any custom object you may want to throw. If used with the error code argument, it will add the supplied error code to the error object as a property called `code`.

<a name="api_nan_new_buffer_handle"></a>
### Local&lt;Object&gt; NanNewBufferHandle(char *, uint32_t), Local&lt;Object&gt; NanNewBufferHandle(uint32_t)

The `Buffer` API has changed a little in Node 0.11, this helper provides consistent access to `Buffer` creation:

```c++
NanNewBufferHandle((char*)value.data(), value.size());
```

Can also be used to initialize a `Buffer` with just a `size` argument.

Can also be supplied with a `NAN_WEAK_CALLBACK` and a hint for the garbage collector, when dealing with weak references.

<a name="api_nan_buffer_use"></a>
### Local&lt;Object&gt; NanBufferUse(char*, uint32_t)

`Buffer::New(char*, uint32_t)` prior to 0.11 would make a copy of the data.
While it was possible to get around this, it required a shim by passing a
callback. So the new API `Buffer::Use(char*, uint32_t)` was introduced to remove
needing to use this shim.

`NanBufferUse` uses the `char*` passed as the backing data, and will free the
memory automatically when the weak callback is called. Keep this in mind, as
careless use can lead to "double free or corruption" and other cryptic failures.

<a name="api_nan_has_instance"></a>
### bool NanHasInstance(Persistent&lt;FunctionTemplate&gt;&, Handle&lt;Value&gt;)

Can be used to check the type of an object to determine it is of a particular class you have already defined and have a `Persistent<FunctionTemplate>` handle for.

<a name="api_nan_persistent_to_local"></a>
### Local&lt;Type&gt; NanPersistentToLocal(Persistent&lt;Type&gt;&)

Aside from `FunctionCallbackInfo`, the biggest and most painful change to V8 in Node 0.11 is the many restrictions now placed on `Persistent` handles. They are difficult to assign and difficult to fetch the original value out of.

Use `NanPersistentToLocal` to convert a `Persistent` handle back to a `Local` handle.

```c++
Local<Object> handle = NanPersistentToLocal(persistentHandle);
```

<a href="#api_nan_new_context_handle">
### Local&lt;Context&gt; NanNewContextHandle([ExtensionConfiguration*, Handle&lt;ObjectTemplate&gt;, Handle&lt;Value&gt;])
Creates a new `Local<Context>` handle.

```c++
Local<FunctionTemplate> ftmpl = FunctionTemplate::New();
Local<ObjectTemplate> otmpl = ftmpl->InstanceTemplate();
Local<Context> ctx =  NanNewContextHandle(NULL, otmpl);
```

<a name="api_nan_dispose"></a>
### void NanDispose(Persistent&lt;T&gt; &)

Use `NanDispose` to dispose a `Persistent` handle.

```c++
NanDispose(persistentHandle);
```

<a name="api_nan_assign_persistent"></a>
### NanAssignPersistent(type, handle, object)

Use `NanAssignPersistent` to assign a non-`Persistent` handle to a `Persistent` one. You can no longer just declare a `Persistent` handle and assign directly to it later, you have to `Reset` it in Node 0.11, so this makes it easier.

In general it is now better to place anything you want to protect from V8's garbage collector as properties of a generic `Object` and then assign that to a `Persistent`. This works in older versions of Node also if you use `NanAssignPersistent`:

```c++
Persistent<Object> persistentHandle;

...

Local<Object> obj = Object::New();
obj->Set(NanSymbol("key"), keyHandle); // where keyHandle might be a Local<String>
NanAssignPersistent(Object, persistentHandle, obj)
```

<a name="api_nan_init_persistent"></a>
### NanInitPersistent(type, name, object)

User `NanInitPersistent` to declare and initialize a new `Persistent` with the supplied object. The assignment operator for `Persistent` is no longer public in Node 0.11, so this macro makes it easier to declare and initializing a new `Persistent`. See <a href="#api_nan_assign_persistent"><b><code>NanAssignPersistent</code></b></a> for more information.

```c++
Local<Object> obj = Object::New();
obj->Set(NanSymbol("key"), keyHandle); // where keyHandle might be a Local<String>
NanInitPersistent(Object, persistentHandle, obj);
```

<a name="api_nan_callback"></a>
### NanCallback

Because of the difficulties imposed by the changes to `Persistent` handles in V8 in Node 0.11, creating `Persistent` versions of your `Local<Function>` handles is annoyingly tricky. `NanCallback` makes it easier by taking your `Local` handle, making it persistent until the `NanCallback` is deleted and even providing a handy `Call()` method to fetch and execute the callback `Function`.

```c++
Local<Function> callbackHandle = callback = args[0].As<Function>();
NanCallback *callback = new NanCallback(callbackHandle);
// pass `callback` around and it's safe from GC until you:
delete callback;
```

You can execute the callback like so:

```c++
// no arguments:
callback->Call(0, NULL);

// an error argument:
Local<Value> argv[] = {
  Exception::Error(String::New("fail!"))
};
callback->Call(1, argv);

// a success argument:
Local<Value> argv[] = {
  Local<Value>::New(Null()),
  String::New("w00t!")
};
callback->Call(2, argv);
```

`NanCallback` also has a `Local<Function> GetCallback()` method that you can use to fetch a local handle to the underlying callback function if you need it.

<a name="api_nan_async_worker"></a>
### NanAsyncWorker

`NanAsyncWorker` is an abstract class that you can subclass to have much of the annoying async queuing and handling taken care of for you. It can even store arbitrary V8 objects for you and have them persist while the async work is in progress.

See a rough outline of the implementation:

```c++
class NanAsyncWorker {
public:
  NanAsyncWorker (NanCallback *callback);

  // Clean up persistent handles and delete the *callback
  virtual ~NanAsyncWorker ();

  // Check the `char *errmsg` property and call HandleOKCallback()
  // or HandleErrorCallback depending on whether it has been set or not
  virtual void WorkComplete ();

  // You must implement this to do some async work. If there is an
  // error then allocate `errmsg` to to a message and the callback will
  // be passed that string in an Error object
  virtual void Execute ();

protected:
  // Set this if there is an error, otherwise it's NULL
  const char *errmsg;

  // Save a V8 object in a Persistent handle to protect it from GC
  void SavePersistent(const char *key, Local<Object> &obj);

  // Fetch a stored V8 object (don't call from within `Execute()`)
  Local<Object> GetFromPersistent(const char *key);

  // Default implementation calls the callback function with no arguments.
  // Override this to return meaningful data
  virtual void HandleOKCallback ();

  // Default implementation calls the callback function with an Error object
  // wrapping the `errmsg` string
  virtual void HandleErrorCallback ();
};
```

<a name="api_nan_async_queue_worker"></a>
### NanAsyncQueueWorker(NanAsyncWorker *)

`NanAsyncQueueWorker` will run a `NanAsyncWorker` asynchronously via libuv. Both the *execute* and *after_work* steps are taken care of for you&mdash;most of the logic for this is embedded in `NanAsyncWorker`.

### Contributors

NAN is only possible due to the excellent work of the following contributors:

<table><tbody>
<tr><th align="left">Rod Vagg</th><td><a href="https://github.com/rvagg">GitHub/rvagg</a></td><td><a href="http://twitter.com/rvagg">Twitter/@rvagg</a></td></tr>
<tr><th align="left">Benjamin Byholm</th><td><a href="https://github.com/kkoopa/">GitHub/kkoopa</a></td></tr>
<tr><th align="left">Trevor Norris</th><td><a href="https://github.com/trevnorris">GitHub/trevnorris</a></td><td><a href="http://twitter.com/trevnorris">Twitter/@trevnorris</a></td></tr>
</tbody></table>

Licence &amp; copyright
-----------------------

Copyright (c) 2013 Rod Vagg & NAN contributors (listed above).

Native Abstractions for Node.js is licensed under an MIT +no-false-attribs license. All rights not explicitly granted in the MIT license are reserved. See the included LICENSE file for more details.
