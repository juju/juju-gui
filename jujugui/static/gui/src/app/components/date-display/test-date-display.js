/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2016 Canonical Ltd.

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

describe('DateDisplay', () => {
  var date, relative, renderer;

  beforeAll((done) => {
    // By loading this file it adds the component to the juju components.
    YUI().use('date-display', () => { done(); });
  });

  beforeEach(() => {
    date = new Date('Mon, 19 Jan 2020 21:07:24 GMT');
    relative = new Date(date.getTime());
    // Set up the rendered instance here so that we can override the _getNow
    // method and then rerender the component with the correct params in the
    // test.
    renderer = jsTestUtils.shallowRender(
      <juju.components.DateDisplay
        date={relative} />, true);
    var instance = renderer.getMountedInstance();
    sinon.stub(instance, '_getNow').returns(date);
  });

  it('can display a date in the correct format', () => {
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative} />);
    var expected = (
      <time datetime="19/01/2020"
        title="19/01/2020 21:07">
        19/01/2020
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can parse a date from a string', () => {
    var output = renderer.render(
      <juju.components.DateDisplay
        date='Mon, 19 Jan 2020 21:07:24 GMT' />);
    var expected = (
      <time datetime="19/01/2020"
        title="19/01/2020 21:07">
        19/01/2020
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is less than a minute ago', () => {
    relative.setSeconds(date.getSeconds() + 10);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="19/01/2020"
        title="19/01/2020 21:07">
        just now
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is a minute ago', () => {
    relative.setMinutes(date.getMinutes() - 1);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="19/01/2020"
        title="19/01/2020 21:06">
        1 minute ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is minutes ago', () => {
    relative.setMinutes(date.getMinutes() - 19);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="19/01/2020"
        title="19/01/2020 20:48">
        19 minutes ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is an hour ago', () => {
    relative.setHours(date.getHours() - 1);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="19/01/2020"
        title="19/01/2020 20:07">
        1 hour ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is hours ago', () => {
    relative.setHours(date.getHours() - 11);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="19/01/2020"
        title="19/01/2020 10:07">
        11 hours ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is a day ago', () => {
    relative.setDate(date.getDate() - 1);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="18/01/2020"
        title="18/01/2020 21:07">
        1 day ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is days ago', () => {
    relative.setDate(date.getDate() - 6);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="13/01/2020"
        title="13/01/2020 21:07">
        6 days ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is a week ago', () => {
    relative.setDate(date.getDate() - 8);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="11/01/2020"
        title="11/01/2020 21:07">
        1 week ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is weeks ago', () => {
    relative.setDate(date.getDate() - 25);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="25/12/2019"
        title="25/12/2019 21:07">
        3 weeks ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is a month ago', () => {
    relative.setDate(date.getDate() - 32);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="18/12/2019"
        title="18/12/2019 21:07">
        1 month ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date that is months ago', () => {
    relative.setDate(date.getDate() - 100);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="11/10/2019"
        title="11/10/2019 21:07">
        3 months ago
      </time>);
    assert.deepEqual(output, expected);
  });

  it('can display a relative date as regular that is years ago', () => {
    relative.setDate(date.getDate() - 450);
    var output = renderer.render(
      <juju.components.DateDisplay
        date={relative}
        relative={true} />);
    var expected = (
      <time datetime="26/10/2018"
        title="26/10/2018 21:07">
        26/10/2018
      </time>);
    assert.deepEqual(output, expected);
  });
});
