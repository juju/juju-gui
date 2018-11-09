# Makefile to help automate tasks.
PY := bin/python
PYTEST := bin/py.test
GUISRC := jujugui/static/gui/src
GUIBUILD := jujugui/static/gui/build
ASSETS_DIR := $(GUISRC)/app/assets
SVG_SPRITE_SOURCE_DIR := $(GUISRC)/app/assets/svgs
BUILD_CSS := $(GUIBUILD)/app/assets/css
STATIC_IMAGES := $(GUIBUILD)/app/assets/images
FAVICON := $(GUIBUILD)/app/favicon.ico
CSS_FILE := $(GUIBUILD)/app/assets/juju-gui.css
BUILT_JS_ASSETS := $(GUIBUILD)/app/assets/javascripts
JUJUGUI := lib/python*/site-packages/jujugui.egg-link
FLAKE8 := bin/flake8
PYRAMID := lib/python2.7/site-packages/pyramid
PYTESTPKG := lib/python2.7/site-packages/pytest.py
NODE_MODULES := node_modules
SVG_SPRITE_MODULE := $(NODE_MODULES)/svg-sprite/
YUI := $(NODE_MODULES)/yui
BUILT_YUI := $(BUILT_JS_ASSETS)/yui
SELENIUM := lib/python2.7/site-packages/selenium-2.47.3-py2.7.egg/selenium/selenium.py
JEST := $(NODE_MODULES)/.bin/jest

CACHE := $(shell pwd)/downloadcache
PYTHON_FILES := $(CACHE)/python
PYTHON_CACHE := file:///$(PYTHON_FILES)
WHEEL_CACHE := file:///$(CACHE)/wheels/generic
LSB_WHEEL_CACHE := file:///$(CACHE)/wheels/$(shell lsb_release -c -s)
COLLECTED_REQUIREMENTS := collected-requirements
PIP = bin/pip install --no-index --no-dependencies --find-links $(WHEEL_CACHE) --find-links $(LSB_WHEEL_CACHE) --find-links $(PYTHON_CACHE) -r $(1)
VPART ?= patch

RAWJSFILES = $(shell find $(GUISRC)/app -type f -name '*.js')
BUILT_RAWJSFILES = $(patsubst $(GUISRC)/app/%, $(GUIBUILD)/app/%, $(RAWJSFILES))
MIN_JS_FILES = $(patsubst %.js, %-min.js, $(BUILT_RAWJSFILES))
FONT_FILES := $(shell find $(GUISRC)/app/assets/fonts -type f -name "*.woff" -or -name "*.woff2")
STATIC_FONT_FILES = $(patsubst $(GUISRC)/app/%, $(GUIBUILD)/app/%, $(FONT_FILES))

LSB_RELEASE = $(shell lsb_release -cs)

CURRENT_VERSION = $(shell sed -n -e '/current_version =/ s/.*\= *// p' .bumpversion.cfg)
CURRENT_COMMIT = $(shell git rev-parse HEAD)

.PHONY: help
help:
	@echo "bumpversion - bump version."
	@echo "  By default bumps patch level. 'VPART=[major|minor|patch] make bumpversion' to specify."
	@echo "check - run tests and check lint."
	@echo "clean-downloadcache - remove the downloadcache"
	@echo "clean-gui - clean the built gui js code"
	@echo "deps - install the dependencies"
	@echo "dist - create package."
	@echo "gui - build the gui files"
	@echo "lint - check python style with flake8"
	@echo "lint-js - check javascript style with eslint"
	@echo "lint-css - check scss style with sass-lint"
	@echo "qa-server - run the server with production-like settings"
	@echo "run - run the development server and watch for changes"
	@echo "server - run the server with development settings"
	@echo "start-karma - run Karma for development js testing"
	@echo "svg-sprite - build the svg sprite"
	@echo "sysdeps - install the system-wide dependencies"
	@echo "test - run python tests with the default Python"
	@echo "test-deps - install the test dependencies"
	@echo "test-js - run newer js tests in terminal; primarily for CI build"
	@echo "test-jest - run Jest tests in the terminal"
	@echo "test-js-old - run older js tests that have transitioned to karma in the terminal"
	@echo "update-downloadcache - update the download cache"
	@echo "update-jest-snapshots - update the Jest snapshots"
	@echo "uitest - run functional tests;"
	@echo "  use the ARGS environment variable to append/override uitest arguments"


