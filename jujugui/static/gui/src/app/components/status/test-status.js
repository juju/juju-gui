/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Status', function() {
  let changeState;
  let defaultModel;
  let emptyDB;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('status', () => {
      done();
    });
  });

  beforeEach(() => {
    changeState = sinon.stub();
    defaultModel = {
      cloud: 'aws',
      environmentName: 'my-model',
      region: 'neutral zone',
      sla: 'advanced',
      version: '2.42.47'
    };
    emptyDB = {
      machines: {
        map: sinon.stub(),
        size: sinon.stub().withArgs().returns(0)
      },
      relations: {
        map: sinon.stub(),
        size: sinon.stub().withArgs().returns(0)
      },
      remoteServices: {
        map: sinon.stub(),
        size: sinon.stub().withArgs().returns(0)
      },
      services: {
        each: sinon.stub(),
        map: sinon.stub(),
        size: sinon.stub().withArgs().returns(0)
      }
    };
  });

  // Render the component with the given db and optional model.
  // Return an object with the instance and the output.
  const render = (db, model=defaultModel) => {
    const propTypes = window.juju.components.Status.propTypes;
    const renderer = jsTestUtils.shallowRender(
      <window.juju.components.Status
        changeState={changeState}
        db={shapeup.fromShape(db, propTypes.db)}
        model={shapeup.fromShape(model, propTypes.model)}
        urllib={shapeup.fromShape(window.jujulib.URL, propTypes.urllib)}
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
      id: 'django/id0',
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
      id: 'django/id1',
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
        id: 'django',
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
          headers={[{
            content: 'Model',
            columnSize: 3
          }, {
            content: 'Cloud/Region',
            columnSize: 3
          }, {
            content: 'Version',
            columnSize: 3
          }, {
            content: 'SLA',
            columnSize: 3
          }]}
          key="model"
          rows={[{
            columns: [{
              columnSize: 3,
              content: 'my-model'
            }, {
              columnSize: 3,
              content: 'aws/neutral zone'
            }, {
              columnSize: 3,
              content: '2.42.47'
            }, {
              columnSize: 3,
              content: 'advanced'
            }],
            key: 'model'
          }]} />
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('renders with entities', () => {
    const comp = render(makeDB());
    const expectedOutput = wrap(
      <div className="status-view__content">
        <juju.components.BasicTable
          headers={[{
            content: 'Model',
            columnSize: 3
          }, {
            content: 'Cloud/Region',
            columnSize: 3
          }, {
            content: 'Version',
            columnSize: 3
          }, {
            content: 'SLA',
            columnSize: 3
          }]}
          key="model"
          rows={[{
            columns: [{
              columnSize: 3,
              content: 'my-model'
            }, {
              columnSize: 3,
              content: 'aws/neutral zone'
            }, {
              columnSize: 3,
              content: '2.42.47'
            }, {
              columnSize: 3,
              content: 'advanced'
            }],
            key: 'model'
          }]} />
        <juju.components.BasicTable
          headers={[{
            content: 'SAAS',
            columnSize: 3
          }, {
            content: 'Status',
            columnSize: 3
          }, {
            content: 'Store',
            columnSize: 3
          }, {
            content: 'URL',
            columnSize: 3
          }]}
          key="remote-applications"
          rows={[{
            columns: [{
              columnSize: 3,
              content: 'haproxy'
            }, {
              columnSize: 3,
              content: 'unknown'
            }, {
              columnSize: 3,
              content: 'local'
            }, {
              columnSize: 3,
              content: 'admin/saas.haproxy'
            }],
            key: 'local:admin/saas.haproxy'
          }, {
            columns: [ {
              columnSize: 3,
              content: 'mongo'
            }, {
              columnSize: 3,
              content: 'corrupting data'
            }, {
              columnSize: 3,
              content: 'local'
            }, {
              columnSize: 3,
              content: 'admin/my.mongo'
            }],
            key: 'local:admin/my.mongo'
          }]}
          sort={sinon.stub()} />
        <juju.components.BasicTable
          headers={[{
            content: 'Application',
            columnSize: 2
          }, {
            content: 'Version',
            columnSize: 2
          }, {
            content: 'Status',
            columnSize: 2
          }, {
            content: 'Scale',
            columnSize: 1
          }, {
            content: 'Charm',
            columnSize: 2
          }, {
            content: 'Store',
            columnSize: 2
          }, {
            content: 'Rev',
            columnSize: 1
          }]}
          key="applications"
          rows={[{
            columns: [{
              columnSize: 2,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  django
                </span>)
            }, {
              columnSize: 2,
              content: '1.10'
            }, {
              columnSize: 2,
              content: <span key="status0" className="ok">active</span>
            }, {
              columnSize: 1,
              content: 2
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  u/who/django/xenial
                </span>)
            }, {
              columnSize: 2,
              content: 'jujucharms'
            }, {
              columnSize: 1,
              content: 42
            }],
            key: 'django'
          }, {
            columns: [{
              columnSize: 2,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  ha
                </span>)
            }, {
              columnSize: 2,
              content: ''
            }, {
              columnSize: 2,
              content: <span key="status1" className="error">error</span>
            }, {
              columnSize: 1,
              content: 0
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  haproxy
                </span>)
            }, {
              columnSize: 2,
              content: 'jujucharms'
            }, {
              columnSize: 1,
              content: 47
            }],
            key: 'ha'
          }]}
          sort={sinon.stub()} />
        <juju.components.BasicTable
          headers={[{
            content: 'Unit',
            columnSize: 2
          }, {
            content: 'Workload',
            columnSize: 2
          }, {
            content: 'Agent',
            columnSize: 2
          }, {
            content: 'Machine',
            columnSize: 1
          }, {
            content: 'Public address',
            columnSize: 2
          }, {
            content: 'Ports',
            columnSize: 1
          }, {
            content: 'Message',
            columnSize: 2
          }]}
          key="units"
          rows={[{
            columns: [{
              columnSize: 2,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  django/0
                </span>)
            }, {
              columnSize: 2,
              content: <span key="workload0" className="">installing</span>
            }, {
              columnSize: 2,
              content: <span key="agent0" className="ok">idle</span>
            }, {
              columnSize: 1,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  1
                </span>)
            }, {
              columnSize: 2,
              content: '1.2.3.4'
            }, {
              columnSize: 1,
              content: '80/tcp, 443/tcp'
            }, {
              columnSize: 2,
              content: 'these are the voyages'
            }],
            key: 'django/id0'
          }, {
            columns: [{
              columnSize: 2,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  django/1
                </span>)
            }, {
              columnSize: 2,
              content: <span key="workload1" className="error">error</span>
            }, {
              columnSize: 2,
              content: <span key="agent1" className="">executing</span>
            }, {
              columnSize: 1,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  2
                </span>)
            }, {
              columnSize: 2,
              content: '1.2.3.5'
            }, {
              columnSize: 1,
              content: '80-88/udp'
            }, {
              columnSize: 2,
              content: 'exterminate!'
            }],
            key: 'django/id1'
          }]}
          sort={sinon.stub()} />
        <juju.components.BasicTable
          headers={[{
            content: 'Machine',
            columnSize: 2
          }, {
            content: 'State',
            columnSize: 2
          }, {
            content: 'DNS',
            columnSize: 2
          }, {
            content: 'Instance ID',
            columnSize: 2
          }, {
            content: 'Series',
            columnSize: 2
          }, {
            content: 'Message',
            columnSize: 2
          }]}
          key="machines"
          rows={[{
            columns: [{
              columnSize: 2,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  1
                </span>)
            }, {
              columnSize: 2,
              content: (<span key="agent0" className="">pending</span>)
            }, {
              columnSize: 2,
              content: '1.2.3.6'
            }, {
              columnSize: 2,
              content: 'machine-1'
            }, {
              columnSize: 2,
              content: 'zesty'
            }, {
              columnSize: 2,
              content: ''
            }],
            key: 'm1'
          }, {
            columns: [{
              columnSize: 2,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  2
                </span>)
            }, {
              columnSize: 2,
              content: (<span key="agent1" className="ok">started</span>)
            }, {
              columnSize: 2,
              content: '1.2.3.7'
            }, {
              columnSize: 2,
              content: 'machine-2'
            }, {
              columnSize: 2,
              content: 'trusty'
            }, {
              columnSize: 2,
              content: 'yes, I am started'
            }],
            key: 'm2'
          }]}
          sort={sinon.stub()} />
        <juju.components.BasicTable
          headers={[{
            content: 'Relation',
            columnSize: 3
          }, {
            content: 'Provides',
            columnSize: 3
          }, {
            content: 'Consumes',
            columnSize: 3
          }, {
            content: 'Type',
            columnSize: 3
          }]}
          key="relations"
          rows={[{
            columns: [{
              columnSize: 3,
              content: 'cluster'
            }, {
              columnSize: 3,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  mysql
                </span>)
            }, {
              columnSize: 3,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  mysql
                </span>)
            }, {
              columnSize: 3,
              content: 'peer'
            }],
            key: 'rel1'
          }, {
            columns: [{
              columnSize: 3,
              content: 'website'
            }, {
              columnSize: 3,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  wordpress
                </span>)
            }, {
              columnSize: 3,
              content: (
                <span className="status-view__link"
                  onClick={sinon.stub()}>
                  haproxy
                </span>)
            }, {
              columnSize: 3,
              content: 'regular'
            }],
            key: 'rel2'
          }]}
          sort={sinon.stub()} />
      </div>
    );
    expect(comp.output).toEqualJSX(expectedOutput);
  });

  it('can navigate to applications from the app list', () => {
    const comp = render(makeDB());
    comp.output.props.children.props.children[2].props.rows[0].columns[0]
      .content.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {gui: {inspector: {id: 'django'}}});
  });

  it('can navigate to charms from the app list', () => {
    const comp = render(makeDB());
    comp.output.props.children.props.children[2].props.rows[0].columns[4]
      .content.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {store: 'u/who/django/xenial/42'});
  });

  it('can navigate to units from the unit list', () => {
    const comp = render(makeDB());
    comp.output.props.children.props.children[3].props.rows[0].columns[0]
      .content.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {
        gui: {
          inspector: {
            id: 'django',
            unit: 'id0',
            activeComponent: 'unit'
          }
        }
      });
  });

  it('can navigate to machines from the unit list', () => {
    const comp = render(makeDB());
    comp.output.props.children.props.children[3].props.rows[0].columns[3]
      .content.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {gui: {machines: '1', status: null}});
  });

  it('can navigate to machines from the machine list', () => {
    const comp = render(makeDB());
    comp.output.props.children.props.children[4].props.rows[0].columns[0]
      .content.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {gui: {machines: 'm1', status: null}});
  });

  it('can navigate to provided apps from the relation list', () => {
    const comp = render(makeDB());
    comp.output.props.children.props.children[5].props.rows[0].columns[1]
      .content.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {gui: {inspector: {id: 'mysql'}}});
  });

  it('can navigate to consumed apps from the relation list', () => {
    const comp = render(makeDB());
    comp.output.props.children.props.children[5].props.rows[0].columns[2]
      .content.props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {gui: {inspector: {id: 'mysql'}}});
  });
});
