all: lint

lint:
	./node_modules/.bin/jshint *.js


.PHONY: all lint
