/*
** © 2013 by Philipp Dunkel <p.dunkel@me.com>. Licensed under MIT License.
*/

#include <node.h>
#include <uv.h>
#include <v8.h>

#include <stdlib.h>
#include <string.h>
#include <pthread.h>

#include <CoreServices/CoreServices.h>

#define MAXPATH 1024

typedef struct s_evt *p_evt;
struct s_evt {
  FSEventStreamEventFlags flags;
  FSEventStreamEventId evtid;
  char path[MAXPATH + 1];
  p_evt next;
};
static v8::Persistent<v8::FunctionTemplate> constructor_template;
namespace node_fsevents {
  using namespace v8;
  using namespace node;

  static Persistent<String> emit_sym;
  static Persistent<String> change_sym;
  class NodeFSEvents : node::ObjectWrap {
    public:
      static void Initialize(v8::Handle<v8::Object> target) {
        HandleScope scope;
        emit_sym = NODE_PSYMBOL("emit");
        change_sym = NODE_PSYMBOL("fsevent");
        Local<FunctionTemplate> t = FunctionTemplate::New(NodeFSEvents::New);
        constructor_template = Persistent<FunctionTemplate>::New(t);
        constructor_template->InstanceTemplate()->SetInternalFieldCount(1);
        constructor_template->SetClassName(String::NewSymbol("FSEvents"));
        Local<Function> constructor = constructor_template->GetFunction();

        constructor->Set(String::New("kFSEventStreamEventFlagNone"), Integer::New(0x00000000));
        constructor->Set(String::New("kFSEventStreamEventFlagMustScanSubDirs"), Integer::New(0x00000001));
        constructor->Set(String::New("kFSEventStreamEventFlagUserDropped"), Integer::New(0x00000002));
        constructor->Set(String::New("kFSEventStreamEventFlagKernelDropped"), Integer::New(0x00000004));
        constructor->Set(String::New("kFSEventStreamEventFlagEventIdsWrapped"), Integer::New(0x00000008));
        constructor->Set(String::New("kFSEventStreamEventFlagHistoryDone"), Integer::New(0x00000010));
        constructor->Set(String::New("kFSEventStreamEventFlagRootChanged"), Integer::New(0x00000020));
        constructor->Set(String::New("kFSEventStreamEventFlagMount"), Integer::New(0x00000040));
        constructor->Set(String::New("kFSEventStreamEventFlagUnmount"), Integer::New(0x00000080));
        constructor->Set(String::New("kFSEventStreamEventFlagItemCreated"), Integer::New(0x00000100));
        constructor->Set(String::New("kFSEventStreamEventFlagItemRemoved"), Integer::New(0x00000200));
        constructor->Set(String::New("kFSEventStreamEventFlagItemInodeMetaMod"), Integer::New(0x00000400));
        constructor->Set(String::New("kFSEventStreamEventFlagItemRenamed"), Integer::New(0x00000800));
        constructor->Set(String::New("kFSEventStreamEventFlagItemModified"), Integer::New(0x00001000));
        constructor->Set(String::New("kFSEventStreamEventFlagItemFinderInfoMod"), Integer::New(0x00002000));
        constructor->Set(String::New("kFSEventStreamEventFlagItemChangeOwner"), Integer::New(0x00004000));
        constructor->Set(String::New("kFSEventStreamEventFlagItemXattrMod"), Integer::New(0x00008000));
        constructor->Set(String::New("kFSEventStreamEventFlagItemIsFile"), Integer::New(0x00010000));
        constructor->Set(String::New("kFSEventStreamEventFlagItemIsDir"), Integer::New(0x00020000));
        constructor->Set(String::New("kFSEventStreamEventFlagItemIsSymlink"), Integer::New(0x00040000));

        target->Set(String::NewSymbol("FSEvents"), constructor);
      }
      static v8::Handle<v8::Value> Shutdown(const v8::Arguments& args) {
        HandleScope scope;
        NodeFSEvents *native = node::ObjectWrap::Unwrap<NodeFSEvents>(args.This());
        native->Shutdown();
        return Undefined();
      }
      static v8::Handle<v8::Value> New(const v8::Arguments& args) {
        HandleScope scope;

        if (args.Length() != 1 || !args[0]->IsString()) {
          return ThrowException(String::New("Bad arguments"));
        }

        String::Utf8Value pathname(args[0]->ToString());

        NodeFSEvents *nativeobj = new NodeFSEvents(*pathname);
        nativeobj->Wrap(args.Holder());
        NODE_SET_METHOD(args.Holder(), "stop", NodeFSEvents::Shutdown);
        return args.This();
      }


