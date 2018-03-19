/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const CopyToClipboard = require('../../copy-to-clipboard/copy-to-clipboard');
const GenericButton = require('../../generic-button/generic-button');
const SvgIcon = require('../../svg-icon/svg-icon');

class EntityHeader extends React.Component {
  constructor() {
    super();
    this.state = {headerHeight: 0};
  }

  componentDidMount() {
    this.setState({headerHeight: this.refs.headerWrapper.clientHeight});
  }

  /**
    Add a service for this charm to the canvas.

    @method _handleDeployClick
    @param {Object} e The click event
  */
  _handleDeployClick(e) {
    const props = this.props;
    const entityModel = props.entityModel;
    const entity = entityModel.toEntity();
    if (entity.type === 'charm') {
      const refs = this.refs;
      const plans = props.plans;
      const plan = refs.plan && refs.plan.value;
      let activePlan;
      if (plan && Array.isArray(plans)) {
        // It is possible that plan is a string "loading plans..."
        plans.some(item => {
          if (item.url === plan) {
            activePlan = item;
            return true;
          }
        });
      }
      // The second param needs to be set as undefined not null as this is the
      // format the method expects.
      props.deployService(entityModel, undefined, plans, activePlan);
    } else {
      const bundleURL = props.urllib.fromLegacyString(entity.id);
      props.getBundleYAML(
        bundleURL.legacyPath(),
        this._getBundleYAMLCallback.bind(this, bundleURL.path()));
    }
    this._closeEntityDetails();
  }

  /**
    Close the entity details

    @method _closeEntityDetails
  */
  _closeEntityDetails() {
    this.props.changeState({
      hash: null,
      store: null,
      postDeploymentPanel: {
        entityId: this.props.entityModel.toEntity().id
      }
    });
  }

  /**
    Callback for getting the bundle YAML.

    @method _getBundleYAMLSuccess
    @param {String} bundleURL The url of the bundle that is being deployed.
    @param {String} error The error, if any. Null if no error.
    @param {String} yaml The yaml for the bundle
  */
  _getBundleYAMLCallback(bundleURL, error, yaml) {
    if (error) {
      console.error(error);
      this.props.addNotification({
        title: 'Bundle failed to deploy',
        message: 'The bundle ' + this.props.entityModel.get('name') +
          ' failed to deploy:' + error,
        level: 'error'
      });
      return;
    }
    this.props.importBundleYAML(yaml, bundleURL);
    this._closeEntityDetails();
  }

  /**
    Builds a URL that links to the standalone Juju store, for sharing
    purposes.

    @method _getStoreURL
    @param {Object} entity The entity being linked to
  */
  _getStoreURL(entity) {
    var url = ['https://jujucharms.com'];
    if (entity.id.indexOf('~') >= 0) {
      url.push('u');
      url.push(entity.owner);
    }
    url.push(entity.name);
    url.push(entity.series);
    url.push(entity.revision);
    return encodeURIComponent(url.join('/'));
  }

  /**
    Generate the styles for the header wrapper.

    @method _generateWrapperStyles
  */
  _generateWrapperStyles() {
    if (this.state.headerHeight > 0) {
      // Set the height of the wrapper so that it doesn't collapse when the
      // header becomes sticky.
      return {height: this.state.headerHeight + 'px'};
    }
    return {};
  }

  /**
    Generate the classes for the component.

    @method _generateClasses
  */
  _generateClasses() {
    return classNames(
      'entity-header',
      {
        'entity-header--sticky':
          this.props.scrollPosition > this.state.headerHeight
      }
    );
  }

