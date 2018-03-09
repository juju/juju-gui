/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const HeaderSearch = require('./header-search');
const SvgIcon = require('../svg-icon/svg-icon');

const jsTestUtils = require('../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('HeaderSearch', function() {
  let appState;

  beforeEach(function() {
    appState = {
      current: {},
      changeState: sinon.stub()
    };
  });

  afterEach(() => {
    appState = null;
  });

  it('sets the active class if there is search metadata', function() {
    appState.current.search = 'apache2';
    const className = 'header-search header-search--active';
    const output = jsTestUtils.shallowRender(
      <HeaderSearch
        appState={appState} />);
    assert.deepEqual(output,
      <div className={className} ref="headerSearchContainer">
        {output.props.children}
      </div>);
  });

  it('hides the close button when not active', function() {
    const output = jsTestUtils.shallowRender(
      <HeaderSearch
        appState={appState} />);
    assert.deepEqual(output.props.children[2],
      <span
        className="header-search__close hidden"
        onClick={output.props.children[2].props.onClick}
        role="button"
        tabIndex="0">
        <SvgIcon name="close_16"
          size="16" />
      </span>);
  });

  it('changes state when the close button is clicked', function() {
    const renderer = jsTestUtils.shallowRender(
      <HeaderSearch
        appState={appState} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const blurStub = sinon.stub();
    instance.refs = {
      searchInput: {
        blur: blurStub
      }
    };
    output.props.children[2].props.onClick();
    instance.componentDidUpdate();
    assert.equal(blurStub.callCount, 1, 'blurStub not called');
    assert.equal(appState.changeState.callCount, 1, 'changeState not called');
    assert.deepEqual(appState.changeState.args[0][0], {
      hash: null,
      store: null,
      search: null
    });
  });

  it('gets cleared when closed', function() {
    appState.current.search = {text: 'hexo'};
    const renderer = jsTestUtils.shallowRender(
      <HeaderSearch
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
      <HeaderSearch
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
      <HeaderSearch
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
      <HeaderSearch
        appState={appState} />, true);
    output = renderer.getRenderOutput();
    input = output.props.children[0].props.children[1];
    assert.equal(input.props.value, 'hexo');
  });

  it('becomes active when the input is focused', function() {
    const output = testUtils.renderIntoDocument(
      <HeaderSearch
        appState={appState} />);
    const input = output.refs.searchInput;
    testUtils.Simulate.focus(input);
    assert.isTrue(
      output.refs.headerSearchContainer
        .classList.contains('header-search--active'));
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      store: '',
      root: 'new',
      user: null,
      profile: null,
      gui: {
        machines: null
      }
    });
  });

  it('handles focusing when there is an existing store value', () => {
    appState.current.store = '/u/hatch/juju-gui/precise/14';
    const renderer = jsTestUtils.shallowRender(
      <HeaderSearch
        appState={appState} />, true);
    const instance = renderer.getMountedInstance();
    instance.refs = {
      searchInput: {
        focus: sinon.stub()
      }
    };
    instance.state.active = false;
    instance._handleSearchFocus();
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      root: 'new',
      user: null,
      profile: null,
      gui: {
        machines: null
      }
    });
  });

  it('navigates to the store when the Store button is clicked', function() {
    const renderer = jsTestUtils.shallowRender(
      <HeaderSearch
        appState={appState} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const blurStub = sinon.stub();
    instance.refs = {
      searchInput: {
        blur: blurStub
      }
    };
    output.props.children[1].props.onClick();
    instance.componentDidUpdate();
    assert.equal(blurStub.callCount, 1);
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      store: ''
    });
  });

  it('opens the search input if the search button is clicked', function() {
    const focus = sinon.stub();
    const preventDefault = sinon.stub();
    const renderer = jsTestUtils.shallowRender(
      <HeaderSearch
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
      <HeaderSearch
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
      hash: null,
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
      <HeaderSearch
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
      hash: null,
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
      <HeaderSearch
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
      hash: null,
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
