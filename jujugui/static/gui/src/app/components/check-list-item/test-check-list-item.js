/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const CheckListItem = require('./check-list-item');

const jsTestUtils = require('../../utils/component-test-utils');
const testUtils = require('react-dom/test-utils');

describe('CheckListItem', () => {

  it('renders ui based on props', () => {
    const renderer = jsTestUtils.shallowRender(
      <CheckListItem
        aside="3"
        checked={false}
        className="select-all"
        disabled={false}
        id="apache/2"
        key="unique"
        label="a-label"
        whenChanged={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    expect(output).toEqualJSX(
      <li className="check-list-item check-list-item--select-all"
        data-id="apache/2"
        onClick={undefined} role="button" tabIndex="0">
        <label htmlFor="a-label-item">
          <div className="check-list-item__hit-area"
            onClick={instance._hitAreaClick}>
            <input
              checked={false}
              disabled={false}
              id="a-label-item"
              onChange={instance._handleChange}
              onClick={instance._stopBubble}
              type="checkbox" />
          </div>
          <span className="check-list-item__label">
              a-label
          </span>
          {undefined}
          <span className="check-list-item__aside">
              3
          </span>
        </label>
      </li>);
  });

  it('displays extraInfo when provided', () => {
    const renderer = jsTestUtils.shallowRender(
      <CheckListItem
        aside="3"
        checked={false}
        disabled={false}
        extraInfo="Current workload status"
        id="apache/2"
        key="unique"
        label="a-label"
        whenChanged={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    expect(output).toEqualJSX(
      <li className="check-list-item check-list-item--extra-info"
        data-id="apache/2"
        onClick={undefined} role="button" tabIndex="0">
        <label htmlFor="a-label-item">
          <div className="check-list-item__hit-area"
            onClick={instance._hitAreaClick}>
            <input
              checked={false}
              disabled={false}
              id="a-label-item"
              onChange={instance._handleChange}
              onClick={instance._stopBubble}
              type="checkbox" />
          </div>
          <span className="check-list-item__label">
              a-label
          </span>
          <span className="check-list-item__extra-info"
            title="Current workload status">
              Current workload status
          </span>
          <span className="check-list-item__aside">
              3
          </span>
        </label>
      </li>);
  });

  it('does not set a "for" id on the label if it is a nav element', () => {
    const output = jsTestUtils.shallowRender(
      <CheckListItem
        action={sinon.stub()}
        checked={false}
        disabled={false}
        id="apache/2"
        key="unique"
        label="a-label"
        whenChanged={sinon.stub()} />);
    assert.equal(output.props.children.props.htmlFor, undefined);
  });

  it('has a nav class if it is a nav element', () => {
    const output = jsTestUtils.shallowRender(
      <CheckListItem
        action={sinon.stub()}
        checked={false}
        disabled={false}
        id="apache/2"
        key="unique"
        label="a-label"
        whenChanged={sinon.stub()} />);
    assert.isTrue(output.props.className.indexOf(
      'check-list-item--nav') > -1);
  });

  it('calls the supplied whenChanged if supplied', () => {
    const whenChanged = sinon.stub();
    const output = jsTestUtils.shallowRender(
      <CheckListItem
        checked={false}
        disabled={false}
        key="unique"
        label="a-label"
        whenChanged={whenChanged} />);
    const label = output.props.children;
    const hitArea = label.props.children[0];
    const input = hitArea.props.children;
    input.props.onChange({
      currentTarget: {
        checked: true
      }
    });
    assert.equal(whenChanged.callCount, 1);
    assert.equal(whenChanged.args[0][0], true);
  });

  it('does not bubble the click event when clicking a checkbox', () => {
    const actionStub = sinon.stub();
    // Need to render the full component here as shallowRenderer does not yet
    // support simulating click events.
    const output = testUtils.renderIntoDocument(
      <CheckListItem
        action={actionStub}
        checked={false}
        disabled={false}
        id="apache/2"
        key="unique"
        label="a-label"
        whenChanged={sinon.stub()} />);
    const checkbox = testUtils.findRenderedDOMComponentWithTag(output, 'input');
    testUtils.Simulate.click(checkbox);
    assert.equal(actionStub.callCount, 0);
  });

  it('can have a disabled checkbox', () => {
    const renderer = jsTestUtils.shallowRender(
      <CheckListItem
        aside="3"
        checked={false}
        className="select-all"
        disabled={true}
        id="apache/2"
        key="unique"
        label="a-label"
        whenChanged={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    const output = renderer.getRenderOutput();
    const expected = (
      <input
        checked={false}
        disabled={true}
        id="a-label-item"
        onChange={instance._handleChange}
        onClick={instance._stopBubble}
        type="checkbox" />);
    const label = output.props.children;
    const hitArea = label.props.children[0];
    const input = hitArea.props.children;
    expect(input).toEqualJSX(expected);
  });

  it('can toggle the checkbox from the hit area', () => {
    const renderer = jsTestUtils.shallowRender(
      <CheckListItem
        action={sinon.stub()}
        checked={false}
        disabled={false}
        label="a-label"
        whenChanged={sinon.stub()} />, true);
    const instance = renderer.getMountedInstance();
    let output = renderer.getRenderOutput();
    // Simulate clicking on the hit area.
    let label = output.props.children;
    let hitArea = label.props.children[0];
    hitArea.props.onClick(
      {stopPropagation: sinon.stub()});
    output = renderer.getRenderOutput();
    const expected = (
      <input
        checked={true}
        disabled={false}
        id="a-label-item"
        onChange={instance._handleChange}
        onClick={instance._stopBubble}
        type="checkbox" />);
    label = output.props.children;
    hitArea = label.props.children[0];
    const input = hitArea.props.children;
    expect(input).toEqualJSX(expected);
  });
});
