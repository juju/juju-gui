/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const InspectorRelateTo = require('./relate-to');

describe('InspectorRelateTo', function() {

  const renderComponent = (options = {}) => enzyme.shallow(
    <InspectorRelateTo
      application={options.application || {}}
      changeState={options.changeState || sinon.stub()}
      relatableApplications={options.relatableApplications || [{
        getAttrs: () => ({ id: 'id', name: 'name', icon: 'icon'})
      }]} />
  );

  it('can render properly', () => {
    const wrapper = renderComponent();
    var expected = (
      <div className="inspector-relate-to">
        <ul className="inspector-view__list">
          {[<li className="inspector-view__list-item"
            data-id="id"
            key="id0"
            onClick={wrapper.find('.inspector-view__list-item').prop('onClick')}
            role="button"
            tabIndex="0">
            <img className="inspector-view__item-icon" src="icon" />
              name
          </li>]}
        </ul>
      </div>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('can render when there are no relatable endpoints', () => {
    const wrapper = renderComponent({ relatableApplications: [] });
    assert.equal(
      wrapper.find('.unit-list__message').text(),
      'No relatable endpoints available.');
  });

  it('can navigate to relate-to-endpoint', () => {
    var changeState = sinon.stub();
    const wrapper = renderComponent({
      application: {
        get: () => 'my-id'
      },
      changeState
    });
    // Trigger a relation click.
    wrapper.find('.inspector-view__list-item').simulate('click', {
      currentTarget: {
        getAttribute: sinon.stub().withArgs('data-id').returns('zee-spouse')
      }
    });
    assert.equal(changeState.callCount, 1);
    assert.deepEqual(changeState.args[0][0], {
      gui: {
        inspector: {
          id: 'my-id',
          'relate-to': 'zee-spouse',
          activeComponent: 'relate-to'
        }}});

  });

});
