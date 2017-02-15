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

YUI.add('section-load-watcher', function(Y) {

  juju.components.SectionLoadWatcher = React.createClass({

    propTypes: {
      // The eslint propType sorting requires that capital letters come
      // before lower case.
      EmptyComponent: React.PropTypes.object,
      ErrorComponent: React.PropTypes.object,
      children: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.array
      ]),
      timeout: React.PropTypes.number
    },

    getInitialState: function() {
      this._childrenStatuses = new Map();
      return {
        renderEmpty: false,
        renderError: false
      };
    },

    _validStatuses: ['starting', 'ok', 'empty', 'error'],

    /**
      When a child status has been updated we need to loop through all of
      the available statuses to see if they are all 'empty', 'error', or
      if the timeout has been hit to then decide which component to show.

      @method _checkChildrenStatuses
    */
    _checkChildrenStatuses: function() {
      const total = React.Children.count(this.props.children);
      let statuses = {};
      this._childrenStatuses.forEach((status, ref) => {
        if (!Number.isInteger(statuses[status])) {
          statuses[status] = 0;
        }
        statuses[status] += 1;
      });
      if (statuses.empty === total) {
        this.setState({renderEmpty: true});
      }
      if (statuses.error === total) {
        this.setState({renderError: true});
      }
    },

    /**
      Sets the child status in the component and then checks all the statuses
      to see if we should be rendering an error or empty component.

      @method _setChildStatus
      @param {String} ref The ref of the child.
      @param {String} status The status of the child.
    */
    _setChildStatus: function(ref, status) {
      if (this._validStatuses.indexOf(status) === -1) {
        throw `Invalid status: "${status}" from ref: ${ref}`;
      }
      this._childrenStatuses.set(ref, status);
      this._checkChildrenStatuses();
    },

    /**
      Checks the state of the component to determine whether it should
      render the empty, error, or children components.

      @method _renderContent
    */
    _renderContent: function() {
      const props = this.props;
      let hasNewChildren = false;
      if (this._childrenStatuses) {
        hasNewChildren = props.children.length !== this._childrenStatuses.size;
      }
      if (this.state.renderEmpty && !hasNewChildren) {
        return props.EmptyComponent;
      } else if (this.state.renderError && !hasNewChildren) {
        return props.ErrorComponent;
      } else {
        // Augment the children with the broadcastStatus method
        const children = React.Children.map(props.children, child => {
          const ref = child.ref;
          if (!ref) {
            throw 'ref required but not supplied for component';
          }
          // Set the status for the child as null if it is new.
          if (!this._childrenStatuses.has(ref)) {
            this._childrenStatuses.set(ref, null);
          }
          // Clone the child adding in the broadcastStatus prop.
          return React.cloneElement(child, {
            broadcastStatus: this._setChildStatus.bind(this, ref)
          });
        });

        return children;
      }
    },

    render: function() {
      return (
        <div>
          {this._renderContent()}
        </div>);
    }

  });

}, '0.1.0', {requires: []});
