'use strict';


YUI.add('browser-fileviewer-widget', function(Y) {
  var sub = Y.Lang.sub,
      ns = Y.namespace('juju.widgets.browser');

  ns.FileViewer = Y.Base.create('file-viewer', Y.Widget, [], {

    TEMPLATE: '<pre class="prettyprint linenums hidden">{code}</pre>',

    renderUI: function() {
      var content = sub(this.TEMPLATE, {code: this.get('code')});
      this.get('contentBox').setHTML(content);
      Y.prettify.prettyPrint();
      Y.one('.prettyprint').removeClass('hidden');
    }

  }, {
    ATTRS: {
      code: {
        value: ''
      }
    }
  });

}, '0.1.0', {
  requires: [
    'base',
    'node',
    'prettify',
    'widget'
]});