#########
# PREREQS
#########
.PHONY: sysdeps
sysdeps:
	sudo apt install -y curl
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo apt install -y nodejs
	sudo apt update
	sudo apt install -y chromium-browser coreutils g++ git inotify-tools python-dev python-virtualenv xvfb
	realpath --version || sudo apt-get install -y realpath # realpath is already present on bionic.

#######
# TOOLS
#######
$(PY):
	virtualenv . --python=python2

$(NODE_MODULES):
	npm install

.PHONY: server
server: gui
	bin/pserve --reload development.ini

.PHONY: qa-server
qa-server: gui
	bin/pserve qa.ini

.PHONY: run
run: gui
	@echo
	@echo "=============================================================="
	@echo "To run the GUI you must point it at a running Juju controller."
	@echo "The accepted way of doing this is via the GUIProxy project: https://github.com/juju/guiproxy"
	@echo "=============================================================="
	@echo
	$(MAKE) -j2 server watch


#########
# INSTALL
#########
venv: $(PY)

$(JUJUGUI): $(PYRAMID)
	$(PY) setup.py develop

$(GUIBUILD)/app/%.js $(GUIBUILD)/app/%-min.js: $(GUISRC)/app/%.js
	./scripts/transpile.js

$(BUILT_JS_ASSETS): $(NODE_MODULES)
	mkdir -p $(BUILT_JS_ASSETS)
	echo 'window.GUI_VERSION = {"version": "$(CURRENT_VERSION)", "commit": "$(CURRENT_COMMIT)"};' > $(GUIBUILD)/app/assets/javascripts/version.js
	find $(BUILT_JS_ASSETS) -type f -name "*.js" \
		sed s/\.js$$//g | \
		xargs -I {} BABEL_ENV=production $(NODE_MODULES)/.bin/babel --minified --no-comments {}.js -o {}-min.js

$(YUI): $(NODE_MODULES)

$(BUILT_YUI): $(YUI) $(BUILT_JS_ASSETS)
	cp -r $(YUI) $(BUILT_YUI)
	# With the update to npm3 YUI now has nested dependencies which bloats the
	# dist. Because we do not run YUI in node we can safely delete this folder.
	rm -rf $(BUILT_YUI)/node_modules

$(STATIC_FONT_FILES): $(FONT_FILES)
	mkdir -p $(GUIBUILD)/app/assets/fonts
	cp $(patsubst $(GUIBUILD)/app/assets/%, $(GUISRC)/app/assets/%, $@) $@

$(STATIC_IMAGES):
	mkdir -p $(GUIBUILD)/app/assets
	cp -r $(GUISRC)/app/assets/images $(GUIBUILD)/app/assets/images
	cp -r $(GUISRC)/app/assets/svgs $(GUIBUILD)/app/assets/svgs
	mkdir -p $(GUIBUILD)/app/assets/stack/svg
	cp $(GUISRC)/app/assets/stack/svg/sprite.css.svg $(GUIBUILD)/app/assets/stack/svg/sprite.css.svg

$(FAVICON):
	cp $(GUISRC)/app/favicon.ico $(GUIBUILD)/app/favicon.ico

$(SVG_SPRITE_MODULE):
	npm install svg-sprite@1.3.6

.PHONY: images
images: $(STATIC_IMAGES) $(FAVICON)

