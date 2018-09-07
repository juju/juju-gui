'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorPlan = require('./plan');

describe('InspectorPlan', () => {
  var acl;

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorPlan
      acl={options.acl || acl}
      changeState={options.changeState || sinon.stub()}
      currentPlan={options.currentPlan}
      service={options.service || {}} />
  );

  beforeEach(function() {
    acl = {isReadOnly: sinon.stub().returns(false)};
  });

  it('can render correctly with a selected plan', () => {
    var currentPlan = {
      description: 'best description ever',
      price: 'price/goes/here',
      url: 'canonical-landscape/24-7'
    };
    const wrapper = renderComponent({ currentPlan });
    var expected = (
      <div className="inspector-plan">
        <div className="inspector-plan__details">
          <div className="inspector-plan__title">{currentPlan.url}</div>
          <div className="inspector-plan__price">{currentPlan.price}</div>
          <div className="inspector-plan__description">
            {currentPlan.description}
          </div>
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can render correctly without a selected plan', () => {
    const wrapper = renderComponent();
    var expected = (
      <div className="inspector-plan">
        <div className="inspector-plan__no-plan">
          You have no active plan
        </div>
      </div>);
    assert.compareJSX(wrapper, expected);
  });

});
