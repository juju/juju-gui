/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');

const ExpandingRow = require('./expanding-row');

const jsTestUtils = require('../../utils/component-test-utils');

describe('ExpandingRow', () => {

  it('can render', () => {
    var renderer = jsTestUtils.shallowRender(
      <ExpandingRow
        classes={{extraClass: true}}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    var expected = (
      <li className={
        'expanding-row twelve-col extraClass expanding-row--clickable'}
      onClick={instance._toggle}>
        <div className="expanding-row__initial twelve-col no-margin-bottom">
          <span>closed</span>
        </div>
        <div className="expanding-row__expanded twelve-col"
          style={{height: '0px', opacity: 0}}>
          <div className="twelve-col no-margin-bottom"
            ref="inner">
            <span>open</span>
          </div>
        </div>
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('can toggle to the expanded view', () => {
    var renderer = jsTestUtils.shallowRender(
      <ExpandingRow>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    // Mock the ref.
    instance.refs = {inner: {offsetHeight: 10}};
    output.props.onClick();
    output = renderer.getRenderOutput();
    const expected = (
      <li className={
        'expanding-row twelve-col expanding-row--expanded ' +
          'expanding-row--clickable'}
      onClick={instance._toggle}>
        <div className="expanding-row__initial twelve-col no-margin-bottom">
          <span>closed</span>
        </div>
        <div className="expanding-row__expanded twelve-col"
          style={{height: '10px', opacity: 1}}>
          <div className="twelve-col no-margin-bottom"
            ref="inner">
            <span>open</span>
          </div>
        </div>
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('can initially be expanded', () => {
    var renderer = jsTestUtils.shallowRender(
      <ExpandingRow
        expanded={true}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    // Mock the ref. The MutationObserver needs a real DOM node.
    instance.refs = {inner: document.createElement('div')};
    // The shallow renderer does not call componentDidMount, so call it
    // manually.
    instance.componentDidMount();
    var output = renderer.getRenderOutput();
    var expected = (
      <li className={
        'expanding-row twelve-col expanding-row--expanded ' +
        'expanding-row--clickable'}
      onClick={instance._toggle}>
        {output.props.children}
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('can update to be expanded', () => {
    var renderer = jsTestUtils.shallowRender(
      <ExpandingRow
        expanded={false}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    // Mock the ref. The MutationObserver needs a real DOM node.
    instance.refs = {inner: document.createElement('div')};
    // The shallow renderer does not call componentDidMount, so call it
    // manually.
    instance.componentDidMount();
    var output = renderer.getRenderOutput();
    output = renderer.render(
      <ExpandingRow
        expanded={true}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>);
    var expected = (
      <li className={
        'expanding-row twelve-col expanding-row--expanded ' +
        'expanding-row--clickable'}
      onClick={instance._toggle}>
        {output.props.children}
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('can be not clickable', () => {
    var renderer = jsTestUtils.shallowRender(
      <ExpandingRow
        clickable={false}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    // Mock the ref. The MutationObserver needs a real DOM node.
    instance.refs = {inner: document.createElement('div')};
    // The shallow renderer does not call componentDidMount, so call it
    // manually.
    instance.componentDidMount();
    var output = renderer.getRenderOutput();
    var expected = (
      <li className="expanding-row twelve-col"
        onClick={undefined}>
        {output.props.children}
      </li>);
    expect(output).toEqualJSX(expected);
  });

  it('can stop observing the DOM when unmounted', () => {
    var renderer = jsTestUtils.shallowRender(
      <ExpandingRow
        clickable={false}>
        <span>closed</span>
        <span>open</span>
      </ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    // Mock the ref. The MutationObserver needs a real DOM node.
    instance.refs = {inner: document.createElement('div')};
    // The shallow renderer does not call componentDidMount, so call it
    // manually.
    instance.componentDidMount();
    assert.isNotNull(instance.observer);
    instance.observer.disconnect = sinon.stub();
    renderer.unmount();
    assert.equal(instance.observer.disconnect.callCount, 1);
  });
});
