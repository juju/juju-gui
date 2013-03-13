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
  ns.FileViewer = Y.Base.create('file-viewer', Y.Base, [], {
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
     * @method render
     * @param {Y.Node} container The node to contain the code.
     * @param {String} code The code being rendered.
     */
    render: function(container, code) {
      var content = sub(this.TEMPLATE, {code: code});
      container.setHTML(content);
      Y.prettify.prettyPrint();
      Y.one('.prettyprint').removeClass('hidden');
    }

  }, {
  });

}, '0.1.0', { requires: [
  'base',
  'node',
  'prettify'
]});
