# Makefile debugging hack: uncomment the two lines below and make will tell you
# more about what is happening.  The output generated is of the form
# "FILE:LINE [TARGET (DEPENDENCIES) (NEWER)]" where DEPENDENCIES are all the
# things TARGET depends on and NEWER are all the files that are newer than
# TARGET.  DEPENDENCIES will be colored green and NEWER will be blue.
#
#OLD_SHELL := $(SHELL)
#SHELL = $(warning [$@ [32m($^) [34m($?)[m ])$(OLD_SHELL)

# Build a target for JavaScript files.  The find command exclused directories
# as needed through the -prune directive, and the grep command removes
# individual unwanted JavaScript and JSON files from the list.
# find(1) is used here to build a list of JavaScript targets rather than bzr
# due to the speed of network access being unpredictable (bzr accesses the
# parent branch, which may be lp:juju-gui, for any command relating to the
# branch or checkout).  Additionally, working with the release or an export,
# a developer may not be working in a bzr repository.
JSFILES=$(shell find . -wholename './node_modules*' -prune \
	-o -wholename './build*' -prune \
	-o -wholename './docs*' -prune \
	-o -wholename './test/assets*' -prune \
	-o -wholename './yuidoc*' -prune \
	-o \( \
		-name '*.js' \
		-o -name '*.json' \
		-o -name 'generateTemplates' \
	\) -print \
	| sort | sed -e 's/^\.\///' \
	| grep -Ev -e '^manifest\.json$$' \
		-e '^app/assets/javascripts/d3\.v2(\.min)?\.js$$' \
		-e '^app/assets/javascripts/reconnecting-websocket\.js$$' \
		-e '^app/assets/javascripts/gallery-.*\.js$$' \
		-e '^server.js$$')
THIRD_PARTY_JS=app/assets/javascripts/reconnecting-websocket.js
NODE_TARGETS=node_modules/chai node_modules/cryptojs node_modules/d3 \
	node_modules/expect.js node_modules/express node_modules/graceful-fs \
	node_modules/grunt node_modules/jshint node_modules/less \
	node_modules/minimatch node_modules/mocha node_modules/node-markdown \
	node_modules/node-minify node_modules/node-spritesheet \
	node_modules/rimraf node_modules/should node_modules/yui \
	node_modules/yuidocjs
EXPECTED_NODE_TARGETS=$(shell echo "$(NODE_TARGETS)" | tr ' ' '\n' | sort \
	| tr '\n' ' ')

### Release-specific variables - see docs/process.rst for an overview. ###
# Provide the ability to build a release package without using bzr, for
# lightweight checkouts.
ifdef NO_BZR
BZR_REVNO=0
BRANCH_IS_GOOD=1
else
BZR_REVNO=$(shell bzr revno)
endif
# Figure out the two most recent version numbers.
ULTIMATE_VERSION=$(shell grep '^-' CHANGES.yaml | head -n 1 | sed 's/[ :-]//g')
PENULTIMATE_VERSION=$(shell grep '^-' CHANGES.yaml | head -n 2 | tail -n 1 \
    | sed 's/[ :-]//g')
# If the user specified (via setting an environment variable on the command
# line) that this is a final (non-development) release, set the version number
# and series appropriately.
ifdef FINAL
# If this is a FINAL (non-development) release, then the most recent version
# number should not be "unreleased".
ifeq ($(ULTIMATE_VERSION), unreleased)
    $(error FINAL releases must have a most-recent version number other than \
	"unreleased" in CHANGES.yaml)
endif
RELEASE_VERSION=$(ULTIMATE_VERSION)
SERIES=stable
else
# If this is development (non-FINAL) release, then the most recent version
# number must be "unreleased".
ifneq ($(ULTIMATE_VERSION), unreleased)
    $(error non-FINAL releases must have a most-recent version number of \
	"unreleased" in CHANGES.yaml)
endif
RELEASE_VERSION=$(PENULTIMATE_VERSION)+build.$(BZR_REVNO)
SERIES=trunk
endif
# If we are doing a production release (as opposed to a trial-run release) we
# use the "real" Launchpad site, if not we use the Launchpad staging site.
ifndef PROD
LAUNCHPAD_API_ROOT=staging
endif
RELEASE_NAME=juju-gui-$(RELEASE_VERSION)
RELEASE_FILE=releases/$(RELEASE_NAME).tgz
RELEASE_SIGNATURE=releases/$(RELEASE_NAME).asc
# Is the branch being released a branch of trunk?
ifndef BRANCH_IS_GOOD
ifndef IS_TRUNK_BRANCH
IS_TRUNK_BRANCH=$(shell bzr info | grep \
	'parent branch: bzr+ssh://bazaar.launchpad.net/+branch/juju-gui/' \
	> /dev/null && echo 1)
