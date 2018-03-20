/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorChangeVersion = require('./change-version');
const InspectorChangeVersionItem = require('./item/item');

describe('InspectorChangeVersion', function() {
  var acl;

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorChangeVersion
      acl={options.acl || acl}
      addCharm={options.addCharm || sinon.stub()}
      addNotification={options.addNotification || sinon.stub()}
      changeState={options.changeState || sinon.stub()}
      charmId={options.charmId || 'cs:django-5'}
      getAvailableVersions={
        options.getAvailableVersions || sinon.stub().callsArgWith(1, null, [
          'cs:django-4', 'cs:django-5', 'cs:django-6'
        ])}
      getCharm={options.getCharm || sinon.stub()}
      getMacaroon={options.getMacaroon || sinon.stub()}
      service={options.service || {
        get: sinon.stub().returns('django'),
        set: sinon.stub()
      }}
      setCharm={options.setCharm || sinon.stub()} />
  );

  beforeEach(() => {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can display a loading spinner', function() {
    const wrapper = renderComponent({ getAvailableVersions: sinon.stub() });
    assert.equal(wrapper.find('Spinner').length, 1);
  });

  it('can display an empty versions list', function() {
    const getAvailableVersions = sinon.stub().callsArgWith(1, null, ['cs:django']);
    const wrapper = renderComponent({ getAvailableVersions });
    const expected = (
      <ul className="inspector-change-version__versions">
        <li className="inspector-change-version__none">
          No other versions found.
        </li>
      </ul>);
    assert.compareJSX(wrapper.find('.inspector-change-version__versions'), expected);
  });

  it('can display list of versions', function() {
    const wrapper = renderComponent();
    const items = wrapper.find('InspectorChangeVersionItem');
    const expected = (
      <div className="inspector-change-version">
        <div className="inspector-change-version__current">
          Current version:
          <div className="inspector-change-version__current-version"
            onClick={
              wrapper.find('.inspector-change-version__current-version').prop('onClick')}
            role="button"
            tabIndex="0">
            django/5
          </div>
        </div>
        <ul className="inspector-change-version__versions">
          <InspectorChangeVersionItem
            acl={acl}
            buttonAction={items.at(0).prop('buttonAction')}
            downgrade={true}
            itemAction={items.at(0).prop('itemAction')}
            key="cs:django-4"
            url={window.jujulib.URL.fromString('django/4')} />
          <InspectorChangeVersionItem
            acl={acl}
            buttonAction={items.at(1).prop('buttonAction')}
            downgrade={false}
            itemAction={items.at(1).prop('itemAction')}
            key="cs:django-6"
            url={window.jujulib.URL.fromString('django/6')} />
        </ul>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a message if there is a get versions failure', function() {
    var getAvailableVersions = sinon.stub().callsArg(1, 'bad wolf', []);
    const wrapper = renderComponent({ getAvailableVersions });
    const expected = (
      <ul className="inspector-change-version__versions">
        <li className="inspector-change-version__none">
          No other versions found.
        </li>
      </ul>);
    assert.compareJSX(wrapper.find('.inspector-change-version__versions'), expected);
  });

  it('can navigate to the current charm version details', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('.inspector-change-version__current-version').props().onClick();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      store: 'django/5'
    });
  });

  it('can navigate to another charm version details', function() {
    var changeState = sinon.stub();
    const wrapper = renderComponent({ changeState });
    wrapper.find('InspectorChangeVersionItem').at(0).props().itemAction();
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      store: 'django/4'
    });
  });

  it('can change charm version', function() {
    var serviceSet = sinon.stub();
    var addCharm = sinon.stub();
    var service = {
      get: sinon.stub().returns('django'),
      set: serviceSet
    };
    var setCharm = sinon.stub().callsArgWith(4, 'cs:django-4');
    var getCharm = sinon.stub().callsArgWith(1, 'cs:django-4');
    const wrapper = renderComponent({
      addCharm,
      getCharm,
      service,
      setCharm
    });
    wrapper.find('InspectorChangeVersionItem').at(0).props().buttonAction();
    // The charm needs to be added to the model first.
    assert.equal(addCharm.callCount, 1);
    assert.equal(addCharm.args[0][0], 'cs:django-4');
    // Call the callback.
    addCharm.args[0][1]({});
    assert.equal(serviceSet.callCount, 1);
    assert.equal(serviceSet.args[0][1], 'cs:django-4');
  });

  it('adds a notification if it can not add a charm', function() {
    const addNotification = sinon.stub();
    const addCharm = sinon.stub().callsArgWith(1, {err: 'error'});
    const wrapper = renderComponent({
      addNotification,
      addCharm
    });
    wrapper.find('InspectorChangeVersionItem').at(0).props().buttonAction();
    assert.equal(addNotification.callCount, 1);
  });

  it('adds a notification if it can not set a charm', function() {
    var addNotification = sinon.stub();
    var addCharm = sinon.stub().callsArgWith(1, {});
    var setCharm = sinon.stub().callsArgWith(4, {err: 'error'});
    var getCharm = sinon.stub().callsArgWith(1);
    const wrapper = renderComponent({
      addNotification,
      addCharm,
      getCharm,
      setCharm
    });
    wrapper.find('InspectorChangeVersionItem').at(0).props().buttonAction();
    assert.equal(addNotification.callCount, 1);
  });

  it('adds a notification if it can not get a charm', function() {
    var addNotification = sinon.stub();
    var addCharm = sinon.stub().callsArgWith(1, {});
    var setCharm = sinon.stub().callsArgWith(4, {});
    var getCharm = sinon.stub().callsArgWith(1, {err: 'error'});
    const wrapper = renderComponent({
      addNotification,
      addCharm,
      getCharm,
      setCharm
    });
    wrapper.find('InspectorChangeVersionItem').at(0).props().buttonAction();
    assert.equal(addNotification.callCount, 1);
  });

  it('will abort the request when unmounting', function() {
    var abort = sinon.stub();
    var getAvailableVersions = sinon.stub().returns({abort: abort});
    const wrapper = renderComponent({
      getAvailableVersions
    });
    wrapper.unmount();
    assert.equal(abort.callCount, 1);
  });

  it('can handle errors when getting versions', function() {
    const addNotification = sinon.stub();
    const getAvailableVersions = sinon.stub().callsArgWith(1, 'Uh oh!', null);
    renderComponent({
      addNotification,
      getAvailableVersions
    });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'unable to retrieve charm versions',
      message: 'unable to retrieve charm versions: Uh oh!',
      level: 'error'
    });
  });
});
