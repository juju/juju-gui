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

  it('can render', () => {
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <Profile
        activeSection={undefined}
        changeState={changeState}/>, true);
    const output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    const expected = (
      <juju.components.Panel
        instanceName="profile"
        visible={true}>
        <juju.components.ProfileHeader />
        <div className="inner-wrapper">
          <div className="three-col">
            <juju.components.ProfileNavigation
              activeSection={Profile.sectionsMap.entries().next().value[0]}
              changeState={instance.props.changeState}
              sectionsMap={Profile.sectionsMap} />
          </div>
          <div className="six-col last-col">
            Models
          </div>
        </div>
      </juju.components.Panel>
    );
    expect(output).toEqualJSX(expected);
  });

  it('can show all of the defined sections', () => {
    Profile.sectionsMap
      .forEach((val, key) => {
        const output = jsTestUtils.shallowRender(
          <Profile
            activeSection={key}
            changeState={sinon.stub()} />);
        assert.equal(
          output.props.children[1].props.children[1].props.children,
          val.component);
      });
  });

});
