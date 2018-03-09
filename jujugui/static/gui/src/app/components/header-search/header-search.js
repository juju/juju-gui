/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const SvgIcon = require('../svg-icon/svg-icon');

class HeaderSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      query: this._getSearchQuery(),
      active: this._activeForComponent()
    };
  }

  /**
    Grabs the metadata search query from the app state and returns it.
    @method _getSearchQuery
    @returns {String} The search query.
  */
  _getSearchQuery() {
    const current = this.props.appState.current;
    return current.search && current.search.text || '';
  }

  /**
    Based on the current state this will return true or false
    if this component is to be in its active state.

    @method _activeForComponent
  */
  _activeForComponent() {
    const state = this.props.appState.current;
    return state.store === '' ||
            state.store !== undefined || state.search !== undefined;
  }

  /**
    Update the state when the app state changes.

    @method componentWillReceiveProps
  */
  componentWillReceiveProps() {
    // Need to check if there is a change to the state and if it has been
    // cleared (store/search results have been closed) then we also need
    // to deactivate the search box.
    const query = this._getSearchQuery();
    if (this._activeForComponent()) {
      this._openSearch();
      // The UI never needs to open the search box and also clear the text in
      // it. Without this check the entered text would be cleared if there was
      // a rerender while typing (before hitting enter).
      if (query !== '') {
        this.setState({query: query});
      }
    } else {
      this._closeSearch();
      this.setState({query: query});
    }
  }

  componentDidUpdate() {
    if (!this.state.active) {
      this.refs.searchInput.blur();
    }
  }

  /**
    Generate the base classes based on the props.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    return classNames(
      'header-search', {
        'header-search--active': this.state.active
      });
  }

  /**
    Generate the close button classes based on the props.

    @method _closeClasses
    @returns {String} The collection of class names.
  */
  _closeClasses() {
    return classNames(
      'header-search__close', {
        hidden: !this.state.active
      });
  }

  /**
    Handle the search input receiving focus.

    @method _handleSearchFocus
  */
  _handleSearchFocus() {
    if (!this.state.active && !this.state.query) {
      const appState = this.props.appState;
      const newState = {
        user: null,
        profile: null,
        gui: {
          machines: null
        }
      };
      // Open the base store page if it is not already displaying an entity.
      if (!appState.current.store) {
        newState.store = '';
      }
      if (!appState.current.model) {
        newState.root = 'new';
      }
      appState.changeState(newState);
    }
    // Opening the search needs to be after the above condition as it modifies
    // the active state which the above condition needs to check.
    this._openSearch();
  }

  /**
    Open the search box.
  */
  _openSearch() {
    this.setState({active: true});
    this.refs.searchInput.focus();
  }

  /**
    Close the search box.

    @method _closeSearch
  */
  _closeSearch() {
    this.setState({
      query: '',
      active: false
    });
  }

  /**
    Make search when the search form is submitted.

    @method _handleSubmit
    @param {Object} evt The submit event
  */
  _handleSubmit(evt) {
    evt.preventDefault();
    // If the search box is not open then instead of submitting the form the
    // search box should be opened.
    if (!this.state.active) {
      this._openSearch();
      return;
    }
    const query = this.state.query.trim();
    this.props.appState.changeState({
      hash: null,
      root: null,
      search: {
        owner: null,
        provides: null,
        requires: null,
        series: null,
        tags: null,
        text: query === '' ? null : query,
        type: null
      },
      store: query === '' ? '' : null
    });
  }

  /**
    Close the header and clear the state when the button is clicked.

    @method _handleClose
  */
  _handleClose() {
    this._closeSearch();
    this.props.appState.changeState({
      hash: null,
      store: null,
      search: null
    });
  }

  /**
    Update the state from the value of the query input.

    @method _handleQueryChange
    @param {Object} e The input change event
  */
  _handleQueryChange(e) {
    this.setState({query: e.currentTarget.value});
  }

  /**
    Navigate to the store when the button is clicked.

    @method _handleStoreClick
    @param {Object} e The click event
  */
  _handleStoreClick(e) {
    this.setState({query: ''});
    this.props.appState.changeState({
      store: ''
    });
  }

  render() {
    return (
      <div className={this._generateClasses()} ref="headerSearchContainer">
        <form className="header-search__form">
          <button className="header-search__submit"
            onClick={this._handleSubmit.bind(this)}
            type="submit">
            <SvgIcon name="search_16"
              size="16" />
          </button>
          <input className="header-search__input" name="query"
            onChange={this._handleQueryChange.bind(this)}
            onFocus={this._handleSearchFocus.bind(this)}
            placeholder="Search the store"
            ref="searchInput"
            style={this.state.inputStyles}
            type="search"
            value={this.state.query} />
        </form>
        <span
          className="header-search__search--mobile"
          onClick={this._handleStoreClick.bind(this)}
          role="button"
          tabIndex="0">
          <span className="header-search__store-icon">
            <SvgIcon name="search_16"
              size="16" />
          </span>
        </span>
        <span className={this._closeClasses()} onClick={this._handleClose.bind(this)}
          role="button"
          tabIndex="0">
          <SvgIcon name="close_16"
            size="16" />
        </span>
      </div>
    );
  }
};

HeaderSearch.propTypes = {
  appState: PropTypes.object.isRequired
};

module.exports = HeaderSearch;
