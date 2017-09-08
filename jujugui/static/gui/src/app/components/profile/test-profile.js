/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ProfileNavigation = require('./navigation/navigation');
const ProfileHeader = require('./header/header');
const ProfileModelList = require('./model-list/model-list');
const Profile = require('./profile');
const Panel = require('../panel/panel');

const jsTestUtils = require('../../utils/component-test-utils');

describe('Profile', function() {

  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <Profile
        acl={{}}
        activeSection={options.activeSection || undefined}
        addNotification={sinon.stub()}
        baseURL="/gui/"
        changeState={options.changeState || sinon.stub()}
        charmstore={{
          list: sinon.stub(),
          url: '/charmstore'
        }}
        facadesExist={true}
        listModelsWithInfo={sinon.stub()}
        destroyModels={sinon.stub()}
        switchModel={sinon.stub()}
        userInfo={{}} />, true);
  }

  it('can render', () => {
    const renderer = renderComponent();
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <Panel
        instanceName="profile"
        visible={true}>
        <ProfileHeader />
        <div className="profile__content">
          <ProfileNavigation
            activeSection={Profile.sectionsMap.entries().next().value[0]}
            changeState={instance.props.changeState}
            sectionsMap={Profile.sectionsMap} />
          <ProfileModelList
            acl={instance.props.acl}
            addNotification={instance.props.addNotification}
            baseURL={instance.props.baseURL}
            changeState={instance.props.changeState}
            facadesExist={instance.props.facadesExist}
            destroyModels={instance.props.destroyModels}
            listModelsWithInfo={instance.props.listModelsWithInfo}
            switchModel={instance.props.switchModel}
            userInfo={instance.props.userInfo} />
        </div>
      </Panel>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can show all of the defined sections', () => {
    Profile.sectionsMap
      .forEach((val, key) => {
        const renderer = renderComponent({
          activeSection: key
        });
        const output = renderer.getRenderOutput();
        const instance = renderer.getMountedInstance();
        expect(output.props.children[1].props.children[1])
          .toEqualJSX(val.getComponent(instance));
      });
  });

});
