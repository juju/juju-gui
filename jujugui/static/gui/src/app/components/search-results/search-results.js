/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const GenericButton = require('../generic-button/generic-button');
const SearchResultsItem = require('./item/item');
const SearchResultsSelectFilter = require('./select-filter/select-filter');
const SearchResultsTypeFilter = require('./type-filter/type-filter');
const Spinner = require('../spinner/spinner');

class SearchResults extends React.Component {
  constructor(props) {
    super(props);
    this.searchXhr = null;
    var state = this._generateState(this.props);
    state.waitingForSearch = false;
    this.state = state;
  }

  componentDidMount() {
    const query = this.props.query ? ` for: ${this.props.query}` : '';
    this.props.setPageTitle(`Search results${query}`);
    this._searchRequest(
      this.props.query, this.props.tags, this.props.type,
      this.props.sort, this.props.series, this.props.provides,
      this.props.requires, this.props.owner);
  }

  componentWillUnmount() {
    this.searchXhr.abort();
  }

  componentWillReceiveProps(nextProps) {
    if (this._shouldSearch(nextProps)) {
      this._searchRequest(nextProps.query, nextProps.tags, nextProps.type,
        nextProps.sort, nextProps.series, nextProps.provides,
        nextProps.requires, nextProps.owner);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.activeComponent !== 'loading' ||
        this._shouldSearch(nextProps) && !this.state.waitingForSearch;
  }

  /**
    If it's the same charm but for different series, collapse into one
    entity. We do this by converting the list to an OrderedDict, keyed on
    the match criteria (name, owner, type). When there is a key collision,
    add the series to the exist entity. Using an OrderedDict (versus a
    normal dict) is important to preserve sorting.

    @method _collapseSeries
    @param {Array} entities The entities in their uncollapsed state.
    @param {Function} getName The util for getting names from the charm ids.
    @returns {Array} The entities with collapsed series.
   */
  _collapseSeries(entities, getName) {
    function entityKey(entity, getName) {
      return [
        // Some ids include "cs:", so normalise the ids for comparison.
        getName(entity.id.replace('cs:', '')),
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

      if (Array.isArray(series)) {
        // This is a multi-series charm so we don't need to do any collapsing.
        // The series data structure is modified in the non-multi series
        // charms so this formats the series to match.
        entity.series = series.map(
          name => ({ name: name, storeId: entity.id }));
        collapsedEntities[key] = entity;
        orderedKeys.push(key);
        continue;
      }

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
      }
    }
    // Now convert that object back to an ordered list and return it.
    var returnedEntities = [];
    for (var i = 0, l = orderedKeys.length; i < l; i++) {
      var k = orderedKeys[i];
      returnedEntities.push(collapsedEntities[k]);
    }
    return returnedEntities;
  }

  /**
    Handle successful searches by updating internal state with the results.

    @method _searchCallback
    @param {String} error An error message, or null if no error.
    @param {Array} rawResults The entity models returned by the search.
  */
  _searchCallback(error, rawResults) {
    // Parse the raw results.
    if (error) {
      this._changeActiveComponent('error');
      console.error('Search request failed.', error);
      return;
    }
    var results = rawResults.map(function(result) {
      var model = this.props.makeEntityModel(result);
      return model.toEntity();
    }, this);
    var activeComponent;
    results = this._collapseSeries(results, this.props.getName);
    // Split the results into promulgated and normal.
    var promulgatedResults = [],
        communityResults = [];
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
        communityResults.push(obj);
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
      communityResults: communityResults,
      promulgatedResults: promulgatedResults
    };
    // These need to be set separately, seemingly due to a React quirk.
    this.setState({waitingForSearch: false});
    this.setState({data: data});
    this._changeActiveComponent(activeComponent);
  }

  /**
    Search the charmstore with the given filters.

    @method _searchRequest
    @param {String} query The text to search for.
    @param {String} tags The tags to limit the search by.
    @param {String} sort The sort method.
    @param {String} series The series to filter by.
  */
  _searchRequest(query, tags, type, sort, series, provides,
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
    // If there is an existing search request then abort it before starting
    // the new search.
    if (this.searchXhr) {
      this.searchXhr.abort();
    }
    this.searchXhr = this.props.charmstoreSearch(
      filters,
      this._searchCallback.bind(this),
      150);
  }

  /**
    Determines whether an API search request is actually needed. We only need
    to make a new search request if the query has changed since the last one.

    @method _shouldSearch
    @param {Object} nextProps The next set of properties.
  */
  _shouldSearch(nextProps) {
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
  }

