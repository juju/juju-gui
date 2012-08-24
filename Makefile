all: install test

install:
	@npm install
	@./bin/generateTemplates
	@#link depends
	@ln -sf `pwd`/node_modules/yui ./app/assets/javascripts/
	@ln -sf `pwd`/node_modules/d3/d3.v2* ./app/assets/javascripts/


test:
	@gnome-open test/index.html

server:
	@echo "Customize config.js to modify server settings"
	@node server.js

.PHONY: test
