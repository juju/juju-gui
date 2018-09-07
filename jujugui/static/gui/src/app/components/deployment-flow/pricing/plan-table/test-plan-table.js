'use strict';

const React = require('react');
const enzyme = require('enzyme');

const BasicTable = require('../../../basic-table/basic-table');
const DeploymentPlanTable = require('./plan-table');

describe('DeploymentPlanTable', () => {
  let applications, charms, listPlansForCharm;

  const renderComponent = (options = {}) => enzyme.shallow(
    <DeploymentPlanTable
      addNotification={options.addNotification || sinon.stub()}
      applications={options.applications || applications}
      charms={options.charms || charms}
      listPlansForCharm={options.listPlansForCharm || listPlansForCharm} />
  );

  beforeEach(() => {
    applications = [{
      getAttrs: sinon.stub().returns({
        icon: 'apache2.svg',
        charm: 'cs:apache2',
        id: 'apache2-123',
        name: 'apache2'
      })
    }, {
      getAttrs: sinon.stub().returns({
        charm: 'cs:mysql'
      })
    }];
    charms = {
      getById: sinon.stub()
    };
    charms.getById.withArgs('cs:apache2').returns({
      get: sinon.stub().withArgs('id').returns('cs:apache2'),
      hasMetrics: sinon.stub().returns(true)
    });
    charms.getById.withArgs('cs:mysql').returns({
      hasMetrics: sinon.stub().returns(false)
    });
    listPlansForCharm = sinon.stub().callsArgWith(1, null, [{
      description: 'The standard plan description',
      metrics: {
        memory: 'something'
      },
      price: '$3.25 per GB of RAM per month'
    }]);
  });

  it('can render', function() {
    const wrapper = renderComponent();
    const expected = (
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
          rows={[{
            columns: [{
              content: (
                <div>
                  <img alt="Apache Drill"
                    className="deployment-plan-table__charm-icon"
                    src="apache2.svg" />
                  <span className="deployment-plan-table__charm-name">
                    Apache Drill
                  </span>
                </div>),
              columnSize: 3
            }, {
              content: (
                <div>
                  <h4 className="deployment-plan-table__plan-title">
                    --
                  </h4>
                  <p className="deployment-plan-table__plan-description">
                    The standard plan description
                  </p>
                </div>),
              columnSize: 3
            }, {
              content: '',
              columnSize: 1
            }, {
              content: (
                <span className="deployment-plan-table__metered">
                  Memory
                </span>),
              columnSize: 2
            }, {
              content: '$3.25 per GB of RAM per month',
              columnSize: 3,
              classes: ['u-align--right']
            }],
            key: 'Apache Drill'
          }]}
          tableClasses={['no-margin-bottom']} />
      </div>);
    assert.compareJSX(wrapper, expected);
  });

  it('can handle errors when getting plans', function() {
    const addNotification = sinon.stub();
    listPlansForCharm.callsArgWith(1, 'Uh oh!', null);
    renderComponent({ addNotification });
    assert.equal(addNotification.callCount, 1);
    assert.deepEqual(addNotification.args[0][0], {
      title: 'Fetching plans failed',
      message: 'Fetching plans failed: Uh oh!',
      level: 'error'
    });
  });
});
