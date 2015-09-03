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

YUI.add('panel-component', function() {

  juju.components.Panel = React.createClass({

    /**
      Returns the supplied classes with the 'active' class applied if the
      component is the one which is active.

      @method _generateClasses
      @param {String} section The section you want to check if it needs to be
        active.
      @returns {String} The collection of class names.
    */
    _genClasses: function(section) {
      return classNames(
        'panel-component',
        this.props.instanceName,
        {
          hidden: this.props.services.length === 0
        }
      );
    },

    render: function() {
      return (
        <div className={this._genClasses()}>
          <juju.components.AddedServicesList
            services={this.props.services} />
        </div>
      );
    }

  });

}, '0.1.0', { requires: [
  'added-services-list'
]});