endif
# Does the branch on disk have uncomitted/unpushed changes?
ifndef BRANCH_IS_CLEAN
BRANCH_IS_CLEAN=$(shell [ -z "`bzr status`" ] && bzr missing --this && echo 1)
endif
# Is it safe to do a release of the branch?  For trial-run releases you can
# override this check on the command line by setting the BRANCH_IS_GOOD
# environment variable.
ifneq ($(strip $(IS_TRUNK_BRANCH)),)
ifneq ($(strip $(BRANCH_IS_CLEAN)),)
BRANCH_IS_GOOD=1
endif
endif
endif
### End of release-specific variables ###
TEMPLATE_TARGETS=$(shell find app/templates -type f ! -name '.*' ! -name '*.swp' ! -name '*~' ! -name '\#*' -print)

SPRITE_SOURCE_FILES=$(shell find app/assets/images -type f ! -name '.*' ! -name '*.swp' ! -name '*~' ! -name '\#*' -print)
SPRITE_GENERATED_FILES=build-shared/juju-ui/assets/sprite.css \
	build-shared/juju-ui/assets/sprite.png
BUILD_FILES=build-shared/juju-ui/assets/app.js \
	build-shared/juju-ui/assets/all-yui.js \
	build-shared/juju-ui/assets/combined-css/all-static.css
JAVASCRIPT_LIBRARIES=app/assets/javascripts/d3.v2.js \
	app/assets/javascripts/d3.v2.min.js app/assets/javascripts/yui
DATE=$(shell date -u)
APPCACHE=build-shared/juju-ui/assets/manifest.appcache

# Some environments, notably sudo, do not populate the default PWD environment
# variable, which is used to set $(PWD).  Worse, in some situations, such as
# using make -C [directory], $(PWD) is set to a value we don't want: the
# directory in which make was invoked, rather than the directory of this file.
# Therefore, we want to run the shell's pwd to get this Makefile's directory.
# As an optimization, we stash this value in the local PWD variable.
PWD=$(shell pwd)

all: build
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
	@echo "test-debug: run tests in the browser from the debug environment"
	@echo "test-prod: run tests in the browser from the production environment"
	@echo "           FIXME: currently yielding 78 failures"
	@echo "test: same as the test-debug target"
	@echo "prep: beautify and lint the source"
	@echo "docs: generate Sphinx and YUIdoc documentation"
	@echo "help: this description"
	@echo "Other, less common targets are available, see Makefile."

build-shared/juju-ui/templates.js: $(TEMPLATE_TARGETS) bin/generateTemplates
	mkdir -p build-shared/juju-ui/assets
	bin/generateTemplates

yuidoc/index.html: node_modules/yuidocjs $(JSFILES)
	node_modules/.bin/yuidoc -o yuidoc -x assets app

sphinx:
	make -C docs html

yuidoc: yuidoc/index.html

docs: sphinx yuidoc

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

$(JAVASCRIPT_LIBRARIES): | node_modules/yui node_modules/d3
	ln -sf "$(PWD)/node_modules/yui" app/assets/javascripts/yui
	ln -sf "$(PWD)/node_modules/d3/d3.v2.js" app/assets/javascripts/d3.v2.js
	ln -sf "$(PWD)/node_modules/d3/d3.v2.min.js" \
		app/assets/javascripts/d3.v2.min.js

gjslint: virtualenv/bin/gjslint
	virtualenv/bin/gjslint --strict --nojsdoc --jslint_error=all \
	    --custom_jsdoc_tags module,main,class,method,event,property,attribute,submodule,namespace,extends,config,constructor,static,final,readOnly,writeOnce,optional,required,param,return,for,type,private,protected,requires,default,uses,example,chainable,deprecated,since,async,beta,bubbles,extension,extensionfor,extension_for \
	    $(JSFILES)

jshint: node_modules/jshint
	node_modules/jshint/bin/hint $(JSFILES)

