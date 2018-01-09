/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const BasicTable = require('../../basic-table/basic-table');
const CreateModelButton = require('../../create-model-button/create-model-button');
const DateDisplay = require('../../date-display/date-display');
const ProfileModelList = require('./model-list');
const Spinner = require('../../spinner/spinner');
const SvgIcon = require('../../svg-icon/svg-icon');

const jsTestUtils = require('../../../utils/component-test-utils');

describe('Profile Model List', function() {
  let listModelsWithInfo;

  // JSON dump of a test listModelsWithInfo call.
  // The first two records are owned by 'tester'.
  // The last two are shared with 'tester'.
  const rawModelData = `[{
    "id": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
    "name": "mymodel",
    "series": "xenial",
    "provider": "ec2",
    "uuid": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
    "agentVersion": "",
    "sla": "",
    "slaOwner": "",
    "status": "available",
    "statusInfo": "",
    "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
    "owner": "tester@external",
    "credential": "aws_tester@external_base",
    "credentialName": "base",
    "region": "eu-west-1",
    "cloud": "aws",
    "numMachines": 0,
    "users": [{
      "name": "tester@external",
      "displayName": "tester",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-07-06T14:47:03.000Z",
      "access": "admin"
    }, {
      "name": "tester2@external",
      "displayName": "tester2",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-05-25T18:53:35.000Z",
      "access": "read"
    }],
    "life": "alive",
    "isAlive": true,
    "isController": false,
    "lastConnection": "2017-07-06T14:47:03.000Z"
  }, {
    "id": "f507b811-d706-427e-8f01-d485fgc90a67",
    "name": "mymodel2",
    "series": "xenial",
    "provider": "gce",
    "uuid": "f507b811-d706-427e-8f01-d485fgc90a67",
    "agentVersion": "",
    "sla": "",
    "slaOwner": "",
    "status": "available",
    "statusInfo": "",
    "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
    "owner": "tester@external",
    "credential": "google_tester@external_admin",
    "credentialName": "admin",
    "region": "us-central1",
    "cloud": "google",
    "numMachines": 0,
    "users": [{
      "name": "tester@external",
      "displayName": "tester",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-07-06T16:26:47.000Z",
      "access": "admin"
    }],
    "life": "alive",
    "isAlive": true,
    "isController": false,
    "lastConnection": "2017-07-06T16:26:47.000Z"
  }, {
    "id": "06b11eb5-abd6-48f3-8910-b54cf5945e60",
    "name": "test-db",
    "series": "xenial",
    "provider": "gce",
    "uuid": "06b11eb5-abd6-48f3-8910-b54cf5945e60",
    "agentVersion": "",
    "sla": "",
    "slaOwner": "",
    "status": "available",
    "statusInfo": "",
    "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
    "owner": "tester2@external",
    "credential": "google_tester2@external_google-dbtest",
    "credentialName": "google-dbtest",
    "region": "us-east1",
    "cloud": "google",
    "numMachines": 2,
    "users": [{
      "name": "tester@external",
      "displayName": "tester",
      "domain": "Ubuntu SSO",
      "lastConnection": null,
      "access": "read"
    }, {
      "name": "tester2@external",
      "displayName": "tester2",
      "domain": "Ubuntu SSO",
      "lastConnection": null,
      "access": "admin"
    }],
    "life": "alive",
    "isAlive": true,
    "isController": false,
    "lastConnection": null
  }, {
    "id": "509f6e4c-4da4-49c8-8f19-537c33b4d3a0",
    "name": "website",
    "series": "xenial",
    "provider": "gce",
    "uuid": "509f6e4c-4da4-49c8-8f19-537c33b4d3a0",
    "agentVersion": "",
    "sla": "",
    "slaOwner": "",
    "status": "available",
    "statusInfo": "",
    "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
    "owner": "tester3@external",
    "credential": "google_tester3@external_gce",
    "credentialName": "gce",
    "region": "us-east1",
    "cloud": "google",
    "numMachines": 25,
    "users": [{
      "name": "tester4@external",
      "displayName": "tester4",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-06-09T16:24:28.000Z",
      "access": "read"
    }, {
      "name": "tester@external",
      "displayName": "tester",
      "domain": "Ubuntu SSO",
      "lastConnection": "2017-07-05T01:42:05.000Z",
      "access": "admin"
    }],
    "life": "alive",
    "isAlive": true,
    "isController": false,
    "lastConnection": "2017-07-05T01:42:05.000Z"
  }]`;

  function renderComponent(options={}) {
    listModelsWithInfo = cb => {
      cb(null, JSON.parse(rawModelData));
    };
    return jsTestUtils.shallowRender(
      <ProfileModelList
        acl={{}}
        addNotification={sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={options.listModelsWithInfo || listModelsWithInfo}
        destroyModels={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={{profile: 'tester'}} />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="profile-model-list">
        <div className="profile-model-list__header twelve-col">
          <CreateModelButton
            title="Start a new model"
            changeState={instance.props.changeState}
            switchModel={instance.props.switchModel} />
          <h2 className="profile__title">
            My models
            <span className="profile__title-count">
              ({4})
            </span>
          </h2>
        </div>
        <BasicTable
          headerClasses={['profile__entity-table-header-row']}
          headerColumnClasses={['profile__entity-table-header-column']}
          headers={[{
            content: 'Name',
            columnSize: 3
          }, {
            content: 'Owner',
            columnSize: 2
          }, {
            content: 'Machines, cloud/region',
            columnSize: 3
          }, {
            content: '',
            columnSize: 1
          }, {
            content: 'Last accessed',
            columnSize: 2
          }, {
            content: '',
            columnSize: 1
          }]}
          rowClasses={['profile__entity-table-row']}
          rowColumnClasses={['profile__entity-table-column']}
          rows={[{
            columns: [{
              content: (
                <a href="/gui/u/tester/mymodel"
                  onClick={sinon.stub()}>
                  mymodel
                </a>),
              columnSize: 3
            }, {
              content: 'Me',
              columnSize: 2
            }, {
              content: (
                <div>
                  <span className="profile-model-list__machine-number">
                    {0}
                  </span>
                  ec2/eu-west-1
                </div>),
              columnSize: 3
            }, {
              content: (
                <SvgIcon name='user_16'
                  size="16" />),
              columnSize: 1
            }, {
              content: (
                <DateDisplay
                  date='2017-07-06T14:47:03.000Z'
                  relative={true} />),
              columnSize: 2
            }, {
              content: (
                <a onClick={sinon.stub()}>
                  <SvgIcon name="delete_16"
                    size="16" />
                </a>),
              columnSize: 1
            }],
            expandedContent: (
              <div className="profile-model-list__expanded-content">
                <div className="three-col">
                  <a href="/gui/u/tester/mymodel"
                    onClick={sinon.stub()}>
                      mymodel
                  </a>
                </div>
                <div className="two-col">
                  Me
                </div>
                <div className="three-col">
                  <div>
                    <span className="profile-model-list__machine-number">
                      0
                    </span>
                    ec2/eu-west-1
                  </div>
                </div>
                <div className="one-col">
                  <SvgIcon
                    name="user_16"
                    size="16" />
                </div>
                <div className="two-col">
                  <DateDisplay
                    date="2017-07-06T14:47:03.000Z"
                    relative={true} />
                </div>
                <div className="one-col last-col">
                  <a onClick={sinon.stub()}>
                    <SvgIcon
                      name="delete_16"
                      size="16" />
                  </a>
                </div>
                <div className="three-col prepend-five profile-model-list__credential-name">
                  base
                </div>
              </div>),
            key: 'mymodel'
          }, {
            columns: [{
              content: (
                <a href="/gui/u/tester/mymodel2"
                  onClick={sinon.stub()}>
                  mymodel2
                </a>),
              columnSize: 3
            }, {
              content: 'Me',
              columnSize: 2
            }, {
              content: (
                <div>
                  <span className="profile-model-list__machine-number">
                    {0}
                  </span>
                  gce/us-central1
                </div>),
              columnSize: 3
            }, {
              content: (
                <SvgIcon name='user_16'
                  size="16" />),
              columnSize: 1
            }, {
              content: (
                <DateDisplay
                  date='2017-07-06T16:26:47.000Z'
                  relative={true} />),
              columnSize: 2
            }, {
              content: (
                <a onClick={sinon.stub()}>
                  <SvgIcon name="delete_16"
                    size="16" />
                </a>),
              columnSize: 1
            }],
            expandedContent: (
              <div className="profile-model-list__expanded-content">
                <div className="three-col">
                  <a href="/gui/u/tester/mymodel2"
                    onClick={sinon.stub()}>
                      mymodel2
                  </a>
                </div>
                <div className="two-col">
                  Me
                </div>
                <div className="three-col">
                  <div>
                    <span className="profile-model-list__machine-number">
                      0
                    </span>
                    gce/us-central1
                  </div>
                </div>
                <div className="one-col">
                  <SvgIcon
                    name="user_16"
                    size="16" />
                </div>
                <div className="two-col">
                  <DateDisplay
                    date="2017-07-06T16:26:47.000Z"
                    relative={true} />
                </div>
                <div className="one-col last-col">
                  <a onClick={sinon.stub()}>
                    <SvgIcon
                      name="delete_16"
                      size="16" />
                  </a>
                </div>
                <div className="three-col prepend-five profile-model-list__credential-name">
                  admin
                </div>
              </div>),
            key: 'mymodel2'
          }, {
            columns: [{
              content: (
                <a href="/gui/u/tester2/test-db"
                  onClick={sinon.stub()}>
                  test-db
                </a>),
              columnSize: 3
            }, {
              content: 'tester2',
              columnSize: 2
            }, {
              content: (
                <div>
                  <span className="profile-model-list__machine-number">
                    {2}
                  </span>
                  gce/us-east1
                </div>),
              columnSize: 3
            }, {
              content: (
                <SvgIcon name='show_16'
                  size="16" />),
              columnSize: 1
            }, {
              content: (
                <DateDisplay
                  date='--'
                  relative={true} />),
              columnSize: 2
            }, {
              content: null,
              columnSize: 1
            }],
            expandedContent: (
              <div className="profile-model-list__expanded-content">
                <div className="three-col">
                  <a href="/gui/u/tester2/test-db"
                    onClick={sinon.stub()}>
                      test-db
                  </a>
                </div>
                <div className="two-col">
                  tester2
                </div>
                <div className="three-col">
                  <div>
                    <span className="profile-model-list__machine-number">
                      2
                    </span>
                    gce/us-east1
                  </div>
                </div>
                <div className="one-col">
                  <SvgIcon
                    name="show_16"
                    size="16" />
                </div>
                <div className="two-col">
                  <DateDisplay
                    date="--"
                    relative={true} />
                </div>
                <div className="one-col last-col">
                </div>
                <div className="three-col prepend-five profile-model-list__credential-name">
                  google-dbtest
                </div>
              </div>),
            key: 'test-db'
          }, {
            columns: [{
              content: (
                <a href="/gui/u/tester3/website"
                  onClick={sinon.stub()}>
                  website
                </a>),
              columnSize: 3
            }, {
              content: 'tester3',
              columnSize: 2
            }, {
              content: (
                <div>
                  <span className="profile-model-list__machine-number">
                    {25}
                  </span>
                  gce/us-east1
                </div>),
              columnSize: 3
            }, {
              content: (
                <SvgIcon name='user_16'
                  size="16" />),
              columnSize: 1
            }, {
              content: (
                <DateDisplay
                  date='2017-07-05T01:42:05.000Z'
                  relative={true} />),
              columnSize: 2
            }, {
              content: (
                <a onClick={sinon.stub()}>
                  <SvgIcon name="delete_16"
                    size="16" />
                </a>),
              columnSize: 1
            }],
            expandedContent: (
              <div className="profile-model-list__expanded-content">
                <div className="three-col">
                  <a href="/gui/u/tester3/website"
                    onClick={sinon.stub()}>
                      website
                  </a>
                </div>
                <div className="two-col">
                  tester3
                </div>
                <div className="three-col">
                  <div>
                    <span className="profile-model-list__machine-number">
                      25
                    </span>
                    gce/us-east1
                  </div>
                </div>
                <div className="one-col">
                  <SvgIcon
                    name="user_16"
                    size="16" />
                </div>
                <div className="two-col">
                  <DateDisplay
                    date="2017-07-05T01:42:05.000Z"
                    relative={true} />
                </div>
                <div className="one-col last-col">
                  <a onClick={sinon.stub()}>
                    <SvgIcon
                      name="delete_16"
                      size="16" />
                  </a>
                </div>
                <div className="three-col prepend-five profile-model-list__credential-name">
                  gce
                </div>
              </div>),
            key: 'website'
          }]} />
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can render without any models', () => {
    const renderer = renderComponent({
      listModelsWithInfo: sinon.stub().callsArgWith(0, null, null)
    });
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="profile-model-list">
        <div className="profile-model-list__header twelve-col">
          <CreateModelButton
            title="Start a new model"
            changeState={instance.props.changeState}
            switchModel={instance.props.switchModel} />
          <h2 className="profile__title">
            My models
            <span className="profile__title-count">
              ({0})
            </span>
          </h2>
        </div>
        {null}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('does not break with model data in an unexpected format', () => {
    const renderer = renderComponent({
      listModelsWithInfo: sinon.stub().callsArgWith(0, null, [''])
    });
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="profile-model-list">
        <div className="profile-model-list__header twelve-col">
          <CreateModelButton
            title="Start a new model"
            changeState={instance.props.changeState}
            switchModel={instance.props.switchModel} />
          <h2 className="profile__title">
            My models
            <span className="profile__title-count">
              ({0})
            </span>
          </h2>
        </div>
        {null}
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('does not show models that are being destroyed', () => {
    const models = [{isAlive: false}];
    models.push(JSON.parse(`{
      "id": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
      "name": "mymodel",
      "series": "xenial",
      "provider": "ec2",
      "uuid": "2f929db7-08a1-4a75-8733-3a0352a6e9f5",
      "agentVersion": "",
      "sla": "",
      "slaOwner": "",
      "status": "available",
      "statusInfo": "",
      "controllerUUID": "a030379a-940f-4760-8fce-3062b41a04e9",
      "owner": "tester@external",
      "credential": "aws_tester@external_base",
      "credentialName": "base",
      "region": "eu-west-1",
      "cloud": "aws",
      "numMachines": 0,
      "users": [{
        "name": "tester@external",
        "displayName": "tester",
        "domain": "Ubuntu SSO",
        "lastConnection": "2017-07-06T14:47:03.000Z",
        "access": "admin"
      }, {
        "name": "tester2@external",
        "displayName": "tester2",
        "domain": "Ubuntu SSO",
        "lastConnection": "2017-05-25T18:53:35.000Z",
        "access": "read"
      }],
      "life": "alive",
      "isAlive": true,
      "isController": false,
      "lastConnection": "2017-07-06T14:47:03.000Z"
    }`));
    const renderer = renderComponent({
      listModelsWithInfo: sinon.stub().callsArgWith(0, null, models)
    });
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <div className="profile-model-list">
        <div className="profile-model-list__header twelve-col">
          <CreateModelButton
            title="Start a new model"
            changeState={instance.props.changeState}
            switchModel={instance.props.switchModel} />
          <h2 className="profile__title">
            My models
            <span className="profile__title-count">
              ({1})
            </span>
          </h2>
        </div>
        <BasicTable
          headerClasses={['profile__entity-table-header-row']}
          headerColumnClasses={['profile__entity-table-header-column']}
          headers={[{
            content: 'Name',
            columnSize: 3
          }, {
            content: 'Owner',
            columnSize: 2
          }, {
            content: 'Machines, cloud/region',
            columnSize: 3
          }, {
            content: '',
            columnSize: 1
          }, {
            content: 'Last accessed',
            columnSize: 2
          }, {
            content: '',
            columnSize: 1
          }]}
          rowClasses={['profile__entity-table-row']}
          rowColumnClasses={['profile__entity-table-column']}
          rows={[{
            columns: [{
              content: (
                <a href="/gui/u/tester/mymodel"
                  onClick={sinon.stub()}>
                  mymodel
                </a>),
              columnSize: 3
            }, {
              content: 'Me',
              columnSize: 2
            }, {
              content: (
                <div>
                  <span className="profile-model-list__machine-number">
                    {0}
                  </span>
                  ec2/eu-west-1
                </div>),
              columnSize: 3
            }, {
              content: (
                <SvgIcon name='user_16'
                  size="16" />),
              columnSize: 1
            }, {
              content: (
                <DateDisplay
                  date='2017-07-06T14:47:03.000Z'
                  relative={true} />),
              columnSize: 2
            }, {
              content: (
                <a onClick={sinon.stub()}>
                  <SvgIcon name="delete_16"
                    size="16" />
                </a>),
              columnSize: 1
            }],
            expandedContent: (
              <div className="profile-model-list__expanded-content">
                <div className="three-col">
                  <a href="/gui/u/tester/mymodel"
                    onClick={sinon.stub()}>
                      mymodel
                  </a>
                </div>
                <div className="two-col">
                  Me
                </div>
                <div className="three-col">
                  <div>
                    <span className="profile-model-list__machine-number">
                      0
                    </span>
                    ec2/eu-west-1
                  </div>
                </div>
                <div className="one-col">
                  <SvgIcon
                    name="user_16"
                    size="16" />
                </div>
                <div className="two-col">
                  <DateDisplay
                    date="2017-07-06T14:47:03.000Z"
                    relative={true} />
                </div>
                <div className="one-col last-col">
                  <a onClick={sinon.stub()}>
                    <SvgIcon
                      name="delete_16"
                      size="16" />
                  </a>
                </div>
                <div className="three-col prepend-five profile-model-list__credential-name">
                  base
                </div>
              </div>),
            key: 'mymodel'
          }]} />
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('displays a spinner when loading', () => {
    const renderer = renderComponent({
      listModelsWithInfo: sinon.stub()
    });
    const output = renderer.getRenderOutput();
    const expected = (
      <div className="profile-model-list">
        <Spinner />
      </div>
    );
    expect(output).toEqualJSX(expected);
  });
});
