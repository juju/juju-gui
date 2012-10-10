FILES=$(shell bzr ls -RV -k file | grep -v assets/ | grep -v app/templates.js | grep -v server.js)
NODE_TARGETS=node_modules/chai node_modules/d3 node_modules/jshint \
	node_modules/yui
TEMPLATE_TARGETS=\
	app/templates/charm-collection.handlebars \
	app/templates/charm-description.handlebars \
	app/templates/charm.handlebars \
	app/templates/charm-pre-configuration.handlebars \
	app/templates/charm-search-pop.handlebars \
	app/templates/charm-search-result-entries.handlebars \
	app/templates/charm-search-result.handlebars \
	app/templates/notifications.handlebars \
	app/templates/notifications_overview.handlebars \
	app/templates/overview.handlebars \
	app/templates/service-config.handlebars \
	app/templates/service-config.partial \
	app/templates/service-constraints.handlebars \
	app/templates/service-constraints.partial \
	app/templates/service.handlebars \
	app/templates/service-header.partial \
	app/templates/service-relations.handlebars \
	app/templates/unit.handlebars

all: prep test

app/templates.js: $(TEMPLATE_TARGETS) bin/generateTemplates
	@./bin/generateTemplates

$(NODE_TARGETS): package.json
	@npm install
	@#link depends
	@ln -sf `pwd`/node_modules/yui ./app/assets/javascripts/
	@ln -sf `pwd`/node_modules/d3/d3.v2* ./app/assets/javascripts/

install: $(NODE_TARGETS) app/templates.js

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

.PHONY: test lint beautify server install clean prep jshint gjslint
