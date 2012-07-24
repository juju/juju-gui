all: install test

install:
	@npm install 
test:
	@mocha 

server:
	@node server.js

.PHONY: test
