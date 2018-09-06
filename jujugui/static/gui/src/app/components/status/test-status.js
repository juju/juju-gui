/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const shapeup = require('shapeup');

const Status = require('./status');

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
      model={shapeup.fromShape(options.model || model, propTypes.model)} />
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
    expect(wrapper).toMatchSnapshot();
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