  /**
    Generate the deploy action or a notice if deployment is not supported.
    XXX kadams54, 2016-01-04: the deployAction var will need to be removed
    once we fully support multi-series charms.

    @method _generateDeployAction
  */
  _generateDeployAction() {
    const entity = this.props.entityModel.toEntity();
    let deployAction;
    const modelName = this.props.getModelName();
    // If the entity is not a charm OR it is a charm and has the series set,
    // display a button. Otherwise display a "not supported" message.
    const title = `Add to ${modelName || 'model'}`;
    if (entity.type !== 'charm' || entity.series) {
      deployAction = (
        <GenericButton
          action={this._handleDeployClick.bind(this)}
          disabled={this.props.acl.isReadOnly()}
          ref="deployAction"
          tooltip={
            `Add this ${entity.type} to ` +
            `${modelName ? 'your current' : 'a new'} model`}
          type="positive">
          {title}
        </GenericButton>
      );
    } else {
      deployAction = (
        <div className="entity-header__deploy-action"
          ref="deployAction">
          This type of charm can only be deployed from the command line.
        </div>
      );
    }
    return deployAction;
  }

  /**
    Generate the plan selector if there are plans.

    @method _generateSelectPlan
  */
  _generateSelectPlan() {
    var props = this.props;
    if (props.entityModel.get('entityType') !== 'charm' ||
      !this.props.hasPlans) {
      return;
    }
    var plans = props.plans;
    var options = null;
    var defaultMessage = '';
    // Return a loading message if null (we don't have a response yet) or
    // nothing if plans are a 0-length array (no plans found, likely due to
    // an error).
    if (!plans) {
      defaultMessage = 'Loading plans...';
    } else if (!plans.length) {
      return;
    } else {
      defaultMessage = 'Choose a plan';
      options = [];
      plans.forEach((plan, i) => {
        options.push(
          <option key={plan.url + i}
            value={plan.url}>
            {plan.url}
          </option>);
      });
    }
    return (
      <select className="entity-header__select"
        ref="plan">
        <option key="default">{defaultMessage}</option>
        {options}
      </select>);
  }

  /**
    Generate the application, machine counts etc. for a bundle.
  */
  _generateCounts() {
    var entity = this.props.entityModel.toEntity();
    if (entity.type !== 'bundle') {
      return;
    }
    var serviceCount = entity.serviceCount;
    var unitCount = entity.unitCount;
    var machineCount = entity.machineCount;
    return (<ul className="bullets inline entity-header__properties">
      <li className="entity-header__counts">
        {serviceCount} {this.props.pluralize('application', serviceCount)},
          &nbsp;
        {machineCount} {this.props.pluralize('machine', machineCount)},
          &nbsp;
        {unitCount} {this.props.pluralize('unit', unitCount)}
      </li>
    </ul>);
  }

  /**
    Mark the charm as a subordinate if it is one.

    @return {Object} The JSX markup.
  */
  _generateSubordinate() {
    const isSubordinate = this.props.entityModel.get('is_subordinate');
    if (!isSubordinate) {
      return null;
    }
    return (
      <li className="entity-header__subordinate">
        Subordinate
        <a href={
          'https://jujucharms.com/docs/stable/' +
          'authors-subordinate-applications'}
        target="_blank">
          <SvgIcon
            name="help_16"
            size="16" />
        </a>
      </li>
    );
  }

