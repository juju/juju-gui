/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const shapeup = require('shapeup');

const {urls} = require('jaaslib');

const Status = require('./status');
const BasicTable = require('../basic-table/basic-table');

describe('Status', function() {
  let changeState;
  let model;
  let emptyDB;
  let generatePath;
  const propTypes = Status.propTypes;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Status
      changeState={options.changeState || changeState}
      db={shapeup.fromShape(options.db, propTypes.db)}
      generatePath={options.generatePath || generatePath}
      model={shapeup.fromShape(options.model || model, propTypes.model)}
      urllib={shapeup.fromShape(urls.URL, propTypes.urllib)} />
  );

  beforeEach(() => {
    changeState = sinon.stub();
    model = {
      cloud: 'aws',
      environmentName: 'my-model',
      modelUUID: 'myuuid',
      region: 'neutral zone',
      sla: 'advanced',
      version: '2.42.47'
    };
    emptyDB = {
      machines: {
        filter: sinon.stub().returns([])
      },
      relations: {
        filter: sinon.stub().returns([])
      },
      remoteServices: {
        map: sinon.stub(),
        size: sinon.stub().withArgs().returns(0)
      },
      services: {
        filter: sinon.stub().returns([]),
        getById: sinon.stub()
      }
    };
    generatePath = sinon.stub();
  });

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
    }, {
      agentStatus: 'idle',
      displayName: 'django/42',
      id: 'django/id42',
      machine: '2',
      public_address: '1.2.3.6',
      // Simulate that the unit didn't open ports yet.
      portRanges: [],
      workloadStatus: 'installing',
      workloadStatusMessage: ''
    }, {
      // Unplaced units are excluded.
      agentStatus: '',
      displayName: 'django/2',
      id: 'django/id2',
      public_address: '',
      portRanges: [],
      workloadStatus: '',
      workloadStatusMessage: ''
    }, {
      // Uncommitted units are excluded.
      agentStatus: '',
      displayName: 'django/3',
      id: 'django/id3',
      machine: 'new42',
      public_address: '',
      portRanges: [],
      workloadStatus: '',
      workloadStatusMessage: ''
    }];
    const django = {
      charm: '~who/xenial/django-42',
      exposed: true,
      icon: 'django.svg',
      id: 'django',
      name: 'django',
      pending: false,
      status: {current: 'active'},
      units: djangoUnits,
      workloadVersion: '1.10'
    };
    const haproxyUnits = [];
    const haproxy = {
      charm: 'haproxy-47',
      icon: 'ha.svg',
      id: 'ha',
      name: 'ha',
      pending: false,
      status: {current: 'error'},
      units: haproxyUnits,
      workloadVersion: ''
    };
    const mysqlUnits = [];
    const mysql = {
      charm: 'mysql-0',
      icon: 'mysql.svg',
      name: 'mysql',
      pending: true,
      status: {current: ''},
      units: mysqlUnits,
      workloadVersion: ''
    };
    const applications = [{
      getAttrs: sinon.stub().withArgs().returns(django),
      get: key => {
        if (key === 'units') {
          return {filter: func => djangoUnits.filter(func)};
        }
        return django[key];
      }
    }, {
      getAttrs: sinon.stub().withArgs().returns(haproxy),
      get: key => {
        if (key === 'units') {
          return {filter: func => haproxyUnits.filter(func)};
        }
        return haproxy[key];
      }
    }, {
      // Uncommitted applications are excluded.
      getAttrs: sinon.stub().withArgs().returns(mysql),
      get: key => {
        if (key === 'units') {
          return {filter: func => mysqlUnits.filter(func)};
        }
        return mysql[key];
      }
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
    }, {
      // Uncommitted machines are excluded.
      agent_state: '',
      agent_state_info: '',
      displayName: '3',
      id: 'new1',
      instance_id: '',
      public_address: '',
      series: 'trusty'
    }];
    const relations = [{
      get: sinon.stub().withArgs('pending').returns(false),
      getAttrs: sinon.stub().withArgs().returns({
        endpoints: [[
          'mysql', {name: 'cluster', role: 'peer'}
        ]],
        id: 'rel1'
      })
    }, {
      get: sinon.stub().withArgs('pending').returns(false),
      getAttrs: sinon.stub().withArgs().returns({
        endpoints: [[
          'haproxy', {name: 'website', role: 'provider'}
        ], [
          'wordpress', {name: 'proxy', role: 'requirer'}
        ]],
        id: 'rel2'
      })
    }, {
      // Uncommitted relations are excluded.
      get: sinon.stub().withArgs('pending').returns(true),
      getAttrs: sinon.stub().withArgs().returns({
        endpoints: [],
        id: 'rel3'
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
    const getById = sinon.stub();
    getById.withArgs('django').returns(applications[0]);
    getById.withArgs('haproxy').returns(applications[1]);
    getById.withArgs('mysql').returns(applications[2]);
    return {
      machines: {
        filter: func => machines.filter(func),
        size: sinon.stub().withArgs().returns(machines.length)
      },
      relations: {
        filter: func => relations.filter(func),
        size: sinon.stub().withArgs().returns(relations.length)
      },
      remoteServices: {
        size: sinon.stub().withArgs().returns(remoteApplications.length),
        map: func => remoteApplications.map(func)
      },
      services: {
        filter: func => applications.filter(func),
        getById: getById
      }
    };
  };

  it('renders with no data', () => {
    const model = {};
    const wrapper = renderComponent({
      db: emptyDB,
      model
    });
    // const comp = render(emptyDB, model);
    const expected = (
      <div className="status-view__content">
        Cannot show the status: the GUI is not connected to a model.
      </div>
    );
    assert.compareJSX(wrapper.find('.status-view__content'), expected);
  });

  it('renders with no entities', () => {
    const wrapper = renderComponent({ db: emptyDB });
    assert.equal(wrapper.find('BasicTable').length, 1);
  });

  it('can display status by priority', () => {
    const wrapper = renderComponent({ db: makeDB() });
    assert.deepEqual(
      wrapper.find('BasicTable').at(3).prop('rows')[1].classes,
      ['status-view__table-row--error']);
  });

  it('renders with entities', () => {
    const wrapper = renderComponent({ db: makeDB() });
    const tables = wrapper.find('BasicTable');
    const instance = wrapper.instance();
    const expected = (
      <div className="status-view__content">
        <div key="model">
          <div className="twelve-col no-margin-bottom">
            <div className="eight-col">
              <h2>
                my-model
                <span
                  className={'status-view__traffic-light ' +
                    'status-view__traffic-light--ok'}
                  onClick={wrapper.find('.status-view__traffic-light').prop('onClick')}
                  role="button"
                  tabIndex="0"
                  title="Everything is OK">
                </span>
              </h2>
            </div>
            <div className="status-view__filter-label two-col">
              Filter status:
            </div>
            <div className="status-view__filter two-col last-col">
              <select className="status-view__filter-select"
                onChange={wrapper.find('select').prop('onChange')}
                value="none">
                <option className="status-view__filter-option"
                  key="none"
                  value="none">
                  none
                </option>
                <option className="status-view__filter-option"
                  key="error"
                  value="error">
                  error
                </option>
                <option className="status-view__filter-option"
                  key="pending"
                  value="pending">
                  pending
                </option>
                <option className="status-view__filter-option"
                  key="ok"
                  value="ok">
                  ok
                </option>
              </select>
            </div>
          </div>
          <BasicTable
            headers={[{
              content: 'Cloud/Region',
              columnSize: 2
            }, {
              content: 'Version',
              columnSize: 2
            }, {
              content: 'SLA',
              columnSize: 1
            }, {
              content: 'Applications',
              columnSize: 2
            }, {
              content: 'Remote applications',
              columnSize: 2
            }, {
              content: 'Units',
              columnSize: 1
            }, {
              content: 'Machines',
              columnSize: 1
            }, {
              content: 'Relations',
              columnSize: 1
            }]}
            rows={[{
              columns: [{
                columnSize: 2,
                content: 'aws/neutral zone'
              }, {
                columnSize: 2,
                content: '2.42.47'
              }, {
                columnSize: 1,
                content: 'advanced'
              }, {
                columnSize: 2,
                content: 2
              }, {
                columnSize: 2,
                content: 2
              }, {
                columnSize: 1,
                content: 0
              }, {
                columnSize: 1,
                content: 2
              }, {
                columnSize: 1,
                content: 2
              }],
              key: 'model'
            }]} />
        </div>
        <BasicTable
          filterPredicate={tables.at(1).prop('filterPredicate')}
          headerClasses={['status-view__table-header']}
          headerColumnClasses={['status-view__table-header-column']}
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
          rowClasses={['status-view__table-row']}
          rowColumnClasses={['status-view__table-column']}
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
            extraData: 'ok',
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
            extraData: 'ok',
            key: 'local:admin/my.mongo'
          }]}
          sort={instance._byKey}
          tableClasses={['status-view__table']} />
        <BasicTable
          changeState={changeState}
          filterPredicate={tables.at(2).prop('filterPredicate')}
          generatePath={generatePath}
          headerClasses={['status-view__table-header']}
          headerColumnClasses={['status-view__table-header-column']}
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
          rowClasses={['status-view__table-row']}
          rowColumnClasses={['status-view__table-column']}
          rows={[{
            classes: ['status-view__table-row--ok'],
            clickState: {
              gui: {
                inspector: {
                  activeComponent: undefined,
                  id: 'django',
                  unit: null,
                  unitStatus: null
                }
              }
            },
            columns: [{
              columnSize: 2,
              content: (
                <span>
                  <img className="status-view__icon"
                    src="django.svg" />
                  django
                </span>)
            }, {
              columnSize: 2,
              content: '1.10'
            }, {
              columnSize: 2,
              content: <span className="status-view__status--ok">active</span>
            }, {
              columnSize: 1,
              content: 3
            }, {
              columnSize: 2,
              content: (
                <a className="status-view__link"
                  href={undefined}
                  onClick={sinon.stub()}>
                  u/who/django/xenial
                </a>)
            }, {
              columnSize: 2,
              content: 'jujucharms'
            }, {
              columnSize: 1,
              content: 42
            }],
            extraData: 'ok',
            key: 'django'
          }, {
            classes: ['status-view__table-row--error'],
            clickState: {
              gui: {
                inspector: {
                  activeComponent: undefined,
                  id: 'ha',
                  unit: null,
                  unitStatus: null
                }
              }
            },
            columns: [{
              columnSize: 2,
              content: (
                <span>
                  <img className="status-view__icon"
                    src="ha.svg" />
                  ha
                </span>)
            }, {
              columnSize: 2,
              content: ''
            }, {
              columnSize: 2,
              content: <span className="status-view__status--error">error</span>
            }, {
              columnSize: 1,
              content: 0
            }, {
              columnSize: 2,
              content: (
                <a className="status-view__link"
                  href={undefined}
                  onClick={sinon.stub()}>
                  haproxy
                </a>)
            }, {
              columnSize: 2,
              content: 'jujucharms'
            }, {
              columnSize: 1,
              content: 47
            }],
            extraData: 'error',
            key: 'ha'
          }]}
          sort={instance._byKey}
          tableClasses={['status-view__table']} />
        <BasicTable
          changeState={changeState}
          filterPredicate={tables.at(3).prop('filterPredicate')}
          generatePath={generatePath}
          headerClasses={['status-view__table-header']}
          headerColumnClasses={['status-view__table-header-column']}
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
          rowClasses={['status-view__table-row']}
          rowColumnClasses={['status-view__table-column']}
          rows={[{
            classes: ['status-view__table-row--pending'],
            clickState: {
              gui: {
                inspector: {
                  activeComponent: 'unit',
                  id: 'django',
                  unit: 'id0'
                }
              }
            },
            columns: [{
              columnSize: 2,
              content: (
                <span>
                  <img className="status-view__icon"
                    src="django.svg" />
                  django/0
                </span>)
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__status--pending">
                  installing
                </span>)
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__status--ok">
                  idle
                </span>)
            }, {
              columnSize: 1,
              content: (
                <a className="status-view__link"
                  href={undefined}
                  onClick={sinon.stub()}>
                  1
                </a>)
            }, {
              columnSize: 2,
              content: (
                <a className="status-view__link"
                  href="http://1.2.3.4:80"
                  target="_blank">
                  1.2.3.4
                </a>)
            }, {
              columnSize: 1,
              content: '80/tcp, 443/tcp'
            }, {
              columnSize: 2,
              content: 'these are the voyages'
            }],
            extraData: 'pending',
            key: 'django/id0'
          }, {
            classes: ['status-view__table-row--error'],
            clickState: {
              gui: {
                inspector: {
                  activeComponent: 'unit',
                  id: 'django',
                  unit: 'id1'
                }
              }
            },
            columns: [{
              columnSize: 2,
              content: (
                <span>
                  <img className="status-view__icon"
                    src="django.svg" />
                  django/1
                </span>)
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__status--error">error</span>)
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__status--pending">
                  executing
                </span>)
            }, {
              columnSize: 1,
              content: (
                <a className="status-view__link"
                  href={undefined}
                  onClick={sinon.stub()}>
                  2
                </a>)
            }, {
              columnSize: 2,
              content: (
                <a className="status-view__link"
                  href="http://1.2.3.5:80"
                  target="_blank">
                  1.2.3.5
                </a>)
            }, {
              columnSize: 1,
              content: '80-88/udp'
            }, {
              columnSize: 2,
              content: 'exterminate!'
            }],
            extraData: 'error',
            key: 'django/id1'
          }, {
            classes: ['status-view__table-row--pending'],
            clickState: {
              gui: {
                inspector: {
                  activeComponent: 'unit',
                  id: 'django',
                  unit: 'id42'
                }
              }
            },
            columns: [{
              columnSize: 2,
              content: (
                <span>
                  <img className="status-view__icon"
                    src="django.svg" />
                  django/42
                </span>)
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__status--pending">
                  installing
                </span>)
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__status--ok">
                  idle
                </span>)
            }, {
              columnSize: 1,
              content: (
                <a className="status-view__link"
                  href={undefined}
                  onClick={sinon.stub()}>
                  2
                </a>)
            }, {
              columnSize: 2,
              content: '1.2.3.6'
            }, {
              columnSize: 1,
              content: ''
            }, {
              columnSize: 2,
              content: ''
            }],
            extraData: 'pending',
            key: 'django/id42'
          }]}
          sort={instance._byKey}
          tableClasses={['status-view__table']} />
        <BasicTable
          changeState={changeState}
          filterPredicate={tables.at(4).prop('filterPredicate')}
          generatePath={generatePath}
          headerClasses={['status-view__table-header']}
          headerColumnClasses={['status-view__table-header-column']}
          headers={[{
            content: 'Machine',
            columnSize: 1
          }, {
            content: 'State',
            columnSize: 2
          }, {
            content: 'DNS',
            columnSize: 2
          }, {
            content: 'Instance ID',
            columnSize: 3
          }, {
            content: 'Series',
            columnSize: 1
          }, {
            content: 'Message',
            columnSize: 3
          }]}
          key="machines"
          rowClasses={['status-view__table-row']}
          rowColumnClasses={['status-view__table-column']}
          rows={[{
            classes: ['status-view__table-row--pending'],
            clickState: {
              gui: {
                machines: 'm1',
                status: null
              }
            },
            columns: [{
              columnSize: 1,
              content: '1'
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__status--pending">
                  pending
                </span>)
            }, {
              columnSize: 2,
              content: '1.2.3.6'
            }, {
              columnSize: 3,
              content: 'machine-1'
            }, {
              columnSize: 1,
              content: 'zesty'
            }, {
              columnSize: 3,
              content: ''
            }],
            extraData: 'pending',
            key: 'm1'
          }, {
            classes: ['status-view__table-row--ok'],
            clickState: {
              gui: {
                machines: 'm2',
                status: null
              }
            },
            columns: [{
              columnSize: 1,
              content: '2'
            }, {
              columnSize: 2,
              content: (
                <span className="status-view__status--ok">
                  started
                </span>)
            }, {
              columnSize: 2,
              content: '1.2.3.7'
            }, {
              columnSize: 3,
              content: 'machine-2'
            }, {
              columnSize: 1,
              content: 'trusty'
            }, {
              columnSize: 3,
              content: 'yes, I am started'
            }],
            extraData: 'ok',
            key: 'm2'
          }]}
          sort={instance._byKey}
          tableClasses={['status-view__table']} />
        <BasicTable
          filterPredicate={tables.at(5).prop('filterPredicate')}
          headerClasses={['status-view__table-header']}
          headerColumnClasses={['status-view__table-header-column']}
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
          rowClasses={['status-view__table-row']}
          rowColumnClasses={['status-view__table-column']}
          rows={[{
            columns: [{
              columnSize: 3,
              content: 'cluster'
            }, {
              columnSize: 3,
              content: (
                <a className="status-view__link"
                  href={undefined}
                  onClick={sinon.stub()}>
                  <img className="status-view__icon"
                    src="mysql.svg" />
                  mysql
                </a>)
            }, {
              columnSize: 3,
              content: (
                <a className="status-view__link"
                  href={undefined}
                  onClick={sinon.stub()}>
                  <img className="status-view__icon"
                    src="mysql.svg" />
                  mysql
                </a>)
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
              content: (<span>wordpress</span>)
            }, {
              columnSize: 3,
              content: (
                <a className="status-view__link"
                  href={undefined}
                  onClick={sinon.stub()}>
                  <img className="status-view__icon"
                    src="ha.svg" />
                  haproxy
                </a>)
            }, {
              columnSize: 3,
              content: 'regular'
            }],
            key: 'rel2'
          }]}
          sort={instance._byKey}
          tableClasses={['status-view__table']} />
      </div>
    );
    assert.compareJSX(wrapper.find('.status-view__content'), expected);
  });

  it('can link to the DNS address for a unit', () => {
    const wrapper = renderComponent({ db: makeDB() });
    const section = wrapper.find('BasicTable').at(3);
    const column = section.prop('rows')[0].columns[4];
    assert.equal(column.content.props.href, 'http://1.2.3.4:80');
  });

  it('can navigate to charms from the app list', () => {
    const wrapper = renderComponent({ db: makeDB() });
    const section = wrapper.find('BasicTable').at(2);
    const column = section.prop('rows')[0].columns[4];
    column.content.props.onClick({preventDefault: sinon.stub()});
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {store: 'u/who/django/xenial/42'});
  });

  it('can navigate to machines from the unit list', () => {
    const wrapper = renderComponent({ db: makeDB() });
    const section = wrapper.find('BasicTable').at(3);
    const column = section.prop('rows')[0].columns[3];
    column.content.props.onClick({
      stopPropagation: sinon.stub(),
      preventDefault: sinon.stub()
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {gui: {machines: '1', status: null}});
  });

  it('can navigate to provided apps from the relation list', () => {
    const wrapper = renderComponent({ db: makeDB() });
    const section = wrapper.find('BasicTable').at(5);
    const column = section.prop('rows')[0].columns[1];
    column.content.props.onClick({preventDefault: sinon.stub()});
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'mysql',
          activeComponent: undefined,
          unit: null,
          unitStatus: null
        }
      }
    });
  });

  it('can navigate to consumed apps from the relation list', () => {
    const wrapper = renderComponent({ db: makeDB() });
    const section = wrapper.find('BasicTable').at(5);
    const column = section.prop('rows')[0].columns[2];
    column.content.props.onClick({preventDefault: sinon.stub()});
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'mysql',
          activeComponent: undefined,
          unit: null,
          unitStatus: null
        }
      }
    });
  });

  it('can filter by status', () => {
    const wrapper = renderComponent({ db: makeDB() });
    wrapper.find('select').simulate('change', {currentTarget: {value: 'error'}});
    const instance = wrapper.instance();
    assert.equal(instance.state.statusFilter, 'error');
  });

  it('can filter by nothing', () => {
    const wrapper = renderComponent({ db: makeDB() });
    wrapper.find('select').simulate('change', {currentTarget: {value: 'none'}});
    const instance = wrapper.instance();
    assert.equal(instance.state.filter, null);
  });

  it('can show a highest status notification', () => {
    const wrapper = renderComponent({ db: makeDB() });
    const instance = wrapper.instance();
    instance._setHighestStatus('error');
    instance.componentDidUpdate();
    wrapper.update();
    assert.equal(
      wrapper.find('.status-view__traffic-light').prop('className').includes(
        'status-view__traffic-light--error'),
      true);
  });
});
