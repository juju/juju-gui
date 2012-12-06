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

SPRITE_SOURCE_FILES=$(shell bzr ls -R -k file app/assets/images)
SPRITE_GENERATED_FILES=build/juju-ui/assets/sprite.css \
	build/juju-ui/assets/sprite.png
BUILD_FILES=build/juju-ui/assets/app.js \
	build/juju-ui/assets/all-yui.js \
	build/juju-ui/assets/combined-css/all-static.css
DATE=$(shell date -u)
APPCACHE=build/juju-ui/assets/manifest.appcache

all: build-debug build-prod
	@echo "\nDebug and production environments built."
	@echo "Run 'make help' to list the main available targets."

help:
	@echo "Main targets:"
	@echo "[no target]: build the debug and production environments"
	@echo "devel: run the development environment (dynamic templates/CSS)"
	@echo "debug: run the debugging environment (static templates/CSS)"
	@echo "prod: run the production environment (aggregated, compressed files)"
	@echo "clean: remove the generated build directories"
	@echo "clean-all: remove build, deps and doc directories"
	@echo "test: run tests in the browser"
	@echo "prep: beautify and lint the source"
	@echo "doc: generate Sphinx and YuiDoc documentation"
	@echo "help: this description"
	@echo "Other, less common targets are available, see Makefile."

build/juju-ui/templates.js: $(TEMPLATE_TARGETS) bin/generateTemplates
	mkdir -p build/juju-ui/assets
	./bin/generateTemplates

yuidoc/index.html: node_modules/yuidocjs $(JSFILES)
	node_modules/.bin/yuidoc -o yuidoc -x assets app

yuidoc: yuidoc/index.html

doc: yuidoc
	make -C docs html

$(SPRITE_GENERATED_FILES): node_modules/grunt node_modules/node-spritesheet \
		$(SPRITE_SOURCE_FILES)
	node_modules/grunt/bin/grunt spritegen

$(NODE_TARGETS): package.json
	npm install
	# Keep all targets up to date, not just new/changed ones.
	for dirname in $(NODE_TARGETS); do touch $$dirname ; done
	@# Check to see if we made what we expected to make, and warn if we did
	@# not. Note that we calculate FOUND_TARGETS here, in this way and not
	@# in the standard Makefile way, because we need to see what
	@# node_modules were created by this target.  Makefile variables and
	@# substitutions, even when using $(eval...) within a target, happen
	@# initially, before the target is run.  Therefore, if this were a
	@# simple Makefile variable, it  would be empty after a first run, and
	@# you would always see the warning message in that case.  We have to
	@# connect it to the "if" command with "; \" because Makefile targets
	@# are evaluated per line, with bash variables discarded between them.
	@# We compare the result with EXPECTED_NODE_TARGETS and not simply the
	@# NODE_TARGETS because this gives us normalization, particularly of the
	@# trailing whitespace, that we do not otherwise have.
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
	ln -sf node_modules/yui app/assets/javascripts/

node_modules/d3/d3.v2.js node_modules/d3/d3.v2.min.js: node_modules/d3

app/assets/javascripts/d3.v2.js: node_modules/d3/d3.v2.js
	ln -sf node_modules/d3/d3.v2.js app/assets/javascripts/d3.v2.js

app/assets/javascripts/d3.v2.min.js: node_modules/d3/d3.v2.min.js
	ln -sf node_modules/d3/d3.v2.min.js app/assets/javascripts/d3.v2.min.js

javascript-libraries: app/assets/javascripts/yui \
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
	mkdir -p build/juju-ui/assets/combined-css
	./bin/merge-files

combine_js_css: $(BUILD_FILES)

