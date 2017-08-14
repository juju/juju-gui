/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Profile', function() {
  let Profile;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('profile', function() {
      Profile = juju.components.Profile;
      done();
    });
  });

  function renderComponent(options={}) {
    return jsTestUtils.shallowRender(
      <window.juju.components.Profile
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
      <juju.components.Panel
        instanceName="profile"
        visible={true}>
        <juju.components.ProfileHeader />
        <div className="profile__content">
          <juju.components.ProfileNavigation
            activeSection={Profile.sectionsMap.entries().next().value[0]}
            changeState={instance.props.changeState}
            sectionsMap={Profile.sectionsMap} />
          <juju.components.ProfileModelList
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
      </juju.components.Panel>
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
