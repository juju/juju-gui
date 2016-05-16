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
    propTypes: {
      getName: React.PropTypes.func.isRequired
    },

    searchXhr: null,

     /**
      If it's the same charm but for different series, collapse into one
      entity. We do this by converting the list to an OrderedDict, keyed on
      the match criteria (name, owner, type). When there is a key collision,
      add the series to the exist entity. Using an OrderedDict (versus a
      normal dict) is important to preserve sorting.

      @method collapseSeries
      @param {Array} entities The entities in their uncollapsed state.
      @param {Function} getName The util for getting names from the charm ids.
      @returns {Array} The entities with collapsed series.
     */
    collapseSeries: function(entities, getName) {
      function entityKey(entity, getName) {
        return [
          getName(entity.id),
          entity.owner,
          entity.type,
          entity.promulgated
        ];
      }

      var collapsedEntities = {},
          orderedKeys = [];
      for (var i = 0, l = entities.length; i < l; i++) {
        var entity = entities[i],
            key = entityKey(entity, getName),
            series = entity.series,
            storeId = entity.storeId || '',
            value = {name: series, storeId: storeId};
        // If the key already exists, append the series to the existing list.
        if (collapsedEntities[key]) {
          var collapsed = collapsedEntities[key];
          // Aggregate downloads across different series.
          collapsed.downloads += entity.downloads || 0;
          // Add series to the list.
          collapsed.series.push(value);
          // Ensure that the most recent series is first.
          collapsed.series.sort(function(a, b) {
            // We want a reverse sort, so...
            if (a.name < b.name) {
              return 1;
            } else if (a.name > b.name) {
              return -1;
            } else {
              return 0;
            }
          });
          // De-dupe the series array.
          collapsed.series = collapsed.series.filter(function(s, pos, arry) {
            return !pos || s.name != arry[pos - 1].name;
          });
        } else {
          // Convert all series attributes in the entities to lists.
          if (series) {
            entity.series = [value];
          } else {
            entity.series = [];
          }
          // Ensure downloads are present.
          entity.downloads = entity.downloads || 0;
          collapsedEntities[key] = entity;
          // Save the key so we can preserve sort order.
          orderedKeys.push(key);
        }
        // Ensure that the IDs are properly set.
        var e = collapsedEntities[key];
        var defaultSeries = e.series[0];
        if (defaultSeries) {
          e.storeId = defaultSeries.storeId;
          e.id = `${defaultSeries.name}/${getName(e.id)}`;
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

      @method searchCallback
      @param {String} error An error message, or null if no error.
      @param {Array} rawResults The entity models returned by the search.
    */
    searchCallback: function(error, rawResults) {
      // Parse the raw results.
      if (error) {
        this._changeActiveComponent('error');
        console.log('Search request failed.');
        return;
      }
      var results = rawResults.map(function(result) {
        var model = this.props.makeEntityModel(result);
        return model.toEntity();
      }, this);
      var activeComponent;
      results = this.collapseSeries(results, this.props.getName);
      // Split the results into promulgated and normal.
      var promulgatedResults = [],
          normalResults = [];
      results.forEach(function(obj) {
        // Pass in a full id including the owner to allow looking up the entity.
        var ownerPath = `~${obj.owner}`,
            storeId = obj.storeId;
        // If the store ID is not set, or if it does not already have the
        // owner...
        if (!storeId || storeId.indexOf(ownerPath) < 0) {
          // And if the ID does not also have an owner...
          if (obj.id.indexOf(ownerPath) < 0) {
            // Construct a new store ID that has the owner.
            var strippedId = obj.id.replace('cs:', '');
            obj.storeId = `cs:${ownerPath}/${strippedId}`;
          } else {
            // Else use the existing ID (with owner) as the store ID.
            obj.storeId = obj.id;
          }
        }
        if (obj.promulgated) {
          promulgatedResults.push(obj);
        } else {
          normalResults.push(obj);
        }
      });
      if (results.length === 0) {
        activeComponent = 'no-results';
      } else {
        activeComponent = 'search-results';
      }
      var data = {
        text: this.props.query,
        solutionsCount: results.length,
        normalResultsCount: normalResults.length,
        normalResults: normalResults,
        promulgatedResultsCount: promulgatedResults.length,
        promulgatedResults: promulgatedResults
      };
      // These need to be set separately, seemingly due to a React quirk.
      this.setState({waitingForSearch: false});
      this.setState({data: data});
      this._changeActiveComponent(activeComponent);
    },

    /**
      Search the charmstore with the given filters.

      @method searchRequest
      @param {String} query The text to search for.
      @param {String} tags The tags to limit the search by.
      @param {String} sort The sort method.
      @param {String} series The series to filter by.
    */
    searchRequest: function(query, tags, type, sort, series, provides,
                            requires, owner) {
      var filters = {text: query, tags: tags};
      // Don't add the type property unless required otherwise the API will
      // filter by charm.
      if (type) {
        filters.type = type;
      }
      if (sort) {
        filters.sort = sort;
      }
      if (series) {
        filters.series = series;
      }
      if (provides) {
        filters.provides = provides;
      }
      if (requires) {
        filters.requires = requires;
      }
      if (owner) {
        filters.owner = owner;
      }
      this._changeActiveComponent('loading');
      this.setState({ waitingForSearch: true });
      this.searchXhr = this.props.charmstoreSearch(
        filters,
        this.searchCallback,
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
      return nextQuery !== currentQuery ||
          nextProps.type !== this.props.type ||
          nextProps.tags !== this.props.tags ||
          nextProps.series !== this.props.series ||
          nextProps.sort !== this.props.sort;
    },

    getInitialState: function() {
      var state = this.generateState(this.props);
      state.waitingForSearch = false;
      return state;
    },

    componentDidMount: function() {
      this.searchRequest(
          this.props.query, this.props.tags, this.props.type,
          this.props.sort, this.props.series, this.props.provides,
          this.props.requires, this.props.owner);
    },

    componentWillUnmount: function() {
      this.searchXhr.abort();
    },

    componentWillReceiveProps: function(nextProps) {
      if (this.shouldSearch(nextProps)) {
        this.searchRequest(nextProps.query, nextProps.tags, nextProps.type,
          nextProps.sort, nextProps.series, nextProps.provides,
          nextProps.requires, nextProps.owner);
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
      var currentType = nextProps.type !== undefined ?
          nextProps.type : this.props.type;
      switch (state.activeComponent) {
        case 'loading':
          state.activeChild = {
            component:
              <div className="twelve-col initial-load-container last-col">
                <juju.components.Spinner />
              </div>
          };
          break;
        case 'search-results':
          var data = this.state.data;
          var sortItems = [{
            label: 'Default',
            value: ''
          }, {
            label: 'Most popular',
            value: '-downloads'
          }, {
            label: 'Least popular',
            value: 'downloads'
          }, {
            label: 'Name (a-z)',
            value: 'name'
          }, {
            label: 'Name (z-a)',
            value: '-name'
          }, {
            label: 'Author (a-z)',
            value: 'owner'
          }, {
            label: 'Author (z-a)',
            value: '-owner'
          }];
          var seriesItems = [{
            label: 'All',
            value: ''
          }];
          var series = this.props.seriesList;
          var seriesMap = Object.keys(series).map((key) => {
            return {
              label: series[key].name,
              value: key
            };
          });
          seriesItems = seriesItems.concat(seriesMap);
          state.activeChild = {
            component:
              <div className="row no-padding-top">
                <div className="inner-wrapper list-block">
                  {this._generateResultsMessage(data.text, data.solutionsCount)}
                  <div className="list-block__filters">
                    <juju.components.SearchResultsTypeFilter
                      changeState={this.props.changeState}
                      currentType={currentType} />
                    <div className="six-col last-col">
                      <div className="list-block__filters--selects">
                        <form>
                          <juju.components.SearchResultsSelectFilter
                            changeState={this.props.changeState}
                            label="Sort by"
                            filter='sort'
                            items={sortItems}
                            currentValue={nextProps.sort || this.props.sort} />
                          <juju.components.SearchResultsSelectFilter
                            changeState={this.props.changeState}
                            label="Series"
                            filter='series'
                            items={seriesItems}
                            currentValue={
                                nextProps.series || this.props.series} />
                        </form>
                      </div>
                    </div>
                  </div>
                  <div className="entity-search-results">
                    {this._generateResultsList(
                      data.promulgatedResultsCount,
                      data.promulgatedResults, true)}
                    {this._generateResultsList(
                      data.normalResultsCount,
                      data.normalResults, false)}
                  </div>
                </div>
              </div>
          };
          break;
        case 'no-results':
          state.activeChild = {
            component:
              <div className="twelve-col no-results-container last-col">
                <h1 className="row-title">
                  Your search for <strong>{this.state.data.text}</strong>
                  {' '}
                  returned 0 results
                </h1>
                <p>
                  Try a more specific or different query, try other keywords or
                  learn how to
                  {' '}
                  <a href="http://jujucharms.com/docs/authors-charm-writing">
                    create your own solution
                  </a>.
                </p>
              </div>
          };
          break;
        case 'error':
          state.activeChild = {
            component:
              <div className="twelve-col no-results-container last-col">
                <h1 className="row-title">
                  Something went wrong
                </h1>
                <p>
                  For some reason the search failed. You could try searching at
                  {' '}
                  <a href="http://jujucharms.com/store">
                    http://jujucharms.com
                  </a>
                  {' '}or go{' '}
                  <span className="link"
                    onClick={this._handleBack}>
                    back
                  </span>.
                </p>
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
      Display a search results message if there is search text.

      @method _generateResultsMessage
      @param {String} text The search text.
      @param {Integer} solutionsCount The number of search results.
    */
    _generateResultsMessage: function(text, solutionsCount) {
      if (text) {
        return (
          <div className="twelve-col list-block__title no-margin-bottom">
            Your search for &lsquo;{text}&rsquo; returned {solutionsCount}{' '}
            results.
          </div>
        );
      }
      return;
    },

    /**
      Generate the classes for a results list.

      @method _generateListClasses
      @param {Boolean} promulgated Whether to add the promulgated class.
      @returns {String} The collection of class names.
    */
    _generateListClasses: function(promulgated) {
      return classNames(
        'list-block__list',
        {promulgated: promulgated}
      );
    },

    /**
      Handle navigating back.

      @method _handleBack
    */
    _handleBack: function() {
      window.history.back();
    },

    /**
      Generate the base classes from on the props.

      @method _generateResultsList
      @param {Integer} count The number of results.
      @param {Array} results The list of results.
      @param {Boolean} promulgated Whether to show a promulgated list.
      @returns {String} The collection of class names.
    */
    _generateResultsList: function(count, results, promulgated) {
      var title = promulgated ? 'Recommended' : 'Community';
      var items = [];
      var changeState = this.props.changeState;
      results.forEach(function(item) {
        items.push(
          <juju.components.SearchResultsItem
            changeState={changeState}
            key={item.storeId}
            item={item} />);
      });
      return (
        <div>
          <h4>
            {title} <span className="count">({count})</span>
          </h4>
          <ul className={this._generateListClasses(promulgated)}>
            {items}
          </ul>
        </div>
      );
    },

    render: function() {
      return (
        <div className="search-results">
          {this.state.activeChild.component}
        </div>
      );
    }
  });

}, '0.1.0', {requires: [
  'loading-spinner',
  'search-results-item',
  'search-results-select-filter',
  'search-results-type-filter'
]});