link_debug_files:
	mkdir -p build-debug/juju-ui/assets/combined-css
	ln -sf $(PWD)/app/favicon.ico build-debug/
	ln -sf $(PWD)/app/index.html build-debug/
	ln -sf $(PWD)/app/config-debug.js build-debug/juju-ui/assets/config.js
	ln -sf $(PWD)/app/modules-debug.js build-debug/juju-ui/assets/modules.js
	ln -sf $(PWD)/app/app.js build-debug/juju-ui/
	ln -sf $(PWD)/app/models build-debug/juju-ui/
	ln -sf $(PWD)/app/store build-debug/juju-ui/
	ln -sf $(PWD)/app/views build-debug/juju-ui/
	ln -sf $(PWD)/app/widgets build-debug/juju-ui/
	ln -sf $(PWD)/app/assets/javascripts/yui/yui/yui-debug.js \
		build-debug/juju-ui/assets/all-yui.js
	ln -sf $(PWD)/app/assets/images build-debug/juju-ui/assets/
	ln -sf $(PWD)/app/assets/javascripts build-debug/juju-ui/assets/
	ln -sf $(PWD)/app/assets/svgs build-debug/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/templates.js build-debug/juju-ui/
	ln -sf $(PWD)/build/juju-ui/assets/manifest.appcache \
		build-debug/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/combined-css/all-static.css \
		build-debug/juju-ui/assets/combined-css/
	ln -sf $(PWD)/build/juju-ui/assets/juju-gui.css build-debug/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/sprite.css build-debug/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/sprite.png build-debug/juju-ui/assets/
	ln -sf $(PWD)/node_modules/yui/assets/skins/sam/rail-x.png \
		build-debug/juju-ui/assets/combined-css/rail-x.png
	# Link each YUI module's assets.
	mkdir -p build-debug/juju-ui/assets/skins/night/ \
		build-debug/juju-ui/assets/skins/sam/
	find ./node_modules/yui/ -path "*/skins/night/*" -type f \
		-exec ln -sf "$(PWD)/{}" build-debug/juju-ui/assets/skins/night/ \;
	find ./node_modules/yui/ -path "*/skins/sam/*" -type f \
		-exec ln -sf "$(PWD)/{}" build-debug/juju-ui/assets/skins/sam/ \;
	find ./node_modules/yui/ -path "*/assets/*" \! -path "*/skins/*" -type f \
		-exec ln -sf "$(PWD)/{}" build-debug/juju-ui/assets/ \;

link_prod_files:
	mkdir -p build-prod/juju-ui/assets/combined-css
	ln -sf $(PWD)/app/favicon.ico build-prod/
	ln -sf $(PWD)/app/index.html build-prod/
	ln -sf $(PWD)/app/config.js build-prod/juju-ui/assets/config.js
	ln -sf $(PWD)/app/modules.js build-prod/juju-ui/assets/modules.js
	ln -sf $(PWD)/app/assets/images build-prod/juju-ui/assets/
	ln -sf $(PWD)/app/assets/svgs build-prod/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/all-yui.js build-prod/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/app.js build-prod/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/manifest.appcache \
		build-prod/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/combined-css/all-static.css \
		build-prod/juju-ui/assets/combined-css/
	ln -sf $(PWD)/build/juju-ui/assets/juju-gui.css build-prod/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/sprite.css build-prod/juju-ui/assets/
	ln -sf $(PWD)/build/juju-ui/assets/sprite.png build-prod/juju-ui/assets/
	ln -sf $(PWD)/node_modules/yui/assets/skins/sam/rail-x.png \
		build-prod/juju-ui/assets/combined-css/rail-x.png
	# Link each YUI module's assets.
	mkdir -p build-prod/juju-ui/assets/skins/night/ \
		build-prod/juju-ui/assets/skins/sam/
	find ./node_modules/yui/ -path "*/skins/night/*" -type f \
		-exec ln -sf "$(PWD)/{}" build-prod/juju-ui/assets/skins/night/ \;
	find ./node_modules/yui/ -path "*/skins/sam/*" -type f \
		-exec ln -sf "$(PWD)/{}" build-prod/juju-ui/assets/skins/sam/ \;
	find ./node_modules/yui/ -path "*/assets/*" \! -path "*/skins/*" -type f \
		-exec ln -sf "$(PWD)/{}" build-prod/juju-ui/assets/ \;

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
	cd build-debug && python -m SimpleHTTPServer 8888

prod: build-prod
	@echo "Running the production environment from a SimpleHTTPServer"
	cd build-prod && python -m SimpleHTTPServer 8888

clean:
	rm -rf build build-debug build-prod

clean-deps:
	rm -rf node_modules virtualenv

clean-docs:
	make -C docs clean

clean-all: clean clean-deps clean-docs

build: appcache $(NODE_TARGETS) javascript_libraries \
	build/juju-ui/templates.js spritegen

build-debug: build combine_js_css link_debug_files

build-prod: build combine_js_css link_prod_files

$(APPCACHE): manifest.appcache.in
	mkdir -p build/juju-ui/assets
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
	build-prod clean clean-deps clean-docs clean-all devel debug \
	prod link_debug_files link_prod_files doc

.DEFAULT_GOAL := all
