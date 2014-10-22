/**********************************************************************************
 * NAN - Native Abstractions for Node.js
 *
 * Copyright (c) 2013 NAN contributors:
 *   - Rod Vagg <https://github.com/rvagg>
 *   - Benjamin Byholm <https://github.com/kkoopa>
 *   - Trevor Norris <https://github.com/trevnorris>
 *
 * MIT +no-false-attribs License <https://github.com/rvagg/nan/blob/master/LICENSE>
 *
 * Version 0.3.2 (current Node unstable: 0.11.6, Node stable: 0.10.17)
 *
 * ChangeLog:
 *  * 0.3.2 Aug 30 2013
 *    - Fix missing scope declaration in GetFromPersistent() and SaveToPersistent
 *      in NanAsyncWorker
 *
 *  * 0.3.1 Aug 20 2013
 *    - fix "not all control paths return a value" compile warning on some platforms
 *
 *  * 0.3.0 Aug 19 2013
 *    - Made NAN work with NPM
 *    - Lots of fixes to NanFromV8String, pulling in features from new Node core
 *    - Changed node::encoding to Nan::Encoding in NanFromV8String to unify the API
 *    - Added optional error number argument for NanThrowError()
 *    - Added NanInitPersistent()
 *    - Added NanReturnNull() and NanReturnEmptyString()
 *    - Added NanLocker and NanUnlocker
 *    - Added missing scopes
 *    - Made sure to clear disposed Persistent handles
 *    - Changed NanAsyncWorker to allocate error messages on the heap
 *    - Changed NanThrowError(Local<Value>) to NanThrowError(Handle<Value>)
 *    - Fixed leak in NanAsyncWorker when errmsg is used
 *
 *  * 0.2.2 Aug 5 2013
 *    - Fixed usage of undefined variable with node::BASE64 in NanFromV8String()
 *
 *  * 0.2.1 Aug 5 2013
 *    - Fixed 0.8 breakage, node::BUFFER encoding type not available in 0.8 for
 *      NanFromV8String()
 *
 *  * 0.2.0 Aug 5 2013
 *    - Added NAN_PROPERTY_GETTER, NAN_PROPERTY_SETTER, NAN_PROPERTY_ENUMERATOR,
 *      NAN_PROPERTY_DELETER, NAN_PROPERTY_QUERY
 *    - Extracted _NAN_METHOD_ARGS, _NAN_GETTER_ARGS, _NAN_SETTER_ARGS,
 *      _NAN_PROPERTY_GETTER_ARGS, _NAN_PROPERTY_SETTER_ARGS,
 *      _NAN_PROPERTY_ENUMERATOR_ARGS, _NAN_PROPERTY_DELETER_ARGS,
 *      _NAN_PROPERTY_QUERY_ARGS
 *    - Added NanGetInternalFieldPointer, NanSetInternalFieldPointer
 *    - Added NAN_WEAK_CALLBACK, NAN_WEAK_CALLBACK_OBJECT,
 *      NAN_WEAK_CALLBACK_DATA, NanMakeWeak
 *    - Renamed THROW_ERROR to _NAN_THROW_ERROR
 *    - Added NanNewBufferHandle(char*, size_t, node::smalloc::FreeCallback, void*)
 *    - Added NanBufferUse(char*, uint32_t)
 *    - Added NanNewContextHandle(v8::ExtensionConfiguration*,
 *        v8::Handle<v8::ObjectTemplate>, v8::Handle<v8::Value>)
 *    - Fixed broken NanCallback#GetFunction()
 *    - Added optional encoding and size arguments to NanFromV8String()
 *    - Added NanGetPointerSafe() and NanSetPointerSafe()
 *    - Added initial test suite (to be expanded)
 *    - Allow NanUInt32OptionValue to convert any Number object
 *
 *  * 0.1.0 Jul 21 2013
 *    - Added `NAN_GETTER`, `NAN_SETTER`
 *    - Added `NanThrowError` with single Local<Value> argument
 *    - Added `NanNewBufferHandle` with single uint32_t argument
 *    - Added `NanHasInstance(Persistent<FunctionTemplate>&, Handle<Value>)`
 *    - Added `Local<Function> NanCallback#GetFunction()`
 *    - Added `NanCallback#Call(int, Local<Value>[])`
 *    - Deprecated `NanCallback#Run(int, Local<Value>[])` in favour of Call
 *
 * See https://github.com/rvagg/nan for the latest update to this file
 **********************************************************************************/

