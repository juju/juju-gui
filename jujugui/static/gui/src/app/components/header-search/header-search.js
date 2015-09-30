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
    icons: {
      submit: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class="search-icon__image"><g transform="matrix(.667 0 0 .667 -74.667 -285.575)"><path d="M129.93 444.03l-2.27 2.275 6.07 6.07L136 450.1z" fill="#878787"></path><ellipse ry="9.479" rx="9.479" cy="438.862" cx="122.5" fill="none" stroke="#878787" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></ellipse></g></svg>',  // eslint-disable-line max-len
      store: '<svg class="store-button__image" xmlns="http://www.w3.org/2000/svg" width="21" height="18" viewBox="0 0 21 18"><path d="M18.1 12.11H6.19l-1.39.01L3.71 1.38H.86V0h4.1l.46 4.14h15.46l-2.78 7.97zM5.62 5.56l.45 5.14H17.14l1.64-5.14H5.62zm1.5 8.3c1.15 0 2.08.93 2.08 2.07 0 1.14-.93 2.07-2.08 2.07-1.16 0-2.09-.93-2.09-2.07 0-1.14.93-2.07 2.09-2.07zm8.9 0c1.15 0 2.08.93 2.08 2.07 0 1.14-.93 2.07-2.08 2.07-1.16 0-2.09-.93-2.09-2.07 0-1.14.93-2.07 2.09-2.07z" fill="#878787"></path></svg>',  // eslint-disable-line max-len
      close: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" class="search-close__image"><g color="#000" fill="none"><path d="M2.538 2.63l11.006 11.006M13.544 2.63L2.538 13.637" overflow="visible" stroke="#878787" stroke-width="2"></path></g></svg>'  // eslint-disable-line max-len
    },

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
      Generate the base classes based on the props.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      return classNames(
        'header-search',
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
        this.setState({
          active: true,
          inputStyles: this._generateInputStyles(true)
        });
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
      Handle the search input losing focus.

      @method _handleSearchClose
    */
    _handleSearchClose: function() {
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
            text: this.state.query
          }
        }
      });
    },

    /**
      Close the header and sectionC when the button is clicked.

      @method _handleClose
    */
    _handleClose: function() {
      this._handleSearchClose();
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

    render: function() {
      return (
        <div className={this._generateClasses()}>
          <form className="header-search__form">
            <button type="submit"
              onClick={this._handleSubmit}
              className="header-search__submit"
              dangerouslySetInnerHTML={{__html: this.icons.submit}} />
            <input type="search" name="query"
              className="header-search__input"
              placeholder="Search the store"
              value={this.state.query}
              onChange={this._handleQueryChange}
              onFocus={this._handleSearchFocus}
              style={this.state.inputStyles} />
          </form>
          <span tabIndex="0" role="button"
            className="header-search__store">
            <span dangerouslySetInnerHTML={{__html: this.icons.store}}
              className="header-search__store-icon" />
            Store
          </span>
          <span tabIndex="0" role="button"
            className={this._closeClasses()}
            onClick={this._handleClose}
            dangerouslySetInnerHTML={{__html: this.icons.close}} />
        </div>
      );
    }
  });

}, '0.1.0', { requires: []});
