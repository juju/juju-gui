<!DOCTYPE html>
<html>
<!-- !IE will be true for all non-IE browsers and IE10 since it does not
 recognize conditional flags. -->
<!--[if !IE]><!--><script>
if (/*@cc_on!@*/false) {
  // Only IE10 has cc_on as false.
  document.documentElement.className+=' ie10';
}
</script><!--<![endif]-->
<head>
    <title>Juju Admin</title>
    <!-- Disable backwards compatible mode for IE on an intranet.
         For an explanation see http://bit.ly/14VytlD
         Also note this must be the first <meta> to appear. -->
    <meta http-equiv="x-ua-compatible" content="IE=edge">
    <meta charset="utf-8">
<!-- The license statement comes after the charset declaration so that the
     charset is delivered within the first 1024 characters. -->
<!--
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
-->
    <meta name="viewport" content="width=device-width,initial-scale=1.0 maximum-scale=1.0, user-scalable=no">
    <meta name="description" content="">
    <meta name="author" content="Juju team">
    <!-- Make sure the config is loaded before other JS for use in the page
         below.
    -->
    <script src="${config_url}"></script>
    <script type="text/javascript">
    // Normally we get the fonts from the Google CDN.  If the config sets
    // "cachedFonts" to true, we use the local, cached fonts instead.  The CDN
    // is generally faster, but if a user is in a closed network, trying to
    // reach the CDN will slow the application down [1], and the cachedFonts
    // are the only thing that will work.
    // [1] https://bugs.launchpad.net/juju-gui/+bug/1274955
    (function() {
      var link  = document.createElement('link');
      link.rel  = 'stylesheet';
      link.type = 'text/css';
      if (juju_config.cachedFonts) {
        link.href = 'juju-ui/assets/fonts/fontface.css';
      } else {
        // If you change this, make sure you make a corresponding update to
        // the cached fonts (app/assets/fonts/*).  Read more details here:
        // https://bugs.launchpad.net/juju-gui/+bug/1274955/comments/4
        link.href = (
          'https://fonts.googleapis.com/css?family=' +
          'Ubuntu+Mono:400,700|' +
          'Ubuntu:300,400,500,300italic,400italic,500italic');
      }
      link.media = 'all';
      var head  = document.getElementsByTagName('head')[0];
      head.appendChild(link);
    })();
    </script>
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="stylesheet" href="${convoy_url}?app/assets/stylesheets/normalize.css&app/assets/stylesheets/prettify.css&app/assets/stylesheets/cssgrids-responsive-min.css&app/assets/javascripts/yui/app-transitions-css/app-transitions-css-min.css&app/assets/javascripts/yui/panel/assets/panel-core.css&app/assets/javascripts/yui/widget-base/assets/widget-base-core.css&app/assets/javascripts/yui/widget-stack/assets/widget-stack-core.css&app/assets/juju-gui.css&app/assets/sprites.css">

    <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <!-- Set up Google analytics async tracking. -->
    <script type="text/javascript">
      var _gaq = _gaq || [];
      window._gaq = _gaq;
      // Do not call _setAccount as we need to get the key from
      // the config file which is not yet available.
    </script>
  </head>

  <body>
      <!-- This <img> tag is here just to force early loading of the background
        image so it displays more quickly.  This makes a large improvement to
        the way the app looks while loading on a slow connection. -->
      <div id="full-screen-mask">
        <div id="browser-warning" class="centered-column"
            style="display:none;">
          <i class="sprite juju_logo" title="Juju GUI"></i>
          <div class="panel">
            <div class="header">
                  Your browser is not supported
            </div>
            <p>
              If you continue to use Juju with your current browser your
              experience may not be as good as we would like it to be.
            </p>
            <p>
              Please use the latest version of
              <a href="http://www.google.com/chrome">Chrome</a> to be fully
              supported.
            </p>
            <form onsubmit="return continueWithCurrentBrowser();">
              <input type="submit" value="Continue"/>
            </form>
          </div>
        </div>
        <div id="loading-message" class="centered-column">
          <i class="sprite juju_logo" title="Juju GUI"></i>
          <div class="panel">
            <div id="loading-message-text" class="header">
              Loading the Juju GUI
            </div>
            <div id="loading-spinner">
              <span class="spinner-loading"></span>
            </div>
          </div>
        </div>
      </div>

      <div id="onboarding"></div>
      <div id="charmbrowser-container"></div>
      <div id="deployer-bar"></div>
      <div id="deployment-container"></div>
      <div id="environment-header"></div>
      <div id="env-size-display-container"></div>
      <div id="inspector-container"></div>
      <div id="white-box-container"></div>
      <div id="machine-view-panel"></div>

      <div class="cookie-policy" style="display:none;">
        <div class="wrapper">
          <a href="" class="link-cta">Close</a>
          <p>
            We use cookies to improve your experience. By your continued use of
            this application you accept such use. To change your settings please
            <a href="http://www.ubuntu.com/privacy-policy#cookies">see our policy</a>
          </p>
        </div>
      </div>
      <div id="viewport">
        <header class="header-banner">
          <ul id="browser-nav" class="header-banner__list">
            <li id="nav-brand-env" class="header-banner__list-item">
              <a class="header-banner__link" href="/">
                <svg class="header-banner__logo" xmlns="http://www.w3.org/2000/svg" width="74.775" height="30.001" viewBox="397.783 432.95 74.775 30.001"><path fill="#DD4814" d="M412.783 432.95c-8.284 0-15 6.716-15 15s6.716 15 15 15 15-6.716 15-15-6.716-15-15-15z"/><path fill="#FFF" d="M405.503 457.225c-.127.128-.297.197-.477.197s-.35-.07-.48-.197c-.126-.128-.196-.297-.196-.478s.07-.35.197-.478c.127-.13.297-.2.478-.2s.35.07.478.198c.127.128.198.298.198.48s-.07.35-.197.477zM408.447 447.138c-.068-.217-.166-.395-.29-.53-.126-.133-.276-.233-.45-.298-.174-.064-.37-.097-.585-.097-.214 0-.41.032-.58.097-.17.063-.32.165-.444.3-.125.134-.222.31-.29.528-.07.218-.104.484-.104.793v6.86h-1.357v-6.98c0-.402.055-.777.162-1.113.107-.338.277-.636.503-.886.228-.25.517-.448.862-.586.344-.14.76-.208 1.237-.208.477 0 .896.07 1.247.207.35.14.644.336.87.588.228.25.4.548.51.887.112.336.168.71.168 1.113v1.084h-1.357v-.963c0-.306-.035-.573-.103-.792z"/><path fill="#FFF" d="M414.11 452.65c0 .402-.056.777-.167 1.113-.11.337-.283.635-.51.886s-.52.447-.872.586c-.35.138-.77.208-1.246.208s-.893-.07-1.237-.208c-.345-.14-.634-.336-.862-.587-.227-.252-.396-.55-.504-.887-.106-.337-.16-.712-.16-1.114v-2.43h1.356v2.31c0 .307.035.573.103.79.067.22.165.397.29.53.125.135.274.235.444.3.17.064.366.097.58.097.215 0 .413-.032.586-.098.173-.064.323-.165.448-.3s.223-.312.29-.53c.07-.217.104-.483.104-.79v-2.31h1.357v2.43zM412.757 448.23c0-.374.303-.677.675-.677.373 0 .676.303.676.676 0 .37-.303.675-.676.675s-.675-.304-.675-.676zM416.853 438.654c-.068-.216-.166-.395-.29-.528-.126-.135-.276-.236-.45-.3-.173-.064-.37-.097-.584-.097-.215 0-.41.03-.58.096-.17.064-.32.165-.445.3-.125.134-.223.312-.29.528-.068.218-.103.484-.103.793v6.86h-1.357v-6.98c0-.402.055-.777.162-1.114.108-.337.278-.636.505-.886.227-.25.517-.448.86-.587.346-.138.76-.208 1.238-.208s.896.07 1.247.208c.352.14.645.336.872.587.226.25.397.548.51.886.11.337.166.712.166 1.114v1.083h-1.357v-.963c-.004-.308-.04-.574-.107-.793z"/><path fill="#FFF" d="M422.516 444.165c0 .403-.057.778-.167 1.114-.112.336-.283.635-.51.885-.228.252-.52.448-.872.587s-.77.208-1.247.208c-.476 0-.892-.07-1.236-.208-.345-.14-.634-.335-.86-.587-.228-.25-.397-.55-.506-.886-.107-.338-.162-.713-.162-1.115v-2.43h1.357v2.31c0 .308.035.575.103.793.068.216.166.395.29.528.126.135.275.236.445.3.17.064.366.097.58.097s.413-.032.586-.097c.173-.063.324-.165.45-.3.124-.134.222-.312.29-.528.068-.218.103-.485.103-.792v-3.31h1.356v3.43z"/><g fill="#DD4814"><path d="M437.207 455.19c-.17 0-.38-.02-.633-.067s-.44-.1-.563-.16l.208-1.22c.107.03.253.06.438.093.184.03.36.045.528.045.905 0 1.507-.25 1.806-.757.3-.508.448-1.266.448-2.277V439h1.495v11.775c0 1.504-.283 2.615-.85 3.336s-1.527 1.08-2.876 1.08zM454.02 450.476c-.444.123-1.042.262-1.793.414-.752.154-1.672.23-2.76.23-.89 0-1.634-.13-2.23-.39-.6-.263-1.082-.63-1.45-1.105-.368-.477-.633-1.05-.794-1.727-.16-.674-.24-1.418-.24-2.23V439h1.494v6.188c0 .844.062 1.557.184 2.14.124.58.323 1.054.6 1.413.275.362.632.622 1.07.784.436.16.97.24 1.598.24.705 0 1.318-.037 1.84-.115.52-.077.85-.146.99-.208V439h1.494v11.476zM455.745 455.19c-.17 0-.38-.02-.633-.067s-.44-.1-.563-.16l.206-1.22c.107.03.253.06.438.093.184.03.36.045.528.045.905 0 1.507-.25 1.806-.757.3-.508.448-1.266.448-2.277V439h1.495v11.775c0 1.504-.282 2.615-.85 3.336s-1.526 1.08-2.875 1.08zM472.558 450.476c-.445.123-1.043.262-1.794.414-.752.154-1.672.23-2.76.23-.89 0-1.634-.13-2.23-.39-.6-.263-1.082-.63-1.45-1.105-.368-.477-.633-1.05-.794-1.727-.16-.674-.24-1.418-.24-2.23V439h1.494v6.188c0 .844.062 1.557.184 2.14.123.58.322 1.054.6 1.413.274.362.63.622 1.068.784.437.16.97.24 1.6.24.704 0 1.317-.037 1.84-.115.52-.077.85-.146.988-.208V439h1.495v11.476z"/></g></svg>
              </a>
            </li>
            <li id="user-name" class="header-banner__list-item">
              <a class="header-banner__link--breadcrumb" href="#">
                anonymous
              </a>
            </li>
            <li class="header-banner__list-item">
              <span id="environment-name" class="environment-name" draggable="true"></span>
              <div id="environment-switcher"></div>
            </li>
          </ul>
          <ul class="header-banner__list--right">
            <li class="user-dropdown header-banner__list-item">
              <span id="user-dropdown hidden"></span>
            </li>
            <li id="maas-server" style="display:none" class="header-banner__list-item">
              <a href="" target="_blank" class="header-banner__link">MAAS UI</a>
            </li>
            <li id="get-started" class="hidden header-banner__list-item">
              <a href="http://jujucharms.com" class="header-banner__link" target="_blank">
                Get started
              </a>
            </li>
            <li class="header-banner__list-item hidden">
              <a href="/login/" class="header-banner__link">
                Sign in
              </a>
            </li>
            <li id="header-search-container"
                class="header-banner__list-item header-banner__list-item--no-padding"></li>
          </ul>
        </header>
        <div id="content">
            <div id="shortcut-help" style="display:none"></div>
            <div id="subapp-browser"></div>
            <div id="main">
            </div> <!-- /container -->
        </div>
    </div>
    <script id="app-startup">
      // Global to store all of the shared application data.
      var juju = {
        // Collection of components.
        components: {},
        utils: {}
      };

      var flags = {}; // Declare an empty set of feature flags.

      getDocument = function() {
        return document;
      };

      setLoadingMessageText = function(newText) {
        getDocument()
          .getElementById('loading-message-text').innerHTML = newText;
      };

      isBrowserSupported = function(agent) {
        // Latest Chrome, Firefox, IE10 are supported
        return (/Chrome|Firefox|Safari|MSIE\ 10/.test(agent));
      };

      displayBrowserWarning = function() {
        getDocument()
          .getElementById('browser-warning').style.display = 'block';
      };

      hideBrowserWarning = function() {
        getDocument()
          .getElementById('browser-warning').style.display = 'none';
      };

      displayLoadingMessage = function() {
        getDocument()
          .getElementById('loading-message').style.display = 'block';
      };

      hideLoadingMessage = function() {
        getDocument()
          .getElementById('loading-message').style.display = 'none';
      };

      hideLoginButton = function(userDropdown, hideLoginButton) {
        if (hideLoginButton) {
          userDropdown.classList.add('hidden');
        } else {
          userDropdown.classList.remove('hidden');
        }
      };

      continueWithCurrentBrowser = function() {
        hideBrowserWarning();
        displayLoadingMessage();
        startTheApp();
        // Signal that we want to stop event propagation.
        return false;
      };

      startTheApp = function() {
        // This function will be redefined when all the app's JavaScript is
        // loaded.  We want to keep trying until that happens.

        // Tell jslint that we really do want to evaluate a string:
        /*jslint evil: true */
        window.setTimeout('startTheApp()', 100);
      };

      go = function(agent) {
        if (isBrowserSupported(agent)) {
          startTheApp();
        } else {
          hideLoadingMessage();
          displayBrowserWarning();
        }
      };

      /**
        Feature flags support.

        :WARNING: this is stuck on the window object to make sure it's
        available everywhere. This means mocking this out in tests can be
        dangerous and evil. Be careful.

        This allows us to use the :flags: NS to set either boolean or string
        feature flags to control various features in the app.  A simple /<flag>/
        will set that flag as true in the global flags variable.  A
        /<flag>=<val>/ will set that flag to that value in the global flags
        variable. An example usage would be to turn on the ability to drag_and_
        drop a feature by wrapping that feature code in something like:

          if (flags.gui_featuredrag_enable) { ... }

        From the Launchpad feature flags documentation:

        > As a general rule, each switch should be checked only once or only a
        > few time in the codebase. We don't want to disable the same thing in
        > the ui, the model, and the database.
        >
        > The name looks like dotted python identifiers, with the form
        > APP_FEATURE_EFFECT. The value is a Unicode string.

        A shortened version of key can be used if they follow this pattern:

        - The feature flag applies to the gui.
        - The presence of the flag indicates Boolean enablement
        - The (default) absence of the flag indicates the feature will not be
          available.

        If those conditions are met then you may simply use the descriptive
        name of the feature, taking care it uniquely defines the feature. An
        example is, rather than specifying gui_dndexport_enable you can specify
        dndexport as a flag.

        @method featureFlags
        @param {object} url The url to parse for flags.
        @param {object} configFlags An optional config object to merge with.
      */
      window.featureFlags = function(url, configFlags) {
        var flags = configFlags || {},
            flagsRegex = new RegExp(/:flags:\/([^:])*/g);

        var found = url.match(flagsRegex);

        // The matches come back as an array.
        if (found && found.length) {
          found = found[0];
        }

        // Check if the :flags: namespace is in the url.
        if (found) {
          // Make sure we trim a trailing / to prevent extra data in the split.
          var urlFlags = found.replace(/\/+$/, '').split('/');

          // Remove the first :flags: match from the split results.
          urlFlags = urlFlags.slice(1);

          urlFlags.forEach(function(flag) {
            var key = flag;
            var value = true;

            // Allow setting a specific value other than true.
            var equals = flag.indexOf('=');
            if (equals !== -1) {
              key = flag.slice(0, equals);
              // Add one to the index to make sure we drop the first "equals"
              // from the string.
              value = flag.slice((equals + 1));
            }

            flags[key] = value;
          });
        }

        return flags;
      };
      // The browser driver does not accept anything but `true` as a value
      // to indicate that it's available so we use this as a flag to indicate
      // that the scripts are loaded and that the above methods are available.
      applicationLoaded = true;
    </script>
    <script>
      // This code is here instead of in the "app-startup" script tag above
      // because we extract that JS in order to test it.  This bit here is just
      // to bootstrap the app when actually loaded into a browser.
      go(navigator.userAgent);
    </script>
    <!--
      Load the (potentially slow to download) core of the app.  We do this here
      because we want the browser warning to execute before spending the time
      to download an app the user might not be able to use anyway.
    -->

    <!--
      d3 must be loaded with the initial yui assets. if loaded by the combo loader
      it will be combined with our app code and be interpreted under global
      'use strict' and d3 doesn't work under strict.
    -->
    % if raw:
    <script src="${convoy_url}?app/assets/javascripts/react-with-addons.js&app/assets/javascripts/classnames.js&app/assets/javascripts/react-onclickoutside.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/handlebars.runtime.js&app/components/templates.js&app/components/helpers.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/yui/yui/yui.js&app/assets/javascripts/yui/loader/loader.js&app/assets/javascripts/d3.js"></script>
    <script src="${convoy_url}?modules.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/gallery-markdown.js"></script>
    <script src="${convoy_url}?app/store/env/bakery.js&app/assets/javascripts/jujulib/juju.js"></script>
    % else:
    <script src="${convoy_url}?app/assets/javascripts/react-with-addons.min.js&app/assets/javascripts/classnames-min.js&app/assets/javascripts/react-onclickoutside-min.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/handlebars.runtime.min.js&app/components/templates-min.js&app/components/helpers-min.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/yui/yui/yui-min.js&app/assets/javascripts/yui/loader/loader-min.js&app/assets/javascripts/d3-min.js"></script>
    <script src="${convoy_url}?modules-min.js"></script>
    <script src="${convoy_url}?app/store/env/bakery-min.js&app/assets/javascripts/jujulib/juju-min.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/gallery-markdown-min.js"></script>
    % endif

    <script>
      // Now that all of the above JS is loaded we can define the real start
      // function which will be picked up by the setTimeout, and the app will
      // start.
      startTheApp = function() {
        setLoadingMessageText('Connecting to the Juju environment');

        window.flags = featureFlags(
            window.location.href,
            window.juju_config.flags || {}
        );

        // Add the current flags to the body so they can be used to flag CSS.
        for (var flag in window.flags) {
          if (flag) {
            document.getElementsByTagName(
                'body')[0].className += ' flag-' + flag;
          }
        }

        // This config property is passed in to allow for testing.
        var userDropdown = getDocument().getElementsByClassName(
            'user-dropdown')[0];
        hideLoginButton(userDropdown, juju_config.hideLoginButton);

        var GlobalConfig = {
          combine: true,
          base: '${convoy_url}?/app/assets/javascripts/yui/',
          comboBase: '${convoy_url}?',
          maxURLLenght: 1300,
          root: 'app/assets/javascripts/yui/',
          groups: {
            app: {
                % if raw:
                filter: 'raw',
                % endif
                % if combine:
                combine: true,
                % else:
                combine: false,
                % endif
                base: "${convoy_url}?app/",
                comboBase: "${convoy_url}?",
                root: 'app/',
                // From modules.js
                modules: YUI_MODULES,
            },
          }
        };

        YUI(GlobalConfig).use(['juju-gui', 'yui-patches'], function(Y) {
          app = new Y.juju.App(juju_config);
          // We need to activate the hotkeys when running the application
          // in production. Unit tests should call it manually.
          app.activateHotkeys();

          window.ga_id = juju_config.GA_key || '';
          if (window.ga_id != '') {
            _gaq.push(['_setAccount', window.ga_id]);
            _gaq.push (['_gat._anonymizeIp']);
            _gaq.push(['_setDomainName', 'none']);
            _gaq.push(['_setAllowLinker', true]);
            _gaq.push(['_trackPageview']);
          }
        });

      };
    </script>
    <script async type="text/javascript">
      (function() {
      var ga = document.createElement('script');
      ga.type = 'text/javascript'; ga.async = true;
      ga.src = ('https:' == document.location.protocol ?
                'https://ssl' : 'http://www') +
                '.google-analytics.com/ga.js';
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(ga, s);
      })();
    </script>

  </body>
</html>