  /**
    Generates the state for the search results.

    @method _generateState
    @param {Object} nextProps The props which were sent to the component.
    @return {Object} A generated state object which can be passed to setState.
  */
  _generateState(nextProps) {
    var state = {
      activeComponent: nextProps.activeComponent || 'loading',
      showCommunity: nextProps.showCommunity || false
    };
    var currentType = nextProps.type !== undefined ?
      nextProps.type : this.props.type;
    switch (state.activeComponent) {
      case 'loading':
        state.activeChild = {
          component:
            <div className="twelve-col initial-load-container last-col">
              <Spinner />
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
        var seriesMap = Object.keys(series).map(key => {
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
                  <SearchResultsTypeFilter
                    changeState={this.props.changeState}
                    currentType={currentType} />
                  <div className="six-col last-col">
                    <div className="list-block__filters--selects">
                      <form>
                        <SearchResultsSelectFilter
                          changeState={this.props.changeState}
                          currentValue={nextProps.sort || this.props.sort}
                          filter='sort'
                          items={sortItems}
                          label="Sort by" />
                        <SearchResultsSelectFilter
                          changeState={this.props.changeState}
                          currentValue={
                            nextProps.series || this.props.series}
                          filter='series'
                          items={seriesItems}
                          label="Series" />
                      </form>
                    </div>
                  </div>
                </div>
                <div className="entity-search-results">
                  {this._generateResultsList(
                    data.promulgatedResults, data.communityResults)}
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
                  onClick={this._handleBack.bind(this)}>
                  back
                </span>.
              </p>
            </div>
        };
        break;
    }
    return state;
  }

  /**
    Change the state to reflect the chosen component.

    @method _changeActiveComponent
    @param {String} newComponent The component to switch to.
  */
  _changeActiveComponent(newComponent) {
    var nextProps = this.state;
    nextProps.activeComponent = newComponent;
    this.setState(this._generateState(nextProps));
  }

  /**
    Display a search results message if there is search text.

    @method _generateResultsMessage
    @param {String} text The search text.
    @param {Integer} solutionsCount The number of search results.
  */
  _generateResultsMessage(text, solutionsCount) {
    if (text) {
      return (
        <div className="twelve-col list-block__title no-margin-bottom">
          Your search for &lsquo;{text}&rsquo; returned {solutionsCount}{' '}
          results.
        </div>
      );
    }
    return;
  }

  /**
    Handle navigating back.

    @method _handleBack
  */
  _handleBack() {
    window.history.back();
  }

  /**
    Generate the promulgated search results list.

    @param {Array} promulgated The list of promulgated results.
    @return {Object} JSX div containing heading and list.
  */
  _generatePromulgatedResults(promulgated) {
    return (<div className="clearfix promulgated-results">
      <h4>Recommended <span className="count">
        ({promulgated.length})
      </span></h4>
      <ul className="list-block__list">
        {promulgated.map((item, i) => (
          <SearchResultsItem
            acl={this.props.acl}
            addToModel={this.props.addToModel}
            changeState={this.props.changeState}
            generatePath={this.props.generatePath}
            item={item}
            key={item.storeId + i} />))}
      </ul>
    </div>);
  }

  /**
    Toggles the visibility of community results.
  */
  _toggleCommunityResults() {
    let state = this.state;
    state.showCommunity = !this.state.showCommunity;
    this.setState(this._generateState(state));
  }

  /**
    Generate community search results list.

    @param {Array} community The array of community results.
    @param {Boolean} hasPromulgated Do promulgated results exist?
    @return {Object} JSX div containing toggle button, header and list.
  */
  _generateCommunityResults(community, hasPromulgated) {
    const holderClasses = classNames(
      'clearfix',
      {
        'hidden': !this.state.showCommunity && hasPromulgated
      });
    const buttonTitle = this.state.showCommunity ?
      'Hide community results' : `Show ${community.length} community results`;
    const button = hasPromulgated ? (
      <div className="button-wrapper--ruled">
        <GenericButton
          action={this._toggleCommunityResults.bind(this)}
          extraClasses="show-community-button"
          type="inline-neutral">
          {buttonTitle}
        </GenericButton>
      </div>) : null;
    return (<div className="clearfix community-results">
      {button}
      <div className={holderClasses}>
        <h4>Community <span className="count">
          ({community.length})
        </span></h4>
        <ul className="list-block__list">
          {community.map((item, i) => (
            <SearchResultsItem
              acl={this.props.acl}
              addToModel={this.props.addToModel}
              changeState={this.props.changeState}
              generatePath={this.props.generatePath}
              item={item}
              key={item.storeId + i} />))}
        </ul>
      </div>
    </div>);
  }

  /**
    Generate the base classes from on the props.

    @method _generateResultsList
    @param {Integer} count The number of results.
    @param {Array} results The list of results.
    @param {Boolean} promulgated Whether to show a promulgated list.
    @returns {String} The collection of class names.
  */
  _generateResultsList(promulgated, community) {
    const hasPromulgated = promulgated.length > 0;
    const hasCommunity = community.length > 0;
    return (
      <div>
        {hasPromulgated ?
          this._generatePromulgatedResults(promulgated) : null}
        {hasCommunity ?
          this._generateCommunityResults(community, hasPromulgated) : null}
      </div>);
  }

  render() {
    return (
      <div className="search-results">
        {this.state.activeChild.component}
      </div>
    );
  }
};

SearchResults.propTypes = {
  acl: PropTypes.object.isRequired,
  addToModel: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstoreSearch: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  getName: PropTypes.func.isRequired,
  makeEntityModel: PropTypes.func.isRequired,
  owner: PropTypes.string,
  provides: PropTypes.string,
  query: PropTypes.string,
  requires: PropTypes.string,
  series: PropTypes.string,
  seriesList: PropTypes.object.isRequired,
  setPageTitle: PropTypes.func.isRequired,
  sort: PropTypes.string,
  tags: PropTypes.string,
  type: PropTypes.string
};

module.exports = SearchResults;
