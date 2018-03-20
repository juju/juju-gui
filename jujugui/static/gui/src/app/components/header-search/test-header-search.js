/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const HeaderSearch = require('./header-search');

describe('HeaderSearch', function() {
  let appState;

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <HeaderSearch
        appState={options.appState || appState} />
    );
    const instance = wrapper.instance();
    instance.refs = {
      searchInput: {
        blur: sinon.stub(),
        focus: sinon.stub()
      }
    };
    return wrapper;
  };

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
    const wrapper = renderComponent();
    assert.equal(wrapper.prop('className').includes('header-search--active'), true);
  });

  it('hides the close button when not active', function() {
    const wrapper = renderComponent();
    assert.equal(
      wrapper.find('.header-search__close').prop('className').includes(
        'hidden'),
      true);
  });

  it('changes state when the close button is clicked', function() {
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    wrapper.find('.header-search__close').props().onClick();
    instance.componentDidUpdate();
    assert.equal(instance.refs.searchInput.blur.callCount, 1, 'blurStub not called');
    assert.equal(appState.changeState.callCount, 1, 'changeState not called');
    assert.deepEqual(appState.changeState.args[0][0], {
      hash: null,
      store: null,
      search: null
    });
  });

  it('gets cleared when closed', function() {
    appState.current.search = {text: 'hexo'};
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    // The input should have the metadata search value
    assert.equal(
      wrapper.find('.header-search__input').prop('value'), 'hexo');
    // re-render which will get the new state.
    delete appState.current.search;
    wrapper.setProps({ appState });
    // It should be emptied out when metadata.search is undefined.
    // It is important that this is an empty string with React 15.3+ because
    // it now treats an undefined value as the input being 'uncontrolled',
    // so it was switching between controlled and uncontrolled throwing errors.
    assert.equal(wrapper.find('.header-search__input').prop('value'), '');
    assert.equal(instance.refs.searchInput.focus.callCount, 0);
  });

  it('does not clear the search when rerendering', function() {
    appState.current.search = {text: 'hexo'};
    const wrapper = renderComponent();
    // The input should have the metadata search value
    assert.equal(
      wrapper.find('.header-search__input').prop('value'), 'hexo');
    // re-render which will get the new state.
    wrapper.update();
    assert.equal(
      wrapper.find('.header-search__input').prop('value'), 'hexo');
  });

  it('becomes active when the input is focused', function() {
    const wrapper = renderComponent();
    wrapper.find('.header-search__input').simulate('focus');
    assert.equal(
      wrapper.find('.header-search').prop('className').includes(
        'header-search--active'),
      true);
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
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.setState({ active: false });
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
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    wrapper.find('.header-search__search--mobile').props().onClick();
    instance.componentDidUpdate();
    assert.equal(instance.refs.searchInput.blur.callCount, 1);
    assert.equal(appState.changeState.callCount, 1);
    assert.deepEqual(appState.changeState.args[0][0], {
      store: ''
    });
  });

  it('opens the search input if the search button is clicked', function() {
    const preventDefault = sinon.stub();
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    wrapper.find('.header-search__submit').props().onClick({
      preventDefault: preventDefault
    });
    assert.equal(appState.changeState.callCount, 0);
    assert.equal(instance.refs.searchInput.focus.callCount, 1);
    assert.equal(preventDefault.callCount, 1);
    wrapper.update();
    assert.equal(
      wrapper.prop('className').includes('header-search--active'),
      true);
  });

  it('searches when clicking search button if the input is open', function() {
    appState.current = {
      search: {text: 'apache2'},
      activeComponent: 'store'
    };
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.setState({ active: true });
    wrapper.find('.header-search__submit').props().onClick({
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
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.setState({ active: true });
    wrapper.find('.header-search__submit').props().onClick({
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
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    instance.setState({ active: true });
    wrapper.find('.header-search__submit').props().onClick({
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
