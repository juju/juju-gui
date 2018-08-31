/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const shapeup = require('shapeup');

const Status = require('./status');

describe('Status', function() {
  let changeState;
  let model;
  let emptyEntities;
  let generatePath;
  let entities;
  const propTypes = Status.propTypes;

  const renderComponent = (options = {}) => enzyme.shallow(
    <Status
      changeState={options.changeState || changeState}
      entities={options.entities || entities}
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
    emptyEntities = {
      annotations: {},
      applications: {},
      machines: {},
      relations: {},
      'remote-applications': {},
      units: {}
    };
    generatePath = sinon.stub();
    entities = {
      annotations: {},
      applications: {
        django: {
          'charm-url': '~who/xenial/django-42',
          exposed: true,
          id: 'django',
          name: 'django',
          pending: false,
          status: {
            current: 'active'
          },
          'workload-version': '1.10'
        },
        haproxy: {
          'charm-url': 'haproxy-47',
          id: 'ha',
          name: 'ha',
          pending: false,
          status: {
            current: 'error'
          },
          'workload-version': ''
        },
        mysql: {
          'charm-url': 'mysql-0',
          name: 'mysql',
          pending: true,
          status: {
            current: ''
          },
          'workload-version': ''
        }
      },
      machines: {
        'm1': {
          'agent-status': {
            current: 'pending'
          },
          id: 'm1',
          'instance-id': 'machine-1',
          addresses: [{
            scope: 'public',
            value: '1.2.3.6'
          }],
          series: 'zesty'
        },
        'm2': {
          'agent-status': {
            current: 'started',
            message: 'yes, I am started'
          },
          id: 'm2',
          'instance-id': 'machine-2',
          addresses: [{
            scope: 'public',
            value: '1.2.3.7'
          }],
          series: 'trusty'
        }
      },
      relations: {
        'rel1': {
          endpoints: [{
            'application-name': 'mysql',
            relation: {
              name: 'main',
              role: 'requirer',
              interface: 'http',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'mysql',
            relation: {
              name: 'website',
              role: 'provider',
              interface: 'http',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }],
          id: 'rel1'
        },
        'rel2': {
          endpoints: [{
            'application-name': 'haproxy',
            relation: {
              name: 'website',
              role: 'provider',
              interface: 'http',
              optional: false,
              limit: 1,
              scope: 'global'
            }
          }, {
            'application-name': 'wordpress',
            relation: {
              name: 'proxy',
              role: 'requirer',
              interface: 'http',
              optional: false,
              limit: 0,
              scope: 'global'
            }
          }],
          id: 'rel2'
        }
      },
      'remote-applications': {
        haproxy: {
          name: 'haproxy',
          status: {
            current: 'unknown'
          },
          url: 'local:admin/saas.haproxy'
        },
        mongo: {
          name: 'mongo',
          status: {
            current: 'corrupting data'
          },
          url: 'local:admin/my.mongo'
        }
      },
      units: {
        'django/id0': {
          'agent-status': {
            current: 'idle'
          },
          application: 'django',
          name: 'django/0',
          'machine-id': '1',
          'public-address': '1.2.3.4',
          'port-ranges': [
            {'from-port': 80, 'to-port': 80, protocol: 'tcp'},
            {'from-port': 443, 'to-port': 443, protocol: 'tcp'}
          ],
          'workload-status': {
            current: 'installing',
            message: 'these are the voyages'
          }
        },
        'django/id1': {
          'agent-status': {
            current: 'executing'
          },
          application: 'django',
          name: 'django/1',
          'machine-id': '2',
          'public-address': '1.2.3.5',
          'port-ranges': [
            {'from-port': 80, 'to-port': 88, protocol: 'udp'}
          ],
          'workload-status': {
            current: 'error',
            message: 'exterminate!'
          }
        },
        'django/id42': {
          'agent-status': {
            current: 'idle'
          },
          application: 'django',
          name: 'django/42',
          'machine-id': '2',
          'public-address': '1.2.3.6',
          // Simulate that the unit didn't open ports yet.
          'port-ranges': [],
          'workload-status': {
            current: 'installing',
            message: ''
          }
        }
      }
    };
  });

  it('renders with no data', () => {
    const model = {};
    const wrapper = renderComponent({
      entities: emptyEntities,
      model
    });
    const expected = (
      <div className="status-view__content">
        Cannot show the status: the GUI is not connected to a model.
      </div>
    );
    assert.compareJSX(wrapper.find('.status-view__content'), expected);
  });

  it('renders with no entities', () => {
    const wrapper = renderComponent({ entities: emptyEntities });
    assert.equal(wrapper.find('BasicTable').length, 1);
  });

  it('can display status by priority', () => {
    const wrapper = renderComponent();
    assert.deepEqual(
      wrapper.find('BasicTable').at(3).prop('rows')[1].classes,
      ['status-view__table-row--error']);
  });

  it('renders with entities', () => {
    const wrapper = renderComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('can link to the DNS address for a unit', () => {
    const wrapper = renderComponent();
    const section = wrapper.find('BasicTable').at(3);
    const column = section.prop('rows')[0].columns[4];
    assert.equal(column.content.props.href, 'http://1.2.3.4:80');
  });

  it('can navigate to charms from the app list', () => {
    const wrapper = renderComponent();
    const section = wrapper.find('BasicTable').at(2);
    const column = section.prop('rows')[0].columns[4];
    column.content.props.onClick({preventDefault: sinon.stub()});
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(
      changeState.args[0][0], {store: 'u/who/django/xenial/42'});
  });

  it('can navigate to machines from the unit list', () => {
    const wrapper = renderComponent();
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
    const wrapper = renderComponent();
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
    const wrapper = renderComponent();
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
    const wrapper = renderComponent();
    wrapper.find('select').simulate('change', {currentTarget: {value: 'error'}});
    const instance = wrapper.instance();
    assert.equal(instance.state.statusFilter, 'error');
  });

  it('can filter by nothing', () => {
    const wrapper = renderComponent();
    wrapper.find('select').simulate('change', {currentTarget: {value: 'none'}});
    const instance = wrapper.instance();
    assert.equal(instance.state.filter, null);
  });

  it('can show a highest status notification', () => {
    const wrapper = renderComponent();
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
