'use strict';


YUI.add('subapp-browser-charmview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
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

    /**
     * List the DOM based events to watch for in the container.
     * @attribute events
     *
     */
    events: {
      '.changelog .toggle': {
        click: this._toggleLog
      },
      '.charm .add': {
        click: this._addCharmEnvironment
      }
    },

    /**
     * When the 'add' is clicked we need to work on adding the ghost to the
     * environment.
     *
     * @method _addCharmEnvironment
     * @param {Event} ev the event from the click handler.
     * @private
     *
     */
    _addCharmEnvironment: function(ev) {
      console.log('add the charm to the environment');
    },

    /**
     * The readme file in a charm can be upper/lower/etc. This helps find a
     * readme from the list of files in a charm.
     *
     * @method _locateReadme
     * @private
     *
     */
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

    /**
     * Fetch the contents from a file and drop it into the container
     * specified.
     *
     * @method _loadFile
     * @param {Node} container the node to set content to.
     * @param {String} filename the name of the file to fetch from the api.
     * @private
     *
     */
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

    /**
     * When there is no readme setup some basic 'nothing found content'.
     *
     * @method _noReadme
     * @param {Node} container the node to drop this default content into.
     *
     */
    _noReadme: function(container) {
      container.setHTML('<h3>No Readme Found</h3>');
    },

    /**
     * Clicking on the open log should toggle the list of log entries.
     *
     * @method _toggleLog
     * @param {Event} ev the click event of the open log control.
     * @private
     *
     */
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
       * The charm we're viewing the details of.
       *
       * @attribute charm
       * @default undefined
       * @type {juju.models.BrowserCharm}
       *
       */
      charm: {},

      /**
       * The store is the api endpoint for fetching data.
       *
       * @attribute store
       * @default undefined
       * @type {Charmworld0}
       *
       */
      store: {}

    }
  });

}, '0.1.0', {
  requires: [
    'browser-tabview',
    'gallery-markdown',
    'view'
  ]
});
