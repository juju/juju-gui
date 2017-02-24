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

YUI.add('entity-content', function() {

  juju.components.EntityContent = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      apiUrl: React.PropTypes.string.isRequired,
      changeState: React.PropTypes.func.isRequired,
      entityModel: React.PropTypes.object.isRequired,
      getFile: React.PropTypes.func.isRequired,
      hasPlans: React.PropTypes.bool.isRequired,
      isLegacyJuju: React.PropTypes.bool,
      plans: React.PropTypes.array,
      pluralize: React.PropTypes.func.isRequired,
      renderMarkdown: React.PropTypes.func.isRequired,
    },

    /**
      Generate the list of configuration options for a charm.

      @method _generateCharmConfig
      @param {Object} entityModel The entity model.
      @return {Object} The options markup.
    */
    _generateCharmConfig: function(entityModel) {
      var options = entityModel.get('options');
      if (!options) {
        return;
      }
      var optionsList = [];
      Object.keys(options).forEach(function(name) {
        var option = options[name];
        option.name = name;
        optionsList.push(
          <juju.components.EntityContentConfigOption
            key={name}
            option={option} />
        );
      }, this);
      return (
        <dl>
          {optionsList}
        </dl>);
    },

    /**
      Generate the list of configuration options for a bundle.

      @method _generateBundleConfig
      @param {Object} entityModel The entity model.
      @return {Object} The options markup.
    */
    _generateBundleConfig: function(entityModel) {
      let applications;
      if (this.props.isLegacyJuju) {
        applications = entityModel.get('services');
      } else {
        applications = entityModel.get('applications');
      }
      if (!applications) {
        return;
      }
      // Generate the options for each application in this bundle.
      var applicationsList = Object.keys(applications).map(application => {
        var options = applications[application].options || {};
        // Generate the list of options for this application.
        var optionsList = Object.keys(options).map((name, i) => {
          return (
            <div className="entity-content__config-option"
              key={name + i}>
              <dt className="entity-content__config-name">
                {name}
              </dt>
              <dd className="entity-content__config-description">
                <p>
                  {options[name]}
                </p>
              </dd>
            </div>);
        });
        var classes = {
          'entity-content__bundle-config': true
        };
        if (optionsList.length === 0) {
          optionsList.push(
            <div key="none">
              Config options not modified in this bundle.
            </div>);
        }
        return (
          <juju.components.ExpandingRow
            classes={classes}
            key={application}>
            <div className="entity-content__bundle-config-title">
              {application}
              <div className="entity-content__bundle-config-chevron">
                <div className="entity-content__bundle-config-expand">
                  <juju.components.SvgIcon
                    name="chevron_down_16"
                    size="16" />
                </div>
                <div className="entity-content__bundle-config-contract">
                  <juju.components.SvgIcon
                    name="chevron_up_16"
                    size="16" />
                </div>
              </div>
            </div>
            <dl className="entity-content__bundle-config-options">
              {optionsList}
            </dl>
          </juju.components.ExpandingRow>);
      });
      return (
        <ul>
          {applicationsList}
        </ul>);
    },

    /**
      Generate the list of configuration options.

      @method _generateOptionsList
      @param {Object} entityModel The entity model.
      @return {Object} The options markup.
    */
    _generateOptionsList: function(entityModel) {
      var optionsList;
      if (entityModel.get('entityType') === 'charm') {
        optionsList = this._generateCharmConfig(entityModel);
      } else {
        optionsList = this._generateBundleConfig(entityModel);
      }
      if (optionsList) {
        return (
          <div id="configuration"
            className="row row--grey entity-content__configuration">
            <div className="inner-wrapper">
              <div className="twelve-col">
                <h2 className="entity-content__header">Configuration</h2>
                {optionsList}
              </div>
            </div>
          </div>
        );
      }
    },

    /**
      Generates an HTML list from the supplied array.

      @method _generateList
      @param {Array} list The list of objects to markup.
      @param {Function} handler The click handler for each item.
      @return {Array} The list markup.
    */
    _generateList: function(list, handler) {
      return list.map(function(item, i) {
        return (
          <li key={item + i}>
            <a data-id={item} onClick={handler}>
              {item}
            </a>
          </li>
        );
      });
    },

    /**
      Generate the list of Tags if available.

      @method _generateTags
      @return {Array} The tags markup.
    */
    _generateTags: function() {
      // Have to convert {0: 'database'} to ['database'].
      var tags = [],
          entityTags = this.props.entityModel.get('tags'),
          index;
      if (!entityTags) {
        return;
      }
      for (index in entityTags) {
        tags.push(entityTags[index]);
      }
      return (
        <div className="four-col entity-content__metadata">
          <h4>Tags</h4>
          <ul>
            {this._generateList(tags, this._handleTagClick)}
          </ul>
        </div>);
    },

    /**
      Handle clicks on tags.

      @method _handleTagClick
      @param {Object} e The event.
    */
    _handleTagClick: function(e) {
      e.stopPropagation();
      this.props.changeState({
        search: {
          tags: e.target.getAttribute('data-id'),
          text: ''
        },
        store: null
      });
    },

    /**
      Generate the description if it is a charm.

      @method _generateDescription
      @param {Object} entityModel The entity model.
      @return {Object} The description markup.
    */
    _generateDescription: function(entityModel) {
      if (entityModel.get('entityType') === 'charm') {
        var bugLink = 'https://bugs.launchpad.net/charms/+source/' +
          `${entityModel.get('name')}`;
        var submitLink = 'https://bugs.launchpad.net/charms/+source/' +
          `${entityModel.get('name')}/+filebug`;
        var contributeLink = 'https://code.launchpad.net/~charmers/charms/' +
          `${entityModel.get('series')}/${entityModel.get('name')}/trunk`;
        return (
          <div className="row row--grey entity-content__description">
            <div className="inner-wrapper">
              <div className="twelve-col">
                <p className="intro">{entityModel.get('description')}</p>
              </div>
              {this._generateTags()}
              <div className="four-col entity-content__metadata last-col">
                <h4>More information</h4>
                <ul>
                  <li>
                    <a href={bugLink} target="_blank">
                      Bugs
                    </a>
                  </li>
                  <li>
                    <a href={submitLink} target="_blank">
                      Submit a bug
                    </a>
                  </li>
                  <li>
                    <a href={contributeLink} target="_blank">
                      Contribute
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      }
    },

    /**
      Display the resources if this is a charm.

      @method _generateResources
    */
    _generateResources: function() {
      var entityModel = this.props.entityModel;
      if (entityModel.get('entityType') === 'charm') {
        return (
          <juju.components.EntityResources
            pluralize={this.props.pluralize}
            resources={entityModel.get('resources')} />);
      }
    },

    /**
      We only show the relations when it's a charm, but not a bundle.

      @method _showEntityRelations
    */
    _showEntityRelations: function() {
      var entityModel = this.props.entityModel;
      if (entityModel.get('entityType') === 'charm') {
        // Need to flatten out the relations to determine if we have any.
        var relations = entityModel.get('relations');
        // Normal behavior when there are no relations is to provide an empty
        // object. That said, in the interest of defensively protecting against
        // unexpected data, make sure these variables are at least empty
        // objects.
        var requires = relations.requires || {};
        var provides = relations.provides || {};
        var relationsList = Object.keys(requires).concat(Object.keys(provides));
        if (relationsList.length > 0) {
          return (
            <juju.components.EntityContentRelations
              changeState={this.props.changeState}
              relations={relations} />);
        }
      }
    },

    /**
      Generate the actions links.

      @method _generateActions
    */
    _generateActions: function() {
      var entityModel = this.props.entityModel;
      if (entityModel.get('entityType') !== 'bundle') {
        return;
      }
      var contributeLink = 'https://code.launchpad.net/~charmers/charms/' +
        `bundles/${entityModel.get('name')}/bundle`;
      return (
        <div className="section">
          <h3 className="section__title">
            Actions
          </h3>
          <a href={contributeLink}
            target="_blank">
            Contribute
          </a>
        </div>);
    },

    /**
      Transform and generate the price list from a provided string of prices.

      @method _generatePriceList
      @param {String} prices The string of prices in the format
        'price/quantity;price/quantity'.
      @returns {Object} The price list JSX components.
    */
    _generatePriceList: function(prices) {
      var prices = prices.split(';');
      var priceList = [];
      prices.forEach((price, i) => {
        if (price === '') {
          return;
        }
        var [amount, quantity] = price.split('/');
        var quantityItem;
        if (quantity) {
          quantityItem = (
          <span className="entity-content__plan-price-quantity">
            / {quantity}
          </span>);
        }
        priceList.push(
          <li className="entity-content__plan-price-item"
            key={amount + (quantity || '') + i}>
            <span className="entity-content__plan-price-amount">
              {amount}
            </span>
            {quantityItem}
          </li>);
      });
      return priceList;
    },

    /**
      Generate the list of plans.

      @method _generatePlans
    */
    _generatePlans: function() {
      var props = this.props;
      if (props.entityModel.get('entityType') !== 'charm' ||
        !this.props.hasPlans) {
        return;
      }
      var plans = props.plans;
      // Return a spinner if null (we don't have a response yet) or nothing if
      // plans are a 0-length array (no plans found, likely due to an error).
      if (!plans) {
        return <juju.components.Spinner />;
      }
      if (!plans.length) {
        return;
      }
      var plansList = [];
      plans.forEach((plan, i) => {
        var classes = classNames(
          'entity-content__plan',
          'four-col',
          {'last-col': (i + 1) % 3 === 0});

        plansList.push(
          <div className={classes}
            key={plan.url + i}>
            <div className="entity-content__plan-content">
              <h3 className="entity-content__plan-title">
                {plan.url}
              </h3>
              <ul className="entity-content__plan-price">
                {this._generatePriceList(plan.price)}
              </ul>
              <p className="entity-content__plan-description">
                {plan.description}
              </p>
            </div>
          </div>);
      });
      return (
        <div id="plans"
          className="row entity-content__plans">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <h2 className="entity-content__header">Plans</h2>
              <div className="equal-height">
                {plansList}
              </div>
            </div>
          </div>
        </div>);
    },

    render: function() {
      var entityModel = this.props.entityModel;
      return (
        <div className="entity-content">
          {this._generateDescription(entityModel)}
          {this._generatePlans()}
          <div className="row">
            <div className="inner-wrapper">
              <div className="seven-col append-one">
                <juju.components.EntityContentReadme
                  entityModel={entityModel}
                  renderMarkdown={this.props.renderMarkdown}
                  getFile={this.props.getFile} />
              </div>
              <div className="four-col">
                {this._generateResources()}
                {this._showEntityRelations()}
                <juju.components.EntityFiles
                  apiUrl={this.props.apiUrl}
                  entityModel={entityModel}
                  pluralize={this.props.pluralize} />
                <juju.components.EntityContentRevisions
                  revisions={entityModel.get('revisions')} />
                {this._generateActions()}
              </div>
            </div>
          </div>
          {this._generateOptionsList(entityModel)}
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'entity-content-config-option',
    'entity-content-readme',
    'entity-content-relations',
    'entity-content-revisions',
    'entity-files',
    'entity-resources',
    'expanding-row',
    'loading-spinner',
    'svg-icon'
  ]
});
