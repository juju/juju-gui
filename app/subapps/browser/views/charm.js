'use strict';


YUI.add('subapp-browser-charmview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      models = Y.namespace('juju.models'),
      views = Y.namespace('juju.views'),
      widgets = Y.namespace('juju.widgets');


  /**
   * View for the Charm details UI.
   *
   * @class CharmView
   * @extends {Y.View}
   *
   */
  ns.BrowserCharmView = Y.Base.create('browser-view-charmview', Y.View, [], {
    template: views.Templates.browser_charm,

    events: {
      '.changelog .toggle': {
        click: this._toggleLog
      },
      '.charm .add': {
        click: this._addCharmEnvironment
      }
    },

    _addCharmEnvironment: function(ev) {
      console.log('add the charm to the environment');
    },

    _locateReadme: function() {
      var files = this.get('charm').get('files'),
          match = 'readme';

      return Y.Array.find(files, function(file) {
        console.log(file.toLowerCase().slice(0, 6), match);
        console.log(file.toLowerCase().slice(0, 6) === match);
        if (file.toLowerCase().slice(0, 6) === match) {
          console.log('hit');
          return true;
        }
      });
    },

    _loadFile: function(container, filename) {
      this.get('store').file(this.get('charm').get('id'),
                             filename, {
                               'success': function(data) {
                                 if (filename.slice(-3) === '.md') {
                                   data = Y.Markdown.toHTML(data);
                                 }
                                 container.setHTML(data);
                               },
                               'failure': function(data, request) {

                               }
                             }
      );

    },

    _noReadme: function(container) {
      container.setHTML('<h3>No Readme Found</h3>');
    },

    _toggleLog: function(ev) {
      console.log('toggle the charm log');
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     * @param {Node} container optional specific container to render out to.
     *
     */
    render: function(container) {
      var tpl = this.template(this.get('charm').getAttrs()),
          tplNode = Y.Node.create(tpl);

      container.setHTML(tplNode);
      this.tabview = new widgets.browser.TabView({
        srcNode: tplNode.one('.tabs')
      });
      this.tabview.render();
      container.setHTML(tplNode);

      // Start loading the readme so it's ready to go.
      var readme = this._locateReadme();

      if (readme) {
        this._loadFile(tplNode.one('#readme'),
                       readme
        );
      } else {
        this._noReadme(tplNode.one('#readme'));
      }
    }

  }, {
    ATTRS: {
      /**
       *
       * @attribute charm
       * @default undefined
       * @type {juju.models.BrowserCharm}
       *
       */
      charm: {},

      store: {}

    }
  });

}, '0.1.0', {
  requires: [
    'browser-tabview',
    'gallery-markdown',
    'juju-charm-models',
    'view'
  ]
});
