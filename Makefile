all: test

install:
	@npm install
	@#link depends
	@ln -sf `pwd`/node_modules/yui ./app/assets/javascripts/
	@ln -sf `pwd`/node_modules/d3/d3.v2* ./app/assets/javascripts/
	@./bin/generateTemplates

lint: install
        @node_modules/jshint/bin/hint --config=jshint.config `bzr ls -RV -k file | grep -v assets/ | grep -v app/templates.js`

test: install
	@xdg-open test/index.html

server: install
	@echo "Customize config.js to modify server settings"
	@node server.js

clean:
	@rm -rf node_modules
	@make -C docs clean

.PHONY: test lint server
