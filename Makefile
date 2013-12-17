# Makefile debugging hack: uncomment the two lines below and make will tell you
# more about what is happening.  The output generated is of the form
# "FILE:LINE [TARGET (DEPENDENCIES) (NEWER)]" where DEPENDENCIES are all the
# things TARGET depends on and NEWER are all the files that are newer than
# TARGET.  DEPENDENCIES will be colored green and NEWER will be blue.
#
#OLD_SHELL := $(SHELL)
#SHELL = $(warning [$@ [32m($^) [34m($?)[m ])$(OLD_SHELL)

# Build a target for JavaScript files.  The find command excludes directories
# as needed through the -prune directive, and the grep command removes
# individual unwanted JavaScript and JSON files from the list.
# find(1) is used here to build a list of JavaScript targets  due to the speed
# of network access being unpredictable. Additionally, working with the
# release or an export, a developer may not be working in a checkout.
JSFILES=$(shell find . -wholename './node_modules*' -prune \
	-o -wholename './build*' -prune \
	-o -wholename './docs*' -prune \
	-o -wholename './test/assets*' -prune \
	-o -wholename './yuidoc*' -prune \
	-o \( \
		-name '*.js' \
		-o -name 'generateTemplates' \
	\) -print \
	| sort | sed -e 's/^\.\///' \
	| grep -Ev \
		-e '^app/assets/javascripts/d3(\.min)?\.js$$' \
		-e '^app/assets/javascripts/spin\.min\.js$$' \
		-e '^app/assets/javascripts/spinner\.js$$' \
		-e '^app/assets/javascripts/js-yaml\.min\.js$$' \
		-e '^app/assets/javascripts/reconnecting-websocket\.js$$' \
		-e '^app/assets/javascripts/prettify.js$$' \
		-e '^app/assets/javascripts/FileSaver.js$$' \
		-e '^app/assets/javascripts/gallery-.*\.js$$' \
		-e '^server.js$$')
THIRD_PARTY_JS=app/assets/javascripts/reconnecting-websocket.js
LINT_IGNORE='app/assets/javascripts/prettify.js, app/assets/javascripts/FileSaver.js, app/assets/javascripts/spinner.js, app/assets/javascripts/Object.observe.poly.js'
NODE_TARGETS=node_modules/chai node_modules/cryptojs node_modules/d3 \
    node_modules/expect.js node_modules/express \
    node_modules/graceful-fs node_modules/grunt node_modules/jshint \
    node_modules/less node_modules/minimatch node_modules/mocha \
    node_modules/node-markdown node_modules/node-minify \
    node_modules/node-spritesheet node_modules/recess \
    node_modules/rimraf node_modules/should node_modules/uglify-js \
    node_modules/yui node_modules/yuidocjs
EXPECTED_NODE_TARGETS=$(shell echo "$(NODE_TARGETS)" | tr ' ' '\n' | sort \
	| tr '\n' ' ')

### Release-specific variables - see docs/process.rst for an overview. ###
SHA=$(shell git describe --always HEAD)

# This is where the ci-check target stores the PID of the server under test.
TEST_SERVER_PID=ci-check-gui-server.pid
BROWSER_TEST_FAILED_FILE=browser-test-failed

# Figure out the two most recent version numbers.
ULTIMATE_VERSION=$(shell grep '^-' CHANGES.yaml | head -n 1 | sed 's/[ :-]//g')
PENULTIMATE_VERSION=$(shell grep '^-' CHANGES.yaml | head -n 2 | tail -n 1 \
    | sed 's/[ :-]//g')
RELEASE_TARGETS=dist
# If the user specified (via setting an environment variable on the command
# line) that this is a final (non-development) release, set the version number
# and series appropriately.
ifdef FINAL
# If this is a FINAL (non-development) release, then the most recent version
# number should not be "unreleased".
ifneq (, $(filter $(RELEASE_TARGETS), $(MAKECMDGOALS)))
ifeq ($(ULTIMATE_VERSION), unreleased)
    $(error FINAL releases must have a most-recent version number other than \
	"unreleased" in CHANGES.yaml)
