FILES=$(shell bzr ls -RV -k file | grep -v assets/ | grep -v app/templates.js | grep -v server.js)
NODE_TARGETS=node_modules/chai node_modules/d3 node_modules/jshint node_modules/yui

all: install

$(NODE_TARGETS): package.json
	@npm install
	@#link depends
	@ln -sf `pwd`/node_modules/yui ./app/assets/javascripts/
	@ln -sf `pwd`/node_modules/d3/d3.v2* ./app/assets/javascripts/
	@./bin/generateTemplates

install: $(NODE_TARGETS)

lint: virtualenv/bin/gjslint node_modules/jshint
	@virtualenv/bin/gjslint --strict --nojsdoc --jslint_error=all $(FILES)
	@node_modules/jshint/bin/hint --config=jshint.config $(FILES)

virtualenv/bin/gjslint virtualenv/bin/fixjsstyle:
	@virtualenv virtualenv
	@virtualenv/bin/easy_install archives/closure_linter-latest.tar.gz

beautify: virtualenv/bin/fixjsstyle
	@virtualenv/bin/fixjsstyle --strict --nojsdoc --jslint_error=all $(FILES)

prep: beautify lint

test: install
	@xdg-open test/index.html

server: install
	@echo "Customize config.js to modify server settings"
	@node server.js

clean:
	@rm -rf node_modules virtualenv
	@make -C docs clean

.PHONY: test lint beautify server install clean prep