#ifndef NAN_H
#define NAN_H

#include <node.h>
#include <node_buffer.h>
#include <string.h>

// some generic helpers

template<class T> static inline bool NanSetPointerSafe(T *var, T val) {
  if (var) {
    *var = val;
    return true;
  } else {
    return false;
  }
}

template<class T> static inline T NanGetPointerSafe(
    T *var,
    T fallback = reinterpret_cast<T>(0)) {
  if (var) {
    return *var;
  } else {
    return fallback;
  }
}

#define NanSymbol(value) v8::String::NewSymbol(value)

static inline bool NanBooleanOptionValue(
      v8::Local<v8::Object> optionsObj
    , v8::Handle<v8::String> opt, bool def) {

  if (def) {
    return optionsObj.IsEmpty()
      || !optionsObj->Has(opt)
      || optionsObj->Get(opt)->BooleanValue();
  } else {
    return !optionsObj.IsEmpty()
      && optionsObj->Has(opt)
      && optionsObj->Get(opt)->BooleanValue();
  }
}

static inline bool NanBooleanOptionValue(
      v8::Local<v8::Object> optionsObj
    , v8::Handle<v8::String> opt) {
  return NanBooleanOptionValue(optionsObj, opt, false);
}

static inline uint32_t NanUInt32OptionValue(
      v8::Local<v8::Object> optionsObj
    , v8::Handle<v8::String> opt
    , uint32_t def) {

  return !optionsObj.IsEmpty()
    && optionsObj->Has(opt)
    && optionsObj->Get(opt)->IsNumber()
      ? optionsObj->Get(opt)->Uint32Value()
      : def;
}

#if (NODE_MODULE_VERSION > 0x000B)
// Node 0.11+ (0.11.3 and below won't compile with these)

static v8::Isolate* nan_isolate = v8::Isolate::GetCurrent();

# define _NAN_METHOD_ARGS const v8::FunctionCallbackInfo<v8::Value>& args
# define NAN_METHOD(name) void name(_NAN_METHOD_ARGS)
# define _NAN_GETTER_ARGS const v8::PropertyCallbackInfo<v8::Value>& args
# define NAN_GETTER(name)                                                      \
    void name(v8::Local<v8::String> property, _NAN_GETTER_ARGS)
# define _NAN_SETTER_ARGS const v8::PropertyCallbackInfo<void>& args
# define NAN_SETTER(name)                                                      \
    void name(                                                                 \
        v8::Local<v8::String> property                                         \
      , v8::Local<v8::Value> value                                             \
      , _NAN_SETTER_ARGS)
# define _NAN_PROPERTY_GETTER_ARGS                                             \
    const v8::PropertyCallbackInfo<v8::Value>& args
# define NAN_PROPERTY_GETTER(name)                                             \
    void name(v8::Local<v8::String> property                                   \
      , _NAN_PROPERTY_GETTER_ARGS)
# define _NAN_PROPERTY_SETTER_ARGS                                             \
    const v8::PropertyCallbackInfo<v8::Value>& args
# define NAN_PROPERTY_SETTER(name)                                             \
    void name(v8::Local<v8::String> property                                   \
    , v8::Local<v8::Value> value                                               \
    , _NAN_PROPERTY_SETTER_ARGS)
# define _NAN_PROPERTY_ENUMERATOR_ARGS                                         \
    const v8::PropertyCallbackInfo<v8::Array>& args
# define NAN_PROPERTY_ENUMERATOR(name)                                         \
    void name(_NAN_PROPERTY_ENUMERATOR_ARGS)
# define _NAN_PROPERTY_DELETER_ARGS                                            \
    const v8::PropertyCallbackInfo<v8::Boolean>& args
