# input filenames 
BRACKETS_LESS = ../brackets.less

# output filenames
BRACKETS_CSS = ../brackets.css
BRACKETS_CSS_MIN = ../brackets.min.css

DATE=$(shell DATE)
LESS_COMPRESSOR ?= `which lessc`
WATCHR ?= `which watchr`

build:
	@@if test ! -z ${LESS_COMPRESSOR}; then \
		sed -e 's/@DATE/'"${DATE}"'/' <${BRACKETS_LESS} >${BRACKETS_LESS}.tmp; \
		lessc ${BRACKETS_LESS}.tmp > ${BRACKETS_CSS}; \
		lessc ${BRACKETS_LESS}.tmp > ${BRACKETS_CSS_MIN} --compress; \
		rm -f ${BRACKETS_LESS}.tmp; \
		echo "brackets-app css successfully built! - `date`"; \
	else \
		echo "You must have the LESS compiler installed in order to build Bootstrap."; \
		echo "You can install it by running: npm install less -g"; \
	fi

watch:
	@@if test ! -z ${WATCHR}; then \
	  echo "Watching less files..."; \
	  watchr -e "watch('lib/.*\.less') { system 'make' }"; \
	else \
		echo "You must have the watchr installed in order to watch Bootstrap less files."; \
		echo "You can install it by running: gem install watchr"; \
	fi

.PHONY: build watch