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

const BundleExporter = require('./bundle-exporter');

describe('bundle exporter', () => {
  let bundleExporter, db, models;

  beforeAll(done => {
    YUI(GlobalConfig).use([], Y => {
      window.yui = Y;
      require('../yui-modules');
      window.yui.use(window.MODULES, function() {
        models = window.yui.namespace('juju.models');
        models._getECS = sinon.stub().returns({changeSet: {}});
        done();
      });
    });
  });

  beforeEach(() => {
    db = new models.Database({getECS: sinon.stub().returns({changeSet: {}})});
    bundleExporter = new BundleExporter({db});
  });

  it('can export the model as a bundle', () => {
    // Mock a topology that can return positions.
    db.services.add({id: 'mysql', charm: 'precise/mysql-1', series: 'xenial'});
    db.services.add({
      id: 'wordpress',
      charm: 'precise/wordpress-1',
      config: {debug: 'no', username: 'admin'},
      constraints: 'cpu-power=2 cpu-cores=4',
      annotations: {'gui-x': 100, 'gui-y': 200},
      series: 'bionic'
    });
    db.addUnits({
      id: 'wordpress/0'
    });
    db.relations.add({
      id: 'relation-0',
      endpoints: [
        ['mysql', {name: 'db', role: 'server'}],
        ['wordpress', {name: 'app', role: 'client'}]],
      'interface': 'db'
    });

    db.environment.set('defaultSeries', 'precise');

    // Add the charms so we can resolve them in the export.
    db.charms.add([{id: 'precise/mysql-1'},
      {id: 'precise/wordpress-1',
        options: {
          debug: {
            'default': 'no'
          },
          username: {
            'default': 'root'
          }
        }
      }
    ]);
    const result = bundleExporter.exportBundle();

    assert.strictEqual(result.relations.length, 1);
    var relation = result.relations[0];

    assert.equal(result.series, 'precise');
    assert.equal(result.applications.mysql.series, 'xenial');
    assert.equal(result.applications.wordpress.series, 'bionic');
    assert.equal(result.applications.mysql.charm, 'precise/mysql-1');
    assert.equal(result.applications.wordpress.charm, 'precise/wordpress-1');
    // Services with no units are allowed.
    assert.equal(result.applications.mysql.num_units, 0);
    assert.equal(result.applications.wordpress.num_units, 1);

    // A default config value is skipped
    assert.equal(result.applications.wordpress.options.debug, undefined);
    // A value changed from the default is exported
    assert.equal(result.applications.wordpress.options.username, 'admin');
    // Ensure that mysql has no options object in the export as no
    // non-default options are defined
    assert.equal(result.applications.mysql.options, undefined);

    // Constraints
    var constraints = result.applications.wordpress.constraints;
    assert.equal(constraints, 'cpu-power=2 cpu-cores=4');

    // Export position annotations.
    assert.equal(result.applications.wordpress.annotations['gui-x'], 100);
    assert.equal(result.applications.wordpress.annotations['gui-y'], 200);
    // Note that ignored wasn't exported.
    assert.equal(
      result.applications.wordpress.annotations.ignored, undefined);

    assert.equal(relation[0], 'mysql:db');
    assert.equal(relation[1], 'wordpress:app');
  });

  it('does not export peer relations', () => {
    db.services.add({id: 'wordpress', charm: 'precise/wordpress-42'});
    db.charms.add({id: 'precise/wordpress-42'});
    db.relations.add({
      id: 'wordpress:loadbalancer',
      endpoints: [['wordpress', {name: 'loadbalancer', role: 'peer'}]],
      'interface': 'reversenginx'
    });
    const result = bundleExporter.exportBundle();
    // The service has been exported.
    assert.isDefined(result.applications.wordpress);
    // But not its peer relation.
    assert.strictEqual(result.relations.length, 0);
  });

  it('properly exports ambiguous relations', () => {
    db.charms.add([
      {id: 'hadoop-resourcemanager-14'},
      {id: 'hadoop-namenode-13'}
    ]);
    db.services.add({
      id: 'resourcemanager', charm: 'hadoop-resourcemanager-14'});
    db.services.add({
      id: 'namenode', charm: 'hadoop-namenode-13'});
    db.relations.add({
      id: 'relation-0',
      endpoints: [
        ['resourcemanager', {role: 'server'}],
        ['namenode', {role: 'client'}]],
      'interface': 'db'
    });
    assert.deepEqual(bundleExporter.exportBundle().relations, [[
      'resourcemanager', 'namenode'
    ]]);
  });

  it('exports subordinate services with no num_units', () => {
    // Add a subordinate.
    db.services.add({id: 'puppet', charm: 'precise/puppet-4'});
    db.charms.add([{id: 'precise/puppet-4', is_subordinate: true}]);
    const result = bundleExporter.exportBundle();
    assert.equal(result.applications.puppet.num_units, undefined);
  });

  it('exports applications for juju 2', () => {
    // Add a subordinate.
    db.services.add({id: 'puppet', charm: 'precise/puppet-4'});
    db.charms.add([{id: 'precise/puppet-4', is_subordinate: true}]);
    // Pass false for the instance when facades show Juju 2.
    const result = bundleExporter.exportBundle();
    assert.isDefined(result.applications.puppet);
  });

  it('exports options preserving their types', () => {
    db.services.add({
      id: 'wordpress',
      charm: 'precise/wordpress-42',
      config: {
        one: 'foo',
        two: '2',
        three: '3.14',
        four: 'true',
        five: false
      }
    });
    db.charms.add([{
      id: 'precise/wordpress-42',
      options: {
        one: {'default': '', type: 'string'},
        two: {'default': 0, type: 'int'},
        three: {'default': 0, type: 'float'},
        four: {'default': undefined, type: 'boolean'},
        five: {'default': true, type: 'boolean'}
      }
    }]);
    const result = bundleExporter.exportBundle();
    assert.strictEqual(result.applications.wordpress.options.one, 'foo');
    assert.strictEqual(result.applications.wordpress.options.two, 2);
    assert.strictEqual(result.applications.wordpress.options.three, 3.14);
    assert.strictEqual(result.applications.wordpress.options.four, true);
    assert.strictEqual(result.applications.wordpress.options.five, false);
  });

  it('avoid exporting options set to their default values', () => {
    db.services.add({
      id: 'wordpress',
      charm: 'precise/wordpress-42',
      config: {
        one: 'foo',
        two: '2',
        three: '3.14',
        four: 'false',
        five: true
      }
    });
    db.charms.add([{
      id: 'precise/wordpress-42',
      options: {
        one: {'default': 'foo', type: 'string'},
        two: {'default': 0, type: 'int'},
        three: {'default': 3.14, type: 'float'},
        four: {'default': undefined, type: 'boolean'},
        five: {'default': true, type: 'boolean'}
      }
    }]);
    const result = bundleExporter.exportBundle();
    assert.isUndefined(result.applications.wordpress.options.one);
    assert.strictEqual(result.applications.wordpress.options.two, 2);
    assert.isUndefined(result.applications.wordpress.options.three);
    assert.strictEqual(result.applications.wordpress.options.four, false);
    assert.isUndefined(result.applications.wordpress.options.five, false);
  });

  it('exports non-default options', () => {
    db.services.add({
      id: 'wordpress',
      charm: 'precise/wordpress-1',
      config: {one: '1', two: '2', three: '3', four: '4', five: true},
      annotations: {'gui-x': 100, 'gui-y': 200}
    });
    db.charms.add([{id: 'precise/mysql-1'},
      {id: 'precise/wordpress-1',
        options: {
          one: {
            'default': ''
          },
          two: {
            'default': null
          },
          three: {
            'default': undefined
          },
          four: {
            'default': '0'
          },
          five: {
            'default': false
          }
        }
      }
    ]);
    const result = bundleExporter.exportBundle();
    assert.equal(result.applications.wordpress.options.one, '1');
    assert.equal(result.applications.wordpress.options.two, '2');
    assert.equal(result.applications.wordpress.options.three, '3');
    assert.equal(result.applications.wordpress.options.four, '4');
    assert.equal(result.applications.wordpress.options.five, true);
  });

  it('exports exposed flag', () => {
    db.services.add({id: 'wordpress', charm: 'precise/wordpress-4'});
    db.charms.add([{id: 'precise/wordpress-4'}]);
    let result = bundleExporter.exportBundle();
    assert.isUndefined(result.applications.wordpress.expose);
    db.services.getById('wordpress').set('exposed', true);
    result = bundleExporter.exportBundle();
    assert.isTrue(result.applications.wordpress.expose);
  });

  it('can determine simple machine placement for services', () => {
    var machine = {id: '0'};
    var units = [{
      service: 'wordpress',
      id: 'wordpress/0',
      agent_state: 'started',
      machine: '0'
    }, {
      service: 'mysql',
      id: 'mysql/0',
      agent_state: 'started',
      machine: '0'
    }];
    db.machines.add(machine);
    db.units.add(units, true);
    var placement = bundleExporter._mapServicesToMachines(db.machines);
    var expected = {
      mysql: ['0'],
      wordpress: ['0']
    };
    assert.deepEqual(placement, expected);
  });

  it('can determine complex machine placement for services', () => {
    var machines = [{id: '0'}, {id: '1'}, {id: '2'}];
    var units = [{
      service: 'wordpress',
      id: 'wordpress/0',
      agent_state: 'started',
      machine: '0'
    }, {
      service: 'mysql',
      id: 'mysql/0',
      agent_state: 'started',
      machine: '0'
    }, {
      service: 'mysql',
      id: 'mysql/1',
      agent_state: 'started',
      machine: '1'
    }, {
      service: 'apache2',
      id: 'apache2/0',
      agent_state: 'started',
      machine: '1'
    }, {
      service: 'wordpress',
      id: 'wordpress/1',
      agent_state: 'started',
      machine: '2'
    }, {
      service: 'apache2',
      id: 'apache2/1',
      agent_state: 'started',
      machine: '2'
    }, {
      service: 'mysql',
      id: 'mysql/2',
      agent_state: 'started',
      machine: '2'
    }];
    db.machines.add(machines);
    db.units.add(units, true);
    var placement = bundleExporter._mapServicesToMachines(db.machines);
    var expected = {
      wordpress: ['0', '2'],
      mysql: ['0', '1', '2'],
      apache2: ['1', '2']
    };
    assert.deepEqual(placement, expected);
  });

  it('can determine container placement for units', () => {
    var machines = [{
      id: '0'
    }, {
      id: '0/lxc/0',
      containerType: 'lxc',
      parentId: '0'
    }, {
      id: '0/kvm/0',
      containerType: 'kvm',
      parentId: '0'
    }];
    var units = [{
      service: 'wordpress',
      id: 'wordpress/0',
      agent_state: 'started',
      machine: '0'
    }, {
      service: 'mysql',
      id: 'mysql/0',
      agent_state: 'started',
      machine: '0'
    }, {
      service: 'apache2',
      id: 'apache2/0',
      agent_state: 'started',
      machine: '0/kvm/0'
    }];
    db.machines.add(machines);
    db.units.add(units, true);
    var placement = bundleExporter._mapServicesToMachines(db.machines);
    var expected = {
      wordpress: ['0'],
      mysql: ['0'],
      apache2: ['kvm:wordpress/0']
    };
    assert.deepEqual(placement, expected);
  });

  it('starts bundle export machine index at 0', () => {
    // Because we ignore any machines which do not have units placed or only
    // host the GUI service we remap all machine ids to start at 0.
    var machines = [
      {id: '3', hardware: {}, series: 'trusty'},
      {id: '4', hardware: {}, series: 'trusty'},
      {id: '5', hardware: {}, series: 'trusty'}
    ];
    var units = [{
      service: 'wordpress',
      id: 'wordpress/0',
      agent_state: 'started',
      machine: '3'
    }, {
      service: 'mysql',
      id: 'mysql/0',
      agent_state: 'started',
      machine: '3'
    }, {
      service: 'mysql',
      id: 'mysql/1',
      agent_state: 'started',
      machine: '4'
    }, {
      service: 'apache2',
      id: 'apache2/0',
      agent_state: 'started',
      machine: '4'
    }, {
      service: 'wordpress',
      id: 'wordpress/1',
      agent_state: 'started',
      machine: '5'
    }, {
      service: 'apache2',
      id: 'apache2/1',
      agent_state: 'started',
      machine: '5'
    }, {
      service: 'mysql',
      id: 'mysql/2',
      agent_state: 'started',
      machine: '5'
    }];
    var services = [
      {id: 'wordpress', charm: 'cs:trusty/wordpress-27'},
      {id: 'apache2', charm: 'cs:trusty/apache2-27'},
      {id: 'mysql', charm: 'cs:trusty/mysql-27'}
    ];
    var charms = [
      {id: 'cs:trusty/wordpress-27'},
      {id: 'cs:trusty/apache2-27'},
      {id: 'cs:trusty/mysql-27'}
    ];
    db.machines.add(machines);
    db.services.add(services);
    db.charms.add(charms);
    db.units.add(units, true);
    const bundle = bundleExporter.exportBundle();
    const expectedMachines = {
      '0': {series: 'trusty'},
      '1': {series: 'trusty'},
      '2': {series: 'trusty'}
    };
    assert.deepEqual(bundle.machines, expectedMachines);
  });

  it('includes machines without series and hardware', () => {
    const machines = [{id: '4'}, {id: '5', constraints: 'foo=bar'}];
    const units = [{
      service: 'apache2',
      id: 'apache2/1',
      machine: '4'
    }, {
      service: 'mysql',
      id: 'mysql/2',
      machine: '5'
    }];
    const services = [
      {id: 'apache2', charm: 'cs:trusty/apache2-27'},
      {id: 'mysql', charm: 'cs:trusty/mysql-27'}
    ];
    const charms = [
      {id: 'cs:trusty/apache2-27'},
      {id: 'cs:trusty/mysql-27'}
    ];
    db.machines.add(machines);
    db.services.add(services);
    db.charms.add(charms);
    db.units.add(units, true);
    const bundle = bundleExporter.exportBundle();
    const expectedMachines = {'0': {}, '1': {constraints: 'foo=bar'}};
    assert.deepEqual(bundle.machines, expectedMachines);
  });

  it('includes uncommmitted units when determining placement', () => {
    var machine = {id: '0'};
    var units = [{
      service: 'wordpress',
      id: 'wordpress/0',
      machine: '0'
    }, {
      service: 'mysql',
      id: 'mysql/0',
      agent_state: 'started',
      machine: '0'
    }, {
      service: 'apache2',
      id: 'apache2/0',
      agent_state: 'started',
      machine: '0'
    }];
    db.machines.add(machine);
    db.units.add(units, true);
    var placement = bundleExporter._mapServicesToMachines(db.machines, true);
    var expected = {
      wordpress: ['0'],
      mysql: ['0'],
      apache2: ['0']
    };
    assert.deepEqual(placement, expected);
  });

  it('includes uncommitted machines when determining placement', () => {
    var machine = {id: 'new0', commitStatus: 'uncommitted'};
    var units = [{
      service: 'wordpress',
      id: 'wordpress/0',
      agent_state: 'started',
      machine: 'new0'
    }, {
      service: 'mysql',
      id: 'mysql/0',
      agent_state: 'started',
      machine: 'new0'
    }, {
      service: 'apache2',
      id: 'apache2/0',
      agent_state: 'started',
      machine: 'new0'
    }];
    db.machines.add(machine);
    db.units.add(units, true);
    var placement = bundleExporter._mapServicesToMachines(db.machines, true);
    assert.deepEqual(placement, {
      wordpress: ['new0'],
      mysql: ['new0'],
      apache2: ['new0']
    });
  });

  it('ignores machines with no units when determining placements',
    () => {
      var machine = {id: '0'};
      db.machines.add(machine);
      var placement = bundleExporter._mapServicesToMachines(db.machines);
      assert.deepEqual(placement, {});
    });

  it('annotates services with placement info', () => {
    db.services.add({id: 'mysql', charm: 'precise/mysql-1'});
    db.services.add({id: 'wordpress', charm: 'precise/wordpress-1'});
    db.machines.add({id: '0', hardware: {}});
    db.units.add([{
      service: 'wordpress',
      id: 'wordpress/0',
      agent_state: 'started',
      machine: '0'
    }, {
      service: 'mysql',
      id: 'mysql/0',
      agent_state: 'started',
      machine: '0'
    }], true);
    db.charms.add([{
      id: 'precise/mysql-1',
      options: {
        one: {
          'default': ''
        },
        two: {
          'default': null
        },
        three: {
          'default': undefined
        }
      }
    }, {
      id: 'precise/wordpress-1',
      options: {
        one: {
          'default': ''
        },
        two: {
          'default': null
        },
        three: {
          'default': undefined
        },
        four: {
          'default': '0'
        },
        five: {
          'default': false
        }
      }
    }]);
    const result = bundleExporter.exportBundle();
    assert.deepEqual(result.applications.mysql.to, ['0']);
  });
});
