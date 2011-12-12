#!/bin/bash
BASEDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo $BASEDIR

# open the Jasmine SpecRunner
open ${BASEDIR}/../../bin/mac/Brackets.app --args file:///${BASEDIR}/SpecRunner.html