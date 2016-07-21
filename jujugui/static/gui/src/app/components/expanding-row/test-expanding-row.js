/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3, as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranties of MERCHANTABILITY,
SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
General Public License for more details.

You should have received a copy of the GNU Affero General Public License along
with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('ExpandingRow', () => {

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('expanding-row', () => { done(); });
  });

  it('can render', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ExpandingRow
        classes={{extraClass: true}}>
        <span>closed</span>
        <span>open</span>
      </juju.components.ExpandingRow>, true);
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
    assert.deepEqual(output, expected);
  });

  it('can toggle to the expanded view', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ExpandingRow>
        <span>closed</span>
        <span>open</span>
      </juju.components.ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    var output = renderer.getRenderOutput();
    // Mock the ref.
    instance.refs = {inner: {offsetHeight: 10}};
    output.props.onClick();
    output = renderer.getRenderOutput();
    var expected = (
      <li className={
          'expanding-row twelve-col expanding-row--expanded ' +
          'expanding-row--clickable'}
        onClick={instance._toggle}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can initially be expanded', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ExpandingRow
        expanded={true}>
        <span>closed</span>
        <span>open</span>
      </juju.components.ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    // Mock the ref.
    instance.refs = {inner: {offsetHeight: 10}};
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
    assert.deepEqual(output, expected);
  });

  it('can update to be expanded', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ExpandingRow
        expanded={false}>
        <span>closed</span>
        <span>open</span>
      </juju.components.ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    // Mock the ref.
    instance.refs = {inner: {offsetHeight: 10}};
    // The shallow renderer does not call componentDidMount, so call it
    // manually.
    instance.componentDidMount();
    var output = renderer.getRenderOutput();
    output = renderer.render(
      <juju.components.ExpandingRow
        expanded={true}>
        <span>closed</span>
        <span>open</span>
      </juju.components.ExpandingRow>);
    var expected = (
      <li className={
        'expanding-row twelve-col expanding-row--expanded ' +
        'expanding-row--clickable'}
        onClick={instance._toggle}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });

  it('can be not clickable', () => {
    var renderer = jsTestUtils.shallowRender(
      <juju.components.ExpandingRow
        clickable={false}>
        <span>closed</span>
        <span>open</span>
      </juju.components.ExpandingRow>, true);
    var instance = renderer.getMountedInstance();
    // Mock the ref.
    instance.refs = {inner: {offsetHeight: 10}};
    // The shallow renderer does not call componentDidMount, so call it
    // manually.
    instance.componentDidMount();
    var output = renderer.getRenderOutput();
    var expected = (
      <li className="expanding-row twelve-col"
        onClick={undefined}>
        {output.props.children}
      </li>);
    assert.deepEqual(output, expected);
  });
});
