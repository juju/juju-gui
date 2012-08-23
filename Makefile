all: install test

install:
	@npm install
	@./bin/generateTemplates
	@#link depends
	@ln -sf `pwd`/node_modules/yui ./app/assets/javascripts/
	@ln -sf `pwd`/node_modules/d3/d3.v2* ./app/assets/javascripts/


test:
	@if [ -e "server-8989.pid" ]; then kill `cat server-8989.pid`;fi
	@PORT=8989 node server.js &
	@mocha -w

server:
	@node server.js

.PHONY: test
