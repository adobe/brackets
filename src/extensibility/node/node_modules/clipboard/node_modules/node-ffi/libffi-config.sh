cd deps/libffi
make clean distclean >node_ffi_configure.out 2>&1
sh configure --enable-static --disable-shared --disable-builddir >>node_ffi_configure.out 2>&1
cd ../..