# define NAN_PROPERTY_DELETER(name)                                            \
    void name(                                                                 \
        v8::Local<v8::String> property                                         \
      , _NAN_PROPERTY_DELETER_ARGS)
# define _NAN_PROPERTY_QUERY_ARGS                                              \
    const v8::PropertyCallbackInfo<v8::Integer>& args
# define NAN_PROPERTY_QUERY(name)                                              \
    void name(v8::Local<v8::String> property, _NAN_PROPERTY_QUERY_ARGS)
# define NanGetInternalFieldPointer(object, index)                             \
    object->GetAlignedPointerFromInternalField(index)
# define NanSetInternalFieldPointer(object, index, value)                      \
    object->SetAlignedPointerInInternalField(index, value)

# define NAN_WEAK_CALLBACK(type, name)                                         \
    void name(                                                                 \
      v8::Isolate* isolate,                                                    \
      v8::Persistent<v8::Object>* object,                                      \
      type data)
# define NAN_WEAK_CALLBACK_OBJECT (*object)
# define NAN_WEAK_CALLBACK_DATA(type) ((type) data)

# define NanScope() v8::HandleScope scope(nan_isolate)
# define NanLocker() v8::Locker locker(nan_isolate)
# define NanUnlocker() v8::Unlocker unlocker(nan_isolate)
# define NanReturnValue(value) return args.GetReturnValue().Set(value)
# define NanReturnUndefined() return
# define NanReturnNull() return args.GetReturnValue().SetNull()
# define NanReturnEmptyString() return args.GetReturnValue().SetEmptyString()
# define NanAssignPersistent(type, handle, obj) handle.Reset(nan_isolate, obj)
# define NanInitPersistent(type, name, obj)                                    \
    v8::Persistent<type> name(nan_isolate, obj)
# define NanObjectWrapHandle(obj) obj->handle()
# define NanMakeWeak(handle, parameter, callback)                              \
    handle.MakeWeak(nan_isolate, parameter, callback)

# define _NAN_THROW_ERROR(fun, errmsg)                                         \
    do {                                                                       \
      NanScope();                                                              \
      v8::ThrowException(fun(v8::String::New(errmsg)));                        \
    } while (0);

  inline static void NanThrowError(const char* errmsg) {
    _NAN_THROW_ERROR(v8::Exception::Error, errmsg);
  }

  inline static void NanThrowError(v8::Handle<v8::Value> error) {
    NanScope();
    v8::ThrowException(error);
  }

  inline static void NanThrowError(const char *msg, const int errorNumber) {
    v8::Local<v8::Value> err = v8::Exception::Error(v8::String::New(msg));
    v8::Local<v8::Object> obj = err.As<v8::Object>();
    obj->Set(v8::String::New("code"), v8::Int32::New(errorNumber));
    NanThrowError(err);
  }

  inline static void NanThrowTypeError(const char* errmsg) {
    _NAN_THROW_ERROR(v8::Exception::TypeError, errmsg);
  }

  inline static void NanThrowRangeError(const char* errmsg) {
    _NAN_THROW_ERROR(v8::Exception::RangeError, errmsg);
  }

  template<class T> static inline void NanDispose(v8::Persistent<T> &handle) {
    handle.Dispose(nan_isolate);
    handle.Clear();
  }

  static inline v8::Local<v8::Object> NanNewBufferHandle (
      char *data,
      size_t length,
      node::smalloc::FreeCallback callback,
      void *hint) {
    return node::Buffer::New(data, length, callback, hint);
  }

  static inline v8::Local<v8::Object> NanNewBufferHandle (
     char *data, uint32_t size) {
    return node::Buffer::New(data, size);
  }

  static inline v8::Local<v8::Object> NanNewBufferHandle (uint32_t size) {
    return node::Buffer::New(size);
  }

  static inline v8::Local<v8::Object> NanBufferUse(char* data, uint32_t size) {
    return node::Buffer::Use(data, size);
  }

  template <class TypeName>
  inline v8::Local<TypeName> NanPersistentToLocal(
     const v8::Persistent<TypeName>& persistent) {
    if (persistent.IsWeak()) {
     return v8::Local<TypeName>::New(nan_isolate, persistent);
    } else {
     return *reinterpret_cast<v8::Local<TypeName>*>(
         const_cast<v8::Persistent<TypeName>*>(&persistent));
    }
  }

  inline bool NanHasInstance(
        v8::Persistent<v8::FunctionTemplate>& function_template
      , v8::Handle<v8::Value> value) {
    return NanPersistentToLocal(function_template)->HasInstance(value);
  }

  static inline v8::Local<v8::Context> NanNewContextHandle(
    v8::ExtensionConfiguration* extensions = NULL,
    v8::Handle<v8::ObjectTemplate> tmpl = v8::Handle<v8::ObjectTemplate>(),
    v8::Handle<v8::Value> obj = v8::Handle<v8::Value>()) {
      return v8::Local<v8::Context>::New(nan_isolate, v8::Context::New(
          nan_isolate, extensions, tmpl, obj));
  }

