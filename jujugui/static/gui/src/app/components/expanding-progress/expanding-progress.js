/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const React = require('react');

class ExpandingProgress extends React.Component {
  constructor() {
    super();
    this.state = {active: false};
  }

  componentDidMount() {
    // componentDidMount appears to actually fire before the element is in
    // the DOM so this class gets triggered too early causing the css
    // transitions to not be applied. This setTimeout hack makes sure that
    // it is done after it's in the DOM.
    setTimeout(() => {
      this.setState({active: true});
    });
  }

  render() {
    var classes = classNames('expanding-progress', {
      'expanding-progress--active' : this.state.active
    });
    return (
      <div className={classes}></div>
    );
  }
};

module.exports = ExpandingProgress;
