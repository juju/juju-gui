/*
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
*/

'use strict';

YUI.add('subapp-browser-entitybaseview', function(Y) {
  var ns = Y.namespace('juju.browser.views'),
      widgets = Y.namespace('juju.widgets'),
      DATE_FORMAT = '%d/%b/%y';

  /**
    Provides the shared methods for the Charm and Bundle browser views.

    @class EntityBaseView
  */
  function EntityBaseView() {}

  EntityBaseView.prototype = {

    /**
     * Shared method to generate a message to the user based on a bad api
     * call.
     *
     * @method apiFailure
     * @param {Object} data the json decoded response text.
     * @param {Object} request the original io_request object for debugging.
     *
     */
    apiFailure: function(data, request) {
      this._apiFailure(data, request, 'Failed to load charm details.');
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

          if (scores && scores[categoryName] &&
              scores[categoryName][questionIndex]) {
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
        charm: this.get('entity').getAttrs(),
        questions: questions,
        totalAvailable: totalAvailable,
        totalScore: totalScore
      };
    },

    /**
     * Event handler for clicking on a hook filename to load that file.
     *
     * @method _loadHookContent
     * @param {Event} ev the click event created.
     *
     */
    _loadHookContent: function(ev) {
      var index = ev.currentTarget.get('selectedIndex');
      var filename = ev.currentTarget.get('options').item(
          index).getAttribute('value'),
          node = this.get('container').one('#bws-code .filecontent');

      // Load the file, but make sure we prettify the code.
      if (filename) {
        this._loadFile(node, filename, true);
      }
    },

    /**
      Watch the tab control for change events and load the content
      if required using the labels as the keys.

      @method _dispatchTabEvents
      @param {TabView} tabview the tab control to monitor.
    */
    /**
      Flag to indicate that we have loaded the qa content

      @property _qaContentLoaded
    */
    /**
      Flag to indicate that we have loaded the interfaces content

      @property _interfacesContentLoaded
    */
    /**
      Flag to indicate that we have loaded the readme content

      @property _readmeContentLoaded
    */
    _dispatchTabEvents: function(tabview) {
      this.addEvent(
          tabview.after('selectionChange', function(e) {
            switch (e.newVal.get('label')) {
              case 'Features':
                if (!this._qaContentLoaded) {
                  this._loadQAContent();
                }
                this._qaContentLoaded = true;
                break;
              case 'Related Charms':
                if (!this._interfacesContentLoaded) {
                  this._loadInterfacesTabCharms();
                }
                this._interfacesContentLoaded = true;
                break;
              case 'Readme':
                if (!this._readmeContentLoaded) {
                  this._loadReadmeTab();
                }
                this._readmeContentLoaded = true;
            }
          }, this));
    },

    /**
       Creates the bazaar url for the charm.

       @method _getSourceLink
       @private
     */
    _getSourceLink: function() {
      var url = this.get('entity').get('code_source').location;
      url = url.replace('lp:', 'http://bazaar.launchpad.net/');
      return url + '/files';
    },

    /**
       Creates the url for a given revision of the charm.

       @method _getRevnoLink
       @private
       @param {String} sourceLink The charm's source_link.
       @param {String} revno The charm commit's revision number.
     */
    _getRevnoLink: function(sourceLink, revno) {
      return sourceLink.replace('files', 'revision/') + revno;
    },

    /**
     * Commits need to be formatted, dates made pretty for the output to the
     * template. We have to break up the first one from the rest since it's
     * displayed differently.
     *
     * @method _formatCommitsForHtml
     * @param {Array} commits a list of commit objects.
     *
     */
    _formatCommitsForHtml: function(commits, sourceLink) {
      var firstTmp;
      var prettyCommits = {
        remaining: []
      };

      // No commits then just return an empty list.
      if (!commits) {
        return [];
      }

      if (commits.length > 0) {
        firstTmp = commits.shift();
        prettyCommits.first = firstTmp;
        prettyCommits.first.prettyDate = Y.Date.format(
            prettyCommits.first.date, {
              format: DATE_FORMAT
            });
        prettyCommits.first.revnoLink = this._getRevnoLink(
            sourceLink, prettyCommits.first.revno);
      }

      Y.Array.each(commits, function(commit) {
        commit.prettyDate = Y.Date.format(
            commit.date, {
              format: DATE_FORMAT
            });
        commit.revnoLink = this._getRevnoLink(sourceLink, commit.revno);
        prettyCommits.remaining.push(commit);
      }, this);

      // Put our first item back on the commit list.
      if (firstTmp) {
        commits.unshift(firstTmp);
      }

      return prettyCommits;
    },

    /**
        Handle the back button being clicked on from the header of the
        details.

        @method _handleBack
        @param {Event} ev the click event handler.

     */
    _handleBack: function(ev) {
      ev.halt();
      this.fire('viewNavigate', {
        change: {
          charmID: null,
          hash: null
        }
      });
    },

    /**
     * Load the charm's QA data and fill it into the tab when selected.
     *
     * @method _loadQAContent
     *
     */
    _loadQAContent: function() {
      var node = Y.one('#bws-features');
      this.showIndicator(node);
      // Only load the QA data once.
      this.get('store').qa(
          this.get('entity').get('storeId'), {
            'success': function(data) {
              data = this._buildQAData(data);
              node.setHTML(this.qatemplate(data));
              this.hideIndicator(node);
            },
            'failure': function(data, request) {

            }
          }, this);
    },

    /**
     * Load Readme file content into the tab.
     *
     * @method _loadReadmeTab
     */
    _loadReadmeTab: function() {
      // Start loading the readme so it's ready to go.
      if (!this.loadedReadme) {
        var tplNode = this.get('container');
        var readme = this._locateReadme();

        if (readme) {
          this._loadFile(tplNode.one('#bws-readme'), readme);
        } else {
          this._noReadme(tplNode.one('#bws-readme'));
        }
        this.loadedReadme = true;
      }
    },
    /**
      Load the related charm data into the model for use.

      @method _loadRelatedCharms

     */
    _loadRelatedCharms: function(callback) {
      this.get('store').related(
          this.get('entity').get('storeId'), {
            'success': function(data) {
              this.get('entity').buildRelatedCharms(
                  data.result.provides, data.result.requires);
              if (callback) {
                callback.call(this);
              }
            },
            'failure': function(data, request) {
              console.log('Error loading related charm data.');
              console.log(data);
            }
          },
          this);
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
      var files = this.get('entity').get('files'),
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
      var entity = this.get('entity');
      // If this is a bundle it won't have a storeId
      var id = entity.get('storeId') || entity.get('id');
      this.get('store').file(id, filename, entity.constructor.entityType, {
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
        'failure': this.apiFailure
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
       Handles the links in the sharing widget to ensure they open in a new
       window.

       @method _openShareLink
       @param {Y.EventFacade} e The click event.
     */
    _openShareLink: function(e) {
      e.halt();
      var shareLink = e.currentTarget.get('href');
      window.open(shareLink, 'share_window');
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
      ev.halt();
      var container = this.get('container'),
          target = ev.currentTarget,
          state = target.getData('state'),
          more = target.one('.more'),
          less = target.one('.less');

      if (state === 'closed') {
        // open up the changelog.
        container.one('.changelog .remaining').removeClass('hidden');
        target.setData('state', 'open');
        more.addClass('hidden');
        less.removeClass('hidden');
      } else {
        // close up the changelog.
        container.one('.changelog .remaining').addClass('hidden');
        target.setData('state', 'closed');
        less.addClass('hidden');
        more.removeClass('hidden');
      }
    },

    /**
      Creates the tabview instance for the bundle view

      @method _setupTabView
    */
    _setupTabview: function() {
      /**
        Tabview instance used to display the bundle details.

        @property tabview
      */
      this.tabview = new widgets.browser.TabView({
        render: true,
        srcNode: this.get('container').one('.tabs')
      });
    },

    /**
      Shows the active tabview tab set via the browser subapp.

      @method _showActiveTab
    */
    _showActiveTab: function() {
      var activeTab = this.get('activeTab');
      if (activeTab) {
        var tab = this.get('container')
                      .one('.tabs a[href="' + activeTab + '"]');
        if (tab) {
          tab.get('parentNode').simulate('click');
        }
      }
    }
  };

  EntityBaseView.ATTRS = {
    /**
      @attribute activeTab
      @default undefined
      @type {String}

     */
    activeTab: {},

    /**
       @attribute entityId
       @default undefined
       @type {Int}
    */
    entityId: {},

    /**
     * The charm we're viewing the details of.
     *
     * @attribute entity
     * @default undefined
     * @type {juju.models.Charm | juju.models.Bundle}
     *
     */
    entity: {},

    /**
    * @attribute forInspector
    * @default {Boolean} false
    * @type {Boolean}
    */
    forInspector: {
      value: false
    },

    /**
       @attribute isFullscreen
       @default false
       @type {Boolean}

     */
    isFullscreen: {
      value: false
    },

    /**
     * @attribute renderTo
     * @default {Node} .bws-view-data node.
     * @type {Node}
     *
     */
    renderTo: {
      /**
       * @method renderTo.valueFn
       * @return {Node} the renderTo node.
       *
       */
      valueFn: function() {
        return Y.one('.bws-view-data');
      }
    },

    /**
     * The store is the api endpoint for fetching data.
     *
     * @attribute store
     * @default undefined
     * @type {Object}
     *
     */
    store: {},

    /**
     * The "deploy" function prompts the user for service configuration and
     * deploys a service or bundle.
     *
     * The proper deploy function is provided from the browser subapp.
     *
     * @attribute deploy
     * @default undefined
     * @type {Function}
     *
     */
    deploy: {}
  };

  ns.EntityBaseView = EntityBaseView;

});
