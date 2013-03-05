/*global YUI: false*/

'use strict';

/**
 * SubApp for the Browser
 *
 * @module juju
 * @submodule subapps
 *
 */
YUI.add('subapp-browser', function(Y) {
    var ns = Y.namespace('juju.subapps');

    /**
     * Browser Sub App for the Juju Gui.
     *
     * @class Browser
     * @extends {Y.juju.SubApp}
     *
     */
    ns.Browser = Y.Base.create('subapp-browser', Y.juju.SubApp, [], {

        views: {
            fullscreen: {
                type: 'juju.browser.views.FullScreen',
                preserve: true
            },
            fullscreen_charm: {
                type: 'juju.browser.views.FullScreen',
                preserve: true
            }
        },

        initializer: function() {
        },

        fullscreen: function(req, res, next) {
            console.log('showing fullscreen', this.name);
            this.showView('fullscreen');
            next();
        },

        fullscreen_charm: function(req, res, next) {
            console.log('showing fullscreen charm', this.name);
            this.showView('fullscreen_charm');
            next();
        },

        destructor: function() {}

    }, {
        ATTRS: {
            container: {
                value: Y.one('#browser')
            },
            urlNamespace: {
                value: 'charmstore'
            },
            routes: {
                value: [
                    { path: '/bws/fullscreen/', callbacks: 'fullscreen' },
                    { path: '/bws/fullscreen/:id/', callbacks: 'fullscreen_charm' },
                    // { path: '/bws/sidebar/:id/', callbacks: 'sidebar_charm' },
                ]
            }
        }
    });

}, '0.1.0', {requires: ['sub-app', 'subapp-browser-fullscreen']});
