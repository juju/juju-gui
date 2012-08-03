all: install test

install:
	@npm install 
test:
	@mocha -w

server:
	@node server.js

.PHONY: test
