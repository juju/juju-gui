all: test

install:
	@npm install
	@#link depends
	@ln -sf `pwd`/node_modules/yui ./app/assets/javascripts/
	@ln -sf `pwd`/node_modules/d3/d3.v2* ./app/assets/javascripts/
	@./bin/generateTemplates


test: install
	@gnome-open test/index.html

server: install
	@echo "Customize config.js to modify server settings"
	@node server.js

lint:
	@jshint --config=jshint.config `bzr ls -RV -k file | grep -v assets/ | grep -v app/templates.js`

.PHONY: test lint server
