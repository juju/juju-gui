/* Copyright (C) 2017 Canonical Ltd. */

/*
The ISV profile component renders a venders profile with stats based on there
charms and bundles. You can only see this page is you have access.
*/

'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class PlansUsage extends React.Component {
  constructor() {
    super();
    // The parent node for the SVG chart
    this.svg = [];
    // Margins to add framing to the charts
    this.margins = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 50
    };
    // The yScale of the chart
    this.yScale = [];
    // The xScale of the chart
    this.xScale = [];

    this.state = {
      d3Rendered: false
    };
  }

  componentDidMount() {
    this.renderChart();
    this.setState({d3Rendered: true});
  }

  shouldComponentUpdate() {
    return !this.state.d3Rendered;
  }

  /**
    Plot a line on the graph

    @method plotLine
    @param {Array} The line data
  */
  plotLine(data) {
    const d3 = this.props.d3;
    const lineGen = d3.svg.line()
      .x(d => this.xScale(d.date))
      .y(d => this.yScale(d.value));

    this.svg.append('path')
      .attr('d', lineGen(data))
      .attr('stroke', 'teal')
      .classed('line', true);
  }

  /**
    Render the base chart, including the axises.

    @method renderChart
  */
  renderChart() {
    const dataset = this.props.dataset;
    const d3 = this.props.d3;
    const w = 700;
    const h = 500;
    const ticks = dataset[0].length;

    const flattenedDataset = dataset.reduce((a, b) => a.concat(b));

    // Crete a charting domain based on the value set
    const x_domain = d3.extent(flattenedDataset, d => d.date);

    // Crete a charting domain based on the value set
    const y_domain = d3.extent(flattenedDataset, d => d.value);

    // Display date format (05/16)
    const date_format = d3.time.format('%m/%d');

    // Create an SVG container
    const vis = d3.select('.d3-chart-wrapper');
    this.svg = vis.append('svg')
      .attr('width', w)
      .attr('height', h)
      .classed('d3-chart', true);

    // Define the y scale
    this.yScale = d3.scale.linear()
      .domain(y_domain)
      .range([h - this.margins.top, this.margins.bottom]);

    // Define the x scale
    this.xScale = d3.time.scale()
      .domain(x_domain)
      .range([this.margins.left, w - this.margins.left]);

    // Define the y axis
    const yAxis = d3.svg.axis()
      .orient('left')
      .scale(this.yScale)
      .tickFormat(d => `$${d}`);

    // Define the x axis
    const xAxis = d3.svg.axis()
      .orient('bottom')
      .ticks(ticks)
      .scale(this.xScale)
      .tickFormat(date_format);

    // Draw y axis with labels and move in from the size by the amount of
    // padding
    this.svg.append('g')
      .attr('transform', `translate(0, ${h - this.margins.bottom})`)
      .classed('axis', true)
      .call(xAxis);

    // Draw x axis with labels and move to the bottom of the chart area
    this.svg.append('g')
      .attr('transform', `translate(${this.margins.left}, 0)`)
      .classed('axis', true)
      .call(yAxis);

    // Loop through dataset to plot each line
    dataset.forEach(this.plotLine);
  }

  render() {
    return (
      <div className="twelve-col isv-profile__plan-usage">
        <h4>Plan usage</h4>
        <div className="d3-chart-wrapper"></div>
      </div>);
  }
};

PlansUsage.propTypes = {
  d3: PropTypes.object.isRequired,
  dataset: PropTypes.array.isRequired
};

module.exports = PlansUsage;
