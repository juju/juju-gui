# Makefile to help automate tasks.
PY := bin/python
PYTEST := bin/py.test
GUISRC := jujugui/static/gui/src
GUIBUILD := jujugui/static/gui/build
SVG_SPRITE_DIR := $(GUIBUILD)/app/assets
SVG_SPRITE_FILE := $(SVG_SPRITE_FILE)/stack/svg/sprite.css.svg
SVG_SPRITE_SOURCE_DIR := $(GUISRC)/app/assets/svgs
STATIC_CSS := $(GUIBUILD)/app/assets/css
STATIC_IMAGES := $(GUIBUILD)/app/assets/images
FAVICON := $(GUIBUILD)/app/favicon.ico
JS_ASSETS := $(GUISRC)/app/assets/javascripts
SCSS_FILE := $(GUISRC)/app/assets/css/base.scss
CSS_FILE := $(GUIBUILD)/app/assets/juju-gui.css
BUILT_JS_ASSETS := $(GUIBUILD)/app/assets/javascripts
JUJUGUI := lib/python*/site-packages/jujugui.egg-link
FLAKE8 := bin/flake8
PYRAMID := lib/python2.7/site-packages/pyramid
PYTESTPKG := lib/python2.7/site-packages/pytest.py
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

CACHE := $(shell pwd)/downloadcache
PYTHON_FILES := $(CACHE)/python
PYTHON_CACHE := file:///$(PYTHON_FILES)
WHEEL_CACHE := file:///$(CACHE)/wheels/generic
LSB_WHEEL_CACHE := file:///$(CACHE)/wheels/$(shell lsb_release -c -s)
COLLECTED_REQUIREMENTS := collected-requirements
PIP = bin/pip install --no-index --no-dependencies --find-links $(WHEEL_CACHE) --find-links $(LSB_WHEEL_CACHE) --find-links $(PYTHON_CACHE) -r $(1)
VPART ?= patch

RAWJSFILES = $(shell find $(GUISRC)/app -type f -name '*.js' -not -path "*app/assets/javascripts/*")
BUILT_RAWJSFILES = $(patsubst $(GUISRC)/app/%, $(GUIBUILD)/app/%, $(RAWJSFILES))
MIN_JS_FILES = $(patsubst %.js, %-min.js, $(BUILT_RAWJSFILES))
SCSS_FILES := $(shell find $(GUISRC)/app/assets/css $(GUISRC)/app/components -type f -name "*.scss")
FONT_FILES := $(shell find $(GUISRC)/app/assets/fonts -type f -name "*.woff" -or -name "*.woff2")
STATIC_FONT_FILES = $(patsubst $(GUISRC)/app/%, $(GUIBUILD)/app/%, $(FONT_FILES))
STATIC_CSS_FILES = \
	$(GUIBUILD)/app/assets/stylesheets/normalize.css \
	$(GUIBUILD)/app/assets/stylesheets/prettify.css \
	$(GUIBUILD)/app/assets/stylesheets/cssgrids-responsive-min.css

LSB_RELEASE = $(shell lsb_release -cs)

.PHONY: help
help:
	@echo "bumpversion - bump version."
	@echo "  By default bumps patch level. 'VPART=[major|minor|patch] make bumpversion' to specify."
	@echo "check - run tests and check lint."
	@echo "clean - remove build and python artifacts"
	@echo "clean-downloadcache - remove the downloadcache"
	@echo "clean-gui - clean the built gui js code"
	@echo "deps - install the dependencies"
	@echo "dist - create package."
	@echo "gui - build the gui files"
	@echo "lint - check python style with flake8"
	@echo "lint-js - check javascript style with eslint"
	@echo "qa-server - run the server with production-like settings"
	@echo "run - run the development server and watch for changes"
	@echo "server - run the server with development settings"
	@echo "start-karma - run Karma for development js testing"
	@echo "mocha-test-server - run phantom for development js testing"
	@echo "sysdeps - install the system-wide dependencies"
	@echo "test - run python tests with the default Python"
	@echo "test-deps - install the test dependencies"
	@echo "test-js-karma - run newer js tests in terminal; primarily for CI build"
	@echo "test-mocha-phantom - run older js tests that have not transitioned to karma in the terminal"
	@echo "test-mocha-karma - run older js tests that have transitioned to karma in the terminal"
	@echo "update-downloadcache - update the download cache"