      NodeFSEvents(const char *path) : ObjectWrap() {
        running=1;
        first = NULL;
        last = NULL;
        strncpy(pathname, path ? path : "/", MAXPATH);
        pthread_mutex_init(&mutex, NULL);
        uv_async_init(uv_default_loop(), &watcher, NodeFSEvents::Callback);
        watcher.data = this;
        pthread_create(&thread, NULL, &NodeFSEvents::Run, this);
      }

      ~NodeFSEvents() {
        this->Shutdown();
      }
      void Shutdown() {
        if (running) {
          CFRunLoopStop(runLoop);
          pthread_join(thread, NULL);
          pthread_mutex_destroy(&mutex);
          uv_close((uv_handle_t*) &watcher, NULL);
        }
        running = 0;
      }
      static void *Run(void *data) {
        NodeFSEvents *This = (NodeFSEvents *)data;
        CFStringRef dir_names[1];
        dir_names[0] = CFStringCreateWithCString(NULL, This->pathname, kCFStringEncodingUTF8);
        CFArrayRef pathsToWatch = CFArrayCreate(NULL, (const void **)&dir_names, 1, NULL);
        FSEventStreamContext context = { 0, data, NULL, NULL, NULL };
        FSEventStreamRef stream = FSEventStreamCreate(NULL, &NodeFSEvents::Event, &context, pathsToWatch, kFSEventStreamEventIdSinceNow, (CFAbsoluteTime) 0.1, kFSEventStreamCreateFlagNone | kFSEventStreamCreateFlagWatchRoot | kFSEventStreamCreateFlagFileEvents);
        This->runLoop = CFRunLoopGetCurrent();
        FSEventStreamScheduleWithRunLoop(stream, This->runLoop, kCFRunLoopDefaultMode);
        FSEventStreamStart(stream);
        CFRunLoopRun();
        FSEventStreamStop(stream);
        FSEventStreamUnscheduleFromRunLoop(stream, This->runLoop, kCFRunLoopDefaultMode);
        FSEventStreamInvalidate(stream);
        FSEventStreamRelease(stream);
        pthread_exit(NULL);
      }
      static void Event(ConstFSEventStreamRef streamRef, void *userData, size_t numEvents, void *eventPaths, const FSEventStreamEventFlags eventFlags[], const FSEventStreamEventId eventIds[]) {
        NodeFSEvents *This = static_cast<NodeFSEvents*>(userData);
        char **paths = static_cast<char**>(eventPaths);
        size_t idx;
        p_evt item;
        pthread_mutex_lock(&(This->mutex));
        for (idx=0; idx < numEvents; idx++) {
          item = (p_evt)malloc(sizeof(struct s_evt));
          if (!This->first) {
            This->first = item;
            This->last = item;
          } else {
            This->last->next = item;
            This->last = item;
          }
          item->next = NULL;
          strncpy(item->path, paths[idx],MAXPATH);
          item->flags = eventFlags[idx];
          item->evtid = eventIds[idx];
        }
        pthread_mutex_unlock(&(This->mutex));
        uv_async_send(&(This->watcher));
      }
      static void Callback(uv_async_t *handle, int status) {
        NodeFSEvents *This = static_cast<NodeFSEvents*>(handle->data);
        HandleScope scope;
        TryCatch try_catch;
        Local<Value> callback_v = This->handle_->Get(emit_sym);
        Local<Function> callback = Local<Function>::Cast(callback_v);
        p_evt item;
        pthread_mutex_lock(&(This->mutex));

        v8::Handle<v8::Value> args[4];
        args[0] = change_sym;
        This->Ref();
        item = This->first;
        while (item) {
          This->first = item->next;
          if (!try_catch.HasCaught()) {
            args[1] = v8::String::New(item->path ? item->path : "");
            args[2] = v8::Integer::New(item->flags);
            args[3] = v8::Integer::New(item->evtid);
            callback->Call(This->handle_, 4, args);
          }
          free(item);
          item = This->first;
        }
        This->first = NULL;
        This->last = NULL;
        This->Ref();
        pthread_mutex_unlock(&(This->mutex));
        if (try_catch.HasCaught()) try_catch.ReThrow();
      }

      int running;
      char pathname[MAXPATH + 1];
      CFRunLoopRef runLoop;
      p_evt first;
      p_evt last;
      uv_async_t watcher;
      pthread_t thread;
      pthread_mutex_t mutex;
  };
  extern "C" void init(v8::Handle<v8::Object> target) {
    node_fsevents::NodeFSEvents::Initialize(target);
  }
}

NODE_MODULE(fswatch, node_fsevents::init)
