#!/bin/sh
basedir=`dirname "$0"`

case `uname` in
    *CYGWIN*) basedir=`cygpath -w "$basedir"`;;
esac

if [ -x "$basedir/node" ]; then
  "$basedir/node"  "$basedir/../ws/bin/wscat" "$@"
  ret=$?
else 
  node  "$basedir/../ws/bin/wscat" "$@"
  ret=$?
fi
exit $ret
