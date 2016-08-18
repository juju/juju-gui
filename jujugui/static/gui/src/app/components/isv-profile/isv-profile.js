/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

/*
The ISV profile component renders a venders profile with stats based on there
charms and bundles. You can only see this page is you have access.
*/

'use strict';

YUI.add('isv-profile', function() {

  juju.components.ISVProfile = React.createClass({
    propTypes: {
    },

    render: function() {
      return (
        <juju.components.Panel
          instanceName="isv-profile"
          visible={true}>
          <div className="twelve-col">
            <div className="inner-wrapper">
              <div className="isv-profile__header">
                <h1>ISV Profile</h1>
              </div>
            </div>
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '', {
  requires: [
    'panel-component',
  ]
});
