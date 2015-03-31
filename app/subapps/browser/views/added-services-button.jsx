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

/*
  Added Services button view and extension.
*/
YUI.add('added-services-button', function(Y) {

  var ns = Y.namespace('juju.views');

  ns.AddedServicesButton = React.createClass({

    /**
      Handles calling `changeState` to update the application state.

      @method _clickHandler
    */
    _clickHandler: function() {
      this.props.changeState({
        sectionA: {
          component: this.props.closed ? 'services' : 'charmbrowser'
        }
      });
    },

    render: function() {
      var open = 'added-services-open',
          openHover = open + '-hover',
          close = 'added-services-close',
          closeHover = close + '-hover',
          sprite = 'sprite',
          classListNormal = [sprite, 'normal'],
          classListHover = [sprite, 'hover'];

      classListNormal.push(this.props.closed ? open : close);
      classListHover.push(this.props.closed ? openHover : closeHover);

      return (
        <div onClick={this._clickHandler}>
          Added Services ({this.props.serviceCount})
          <span className="action-indicator">
            <i className={classListNormal.join(' ')}></i>
            <i className={classListHover.join(' ')}></i>
          </span>
        </div>
      );
    }
  });

});
