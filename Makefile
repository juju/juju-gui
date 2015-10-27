# Makefile to help automate tasks
PY := bin/python
PYTEST := bin/py.test
GUISRC := jujugui/static/gui/src
GUIBUILD := jujugui/static/gui/build
OLD_TEMPLATES_FILE := $(GUIBUILD)/app/templates.js
NEW_TEMPLATES_FILE := $(GUIBUILD)/app/components/templates.js
SPRITE_FILE := $(GUIBUILD)/app/assets/sprites.png
SPRITE_CSS_FILE := $(GUIBUILD)/app/assets/sprites.css
STATIC_CSS := $(GUIBUILD)/app/assets/css
STATIC_IMAGES := $(GUIBUILD)/app/assets/images
JS_ASSETS := $(GUISRC)/app/assets/javascripts
SCSS_FILE := $(GUISRC)/app/assets/css/base.scss
CSS_FILE := $(GUIBUILD)/app/assets/juju-gui.css
BUILT_JS_ASSETS := $(GUIBUILD)/app/assets/javascripts
JUJUGUI := lib/python*/site-packages/jujugui.egg-link
FLAKE8 := bin/flake8
PYRAMID := lib/python2.7/site-packages/pyramid
NODE_MODULES := node_modules
MODULES := $(GUIBUILD)/modules.js
MODULESMIN := $(GUIBUILD)/modules-min.js
YUI := $(NODE_MODULES)/yui
JS_MACAROON := $(NODE_MODULES)/js-macaroon/build/yui-macaroon.js
BUILT_YUI := $(BUILT_JS_ASSETS)/yui
D3_DEPS := $(GUIBUILD)/node_modules/d3
BUILT_D3 := $(BUILT_JS_ASSETS)/d3-min.js
SELENIUM := lib/python2.7/site-packages/selenium-2.47.3-py2.7.egg/selenium/selenium.py
REACT_ASSETS := $(BUILT_JS_ASSETS)/react-with-addons.js $(BUILT_JS_ASSETS)/react-with-addons.min.js
HANDLEBARS_ASSETS := $(BUILT_JS_ASSETS)/handlebars.runtime.js $(BUILT_JS_ASSETS)/handlebars.runtime.min.js

CACHE := $(shell pwd)/downloadcache
PYTHON_CACHE := file:///$(CACHE)/python
WHEEL_CACHE := file:///$(CACHE)/wheels/generic
LSB_WHEEL_CACHE := file:///$(CACHE)/wheels/$(shell lsb_release -c -s)

PIP = bin/pip install --no-index --no-dependencies --find-links $(WHEEL_CACHE) --find-links $(LSB_WHEEL_CACHE) --find-links $(PYTHON_CACHE) -r $(1)
VPART ?= patch

RAWJSFILES = $(shell find $(GUISRC)/app -type f -name '*.js' -not -path "*app/assets/javascripts/*")
BUILT_RAWJSFILES = $(patsubst $(GUISRC)/app/%, $(GUIBUILD)/app/%, $(RAWJSFILES))
MIN_JS_FILES = $(patsubst %.js, %-min.js, $(BUILT_RAWJSFILES))
OLD_TEMPLATE_FILES := $(shell find $(GUISRC)/app -type f -name "*.handlebars" -or -name "*.partial")
NEW_TEMPLATE_FILES := $(shell find $(GUISRC)/app/components -type f -name "*.hbs")
SCSS_FILES := $(shell find $(GUISRC)/app/assets/css $(GUISRC)/app/components -type f -name "*.scss")
STATIC_CSS_FILES = \
	$(GUIBUILD)/app/assets/stylesheets/normalize.css \
	$(GUIBUILD)/app/assets/stylesheets/prettify.css \
	$(GUIBUILD)/app/assets/stylesheets/cssgrids-responsive-min.css

.PHONY: help
help:
	@echo "check - run tests and check lint."
	@echo "clean - remove build and python artifacts"
	@echo "clean-gui - clean the built gui js code"
	@echo "clean-downloadcache - remove the downloadcache"
	@echo "dist - bump version and package."
	@echo "  By default bumps patch level. 'VPART=[major|minor|patch] make dist' to specify."
	@echo "deps - install the dependencies"
	@echo "gui - build the gui files"
	@echo "lint - check python style with flake8"
	@echo "lint-js - check javascript style with eslint"
	@echo "run - run the development server"
	@echo "test - run python tests with the default Python"
	@echo "test-js-phantom - run older js tests in terminal"
	@echo "test-js-karma - run newer js tests in terminal; primarily for CI build"
	@echo "start-karma - run Karma for development js testing"
	@echo "test-deps - install the test dependencies"
	@echo "update-downloadcache - update the download cache"


