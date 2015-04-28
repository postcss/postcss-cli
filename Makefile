all: clean lint test

lint:
	./node_modules/.bin/jshint *.js

TESTS = opts stdout stdin safe config js-config invalid
DIFF = diff -q

test: test/build test-help test-version $(patsubst %,test/build/%.css,$(TESTS)) test-multi

test-help:
	./bin/postcss --help

test-version:
	./bin/postcss --version

test-multi:
	./bin/postcss -u postcss-url --dir test/build test/multi*.css
	$(DIFF) test/build/multi*.css --to-file=test/ref

test/build/opts.css: test/in.css
	./bin/postcss -u postcss-url --postcss-url.url=rebase -o $@ $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build/stdout.css: test/in.css
	./bin/postcss --use ./test/dummy-plugin --safe $< > $@
	$(DIFF) $@ $(subst build,ref,$@)

test/build/stdin.css: test/in.css
	./bin/postcss --use ./test/dummy-plugin --safe --output $@ < $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build/safe.css: test/invalid.css
	./bin/postcss --use ./test/dummy-plugin --safe -o $@ $<
	$(DIFF) --side-by-side $@ $(subst build,ref,$@)

test/build/invalid.css: test/in.css
	./bin/postcss --use ./test/dummy-plugin -o $@ $< || echo Error is OK here....

test/build/config.css: test/in.css
	./bin/postcss -u postcss-url -c test/config.json -o $@ $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build/js-config.css: test/in.css
	./bin/postcss -u postcss-url -c test/config.js -o $@ $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build:
	mkdir -p $@

clean:
	rm -rf test/build

.PHONY: all lint clean test test-help test-version test-multi
