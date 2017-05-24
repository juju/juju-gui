/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2015 Canonical Ltd.

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

YUI.add('entity-header', function() {

  juju.components.EntityHeader = React.createClass({
    displayName: 'EntityHeader',
    /* Define and validate the properites available on this component. */
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      changeState: React.PropTypes.func.isRequired,
      deployService: React.PropTypes.func.isRequired,
      entityModel: React.PropTypes.object.isRequired,
      getBundleYAML: React.PropTypes.func.isRequired,
      getModelName: React.PropTypes.func.isRequired,
      hasPlans: React.PropTypes.bool.isRequired,
      importBundleYAML: React.PropTypes.func.isRequired,
      plans: React.PropTypes.array,
      pluralize: React.PropTypes.func.isRequired,
      scrollPosition: React.PropTypes.number.isRequired,
      urllib: React.PropTypes.func.isRequired
    },

    /**
      Generate the initial state of the component.

      @method getInitialState
      @returns {String} The intial state.
    */
    getInitialState: function() {
      return {headerHeight: 0};
    },

    componentDidMount: function() {
      this.setState({headerHeight: this.refs.headerWrapper.clientHeight});
    },

    /**
      Add a service for this charm to the canvas.

      @method _handleDeployClick
      @param {Object} e The click event
    */
    _handleDeployClick: function(e) {
      var entityModel = this.props.entityModel;
      var entity = entityModel.toEntity();
      if (entity.type === 'charm') {
        var refs = this.refs;
        var plans = this.props.plans;
        var plan = refs.plan && refs.plan.value;
        var activePlan;
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
        this.props.deployService(entityModel, undefined, plans, activePlan);
      } else {
        var id = entity.id.replace('cs:', '');
        this.props.getBundleYAML(id, this._getBundleYAMLCallback);
      }
      this._closeEntityDetails();
    },

    /**
      Close the entity details

      @method _closeEntityDetails
    */
    _closeEntityDetails: function() {
      this.props.changeState({
        hash: null,
        store: null
      });
    },

    /**
      Callback for getting the bundle YAML.

      @method _getBundleYAMLSuccess
      @param {String} error The error, if any. Null if no error.
      @param {String} yaml The yaml for the bundle
    */
    _getBundleYAMLCallback: function(error, yaml) {
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
      this.props.importBundleYAML(yaml);
      this._closeEntityDetails();
    },

    /**
      Builds a URL that links to the standalone Juju store, for sharing
      purposes.

      @method _getStoreURL
      @param {Object} entity The entity being linked to
    */
    _getStoreURL: function(entity) {
      var url = ['https://jujucharms.com'];
      if (entity.id.indexOf('~') >= 0) {
        url.push('u');
        url.push(entity.owner);
      }
      url.push(entity.name);
      url.push(entity.series);
      url.push(entity.revision);
      return encodeURIComponent(url.join('/'));
    },

    /**
      Generate the styles for the header wrapper.

      @method _generateWrapperStyles
    */
    _generateWrapperStyles: function() {
      if (this.state.headerHeight > 0) {
        // Set the height of the wrapper so that it doesn't collapse when the
        // header becomes sticky.
        return {height: this.state.headerHeight + 'px'};
      }
      return {};
    },

    /**
      Generate the classes for the component.

      @method _generateClasses
    */
    _generateClasses: function() {
      return classNames(
        'entity-header',
        {
          'entity-header--sticky':
            this.props.scrollPosition > this.state.headerHeight
        }
      );
    },

    /**
      Generate the deploy action or a notice if deployment is not supported.
      XXX kadams54, 2016-01-04: the deployAction var will need to be removed
      once we fully support multi-series charms.

      @method _generateDeployAction
    */
    _generateDeployAction: function() {
      const entity = this.props.entityModel.toEntity();
      let deployAction;
      // If the entity is not a charm OR it is a charm and has the series set,
      // display a button. Otherwise display a "not supported" message.
      const title = `Add to ${this.props.getModelName() || 'model'}`;
      if (entity.type !== 'charm' || entity.series) {
        deployAction = (
          <juju.components.GenericButton
            ref="deployAction"
            action={this._handleDeployClick}
            disabled={this.props.acl.isReadOnly()}
            type="positive"
            title={title} />
        );
      } else {
        deployAction = (
          <div ref="deployAction">
            This type of charm can only be deployed from the command line.
          </div>
        );
      }
      return deployAction;
    },

    /**
      Generate the plan selector if there are plans.

      @method _generateSelectPlan
    */
    _generateSelectPlan: function() {
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
    },

    /**
      Generate the application, machine counts etc. for a bundle.
    */
    _generateCounts: function() {
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
    },

    /**
      Mark the charm as a subordinate if it is one.

      @return {Object} The JSX markup.
    */
    _generateSubordinate: function() {
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
            <juju.components.SvgIcon
              name="help_16"
              size="16"/>
          </a>
        </li>
      );
    },

    /**
      Generate a link to the latest revision of this entity in the case we are
      not already in the most recent one.

      @return {Object} A react "li" element for the revision link or null.
    */
    _generateLatestRevision: function() {
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
        <li key={lastRevision} className="entity-header__series">
            <span className="link" onClick={this._onLastRevisionClick}>
              Latest revision ({url.revision})
            </span>
        </li>
      );
    },

    /**
      Change the state to go to the last revision of this charm/bundle.

      @param {Object} evt The click event.
    */
    _onLastRevisionClick: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      const props = this.props;
      const revisions = props.entityModel.get('revisions');
      const url = props.urllib.fromLegacyString(revisions[0]);
      props.changeState({store: url.path()});
    },

    /**
      Change the state to go to the charm/bundle owner.

      @param {Object} evt The click event.
    */
    _onOwnerClick: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      const props = this.props;
      const entity = props.entityModel;
      props.changeState({
        hash: null,
        store: null,
        profile: entity.get('owner')
      });
    },

    /**
      Generates the list of series. Supports bundles, multi-series and
      single-series charms.

      @return {Object} A react "li" element for each series.
    */
    _generateSeriesList: function() {
      var series = this.props.entityModel.get('series');
      if (!series) {
        return null;
      }
      series = !Array.isArray(series) ? [series] : series;
      return series.map(series =>
        <li key={series} className="entity-header__series">{series}</li>);
    },

    /**
      Generates the list of channels. Only currently active channels are shown.

      @return {Object} A react "li" element for each active channel.
    */
    _generateChannelList: function() {
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
      return <li key={names} className="entity-header__channels">{names}</li>;
    },

    /**
      If there's a bugUrl add the link.

      @return {Object} A react "ul" element.
    */
    _generateActionsList: function() {
      const bugUrl = this.props.entityModel.getAttrs().bugUrl;
      if (bugUrl) {
        return (<ul className="entity-header__actions-list">
          <li className="actions-list__item">
            <a href={bugUrl} className="link" target="_blank">
              Submit a bug
            </a>
          </li>
        </ul>);
      }
      return;
    },

    render: function() {
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
        icon = (<img src={entity.iconPath} alt={entity.displayName}
             width="96" className="entity-header__icon"/>);
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
                    <span className="link" onClick={this._onOwnerClick}>
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
                    <a id="item-twitter"
                      target="_blank"
                      href={twitterUrl}>
                      <juju.components.SvgIcon
                        name="icon-social-twitter"
                        size="36"/>
                    </a>
                  </li>
                  <li>
                    <a id="item-googleplus"
                       target="_blank"
                       href={googlePlusUrl}>
                      <juju.components.SvgIcon
                        name="icon-social-google"
                        size="36"/>
                    </a>
                  </li>
                </ul>
                {this._generateActionsList()}
              </div>
              <div className={
                'entity-header__right four-col last-col no-margin-bottom'}>
                {this._generateSelectPlan()}
                <juju.components.CopyToClipboard
                  value={'juju deploy ' + entity.id} />
                {this._generateDeployAction()}
              </div>
            </div>
          </header>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'copy-to-clipboard',
    'generic-button'
  ]
});