undocumented:
	bin/lint-yuidoc --generate-undocumented > undocumented

yuidoc-lint: $(JSFILES)
	bin/lint-yuidoc

lint: gjslint jshint yuidoc-lint

virtualenv/bin/gjslint virtualenv/bin/fixjsstyle:
	virtualenv virtualenv
	virtualenv/bin/easy_install archives/closure_linter-latest.tar.gz

beautify: virtualenv/bin/fixjsstyle
	virtualenv/bin/fixjsstyle --strict --nojsdoc --jslint_error=all $(JSFILES)

spritegen: $(SPRITE_GENERATED_FILES)

$(BUILD_FILES): $(JSFILES) $(THIRD_PARTY_JS) build-shared/juju-ui/templates.js \
		bin/merge-files lib/merge-files.js | $(JAVASCRIPT_LIBRARIES)
	rm -f $(BUILD_FILES)
	mkdir -p build-shared/juju-ui/assets/combined-css/
	bin/merge-files

build-files: $(BUILD_FILES)

# This leaves out all of the individual YUI assets, because we can't have them
# the first time the Makefile is run in a clean tree.
shared-link-files-list=build-$(1)/juju-ui/assets/combined-css \
	build-$(1)/favicon.ico build-$(1)/index.html \
	build-$(1)/juju-ui/assets/config.js build-$(1)/juju-ui/assets/modules.js \
	build-$(1)/juju-ui/assets/images build-$(1)/juju-ui/assets/svgs \
	build-$(1)/juju-ui/assets/app.js build-$(1)/juju-ui/version.js \
	build-$(1)/juju-ui/assets/manifest.appcache \
	build-$(1)/juju-ui/assets/combined-css/all-static.css \
	build-$(1)/juju-ui/assets/juju-gui.css \
	build-$(1)/juju-ui/assets/sprite.css \
	build-$(1)/juju-ui/assets/sprite.png \
	build-$(1)/juju-ui/assets/combined-css/rail-x.png \
	build-$(1)/juju-ui/assets/all-yui.js

LINK_DEBUG_FILES=$(call shared-link-files-list,debug) \
	build-debug/juju-ui/app.js build-debug/juju-ui/models \
	build-debug/juju-ui/store build-debug/juju-ui/views \
	build-debug/juju-ui/widgets build-debug/juju-ui/assets/javascripts \
	build-debug/juju-ui/templates.js

LINK_PROD_FILES=$(call shared-link-files-list,prod)

# These are shared instructions between link-debug-files and link-prod-files.
define link-files
	mkdir -p build-$(1)/juju-ui/assets/combined-css
	ln -sf "$(PWD)/app/favicon.ico" build-$(1)/
	ln -sf "$(PWD)/app/index.html" build-$(1)/
	ln -sf "$(PWD)/app/config-$(1).js" build-$(1)/juju-ui/assets/config.js
	ln -sf "$(PWD)/app/modules-$(1).js" build-$(1)/juju-ui/assets/modules.js
	ln -sf "$(PWD)/app/assets/images" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/app/assets/svgs" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/version.js" build-$(1)/juju-ui/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/app.js" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/manifest.appcache" \
		build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/combined-css/all-static.css" \
		build-$(1)/juju-ui/assets/combined-css/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/juju-gui.css" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/sprite.css" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/assets/sprite.png" build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/node_modules/yui/assets/skins/sam/rail-x.png" \
		build-$(1)/juju-ui/assets/combined-css/rail-x.png
	ln -sf "$(PWD)/node_modules/yui/event-simulate/event-simulate.js" \
		build-$(1)/juju-ui/assets/
	ln -sf "$(PWD)/node_modules/yui/node-event-simulate/node-event-simulate.js" \
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
	ln -sf "$(PWD)/app/models" build-debug/juju-ui/
	ln -sf "$(PWD)/app/store" build-debug/juju-ui/
	ln -sf "$(PWD)/app/views" build-debug/juju-ui/
	ln -sf "$(PWD)/app/widgets" build-debug/juju-ui/
	ln -sf "$(PWD)/app/assets/javascripts/yui/yui/yui-debug.js" \
		build-debug/juju-ui/assets/all-yui.js
	ln -sf "$(PWD)/app/assets/javascripts" build-debug/juju-ui/assets/
	ln -sf "$(PWD)/build-shared/juju-ui/templates.js" build-debug/juju-ui/

