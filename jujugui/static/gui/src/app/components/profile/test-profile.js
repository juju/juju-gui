/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Profile', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('profile', function() { done(); });
  });

  it('can render', () => {
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <window.juju.components.Profile
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
              changeState={instance.props.changeState}
              activeSection={instance.state.activeSection}/>
          </div>
          <div className="six-col last-col">
            Models
          </div>
        </div>
      </juju.components.Panel>
    );
    expect(output).toEqualJSX(expected);
  });

  ['Models', 'Bundles', 'Charms', 'Cloud Credentials']
    .forEach(label => {
      it(`can show the ${label} section`, () => {
        const output = jsTestUtils.shallowRender(
          <window.juju.components.Profile
            changeState={sinon.stub()}
            activeSection={label.toLowerCase()}/>);
        assert.equal(output.props.children[1].props.children[1].props.children, label); //eslint-disable-line max-len
      });
    });
});