endif
endif
RELEASE_VERSION=$(ULTIMATE_VERSION)
SERIES=stable
else
# If this is development (non-FINAL) release, then the most recent version
# number must be "unreleased".
ifneq (, $(filter $(RELEASE_TARGETS), $(MAKECMDGOALS)))
ifneq ($(ULTIMATE_VERSION), unreleased)
    $(error non-FINAL releases must have a most-recent version number of \
	"unreleased" in CHANGES.yaml)
endif
endif
RELEASE_VERSION=$(PENULTIMATE_VERSION)+build.$(SHA)
SERIES=trunk
endif
# If we are doing a production release (as opposed to a trial-run release) we
# use the "real" Launchpad site, if not we use the Launchpad staging site.
ifndef PROD
LAUNCHPAD_API_ROOT=staging
endif
RELEASE_NAME=juju-gui-$(RELEASE_VERSION)
RELEASE_FILE=releases/$(RELEASE_NAME).xz
RELEASE_SIGNATURE=releases/$(RELEASE_NAME).asc
NPM_CACHE_VERSION=$(SHA)
NPM_CACHE_FILE=$(CURDIR)/releases/npm-cache-$(NPM_CACHE_VERSION).tgz
NPM_SIGNATURE=$(NPM_CACHE_FILE).asc
# Is the branch being released a branch of trunk?
ifndef BRANCH_IS_GOOD
ifndef IS_TRUNK_BRANCH
IS_TRUNK_BRANCH=$(shell git branch -av | grep '* master' 1>&2 2> /dev/null; echo $$?)
endif
# Does the branch on disk have uncomitted/unpushed changes?
ifndef BRANCH_IS_CLEAN
BRANCH_IS_CLEAN=$(shell git diff-index --quiet --cached HEAD 1>&2 2> /dev/null; echo $$?)
endif


# Is it safe to do a release of the branch?  For trial-run releases you can
# override this check on the command line by setting the BRANCH_IS_GOOD
# environment variable.
ifeq ($(IS_TRUNK_BRANCH), 0)
ifeq ($(BRANCH_IS_CLEAN), 0)
BRANCH_IS_GOOD=0
endif
endif
endif

### End of release-specific variables ###
TEMPLATE_TARGETS=$(shell find app -type f -regextype posix-extended -regex '.+\.(handlebars|partial)')

CSS_TARGETS=$(shell find lib/views -type f -name '*.less') \
    $(shell find app/assets/css -type f -name '*.scss')

SPRITE_SOURCE_FILES=$(shell find app/assets/images -type f ! -name '.*' ! -name '*.swp' ! -name '*~' ! -name '\#*' -print)
SPRITE_GENERATED_FILES=build-shared/juju-ui/assets/sprites.css \
	build-shared/juju-ui/assets/sprites.png
NON_SPRITE_IMAGES=build-shared/juju-ui/assets/images
BUILD_FILES=build-shared/juju-ui/assets/modules.js \
	build-shared/juju-ui/assets/all-yui.js \
	build-shared/juju-ui/assets/combined-css/all-static.css
JAVASCRIPT_LIBRARIES=app/assets/javascripts/d3.js \
	app/assets/javascripts/d3.min.js app/assets/javascripts/yui
DATE=$(shell date -u)

# Some environments, notably sudo, do not populate the default PWD environment
# variable, which is used to set $(PWD).  Worse, in some situations, such as
# using make -C [directory], $(PWD) is set to a value we don't want: the
# directory in which make was invoked, rather than the directory of this file.
# Therefore, we want to run the shell's pwd to get this Makefile's directory.
# As an optimization, we stash this value in the local PWD variable.
PWD=$(shell pwd)

all: build virtualenv/bin/python
	@echo "\nDebug and production environments built."
	@echo "Run 'make help' to list the main available targets."

help:
	@echo "Main targets:"
	@echo "[no target] or build: build the debug and production environments"
	@echo "devel: run the development environment (dynamic templates/CSS)"
	@echo "debug: run the debugging environment (static templates/CSS)"
	@echo "prod: run the production environment (aggregated, compressed files)"
	@echo "clean: remove the generated build directories"
	@echo "clean-all: remove build, deps and doc directories"
	@echo "test-debug: run tests on the cli from the debug environment"
	@echo "test-prod: run tests on the cli from the production environment"
	@echo "test-misc: run tests of project infrastructure bits"
	@echo "test-server: run tests in the browser from the debug environment"
	@echo "test-prod-server: run tests in the browser from the prod environment"
	@echo "prep: beautify and lint the source"
	@echo "docs: generate project and code documentation"
	@echo "check: run checks used by lbox"
	@echo "view-docs: generate both doc sets and view them in the browser"
	@echo "help: this description"
	@echo "Other targets are available.  See the Makefile."

