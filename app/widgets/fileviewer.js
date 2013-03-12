'use strict';


/**
 * Fileviewer widget; a syntax colored view of code with linenumbers.
 *
 * @namespace juju
 * @module browser
 * @submodule widgets.fileviewer
 */
YUI.add('browser-fileviewer-widget', function(Y) {
  var sub = Y.Lang.sub,
      ns = Y.namespace('juju.widgets.browser');

  /**
   * FileViewer
   *
   * @class FileViewer
   * @extends {Y.Widget}
   */
  ns.FileViewer = Y.Base.create('file-viewer', Y.Widget, [], {
    /**
     * The pre block template for the pretty printer
     *
     * @property TEMPLATE
     * @type {String}
     */
    TEMPLATE: '<pre class="prettyprint linenums hidden">{code}</pre>',

    /**
     * Sets up the dom and processes the pretty printing.
     *
     * @method renderUI
     * @param {undefined}; Mutates only.
     */
    renderUI: function() {
      var content = sub(this.TEMPLATE, {code: this.get('code')});
      this.get('contentBox').setHTML(content);
      Y.prettify.prettyPrint();
      Y.one('.prettyprint').removeClass('hidden');
    }

  }, {
    ATTRS: {
      /**
       * @attribute code
       * @default ''
       * @type {String}
       */
      code: {
        value: ''
      }
    }
  });

}, '0.1.0', { requires: [
  'base',
  'node',
  'prettify',
  'widget'
]});
