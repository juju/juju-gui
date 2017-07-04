/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('Profile Navigation', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('profile-navigation', function() { done(); });
  });

  it('can render', () => {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <juju.components.ProfileNavigation
        changeState={changeState}
        activeSection="bundles"/>);
    const list = output.props.children.props.children;
    const expected = (
      <div className="profile-navigation">
        <ul>
          <li className="" key='Models' onClick={list[0].props.onClick}>
            Models
          </li>
          <li className="active" key='Bundles' onClick={list[1].props.onClick}>
            Bundles
          </li>
          <li className="" key='Charms' onClick={list[2].props.onClick}>
            Charms
          </li>
          <li className="" key='Cloud Credentials'
            onClick={list[3].props.onClick}>
            Cloud Credentials
          </li>
        </ul>
      </div>
    );
    expect(output).toEqualJSX(expected);
  });

  it('calls changeState when nav item clicked', () => {
    const changeState = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <juju.components.ProfileNavigation
        changeState={changeState}/>);
    output.props.children.props.children[1].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {hash: 'bundles'});
  });

  it('updates the active nav item when re-rendered', () => {
    const changeState = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.ProfileNavigation
        changeState={changeState}
        activeSection="bundles"/>, true);
    const output = renderer.getRenderOutput();
    const list = output.props.children.props.children;
    const expected = (
      <div className="profile-navigation">
        <ul>
          <li className="" key='Models' onClick={list[0].props.onClick}>
            Models
          </li>
          <li className="active" key='Bundles' onClick={list[1].props.onClick}>
            Bundles
          </li>
          <li className="" key='Charms' onClick={list[2].props.onClick}>
            Charms
          </li>
          <li className="" key='Cloud Credentials'
            onClick={list[3].props.onClick}>
            Cloud Credentials
          </li>
        </ul>
      </div>
    );
    expect(output).toEqualJSX(expected);
    renderer.render(
      <juju.components.ProfileNavigation
        changeState={changeState}
        activeSection="charms"/>);
    const output2 = renderer.getRenderOutput();
    const list2 = output2.props.children.props.children;
    const expected2 = (
      <div className="profile-navigation">
        <ul>
          <li className="" key='Models' onClick={list2[0].props.onClick}>
            Models
          </li>
          <li className="" key='Bundles' onClick={list2[1].props.onClick}>
            Bundles
          </li>
          <li className="active" key='Charms' onClick={list2[2].props.onClick}>
            Charms
          </li>
          <li className="" key='Cloud Credentials'
            onClick={list2[3].props.onClick}>
            Cloud Credentials
          </li>
        </ul>
      </div>
    );
    expect(output2).toEqualJSX(expected2);
  });

});
