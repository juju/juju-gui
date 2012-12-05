# Makefile debugging hack: uncomment the two lines below and make will tell you
# more about what is happening.  The output generated is of the form
# "FILE:LINE [TARGET (DEPENDENCIES) (NEWER)]" where DEPENDENCIES are all the
# things TARGET depends on and NEWER are all the files that are newer than
# TARGET.  DEPENDENCIES will be colored green and NEWER will be blue.
#
#OLD_SHELL := $(SHELL)
#SHELL = $(warning [$@ [32m($^) [34m($?)[m ])$(OLD_SHELL)

JSFILES=$(shell bzr ls -RV -k file | \
	grep -E -e '.+\.js(on)?$$|generateTemplates$$' | \
	grep -Ev -e '^manifest\.json$$' \
		-e '^test/assets/' \
		-e '^app/assets/javascripts/reconnecting-websocket.js$$' \
		-e '^server.js$$')
THIRD_PARTY_JS=app/assets/javascripts/reconnecting-websocket.js
NODE_TARGETS=node_modules/chai node_modules/cryptojs node_modules/d3 \
	node_modules/expect.js node_modules/express node_modules/graceful-fs \
	node_modules/grunt node_modules/jshint node_modules/less \
	node_modules/minimatch node_modules/mocha node_modules/node-markdown \
	node_modules/node-minify node_modules/node-spritesheet \
	node_modules/rimraf node_modules/should node_modules/yui \
	node_modules/yuidocjs
EXPECTED_NODE_TARGETS=$(shell echo "$(NODE_TARGETS)" | tr ' ' '\n' | sort | tr '\n' ' ')
TEMPLATE_TARGETS=$(shell bzr ls -k file app/templates)

SRC=app
ASSETS=$(SRC)/assets
BUILD=build
DEBUG=$(BUILD)-debug
PROD=$(BUILD)-prod
JUJU_UI=juju-ui
BUILD_ASSETS=$(BUILD)/$(JUJU_UI)/assets
DEBUG_ASSETS=$(DEBUG)/$(JUJU_UI)/assets
PROD_ASSETS=$(PROD)/$(JUJU_UI)/assets

SPRITE_SOURCE_FILES=$(shell bzr ls -R -k file app/assets/images)
SPRITE_GENERATED_FILES=$(BUILD_ASSETS)/stylesheets/sprite.css \
	$(BUILD_ASSETS)/stylesheets/sprite.png
BUILD_FILES=$(BUILD_ASSETS)/app.js \
	$(BUILD_ASSETS)/stylesheets/all-static.css
DATE=$(shell date -u)
APPCACHE=$(BUILD_ASSETS)/manifest.appcache

all: build-prod build-debug
	@echo "\nProduction and debug environments built."
	@echo "Run 'make help' to list the main available targets."

help:
	@echo "Main targets:"
	@echo "devel: run the development environment"
	@echo "debug: run the debugging environment"
	@echo "prod: run the production environment"
	@echo "clean: remove all generated directories"
	@echo "test: run tests in the browser"
	@echo "prep: beautify and lint the source"
	@echo "doc: generate Sphinx and YuiDoc documentation"

build/juju-ui/templates.js: $(TEMPLATE_TARGETS) bin/generateTemplates
	mkdir -p $(BUILD_ASSETS)/stylesheets
	./bin/generateTemplates

yuidoc/index.html: node_modules/yuidocjs $(JSFILES)
	node_modules/.bin/yuidoc -o yuidoc -x assets app

yuidoc: yuidoc/index.html

doc: yuidoc
	make -C docs html

$(SPRITE_GENERATED_FILES): node_modules/grunt node_modules/node-spritesheet $(SPRITE_SOURCE_FILES)
	node_modules/grunt/bin/grunt spritegen

$(NODE_TARGETS): package.json
	npm install
	# Keep all targets up to date, not just new/changed ones.
	for dirname in $(NODE_TARGETS); do touch $$dirname ; done
	@# Check to see if we made what we expected to make, and warn if we did not.
	@# Note that we calculate FOUND_TARGETS here, in this way and not in the
	@# standard Makefile way, because we need to see what node_modules were
	@# created by this target.  Makefile variables and substitutions, even when
	@# using $(eval...) within a target, happen initially, before the target
	@# is run.  Therefore, if this were a simple Makefile variable, it
	@# would be empty after a first run, and you would always see the warning
	@# message in that case.  We have to connect it to the "if" command with
	@# "; \" because Makefile targets are evaluated per line, with bash
	@# variables discarded between them.  We compare the result with
	@# EXPECTED_NODE_TARGETS and not simply the NODE_TARGETS because this
	@# gives us normalization, particularly of the trailing whitespace, that
	@# we do not otherwise have.
	@FOUND_TARGETS=$$(find node_modules -maxdepth 1 -mindepth 1 -type d \
	-printf 'node_modules/%f ' | tr ' ' '\n' | grep -Ev '\.bin$$' \
	| sort | tr '\n' ' '); \
	if [ "$$FOUND_TARGETS" != "$(EXPECTED_NODE_TARGETS)" ]; then \
	echo; \
	echo "******************************************************************"; \
	echo "******************************************************************"; \
	echo "******************************************************************"; \
	echo "******************************************************************"; \
	echo "IMPORTANT: THE NODE_TARGETS VARIABLE IN THE MAKEFILE SHOULD CHANGE"; \
	echo "******************************************************************"; \
	echo "******************************************************************"; \
	echo "******************************************************************"; \
	echo "******************************************************************"; \
	echo; \
	echo "Change it to the following."; \
	echo; \
	echo $$FOUND_TARGETS; \
	fi

