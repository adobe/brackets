{
  'targets': [
    {
      'target_name': 'ffi_bindings',
      'sources': [
          'src/ffi.cc'
        , 'src/callback_info.cc'
        , 'src/pointer.cc'
        , 'src/threaded_callback_invokation.cc'
        , 'src/foreign_caller.cc'
      ],
      'include_dirs': [
          'deps/libffi/include'
      ],
      'dependencies': [
        'libffi'
      ],
      'conditions': [
        ['OS=="win"', {
          'libraries': [
              '<(module_root_dir)/deps/libffi/.libs/libffi.lib'
          ],
          'dependencies': [
              'deps/dlfcn-win32/dlfcn.gyp:dlfcn'
            , 'deps/pthreads-win32/pthread.gyp:pthread'
          ]
        }, {
          'libraries': [
              '<(module_root_dir)/deps/libffi/.libs/libffi.a'
          ],
        }],
        ['OS=="mac"', {
          'xcode_settings': {
            'GCC_ENABLE_CPP_EXCEPTIONS': 'YES',
            'MACOSX_DEPLOYMENT_TARGET': '10.5',
            'OTHER_CFLAGS': [
                '-ObjC++'
            ]
          },
          'libraries': [
              '-lobjc'
          ],
        }]
      ]
    },
    {
      'target_name': 'libffi',
      'type': 'none',
      'actions': [
        {
          'action_name': 'test',
          # a hack to run libffi ./configure during `node-gyp configure`
          'inputs': ['<!@(sh libffi-config.sh)'],
          'outputs': [''],
          'action': [
            # run libffi `make`
            'sh', 'libffi-build.sh'
          ]
        }
      ]
    }
  ]
}