.PHONY: svg-sprite
svg-sprite: $(SVG_SPRITE_MODULE)
	$(NODE_MODULES)/.bin/svg-sprite --dest=$(ASSETS_DIR) --stack $(SVG_SPRITE_SOURCE_DIR)/*.svg
	mkdir -p $(GUIBUILD)/app/assets/stack/svg
	cp $(GUISRC)/app/assets/stack/svg/sprite.css.svg $(GUIBUILD)/app/assets/stack/svg/sprite.css.svg

.PHONY: gui-deps
gui-deps: $(JUJUGUI) $(BUILT_JS_ASSETS) $(BUILT_YUI) $(STATIC_IMAGES) $(FAVICON) $(STATIC_FONT_FILES)

.PHONY: gui
gui: gui-deps
	mkdir -p $(BUILD_CSS)
	$(NODE_MODULES)/.bin/browserifyinc -r ./$(GUISRC)/app/init.js:init -o ./$(GUIBUILD)/app/init-pkg.js -t [ babelify --plugins [ transform-react-jsx ] ] -p [ ./browserify/scss.js --build-dir=./$(BUILD_CSS) ]
	cat $(BUILD_CSS)/*.scss > $(CSS_FILE)

.PHONY: prod-gui
prod-gui: gui-deps
	BABEL_ENV=production $(NODE_MODULES)/.bin/browserify -r ./$(GUISRC)/app/init.js:init -o ./$(GUIBUILD)/app/init-pkg.js -t [ babelify --plugins [ transform-react-jsx ] ] -g [ envify purge --NODE_ENV production ] -g uglifyify -p [ ./browserify/scss.js --file=$(CSS_FILE) --prod=true ]

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
	git clone --depth=1 "https://github.com/juju/juju-gui-downloadcache.git" $(CACHE)

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
  COLLECT_CMD=bin/pip download -d $(COLLECTED_REQUIREMENTS) --no-index --no-deps --find-links $(WHEEL_CACHE) --find-links $(PYTHON_CACHE) -r requirements.txt
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
deps: $(PYRAMID) $(NODE_MODULES)

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
lint: $(NODE_MODULES) lint-python lint-js lint-css

.PHONY: lint-python
lint-python: $(FLAKE8)
	$(FLAKE8) jujugui

.PHONY: lint-js
lint-js: $(NODE_MODULES)
	$(NODE_MODULES)/.bin/eslint --rulesdir eslint-rules/ $(GUISRC)

.PHONY: lint-css
lint-css: $(NODE_MODULES)
	$(NODE_MODULES)/.bin/sass-lint -q -v

.PHONY: lint-components
lint-components:
	 @./scripts/inspect-components validate --path jujugui/static/gui/src/ --short

.PHONY: test
test: test-python test-js test-jest test-js-old

.PHONY: test-python
test-python: $(JUJUGUI) $(PYTEST)
	$(PYTEST) -s jujugui/tests

.PHONY: test-js
test-js: gui
	./scripts/test-js.sh

.PHONY: test-js-old
test-js-old: gui
	./scripts/test-js-old.sh

.PHONY: start-karma
start-karma:
	MULTI_RUN=true ./scripts/test-js.sh

.PHONY: test-jest
test-jest: gui
	$(JEST)

.PHONY: watch-jest
watch-jest: gui
	$(JEST) --watchAll

.PHONY: update-jest-snapshots
update-jest-snapshots: gui
	$(JEST) -u

.PHONY: test-selenium
# This fails with a spurious error and because we don't actually test anything
# with it, it's being skipped in ci for now.
test-selenium: gui $(PY) $(SELENIUM)
	JUJU_GUI_TEST_BROWSER="chrome" ./scripts/test-js-selenium.sh

.PHONY: check
check: clean-pyc lint test

# ci-check is the target run by CI.
.PHONY: ci-check
ci-check: clean-downloadcache deps check

###########
# Packaging
###########
.PHONY: bumpversion
bumpversion: deps
	bin/bumpversion $(VPART)

.PHONY: version
version:
	echo '{"version": "$(CURRENT_VERSION)", "commit": "$(CURRENT_COMMIT)"}' > $(GUIBUILD)/app/version.json

.PHONY: dist
dist: clean-all deps prod-gui test-deps collect-requirements version
	# We are only minifying the init bundle here because it takes considerable time.
	BABEL_ENV=production $(NODE_MODULES)/.bin/babel --minified --no-comments ./$(GUIBUILD)/app/init-pkg.js -o ./$(GUIBUILD)/app/init-pkg-min.js
	$(PY) setup.py sdist --formats=bztar\

.PHONY: fast-dist
fast-dist: deps gui test-deps collect-requirements version
	# We are only minifying the init bundle here because it takes considerable time.
	BABEL_ENV=production $(NODE_MODULES)/.bin/babel --minified --no-comments ./$(GUIBUILD)/app/init-pkg.js -o ./$(GUIBUILD)/app/init-pkg-min.js
	$(PY) setup.py sdist --formats=bztar\

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
	- rm .last-transpile
	- rm browserify-cache.json

.PHONY: clean-all
clean-all: clean-venv clean-pyc clean-gui clean-dist clean-uitest
	- rm -rf *.egg-info

.PHONY: clean-uitest
clean-uitest:
	- rm -rf uitest

.PHONY: uitest
uitest: sudo dist
	@scripts/uitest.sh $(ARGS)

.PHONY: sudo
sudo:
	@# Pre-cache sudo permissions, so that the process is not stopped later.
	@sudo -v
