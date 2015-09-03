'use strict';

var juju = {components: {}};
var testUtils = React.addons.TestUtils;
var findByTag = testUtils.scryRenderedDOMComponentsWithTag;
var renderIntoDocument = testUtils.renderIntoDocument;

function queryComponentSelector(component, selector, all) {
  var queryFn = (all) ? 'querySelectorAll' : 'querySelector';
  return component.getDOMNode()[queryFn](selector);
}

describe('EnvSizeDisplay', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('env-size-display', function() { done(); });
  });

  it('shows services and machines count', function() {
    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount="3"
          machineCount="4"
          getAppState={function() {}} />);
    assert.equal(
        queryComponentSelector(
            component, 'a[data-view=service]').innerText, '3 services');
    assert.equal(
        queryComponentSelector(
            component, 'a[data-view=machine]').innerText, '4 machines');
  });

  it('highlights active tab on initial render', function() {
    var getAppStateStub = sinon.stub();
    getAppStateStub.returns('machine');

    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount="3"
          machineCount="4"
          getAppState={getAppStateStub} />);

    assert.equal(getAppStateStub.callCount, 1);
    assert.notEqual(
        queryComponentSelector(
            component, 'li.tab.active a[data-view=machine]'), null);
  });

  it('calls to change state when list item is clicked', function() {
    var changeStateStub = sinon.stub();

    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount="3"
          machineCount="4"
          getAppState={function() {}}
          changeState={changeStateStub} />);
    var serviceLink = queryComponentSelector(component, 'a[data-view=service]');
    var machineLink = queryComponentSelector(component, 'a[data-view=machine]');
    testUtils.Simulate.click(machineLink);
    testUtils.Simulate.click(serviceLink);

    assert.equal(changeStateStub.callCount, 2);
    assert.deepEqual(changeStateStub.getCall(0).args[0], {
      sectionB: { component: 'machine', metadata: {} }
    });
    assert.deepEqual(changeStateStub.getCall(1).args[0], {
      sectionB: { component: null, metadata: {} }
    });
  });

  it('highlights the tab which was clicked on', function() {
    var changeStateStub = sinon.stub();

    var component = renderIntoDocument(
        <juju.components.EnvSizeDisplay
          serviceCount="3"
          machineCount="4"
          getAppState={function() {}}
          changeState={changeStateStub} />);
    var serviceLink = queryComponentSelector(component, 'a[data-view=service]');
    var machineLink = queryComponentSelector(component, 'a[data-view=machine]');

    testUtils.Simulate.click(machineLink);
    assert.notEqual(
        queryComponentSelector(
            component, 'li.tab.active a[data-view=machine]'), null);

    testUtils.Simulate.click(serviceLink);
    assert.notEqual(
        queryComponentSelector(
            component, 'li.tab.active a[data-view=service]'), null);

    assert.equal(changeStateStub.callCount, 2);
  });
});