build-shared/juju-ui/templates.js: $(TEMPLATE_TARGETS) bin/generateTemplates
	mkdir -p build-shared/juju-ui/assets
	bin/generateTemplates

yuidoc/index.html: node_modules/yuidocjs $(JSFILES)
	node_modules/.bin/yuidoc --lint -o yuidoc -x assets app

main-doc:
	make -C docs SPHINXOPTS=-W html

view-main-doc: main-doc
	xdg-open docs/_build/html/index.html

sphinx:
	@echo "Deprecated. Please run 'make main-doc' or 'make view-main-doc'."

code-doc: yuidoc/index.html

view-code-doc: code-doc
	xdg-open yuidoc/index.html

yuidoc:
	@echo "Deprecated. Please run 'make code-doc' or 'make view-code-doc'."

docs: code-doc main-doc

view-docs: docs
	xdg-open docs/_build/html/index.html
	xdg-open yuidoc/index.html

$(SPRITE_GENERATED_FILES): node_modules/grunt node_modules/node-spritesheet \
		$(SPRITE_SOURCE_FILES)
	node_modules/grunt/bin/grunt spritegen

$(NON_SPRITE_IMAGES):
	mkdir -p build-shared/juju-ui/assets/images
	cp -r app/assets/images/non-sprites/* build-shared/juju-ui/assets/images/

install-npm-packages: $(NODE_TARGETS)

$(NODE_TARGETS): package.json
	npm install --cache-min=999999999
	# Keep all targets up to date, not just new/changed ones.
	for dirname in $(NODE_TARGETS); do touch $$dirname ; done
	@# Check to see if we made what we expected to make, and warn if we did
	@# not. Note that we calculate FOUND_TARGETS here, in this way and not
	@# in the standard Makefile way, because we need to see what
	@# node_modules were created by this target.  Makefile variables and
	@# substitutions, even when using $(eval...) within a target, happen
	@# initially, before the target is run.	 Therefore, if this were a
	@# simple Makefile variable, it	would be empty after a first run, and
	@# you would always see the warning message in that case.  We have to
	@# connect it to the "if" command with "; \\" because Makefile targets
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

$(JAVASCRIPT_LIBRARIES): | node_modules/yui node_modules/d3
	ln -sf "$(PWD)/node_modules/yui" app/assets/javascripts/yui
	ln -sf "$(PWD)/node_modules/d3/d3.js" app/assets/javascripts/d3.js
	ln -sf "$(PWD)/node_modules/d3/d3.min.js" \
		app/assets/javascripts/d3.min.js

gjslint: virtualenv/bin/gjslint
	virtualenv/bin/gjslint --unix --strict --nojsdoc --jslint_error=all \
	    --custom_jsdoc_tags module,main,class,method,event,property,attribute,submodule,namespace,extends,config,constructor,static,final,readOnly,writeOnce,optional,required,param,return,for,type,private,protected,requires,default,uses,example,chainable,deprecated,since,async,beta,bubbles,extension,extensionfor,extension_for \
		-x $(LINT_IGNORE) $(JSFILES) \
	    | sed -n '0,/^Found /p'| sed '/^Found /q1' # less garbage output

jshint: node_modules/jshint
	node_modules/jshint/bin/jshint --verbose $(JSFILES)

undocumented:
	bin/lint-yuidoc --generate-undocumented > undocumented

lint-yuidoc: $(JSFILES)
	node_modules/.bin/yuidoc --lint -x assets app
	bin/lint-yuidoc

recess: node_modules/recess
	@# We need to grep for "Perfect" because recess does not set a
	@# non-zero exit code if it rejects a file.  If this fails, run the
	@# recess command below without the grep to get recess report.
	node_modules/recess/bin/recess lib/views/stylesheet.less \
	    --config recess.json | grep -q Perfect

lint: test-prep jshint gjslint recess lint-license-headers test-filtering \
		lint-yuidoc

lint-license-headers:
	@# Take the list of JS files in one long line and break them into
	@# multiple lines (this assumes there are no spaces in the paths).
	@# Remove non-JS files, remove third-party files, and remove files in
	@# the root of the project.  Finally, search for copyright notices in
	@# the files and report files that do not have one.
	echo $(JSFILES) | sed 's/ /\n/g' \
	| grep '\.js$$' | grep -v /assets/ | grep / \
	| xargs -I {} sh -c "grep -L '^Copyright (C) 2[^ ]* Canonical Ltd.' {}" \
	|| (echo "The above files are missing copyright headers."; false)

virtualenv/bin/python:
	virtualenv virtualenv --system-site-packages
	virtualenv/bin/easy_install archives/selenium-2.35.0.tar.gz

virtualenv/bin/gjslint virtualenv/bin/fixjsstyle: virtualenv/bin/python
	virtualenv/bin/easy_install archives/closure_linter-latest.tar.gz

beautify: virtualenv/bin/fixjsstyle
	virtualenv/bin/fixjsstyle --strict --nojsdoc --jslint_error=all $(JSFILES)

spritegen: $(SPRITE_GENERATED_FILES)

$(BUILD_FILES): $(JSFILES) $(CSS_TARGETS) $(THIRD_PARTY_JS) \
		build-shared/juju-ui/templates.js \
		bin/merge-files lib/merge-files.js \
		app/assets/javascripts/js-yaml.min.js \
		app/assets/javascripts/spin.min.js | $(JAVASCRIPT_LIBRARIES)
	rm -f $(BUILD_FILES)
	mkdir -p build-shared/juju-ui/assets/combined-css/
	bin/merge-files
	mv *.js.map build-shared/juju-ui/assets/

build-files: $(BUILD_FILES)

# This leaves out all of the individual YUI assets, because we can't have them
# the first time the Makefile is run in a clean tree.
shared-link-files-list=build-$(1)/juju-ui/assets/combined-css \
	build-$(1)/favicon.ico \
	build-$(1)/index.html \
	build-$(1)/juju-ui/assets/config.js \
	build-$(1)/juju-ui/assets/modules.js \
	build-$(1)/juju-ui/assets/images \
	build-$(1)/juju-ui/assets/svgs \
	build-$(1)/juju-ui/version.js \
	build-$(1)/juju-ui/assets/combined-css/all-static.css \
	build-$(1)/juju-ui/assets/juju-gui.css \
	build-$(1)/juju-ui/assets/sprites.css \
	build-$(1)/juju-ui/assets/sprites.png \
	build-$(1)/juju-ui/assets/all-yui.js

LINK_DEBUG_FILES=$(call shared-link-files-list,debug) \
	build-debug/juju-ui/app.js \
	build-debug/juju-ui/websocket-logging.js \
	build-debug/juju-ui/models \
	build-debug/juju-ui/store \
	build-debug/juju-ui/subapps \
	build-debug/juju-ui/views \
	build-debug/juju-ui/widgets \
	build-debug/juju-ui/assets/javascripts \
	build-debug/juju-ui/templates.js

LINK_PROD_FILES=$(call shared-link-files-list,prod)

# These are shared instructions between link-debug-files and link-prod-files.
define link-files
	mkdir -p build-$(1)/juju-ui/assets/combined-css
	ln -sf "$(PWD)/app/favicon.ico" build-$(1)/
	ln -sf "$(PWD)/app/index.html" build-$(1)/
	ln -sf "$(PWD)/app/config-$(1).js" build-$(1)/juju-ui/assets/config.js
	ln -sf "$(PWD)/app/assets/images" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/app/assets/svgs" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/app/assets/javascripts" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/version.js" build-$(1)/juju-ui/
	ln -sf \
	    "$(PWD)/build-shared/juju-ui/assets/combined-css/all-static.css" \
	    build-$(1)/juju-ui/assets/combined-css/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/juju-gui.css" \
	    build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/sprites.css" \
	    build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/sprites.png" \
	    build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/node_modules/yui/event-simulate/event-simulate.js" \
	    build-$(1)/juju-ui/assets/
	ln -sf \
	    "$(PWD)/node_modules/yui/node-event-simulate/node-event-simulate.js" \
	    build-$(1)/juju-ui/assets
	# Copy each YUI module's assets to a parallel directory in the build
	# location.  This is run in a subshell (indicated by the parenthesis)
	# so we can change directory and have it not effect this process.  To
	# understand how it does what it does look at the man page for cp,
	# particularly "--parents".  Notice that this makes copies instead of
	# links.  This goes against the way the dependencies are structured and
	# so may be a problem in the future.  If so, a way to do this as links
	# would be called for.
	(cd node_modules/yui/ && \
	 cp -r --parents */assets "$(PWD)/build-$(1)/juju-ui/assets/")
