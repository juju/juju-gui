/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const enzyme = require('enzyme');

const DateDisplay = require('./date-display');

describe('DateDisplay', () => {
  var date, instance, relative, timers;

  const renderComponent = (options = {}, renderOptions = {}) => {
    const wrapper = enzyme.shallow(
      <DateDisplay
        date={options.date}
        relative={options.relative} />, renderOptions);
    instance = wrapper.instance();
    // Mock the method that returns the current datetime to return a preset
    // datetime.
    sinon.stub(instance, '_getNow').returns(date);
    // For the instance to update so that it recalculates with the new method.
    instance.forceUpdate();
    wrapper.update();
    return wrapper;
  };

  beforeEach(() => {
    // Replace setInterval etc. with mocks.
    timers = sinon.useFakeTimers();
    date = new Date('Mon, 19 Jan 2020 21:07:24 GMT');
    relative = new Date(date.getTime());
  });

  afterEach(() => {
    // Restore the native implementations of setInterval etc.
    timers.restore();
  });

  it('can display a date in the correct format', () => {
    const wrapper = renderComponent({ date: relative });
    const expected = (
      <time dateTime="19/01/2020"
        title="19/01/2020 21:07">
        19/01/2020
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can parse a date from a string', () => {
    const wrapper = renderComponent({ date: 'Mon, 19 Jan 2020 21:07:24 GMT' });
    const expected = (
      <time dateTime="19/01/2020"
        title="19/01/2020 21:07">
        19/01/2020
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is less than a minute ago', () => {
    relative.setSeconds(date.getSeconds() + 10);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="19/01/2020"
        title="19/01/2020 21:07">
        just now
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is a minute ago', () => {
    relative.setMinutes(date.getMinutes() - 1);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="19/01/2020"
        title="19/01/2020 21:06">
        1 minute ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is minutes ago', () => {
    relative.setMinutes(date.getMinutes() - 19);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="19/01/2020"
        title="19/01/2020 20:48">
        19 minutes ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is an hour ago', () => {
    relative.setHours(date.getHours() - 1);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="19/01/2020"
        title="19/01/2020 20:07">
        1 hour ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is hours ago', () => {
    relative.setHours(date.getHours() - 11);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="19/01/2020"
        title="19/01/2020 10:07">
        11 hours ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is a day ago', () => {
    relative.setUTCDate(date.getUTCDate() - 1);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="18/01/2020"
        title="18/01/2020 21:07">
        1 day ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is days ago', () => {
    relative.setUTCDate(date.getUTCDate() - 6);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="13/01/2020"
        title="13/01/2020 21:07">
        6 days ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is a week ago', () => {
    relative.setUTCDate(date.getUTCDate() - 8);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="11/01/2020"
        title="11/01/2020 21:07">
        1 week ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is weeks ago', () => {
    relative.setUTCDate(date.getUTCDate() - 25);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="25/12/2019"
        title="25/12/2019 21:07">
        3 weeks ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is a month ago', () => {
    relative.setUTCDate(date.getUTCDate() - 32);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="18/12/2019"
        title="18/12/2019 21:07">
        1 month ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date that is months ago', () => {
    relative.setUTCDate(date.getUTCDate() - 100);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="11/10/2019"
        title="11/10/2019 21:07">
        3 months ago
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('can display a relative date as regular that is years ago', () => {
    relative.setUTCDate(date.getUTCDate() - 450);
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const expected = (
      <time dateTime="26/10/2018"
        title="26/10/2018 21:07">
        26/10/2018
      </time>);
    assert.compareJSX(wrapper, expected);
  });

  it('does not set a timer if the date is not relative', () => {
    const wrapper = renderComponent({
      date: relative,
      relative: false
    });
    const instance = wrapper.instance();
    var forceUpdate = sinon.stub(instance, 'forceUpdate');
    instance.componentDidMount();
    // The timer should not get called times if we skip in time.
    timers.tick(120000);
    assert.equal(forceUpdate.callCount, 0);
  });

  it('updates relative dates every minute', () => {
    const wrapper = renderComponent({
      date: relative,
      relative: true
    }, {disableLifecycleMethods: true});
    const instance = wrapper.instance();
    var forceUpdate = sinon.stub(instance, 'forceUpdate');
    instance.componentDidMount();
    // The timer should get called two times if we skip ahead two minutes.
    timers.tick(120000);
    assert.equal(forceUpdate.callCount, 2);
  });

  it('handles non-date strings passed in', () => {
    const wrapper = renderComponent({
      date: 'today',
      relative: true
    });
    const expected = (
      <span>today</span>
    );
    assert.compareJSX(wrapper, expected);
  });

  it('clears the timer when it unmounts', () => {
    const wrapper = renderComponent({
      date: relative,
      relative: true
    });
    const instance = wrapper.instance();
    instance.componentDidMount();
    assert.isNotNull(instance.timer);
    instance.componentWillUnmount();
    assert.isNull(instance.timer);
  });
});