#########
# PREREQS
#########
.PHONY: sysdeps
sysdeps:
	sudo apt-get install -y software-properties-common
	sudo add-apt-repository -y ppa:yellow/ppa
	sudo apt-get update
	sudo apt-get install -y nodejs python-virtualenv g++ inotify-tools
	# The yellow/ppa doesn't contain this version of npm, it will be pulled
	# from npm instead. The next step will be to update node which will include
	# the more recent npm version.
	sudo npm install -g npm@2.14.13

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

.PHONY: qa-server
qa-server: gui
	bin/pserve qa.ini

.PHONY: run
run: gui
	$(MAKE) -j2 server watch


#########
# INSTALL
#########
venv: $(PY)

$(JUJUGUI): $(PYRAMID)
	$(PY) setup.py develop

$(MODULESMIN): $(NODE_MODULES) $(PYRAMID) $(BUILT_RAWJSFILES) $(MIN_JS_FILES) $(BUILT_YUI) $(BUILT_JS_ASSETS) $(BUILT_D3)
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
		-not -name "*d3-wrapper*" | \
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
	    return children.map(NoopInternalChildren);\
	  } else if (children === Object(children)) {\
	    return NoopInternalChild(children);\
	  }\
	  return children;\
	};\
	\
	var NoopInternalChild = function (child) {\
	  var props = child.props && child.props.children ? assign({}, child.props, {\
	    children: NoopInternalChildren(child.props.children)\
	  }) : child.props;\
	  return assign({}, child, { _owner: null }, { props: props });\
	};' $(BUILT_JS_ASSETS)/react-with-addons.js
	cp $(NODE_MODULES)/react-dom/dist/react-dom.js $(BUILT_JS_ASSETS)/react-dom.js
	cp $(NODE_MODULES)/react-dom/dist/react-dom.min.js $(BUILT_JS_ASSETS)/react-dom.min.js
	cp $(NODE_MODULES)/classnames/index.js $(BUILT_JS_ASSETS)/classnames.js
	cp $(NODE_MODULES)/clipboard/dist/clipboard.js $(BUILT_JS_ASSETS)/clipboard.js
	cp $(NODE_MODULES)/clipboard/dist/clipboard.min.js $(BUILT_JS_ASSETS)/clipboard.min.js
	cp $(NODE_MODULES)/react-dnd/dist/ReactDnD.min.js $(BUILT_JS_ASSETS)/ReactDnD.min.js
	cp $(NODE_MODULES)/react-dnd-html5-backend/dist/ReactDnDHTML5Backend.min.js $(BUILT_JS_ASSETS)/ReactDnDHTML5Backend.min.js
	cp $(NODE_MODULES)/diff/dist/diff.js $(BUILT_JS_ASSETS)/diff.js
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(NODE_MODULES)/classnames/index.js -o $(BUILT_JS_ASSETS)/classnames-min.js

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
	  node_modules/d3/src/layout/pack.js \
	  $(GUISRC)/app/assets/javascripts/d3-wrapper-end.js) > $(GUIBUILD)/app/assets/javascripts/d3.js
	$(NODE_MODULES)/.bin/uglifyjs $(GUIBUILD)/app/assets/javascripts/d3.js -c -m -o $(GUIBUILD)/app/assets/javascripts/d3-min.js

$(STATIC_CSS_FILES):
	mkdir -p $(GUIBUILD)/app/assets/stylesheets
	cp $(patsubst $(GUIBUILD)/app/assets/%, $(GUISRC)/app/assets/%, $@) $@

$(STATIC_FONT_FILES): $(FONT_FILES)
	mkdir -p $(GUIBUILD)/app/assets/fonts
	cp $(patsubst $(GUIBUILD)/app/assets/%, $(GUISRC)/app/assets/%, $@) $@

$(CSS_FILE): $(PYRAMID) $(SCSS_FILES)
	mkdir -p $(GUIBUILD)/app/assets/css
	bin/sassc -s compressed $(SCSS_FILE) $@

.phony: css
css: $(CSS_FILE) $(STATIC_CSS_FILES)