app/assets/javascripts/yui: node_modules/yui
	ln -sf `pwd`/node_modules/yui ./app/assets/javascripts/

node_modules/d3/d3.v2.js node_modules/d3/d3.v2.min.js: node_modules/d3

app/assets/javascripts/d3.v2.js: node_modules/d3/d3.v2.js
	ln -sf `pwd`/node_modules/d3/d3.v2.js ./app/assets/javascripts/d3.v2.js

app/assets/javascripts/d3.v2.min.js: node_modules/d3/d3.v2.min.js
	ln -sf `pwd`/node_modules/d3/d3.v2.min.js ./app/assets/javascripts/d3.v2.min.js

javascript_libraries: app/assets/javascripts/yui \
	app/assets/javascripts/d3.v2.js app/assets/javascripts/d3.v2.min.js

gjslint: virtualenv/bin/gjslint
	virtualenv/bin/gjslint --strict --nojsdoc --jslint_error=all \
	    --custom_jsdoc_tags module,main,class,method,event,property,attribute,submodule,namespace,extends,config,constructor,static,final,readOnly,writeOnce,optional,required,param,return,for,type,private,protected,requires,default,uses,example,chainable,deprecated,since,async,beta,bubbles,extension,extensionfor,extension_for \
	    $(JSFILES)

jshint: node_modules/jshint
	node_modules/jshint/bin/hint $(JSFILES)

yuidoc-lint: $(JSFILES)
	bin/lint-yuidoc

lint: gjslint jshint yuidoc-lint

virtualenv/bin/gjslint virtualenv/bin/fixjsstyle:
	virtualenv virtualenv
	virtualenv/bin/easy_install archives/closure_linter-latest.tar.gz

beautify: virtualenv/bin/fixjsstyle
	virtualenv/bin/fixjsstyle --strict --nojsdoc --jslint_error=all $(JSFILES)

spritegen: $(SPRITE_GENERATED_FILES)

$(BUILD_FILES): node_modules/yui node_modules/d3/d3.v2.min.js $(JSFILES) \
		bin/merge-files lib/merge-files.js \
		$(THIRD_PARTY_JS)
	rm -f $(BUILD_FILES)
	mkdir -p $(BUILD_ASSETS)/stylesheets
	./bin/merge-files

combine_js_css: $(BUILD_FILES)

link_debug_files:
	mkdir -p $(DEBUG_ASSETS)/stylesheets
	ln -sf `pwd`/$(SRC)/favicon.ico `pwd`/$(DEBUG)/
	ln -sf `pwd`/$(SRC)/index.html `pwd`/$(DEBUG)/
	ln -sf `pwd`/$(SRC)/config-debug.js $(DEBUG_ASSETS)/config.js
	ln -sf `pwd`/$(SRC)/modules-debug.js $(DEBUG_ASSETS)/modules.js
	ln -sf `pwd`/$(SRC)/app.js `pwd`/$(DEBUG)/$(JUJU_UI)/
	ln -sf `pwd`/$(SRC)/models `pwd`/$(DEBUG)/$(JUJU_UI)/
	ln -sf `pwd`/$(SRC)/store `pwd`/$(DEBUG)/$(JUJU_UI)/
	ln -sf `pwd`/$(SRC)/views `pwd`/$(DEBUG)/$(JUJU_UI)/
	ln -sf `pwd`/$(SRC)/widgets `pwd`/$(DEBUG)/$(JUJU_UI)/
	ln -sf `pwd`/$(ASSETS)/javascripts/yui/yui/yui-debug.js $(DEBUG_ASSETS)/app.js
	ln -sf `pwd`/$(ASSETS)/images `pwd`/$(DEBUG_ASSETS)/
	ln -sf `pwd`/$(ASSETS)/javascripts `pwd`/$(DEBUG_ASSETS)/
	ln -sf `pwd`/$(ASSETS)/svgs `pwd`/$(DEBUG_ASSETS)/
	ln -sf `pwd`/$(BUILD)/$(JUJU_UI)/templates.js `pwd`/$(DEBUG)/$(JUJU_UI)/
	ln -sf `pwd`/$(BUILD_ASSETS)/manifest.appcache `pwd`/$(DEBUG_ASSETS)/
	ln -sf `pwd`/$(BUILD_ASSETS)/stylesheets/all-static.css `pwd`/$(DEBUG_ASSETS)/stylesheets/
	ln -sf `pwd`/$(BUILD_ASSETS)/stylesheets/juju-gui.css `pwd`/$(DEBUG_ASSETS)/stylesheets/
	ln -sf `pwd`/$(BUILD_ASSETS)/stylesheets/sprite.css `pwd`/$(DEBUG_ASSETS)/stylesheets/
	ln -sf `pwd`/$(BUILD_ASSETS)/stylesheets/sprite.png `pwd`/$(DEBUG_ASSETS)/stylesheets/

