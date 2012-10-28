FILES=$(shell bzr ls -RV -k file | grep -v assets/ | grep -v app/templates.js | grep -v server.js)
NODE_TARGETS=node_modules/chai node_modules/d3 node_modules/jshint \
	node_modules/yui
TEMPLATE_TARGETS=$(shell bzr ls -k file app/templates)
DATE=$(shell date -u)
APPCACHE=app/assets/manifest.appcache

all: prep test

app/templates.js: $(TEMPLATE_TARGETS) bin/generateTemplates
	@./bin/generateTemplates

$(NODE_TARGETS): package.json
	@npm install
	@#link depends
	@ln -sf `pwd`/node_modules/yui ./app/assets/javascripts/
	@ln -sf `pwd`/node_modules/d3/d3.v2* ./app/assets/javascripts/

install: appcache $(NODE_TARGETS) app/templates.js

gjslint: virtualenv/bin/gjslint
	@virtualenv/bin/gjslint --strict --nojsdoc --custom_jsdoc_tags=property,default,since --jslint_error=all $(FILES)

jshint: node_modules/jshint
	@node_modules/jshint/bin/hint $(FILES)

lint: gjslint jshint

virtualenv/bin/gjslint virtualenv/bin/fixjsstyle:
	@virtualenv virtualenv
	@virtualenv/bin/easy_install archives/closure_linter-latest.tar.gz

beautify: virtualenv/bin/fixjsstyle
	@virtualenv/bin/fixjsstyle --strict --nojsdoc --jslint_error=all $(FILES)

prep: beautify lint

test: install
	@./test-server.sh

server: install
	@echo "Customize config.js to modify server settings"
	@node server.js

clean:
	@rm -rf node_modules virtualenv
	@make -C docs clean

$(APPCACHE): manifest.appcache.in
	@cp manifest.appcache.in $(APPCACHE)
	@sed -re 's/^\# TIMESTAMP .+$$/\# TIMESTAMP $(DATE)/' -i $(APPCACHE)

appcache: $(APPCACHE)

appcache-touch:
	@touch manifest.appcache.in

appcache-force: appcache-touch appcache

.PHONY: test lint beautify server install clean prep jshint gjslint appcache appcache-touch appcache-force