#else
// Node 0.8 and 0.10

# define _NAN_METHOD_ARGS const v8::Arguments& args
# define NAN_METHOD(name) v8::Handle<v8::Value> name(_NAN_METHOD_ARGS)
# define _NAN_GETTER_ARGS const v8::AccessorInfo &args
# define NAN_GETTER(name)                                                      \
    v8::Handle<v8::Value> name(v8::Local<v8::String> property, _NAN_GETTER_ARGS)
# define _NAN_SETTER_ARGS const v8::AccessorInfo &args
# define NAN_SETTER(name)                                                      \
    void name(                                                                 \
      v8::Local<v8::String> property                                           \
    , v8::Local<v8::Value> value                                               \
    , _NAN_SETTER_ARGS)
# define _NAN_PROPERTY_GETTER_ARGS const v8::AccessorInfo& args
# define NAN_PROPERTY_GETTER(name)                                             \
    v8::Handle<v8::Value> name(v8::Local<v8::String> property                  \
    , _NAN_PROPERTY_GETTER_ARGS)
# define _NAN_PROPERTY_SETTER_ARGS const v8::AccessorInfo& args
# define NAN_PROPERTY_SETTER(name)                                             \
    v8::Handle<v8::Value> name(v8::Local<v8::String> property                  \
    , v8::Local<v8::Value> value                                               \
    , _NAN_PROPERTY_SETTER_ARGS)
# define _NAN_PROPERTY_ENUMERATOR_ARGS const v8::AccessorInfo& args
# define NAN_PROPERTY_ENUMERATOR(name)                                         \
    v8::Handle<v8::Array> name(_NAN_PROPERTY_ENUMERATOR_ARGS)
# define _NAN_PROPERTY_DELETER_ARGS const v8::AccessorInfo& args
# define NAN_PROPERTY_DELETER(name)                                            \
    v8::Handle<v8::Boolean> name(                                              \
      v8::Local<v8::String> property                                           \
    , _NAN_PROPERTY_DELETER_ARGS)
# define _NAN_PROPERTY_QUERY_ARGS const v8::AccessorInfo& args
# define NAN_PROPERTY_QUERY(name)                                              \
    v8::Handle<v8::Integer> name(                                              \
      v8::Local<v8::String> property                                           \
    , _NAN_PROPERTY_QUERY_ARGS)

# define NanGetInternalFieldPointer(object, index)                             \
    object->GetPointerFromInternalField(index)
# define NanSetInternalFieldPointer(object, index, value)                      \
    object->SetPointerInInternalField(index, value)
# define NAN_WEAK_CALLBACK(type, name) void name(                              \
                v8::Persistent<v8::Value> object,                              \
                void *data)
# define NAN_WEAK_CALLBACK_OBJECT object
# define NAN_WEAK_CALLBACK_DATA(type) ((type) data)

# define NanScope() v8::HandleScope scope
# define NanLocker() v8::Locker locker
# define NanUnlocker() v8::Unlocker unlocker
# define NanReturnValue(value) return scope.Close(value)
# define NanReturnUndefined() return v8::Undefined()
# define NanReturnNull() return v8::Null()
# define NanReturnEmptyString() return v8::String::Empty()
# define NanInitPersistent(type, name, obj)                                    \
    v8::Persistent<type> name = v8::Persistent<type>::New(obj)
