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
        <table>
          <thead>
            <tr>
              <th>
                Model
              </th>
              <th>
                Cloud/Region
              </th>
              <th>
                Version
              </th>
              <th>
                SLA
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                my-model
              </td>
              <td>
                aws/neutral zone
              </td>
              <td>
                2.42.47
              </td>
              <td>
                advanced
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('renders with entities', () => {
    const comp = render(makeDB());
    const expectedOutput = wrap(
      <div className="status-view__content">
        <table>
          <thead>
            <tr>
              <th>
                Model
              </th>
              <th>
                Cloud/Region
              </th>
              <th>
                Version
              </th>
              <th>
                SLA
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                my-model
              </td>
              <td>
                aws/neutral zone
              </td>
              <td>
                2.42.47
              </td>
              <td>
                advanced
              </td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>
                SAAS
              </th>
              <th>
                Status
              </th>
              <th>
                Store
              </th>
              <th>
                URL
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                mongo
              </td>
              <td>
                corrupting data
              </td>
              <td>
                local
              </td>
              <td>
                admin/my.mongo
              </td>
            </tr>
            <tr>
              <td>
                haproxy
              </td>
              <td>
                unknown
              </td>
              <td>
                local
              </td>
              <td>
                admin/saas.haproxy
              </td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>
                Application
              </th>
              <th>
                Version
              </th>
              <th>
                Status
              </th>
              <th>
                Scale
              </th>
              <th>
                Charm
              </th>
              <th>
                Store
              </th>
              <th>
                Rev
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                django
              </td>
              <td>
                1.10
              </td>
              <td className="ok">
                active
              </td>
              <td>
                2
              </td>
              <td>
                u/who/django/xenial
              </td>
              <td>
                jujucharms
              </td>
              <td>
                42
              </td>
            </tr>
            <tr>
              <td>
                ha
              </td>
              <td />
              <td className="error">
                error
              </td>
              <td>
                0
              </td>
              <td>
                haproxy
              </td>
              <td>
                jujucharms
              </td>
              <td>
                47
              </td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>
                Unit
              </th>
              <th>
                Workload
              </th>
              <th>
                Agent
              </th>
              <th>
                Machine
              </th>
              <th>
                Public address
              </th>
              <th>
                Ports
              </th>
              <th>
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                django/0
              </td>
              <td className="">
                installing
              </td>
              <td className="ok">
                idle
              </td>
              <td>
                1
              </td>
              <td>
                1.2.3.4
              </td>
              <td>
                80/tcp, 443/tcp
              </td>
              <td>
                these are the voyages
              </td>
            </tr>
            <tr>
              <td>
                django/1
              </td>
              <td className="error">
                error
              </td>
              <td className="">
                executing
              </td>
              <td>
                2
              </td>
              <td>
                1.2.3.5
              </td>
              <td>
                80-88/udp
              </td>
              <td>
                exterminate!
              </td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>
                Machine
              </th>
              <th>
                State
              </th>
              <th>
                DNS
              </th>
              <th>
                Instance ID
              </th>
              <th>
                Series
              </th>
              <th>
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                1
              </td>
              <td className="">
                pending
              </td>
              <td>
                1.2.3.6
              </td>
              <td>
                machine-1
              </td>
              <td>
                zesty
              </td>
              <td />
            </tr>
            <tr>
              <td>
                2
              </td>
              <td className="ok">
                started
              </td>
              <td>
                1.2.3.7
              </td>
              <td>
                machine-2
              </td>
              <td>
                trusty
              </td>
              <td>
                yes, I am started
              </td>
            </tr>
          </tbody>
        </table>
        <table>
          <thead>
            <tr>
              <th>
                Relation
              </th>
              <th>
                Provides
              </th>
              <th>
                Consumes
              </th>
              <th>
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                cluster
              </td>
              <td>
                mysql
              </td>
              <td>
                mysql
              </td>
              <td>
                peer
              </td>
            </tr>
            <tr>
              <td>
                website
              </td>
              <td>
                wordpress
              </td>
              <td>
                haproxy
              </td>
              <td>
                regular
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

});
