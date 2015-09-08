'use strict';

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

describe('AddedServicesList', function() {
  var listItemStub;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('added-services-list', function() { done(); });
  });

  it('generates a list of added services list items', function() {
    var services = ['1', '2', '3'];

    var shallowRenderer = testUtils.createRenderer();
    shallowRenderer.render(
        <juju.components.AddedServicesList
          services={services}/>);

    var output = shallowRenderer.getRenderOutput();
    assert.deepEqual(output.props.children,
      <ul className="added-services-list inspector-view__list">
        <juju.components.AddedServicesListItem service={services[0]} />
        <juju.components.AddedServicesListItem service={services[1]} />
        <juju.components.AddedServicesListItem service={services[2]} />
      </ul>);
  });
});