# define NanAssignPersistent(type, handle, obj)                                \
    handle = v8::Persistent<type>::New(obj)
# define NanObjectWrapHandle(obj) obj->handle_
# define NanMakeWeak(handle, parameters, callback)                             \
    handle.MakeWeak(parameters, callback)

# define _NAN_THROW_ERROR(fun, errmsg)                                         \
    do {                                                                       \
      NanScope();                                                              \
      return v8::ThrowException(fun(v8::String::New(errmsg)));                 \
    } while (0);

  inline static v8::Handle<v8::Value> NanThrowError(const char* errmsg) {
    _NAN_THROW_ERROR(v8::Exception::Error, errmsg);
  }

  inline static v8::Handle<v8::Value> NanThrowError(
      v8::Handle<v8::Value> error) {
    NanScope();
    return v8::ThrowException(error);
  }

  inline static v8::Handle<v8::Value> NanThrowError(
      const char *msg,
      const int errorNumber) {
    v8::Local<v8::Value> err = v8::Exception::Error(v8::String::New(msg));
    v8::Local<v8::Object> obj = err.As<v8::Object>();
    obj->Set(v8::String::New("code"), v8::Int32::New(errorNumber));
    return NanThrowError(err);
  }

  inline static v8::Handle<v8::Value> NanThrowTypeError(const char* errmsg) {
    _NAN_THROW_ERROR(v8::Exception::TypeError, errmsg);
  }

  inline static v8::Handle<v8::Value> NanThrowRangeError(const char* errmsg) {
    _NAN_THROW_ERROR(v8::Exception::RangeError, errmsg);
  }

  template<class T> static inline void NanDispose(v8::Persistent<T> &handle) {
    handle.Dispose();
    handle.Clear();
  }

  static inline v8::Local<v8::Object> NanNewBufferHandle (
      char *data,
      size_t length,
      node::Buffer::free_callback callback,
      void *hint) {
    return v8::Local<v8::Object>::New(
        node::Buffer::New(data, length, callback, hint)->handle_);
  }

  static inline v8::Local<v8::Object> NanNewBufferHandle (
     char *data, uint32_t size) {
    return v8::Local<v8::Object>::New(node::Buffer::New(data, size)->handle_);
  }

  static inline v8::Local<v8::Object> NanNewBufferHandle (uint32_t size) {
    return v8::Local<v8::Object>::New(node::Buffer::New(size)->handle_);
  }

  static inline void FreeData(char *data, void *hint) {
    delete[] data;
  }

  static inline v8::Local<v8::Object> NanBufferUse(char* data, uint32_t size) {
    return v8::Local<v8::Object>::New(
        node::Buffer::New(data, size, FreeData, NULL)->handle_);
  }

  template <class TypeName>
  inline v8::Local<TypeName> NanPersistentToLocal(
     const v8::Persistent<TypeName>& persistent) {
    if (persistent.IsWeak()) {
     return v8::Local<TypeName>::New(persistent);
    } else {
     return *reinterpret_cast<v8::Local<TypeName>*>(
         const_cast<v8::Persistent<TypeName>*>(&persistent));
    }
  }

  inline bool NanHasInstance(
        v8::Persistent<v8::FunctionTemplate>& function_template
      , v8::Handle<v8::Value> value) {
    return function_template->HasInstance(value);
  }

  static inline v8::Local<v8::Context> NanNewContextHandle(
        v8::ExtensionConfiguration* extensions = NULL
      , v8::Handle<v8::ObjectTemplate> tmpl =
            v8::Handle<v8::ObjectTemplate>()
      , v8::Handle<v8::Value> obj = v8::Handle<v8::Value>()
    ) {
      v8::Persistent<v8::Context> ctx =
          v8::Context::New(extensions, tmpl, obj);
      v8::Local<v8::Context> lctx = v8::Local<v8::Context>::New(ctx);
      ctx.Dispose();
      return lctx;
  }

#endif // node version

