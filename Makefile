all: clean lint test

lint:
	./node_modules/.bin/jshint *.js

TESTS = opts stdout stdin config config-all js-config js-config-all invalid
DIFF = diff -q

test: test/build test-help test-version $(patsubst %,test/build/%.css,$(TESTS)) test-multi test-replace

test-help:
	./bin/postcss --help

test-version:
	./bin/postcss --version

test-multi:
	./bin/postcss -u postcss-url --dir test/build test/multi*.css
	$(DIFF) test/build/multi*.css --to-file=test/ref

test-replace:
	 cp test/replace.css test/build/replace.css
	./bin/postcss -u postcss-url --postcss-url.url "inline" --replace test/build/replace.css
	$(DIFF) test/build/replace.css test/ref/replace.css

test-watch: test/import-*.css
	echo '@import "import-foo.css";' > test/import-index.css
	./bin/postcss -c test/config-watch.js -w & echo $$! > test/watch.pid
	sleep 0.2
	$(DIFF) test/build/watch.css test/ref/watch-1.css
	echo '@import "import-bar.css";' >> test/import-index.css
	sleep 0.2
	$(DIFF) test/build/watch.css test/ref/watch-2.css
	kill `cat test/watch.pid` # FIXME: never reached on failure
	rm test/watch.pid

test/build/opts.css: test/in.css
	./bin/postcss -u postcss-url --postcss-url.url=rebase -o $@ $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build/stdout.css: test/in.css
	./bin/postcss --use ./test/dummy-plugin $< > $@
	$(DIFF) $@ $(subst build,ref,$@)

test/build/stdin.css: test/in.css
	./bin/postcss --use ./test/dummy-plugin --output $@ < $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build/invalid.css: test/in-force-error.css
	./bin/postcss --use ./test/dummy-plugin --dummy-plugin.fail=true -o $@ $< || echo Error is OK here....

test/build/config.css: test/in.css
	./bin/postcss -u postcss-url -c test/config.json -o $@ $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build/config-all.css: test/in.css
	./bin/postcss -c test/config-all.json
	$(DIFF) $@ $(subst build,ref,$@)

test/build/js-config.css: test/in.css
	./bin/postcss -u postcss-url -c test/config.js -o $@ $<
	$(DIFF) $@ $(subst build,ref,$@)

test/build/js-config-all.css: test/in.css
	./bin/postcss -c test/config-all.js
	$(DIFF) $@ $(subst build,ref,$@)

test/build:
	mkdir -p $@

clean:
	rm -rf test/build

.PHONY: all lint clean test test-help test-version test-multi test-watch test-replace
