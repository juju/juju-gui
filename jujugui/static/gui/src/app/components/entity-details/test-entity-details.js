/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const EntityDetails = require('./entity-details');
const EntityContent = require('./content/content');
const EntityHeader = require('./header/header');

const jsTestUtils = require('../../utils/component-test-utils');

describe('EntityDetails', function() {
  var acl, mockEntity, urllib;

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <EntityDetails
        acl={options.acl || acl}
        addNotification={options.addNotification || sinon.stub()}
        apiUrl={options.apiUrl || 'http://example.com'}
        changeState={options.changeState || sinon.stub()}
        clearLightbox={options.clearLightbox || sinon.stub()}
        deployService={options.deployService || sinon.stub()}
        displayLightbox={options.displayLightbox || sinon.stub()}
        flags={options.flags || {}}
        getBundleYAML={options.getBundleYAML || sinon.stub()}
        getDiagramURL={options.getDiagramURL || sinon.stub()}
        getEntity={
          options.getEntity || sinon.stub().callsArgWith(1, null, [mockEntity])}
        getFile={options.getFile || sinon.stub()}
        getModelName={options.getModelName || sinon.stub()}
        hash={options.hash || 'readme'}
        id={options.id || mockEntity.get('id')}
        importBundleYAML={options.importBundleYAML || sinon.stub()}
        listPlansForCharm={options.listPlansForCharm || sinon.stub()}
        makeEntityModel={options.makeEntityModel || sinon.stub().returns(mockEntity)}
        pluralize={options.pluralize || sinon.stub()}
        renderMarkdown={options.renderMarkdown || sinon.stub()}
        scrollCharmbrowser={options.scrollCharmbrowser || sinon.stub()}
        scrollPosition={options.scrollPosition || 100}
        sendAnalytics={options.sendAnalytics || sinon.stub()}
        setPageTitle={options.setPageTitle || sinon.stub()}
        showTerms={options.showTerms || sinon.stub()}
        staticURL={options.staticURL || 'http://example.com'}
        urllib={options.urllib || urllib} />,
      { disableLifecycleMethods: true }
    );
    const instance = wrapper.instance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    wrapper.update();
    return wrapper;
  };

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
    mockEntity = jsTestUtils.makeEntity();
    urllib = sinon.stub();
  });

  afterEach(function() {
    mockEntity = undefined;
  });

  it('fetches an entity properly', function() {
    mockEntity.hasMetrics = sinon.stub().returns(false);
    const id = mockEntity.get('id');
    const getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    const wrapper = renderComponent({
      flags: {'test.ddeploy': true},
      getEntity
    });
    assert.isTrue(getEntity.calledOnce,
      'getEntity function not called');
    assert.equal(getEntity.args[0][0], id,
      'getEntity not called with the entity ID');
    const expected = (
      <div className="entity-details charm"
        ref="content"
        tabIndex="0">
        <div>
          <EntityHeader
            acl={acl}
            addNotification={sinon.stub()}
            changeState={sinon.stub()}
            deployService={sinon.stub()}
            entityModel={mockEntity}
            getBundleYAML={sinon.stub()}
            getModelName={sinon.stub()}
            hasPlans={false}
            importBundleYAML={sinon.stub()}
            plans={null}
            pluralize={sinon.stub()}
            scrollPosition={100}
            urllib={urllib} />
          {undefined}
          <EntityContent
            addNotification={sinon.stub()}
            apiUrl="http://example.com"
            changeState={sinon.stub()}
            clearLightbox={sinon.stub()}
            displayLightbox={sinon.stub()}
            entityModel={mockEntity}
            flags={{'test.ddeploy': true}}
            getDiagramURL={sinon.stub()}
            getFile={sinon.stub()}
            hash="readme"
            hasPlans={false}
            plans={null}
            pluralize={sinon.stub()}
            renderMarkdown={sinon.stub()}
            scrollCharmbrowser={sinon.stub()}
            sendAnalytics={sinon.stub()}
            showTerms={sinon.stub()}
            staticURL="http://example.com" />
        </div>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can display a message if there is a loading error', function() {
    const getEntity = sinon.stub().callsArgWith(1, 'bad wolf', [mockEntity]);
    const wrapper = renderComponent({
      getEntity
    });
    const expected = (
      <div className="entity-details"
        ref="content"
        tabIndex="0">
        <p className="error">
          There was a problem while loading the entity details.
          You could try searching for another charm or bundle or go{' '}
          <span className="link"
            onClick={wrapper.find('.link').prop('onClick')}>
            back
          </span>.
        </p>
      </div>);
    assert.compareJSX(wrapper.find('.entity-details'), expected);
  });

  it('will abort the request when unmounting', function() {
    const abort = sinon.stub();
    const getEntity = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent({
      getEntity
    });
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('sets the focus when rendered', function() {
    const wrapper = renderComponent({
      getEntity: sinon.stub()
    });
    const instance = wrapper.instance();
    assert.equal(instance.refs.content.focus.callCount, 1);
  });

  it('can get plans', function() {
    mockEntity.hasMetrics = sinon.stub().returns(true);
    const plans = ['plan1', 'plan2'];
    const getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    const listPlansForCharm = sinon.stub().callsArgWith(1, null, plans);
    const wrapper = renderComponent({
      getEntity,
      listPlansForCharm
    });
    assert.equal(wrapper.find('EntityHeader').prop('hasPlans'), true);
    assert.deepEqual(wrapper.find('EntityHeader').prop('plans'), plans);
    assert.equal(wrapper.find('EntityContent').prop('hasPlans'), true);
    assert.deepEqual(wrapper.find('EntityContent').prop('plans'), plans);
    assert.equal(listPlansForCharm.callCount, 1);
    assert.equal(listPlansForCharm.args[0][0], 'cs:django');
  });

  it('can set plans to empty on error', function() {
    mockEntity.hasMetrics = sinon.stub().returns(true);
    const getEntity = sinon.stub().callsArgWith(1, null, [mockEntity]);
    const listPlansForCharm = sinon.stub().callsArgWith(1, 'An error', null);
    const wrapper = renderComponent({
      getEntity,
      listPlansForCharm
    });
    assert.equal(wrapper.find('EntityHeader').prop('hasPlans'), true);
    assert.deepEqual(wrapper.find('EntityHeader').prop('plans'), []);
    assert.equal(wrapper.find('EntityContent').prop('hasPlans'), true);
    assert.deepEqual(wrapper.find('EntityContent').prop('plans'), []);
    assert.equal(listPlansForCharm.callCount, 1);
  });

  it('handles errors when getting an entity', function() {
    mockEntity.hasMetrics = sinon.stub().returns(false);
    const addNotification = sinon.stub();
    const getEntity = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    renderComponent({
      addNotification,
      getEntity
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'cannot fetch the entity',
      message: 'cannot fetch the entity: Uh oh!',
      level: 'error'
    });
  });

  it('handles errors when getting plans', function() {
    mockEntity.hasMetrics = sinon.stub().returns(true);
    const addNotification = sinon.stub();
    const listPlansForCharm = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    renderComponent({
      addNotification,
      listPlansForCharm
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Fetching plans failed',
      message: 'Fetching plans failed: Uh oh!',
      level: 'error'
    });
  });
});
