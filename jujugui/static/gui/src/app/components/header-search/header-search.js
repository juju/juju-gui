/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('header-search', function() {

  juju.components.HeaderSearch = React.createClass({

    /**
      Get the current state of the header search.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      var component = this.props.getAppState(
        'current', 'sectionC', 'component');
      var metadata = this.props.getAppState('current', 'sectionC', 'metadata');
      var active = !!component;

      return {
        query: metadata && metadata.search,
        active: active,
        inputStyles: this._generateInputStyles(active)
      };
    },

    /**
      Update the state when the app state changes.

      @method componentWillReceiveProps
    */
    componentWillReceiveProps: function() {
      // Need to check if there is a change to sectionC and if it has been
      // cleared (mid-point/search results have been closed) then we also need
      // to deactivate the search box.
      var component = this.props.getAppState(
        'current', 'sectionC', 'component');
      if (component) {
        this._openSearch();
      } else {
        this._closeSearch();
      }
    },

    /**
      Generate the base classes based on the props.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'header-search',
        'ignore-react-onclickoutside',
        this.state.active ? 'header-search--active' : ''
      );
    },

    /**
      Generate the close button classes based on the props.

      @method _closeClasses
      @returns {String} The collection of class names.
    */
    _closeClasses: function() {
      return classNames(
        'header-search__close',
        {
          hidden: !this.state.active
        }
      );
    },

    /**
      Handle the search input receiving focus.

      @method _handleSearchFocus
    */
    _handleSearchFocus: function() {
      if (!this.state.active && !this.state.query) {
        this._openSearch();
        this.props.changeState({
          sectionC: {
            component: 'charmbrowser',
            metadata: {
              activeComponent: 'mid-point'
            }
          }
        });
      }
    },

    /**
      Open the search box.

      @method _openSearch
    */
    _openSearch: function() {
      this.setState({
        active: true,
        inputStyles: this._generateInputStyles(true)
      });
    },

    /**
      Close the search box.

      @method _closeSearch
    */
    _closeSearch: function() {
      this.setState({
        query: undefined,
        active: false,
        inputStyles: this._generateInputStyles(false)
      });
    },

    /**
      Set the width of the input based on the window size.

      @method _generateInputStyles
      @param {Boolean} active Set the width only if it active
      @returns {Object} The object of styles
    */
    _generateInputStyles: function(active) {
      var styles = {};
      if (active) {
        styles.width = (window.innerWidth * 0.40) + 'px';
      }
      return styles;
    },

    /**
      Make search when the search form is submitted.

      @method _handleSubmit
      @param {Object} e The submit event
    */
    _handleSubmit: function(e) {
      e.preventDefault();
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'search-results',
            search: this.state.query
          }
        }
      });
    },

    /**
      Close the header and sectionC when the button is clicked.

      @method _handleClose
    */
    _handleClose: function() {
      this._closeSearch();
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: null
        }
      });
    },

    /**
      Update the state from the value of the query input.

      @method _handleQueryChange
      @param {Object} e The input change event
    */
    _handleQueryChange: function(e) {
      this.setState({query: e.currentTarget.value});
    },

    /**
      Navigate to the store when the button is clicked.

      @method _handleStoreClick
      @param {Object} e The click event
    */
    _handleStoreClick: function(e) {
      this.props.changeState({
        sectionC: {
          component: 'charmbrowser',
          metadata: {
            activeComponent: 'store'
          }
        }
      });
    },

    render: function() {
      return (
        <div className={this._generateClasses()} ref="headerSearchContainer">
          <form className="header-search__form">
            <button type="submit"
              onClick={this._handleSubmit}
              className="header-search__submit">
              <juju.components.SvgIcon name="search_16"
                size="16" />
            </button>
            <input type="search" name="query"
              className="header-search__input"
              placeholder="Search the store"
              value={this.state.query}
              onChange={this._handleQueryChange}
              onFocus={this._handleSearchFocus}
              style={this.state.inputStyles}
              ref="searchInput"/>
          </form>
          <span tabIndex="0" role="button"
            onClick={this._handleStoreClick}
            className="header-search__store">
            <span className="header-search__store-icon">
              <juju.components.SvgIcon name="store_22"
                size="20" />
            </span>
            Store
          </span>
          <span tabIndex="0" role="button"
            className={this._closeClasses()}
            onClick={this._handleClose}
            ref="closeButton">
            <juju.components.SvgIcon name="close_16"
              size="16" />
          </span>
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
  'svg-icon'
]});
