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

YUI.add('store', function() {

  juju.components.Store = React.createClass({

    render: function() {
      return (
        <div className="store">
          <juju.components.MidPoint
            changeState={this.props.changeState}
            outsideClickClose={false}
            storeOpen={true} />
          <juju.components.SearchResults
            changeState={this.props.changeState}
            charmstoreSearch={this.props.charmstoreSearch}
            inline={true}
            query="" />
        </div>
      );
    }
  });

}, '0.1.0', { requires: [
    'mid-point'
]});
