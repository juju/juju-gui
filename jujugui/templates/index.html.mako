<!DOCTYPE html>
<html lang="en" dir="ltr">
<!-- !IE will be true for all non-IE browsers and IE10 since it does not
 recognize conditional flags. -->
<!--[if !IE]><!--><script>
if (/*@cc_on!@*/false) {
  // Only IE10 has cc_on as false.
  document.documentElement.className+=' ie10';
}
</script><!--<![endif]-->
<head>
    <title>Juju GUI</title>
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
    <script type="text/javascript">
      // This is used as part of Juju GUI automated QA.
      window.jsErrors = [];
      window.onerror = function(msg, source, line) {
        window.jsErrors.push(msg + ' (' + source + ' at line ' + line + ')');
      }
    </script>

    <!-- Make sure the config is loaded before other JS for use in the page
         below.
    -->
    <script src="${config_url}"></script>
    <script type="text/javascript">
        window.GUI_VERSION = {'version': '', 'commit': ''};
    </script>
    <link rel="shortcut icon" href="${static_url}/static/gui/build/app/favicon.ico">
    <link rel="stylesheet" href="${convoy_url}?app/assets/stylesheets/normalize.css&app/assets/juju-gui.css">

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

      <div style="display: none;">
        ## Include the svg sprite image inside the body.
        <%include file="../static/gui/build/app/assets/stack/svg/sprite.css.svg" />
      </div>

      <div class="header-banner header-banner--left">
        <div id="header-logo" class="header-banner__logo"></div>
        <div id="header-breadcrumb"></div>
        <div id="model-actions-container"></div>
        <div id="provider-logo-container" class="header-banner__provider"></div>
      </div>

      <div class="header-banner header-banner--right">
        <ul class="header-banner__list--right">
          <li id="maas-server" style="display:none" class="header-banner__list-item">
            <a href="" target="_blank" class="header-banner__link">MAAS UI</a>
          </li>
          <li id="header-search-container"
              class="header-banner__list-item header-banner__list-item--no-padding"></li>
          <li id="header-help" class="header-banner__list-item header-banner__list-item--no-padding"></li>
          <li id="profile-link-container"
              class="header-banner__list-item header-banner__list-item--no-padding"></li>
        </ul>
      </div>

      <div id="zoom-container"></div>

      <div id="full-screen-mask">
        <div id="browser-warning" class="centered-column"
            style="display:none;">
          <svg class="svg-icon"
            viewBox="0 0 90 35"
            style="width:90px; height:35px;">
            <use xlink:href="#juju-logo" />
          </svg>
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
              <input type="submit" class="button" value="Continue"/>
            </form>
          </div>
        </div>
        <div id="loading-message" class="centered-column">
          <svg class="svg-icon"
            viewBox="0 0 90 35"
            style="width:90px; height:35px;">
            <use xlink:href="#juju-logo" />
          </svg>
          <div class="panel">
            <div id="loading-indicator"></div>
            <div id="loading-message-text" class="header">
              Hello, world.
            </div>
          </div>
        </div>
        <div id="login-container"></div>
      </div>

      <div id="top-page-container"></div>
      <div id="popup-container"></div>
      <div id="sharing-container"></div>
      <div id="charmbrowser-container"></div>
      <div id="deployment-container"></div>
      <div id="deployment-bar-container"></div>
      <div id="env-size-display-container"></div>
      <div id="inspector-container"></div>
      <div id="white-box-container"></div>
      <div id="machine-view"></div>
      <div id="post-deployment"></div>
      <div id="status-container"></div>
      <div id="login-notification"></div>
      <div id="cookie-container"></div>
      <div id="viewport">
        <div id="content">
            <div id="modal-shortcuts"></div>
            <div id="modal-gui-settings"></div>
            <div id="lightbox"></div>
            <div id="main">
            </div> <!-- /container -->
            <div id="drag-over-notification-container"></div>
        </div>
        <div id="notifications-container"></div>
    </div>
    <script id="app-startup">
      // Global to store all of the shared application data.
      var juju = {
        // Collection of components.
        components: {},
        utils: {}
      };

      // Note that any changes to MessageRotator need to be made in both
      // index.html.go and index.html.mako.
      class MessageRotator {
        constructor() {
          this.messages = [
            'Requesting code...',
            'Reading the configuration...',
            'Connecting to the backend...',
            'Reticulating splines...',
            'Establishing API connections...',
            'Verifying identity...',
            'Checking controller information...',
            'Setting phasers to stun...',
            'Querying the charm store...',
            'Rendering the GUI...'
          ];
          this.interval = 3000;
          this.index = 0;
          this.maxIndex = this.messages.length - 1;
        }

        advance() {
          // Display the next message.
          const message = this.messages[this.index];
          document.getElementById('loading-message-text').innerHTML = message;
          // If we're at the end of the messages, loop back to the beginning.
          // Else, advance to the next message.
          if (this.index === this.maxIndex) {
            this.index = 0;
          } else {
            this.index += 1;
          }
        }

        start() {
          // Display the first message.
          this.advance();
          // Setup the timer for subsequent messages.
          this.timerId = window.setInterval(() => this.advance(), this.interval);
        }

        stop() {
          if (this.timerId) {
            window.clearInterval(this.timerId);
          }
        }
      }

      messageRotator = new MessageRotator();
      messageRotator.start();

      getDocument = function() {
        return document;
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

    % if raw:
    <script src="${convoy_url}?app/assets/javascripts/version.js"></script>
    <script src="${convoy_url}?app/init-pkg.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/yui/yui/yui.js&app/assets/javascripts/yui/loader/loader.js"></script>
    <script src="${convoy_url}?modules.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/js-macaroon.js"></script>
    <script src="${convoy_url}?app/state/state.js&app/user/user.js&app/utils/github-ssh-keys.js&app/utils/statsd.js&app/jujulib/index.js&app/jujulib/charmstore.js&app/jujulib/bundleservice.js&app/jujulib/plans.js&app/jujulib/payment.js&app/jujulib/stripe.js&app/jujulib/terms.js&app/jujulib/reconnecting-websocket.js&app/jujulib/urls.js&app/jujulib/bakery.js"></script>
    % else:
    <script src="${convoy_url}?app/init-pkg-min.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/version-min.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/yui/yui/yui-min.js&app/assets/javascripts/yui/loader/loader-min.js"></script>
    <script src="${convoy_url}?modules-min.js"></script>
    <script src="${convoy_url}?app/assets/javascripts/js-macaroon-min.js"></script>
    <script src="${convoy_url}?app/state/state-min.js&app/user/user-min.js&app/utils/github-ssh-keys-min.js&app/utils/statsd-min.js&app/jujulib/index-min.js&app/jujulib/charmstore-min.js&app/jujulib/bundleservice-min.js&app/jujulib/plans-min.js&app/jujulib/payment-min.js&app/jujulib/stripe-min.js&app/jujulib/terms-min.js&app/jujulib/reconnecting-websocket-min.js&app/jujulib/urls-min.js&app/jujulib/bakery-min.js"></script>
    % endif

    <script>
      // Now that all of the above JS is loaded we can define the real start
      // function which will be picked up by the setTimeout, and the app will
      // start.
      startTheApp = function() {
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
                modules: YUI_MODULES
            }
          }
        };

        YUI(GlobalConfig).use([
            'juju-charm-models',
            'juju-bundle-models',
            'juju-controller-api',
            'juju-env-base',
            'juju-env-api',
            'juju-models',
            // juju-views group
            'juju-landscape',
            // end juju-views group
            'io',
            'json-parse',
            'app-base',
            'app-transitions',
            'base',
            'bundle-import-notifications',
            'node',
            'model',
            'cookie',
            'querystring',
            'event-key',
            'event-touch',
            'model-controller',
            'ghost-deployer-extension',
            'environment-change-set',
            'yui-patches'], function(Y) {
          window.yui = Y;
          if (!juju_config.flags) {
            juju_config.flags = {};
          }
          const JujuGUI = require('init');
          window.JujuGUI = new JujuGUI(juju_config);

          const stopHandler = () => {
            document.removeEventListener('login', stopHandler);
            messageRotator.stop()
          };
          document.addEventListener('login', stopHandler);
        });
      };
    </script>
    <script src="https://assets.ubuntu.com/v1/juju-cards-v1.6.0.js"></script>


    <!-- Google Tag Manager -->
    <noscript><iframe src="//www.googletagmanager.com/ns.html?id=GTM-K9KCMZ"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <script>
    if (juju_config.GTM_enabled) {
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-K9KCMZ');
    }
    </script>
    <!-- End Google Tag Manager -->
  </body>
</html>
