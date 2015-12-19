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

YUI.add('entity-content-revisions', function() {

  juju.components.EntityContentRevisions = React.createClass({

    /**
      Get the current state of the revisions panel.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      var state = {
        showMore: false
      };
      return state;
    },

    /**
      Handle clicks on accordion. Toggles the concealed class on the list node
      which hides all the list items apart from the first.

      @method _handleAccordionClick
    */
    _handleAccordionClick: function(conceal) {
      this.setState({showMore: conceal});
    },

    /**
      Format ISO date/time to human readable format (2015-09-05).

      @method _formatDate
      @param {String} iso A date to be parsed.
    */
    _formatDate: function(iso) {
      var date = new Date(Date.parse(iso));
      date = date.getUTCFullYear() + '-' +
        ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
        ('0' + date.getUTCDate()).slice(-2);
      return date;
    },

    /**
      Generate the classname to apply based on the state.

      @method _generateRevisions
      @return {Object} The revisions markup.
    */
    _generateClassName: function() {
      return classNames(
        'revisions__list',
        {
          'list--concealed': !this.state.showMore
        }
      );
    },

    /**
      Generate the list of revisions.

      @method _generateRevisions
      @return {Object} The revisions markup.
    */
    _generateRevisions: function() {
      var components = [];
      var revisions = this.props.revisions;
      revisions.forEach((revision) => {
        var date = this._formatDate(revision.date);
        components.push(
          <li className="revisions__list-item list-item" key={revision.revno}>
            <p className="revisions__list-meta smaller">
              by {revision.authors[0].name}
              <span className="revisions__list-meta-date">
                {date}
              </span>
            </p>
            <p className="revisions__list-message">
              {revision.message}
            </p>
          </li>
        );
      }, this);
      return components;
    },

    render: function() {
      var revisions = this.props.revisions;
      var revisionsCount = revisions.length;
      return (
        <div className="revisions section" id="revisions">
          <h3 className="section__title">{revisionsCount} Revisions</h3>
          <ol className={this._generateClassName()} ref="list" reversed>
            {this._generateRevisions()}
            <li className="list__controls">
              <a href="" className="btn__see--more"
                onClick={this._handleAccordionClick.bind(
                  this, true)}>See more</a>
              <a href="#revisions" className="btn__see--less"
                onClick={this._handleAccordionClick.bind(
                  this, false)}>See less</a>
            </li>
          </ol>
        </div>
      );
    }
  });

}, '0.1.0', {requires: []});
