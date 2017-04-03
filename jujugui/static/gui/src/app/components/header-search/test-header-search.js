/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('HeaderSearch', function() {
  let appState;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('header-search', function() { done(); });
  });

  beforeEach(function() {
    appState = {
      current: {},
      changeState: sinon.stub()
    };
  });

  it('sets the active class if there is search metadata', function() {
    appState.current.search = 'apache2';
    const className = 'header-search header-search--active';
    const output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />);
    assert.deepEqual(output,
      <div className={className} ref="headerSearchContainer">
        {output.props.children}
      </div>);
  });

  it('hides the close button when not active', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />);
    assert.deepEqual(output.props.children[2],
      <span tabIndex="0" role="button"
        className="header-search__close hidden"
        onClick={output.props.children[2].props.onClick}>
        <juju.components.SvgIcon name="close_16"
          size="16" />
      </span>);
  });

  it('changes state when the close button is clicked', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />);
    output.props.children[2].props.onClick();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      root: null,
      store: null,
      search: null
    });
  });

  it('gets cleared when closed', function() {
    appState.current.search = {text: 'hexo'};
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />, true);
    let output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    instance.refs = {
      searchInput: {
        focus: sinon.stub()
      }
    };
    // The input should have the metadata search value
    let input = output.props.children[0].props.children[1];
    assert.equal(input.props.value, 'hexo');
    // re-render which will get the new state.
    delete appState.current.search;
    renderer.render(
      <juju.components.HeaderSearch
        appState={appState} />, true);
    output = renderer.getRenderOutput();
    // It should be emptied out when metadata.search is undefined.
    input = output.props.children[0].props.children[1];
    // It is important that this is an empty string with React 15.3+ because
    // it now treats an undefined value as the input being 'uncontrolled',
    // so it was switching between controlled and uncontrolled throwing errors.
    assert.equal(input.props.value, '');
    assert.equal(instance.refs.searchInput.focus.callCount, 0);
  });

  it('does not clear the search when rerendering', function() {
    appState.current.search = {text: 'hexo'};
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />, true);
    let output = renderer.getRenderOutput();
    const instance = renderer.getMountedInstance();
    instance.refs = {
      searchInput: {
        focus: sinon.stub()
      }
    };
    // The input should have the metadata search value
    let input = output.props.children[0].props.children[1];
    assert.equal(input.props.value, 'hexo');
    // re-render which will get the new state.
    renderer.render(
      <juju.components.HeaderSearch
        appState={appState} />, true);
    output = renderer.getRenderOutput();
    input = output.props.children[0].props.children[1];
    assert.equal(input.props.value, 'hexo');
  });

  it('becomes active when the input is focused', function() {
    const output = testUtils.renderIntoDocument(
      <juju.components.HeaderSearch
        appState={appState} />);
    const input = output.refs.searchInput;
    testUtils.Simulate.focus(input);
    assert.isTrue(
        output.refs.headerSearchContainer
                   .classList.contains('header-search--active'));
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      root: 'store',
      user: null,
      profile: null,
      gui: {
        machines: null,
        inspector: null
      }
    });
  });

  it('navigates to the store when the Store button is clicked', function() {
    const output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />);
    output.props.children[1].props.onClick();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      root: 'store'
    });
  });

  it('opens the search input if the search button is clicked', function() {
    const focus = sinon.stub();
    const preventDefault = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {searchInput: {focus: focus}};
    let output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick({
      preventDefault: preventDefault
    });
    assert.equal(appState.changeState.callCount, 0);
    assert.equal(focus.callCount, 1);
    assert.equal(preventDefault.callCount, 1);
    output = renderer.getRenderOutput();
    assert.deepEqual(output,
      <div className={'header-search header-search--active'}
        ref="headerSearchContainer">
        {output.props.children}
      </div>);
  });

  it('searches when clicking search button if the input is open', function() {
    appState.current = {
      search: {text: 'apache2'},
      activeComponent: 'store'
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {searchInput: {focus: sinon.stub()}};
    instance.state.active = true;
    const output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick({
      preventDefault: sinon.stub()
    });
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      root: null,
      search: {
        owner: null,
        provides: null,
        requires: null,
        series: null,
        tags: null,
        text: 'apache2',
        type: null
      },
      store: null
    });
  });

  it('navigates to the store if the query is blank', function() {
    appState.current = {
      search: {text: ''},
      activeComponent: 'store'
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {searchInput: {focus: sinon.stub()}};
    instance.state.active = true;
    const output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick({
      preventDefault: sinon.stub()
    });
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      root: null,
      search: {
        owner: null,
        provides: null,
        requires: null,
        series: null,
        tags: null,
        text: null,
        type: null
      },
      store: ''
    });
  });

  it('navigates to the store if the query is only whitespace', function() {
    appState.current = {
      search: {text: '  '},
      activeComponent: 'store'
    };
    const renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        appState={appState} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {searchInput: {focus: sinon.stub()}};
    instance.state.active = true;
    const output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick({
      preventDefault: sinon.stub()
    });
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      root: null,
      search: {
        owner: null,
        provides: null,
        requires: null,
        series: null,
        tags: null,
        text: null,
        type: null
      },
      store: ''
    });
  });
});