  /**
    Generate a link to the latest revision of this entity in the case we are
    not already in the most recent one.

    @return {Object} A react "li" element for the revision link or null.
  */
  _generateLatestRevision() {
    const props = this.props;
    const entity = props.entityModel;
    const revisions = entity.get('revisions');
    if (!revisions || !revisions.length) {
      // Revisions information is not available.
      console.warn('revision information is not available');
      return null;
    }
    const lastRevision = revisions[0];
    if (lastRevision === entity.get('id')) {
      // We already are at the last revision.
      return null;
    }
    const url = props.urllib.fromLegacyString(lastRevision);
    return (
      <li className="entity-header__series" key={lastRevision}>
        <span className="link" onClick={this._onLastRevisionClick.bind(this)}>
            Latest version (#{url.revision})
        </span>
      </li>
    );
  }

  /**
    Change the state to go to the last revision of this charm/bundle.

    @param {Object} evt The click event.
  */
  _onLastRevisionClick(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const props = this.props;
    const revisions = props.entityModel.get('revisions');
    const url = props.urllib.fromLegacyString(revisions[0]);
    props.changeState({store: url.path()});
  }

  /**
    Change the state to go to the charm/bundle owner.

    @param {Object} evt The click event.
  */
  _onOwnerClick(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const props = this.props;
    const entity = props.entityModel;
    props.changeState({
      hash: null,
      store: null,
      profile: entity.get('owner')
    });
  }

  /**
    Generates the list of series. Supports bundles, multi-series and
    single-series charms.

    @return {Object} A react "li" element for each series.
  */
  _generateSeriesList() {
    var series = this.props.entityModel.get('series');
    if (!series) {
      return null;
    }
    series = !Array.isArray(series) ? [series] : series;
    return series.map(series =>
      <li className="entity-header__series" key={series}>{series}</li>);
  }

  /**
    Generates the list of channels. Only currently active channels are shown.

    @return {Object} A react "li" element for each active channel.
  */
  _generateChannelList() {
    const channels = this.props.entityModel.get('channels').filter(ch => {
      return ch.current;
    });
    if (!channels.length) {
      return null;
    }
    const names = channels.map(ch => {
      const name = ch.name;
      // Capitalize channel names.
      return name.charAt(0).toUpperCase() + name.slice(1);
    }).join(', ');
    return <li className="entity-header__channels" key={names}>{names}</li>;
  }

  render() {
    let icon;
    const entityModel = this.props.entityModel;
    const entity = entityModel.toEntity();
    const twitterUrl = [
      'https://twitter.com/intent/tweet?text=',
      entity.displayName,
      '%20charm&via=ubuntu_cloud&url=',
      this._getStoreURL(entity)
    ].join('');
    const googlePlusUrl = [
      'https://plus.google.com/share?url=',
      this._getStoreURL(entity)
    ].join('');

    if (entity.type !== 'bundle') {
      icon = (<img alt={entity.displayName} className="entity-header__icon"
        src={entity.iconPath} width="96" />);
    }
    return (
      <div className="row-hero"
        ref="headerWrapper"
        style={this._generateWrapperStyles()}>
        <header className={this._generateClasses()}>
          <div className="inner-wrapper">
            <div className="eight-col no-margin-bottom">
              {icon}
              <h1
                className="entity-header__title"
                itemProp="name"
                ref="entityHeaderTitle">
                {entity.displayName}{' '}
                <span className="entity-header__version">
                  #{entity.revision_id}
                </span>
              </h1>
              <ul className="bullets inline entity-header__properties">
                <li className="entity-header__by">
                  By&nbsp;
                  <span className="link"
                    onClick={this._onOwnerClick.bind(this)}>
                    {entity.owner}
                  </span>
                </li>
                {this._generateSubordinate()}
                {this._generateLatestRevision()}
                {this._generateSeriesList()}
                {this._generateChannelList()}
              </ul>
              {this._generateCounts()}
              <ul className="entity-header__social-list">
                <li>
                  <a href={twitterUrl}
                    id="item-twitter"
                    target="_blank">
                    <SvgIcon
                      name="icon-social-twitter"
                      size="36" />
                  </a>
                </li>
                <li>
                  <a href={googlePlusUrl}
                    id="item-googleplus"
                    target="_blank">
                    <SvgIcon
                      name="icon-social-google"
                      size="36" />
                  </a>
                </li>
              </ul>
            </div>
            <div className={
              'entity-header__right four-col last-col no-margin-bottom'}>
              {this._generateSelectPlan()}
              <CopyToClipboard
                value={'juju deploy ' + entity.id} />
              {this._generateDeployAction()}
            </div>
          </div>
        </header>
      </div>
    );
  }
};

EntityHeader.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  deployService: PropTypes.func.isRequired,
  entityModel: PropTypes.object.isRequired,
  getBundleYAML: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  hasPlans: PropTypes.bool.isRequired,
  importBundleYAML: PropTypes.func.isRequired,
  plans: PropTypes.array,
  pluralize: PropTypes.func.isRequired,
  scrollPosition: PropTypes.number.isRequired,
  urllib: PropTypes.func.isRequired
};

module.exports = EntityHeader;
