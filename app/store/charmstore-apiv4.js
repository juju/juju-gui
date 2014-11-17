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


YUI.add('charmstore-apiv4', function(Y) {

  /**
    Implementation of the charmstore v4 api.

    @class APIv4
  */
  function APIv4(config) {
    this.charmstoreURL = config.charmstoreURL;
  }

  APIv4.prototype = {
    /**
      Returns the correct path for a charm or bundle icon provided an id and
      whether or not it is a bundle.

      @method getIconPath
      @param {String} charmId The id of the charm to fetch the icon for.
      @param {Boolean} isBundle Whether or not this is an icon for a bundle.
      @return {String} The URL of the charm's icon.
    */
    getIconPath: function(charmId, isBundle) {
      var path;
      if (charmId.indexOf('local:') > -1) {
        path = '/juju-ui/assets/images/non-sprites/charm_160.svg';
      } else if (typeof isBundle === 'boolean' && isBundle) {
        path = '/juju-ui/assets/images/non-sprites/bundle.svg';
      } else {
        // Get the charm ID from the service.  In some cases, this will be
        // the charm URL with a protocol, which will need to be removed.
        // The following regular expression removes everything up to the
        // colon portion of the quote and leaves behind a charm ID.
        charmId = charmId.replace(/^[^:]+:/, '');
        // Note that we make sure isBundle is Boolean. It's coming from a
        // handlebars template helper which will make the second argument the
        // context object when it's not supplied. We want it optional for
        // normal use to default to the charm version, but if it's a boolean,
        // then check that boolean because the author cares specifically if
        // it's a bundle or not.
        path = this.charmstoreURL + [charmId, 'icon.svg'].join('/');
      }
      return path;
    }
  };

  Y.namespace('juju.charmstore').APIv4 = APIv4;

});
