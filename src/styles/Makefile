# input filenames 
BRACKETS_APP_LESS = ./brackets-app.less

# output filenames
BRACKETS_APP = ./brackets-app.css
BRACKETS_APP_MIN = ./brackets-app.min.css

DATE=$(shell DATE)
LESS_COMPRESSOR ?= `which lessc`
WATCHR ?= `which watchr`

build:
	@@if test ! -z ${LESS_COMPRESSOR}; then \
		sed -e 's/@DATE/'"${DATE}"'/' <${BRACKETS_APP_LESS} >${BRACKETS_APP_LESS}.tmp; \
		lessc ${BRACKETS_APP_LESS}.tmp > ${BRACKETS_APP}; \
		lessc ${BRACKETS_APP_LESS}.tmp > ${BRACKETS_APP_MIN} --compress; \
		rm -f ${BRACKETS_APP_LESS}.tmp; \
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