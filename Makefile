JSFILES=$(shell bzr ls -RV -k file | grep -E -e '.+\.js(on)?$$|generateTemplates$$' | grep -Ev -e '^manifest\.json$$' -e '^test/assets/' -e '^app/assets/javascripts/reconnecting-websocket.js$$' -e '^server.js$$')

NODE_TARGETS=node_modules/chai node_modules/cryptojs node_modules/d3 \
	node_modules/expect.js node_modules/express node_modules/graceful-fs \
	node_modules/grunt node_modules/jshint node_modules/less \
	node_modules/minimatch node_modules/mocha node_modules/node-markdown \
	node_modules/node-minify node_modules/node-spritesheet \
	node_modules/rimraf node_modules/should node_modules/yui \
	node_modules/yuidocjs
EXPECTED_NODE_TARGETS=$(shell echo "$(NODE_TARGETS)" | tr ' ' '\n' | sort | tr '\n' ' ')
TEMPLATE_TARGETS=$(shell bzr ls -k file app/templates)

BUILD=build
DEVEL=$(BUILD)-devel
DEBUG=$(BUILD)-debug
PROD=$(BUILD)-prod
JUJU_UI=juju-ui
BUILD_ASSETS_DIR=$(BUILD)/$(JUJU_UI)/assets
DEVEL_ASSETS_DIR=$(DEVEL)/$(JUJU_UI)/assets
DEBUG_ASSETS_DIR=$(DEBUG)/$(JUJU_UI)/assets
PROD_ASSETS_DIR=$(PROD)/$(JUJU_UI)/assets

SPRITE_SOURCE_FILES=$(shell bzr ls -R -k file app/assets/images)
SPRITE_GENERATED_FILES=$(BUILD_ASSETS_DIR)/stylesheets/sprite.css \
	$(BUILD_ASSETS_DIR)/stylesheets/sprite.png
DEBUG_FILES=$(DEBUG_ASSETS_DIR)/modules-debug.js \
	$(DEBUG_ASSETS_DIR)/config-debug.js \
	$(DEBUG_ASSETS_DIR)/stylesheets/xxx.css
PRODUCTION_FILES=$(PROD_ASSETS_DIR)/modules.js \
	$(PROD_ASSETS_DIR)/config.js \
	$(PROD_ASSETS_DIR)/app.js \
	$(PROD_ASSETS_DIR)/stylesheets/all-static.css
DATE=$(shell date -u)
APPCACHE=$(BUILD_ASSETS_DIR)/manifest.appcache

all:
	@echo "Available targets:"
	@echo "appcache: create the manifest.appcache file inside build"
	@echo "doc: generate both Sphinx and YuiDoc documentation"
	@echo "yuidoc: generate YuiDoc documentation"

build/juju-ui/templates.js: $(TEMPLATE_TARGETS) bin/generateTemplates
	mkdir -p $(BUILD_ASSETS_DIR)/stylesheets
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

$(DEBUG_FILES): node_modules/yui node_modules/d3/d3.v2.min.js $(JSFILES)
	rm -f $(DEBUG_FILES)
	mkdir -p $(DEBUG_ASSETS_DIR)/stylesheets
	cp app/modules-debug.js $(DEBUG_ASSETS_DIR)/modules.js
	cp app/config-debug.js $(DEBUG_ASSETS_DIR)/config.js

copy_debug_files: $(DEBUG_FILES)

$(PRODUCTION_FILES): node_modules/yui node_modules/d3/d3.v2.min.js $(JSFILES) ./bin/merge-files
	rm -f $(PRODUCTION_FILES)
	mkdir -p $(PROD_ASSETS_DIR)/stylesheets
	./bin/merge-files
	cp app/modules.js $(PROD_ASSETS_DIR)/modules.js
	cp app/config.js $(PROD_ASSETS_DIR)/config.js

combine_js_css: $(PRODUCTION_FILES)

link_devel_files:
	ln -sf `pwd`/$(BUILD)/index.html `pwd`/$(DEVEL)/index.html

