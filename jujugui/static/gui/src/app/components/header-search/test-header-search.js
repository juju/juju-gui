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

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('header-search', function() { done(); });
  });

  it('sets the active class if there is search metadata', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    getAppState.withArgs('current', 'sectionC', 'metadata').returns({
      search: 'apache2'
    });
    getAppState.withArgs('current', 'sectionC', 'component').returns(
      'charmbrowser');
    var className = 'header-search header-search--active';
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />);
    assert.deepEqual(output,
      <div className={className} ref="headerSearchContainer">
        {output.props.children}
      </div>);
  });

  it('hides the close button when not active', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState}
        active={false} />);
    assert.deepEqual(output.props.children[2],
      <span tabIndex="0" role="button"
        className="header-search__close hidden"
        onClick={output.props.children[2].props.onClick}>
        <juju.components.SvgIcon name="close_16"
          size="16" />
      </span>);
  });

  it('changes state when the close button is clicked', function() {
    var getAppState = sinon.stub();
    getAppState.withArgs(
      'current', 'sectionC', 'component').returns('charmbrowser');
    getAppState.withArgs(
      'current', 'sectionC', 'metadata').returns(undefined);
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />);
    output.props.children[2].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: null,
        metadata: null
      }
    });
  });

  it('gets cleared when closed', function() {
    var getAppState = sinon.stub();
    getAppState.withArgs(
      'current', 'sectionC', 'component').onFirstCall().returns('charmbrowser');
    getAppState.withArgs(
      'current', 'sectionC', 'component').onSecondCall().returns(null);
    getAppState.withArgs('current', 'sectionC', 'metadata')
               .onFirstCall().returns({ search: 'hexo' });
    getAppState.withArgs('current', 'sectionC', 'metadata')
               .onSecondCall().returns({ search: '' });
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    instance.refs = {
      searchInput: {
        focus: sinon.stub()
      }
    };
    // The input should have the metadata search value
    var input = output.props.children[0].props.children[1];
    assert.equal(input.props.value, 'hexo');
    // re-render which will get the new state.
    renderer.render(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />, true);
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
    var getAppState = sinon.stub();
    getAppState.withArgs(
      'current', 'sectionC', 'component').returns('charmbrowser');
    getAppState.withArgs('current', 'sectionC', 'metadata')
               .onFirstCall().returns({ search: 'hexo' });
    getAppState.withArgs('current', 'sectionC', 'metadata')
               .onSecondCall().returns({ search: '' });
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />, true);
    var output = renderer.getRenderOutput();
    var instance = renderer.getMountedInstance();
    instance.refs = {
      searchInput: {
        focus: sinon.stub()
      }
    };
    // The input should have the metadata search value
    var input = output.props.children[0].props.children[1];
    assert.equal(input.props.value, 'hexo');
    // re-render which will get the new state.
    renderer.render(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />, true);
    output = renderer.getRenderOutput();
    input = output.props.children[0].props.children[1];
    assert.equal(input.props.value, 'hexo');
  });

  it('becomes active when the input is focused', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    var output = testUtils.renderIntoDocument(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState}
        active={true} />);
    var input = output.refs.searchInput;
    testUtils.Simulate.focus(input);
    assert.isTrue(
        output.refs.headerSearchContainer
                   .classList.contains('header-search--active'));
  });

  it('navigates to the store when the Store button is clicked', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />);
    output.props.children[1].props.onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'store'
        }
      }
    });
  });

  it('opens the search input if the search button is clicked', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    var focus = sinon.stub();
    var preventDefault = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {searchInput: {focus: focus}};
    var output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick({
      preventDefault: preventDefault
    });
    assert.equal(changeState.callCount, 0);
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
    var getAppState = sinon.stub().returns({
      search: 'apache2',
      activeComponent: 'store'
    });
    var changeState = sinon.stub();
    var renderer = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState} />, true);
    var instance = renderer.getMountedInstance();
    instance.refs = {searchInput: {focus: sinon.stub()}};
    instance.state.active = true;
    var output = renderer.getRenderOutput();
    output.props.children[0].props.children[0].props.onClick({
      preventDefault: sinon.stub()
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      sectionC: {
        component: 'charmbrowser',
        metadata: {
          activeComponent: 'search-results',
          search: 'apache2'
        }
      }
    });
  });
});