class NanCallback {
 public:
  NanCallback(const v8::Local<v8::Function> &fn) {
    NanScope();
    v8::Local<v8::Object> obj = v8::Object::New();
    obj->Set(NanSymbol("callback"), fn);
    NanAssignPersistent(v8::Object, handle, obj);
  }

  ~NanCallback() {
    if (handle.IsEmpty()) return;
    handle.Dispose();
    handle.Clear();
  }

  inline v8::Local<v8::Function> GetFunction () {
    return NanPersistentToLocal(handle)->Get(NanSymbol("callback"))
        .As<v8::Function>();
  }

  // deprecated
  void Run(int argc, v8::Local<v8::Value> argv[]) {
    Call(argc, argv);
  }

  void Call(int argc, v8::Local<v8::Value> argv[]) {
    NanScope();

    v8::Local<v8::Function> callback = NanPersistentToLocal(handle)->
       Get(NanSymbol("callback")).As<v8::Function>();
    v8::TryCatch try_catch;
    callback->Call(v8::Context::GetCurrent()->Global(), argc, argv);
    if (try_catch.HasCaught()) {
      node::FatalException(try_catch);
    }
  }

 private:
  v8::Persistent<v8::Object> handle;
};

/* abstract */ class NanAsyncWorker {
public:
  NanAsyncWorker (NanCallback *callback) : callback(callback) {
    request.data = this;
    errmsg = NULL;
  }

  virtual ~NanAsyncWorker () {
    NanScope();

    if (!persistentHandle.IsEmpty())
      NanDispose(persistentHandle);
    if (callback)
      delete callback;
    if (errmsg)
      delete errmsg;
  }

  virtual void WorkComplete () {
    NanScope();

    if (errmsg == NULL)
      HandleOKCallback();
    else
      HandleErrorCallback();
    delete callback;
    callback = NULL;
  }

  virtual void Execute () =0;

  uv_work_t request;

protected:
  v8::Persistent<v8::Object> persistentHandle;
  NanCallback *callback;
  const char *errmsg;

  void SavePersistent(const char *key, v8::Local<v8::Object> &obj) {
    NanScope();

    v8::Local<v8::Object> handle = NanPersistentToLocal(persistentHandle);
    handle->Set(NanSymbol(key), obj);
  }

  v8::Local<v8::Object> GetFromPersistent(const char *key) {
    NanScope();

    v8::Local<v8::Object> handle = NanPersistentToLocal(persistentHandle);
    return handle->Get(NanSymbol(key)).As<v8::Object>();
  }

  virtual void HandleOKCallback () {
    NanScope();

    callback->Call(0, NULL);
  };

  virtual void HandleErrorCallback () {
    NanScope();

    v8::Local<v8::Value> argv[] = {
        v8::Exception::Error(v8::String::New(errmsg))
    };
    callback->Call(1, argv);
  }
};

inline void NanAsyncExecute (uv_work_t* req) {
  NanAsyncWorker *worker = static_cast<NanAsyncWorker*>(req->data);
  worker->Execute();
}

inline void NanAsyncExecuteComplete (uv_work_t* req) {
  NanAsyncWorker* worker = static_cast<NanAsyncWorker*>(req->data);
  worker->WorkComplete();
  delete worker;
}

inline void NanAsyncQueueWorker (NanAsyncWorker* worker) {
  uv_queue_work(
      uv_default_loop()
    , &worker->request
    , NanAsyncExecute
    , (uv_after_work_cb)NanAsyncExecuteComplete
  );
}

//// Base 64 ////

#define _nan_base64_encoded_size(size) ((size + 2 - ((size + 2) % 3)) / 3 * 4)


// Doesn't check for padding at the end.  Can be 1-2 bytes over.
static inline size_t _nan_base64_decoded_size_fast(size_t size) {
  size_t remainder = size % 4;

  size = (size / 4) * 3;
  if (remainder) {
    if (size == 0 && remainder == 1) {
      // special case: 1-byte input cannot be decoded
      size = 0;
    } else {
      // non-padded input, add 1 or 2 extra bytes
      size += 1 + (remainder == 3);
    }
  }

  return size;
}

