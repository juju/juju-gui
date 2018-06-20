/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');
const shapeup = require('shapeup');

const EntityDetails = require('./entity-details');
const EntityContent = require('./content/content');
const EntityHeader = require('./header/header');

const jsTestUtils = require('../../utils/component-test-utils');

describe('EntityDetails', function() {
  let acl, charmstore, mockEntity, models;

  const renderComponent = (options = {}) => {
    const wrapper = enzyme.shallow(
      <EntityDetails
        acl={options.acl || acl}
        addNotification={options.addNotification || sinon.stub()}
        changeState={options.changeState || sinon.stub()}
        charmstore={options.charmstore || charmstore}
        clearLightbox={options.clearLightbox || sinon.stub()}
        deployService={options.deployService || sinon.stub()}
        displayLightbox={options.displayLightbox || sinon.stub()}
        flags={options.flags || {}}
        getModelName={options.getModelName || sinon.stub()}
        hash={options.hash || 'readme'}
        id={options.id || mockEntity.get('id')}
        importBundleYAML={options.importBundleYAML || sinon.stub()}
        listPlansForCharm={options.listPlansForCharm || sinon.stub()}
        scrollCharmbrowser={options.scrollCharmbrowser || sinon.stub()}
        scrollPosition={options.scrollPosition || 100}
        sendAnalytics={options.sendAnalytics || sinon.stub()}
        setPageTitle={options.setPageTitle || sinon.stub()}
        showTerms={options.showTerms || sinon.stub()}
        staticURL={options.staticURL || 'http://example.com'} />,
      { disableLifecycleMethods: true }
    );
    const instance = wrapper.instance();
    instance.refs = {content: {focus: sinon.stub()}};
    instance.componentDidMount();
    wrapper.update();
    return wrapper;
  };

  beforeEach(function() {
    mockEntity = jsTestUtils.makeEntity();
    // The makeEntityModel util uses the global models variable, so fake that here.
    models = window.models;
    window.models = {
      Bundle: sinon.stub().returns(mockEntity),
      Charm: sinon.stub().returns(mockEntity)
    };
    acl = {isReadOnly: sinon.stub().returns(false)};
    charmstore = {
      getBundleYAML: sinon.stub(),
      getDiagramURL: sinon.stub(),
      getEntity: sinon.stub().callsArgWith(1, null, [mockEntity]),
      getFile: sinon.stub(),
      reshape: shapeup.reshapeFunc,
      url: 'http://example.com'
    };
  });

  afterEach(function() {
    window.models = models;
    mockEntity = undefined;
  });

  it('fetches an entity properly', function() {
    mockEntity.hasMetrics = sinon.stub().returns(false);
    charmstore.getEntity.callsArgWith(1, null, [mockEntity]);
    const wrapper = renderComponent({
      flags: {'test.ddeploy': true}
    });
    assert.isTrue(charmstore.getEntity.calledOnce,
      'getEntity function not called');
    assert.equal(charmstore.getEntity.args[0][0], 'django',
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
            scrollPosition={100} />
          {undefined}
          <EntityContent
            addNotification={sinon.stub()}
            changeState={sinon.stub()}
            charmstore={{
              getDiagramURL: charmstore.getDiagramURL,
              getFile: charmstore.getFile,
              reshape: shapeup.reshapeFunc,
              url: charmstore.url
            }}
            clearLightbox={sinon.stub()}
            displayLightbox={sinon.stub()}
            entityModel={mockEntity}
            flags={{'test.ddeploy': true}}
            hash="readme"
            hasPlans={false}
            plans={null}
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
    charmstore.getEntity.callsArgWith(1, 'bad wolf', [mockEntity]);
    const wrapper = renderComponent();
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
    charmstore.getEntity = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent();
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('sets the focus when rendered', function() {
    charmstore.getEntity = sinon.stub();
    const wrapper = renderComponent();
    const instance = wrapper.instance();
    assert.equal(instance.refs.content.focus.callCount, 1);
  });

  it('can get plans', function() {
    mockEntity.hasMetrics = sinon.stub().returns(true);
    const plans = ['plan1', 'plan2'];
    charmstore.getEntity.callsArgWith(1, null, [mockEntity]);
    const listPlansForCharm = sinon.stub().callsArgWith(1, null, plans);
    const wrapper = renderComponent({ listPlansForCharm });
    assert.equal(wrapper.find('EntityHeader').prop('hasPlans'), true);
    assert.deepEqual(wrapper.find('EntityHeader').prop('plans'), plans);
    assert.equal(wrapper.find('EntityContent').prop('hasPlans'), true);
    assert.deepEqual(wrapper.find('EntityContent').prop('plans'), plans);
    assert.equal(listPlansForCharm.callCount, 1);
    assert.equal(listPlansForCharm.args[0][0], 'cs:django');
  });

  it('can set plans to empty on error', function() {
    mockEntity.hasMetrics = sinon.stub().returns(true);
    charmstore.getEntity.callsArgWith(1, null, [mockEntity]);
    const listPlansForCharm = sinon.stub().callsArgWith(1, 'An error', null);
    const wrapper = renderComponent({ listPlansForCharm });
    assert.equal(wrapper.find('EntityHeader').prop('hasPlans'), true);
    assert.deepEqual(wrapper.find('EntityHeader').prop('plans'), []);
    assert.equal(wrapper.find('EntityContent').prop('hasPlans'), true);
    assert.deepEqual(wrapper.find('EntityContent').prop('plans'), []);
    assert.equal(listPlansForCharm.callCount, 1);
  });

  it('handles errors when getting an entity', function() {
    mockEntity.hasMetrics = sinon.stub().returns(false);
    const addNotification = sinon.stub();
    charmstore.getEntity.callsArgWith(1, 'Uh oh!', null);
    renderComponent({ addNotification });
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
