/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const Environment = require('../../components/environment/environment');
const PanZoomModule = require('./panzoom');
const RelationModule = require('./relation');
const ServiceModule = require('./service');
const Topology = require('./topology');
const ViewportModule = require('./viewport');

/**
  Display an environment.
*/
class EnvironmentView {
  constructor(options={}) {
    this.endpointsController = options.endpointsController;
    this.db = options.db;
    this.env = options.env;
    this.ecs = options.ecs;
    this.charmstore = options.charmstore;
    this.bundleImporter = options.bundleImporter;
    this.state = options.state;
    this.staticURL = options.staticURL;
    this.sendAnalytics = options.sendAnalytics;
    this.container = options.container;
  }

  /**
   * Wrapper around topo.update. Rather than re-rendering a whole
   * topology, the view can require data updates when needed.
   * Ideally even this should not be needed, as we can observe
   * ModelList change events and debounce update calculations
   * internally.
   *
   * @method update
   * @chainable
   */
  update() {
    this.topo.update();
    return this;
  }

  /**
   * @method render
   * @chainable
   */
  render() {
    const container = this.getContainer();
    let topo = this.topo;
    const db = this.db;
    // If we need the initial HTML template, take care of that.
    if (!this._rendered) {
      ReactDOM.render(
        <Environment />,
        container);
      this._rendered = true;
    }

    topo = this.createTopology();
    topo.recordSubscription(
      'ServiceModule',
      db.services.after('reset', this.updateHelpIndicator.bind(this)));
    topo.recordSubscription(
      'ServiceModule',
      db.services.after('remove', this.updateHelpIndicator.bind(this)));
    topo.recordSubscription(
      'ServiceModule',
      db.services.after('add', this.updateHelpIndicator.bind(this)));

    topo.render();
    this.boundRenderedHandler = this.updateHelpIndicator.bind(this);
    document.addEventListener('topo.rendered', this.boundRenderedHandler);
    this.boundPlusClickHandler = this._handlePlusClick.bind(this);
    container.querySelector('.environment-help .plus-service').addEventListener(
      'click', this.boundPlusClickHandler);

    this.updateHelpIndicator();

    return this;
  }

  destructor() {
    if (this.boundRenderedHandler) {
      document.removeEventListener(
        'topo.rendered', this.boundRenderedHandler);
    }
    if (this.boundPlusClickHandler) {
      const container = this.getContainer();
      container.querySelector(
        '.environment-help .plus-service').removeEventListener(
        'click', this.boundPlusClickHandler);
    }
    if (this.topo) {
      this.topo.removeModules();
    }
  }

  /**
    Get the DOM node if the container has been provided by YUI, otherwise the
    container will be the DOM node already.

    @method getContainer
    @return {Object} A DOM node.
  */
  getContainer() {
    const container = this.container;
    return container.getDOMNode && container.getDOMNode() || container;
  }

  /**
    createTopology, called automatically.

    @method createTopology
   */
  createTopology() {
    const container = this.getContainer();
    let topo = this.topo;
    if (!topo) {
      topo = new Topology({
        includePlus: true,
        size: [640, 480],
        ecs: this.ecs,
        env: this.env,
        environmentView: this,
        db: this.db,
        bundleImporter: this.bundleImporter,
        container: container,
        endpointsController: this.endpointsController,
        state: this.state,
        staticURL: this.staticURL
      });
      // Bind all the behaviors we need as modules.
      topo.addModule(ServiceModule, {useTransitions: true});
      topo.addModule(PanZoomModule);
      topo.addModule(ViewportModule);
      topo.addModule(RelationModule);
      this.topo = topo;
    }
    return topo;
  }

  /**
   * Support for canvas help function (when canvas is empty).
   *
   * @method updateHelpIndicator
   */
  updateHelpIndicator(evt) {
    const container = this.getContainer();
    var helpText = container.querySelector('.environment-help'),
        includedPlus = this.topo.vis.select('.included-plus'),
        db = this.db,
        services = db.services;
    if (helpText) {
      if (services.size() === 0) {
        helpText.removeAttribute('style');
        helpText.classList.remove('shrink');
        includedPlus.classed('show', false);
      } else {
        helpText.classList.add('shrink');
        includedPlus.classed('show', true);
      }
    }
  }

  /**
    fades in or out the help indicator.

    @method fadeHelpIndicator
    @param {Boolean} fade Whether it should fade it in or out.
  */
  fadeHelpIndicator(fade) {
    const container = this.getContainer();
    const helpImg = container.querySelector('.environment-help__image');
    const tooltip = container.querySelector('.environment-help__tooltip');
    const dropMessage = container.querySelector(
      '.environment-help__drop-message');
    const existingApps = this.db.services.size() > 0;
    // If there are existing apps then the onboarding should not be
    // displayed behind the drop notification.
    const showOnboarding = !existingApps;
    const helpActiveClass = 'environment-help__drop-message--active';
    if (helpImg) {
      if (fade) {
        if (existingApps) {
          // If there are apps then the onboarding will be hidden, so we
          // need to display it again temporarily to display the drop
          // notification. This class will be re-added when the drop finishes
          // and updateHelpIndicator is called above.
          container.querySelector('.environment-help').classList.remove(
            'shrink');
        }
        dropMessage.classList.add(helpActiveClass);
      } else {
        dropMessage.classList.remove(helpActiveClass);
      }
      tooltip.style.opacity = showOnboarding && !fade ? 1 : 0;
      helpImg.style.opacity = showOnboarding ? 1 : 0;
    }
  }

  /**
   * Render callback handler, triggered from app when the view renders.
   *
   * @method render.rendered
   */
  rendered() {
    document.dispatchEvent(new Event('topo.rendered'));
    // Bind d3 events (manually).
    this.topo.bindAllD3Events();
  }

  /**
    Handles clicking on the plus button in the onboarding.

    @method _handlePlusClick
    @param {Object} e The click event
  */
  _handlePlusClick(e) {
    this.sendAnalytics(
      'Onboarding',
      'Click',
      'Onboarding plus'
    );
    this.state.changeState({
      root: 'store'
    });
  }
};

module.exports = EnvironmentView;