template <typename TypeName>
static size_t _nan_base64_decoded_size(const TypeName* src, size_t size) {
  if (size == 0)
    return 0;

  if (src[size - 1] == '=')
    size--;
  if (size > 0 && src[size - 1] == '=')
    size--;

  return _nan_base64_decoded_size_fast(size);
}


// supports regular and URL-safe base64
static const int _nan_unbase64_table[] =
  { -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -2, -1, -1, -2, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, 62, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, 63,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1
  };

#define _nan_unbase64(x) _nan_unbase64_table[(uint8_t)(x)]


template <typename TypeName>
static size_t _nan_base64_decode(char* buf,
                     size_t len,
                     const TypeName* src,
                     const size_t srcLen) {
  char a, b, c, d;
  char* dst = buf;
  char* dstEnd = buf + len;
  const TypeName* srcEnd = src + srcLen;

  while (src < srcEnd && dst < dstEnd) {
    int remaining = srcEnd - src;

    while (_nan_unbase64(*src) < 0 && src < srcEnd) src++, remaining--;
    if (remaining == 0 || *src == '=') break;
    a = _nan_unbase64(*src++);

    while (_nan_unbase64(*src) < 0 && src < srcEnd) src++, remaining--;
    if (remaining <= 1 || *src == '=') break;
    b = _nan_unbase64(*src++);

    *dst++ = (a << 2) | ((b & 0x30) >> 4);
    if (dst == dstEnd) break;

    while (_nan_unbase64(*src) < 0 && src < srcEnd) src++, remaining--;
    if (remaining <= 2 || *src == '=') break;
    c = _nan_unbase64(*src++);

    *dst++ = ((b & 0x0F) << 4) | ((c & 0x3C) >> 2);
    if (dst == dstEnd) break;

    while (_nan_unbase64(*src) < 0 && src < srcEnd) src++, remaining--;
    if (remaining <= 3 || *src == '=') break;
    d = _nan_unbase64(*src++);

    *dst++ = ((c & 0x03) << 6) | (d & 0x3F);
  }

  return dst - buf;
}

//// HEX ////

template <typename TypeName>
unsigned _nan_hex2bin(TypeName c) {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'A' && c <= 'F') return 10 + (c - 'A');
  if (c >= 'a' && c <= 'f') return 10 + (c - 'a');
  return static_cast<unsigned>(-1);
}


template <typename TypeName>
static size_t _nan_hex_decode(char* buf,
                  size_t len,
                  const TypeName* src,
                  const size_t srcLen) {
  size_t i;
  for (i = 0; i < len && i * 2 + 1 < srcLen; ++i) {
    unsigned a = _nan_hex2bin(src[i * 2 + 0]);
    unsigned b = _nan_hex2bin(src[i * 2 + 1]);
    if (!~a || !~b) return i;
    buf[i] = a * 16 + b;
  }

  return i;
}

static bool _NanGetExternalParts(
      v8::Handle<v8::Value> val
    , const char** data
    , size_t* len) {

  if (node::Buffer::HasInstance(val)) {
    *data = node::Buffer::Data(val.As<v8::Object>());
    *len = node::Buffer::Length(val.As<v8::Object>());
    return true;

  }

  assert(val->IsString());
  v8::Local<v8::String> str = v8::Local<v8::String>::New(val.As<v8::String>());

  if (str->IsExternalAscii()) {
    const v8::String::ExternalAsciiStringResource* ext;
    ext = str->GetExternalAsciiStringResource();
    *data = ext->data();
    *len = ext->length();
    return true;

  } else if (str->IsExternal()) {
    const v8::String::ExternalStringResource* ext;
    ext = str->GetExternalStringResource();
    *data = reinterpret_cast<const char*>(ext->data());
    *len = ext->length();
    return true;
  }

  return false;
}

namespace Nan {
  enum Encoding {ASCII, UTF8, BASE64, UCS2, BINARY, HEX, BUFFER};
}

