'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const BasicTable = require('../../../basic-table/basic-table');

class DeploymentPlanTable extends React.Component {
  constructor(props) {
    super(props);
    this.xhrs = [];
    this.state = {
      plans: {}
    };
  }

  componentWillMount() {
    this.props.applications.forEach(application => {
      const app = application.getAttrs();
      const charm = this.props.charms.getById(app.charm);
      if (!charm.hasMetrics()) {
        return;
      }
      this._getPlans(charm);
    });
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr.abort();
    });
  }

  /**
    Get the list of plans available for a charm.
    @param charm {Object} A charm model.
  */
  _getPlans(charm) {
    const id = charm.get('id');
    const xhr = this.props.listPlansForCharm(id, this._getPlansCallback.bind(this, id));
    this.xhrs.push(xhr);
  }

  /**
    Callback for when plans for an entity have been successfully fetched.
    @param charmId {String} The charm id for the returned plans.
    @param error {String} An error message, or null if there's no error.
    @param plans {Array} A list of the plans found.
  */
  _getPlansCallback(charmId, error, plans) {
    if (error) {
      const message = 'Fetching plans failed';
      this.props.addNotification({
        title: message,
        message: `${message}: ${error}`,
        level: 'error'
      });
      console.error(message, error);
    }
    const newPlans = this.state.plans;
    newPlans[charmId] = (plans || [])[0];
    this.setState({ plans: newPlans });
  }

  /**
     Generate the plan rows.
     @returns {Array} the list of rows.
   */
  _generateRows() {
    const rows = [];
    this.props.applications.map(application => {
      const app = application.getAttrs();
      const charm = this.props.charms.getById(app.charm);
      if (!charm.hasMetrics()) {
        return;
      }
      const plan = this.state.plans[app.charm] || {};
      const metered = Object.keys(plan.metrics || {}).join(', ');
      rows.push({
        columns: [{
          content: (
            <div>
              <img alt={app.name}
                className="deployment-plan-table__charm-icon"
                src={app.icon} />
              <span className="deployment-plan-table__charm-name">
                {app.name}
              </span>
            </div>),
          columnSize: 3
        }, {
          content: (
            <div>
              <p className="deployment-plan-table__plan-description">
                {plan.description || '--'}
              </p>
            </div>),
          columnSize: 3
        }, {
          content: '',
          columnSize: 1
        }, {
          content: (
            <span className="deployment-plan-table__metered">
              {metered}
            </span>),
          columnSize: 2
        }, {
          content: plan.price || '--',
          columnSize: 3,
          classes: ['u-align--right']
        }],
        key: app.id
      });
    });
    return rows;
  }

  render() {
    return (
      <div className="deployment-plan-table">
        <BasicTable
          headerClasses={['deployment-plan-table__header-row']}
          headerColumnClasses={['deployment-plan-table__header-column']}
          headers={[{
            content: 'Applications',
            columnSize: 3
          }, {
            content: 'Plan',
            columnSize: 4
          }, {
            content: 'Metered',
            columnSize: 2
          }, {
            content: 'Price',
            classes: ['u-align--right'],
            columnSize: 3
          }]}
          rowClasses={['deployment-plan-table__row']}
          rowColumnClasses={['deployment-plan-table__column']}
          rows={this._generateRows()}
          tableClasses={['no-margin-bottom']} />
      </div>
    );
  }
};

DeploymentPlanTable.propTypes = {
  addNotification: PropTypes.func.isRequired,
  applications: PropTypes.array.isRequired,
  charms: PropTypes.object.isRequired,
  listPlansForCharm: PropTypes.func.isRequired
};

module.exports = DeploymentPlanTable;
