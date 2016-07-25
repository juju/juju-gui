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
      children: React.PropTypes.func,
      EmptyComponent: React.PropTypes.func,
      ErrorComponent: React.PropTypes.func,
      timeout: React.PropTypes.number
    },

    _validStatuses: ['starting', 'ok', 'empty', 'error'],

    _childrenStatuses: {},

    _setChildStatus: function(ref, status) {
      if (this._validStatuses.indexOf(status) === -1) {
        throw `Invalid status: ${status} from ref: ${ref}`;
      }
      this._childrenStatuses[ref] = status;
    },

    render: function() {
      // Augment the children with the broadcastStatus method
      const children = React.Children.map(this.props.children, child => {
        const ref = child.ref;
        if (!ref) {
          throw `ref required but not supplied for component: ${child.type}`;
        }
        // Set the status for the child as null if it is new.
        if (!this._childrenStatuses[ref]) {
          this._childrenStatuses[ref] = null;
        }
        // Clone the child adding in the broadcastStatus prop.
        return React.cloneElement(child, {
          broadcastStatus: this._setChildStatus.bind(this, ref)
        });
      });

      return (
        <div>
          {children}
        </div>);
    }

  });

}, '0.1.0', {requires: []});
