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


YUI.add('request-series-inspector', function(Y) {
  var ns = Y.namespace('juju.views'),
      viewlets = Y.namespace('juju.viewlets');

  var name = 'request-series-inspector';

  ns.RequestSeriesInspector = Y.Base.create(name, ns.Inspector, [], {

    views: {
      requestSeries: Y.juju.viewlets.RequestSeries
    },

    /**
      This setup method is called by the viewlet manager base class on render.

      @method setupUI
    */
    setupUI: function() {
      this.views.requestSeries.setAttrs({
        file: this.get('file'),
        env: this.get('env'),
        db: this.get('db')
      });
      this.views.requestSeries.addTarget(this);
    }

  }, {
    ATTRS: {
      /**
        The file object that was dropped on the canvas.

        @attribute file
        @type {Object}
      */
      file: {},
      /**
        Reference to the applications env object.

        @attribute env
        @type {Object}
      */
      env: {},
      /**
        Reference to the applications db object

        @attribute db
        @type {Object}
      */
      db: {}
    }
  });

}, '', {
  requires: [
    'viewlet-view-base',
    'inspector-base',
    'request-series-view'
  ]
});
