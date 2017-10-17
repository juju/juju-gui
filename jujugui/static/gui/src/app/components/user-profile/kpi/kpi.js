/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const UserProfileEntityMetric = require('./metric');

class UserProfileEntityKPI extends React.Component {
  constructor() {
    super();
    this.state = {
      currentMetric: []
    };
  }

  /**
    Tell the metric component to render a graph of a specific metric.

    @method _showMetric
    @param {String} metric The metric to show (selected from metricTypes)
  */
  _showMetric(metric) {
    // TODO:
    // the ability to select a metric does not work properly, and we don't
    // know enough about the eventual metrics of charms to guess how; for
    // now, just render the first metric at hand. See also the comment in
    // in componentDidMount
    // Makyo 2017-04-03
    metric = this.props.metrics[0].metric;
    this.setState({
      currentMetric: this.props.metrics.filter(d => d.metric === metric)
    });
  }

  /**
    Show the metric when the component has mounted
  */
  componentDidMount() {
    // TODO:
    // the select isn't working; this should be the on-change callback
    // but for now just call it
    // Makyo 2017-04-03
    this._showMetric('bad-wolf');
  }

  /**
     Render a metric into the entity
     TODO: in the future, this will include an instance of inset-select
     to choose which metric.
  */
  render() {
    return (
      <div className="twelve-col last-col">
        <UserProfileEntityMetric
          d3={this.props.d3}
          metric={this.state.currentMetric} />
      </div>);
  }
};

UserProfileEntityKPI.propTypes = {
  d3: PropTypes.object.isRequired,
  metricTypes: PropTypes.array.isRequired,
  metrics: PropTypes.array.isRequired
};

module.exports = UserProfileEntityKPI;
