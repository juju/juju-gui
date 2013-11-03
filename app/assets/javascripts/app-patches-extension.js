/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2013 Canonical Ltd.

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

YUI.add('app-patches-extension', function(Y) {

  /**
    If a method in the App needs to be monkey patched for
    whatever reason it should go here ot make it easy to find.

     @class Patches
     @extension App
   */
  function Patches() {}

  Patches.prototype = {

    /**
      Monkey patch for the _isLinkSameOrigin method in YUI's pjax.base

      This method does not work correctly in IE10 in YUI 3.11 - It incorrectly
      determines that the 'upgrade service' links point to a different domain
      and because of this does not allow pjax to handle the routing. We should
      revisit this when we upgrade YUI to see if it has been fixed so this
      can be removed.
    */
    _isLinkSameOrigin: function() {
      return true;
    }

  };

  Y.namespace('juju').Patches = Patches;

});
