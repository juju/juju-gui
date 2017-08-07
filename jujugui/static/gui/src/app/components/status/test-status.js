/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Status', function() {
  let defaultModel;
  let emptyDB;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('status', () => {
      done();
    });
  });

  beforeEach(() => {
    defaultModel = {
      cloud: 'aws',
      environmentName: 'my-model',
      region: 'neutral zone',
      sla: 'advanced',
      version: '2.42.47'
    };
    emptyDB = {
      machines: {size: sinon.stub().withArgs().returns(0)},
      relations: {size: sinon.stub().withArgs().returns(0)},
      remoteServices: {size: sinon.stub().withArgs().returns(0)},
      services: {size: sinon.stub().withArgs().returns(0)}
    };
  });

  // Render the component with the given db and optional model.
  // Return an object with the instance and the output.
  const render = (db, model=defaultModel) => {
    const renderer = jsTestUtils.shallowRender(
      <window.juju.components.Status
        db={db}
        model={model}
        urllib={window.jujulib.URL}
      />, true
    );
    return {
      instance: renderer.getMountedInstance(),
      output: renderer.getRenderOutput()
    };
  };

  // Wrap the given element into the shared component boilerplate.
  const wrap = element => {
    return (
      <juju.components.Panel instanceName="status-view" visible={true}>
        {element}
      </juju.components.Panel>
    );
  };

  // Create and return a database.
  const makeDB = () => {
    const djangoUnits = [{
      agentStatus: 'idle',
      displayName: 'django/0',
      id: 'id0',
      machine: '1',
      public_address: '1.2.3.4',
      portRanges: [
        {from: 80, to: 80, protocol: 'tcp'},
        {from: 443, to: 443, protocol: 'tcp'}
      ],
      workloadStatus: 'installing',
      workloadStatusMessage: 'these are the voyages'
    }, {
      agentStatus: 'executing',
      displayName: 'django/1',
      id: 'id1',
      machine: '2',
      public_address: '1.2.3.5',
      portRanges: [
        {from: 80, to: 88, protocol: 'udp'}
      ],
      workloadStatus: 'error',
      workloadStatusMessage: 'exterminate!'
    }];
    const applications = [{
      getAttrs: sinon.stub().withArgs().returns({
        charm: '~who/xenial/django-42',
        name: 'django',
        status: {current: 'active'},
        units: {size: sinon.stub().withArgs().returns(djangoUnits.length)},
        workloadVersion: '1.10'
      }),
      get: sinon.stub().withArgs('units').returns({
        each: func => djangoUnits.forEach(func)
      })
    }, {
      getAttrs: sinon.stub().withArgs().returns({
        charm: 'haproxy-47',
        name: 'ha',
        status: {current: 'error'},
        units: {size: sinon.stub().withArgs().returns(0)},
        workloadVersion: ''
      }),
      get: sinon.stub().withArgs('units').returns({
        each: func => {}
      })
    }];
    const machines = [{
      agent_state: 'pending',
      agent_state_info: '',
      displayName: '1',
      id: 'm1',
      instance_id: 'machine-1',
      public_address: '1.2.3.6',
      series: 'zesty'
    }, {
      agent_state: 'started',
      agent_state_info: 'yes, I am started',
      displayName: '2',
      id: 'm2',
      instance_id: 'machine-2',
      public_address: '1.2.3.7',
      series: 'trusty'
    }];
    const relations = [{
      getAttrs: sinon.stub().withArgs().returns({
        endpoints: [[
          'mysql', {name: 'cluster', role: 'peer'}
        ]],
        id: 'rel1'
      })
    }, {
      getAttrs: sinon.stub().withArgs().returns({
        endpoints: [[
          'haproxy', {name: 'website', role: 'provider'}
        ], [
          'wordpress', {name: 'proxy', role: 'requirer'}
        ]],
        id: 'rel2'
      })
    }];
    const remoteApplications = [{
      getAttrs: sinon.stub().withArgs().returns({
        service: 'haproxy',
        status: {current: 'unknown'},
        url: 'local:admin/saas.haproxy'
      })
    }, {
      getAttrs: sinon.stub().withArgs().returns({
        service: 'mongo',
        status: {current: 'corrupting data'},
        url: 'local:admin/my.mongo'
      })
    }];
    return {
      machines: {
        size: sinon.stub().withArgs().returns(machines.length),
        map: func => machines.map(func)
      },
      relations: {
        size: sinon.stub().withArgs().returns(relations.length),
        map: func => relations.map(func)
      },
      remoteServices: {
        size: sinon.stub().withArgs().returns(remoteApplications.length),
        map: func => remoteApplications.map(func)
      },
      services: {
        size: sinon.stub().withArgs().returns(applications.length),
        map: func => applications.map(func),
        each: func => applications.forEach(func)
      }
    };
  };

  it('renders with no data', () => {
    const model = {};
    const comp = render(emptyDB, model);
    const expectedOutput = wrap(
      <div className="status-view__content">
        Cannot show the status: the GUI is not connected to a model.
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('renders with no entities', () => {
    const comp = render(emptyDB);
    const expectedOutput = wrap(
      <div className="status-view__content">
        <juju.components.BasicTable
          columns={[{
            title: 'Model',
            size: 3
          }, {
            title: 'Cloud/Region',
            size: 3
          }, {
            title: 'Version',
            size: 3
          }, {
            title: 'SLA',
            size: 3
          }]}
          key="model"
          rows={[[
            'my-model',
            'aws/neutral zone',
            '2.42.47',
            'advanced'
          ]]} />
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('renders with entities', () => {
    const comp = render(makeDB());
    const expectedOutput = wrap(
      <div className="status-view__content">
        <juju.components.BasicTable
          columns={[{
            title: 'Model',
            size: 3
          }, {
            title: 'Cloud/Region',
            size: 3
          }, {
            title: 'Version',
            size: 3
          }, {
            title: 'SLA',
            size: 3
          }]}
          key="model"
          rows={[[
            'my-model',
            'aws/neutral zone',
            '2.42.47',
            'advanced'
          ]]} />
        <juju.components.BasicTable
          columns={[{
            title: 'SAAS',
            size: 3
          }, {
            title: 'Status',
            size: 3
          }, {
            title: 'Store',
            size: 3
          }, {
            title: 'URL',
            size: 3
          }]}
          key="remote-applications"
          rows={[
            ['haproxy', 'unknown', 'local', 'admin/saas.haproxy'],
            ['mongo', 'corrupting data', 'local', 'admin/my.mongo']
          ]} />
        <juju.components.BasicTable
          columns={[{
            title: 'Application',
            size: 2
          }, {
            title: 'Version',
            size: 2
          }, {
            title: 'Status',
            size: 2
          }, {
            title: 'Scale',
            size: 1
          }, {
            title: 'Charm',
            size: 2
          }, {
            title: 'Store',
            size: 2
          }, {
            title: 'Rev',
            size: 1
          }]}
          key="applications"
          rows={[
            ['django', '1.10',
              (<span key="status0" className="ok">active</span>),
              2, 'u/who/django/xenial', 'jujucharms', 42],
            ['ha', '', (<span key="status1" className="error">error</span>),
              0, 'haproxy', 'jujucharms', 47]
          ]} />
        <juju.components.BasicTable
          columns={[{
            title: 'Unit',
            size: 2
          }, {
            title: 'Workload',
            size: 2
          }, {
            title: 'Agent',
            size: 2
          }, {
            title: 'Machine',
            size: 1
          }, {
            title: 'Public address',
            size: 2
          }, {
            title: 'Ports',
            size: 1
          }, {
            title: 'Message',
            size: 2
          }]}
          key="units"
          rows={[
            ['django/0', (<span key="workload0" className="">installing</span>),
              (<span key="agent0" className="ok">idle</span>),
              '1', '1.2.3.4', '80/tcp, 443/tcp', 'these are the voyages'],
            ['django/1', (<span key="workload1" className="error">error</span>),
              (<span key="agent1" className="">executing</span>),
              '2', '1.2.3.5', '80-88/udp', 'exterminate!']
          ]} />
        <juju.components.BasicTable
          columns={[{
            title: 'Machine',
            size: 2
          }, {
            title: 'State',
            size: 2
          }, {
            title: 'DNS',
            size: 2
          }, {
            title: 'Instance ID',
            size: 2
          }, {
            title: 'Series',
            size: 2
          }, {
            title: 'Message',
            size: 2
          }]}
          key="machines"
          rows={[
            ['1', (<span key="agent0" className="">pending</span>),
              '1.2.3.6', 'machine-1', 'zesty', ''],
            ['2', (<span key="agent1" className="ok">started</span>),
              '1.2.3.7', 'machine-2', 'trusty', 'yes, I am started']
          ]} />
        <juju.components.BasicTable
          columns={[{
            title: 'Relation',
            size: 3
          }, {
            title: 'Provides',
            size: 3
          }, {
            title: 'Consumes',
            size: 3
          }, {
            title: 'Type',
            size: 3
          }]}
          key="relations"
          rows={[
            ['cluster', 'mysql', 'mysql', 'peer'],
            ['website', 'wordpress', 'haproxy', 'regular']
          ]} />
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

});
