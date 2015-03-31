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
YUI.add('added-services-button-extension', function(Y) {

  var views = Y.namespace('juju.views');

  /**
    Adds the added services button render method.

    @method AddedServicesButtonExtension
  */
  function AddedServicesButtonExtension() {}

  AddedServicesButtonExtension.prototype = {

    /**
      We need to emit a changeState event but the components cannot do it
      because they are not part of the YUI ecosystem. We will eventually
      phase out the changeState event in favour of a callable throughout the
      entire app as time goes on.

      @method __changeState
    */
    __changeState: function(data) {
      this.fire('changeState', data);
    },

    /**
      Renders the added services button to the element in the parents container
      with the class 'added-services-button '.'

      @method _renderAddedServicesButton
    */
    _renderAddedServicesButton: function(serviceCount, closed) {
      var container = this.get('container')
                          .one('.added-services-button')
                          .getDOMNode();
      // According to the docs re-rendering the component does not have a
      // negative performance hit. It acts as if one is calling 'setState()'
      // but provides a much simpler api.
      React.render(
          <views.AddedServicesButton
            serviceCount={serviceCount}
            closed={closed}
            changeState={this.__changeState.bind(this)}/>, container);
    }
  };

  views.AddedServicesButtonExtension = AddedServicesButtonExtension;


});
