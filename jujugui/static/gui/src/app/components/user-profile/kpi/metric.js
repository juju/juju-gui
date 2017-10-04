/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class UserProfileEntityMetric extends React.Component {
  _renderChart(el) {
    const metric = this.props.metric;
    if (!metric || metric.length === 0) {
      return;
    }
    let max = 0, data = [];
    metric.forEach(d => {
      const mean = d.sum / d.count;
      max = mean > max ? mean : max;
      data.push({date: Date.parse(d.time), mean: mean});
    });
    const d3 = this.props.d3;
    d3.select(el).selectAll('*').remove();
    const chart = d3.select(el)
      .append('svg')
      .attr('width', 500)
      .attr('height', 250)
      .classed('twelve-col last-col', true)
      .datum(data);
    let y = d3.scale.linear()
      .domain([max, 0])
      .range([0, 200]);
    let yAxis = d3.svg.axis()
      .scale(y)
      .orient('left')
      .tickFormat('');
    let x = d3.scale.linear()
      .domain([
        Date.parse(metric[0].time),
        Date.parse(metric[metric.length - 1].time)
      ])
      .range([20, 500]);
    let xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .tickFormat('');
    let line = d3.svg.line()
      .x(d => x(d.date))
      .y(d => y(d.mean) + 10);
    var xg = chart.append('g')
      .classed('axes x-axis', true)
      .attr('transform', 'translate(0, 210)');
    var yg = chart.append('g')
      .classed('axes y-axis', true)
      .attr('transform', 'translate(20, 10)');
    yg.append('text')
      .text('Mean value')
      .attr('x', -100)
      .attr('y', -10)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle');
    xg.append('text')
      .text('Time')
      .attr('x', 250)
      .attr('y', 20);
    yg.call(yAxis);
    xg.call(xAxis);
    chart.append('path')
      .classed('mean', true)
      .attr('d', line);
  }

  componentDidUpdate() {
    this._renderChart(this.div);
  }

  componentDidMount() {
    this._renderChart(this.div);
  }

  render() {
    return (
      <div className="kpi-metric-chart"
        ref={div => this.div = div}></div>);
  }
};

UserProfileEntityMetric.propTypes = {
  d3: PropTypes.object.isRequired,
  metric: PropTypes.array
};

module.exports = UserProfileEntityMetric;
