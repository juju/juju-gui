/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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
        <juju.components.UserProfileEntityMetric
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

YUI.add('user-profile-entity-kpi', function() {
  juju.components.UserProfileEntityKPI = UserProfileEntityKPI;
}, '', {
  requires: [
    'user-profile-entity-metric'
  ]
});
