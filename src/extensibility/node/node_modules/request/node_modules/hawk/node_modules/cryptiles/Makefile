REPORTER = dot

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter $(REPORTER) --ignore-leaks --timeout 3000

test-cov:
	@NODE_ENV=test ./node_modules/.bin/mocha --require blanket --recursive --ignore-leaks --timeout 3000 -R travis-cov

test-cov-html:
	@NODE_ENV=test ./node_modules/.bin/mocha --require blanket --recursive --ignore-leaks --timeout 3000 -R html-cov > coverage.html

.PHONY: test test-cov test-cov-html
