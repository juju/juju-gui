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

YUI.add('bundle-importer', function(Y) {

  var ns = Y.namespace('juju');

  /**
    Bundle importer class handles importing bundles in YAML and dry-run
    formats from files or over the wire.

    @method BundleImporter
    @constructor
  */
  function BundleImporter(cfg) {
    this.env = cfg.env;
  };

  BundleImporter.prototype = {

    /**
      Import a bundle YAML into the current environment.

      @method importBundleYAML
    */
    importBundleYAML: function() {},

    /**
      Import bundle YAML or dry-run files.

      @method importBundleFiles
    */
    importBundleFiles: function() {},

    /**
      Fetch the dry-run output from the Deployer.

      @method fetchDryRun
    */
    fetchDryRun: function() {},

    /**
      Loops through the dry-run structure.

      @method _processDryRun
    */
    _processDryRun: function() {}

  };

  ns.BundleImporter = BundleImporter;

}, '', {
  requires: [
    'juju-env-go',
    'environment-change-set'
  ]
});
