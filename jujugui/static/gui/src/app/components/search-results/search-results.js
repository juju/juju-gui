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

YUI.add('search-results', function(Y) {

  juju.components.SearchResults = React.createClass({
    searchXhr: null,
    template: Handlebars.templates['search-results-tmpl.hbs'],

     /**
      If it's the same charm but for different series, collapse into one
      entity. We do this by converting the list to an OrderedDict, keyed on
      the match criteria (name, owner, type). When there is a key collision,
      add the series to the exist entity. Using an OrderedDict (versus a
      normal dict) is important to preserve sorting.

      @method collapseSeries
      @param {Array} entities The entities in their uncollapsed state.
     */
    collapseSeries: function(entities) {

      function seriesKey(series) {
        // XXX kadams54, 2015-05-21: This series mapping needs to be updated
        // with each release, at least until we can figure out a better way.
        // XXX urosj, 2015-11-04: We need to support all series, not just 
        // Ubuntu ones. 
        return {
          precise: 12.04,
          trusty:  14.04,
          utopic:  14.10,
          vivid:   15.04,
          wily:    15.10
        }[series.name];
      }

      function entityKey(entity) {
        return [entity.name, entity.owner, entity.type, entity.promulgated];
      }

      var collapsedEntities = {},
          orderedKeys = [];
      for (var i = 0, l = entities.length; i < l; i++) {
        var entity = entities[i],
            key = entityKey(entity),
            series = entity.series,
            url = entity.url || '',
            value = {name: series, url: url};
        // If the key already exists, append the series to the existing list.
        if (collapsedEntities[key]) {
          var collapsed = collapsedEntities[key];
          // Aggregate downloads across different series.
          collapsed.downloads += entity.downloads || 0;
          // Add series to the list.
          collapsed.series.push(value);
          // Ensure that the most recent series is first.
          collapsed.series.sort(function(a, b) {
            var k1 = seriesKey(a),
                k2 = seriesKey(b);
            // We want a reverse sort, so...
            return k2 - k1;
          });
          // De-dupe the series array.
          collapsed.series = collapsed.series.filter(function(s, pos, arry) {
            return !pos || s.name != arry[pos - 1].name;
          });
          // And that its URL is used for the entity.
          collapsed.url = collapsed.series[0].url;
        } else {
          // Convert all series attributes in the entities to lists.
          if (series) {
            entity.series = [value];
          } else {
            entity.series = [];
          }
          // Ensure downloads and URL are present.
          entity.downloads = entity.downloads || 0;
          entity.url = entity.url || '';
          entity.id = entity.series.length > 0 ?
              entity.series[0].name + '/' + entity.name : entity.name;
          collapsedEntities[key] = entity;
          // Save the key so we can preserve sort order.
          orderedKeys.push(key);
        }
      }
      // Now convert that object back to an ordered list and return it.
      var returnedEntities = [];
      for (var i = 0, l = orderedKeys.length; i < l; i++) {
        var k = orderedKeys[i];
        returnedEntities.push(collapsedEntities[k]);
      }
      return returnedEntities;
    },

    /**
      Handle successful searches by updating internal state with the results.

      @method searchSuccess
      @param {Array} rawResults The entity models returned by the search.
    */
    searchSuccess: function(rawResults) {
      // Parse the raw results.
      var results = rawResults.map(function(model) {
        return model.toEntity();
      }, this);
      results = this.collapseSeries(results);
      // Split the results into promulgated and normal.
      var promulgatedResults = [],
          normalResults = [];
      results.forEach(function(obj) {
        // Pass in a full id including the owner to allow looking up the entity.
        obj.storeId = '~' + obj.owner + '/' + obj.id;
        if (obj.promulgated) {
          promulgatedResults.push(obj);
        } else {
          normalResults.push(obj);
        }
      });
      var data = {
        standalone: false,
        text: this.props.query,
        hasResults: results.length > 0,
        solutionsCount: results.length,
        normalResultsCount: normalResults.length,
        normalResults: normalResults,
        promulgatedResultsCount: promulgatedResults.length,
        promulgatedResults: promulgatedResults
      };
      // These need to be set separately, seemingly due to a React quirk.
      this.setState({waitingForSearch: false});
      this.setState({data: data});
      this._changeActiveComponent('search-results');
    },

    /**
      Handle failed searches by displaying appropriate error notification.

      @method searchFailure
      @param {Object} response The failure response.
    */
    searchFailure: function(response) {
      // XXX: Implement error handling.
      console.error('Search request failed.');
    },

    /**
      Search the charmstore with the given filters.

      @method searchRequest
      @param {String} query The text to search for.
      @param {String} tags The tags to limit the search by.
    */
    searchRequest: function(query, tags) {
      this._changeActiveComponent('loading');
      this.setState({ waitingForSearch: true });
      this.searchXhr = this.props.charmstoreSearch(
        {text: query, tags: tags},
        this.searchSuccess,
        this.searchFailure,
        150
      );
    },

    /**
      Determines whether an API search request is actually needed. We only need
      to make a new search request if the query has changed since the last one.

      @method shouldSearch
      @param {Object} nextProps The next set of properties.
    */
    shouldSearch: function(nextProps) {
      if (!this.state.data || !this.state.data.text) {
        return true;
      }
      var nextQuery = JSON.stringify(nextProps.query),
          currentQuery = JSON.stringify(this.state.data.text);
      return nextQuery !== currentQuery;
    },

    getInitialState: function() {
      var state = this.generateState(this.props);
      state.waitingForSearch = false;
      return state;
    },

    componentDidMount: function() {
      this.searchRequest(this.props.query, this.props.tags);
    },

    componentWillUnmount: function() {
      this.searchXhr.abort();
    },

    componentWillReceiveProps: function(nextProps) {
      if (this.shouldSearch(nextProps)) {
        this.searchRequest(nextProps.query, this.props.tags);
      }
    },

    shouldComponentUpdate: function(nextProps, nextState) {
      return this.state.activeComponent !== 'loading' ||
          this.shouldSearch(nextProps) && !this.state.waitingForSearch;
    },

    /**
      Generates the state for the search results.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      var state = {
        activeComponent: nextProps.activeComponent || 'loading'
      };
      switch (state.activeComponent) {
        case 'loading':
          var generateChangeDescription = nextProps.generateChangeDescription ||
              this.props.generateChangeDescription;
          state.activeChild = {
            component: <div className="twelve-col initial-load-container last-col">
              <juju.components.Spinner />
            </div>
          };
        break;
        case 'search-results':
          var html = this.template(this.state.data);
          state.activeChild = {
            component: <div onClick={this._handleTemplateClicks}
              dangerouslySetInnerHTML={{__html: html}}>
            </div>
          };
        break;
      }
      return state;
    },

    /**
      Change the state to reflect the chosen component.

      @method _changeActiveComponent
      @param {String} newComponent The component to switch to.
    */
    _changeActiveComponent: function(newComponent) {
      var nextProps = this.state;
      nextProps.activeComponent = newComponent;
      this.setState(this.generateState(nextProps));
    },

    /**
      Handle any clicks inside the template and route them to the correct
      handler.

      @method _handleTemplateClicks
      @param {Object} e The click event
    */
    _handleTemplateClicks: function(e) {
      e.preventDefault();
      var target = e.target;
      var className = target.className;
      if (className.indexOf('list-block__entity-link') > -1) {
        this._handleEntityClick(target);
      }
    },

    /**
      Show the entity details when clicked.

      @method _handleEntityClick
      @param {Object} target The element that was clicked
    */
    _handleEntityClick: function(target) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'entity-details',
            id: target.getAttribute('data-id')
          }
        }
      });
    },

    /**
      Generate the base classes from on the props.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'search-results',
        this.props.inline ? '' : 'search-results--floating'
      );
    },

    render: function() {
      return (
        <div className={this._generateClasses()}>
          {this.state.activeChild.component}
        </div>
      );
    }
  });

}, '0.1.0', {requires: [
  'loading-spinner'
]});