static inline char* NanFromV8String(
      v8::Handle<v8::Value> from
    , enum Nan::Encoding encoding = Nan::UTF8
    , size_t *datalen = NULL
    , char *buf = NULL
    , size_t buflen = 0
    , int flags = v8::String::NO_NULL_TERMINATION
    | v8::String::HINT_MANY_WRITES_EXPECTED) {

  NanScope();

  size_t sz_;
  size_t term_len = !(flags & v8::String::NO_NULL_TERMINATION);
  char *data = NULL;
  size_t len;
  bool is_extern = _NanGetExternalParts(
      from
    , const_cast<const char**>(&data)
    , &len);

  if (is_extern && !term_len) {
    NanSetPointerSafe(datalen, len);
    return data;
  }

  v8::Local<v8::String> toStr = from->ToString();

  char *to = buf;

  v8::String::AsciiValue value(toStr);
  switch(encoding) {
    case Nan::ASCII:
#if NODE_MODULE_VERSION < 0x0C
      sz_ = toStr->Length();
      if (to == NULL) {
        to = new char[sz_ + term_len];
      } else {
        assert(buflen >= sz_ + term_len && "too small buffer");
      }
      NanSetPointerSafe<size_t>(
          datalen
        , toStr->WriteAscii(to, 0, sz_ + term_len, flags));
      return to;
#endif
    case Nan::BINARY:
    case Nan::BUFFER:
      sz_ = toStr->Length();
      if (to == NULL) {
        to = new char[sz_ + term_len];
      } else {
        assert(buflen >= sz_ + term_len && "too small buffer");
      }
#if NODE_MODULE_VERSION < 0x0C
      // TODO(isaacs): THIS IS AWFUL!!!
      // AGREE(kkoopa)
      {
        uint16_t* twobytebuf = new uint16_t[sz_ + term_len];

        size_t len = toStr->Write(twobytebuf, 0, sz_ + term_len, flags);

        for (size_t i = 0; i < sz_ + term_len && i < len + term_len; i++) {
          unsigned char *b = reinterpret_cast<unsigned char*>(&twobytebuf[i]);
          to[i] = *b;
        }

        NanSetPointerSafe<size_t>(datalen, len);

        delete[] twobytebuf;
        return to;
      }
#else
      NanSetPointerSafe<size_t>(
        datalen,
        toStr->WriteOneByte(
            reinterpret_cast<uint8_t *>(to)
          , 0
          , sz_ + term_len
          , flags));
      return to;
#endif
    case Nan::UTF8:
      sz_ = toStr->Utf8Length();
      if (to == NULL) {
        to = new char[sz_ + term_len];
      } else {
        assert(buflen >= sz_ + term_len && "too small buffer");
      }
      NanSetPointerSafe<size_t>(
          datalen
        , toStr->WriteUtf8(to, sz_ + term_len, NULL, flags) - term_len);
      return to;
    case Nan::BASE64:
      sz_ = _nan_base64_decoded_size(*value, toStr->Length());
      if (to == NULL) {
        to = new char[sz_ + term_len];
      } else {
        assert(buflen >= sz_ + term_len);
      }
      NanSetPointerSafe<size_t>(
          datalen
        , _nan_base64_decode(to, sz_, *value, value.length()));
      if (term_len) {
        to[sz_] = '\0';
      }
      return to;
    case Nan::UCS2:
      {
        sz_ = toStr->Length();
        if (to == NULL) {
          to = new char[(sz_ + term_len) * 2];
        } else {
          assert(buflen >= (sz_ + term_len) * 2 && "too small buffer");
        }

        int bc = 2 * toStr->Write(
            reinterpret_cast<uint16_t *>(to)
          , 0
          , sz_ + term_len
          , flags);
        NanSetPointerSafe<size_t>(datalen, bc);
        return to;
      }
    case Nan::HEX:
      sz_ = toStr->Length();
      assert(!(sz_ & 1) && "bad hex data");
      if (to == NULL) {
        to = new char[sz_ / 2 + term_len];
      } else {
        assert(buflen >= sz_ / 2 + term_len && "too small buffer");
      }

      NanSetPointerSafe<size_t>(
          datalen
        , _nan_hex_decode(to, sz_ / 2, *value, value.length()));
      if (term_len) {
        to[sz_ / 2] = '\0';
      }
      return to;
    default:
      assert(0 && "unknown encoding");
  }
  return to;
}

#endif
