'use strict';

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('PanelComponent', function() {

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('panel-component', function() { done(); });
  });

  it('generates a visible panel if services are provided', function() {
    var instanceName = 'custom-instance-name';
    var services = ['']; // one service.

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Panel
          instanceName={instanceName}
          services={services}/>);

    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className, 'panel-component ' + instanceName);
    assert.deepEqual(output.props.children,
      <juju.components.AddedServicesList services={services} />);
  });

  it('generates a hidden panel if no services are provided', function() {
    var instanceName = 'custom-instance-name';
    var services = []; // no services.

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.Panel
          instanceName={instanceName}
          services={services}/>);

    var output = shallowRenderer.getRenderOutput();
    assert.equal(output.props.className, 'panel-component ' + instanceName + ' hidden');
    assert.deepEqual(output.props.children,
      <juju.components.AddedServicesList services={services} />);
  });
});
