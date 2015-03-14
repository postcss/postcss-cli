all: clean lint test

lint:
	./node_modules/.bin/jshint *.js

TESTS = opts safe config
DIFF = diff -q

test: test/build test-help test-version $(patsubst %,test/build/%.css,$(TESTS))

test-help:
	./bin/postcss --help

test-version:
	./bin/postcss --version

test/build/opts.css: test/in.css
	./bin/postcss -u postcss-url --postcss-url.url=rebase -o $@ $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build/safe.css: test/invalid.css
	./bin/postcss --use ./test/dummy-plugin --safe -o $@ $<
	$(DIFF) --side-by-side $@ $(subst build,ref,$@)

test/build/config.css: test/in.css
	./bin/postcss -u postcss-url -c test/config.json -o $@ $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build:
	mkdir -p $@

clean:
	rm -rf test/build

.PHONY: all lint clean test test-help test-version
