/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ExpandingRow = require('../../expanding-row/expanding-row');
const GenericButton = require('../../generic-button/generic-button');
const TermsPopup = require('../../terms-popup/terms-popup');

class BudgetTableRow extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      editAllocation: false,
      expanded: false,
      plans: [],
      plansLoading: false,
      showTerms: false,
      terms: [],
      termsLoading: false
    };
  }

  componentWillMount() {
    if (this.props.withPlans) {
      this._getPlans();
    }
    if (this.props.showTerms) {
      this._getTerms();
    }
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Get the list of plans available for the service.
    @method _getPlans
  */
  _getPlans() {
    this.setState({plansLoading: true}, () => {
      const xhr = this.props.listPlansForCharm(
        this.props.service.get('charm'), this._getPlansCallback.bind(this));
      this.xhrs.push(xhr);
    });
  }

  /**
    Callback for when plans for an entity have been successfully fetched.

    @method _getPlansCallback
    @param {String} error An error message, or null if there's no error.
    @param {Array} plans A list of the plans found.
  */
  _getPlansCallback(error, plans) {
    if (error) {
      const message = 'Fetching plans failed';
      this.props.addNotification({
        title: message,
        message: `${message}: ${error}`,
        level: 'error'
      });
      console.error(message, error);
    } else {
      this.setState({
        plansLoading: false,
        plans: plans
      });
    }
  }

  /**
   Toggle the expanded state.

   @method _toggle
  */
  _toggle() {
    this.setState({expanded: !this.state.expanded});
  }

  /**
   Toggle the terms state.

   @method _toggleTerms
  */
  _toggleTerms() {
    this.setState({showTerms: !this.state.showTerms});
  }

  /**
   Toggle the allocation field state.

   @method _toggleAllocation
  */
  _toggleAllocation() {
    this.setState({editAllocation: !this.state.editAllocation});
  }

  /**
   Generate the change plan form.

   @method _generatePlans
   @returns {Object} The plan form.
  */
  _generatePlans() {
    var disabled = this.props.acl.isReadOnly();
    var plans = this.state.plans.map((plan, i) => {
      return (
        <li className="budget-table__plan twelve-col"
          key={i}>
          <div className="six-col">
            <h4>{plan.url}</h4>
            <p>{plan.description}</p>
          </div>
          <div className="two-col">
            {plan.price}
          </div>
          <div className="two-col">
            Recommended allocation: $550.
          </div>
          <div className="two-col last-col">
            <GenericButton
              action={this._toggle.bind(this)}
              disabled={disabled}
              type="neutral">
              Select plan
            </GenericButton>
          </div>
        </li>);
    });
    return (
      <ul className="budget-table__plans twelve-col no-margin-bottom">
        {plans}
      </ul>);
  }

  /**
   Generate the change plan form.

   @method _generateChangePlan
   @returns {Object} The plan form.
  */
  _generateChangePlan() {
    if (!this.props.plansEditable ||
        this.state.plans && this.state.plans.length === 0) {
      return;
    }
    return (
      <div className="budget-table-row__change-plan">
        <div className="budget-table__current twelve-col no-margin-bottom">
          {this._generateSharedFields()}
        </div>
        {this._generatePlans()}
        <p className="budget-table__plan-notice twelve-col">
          By setting an allocation and selecting a plan you agree to the
          plans terms and conditions
        </p>
      </div>);
  }

  /**
   Generate the edit button if editable.

   @method _generateEdit
   @returns {Object} The edit component.
  */
  _generateEdit() {
    if (!this.props.plansEditable || this.state.plans.length === 0) {
      return;
    }
    var disabled = this.props.acl.isReadOnly();
    return (
      <div className="two-col last-col no-margin-bottom">
        <div className="budget-table__edit">
          <GenericButton
            action={this._toggle.bind(this)}
            disabled={disabled}
            type="neutral">
            Change plan
          </GenericButton>
        </div>
      </div>);
  }

  /**
   Generate the input or display for the allocation.

   @method _generateAllocation
   @returns {Object} The allocation markup.
  */
  _generateAllocation() {
    if (this.props.allocationEditable && this.state.editAllocation) {
      return (
        <input className="budget-table-row__allocation-input"
          type="text"
          value="$1" />);
    } else {
      return (
        <span onClick={
          this.props.allocationEditable ? this._toggleAllocation : undefined}>
          $1
        </span>);
    }
  }

  /**
   Generate the shared fields.

   @method _generateSharedFields
   @returns {Object} The fields markup.
  */
  _generateSharedFields() {
    var service = this.props.service;
    return (
      <div>
        <div className="five-col no-margin-bottom">
          <img className="budget-table__charm-icon"
            src={service.get('icon')} />
          {service.get('name')}
        </div>
      </div>);
  }

  /**
    Generate the details for the selected plan.

    @method _generateSelectedPlan
    @returns {Object} The plan markup.
  */
  _generateSelectedPlan() {
    var service = this.props.service;
    var activePlan = service.get('activePlan');
    if (activePlan) {
      return (
        <span className="budget-table-row__plan">
          {activePlan.url} ({activePlan.price})
        </span>);
    } else if (this.state.plans.length > 0) {
      return (
        <span className="budget-table-row__plan">
          You need to select a plan
        </span>);
    } else {
      return (
        <span className="budget-table-row__plan">
          -
        </span>);
    }
  }

  /**
    Get the list of terms for the application, updating the state with these
    terms.

    @method _getTerms
  */
  _getTerms() {
    // Get the list of terms for the uncommitted apps.
    const terms = this._getTermIds();
    // If there are no terms for this application then we don't need to
    // display anything.
    if (!terms || !terms.length) {
      this.setState({terms: [], termsLoading: false});
      return;
    }
    this.setState({termsLoading: true}, () => {
      terms.forEach(term => {
        term = this.props.parseTermId(term);
        const id = term.owner ? `${term.owner}/${term.name}` : term.name;
        const xhr = this.props.showTerms(id, term.revision, (error, term) => {
          if (error) {
            const message = `Could not retrieve "${term}" terms.`;
            this.props.addNotification({
              title: message,
              message: `${message}: ${error}`,
              level: 'error'
            });
            console.error(message, error);
            return;
          }
          const terms = this.state.terms;
          terms.push(term);
          this.setState({terms: terms});
        });
        this.xhrs.push(xhr);
        this.setState({termsLoading: false});
      });
    });
  }

  /**
    Generate the terms link.

    @method _generateTermsLink
    @returns {Object} The terms link markup.
  */
  _generateTermsLink() {
    if (!this.props.showTerms) {
      return;
    }
    const terms = this._getTermIds();
    if (terms && terms.length > 0) {
      return (
        <div className={
          'two-col prepend-five no-margin-bottom budget-table-row__link ' +
          'budget-table-row__terms-link'}>
          <GenericButton
            action={this._toggleTerms.bind(this)}
            type="base">
            Terms
          </GenericButton>
        </div>);
    }
  }

  /**
    Get the terms ids for the application.

    @method _getTermIds
    @returns {Array} The list of terms for the application.
  */
  _getTermIds() {
    return this.props.charmsGetById(
      this.props.service.get('charm')).get('terms') || [];
  }

  /**
    Generate the terms the user needs to agree to.

    @method _generateTerms
    @returns {Object} The terms markup.
  */
  _generateTerms() {
    if (!this.state.showTerms) {
      return;
    }
    return (
      <TermsPopup
        close={this._toggleTerms.bind(this)}
        terms={this.state.terms} />);
  }

  /**
    Generate plan cols.

    @method _generatePlanCols
    @returns {Object} The plan cols markup.
  */
  _generatePlanCols() {
    if (!this.props.withPlans) {
      return;
    }
    const plansEditable = this.props.plansEditable;
    const editableWidth = !plansEditable ? 'two-col' : 'one-col';
    return (
      <div className="budget-table-row__plans">
        <div className="three-col no-margin-bottom">
          {this._generateSelectedPlan()}
        </div>
        <div className={editableWidth + ' no-margin-bottom'}>
          $1
        </div>
        <div className={editableWidth + ' no-margin-bottom'}>
          {this._generateAllocation()}
        </div>
        <div className={
          'one-col no-margin-bottom' + (plansEditable ? '' : ' last-col')}>
          $1
        </div>
        {this._generateEdit()}
      </div>
    );
  }

  render() {
    var classes = {
      'budget-table-row': true,
      'twelve-col': true
    };
    return (
      <div>
        <ExpandingRow
          classes={classes}
          clickable={false}
          expanded={this.state.expanded}>
          <div>
            {this._generateSharedFields()}
            {this._generatePlanCols()}
            <div className="twelve-col no-margin-bottom budget-table-row__extra">
              {this.props.extraInfo}
            </div>
            {this._generateTermsLink()}
          </div>
          <div className="budget-table-row__change-plan-wrapper">
            {this._generateChangePlan()}
          </div>
        </ExpandingRow>
        {this._generateTerms()}
      </div>
    );
  }
};

BudgetTableRow.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  allocationEditable: PropTypes.bool,
  charmsGetById: PropTypes.func,
  extraInfo: PropTypes.object,
  listPlansForCharm: PropTypes.func,
  parseTermId: PropTypes.func,
  plansEditable: PropTypes.bool,
  service: PropTypes.object.isRequired,
  showTerms: PropTypes.func,
  withPlans: PropTypes.bool
};

module.exports = BudgetTableRow;
