{
  'targets': [
    {
      'target_name': 'validation',
      'include_dirs': ["<!(node -p -e \"require('path').dirname(require.resolve('nan'))\")"],
      'cflags': [ '-O3' ],
      'sources': [ 'src/validation.cc' ]
    },
    {
      'target_name': 'bufferutil',
      'include_dirs': ["<!(node -p -e \"require('path').dirname(require.resolve('nan'))\")"],
      'cflags': [ '-O3' ],
      'sources': [ 'src/bufferutil.cc' ]
    }
  ]
}
