#include <node_version.h>
#include "ffi.h"

Persistent<FunctionTemplate> CallbackInfo::callback_template;
pthread_t CallbackInfo::g_mainthread;
pthread_mutex_t CallbackInfo::g_queue_mutex;
std::queue<ThreadedCallbackInvokation *> CallbackInfo::g_queue;
uv_async_t CallbackInfo::g_async;


CallbackInfo::CallbackInfo(Handle<Function> func, void *closure, void *code) {
  m_function = Persistent<Function>::New(func);
  m_closure = closure;
  this->code = code;
}

CallbackInfo::~CallbackInfo() {
  ffi_closure_free(m_closure);
  m_function.Dispose();
}

void CallbackInfo::DispatchToV8(CallbackInfo *self, void *retval, void **parameters) {
  HandleScope scope;

  Handle<Value> argv[2];
  argv[0] = Pointer::WrapPointer((unsigned char *)retval);
  argv[1] = Pointer::WrapPointer((unsigned char *)parameters);

  TryCatch try_catch;

  self->m_function->Call(self->m_this, 2, argv);

  if (try_catch.HasCaught()) {
    FatalException(try_catch);
  }
}

void CallbackInfo::WatcherCallback(uv_async_t *w, int revents) {
  pthread_mutex_lock(&g_queue_mutex);

  while (!g_queue.empty()) {
    ThreadedCallbackInvokation *inv = g_queue.front();
    g_queue.pop();

    DispatchToV8(inv->m_cbinfo, inv->m_retval, inv->m_parameters);
    inv->SignalDoneExecuting();
  }

  pthread_mutex_unlock(&g_queue_mutex);
}

void CallbackInfo::Initialize(Handle<Object> target) {
  HandleScope scope;

  if (callback_template.IsEmpty()) {
    callback_template = Persistent<FunctionTemplate>::New(MakeTemplate());
  }

  Handle<FunctionTemplate> t = callback_template;

  target->Set(String::NewSymbol("CallbackInfo"), t->GetFunction());

  // initialize our threaded invokation stuff
  g_mainthread = pthread_self();
  uv_async_init(uv_default_loop(), &g_async, CallbackInfo::WatcherCallback);
  pthread_mutex_init(&g_queue_mutex, NULL);

  // allow the event loop to exit while this is running
#if NODE_VERSION_AT_LEAST(0, 7, 9)
  uv_unref((uv_handle_t *)&g_async);
#else
  uv_unref(uv_default_loop());
#endif
}

Handle<Value> CallbackInfo::New(const Arguments& args) {
  HandleScope scope;

  if (args.Length() < 2) {
    return ThrowException(String::New("Not enough arguments."));
  }

  // Args: cif pointer, JS function
  // TODO: Check args
  Pointer *cif = ObjectWrap::Unwrap<Pointer>(args[0]->ToObject());
  Local<Function> callback = Local<Function>::Cast(args[1]);
  ffi_closure *closure;
  ffi_status status;
  void *code;

  closure = (ffi_closure *)ffi_closure_alloc(sizeof(ffi_closure), &code);

  if (!closure) {
    return ThrowException(String::New("ffi_closure_alloc() Returned Error"));
  }

  CallbackInfo *self = new CallbackInfo(callback, closure, code);

  status = ffi_prep_closure_loc(
    closure,
    (ffi_cif *)cif->GetPointer(),
    Invoke,
    (void *)self,
    code
  );

  if (status != FFI_OK) {
    delete self;
    return ThrowException(String::New("ffi_prep_closure() Returned Error"));
  }

  self->Wrap(args.This());
  self->m_this = args.This();

  return scope.Close(args.This());
}

Handle<FunctionTemplate> CallbackInfo::MakeTemplate() {
  HandleScope scope;

  Handle<FunctionTemplate> t = FunctionTemplate::New(New);

  Local<ObjectTemplate> inst = t->InstanceTemplate();
  inst->SetInternalFieldCount(1);
  inst->SetAccessor(String::NewSymbol("pointer"), GetPointer);

  return scope.Close(t);
}

void CallbackInfo::Invoke(ffi_cif *cif, void *retval, void **parameters, void *user_data) {
  CallbackInfo *self = (CallbackInfo *)user_data;

  // are we executing from another thread?
  if (pthread_equal(pthread_self(), g_mainthread)) {
    DispatchToV8(self, retval, parameters);
  } else {
    // hold the event loop open while this is executing
#if NODE_VERSION_AT_LEAST(0, 7, 9)
    uv_ref((uv_handle_t *)&g_async);
#else
    uv_ref(uv_default_loop());
#endif

    // create a temporary storage area for our invokation parameters
    ThreadedCallbackInvokation *inv = new ThreadedCallbackInvokation(self, retval, parameters);

    // push it to the queue -- threadsafe
    pthread_mutex_lock(&g_queue_mutex);
    g_queue.push(inv);
    pthread_mutex_unlock(&g_queue_mutex);

    // send a message to our main thread to wake up the WatchCallback loop
    uv_async_send(&g_async);

    // wait for signal from calling thread
    inv->WaitForExecution();

#if NODE_VERSION_AT_LEAST(0, 7, 9)
    uv_unref((uv_handle_t *)&g_async);
#else
    uv_unref(uv_default_loop());
#endif
    delete inv;
  }
}

Handle<Value> CallbackInfo::GetPointer(Local<String> name, const AccessorInfo& info) {
  HandleScope scope;

  CallbackInfo *self = ObjectWrap::Unwrap<CallbackInfo>(info.Holder());
  Handle<Value> ptr = Pointer::WrapPointer((unsigned char *)self->m_closure);
  return scope.Close(ptr);
}
