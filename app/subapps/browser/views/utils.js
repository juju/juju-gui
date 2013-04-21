'use strict';


/**
 * The view utils.
 *
 * @namespace juju
 * @module juju.browser.views
 * @submodule juju.browser.views.utils
 */
YUI.add('subapp-browser-view-utils', function(Y) {

  var ns = Y.namespace('juju.browser.views.utils'),
      models = Y.namespace('juju.models');

  /**
   * Shared method to generate a message to the user based on a bad api
   * call from a view.
   *
   * @method apiFailure
   * @param {Object} data the json decoded response text.
   * @param {Object} request the original io_request object for debugging.
   *
   */
  ns.apiFailure = function(data, request, view) {
    var message;
    if (data && data.type) {
      message = 'Charm API error of type: ' + data.type;
    } else {
      message = 'Charm API server did not respond';
    }
    view.get('db').notifications.add(
        new models.Notification({
          title: 'Failed to load sidebar content.',
          message: message,
          level: 'error'
        })
    );
  };

}, '0.1.0', {
  requires: []
});
