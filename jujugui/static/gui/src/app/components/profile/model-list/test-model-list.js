/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

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
      "access": "admin"
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

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('profile-model-list', function() {
      done();
    });
  });

  function renderComponent(options={}) {
    listModelsWithInfo = (cb) => {
      cb(null, JSON.parse(rawModelData));
    };
    return jsTestUtils.shallowRender(
      <juju.components.ProfileModelList
        acl={{}}
        addNotification={sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        facadesExist={true}
        listModelsWithInfo={listModelsWithInfo}
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
        <ul className="profile-model-list__list">
          <li className="profile-model-list__header">
            <span className="profile-model-list__header-title">
              My models (2)
            </span>
            <juju.components.CreateModelButton
              title="Start a new model"
              changeState={instance.props.changeState}
              switchModel={instance.props.switchModel} />
          </li>
          <li className="profile-model-list__table-header">
            <span>Name</span>
            <span>Machines, Cloud/region</span>
            <span>Last accessed</span>
            <span>Action</span>
          </li>
          <li className="profile-model-list__row" key="">
            <span>
              <a
                href="/gui/u/tester/mymodel"
                onClick={output.props.children[0].props
                  .children[2].props.children[0].props.children.props.onClick}>
                mymodel</a></span>
            <span>0 EC2/EU-WEST-1</span>
            <span>
              <juju.components.DateDisplay
                date="2017-07-06T14:47:03.000Z"
                relative={true} />
            </span>
            <span>
              <ButtonDropdown
                ref="mymodel-button-dropdown-0"
                icon="contextual-menu-16"
                listItems={[
                  <li key="delete" className="dropdown-menu__list-item"
                    role="menuitem" tabIndex="0">
                    <a className="dropdown-menu__list-item-link"
                      onClick={instance._destroyModel}>
                    Delete</a>
                  </li>
                ]}
                tooltip="more"
              />
            </span>
          </li>
          <li className="profile-model-list__row" key="">
            <span>
              <a
                href="/gui/u/tester/mymodel2"
                onClick={output.props.children[0].props
                  .children[3].props.children[0].props.children.props.onClick}>
                mymodel2</a></span>
            <span>0 GCE/US-CENTRAL1</span>
            <span>
              <juju.components.DateDisplay
                date="2017-07-06T16:26:47.000Z"
                relative={true} />
            </span>
            <span>
              <ButtonDropdown
                ref="mymodel-button-dropdown-1"
                icon="contextual-menu-16"
                listItems={[
                  <li key="delete" className="dropdown-menu__list-item"
                    role="menuitem" tabIndex="0">
                    <a className="dropdown-menu__list-item-link"
                      onClick={instance._destroyModel}>
                    Delete</a>
                  </li>
                ]}
                tooltip="more"
              />
            </span>
          </li>
        </ul>
        <ul className="profile-model-list__list">
          <li className="profile-model-list__header">
            <span className="profile-model-list__header-title">
              Models shared with me (2)
            </span>
          </li>
          <li className="profile-model-list__table-header" key="sharedmodels">
            <span>Name</span>
            <span>Machines, Cloud/region</span>
            <span>Permissions</span>
            <span>Owner</span>
          </li>
          <li className="profile-model-list__row" key="">
            <span>
              <a
                href="/gui/u/tester2/test-db"
                onClick={output.props.children[1].props
                  .children[2].props.children[0].props.children.props.onClick}>
                test-db</a></span>
            <span>2 GCE/US-EAST1</span>
            <span>read</span>
            <span>tester2</span>
          </li>
          <li className="profile-model-list__row" key="">
            <span>
              <a
                href="/gui/u/tester3/website"
                onClick={output.props.children[1].props
                  .children[2].props.children[0].props.children.props.onClick}>
                website</a></span>
            <span>25 GCE/US-EAST1</span>
            <span>admin</span>
            <span>tester3</span>
          </li>
        </ul>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

});