#########
# PREREQS
#########
.PHONY: sysdeps
sysdeps:
	sudo apt-get install -y software-properties-common
	sudo add-apt-repository -y ppa:yellow/ppa
	sudo apt-get update
	sudo apt-get install -y imagemagick nodejs python-virtualenv g++ inotify-tools

.PHONY: src
src: $(GUISRC)

#######
# TOOLS
#######
$(PY):
	virtualenv .

$(NODE_MODULES):
	npm install --cache-min 999999

.PHONY: server
server: gui
	bin/pserve --reload development.ini

.PHONY: run
run: gui
	$(MAKE) -j2 server watch

#########
# INSTALL
#########
venv: $(PY)

$(JUJUGUI): $(PYRAMID)
	$(PY) setup.py develop

$(MODULESMIN): $(NODE_MODULES) $(PYRAMID) $(BUILT_RAWJSFILES) $(MIN_JS_FILES) $(OLD_TEMPLATES_FILE) $(NEW_TEMPLATES_FILE) $(BUILT_YUI) $(BUILT_JS_ASSETS) $(BUILT_D3)
	bin/python scripts/generate_modules.py -n YUI_MODULES -s $(GUIBUILD)/app -o $(MODULES) -x "(-min.js)|(\/yui\/)|(javascripts\/d3\.js)"
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(MODULES) -o $(MODULESMIN)

.PHONY: modules-js
modules-js: $(MODULESMIN)

# fast-babel is simply passed an input and output folder which dramatically
# speeds up the build time because it doesn't need to spin up a new instance
# for every file.
.PHONE: fast-babel
fast-babel: $(NODE_MODULES)
	$(NODE_MODULES)/.bin/babel $(GUISRC)/app --out-dir $(GUIBUILD)/app \
		--ignore /assets/javascripts/

$(GUIBUILD)/app/%-min.js: $(GUIBUILD)/app/%.js $(NODE_MODULES)
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(GUIBUILD)/app/$*.js -o $@

$(GUIBUILD)/app/%.js: $(GUISRC)/app/%.js $(NODE_MODULES)
	mkdir -p $(@D)
	$(NODE_MODULES)/.bin/babel $(GUISRC)/app/$*.js --out-file=$(GUIBUILD)/app/$*.js

$(BUILT_JS_ASSETS): $(NODE_MODULES)
	mkdir -p $(GUIBUILD)/app/assets
	cp $(JS_MACAROON) $(JS_ASSETS)
	cp -Lr $(JS_ASSETS) $(GUIBUILD)/app/assets/
	find $(BUILT_JS_ASSETS) -type f -name "*.js" \
		-not -name "react*" \
		-not -name "*d3-wrapper*" \
		-not -name "*unscaled-pack*" | \
		sed s/\.js$$//g | \
		xargs -I {} node_modules/.bin/uglifyjs --screw-ie8 {}.js -o {}-min.js

$(YUI): $(NODE_MODULES)

$(REACT_ASSETS): $(NODE_MODULES)
	cp $(NODE_MODULES)/react/dist/react-with-addons.js $(BUILT_JS_ASSETS)/react-with-addons.js
	cp $(NODE_MODULES)/react/dist/react-with-addons.min.js $(BUILT_JS_ASSETS)/react-with-addons.min.js
	# There is a bug in how the React shadow renderer renders the owner property
	# in 0.14. Below is the workaround code which gets replaced into the 'built'
	# React release. Hopefully the PR will make it into the next release.
	# https://github.com/facebook/react/issues/5292
	sed	-i -e '/var NoopInternalComponent = function (element) {/,/^};/c\
	var NoopInternalComponent = function (element) {\
	  var type = element.type.name || element.type;\
	  var props = {};\
	  if (element.props.children) {\
	    props.children = NoopInternalChildren(element.props.children);\
	  }\
	  var props = assign({}, element.props, props);\
	\
	  this._renderedOutput = assign({}, element, { type: type, props: props });\
	  this._currentElement = element;\
	};\
	\
	var NoopInternalChildren = function (children) {\
	  if (Array.isArray(children)) {\
	    return children.map(NoopInternalChild);\
	  } else if (children === Object(children)) {\
	    return NoopInternalChild(children);\
	  }\
	  return children;\
	};\
	\
	var NoopInternalChild = function (child) {\
	  if (child === null || child === undefined) { return; }\
	  if (typeof child === "string") { return child; }\
	  if (Array.isArray(child)) {\
	    return child.map(NoopInternalChild);\
	  }\
	  var props = child.props && child.props.children ? assign({}, child.props, {\
	    children: NoopInternalChildren(child.props.children)\
	  }) : child.props;\
	  return assign({}, child, { _owner: null }, { props: props });\
	};' $(BUILT_JS_ASSETS)/react-with-addons.js
	cp $(NODE_MODULES)/react-dom/dist/react-dom.js $(BUILT_JS_ASSETS)/react-dom.js
	cp $(NODE_MODULES)/react-dom/dist/react-dom.min.js $(BUILT_JS_ASSETS)/react-dom.min.js
	cp $(NODE_MODULES)/classnames/index.js $(BUILT_JS_ASSETS)/classnames.js
	cp $(NODE_MODULES)/react-onclickoutside/index.js $(BUILT_JS_ASSETS)/react-onclickoutside.js
	cp $(NODE_MODULES)/diff/dist/diff.js $(BUILT_JS_ASSETS)/diff.js
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(NODE_MODULES)/classnames/index.js -o $(BUILT_JS_ASSETS)/classnames-min.js
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(NODE_MODULES)/react-onclickoutside/index.js -o $(BUILT_JS_ASSETS)/react-onclickoutside-min.js