link_prod_files:
	mkdir -p $(PROD_ASSETS)/stylesheets
	ln -sf `pwd`/$(SRC)/favicon.ico `pwd`/$(PROD)/
	ln -sf `pwd`/$(SRC)/index.html `pwd`/$(PROD)/
	ln -sf `pwd`/$(SRC)/config.js $(PROD_ASSETS)/config.js
	ln -sf `pwd`/$(SRC)/modules.js $(PROD_ASSETS)/modules.js
	ln -sf `pwd`/$(ASSETS)/images `pwd`/$(PROD_ASSETS)/
	ln -sf `pwd`/$(ASSETS)/svgs `pwd`/$(PROD_ASSETS)/
	ln -sf `pwd`/$(BUILD_ASSETS)/app.js `pwd`/$(PROD_ASSETS)/
	ln -sf `pwd`/$(BUILD_ASSETS)/manifest.appcache `pwd`/$(PROD_ASSETS)/
	ln -sf `pwd`/$(BUILD_ASSETS)/stylesheets/all-static.css `pwd`/$(PROD_ASSETS)/stylesheets/
	ln -sf `pwd`/$(BUILD_ASSETS)/stylesheets/juju-gui.css `pwd`/$(PROD_ASSETS)/stylesheets/
	ln -sf `pwd`/$(BUILD_ASSETS)/stylesheets/sprite.css `pwd`/$(PROD_ASSETS)/stylesheets/
	ln -sf `pwd`/$(BUILD_ASSETS)/stylesheets/sprite.png `pwd`/$(PROD_ASSETS)/stylesheets/

prep: beautify lint

test: build-debug
	./test-server.sh

server:
	@echo "Run 'make prod' or 'make debug' to start the production"
	@echo "or debug environments respectively."
	@echo "Run 'make help' to list the main available targets."

devel: build
	@echo "Running the development environment from node.js ."
	@echo "Customize config.js to modify server settings."
	node server.js

debug: build-debug
	@echo "Running the debug environment from a SimpleHTTPServer"
	@echo "To run the development environment, including automatically"
	@echo "rebuilding the generated files on changes, run 'make devel'."
	cd $(DEBUG) && python -m SimpleHTTPServer 8888

prod: build-prod
	@echo "Running the production environment from a SimpleHTTPServer"
	cd $(PROD) && python -m SimpleHTTPServer 8888

clean-builds:
	rm -rf $(BUILD) $(DEBUG) $(PROD)

clean-deps:
	rm -rf node_modules virtualenv

clean-docs:
	make -C docs clean
	rm -rf yuidoc

clean: clean-builds clean-deps clean-docs

build: appcache $(NODE_TARGETS) javascript_libraries \
	build/juju-ui/templates.js spritegen

build-debug: build combine_js_css link_debug_files

build-prod: build combine_js_css link_prod_files

$(APPCACHE): manifest.appcache.in
	mkdir -p $(BUILD_ASSETS)
	cp manifest.appcache.in $(APPCACHE)
	sed -re 's/^\# TIMESTAMP .+$$/\# TIMESTAMP $(DATE)/' -i $(APPCACHE)

appcache: $(APPCACHE)

# A target used only for forcibly updating the appcache.
appcache-touch:
	touch manifest.appcache.in

# This is the real target.  appcache-touch needs to be executed before
# appcache, and this provides the correct order.
appcache-force: appcache-touch appcache

.PHONY: test lint beautify server clean prep jshint gjslint appcache \
	appcache-touch appcache-force yuidoc spritegen yuidoc-lint \
	combine_js_css javascript_libraries build build-debug help \
	build-prod clean-builds clean-deps clean-docs devel debug \
	prod link_debug_files link_prod_files doc all