link_debug_files:
	ln -sf `pwd`/$(BUILD)/index.html `pwd`/$(DEBUG)/index.html
	ln -sf `pwd`/$(BUILD)/favicon.ico `pwd`/$(DEBUG)/favicon.ico
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/images `pwd`/$(DEBUG_ASSETS_DIR)/images
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/svgs `pwd`/$(DEBUG_ASSETS_DIR)/svgs
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/manifest.appcache `pwd`/$(DEBUG_ASSETS_DIR)/manifest.appcache
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/stylesheets/juju-gui.css `pwd`/$(DEBUG_ASSETS_DIR)/stylesheets/juju-gui.css
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/stylesheets/sprite.css `pwd`/$(DEBUG_ASSETS_DIR)/stylesheets/sprite.css
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/stylesheets/sprite.png `pwd`/$(DEBUG_ASSETS_DIR)/stylesheets/sprite.png

link_prod_files:
	ln -sf `pwd`/$(BUILD)/index.html `pwd`/$(PROD)/
	ln -sf `pwd`/$(BUILD)/favicon.ico `pwd`/$(PROD)/
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/images `pwd`/$(PROD_ASSETS_DIR)/
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/svgs `pwd`/$(PROD_ASSETS_DIR)/
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/manifest.appcache `pwd`/$(PROD_ASSETS_DIR)/
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/stylesheets/juju-gui.css `pwd`/$(PROD_ASSETS_DIR)/stylesheets/
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/stylesheets/sprite.css `pwd`/$(PROD_ASSETS_DIR)/stylesheets/
	ln -sf `pwd`/$(BUILD_ASSETS_DIR)/stylesheets/sprite.png `pwd`/$(PROD_ASSETS_DIR)/stylesheets/

prep: beautify lint

test: build
	./test-server.sh

devel: build-devel
	@echo "Customize config.js to modify server settings"
	node server.js

debug: build-debug
	@echo "Running the debug environment from a SimpleHTTPServer"
	cd $(DEBUG) && python -m SimpleHTTPServer 8888

prod: build-prod
	@echo "Running the production environment from a SimpleHTTPServer"
	cd $(PROD) && python -m SimpleHTTPServer 8888

clean:
	rm -rf node_modules virtualenv yuidoc
	make -C docs clean
	rm -Rf build/

clean-devel:
	rm -Rf $(DEVEL)

clean-debug:
	rm -Rf $(DEBUG)

clean-prod:
	rm -Rf $(PROD)

build/index.html: app/index.html
	cp -f app/index.html build/

build/favicon.ico: app/favicon.ico
	cp -f app/favicon.ico build/

$(BUILD_ASSETS_DIR)/images: $(SPRITE_SOURCE_FILES)
	cp -rf app/assets/images $(BUILD_ASSETS_DIR)/images

$(BUILD_ASSETS_DIR)/svgs: $(shell bzr ls -R -k file app/assets/svgs)
	cp -rf app/assets/svgs $(BUILD_ASSETS_DIR)/svgs

build_images: build/favicon.ico $(BUILD_ASSETS_DIR)/images \
	$(BUILD_ASSETS_DIR)/svgs

build: appcache $(NODE_TARGETS) javascript_libraries \
	build/juju-ui/templates.js spritegen \
	build/index.html build_images

build-devel: build yuidoc link_devel_files

build-debug: build copy_debug_files link_debug_files

build-prod: build combine_js_css link_prod_files

$(APPCACHE): manifest.appcache.in
	mkdir -p $(BUILD_ASSETS_DIR)
	cp manifest.appcache.in $(APPCACHE)
	sed -re 's/^\# TIMESTAMP .+$$/\# TIMESTAMP $(DATE)/' -i $(APPCACHE)

appcache: $(APPCACHE)

# A target used only for forcibly updating the appcache.
appcache-touch:
	touch manifest.appcache.in

# This is the real target.  appcache-touch needs to be executed before
# appcache, and this provides the correct order.
appcache-force: appcache-touch appcache

.PHONY: test lint beautify server clean build_images prep jshint gjslint \
	appcache appcache-touch appcache-force yuidoc spritegen yuidoc-lint \
	combinejs javascript_libraries
