/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const ButtonRow = require('../../button-row/button-row');
const InspectorConfirm = require('../confirm/confirm');
const OverviewAction = require('../overview-action/overview-action');

class ServiceOverview extends React.Component {
  constructor() {
    super();
    this.state = {
      activePlan: null,
      plans: null
    };
  }

  componentWillMount() {
    const props = this.props;

    if (!props.displayPlans) {
      return;
    }

    if (!props.charm.hasMetrics()) {
      // Do not request or update the plans if this charm doesn't
      // have any metrics.
      return;
    }

    if (!props.showPlans) {
      // If the showPlans is false then return here. This is set by the
      // "plans" flag.
      return;
    }

    const plans = props.charm.get('plans');
    const service = props.service;
    const activePlan = service.get('activePlan');
    const modelUUID = props.modelUUID;

    if (plans || activePlan) {
      // If we already have plans then set them so that the UI can render
      // with available data.
      this.setState({plans, activePlan});
    }

    if (modelUUID && (plans === undefined || activePlan === undefined)) {
      // Do not make a request if we're in a uncommitted model. modelUUID
      // will be undefined in this case.
      // If we don't have the plans or the activePlan then make a request
      // to fetch them. This is a fallback as the UI should handle
      // insufficient data transparently.
      props.showActivePlan(
        modelUUID,
        service.get('name'),
        (err, activePlan, plans) => {
          if (err) {
            const message = 'fetching plan failed';
            this.props.addNotification({
              title: message,
              message: `${message}: ${err}`,
              level: 'error'
            });
            console.error(message, err);
            return;
          }
          if (plans && plans.length > 0) {
            service.set('activePlan', activePlan);
            this.setState({ activePlan, plans });
          }
        });
    }
  }

  /**
    Fires changeState to update the UI based on the component clicked.

    @method _navigate
    @param {Object} e The click event.
  */
  _navigate(e) {
    const title = e.currentTarget.getAttribute('title');
    let activeAction;
    this.state.actions.some(action => {
      if (action.title === title) {
        activeAction = action;
        return true;
      }
    });
    this.props.changeState(activeAction.state);
  }

  /**
    Returns the actions for the overview view.
    @method _generateActionList
    @returns {Array} The array of overview action components.
  */
  _generateActionList(actions) {
    const items = [];
    actions.forEach(function(action) {
      items.push(
        <OverviewAction
          action={action.action}
          icon={action.icon}
          key={action.title}
          linkAction={action.linkAction}
          linkTitle={action.linkTitle}
          title={action.title}
          value={action.value}
          valueType={action.valueType} />);
    });
    return items;
  }

  /**
    create the actions based on the provded service.
    @method _generateActions
    @param {Object} service The service object.
    @returns {Array} The array of actions.
  */
  _generateActions(service) {
    const serviceId = service.get('id');
    const state = this.state;
    const actions = [];
    const units = service.get('units').toArray();
    const statusCounts = this.props.getUnitStatusCounts(units);
    const plans = this.props.charm.get('plans');
    statusCounts.all = {size: units.length};
    const statuses = [{
      title: 'Units',
      key: 'all',
      icon: 'units'
    }, {
      title: 'Errors',
      key: 'error'
    }, {
      title: 'Pending',
      key: 'pending'
    }, {
      title: 'Uncommitted',
      key: 'uncommitted'
    }];
    statuses.forEach(function(status) {
      const key = status.key;
      const count = statusCounts[key].size;
      if (count > 0 || key === 'all') {
        actions.push({
          title: status.title,
          icon: status.icon,
          value: count,
          valueType: key,
          action: this._navigate.bind(this),
          state: {
            gui: {
              inspector: {
                id: serviceId,
                activeComponent: 'units',
                unitStatus: key === 'all' ? null : key}}}});
      }
    }, this);

    actions.push({
      title: 'Configure',
      icon: 'configure',
      action: this._navigate.bind(this),
      state: {
        gui: {
          inspector: {
            id: service.get('id'),
            activeComponent: 'config'}}}});
    actions.push({
      title: 'Relations',
      icon: 'relations',
      action: this._navigate.bind(this),
      state: {
        gui: {
          inspector: {
            id: serviceId,
            activeComponent: 'relations'}}}});
    actions.push({
      title: 'Expose',
      value: service.get('exposed') ? 'On' : 'Off',
      icon: 'exposed_16',
      action: this._navigate.bind(this),
      state: {
        gui: {
          inspector: {
            id: serviceId,
            activeComponent: 'expose'}}}});
    const resources = this.props.charm.get('resources') || {};
    if (Object.keys(resources).length > 0) {
      actions.push({
        title: 'Resources',
        action: this._navigate.bind(this),
        icon: 'resources_16',
        state: {
          gui: {
            inspector: {
              id: service.get('id'),
              activeComponent: 'resources'}}}});
    }
    if (!service.get('pending')) {
      const charmId = service.get('charm');
      const url = window.jujulib.URL.fromLegacyString(charmId);
      actions.push({
        title: 'Change version',
        linkAction: this._viewCharmDetails.bind(this, url),
        linkTitle: url.path(),
        icon: 'change-version',
        action: this._navigate.bind(this),
        state: {
          gui: {
            inspector: {
              id: serviceId,
              activeComponent: 'change-version'}}}});
    }

    if (this.props.displayPlans && (state.activePlan || plans)) {
      actions.push({
        title: 'Plan',
        icon: 'plan',
        action: this._navigate.bind(this),
        state: {
          gui: {
            inspector: {
              id: serviceId,
              activeComponent: 'plan'}}}});
    }
    this.state.actions = actions;
  }

  /**
    The callable to view the charm details.

    @method _viewCharmDetails
    @param {Object} url The charm URL as an instance of window.jujulib.URL.
    @param {Object} evt The click event.
  */
  _viewCharmDetails(url, e) {
    this.props.changeState({store: url.path()});
  }

  /**
    Handle destroying the service from the button click.

    @method _destroyService
  */
  _destroyService() {
    // db, env, and service have already been bound to this function in
    // the app.js definition.
    this.props.destroyService();
  }

  _generateDelete(render, readOnly) {
    if (render) {
      const buttons = [{
        disabled: readOnly,
        title: 'Destroy',
        action: this._destroyService.bind(this)
      }];
      return (
        <div className="service-overview__delete">
          <ButtonRow
            buttons={buttons} />
        </div>
      );
    }
  }

  render() {
    const props = this.props;
    this._generateActions(props.service);
    const isDeleted = props.service.get('deleted');
    const readOnly = props.acl.isReadOnly();
    const message = 'This application has been marked to be destroyed on '
      + 'next deployment.';
    return (
      <div className="service-overview">
        <InspectorConfirm
          buttons={[]}
          message={message}
          open={isDeleted} />
        <ul className="service-overview__actions">
          {this._generateActionList(this.state.actions)}
        </ul>
        {this._generateDelete(!isDeleted, readOnly)}
      </div>
    );
  }
};

ServiceOverview.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  charm: PropTypes.object.isRequired,
  clearState: PropTypes.func.isRequired,
  destroyService: PropTypes.func.isRequired,
  displayPlans: PropTypes.bool.isRequired,
  getUnitStatusCounts: PropTypes.func.isRequired,
  modelUUID: PropTypes.string.isRequired,
  service: PropTypes.object.isRequired,
  serviceRelations: PropTypes.array.isRequired,
  showActivePlan: PropTypes.func.isRequired,
  showPlans: PropTypes.bool.isRequired
};

module.exports = ServiceOverview;