endef

$(LINK_DEBUG_FILES):
	$(call link-files,debug)
	ln -sf "$(PWD)/app/app.js" build-debug/juju-ui/
	ln -sf "$(PWD)/app/websocket-logging.js" build-debug/juju-ui/
	ln -sf "$(PWD)/app/models" build-debug/juju-ui/
	ln -sf "$(PWD)/app/store" build-debug/juju-ui/
	ln -sf "$(PWD)/app/subapps" build-debug/juju-ui/
	ln -sf "$(PWD)/app/views" build-debug/juju-ui/
	ln -sf "$(PWD)/app/widgets" build-debug/juju-ui/
	ln -sf "$(PWD)/app/assets/javascripts/yui/yui/yui-debug.js" \
		build-debug/juju-ui/assets/all-yui.js
	ln -sf "$(PWD)/build-shared/juju-ui/templates.js" build-debug/juju-ui/
	ln -sf "$(PWD)/app/modules-debug.js" build-debug/juju-ui/assets/modules.js

$(LINK_PROD_FILES):
	$(call link-files,prod)
	ln -sf "$(PWD)/build-shared/juju-ui/assets/all-yui.js" build-prod/juju-ui/assets/
	ln -sf "$(PWD)"/build-shared/juju-ui/assets/*.js.map build-prod/juju-ui/assets/
	# Link in the application source code so source maps work.
	mkdir -p $(PWD)/build-prod/juju-ui/assets/source
	ln -s $(PWD)/app $(PWD)/build-prod/juju-ui/assets/source
	ln -s $(PWD)/node_modules $(PWD)/build-prod/juju-ui/assets/source
	ln -sf "$(PWD)/build-shared/juju-ui/assets/modules.js" build-prod/juju-ui/assets/modules.js

prep: beautify lint

# XXX bac: the order of test-debug and test-prod seems to affect the execution
# of this target when called by lbox.  Please do not change.
# You can disable the colored mocha output by setting ENV var MOCHA_NO_COLOR=1
check: lint test-debug test-prod test-misc test-browser docs

# This is what gets run in CI for a branch to land.  Since an external service
# (Sauce Labs) is invoked to test the server, the machine running these tests
# must have an externally routable IP.
ci-check:
	# Report any server already running and abort.
	! netstat -tnap 2> /dev/null | grep ":8888 " | grep " LISTEN "
	# Run the browser tests against a remote browser (uses Sauce Labs).
	JUJU_GUI_TEST_BROWSER="chrome" make test-browser

test/extracted_startup_code: app/index.html
	# Pull the JS out of the index so we can run tests against it.
	cat app/index.html | \
	    sed -n '/<script id="app-startup">/,/<\/script>/p'| \
	    head -n-1 | tail -n+2 > test/extracted_startup_code

test/test_startup.js: test/test_startup.js.top test/test_startup.js.bottom \
    test/extracted_startup_code
	# Stitch together the test file for app start-up.
	echo "// THIS IS A GENERATED FILE.  DO NOT EDIT." > $@
	echo "// See the Makefile for details." >> $@
	cat test/test_startup.js.top >> $@
	cat test/extracted_startup_code >> $@
	cat test/test_startup.js.bottom >> $@

test-prep: test/test_startup.js

test-filtering:
	# Ensure no tests are disabled.
	./bin/test-filtering

test-debug: build-debug test-prep
	./test-server.sh debug

test-prod: build-prod test-prep
	./test-server.sh prod

test-server: build-debug test-prep
	./test-server.sh debug true

test-prod-server: build-prod test-prep
	./test-server.sh prod true

test-misc:
	PYTHONPATH=lib virtualenv/bin/python test/test_websocketreplay.py
	PYTHONPATH=lib virtualenv/bin/python test/test_browser_errors.py
	PYTHONPATH=lib virtualenv/bin/python \
	    test/test_deploy_charm_for_testing.py
	PYTHONPATH=bin virtualenv/bin/python test/test_http_server.py

test-browser: build-prod build-debug
	# Use the debug config but the prod server in hopes that the slow CI
	# server will be fast enough to run tests.
	cp build-debug/juju-ui/assets/config.js build-prod/juju-ui/assets/config.js
	# Start the web server we will be testing against.
	(cd build-prod && \
	    python ../bin/http_server.py 8888 2> /dev/null & \
	    echo $$!>$(TEST_SERVER_PID))
	# Start Xvfb as a background process, capturing its PID.
	$(eval xvfb_pid := $(shell Xvfb :34 2> /dev/null & echo $$!))
	# Run the tests inside the virtual frame buffer.  If any tests fail a
	# marker file is created.
	rm -rf $(BROWSER_TEST_FAILED_FILE)
	DISPLAY=:34 virtualenv/bin/python test/test_browser.py || \
	    touch $(BROWSER_TEST_FAILED_FILE)
	# Stop the background processes.
	kill $(xvfb_pid)
	kill `cat $(TEST_SERVER_PID)`
	rm $(TEST_SERVER_PID)
	# If the test failed, tell make.
	! rm $(BROWSER_TEST_FAILED_FILE) 2> /dev/null

test:
	@echo "Deprecated. Please run either 'make test-prod' or 'make"
	@echo "test-debug', to test the production or debug environments"
	@echo "respectively.  Run 'make help' to list the main available "
	@echo "targets."

server:
	@echo "Deprecated. Please run either 'make prod' or 'make debug',"
	@echo "to start the production or debug environments respectively."
	@echo "Run 'make help' to list the main available targets."

# devel is used during the development process.
devel: build-devel
	@echo "Running the development environment from node.js ."
	@echo "Customize config.js to modify server settings."
	node server.js

# debug is for deployments of unaggregated and uncompressed code.
debug: build-debug
	@echo "Running the debug environment from a SimpleHTTPServer"
	@echo "To run the development environment, including automatically"
	@echo "rebuilding the generated files on changes, run 'make devel'."
	(cd build-debug && python ../bin/http_server.py 8888)

# prod is for deployment of aggregated and minimized code.
prod: build-prod
	@echo "Running the production environment from a SimpleHTTPServer"
	(cd build-prod && python ../bin/http_server.py 8888)

clean:
	rm -rf build-shared build-debug build-prod
	find app/assets/javascripts/ -type l | xargs rm -rf
	rm -f test/test_startup.js

clean-deps:
	rm -rf node_modules virtualenv

clean-docs:
	make -C docs clean
	rm -rf yuidoc

clean-all: clean clean-deps clean-docs

build: build-prod build-debug build-devel

build-shared: build-shared/juju-ui/assets $(NODE_TARGETS) spritegen \
	  $(NON_SPRITE_IMAGES) $(BUILD_FILES) build-shared/juju-ui/version.js

# build-devel is phony. build-shared, build-debug, and build-common are real.
build-devel: build-shared

build-debug: build-shared | $(LINK_DEBUG_FILES)

build-prod: build-shared | $(LINK_PROD_FILES)

build-shared/juju-ui/assets:
	mkdir -p build-shared/juju-ui/assets

# This really depends on CHANGES.yaml, the git sha changing, and the build
# /juju-ui directory existing.  We are vaguely trying to approximate the second
# one by connecting it to our pertinent versioned files.  The first target
# creates the directory, and directories are a bit tricky with Makefiles so we
# are OK with that.  The ULTIMATE_VERSION is used here because we always want
# the version.js file to reflect the top-most entry in the CHANGES.yaml file,
# regardless of whether we are doing a "Stable" or "Development" release.
build-shared/juju-ui/version.js: build-shared/juju-ui/assets CHANGES.yaml $(JSFILES) $(TEMPLATE_TARGETS) \
		$(SPRITE_SOURCE_FILES)
	echo "var jujuGuiVersionInfo=['$(ULTIMATE_VERSION)', '$(SHA)'];" \
	    > build-shared/juju-ui/version.js

upload_release.py:
	bzr cat lp:launchpadlib/contrib/upload_release_tarball.py \
	    > upload_release.py

$(RELEASE_FILE): build test-prep
	@echo "$(BRANCH_IS_CLEAN)"
ifdef BRANCH_IS_GOOD
	mkdir -p releases
	# When creating the tarball, ensure all symbolic links are followed.
	tar -c --auto-compress --exclude-vcs --exclude releases \
	    --exclude node_modules --exclude virtualenv --exclude bin \
	    --exclude archives --exclude build-shared \
	    --dereference --transform "s|^|$(RELEASE_NAME)/|" -f $(RELEASE_FILE) *
	@echo "Release was created in $(RELEASE_FILE)."
else
	@echo "**************************************************************"
	@echo "*********************** RELEASE FAILED ***********************"
	@echo "**************************************************************"
	@echo
	@echo "To make a release, you must either be in the master branch of"
	@echo "juju/juju-gui without uncommitted/unpushed changes, or you must"
	@echo "override one of the pertinent variable names to force a "
	@echo "release."
	@echo
	@echo "See the README for more information."
	@echo
	@false
endif

distfile: $(RELEASE_FILE)

$(RELEASE_SIGNATURE): $(RELEASE_FILE)
	gpg --armor --sign --detach-sig $(RELEASE_FILE)

dist: $(RELEASE_FILE) $(RELEASE_SIGNATURE) upload_release.py
	python2 upload_release.py juju-gui $(SERIES) $(RELEASE_VERSION) \
	    $(RELEASE_FILE) $(LAUNCHPAD_API_ROOT)

$(NPM_SIGNATURE): $(NPM_CACHE_FILE)
	gpg --armor --sign --detach-sig $(NPM_CACHE_FILE)

npm-cache-file: $(NPM_CACHE_FILE)

$(NPM_CACHE_FILE):
	# We store the NPM cache file in the "releases" directory.  It is kind
	# of like a release.
	mkdir -p releases
	# Remove any old cache or generated cache archives.
	rm -f releases/npm-cache-*.tgz*
	rm -rf temp-npm-cache
	# We have to get rid of all installed NPM packages so they will be
	# reinstalled into the (presently) empty cache.
	$(MAKE) clean-all
	# Install all the NPM packages, overriding the NPM cache.
	$(MAKE) npm_config_cache=temp-npm-cache install-npm-packages
	(cd temp-npm-cache && tar czvf $(NPM_CACHE_FILE) .)
	rm -rf temp-npm-cache

npm-cache: $(NPM_CACHE_FILE) $(NPM_SIGNATURE)
ifdef BRANCH_IS_GOOD
	python2 upload_release.py juju-gui npm-cache $(NPM_CACHE_VERSION) \
	    $(NPM_CACHE_FILE) $(LAUNCHPAD_API_ROOT)
else
	@echo "**************************************************************"
	@echo "**************** NPM CACHE GENERATION FAILED *****************"
	@echo "**************************************************************"
	@echo
	@echo "To create and upload an NPM cache file to Launchpad you must"
	@echo "be in the master branch of juju/juju-gui without "
	@echo "uncommitted/unpushed changes, or you must override one of the "
	@echo "pertinent variable names to force an upload."
	@echo
	@echo "See docs/process.rst for more information"
	@echo
	@false
endif

# targets are alphabetically sorted, they like it that way :-)
.PHONY: beautify build build-files build-devel clean clean-all clean-deps \
	clean-docs code-doc debug devel docs dist gjslint help \
	install-npm-packages jshint lint lint-yuidoc main-doc npm-cache \
	npm-cache-file prep prod recess server spritegen test test-debug \
	test-misc test-prep test-prod undocumented view-code-doc view-docs \
	view-main-doc

.DEFAULT_GOAL := all