$(HANDLEBARS_ASSETS): $(NODE_MODULES)
	cp $(NODE_MODULES)/handlebars/dist/handlebars.runtime.js $(BUILT_JS_ASSETS)/handlebars.runtime.js
	cp $(NODE_MODULES)/handlebars/dist/handlebars.runtime.min.js $(BUILT_JS_ASSETS)/handlebars.runtime.min.js

$(BUILT_YUI): $(YUI) $(BUILT_JS_ASSETS)
	cp -r $(YUI) $(BUILT_YUI)

$(BUILT_D3):
	mkdir -p $(GUIBUILD)/app/assets/javascripts
	$(NODE_MODULES)/.bin/smash $(shell $(NODE_MODULES)/.bin/smash --list \
	  $(GUISRC)/app/assets/javascripts/d3-wrapper-start.js \
	  node_modules/d3/src/compat/index.js \
	  node_modules/d3/src/selection/* \
	  node_modules/d3/src/behavior/* \
	  node_modules/d3/src/geom/hull.js \
	  node_modules/d3/src/geom/polygon.js \
	  node_modules/d3/src/scale/linear.js \
	  node_modules/d3/src/scale/log.js \
	  node_modules/d3/src/transition/* \
	  node_modules/d3/src/svg/line.js \
	  node_modules/d3/src/svg/arc.js \
	  node_modules/d3/src/event/drag.js \
	  $(GUISRC)/app/assets/javascripts/unscaled-pack.js \
	  $(GUISRC)/app/assets/javascripts/d3-wrapper-end.js) > $(GUIBUILD)/app/assets/javascripts/d3.js
	$(NODE_MODULES)/.bin/uglifyjs $(GUIBUILD)/app/assets/javascripts/d3.js -c -m -o $(GUIBUILD)/app/assets/javascripts/d3-min.js

$(OLD_TEMPLATES_FILE): $(NODE_MODULES) $(OLD_TEMPLATE_FILES)
	mkdir -p $(GUIBUILD)/app/assets
	scripts/generateTemplates
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(OLD_TEMPLATES_FILE) -o $(basename $(OLD_TEMPLATES_FILE))-min.js

$(NEW_TEMPLATES_FILE): $(NODE_MODULES) $(NEW_TEMPLATE_FILES)
	mkdir -p $(GUIBUILD)/app/assets
	$(NODE_MODULES)/.bin/handlebars $(NEW_TEMPLATE_FILES) -f $(NEW_TEMPLATES_FILE)
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(NEW_TEMPLATES_FILE) -o $(basename $(NEW_TEMPLATES_FILE))-min.js

.PHONY: template
template: $(OLD_TEMPLATES_FILE) $(NEW_TEMPLATES_FILE)

$(STATIC_CSS_FILES):
	mkdir -p $(GUIBUILD)/app/assets/stylesheets
	cp $(patsubst $(GUIBUILD)/app/assets/%, $(GUISRC)/app/assets/%, $@) $@

$(CSS_FILE): $(PYRAMID) $(SCSS_FILES)
	mkdir -p $(GUIBUILD)/app/assets/css
	bin/sassc -s compressed $(SCSS_FILE) $@

.phony: css
css: $(CSS_FILE) $(STATIC_CSS_FILES)

$(SPRITE_FILE): $(NODE_MODULES)
	$(NODE_MODULES)/grunt/bin/grunt spritegen

$(STATIC_IMAGES):
	mkdir -p $(GUIBUILD)/app/assets
	cp -r $(GUISRC)/app/assets/images $(GUIBUILD)/app/assets/images
	cp -r $(GUISRC)/app/assets/svgs $(GUIBUILD)/app/assets/svgs

.PHONY: images
images: $(SPRITE_FILE) $(STATIC_IMAGES)

.PHONY: gui
gui: $(JUJUGUI) $(MODULESMIN) $(BUILT_JS_ASSETS) $(BUILT_YUI) $(CSS_FILE) $(STATIC_CSS_FILES) $(SPRITE_FILE) $(STATIC_IMAGES) $(REACT_ASSETS) $(HANDLEBARS_ASSETS)

.PHONY: watch
watch:
	while true; do \
		inotifywait -q -r --exclude=".*sw[px]$$" -e modify -e create -e delete -e move $(GUISRC); \
		$(MAKE) gui; \
		echo "\033[1;32m-- Done rebuilding\033[0m"; \
	done

################
# Download cache
################
$(CACHE):
	git clone --depth=1 "git@github.com:juju/juju-gui-downloadcache.git" $(CACHE)

downloadcache: $(CACHE)

.PHONY: clean-downloadcache
clean-downloadcache:
	rm -rf $(CACHE)

.PHONY: update-downloadcache
update-downloadcache: $(CACHE)
	cd $(CACHE) && git pull origin master || true

######
# DEPS
######
# Use the pyramid install dir as our indicator that dependencies are installed.
$(PYRAMID): $(PY) $(CACHE)
	$(call PIP,requirements.txt)

.PHONY: deps
deps: $(PY) $(CACHE)
	$(call PIP,requirements.txt)

# Use the pytest binary as our indicator that the test dependencies are installed.
$(PYTEST): $(PY) $(CACHE)
	$(call PIP,test-requirements.txt)

$(FLAKE8): $(PYTEST)

.PHONY: test-deps
test-deps: $(PY)
	$(call PIP,test-requirements.txt)

$(SELENIUM): $(PY)
	@# Because shelltoolbox requires ez_setup already installed before being
	@# installed we need to manually do them this way instead of via the
	@# requirements.txt.
	bin/pip install --no-index --no-dependencies --find-links $(WHEEL_CACHE) --find-links $(PYTHON_CACHE) ez_setup==0.9
	bin/pip install --no-index --no-dependencies --find-links $(WHEEL_CACHE) --find-links $(PYTHON_CACHE) shelltoolbox==0.2.1
	bin/pip install archives/selenium-2.47.3.tar.gz

#######
# Tests
#######
.PHONY: lint
lint: $(FLAKE8)
	$(FLAKE8) jujugui

.PHONY: lint-js
lint-js: $(NODE_MODULES)
	$(NODE_MODULES)/.bin/eslint $(GUISRC)

.PHONY: test
test: $(PYTEST)
	$(PYTEST) -s jujugui/tests

.PHONY: test-js-phantom
test-js-phantom: gui
	./scripts/test-js.sh

.PHONY: test-js-karma
test-js-karma: gui
	$(NODE_MODULES)/.bin/karma start karma.conf.js --single-run --browsers PhantomJS --no-colors --log-level warn --reporters mocha

.PHONY: start-karma
start-karma:
	$(NODE_MODULES)/.bin/karma start karma.conf.js

.PHONY: test-selenium
test-selenium: gui $(PY) $(SELENIUM)
	JUJU_GUI_TEST_BROWSER="chrome" ./scripts/test-js-selenium.sh

.PHONY: check
check: clean-pyc lint lint-js test test-js-phantom test-js-karma

# ci-check is the target run by CI.
.PHONY: ci-check
ci-check: clean-downloadcache deps fast-babel check test-selenium

###########
# Packaging
###########
.PHONY: dist
dist: gui test-deps
	bin/bumpversion $(VPART)
	python setup.py sdist

#######
# CLEAN
#######
.PHONY: clean-dist
clean-dist:
	- rm -rf dist

.PHONY: clean-venv
clean-venv:
	- rm -rf bin include lib local man share build node_modules

.PHONY: clean-pyc
clean-pyc:
	find . -name '*.pyc' -exec rm -f {} +
	find . -name '*.pyo' -exec rm -f {} +
	find . -name '*~' -exec rm -f {} +

.PHONY: clean-gui
clean-gui:
	- rm -rf jujugui/static/gui/build

.PHONY: clean-all
clean-all: clean-venv clean-pyc clean-gui clean-dist
	- rm -rf *.egg-info
