# Makefile to help automate tasks
PY := bin/python
PYTEST := bin/py.test
GUISRC := jujugui/static/gui/src
GUIBUILD := jujugui/static/gui/build
TEMPLATES_FILE := $(GUIBUILD)/app/templates.js
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
BUILT_YUI := $(BUILT_JS_ASSETS)/yui
D3_DEPS := $(GUIBUILD)/node_modules/d3
BUILT_D3 := $(BUILT_JS_ASSETS)/d3.min.js
SELENIUM := lib/python2.7/site-packages/selenium-2.47.1-py2.7.egg/selenium/selenium.py

CACHE := $(shell pwd)/downloadcache
PYTHON_CACHE := file:///$(CACHE)/python
WHEEL_CACHE := file:///$(CACHE)/wheels/$(shell lsb_release -c -s)

PIP = bin/pip install --no-index --no-dependencies --find-links $(WHEEL_CACHE) --find-links $(PYTHON_CACHE) -r $(1)

RAWJSFILES = $(shell find $(GUISRC)/app -type f -name '*.js' -not -path "*app/assets/javascripts/*")
BUILT_RAWJSFILES = $(patsubst $(GUISRC)/app/%, $(GUIBUILD)/app/%, $(RAWJSFILES))
MIN_JS_FILES = $(patsubst %.js, %-min.js, $(BUILT_RAWJSFILES))
TEMPLATE_FILES := $(shell find $(GUISRC)/app -type f -name "*.handlebars" -or -name "*.partial")
STATIC_CSS_FILES = \
	$(GUIBUILD)/app/assets/stylesheets/normalize.css \
	$(GUIBUILD)/app/assets/stylesheets/prettify.css \
	$(GUIBUILD)/app/assets/stylesheets/cssgrids-responsive-min.css

.PHONY: help
help:
	@echo "check - run tests and check lint."
	@echo "clean - remove build and python artifacts"
	@echo "deps - install the dependencies"
	@echo "dev - install jujugui in develop mode"
	@echo "gui - build the gui files"
	@echo "lint - check style with flake8"
	@echo "run - run the development server"
	@echo "test - run tests quickly with the default Python"
	@echo "test-deps - install the test dependencies"

#########
# PREREQS
#########
.PHONY: sysdeps
sysdeps:
	sudo apt-get install -y software-properties-common
	sudo add-apt-repository -y ppa:yellow/ppa
	sudo apt-get update
	sudo apt-get install -y imagemagick nodejs python-virtualenv g++

.PHONY: src
src: $(GUISRC)

#######
# TOOLS
#######
$(PY):
	virtualenv .

$(NODE_MODULES):
	npm install --cache-min 999999

.PHONY: run
run: gui
	bin/pserve --reload development.ini

#########
# INSTALL
#########
.PHONY: all
all: venv deps dev

venv: $(PY)

$(JUJUGUI): $(PYRAMID)
	$(PY) setup.py develop

$(MODULESMIN): $(NODE_MODULES) $(PYRAMID) $(BUILT_RAWJSFILES) $(MIN_JS_FILES) $(TEMPLATES_FILE) $(BUILT_YUI) $(BUILT_JS_ASSETS) $(BUILT_D3)
	bin/python scripts/generate_modules.py -n YUI_MODULES -s $(GUIBUILD)/app -o $(MODULES) -x "(-min.js)|(\/yui\/)"
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(MODULES) -o $(MODULESMIN)

.PHONY: modules-js
modules-js: $(MODULESMIN)

# The build-js target is used to build and minify only the js files that have
# changed since the last time they were built.
.PHONY: build-js
build-js: $(BUILT_RAWJSFILES) $(MIN_JS_FILES)

$(GUIBUILD)/app/%-min.js: $(GUIBUILD)/app/%.js $(NODE_MODULES)
	$(NODE_MODULES)/.bin/uglifyjs --screw-ie8 $(GUISRC)/app/$*.js -o $@

$(GUIBUILD)/app/%.js: $(GUISRC)/app/%.js $(NODE_MODULES)
	mkdir -p $(@D)
	$(NODE_MODULES)/.bin/babel $(GUISRC)/app/$*.js --out-file=$(GUIBUILD)/app/$*.js

$(BUILT_JS_ASSETS): $(NODE_MODULES)
	mkdir -p $(GUIBUILD)/app/assets
	cp -Lr $(JS_ASSETS) $(GUIBUILD)/app/assets/
	find $(BUILT_JS_ASSETS) -type f -name "*.js" -not -name "*d3-wrapper*" -not -name "*unscaled-pack*" | sed s/\.js$$//g | xargs -I {} node_modules/.bin/uglifyjs --screw-ie8 {}.js -o {}-min.js

$(YUI): $(NODE_MODULES)

$(BUILT_YUI): $(YUI) $(BUILT_JS_ASSETS)
	cp -r $(YUI) $(BUILT_YUI)

# XXX j.c.sackett 2015-06-22 This target only has to exist b/c of the juju-gui's
# expectation that there is a node_modules dir in its tree; when the source is
# permanantely part of this project, we can remove this target and update the d3
# wrapper locations.
$(D3_DEPS): $(NODE_MODULES) $(BUILT_JS_ASSETS)
	mkdir -p $(GUIBUILD)/node_modules
	cp -r $(abspath ./$(NODE_MODULES)/d3) $(GUIBUILD)/node_modules/

$(BUILT_D3): $(D3_DEPS)
	@$(NODE_MODULES)/.bin/smash $(shell $(NODE_MODULES)/.bin/smash --list \
	  $(GUIBUILD)/app/assets/javascripts/d3-wrapper-start.js \
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
	  $(GUIBUILD)/app/assets/javascripts/unscaled-pack.js \
	  $(GUIBUILD)/app/assets/javascripts/d3-wrapper-end.js) > $(GUIBUILD)/app/assets/javascripts/d3.js
	$(NODE_MODULES)/.bin/uglifyjs $(GUIBUILD)/app/assets/javascripts/d3.js -c -m -o $(GUIBUILD)/app/assets/javascripts/d3.min-min.js

$(TEMPLATES_FILE): $(NODE_MODULES) $(TEMPLATE_FILES)
	mkdir -p $(GUIBUILD)/app/assets
	scripts/generateTemplates
	node_modules/.bin/uglifyjs --screw-ie8 $(TEMPLATES_FILE) -o $(basename $(TEMPLATES_FILE))-min.js

.PHONY: template
template: $(TEMPLATES_FILE)

$(STATIC_CSS_FILES):
	mkdir -p $(GUIBUILD)/app/assets/stylesheets
	cp $(patsubst $(GUIBUILD)/app/assets/%, $(GUISRC)/app/assets/%, $@) $@

$(CSS_FILE): $(PYRAMID)
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
gui: $(JUJUGUI) $(MODULESMIN) $(BUILT_JS_ASSETS) $(BUILT_YUI) $(CSS_FILE) $(STATIC_CSS_FILES) $(SPRITE_FILE) $(STATIC_IMAGES)

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
	bin/pip install archives/selenium-2.47.1.tar.gz

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

.PHONY: test-selenium
test-selenium: gui $(SELENIUM)
	JUJU_GUI_TEST_BROWSER="chrome" $(PY) jujugui/static/gui/src/test/test_browser.py -v

.PHONY: check
check: clean-pyc lint lint-js test test-js-phantom

# ci-check is the target run by CI.
.PHONY: ci-check
ci-check: clean-downloadcache deps check test-selenium

###########
# Packaging
###########
.PHONY: dist
dist: gui
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
