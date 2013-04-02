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
  ns.BrowserCharmView = Y.Base.create('browser-view-charmview', Y.View, [
    widgets.browser.IndicatorManager], {

    template: views.Templates.browser_charm,
    qatemplate: views.Templates.browser_qa,

    /**
     * List the DOM based events to watch for in the container.
     * @attribute events
     *
     */
    events: {
      '.changelog .toggle': {
        click: '_toggleLog'
      },
      '.charm input.add': {
        click: '_addCharmEnvironment'
      },
      '#bws_hooks ul li a': {
        click: '_loadHookContent'
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
      ev.preventDefault();
    },

    /**
     * The API retuns the questions and the scores. Combine the data into a
     * single source to make looping in the handlebars templates nicer.
     *
     * @method _buildQAData
     * @param {Object} responseData the qa data from the store.
     *
     */
    _buildQAData: function(responseData) {
      var questions = responseData.result.questions,
          scores = responseData.scores,
          totalAvailable = 0,
          totalScore = 0;

      Y.Array.each(questions, function(category) {
        var sum = 0;

        Y.Array.each(category.questions, function(question, idx) {
          var categoryName = category.name,
              questionIndex = categoryName + '_' + idx;

          if (scores[categoryName] && scores[categoryName][questionIndex]) {
            var score = parseInt(scores[categoryName][questionIndex], 10);
            sum += score;
            category.questions[idx].score = score;
          } else {
            category.questions[idx].score = undefined;
          }
        });

        category.score = sum;
        totalAvailable += category.questions.length;
        totalScore += sum;
      });

      return {
        questions: questions,
        totalAvailable: totalAvailable,
        totalScore: totalScore
      };
    },

    /**
     * Watch the tab control for change events and dispatch accordingly.
     *
     * @method _bindTabEvents
     * @param {TabView} tab the tab control to monitor.
     *
     */
    _dispatchTabEvents: function(tab) {
      this._events.push(tab.after('selectionChange', function(ev) {
        var tab = ev.newVal.get('content');
        switch (tab) {
          // @todo to be added later. Placed in now to make the linter happy
          // with the switch statement.
          case 'Interfaces':
            console.log('not implemented interfaces handler');
            break;
          case 'Quality':
            this._loadQAContent();
            break;
          default:
            break;
        }
      }, this));
    },

    /**
     * Event handler for clicking on a hook filename to load that file.
     *
     * @method _loadHookContent
     * @param {Event} ev the click event created.
     *
     */
    _loadHookContent: function(ev) {
      var filename = ev.currentTarget.get('text'),
          node = this.get('container').one('#bws_hooks .filecontent');

      // Load the file, but make sure we prettify the code.
      this._loadFile(node, filename, true);
    },

    /**
     * Load the charm's QA data and fill it into the tab when selected.
     *
     * @method _loadQAContent
     *
     */
    _loadQAContent: function() {
      var node = Y.one('#bws_qa');
      this.showIndicator(node);
      // Only load the QA data once.
      if (!this._qaLoaded) {
        this.get('store').qa(
            this.get('charm').get('id'), {
              'success': function(data) {
                data = this._buildQAData(data);
                node.setHTML(this.qatemplate(data));
                this.hideIndicator(node);
              },
              'failure': function(data, request) {

              }
            }, this);
      }
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
        if (file.toLowerCase().slice(0, 6) === match) {
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
    _loadFile: function(container, filename, prettify) {
      // Enable the indicator on the container while we load.
      this.showIndicator(container);

      this.get('store').file(
          this.get('charm').get('id'),
          filename, {
            'success': function(data) {
              if (prettify) {
                // If we say we want JS-prettified, use the prettify module.
                Y.prettify.renderPrettyPrintedFile(container, data);
              } else if (filename.slice(-3) === '.md') {
                // else if it's a .md file, render the markdown to html.
                container.setHTML(Y.Markdown.toHTML(data));
              } else {
                // Else just stick the content in a pre so it's blocked.
                container.setHTML(Y.Node.create('<pre/>').setContent(data));
              }

              this.hideIndicator(container);
            },
            'failure': function(data, request) {

            }
          }, this);

    },

    /**
     * When there is no readme setup some basic 'nothing found content'.
     *
     * @method _noReadme
     * @param {Node} container the node to drop this default content into.
     *
     */
    _noReadme: function(container) {
      container.setHTML('<h3>Charm has no README</h3>');
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
     * Clean up after ourselves.
     *
     * @method destructor
     *
     */
    destructor: function() {
      if (this.tabview) {
        this.tabview.destroy();
      }

      Y.Array.each(this._events, function(ev) {
        ev.detach();
      });
    },

    /**
     * Generic YUI initializer. Make sure we track indicators for cleanup.
     *
     * @method initializer
     * @param {Object} cfg configuration object.
     *
     */
    initializer: function(cfg) {
      // Hold onto references of the indicators used so we can clean them all
      // up. Indicators are keyed on their yuiid so we don't dupe them.
      this.indicators = {};
      this._events = [];
    },

    /**
     * Render out the view to the DOM.
     *
     * @method render
     * @param {Node} container optional specific container to render out to.
     *
     */
    render: function(container) {
      var charm = this.get('charm');
      var tpl = this.template(Y.merge(
          charm.getAttrs(), {
            config: charm.getOptionsAsArray()
          }));
      var tplNode = Y.Node.create(tpl);

      container.setHTML(tplNode);

      // Allow for specifying the container to use. This should reset the
      // events.
      if (container) {
        this.set('container', container);
      }

      this.tabview = new widgets.browser.TabView({
        srcNode: tplNode.one('.tabs')
      });
      this.tabview.render();
      this._dispatchTabEvents(this.tabview);

      // Start loading the readme so it's ready to go.
      var readme = this._locateReadme();

      if (readme) {
        this._loadFile(tplNode.one('#bws_readme'),
                       readme
        );
      } else {
        this._noReadme(tplNode.one('#bws_readme'));
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
    'browser-overlay-indicator',
    'browser-tabview',
    'gallery-markdown',
    'juju-templates',
    'juju-views',
    'prettify',
    'view'
  ]
});