$(SVG_SPRITE_FILE): $(NODE_MODULES)
	$(NODE_MODULES)/.bin/svg-sprite --dest=$(SVG_SPRITE_DIR) --stack $(SVG_SPRITE_SOURCE_DIR)/*.svg

$(STATIC_IMAGES):
	mkdir -p $(GUIBUILD)/app/assets
	cp -r $(GUISRC)/app/assets/images $(GUIBUILD)/app/assets/images
	cp -r $(GUISRC)/app/assets/svgs $(GUIBUILD)/app/assets/svgs

$(FAVICON):
	cp $(GUISRC)/app/favicon.ico $(GUIBUILD)/app/favicon.ico

.PHONY: images
images: $(STATIC_IMAGES) $(SVG_SPRITE_FILE) $(FAVICON)

.PHONY: gui
gui: $(JUJUGUI) $(MODULESMIN) $(BUILT_JS_ASSETS) $(BUILT_YUI) $(CSS_FILE) $(STATIC_CSS_FILES) $(STATIC_IMAGES) $(SVG_SPRITE_FILE) $(FAVICON) $(REACT_ASSETS) $(STATIC_FONT_FILES)

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

ifeq ($(LSB_RELEASE),precise)
  COLLECT_CMD=@cp $(PYTHON_FILES)/* $(COLLECTED_REQUIREMENTS)
else
  COLLECT_CMD=bin/pip install -d $(COLLECTED_REQUIREMENTS) --no-index --no-dependencies --find-links $(WHEEL_CACHE) --find-links $(PYTHON_CACHE) -r requirements.txt
endif

.PHONY: collect-requirements
collect-requirements: deps
	-@rm -rf $(COLLECTED_REQUIREMENTS)
	@mkdir $(COLLECTED_REQUIREMENTS)
	$(COLLECT_CMD)
	@# Arch-specific wheels cannot be used.
	-@rm -rf $(COLLECTED_REQUIREMENTS)/zope.interface*
	-@rm -rf $(COLLECTED_REQUIREMENTS)/MarkupSafe*
	-@cp $(CACHE)/python/zope.interface* $(COLLECTED_REQUIREMENTS)
	-@cp $(CACHE)/python/MarkupSafe* $(COLLECTED_REQUIREMENTS)


######
# DEPS
######
# Use the pyramid install dir as our indicator that dependencies are installed.
$(PYRAMID): $(PY) $(CACHE) requirements.txt build-requirements.txt
	$(call PIP,requirements.txt)
	$(call PIP,build-requirements.txt)
	@touch $(PYRAMID)

.PHONY: deps
deps: $(PYRAMID)

# Use the pytest binary as our indicator that the test dependencies are installed.
$(PYTEST): $(PY) $(CACHE) test-requirements.txt
	$(call PIP,test-requirements.txt)
	@touch $(PYTEST)

$(FLAKE8): $(PYTEST)

.PHONY: test-deps
test-deps: $(PYTEST)

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
	$(NODE_MODULES)/.bin/eslint --rulesdir eslint-rules/ $(GUISRC)

.PHONY: test
test: $(JUJUGUI) $(PYTEST)
	$(PYTEST) -s jujugui/tests

.PHONY: test-mocha-phantom
test-mocha-phantom: gui
	./scripts/test-mocha-phantom.sh

.PHONY: test-js-karma
test-js-karma: gui
	$(NODE_MODULES)/.bin/karma start karma.conf.js --single-run --browsers PhantomJS --log-level warn --reporters mocha

.PHONY: test-mocha-karma
test-mocha-karma: gui
	./scripts/test-mocha-karma.sh


.PHONY: start-karma
start-karma:
	$(NODE_MODULES)/.bin/karma start karma.conf.js

.PHONY: mocha-test-server
mocha-test-server:
	bin/pserve test.ini test_port=8888

.PHONY: test-selenium
# This fails with a spurious error and because we don't actually test anything
# with it, it's being skipped in ci for now.
test-selenium: gui $(PY) $(SELENIUM)
	JUJU_GUI_TEST_BROWSER="chrome" ./scripts/test-js-selenium.sh

.PHONY: check
check: clean-pyc lint lint-js test test-mocha-karma test-js-karma test-mocha-phantom

# ci-check is the target run by CI.
.PHONY: ci-check
ci-check: clean-downloadcache deps fast-babel check

###########
# Packaging
###########
.PHONY: bumpversion
bumpversion: deps
	bin/bumpversion $(VPART)

.PHONY: dist
dist: clean-all gui test-deps collect-requirements
	python setup.py sdist --formats=bztar

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
