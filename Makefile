all: install test

install:
	@npm install 
	@./bin/generateTemplates
test:
	@if [ -e "server-8989.pid" ]; then kill `cat server-8989.pid`;fi
	@PORT=8989 node server.js &
	@mocha -w

server:
	@node server.js

.PHONY: test