$(LINK_PROD_FILES):
	$(call link-files,prod)
	ln -sf "$(PWD)/build-shared/juju-ui/assets/all-yui.js" build-prod/juju-ui/assets/

prep: beautify lint

test-debug: build-debug
	./test-server.sh debug

test-prod: build-prod
	./test-server.sh prod

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
	cd build-debug && python -m SimpleHTTPServer 8888

# prod is for deployment of aggregated and minimized code.
prod: build-prod
	@echo "Running the production environment from a SimpleHTTPServer"
	cd build-prod && python -m SimpleHTTPServer 8888

clean:
	rm -rf build-shared build-debug build-prod
	find app/assets/javascripts/ -type l | xargs rm -rf

clean-deps:
	rm -rf node_modules virtualenv

clean-docs:
	make -C docs clean
	rm -rf yuidoc

clean-all: clean clean-deps clean-docs

build: build-prod build-debug build-devel

build-shared: $(APPCACHE) $(NODE_TARGETS) spritegen \
	  $(BUILD_FILES) build-shared/juju-ui/version.js

# build-devel is phony. build-shared, build-debug, and build-common are real.
build-devel: build-shared

build-debug: build-shared | $(LINK_DEBUG_FILES)

build-prod: build-shared | $(LINK_PROD_FILES)

$(APPCACHE): manifest.appcache.in
	mkdir -p build-shared/juju-ui/assets
	cp manifest.appcache.in $(APPCACHE)
	sed -re 's/^\# TIMESTAMP .+$$/\# TIMESTAMP $(DATE)/' -i $(APPCACHE)

# This really depends on CHANGES.yaml, the bzr revno changing, and the build
# /juju-ui directory existing.  We are vaguely trying to approximate the second
# one by connecting it to our pertinent versioned files.  The appcache target
# creates the third, and directories are a bit tricky with Makefiles so we are
# OK with that.
build-shared/juju-ui/version.js: $(APPCACHE) CHANGES.yaml $(JSFILES) $(TEMPLATE_TARGETS) \
		$(SPRITE_SOURCE_FILES)
	echo "var jujuGuiVersionInfo=['$(RELEASE_VERSION)', '$(BZR_REVNO)'];" \
	    > build-shared/juju-ui/version.js

upload_release.py:
	bzr cat lp:launchpadlib/contrib/upload_release_tarball.py \
	    > upload_release.py

$(RELEASE_FILE): build
	@echo "$(BRANCH_IS_CLEAN)"
ifdef BRANCH_IS_GOOD
	mkdir -p releases
	# When creating the tarball, ensure all symbolic links are followed.
	tar -c --auto-compress --exclude-vcs --exclude releases \
	    --dereference --transform "s|^|$(RELEASE_NAME)/|" -f $(RELEASE_FILE) *
	@echo "Release was created in $(RELEASE_FILE)."
else
	@echo "**************************************************************"
	@echo "*********************** RELEASE FAILED ***********************"
	@echo "**************************************************************"
	@echo
	@echo "To make a release, you must either be in a branch of"
	@echo "lp:juju-gui without uncommitted/unpushed changes, or you must"
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
ifndef NO_BZR
	python2 upload_release.py juju-gui $(SERIES) $(RELEASE_VERSION) \
	    $(RELEASE_FILE) $(LAUNCHPAD_API_ROOT)
else
	@echo "**************************************************************"
	@echo "*********************** DIST FAILED **************************"
	@echo "**************************************************************"
	@echo
	@echo "You may not make dist while the NO_BZR flag is defined."
	@echo "Please run this target without the NO_BZR flag defined if you"
	@echo "wish to upload a release."
	@echo
	@echo "See the README for more information"
	@echo
	@false
endif

appcache: $(APPCACHE)

# A target used only for forcibly updating the appcache.
appcache-touch:
	touch manifest.appcache.in

# This is the real target.  appcache-touch needs to be executed before
# appcache, and this provides the correct order.
appcache-force: appcache-touch $(APPCACHE)

# targets are alphabetically sorted, they like it that way :-)
.PHONY: appcache-force appcache-touch beautify \
	build-files build-devel clean clean-all \
	clean-deps clean-docs debug devel docs dist gjslint help \
	jshint lint prep prod server spritegen test test-debug test-prod \
	undocumented yuidoc yuidoc-lint all

.DEFAULT_GOAL := all
