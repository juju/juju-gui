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
    node_modules/grunt node_modules/jshint node_modules/js-yaml \
    node_modules/less node_modules/minimatch node_modules/mocha \
    node_modules/node-markdown node_modules/node-minify \
    node_modules/node-spritesheet node_modules/rimraf node_modules/should \
    node_modules/yui node_modules/yuidocjs
EXPECTED_NODE_TARGETS=$(shell echo "$(NODE_TARGETS)" | tr ' ' '\n' | sort \
    | tr '\n' ' ')

### Relase-specific variables - see docs/process.rst for an overview. ###
BZR_REVNO=$(shell bzr revno)
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
VERSION=$(ULTIMATE_VERSION)
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
ifndef BRANCH_IS_GOOD
ifneq ($(strip $(IS_TRUNK_BRANCH)),)
ifneq ($(strip $(BRANCH_IS_CLEAN)),)
BRANCH_IS_GOOD=1
endif
endif
endif
### End of relase-specific variables ###

TEMPLATE_TARGETS=$(shell bzr ls -k file app/templates)
SPRITE_SOURCE_FILES=$(shell bzr ls -R -k file app/assets/images)
BUILD_ASSETS_DIR=build/juju-ui/assets
SPRITE_GENERATED_FILES=$(BUILD_ASSETS_DIR)/sprite.css \
	$(BUILD_ASSETS_DIR)/sprite.png
PRODUCTION_FILES=$(BUILD_ASSETS_DIR)/modules.js \
	$(BUILD_ASSETS_DIR)/config.js \
	$(BUILD_ASSETS_DIR)/app.js \
	$(BUILD_ASSETS_DIR)/all-yui.js \
	$(BUILD_ASSETS_DIR)/combined-css/all-static.css
DATE=$(shell date -u)
APPCACHE=$(BUILD_ASSETS_DIR)/manifest.appcache

all: build

build/juju-ui/templates.js: $(TEMPLATE_TARGETS) bin/generateTemplates
	mkdir -p "$(BUILD_ASSETS_DIR)"
	bin/generateTemplates

yuidoc/index.html: node_modules/yuidocjs $(JSFILES)
	node_modules/.bin/yuidoc -o yuidoc -x assets app

yuidoc: yuidoc/index.html

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
	ln -sf "$(PWD)/node_modules/yui" app/assets/javascripts/

node_modules/d3/d3.v2.js node_modules/d3/d3.v2.min.js: node_modules/d3

app/assets/javascripts/d3.v2.js: node_modules/d3/d3.v2.js
	ln -sf "$(PWD)/node_modules/d3/d3.v2.js" app/assets/javascripts/d3.v2.js

app/assets/javascripts/d3.v2.min.js: node_modules/d3/d3.v2.min.js
	ln -sf "$(PWD)/node_modules/d3/d3.v2.min.js" \
	    app/assets/javascripts/d3.v2.min.js

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

$(PRODUCTION_FILES): node_modules/yui node_modules/d3/d3.v2.min.js $(JSFILES) \
		bin/merge-files lib/merge-files.js \
		$(THIRD_PARTY_JS)
	rm -f $(PRODUCTION_FILES)
	mkdir -p "$(BUILD_ASSETS_DIR)/combined-css"
	bin/merge-files
	cp app/modules.js $(BUILD_ASSETS_DIR)/modules.js
	cp app/config.js $(BUILD_ASSETS_DIR)/config.js
	cp node_modules/yui/assets/skins/sam/rail-x.png \
	    "$(BUILD_ASSETS_DIR)/combined-css/rail-x.png"
	# Copy each YUI module's assets into the build directory where they
	# will be served.
	mkdir -p "$(BUILD_ASSETS_DIR)/combined-css"
	(cd node_modules/yui/ && \
	 cp -r --parents */assets "$(PWD)/$(BUILD_ASSETS_DIR)")

production-files: $(PRODUCTION_FILES)

prep: beautify lint

test: build
	./test-server.sh

debug: build
	@echo "Customize config.js to modify server settings"
	node server.js

server: build
	@echo "Running the application from a SimpleHTTPServer"
	cd build && python -m SimpleHTTPServer 8888

build-clean:
	rm -rf build

clean: build-clean
	rm -rf node_modules virtualenv releases
	rm -f upload_release.py
	make -C docs clean

build/index.html: app/index.html
	cp -f app/index.html build/

build/favicon.ico: app/favicon.ico
	cp -f app/favicon.ico build/

$(BUILD_ASSETS_DIR)/images: $(SPRITE_SOURCE_FILES)
	cp -rf app/assets/images $(BUILD_ASSETS_DIR)/images
	touch $@

$(BUILD_ASSETS_DIR)/svgs: $(shell bzr ls -R -k file app/assets/svgs)
	cp -rf app/assets/svgs $(BUILD_ASSETS_DIR)/svgs

build-images: build/favicon.ico $(BUILD_ASSETS_DIR)/images \
	$(BUILD_ASSETS_DIR)/svgs

# This really depends on CHANGES.yaml, the bzr revno changing, and the build
# /juju-ui directory existing.  We are vaguely trying to approximate the second
# one by connecting it to our pertinent versioned files.  The appcache target
# creates the third, and directories are a bit tricky with Makefiles so we are
# OK with that.
build/juju-ui/version.js: appcache CHANGES.yaml $(JSFILES) $(TEMPLATE_TARGETS) \
		$(SPRITE_SOURCE_FILES)
	echo "var jujuGuiVersionName='$(RELEASE_VERSION)';" \
	    > build/juju-ui/version.js

build: appcache $(NODE_TARGETS) javascript-libraries  \
	build/juju-ui/templates.js yuidoc spritegen build/juju-ui/version.js \
	production-files build/index.html build-images

$(APPCACHE): manifest.appcache.in
	mkdir -p "build/juju-ui/assets"
	cp manifest.appcache.in $(APPCACHE)
	sed -re 's/^\# TIMESTAMP .+$$/\# TIMESTAMP $(DATE)/' -i $(APPCACHE)

upload_release.py:
	bzr cat lp:launchpadlib/contrib/upload_release_tarball.py \
	    > upload_release.py

$(RELEASE_FILE): build
	@echo "$(BRANCH_IS_CLEAN)"
ifdef BRANCH_IS_GOOD
	mkdir -p releases
	tar c --auto-compress --exclude-vcs --exclude releases \
	    --transform "s|^|$(RELEASE_NAME)/|" -f $(RELEASE_FILE) *
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

$(RELEASE_SIGNATURE): $(RELEASE_FILE)
	gpg --armor --sign --detach-sig $(RELEASE_FILE)

dist: $(RELEASE_FILE) $(RELEASE_SIGNATURE) upload_release.py
	python2 upload_release.py juju-gui $(SERIES) $(RELEASE_VERSION) \
	    $(RELEASE_FILE) $(LAUNCHPAD_API_ROOT)

appcache: $(APPCACHE)

# A target used only for forcibly updating the appcache.
appcache-touch:
	touch manifest.appcache.in

# This is the real target.  appcache-touch needs to be executed before
# appcache, and this provides the correct order.
appcache-force: appcache-touch appcache

.PHONY: test lint beautify server clean build-images prep jshint gjslint \
	appcache appcache-touch appcache-force yuidoc spritegen yuidoc-lint \
	production-files javascript-libraries build-clean dist

.DEFAULT_GOAL := all
