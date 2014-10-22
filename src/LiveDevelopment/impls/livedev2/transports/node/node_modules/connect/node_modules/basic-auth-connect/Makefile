BIN = ./node_modules/.bin/

test:
	@NODE_ENV=test $(BIN)mocha \
		--require should \
		--reporter spec

.PHONY: test