/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const AccordionSection = require('../../accordion-section/accordion-section');
const CopyToClipboard = require('../../copy-to-clipboard/copy-to-clipboard');
const EntityContentConfigOption = require('./config-option/config-option');
const EntityContentDescription = require('./description/description');
const EntityContentDiagram = require('./diagram/diagram');
const EntityContentReadme = require('./readme/readme');
const EntityContentRelations = require('./relations/relations');
const ExpertContactCard = require('../../expert-contact-card/expert-contact-card');
const EntityFiles = require('./files/files');
const EntityResources = require('./resources/resources');
const Spinner = require('../../spinner/spinner');
const TermsPopup = require('../../terms-popup/terms-popup');

class EntityContent extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      terms: [],
      termsLoading: false
    };
  }

  componentWillMount() {
    this._getTerms();
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  /**
    Get the list of terms for the charm, updating the state with these
    terms.
  */
  _getTerms() {
    const entityTerms = this.props.entityModel.get('terms');
    if (!entityTerms || !entityTerms.length) {
      this.setState({termsLoading: false});
      return null;
    }
    this.setState({termsLoading: true}, () => {
      entityTerms.forEach(term => {
        const xhr = this.props.showTerms(term, null, (error, response) => {
          if (error) {
            const message = `Failed to load terms for ${term}`;
            this.props.addNotification({
              title: message,
              message: `${message}: ${error}`,
              level: 'error'
            });
            console.error(`${message}: ${error}`);
            this.setState({termsLoading: false});
            return;
          }
          const terms = this.state.terms;
          terms.push(response);
          this.setState({terms: terms}, () => {
            // If all the terms have loaded then we can finally hide the
            // loading spinner.
            if (terms.length === entityTerms.length) {
              this.setState({termsLoading: false});
            }
          });
        });
        this.xhrs.push(xhr);
      });
    });
  }

  /**
    Generate the list of configuration options for a charm.

    @method _generateCharmConfig
    @param {Object} entityModel The entity model.
    @return {Object} The options markup.
  */
  _generateCharmConfig(entityModel) {
    var options = entityModel.get('options');
    if (!options) {
      return;
    }
    var optionsList = [];
    Object.keys(options).forEach(function(name) {
      var option = options[name];
      option.name = name;
      optionsList.push(
        <EntityContentConfigOption
          key={name}
          option={option} />
      );
    }, this);
    return (
      <dl>
        {optionsList}
      </dl>);
  }

  /**
    Generate the list of configuration options for a bundle.

    @method _generateBundleConfig
    @param {Object} entityModel The entity model.
    @return {Object} The options markup.
  */
  _generateBundleConfig(entityModel) {
    let applications;
    applications = entityModel.get('applications');
    if (!applications) {
      return;
    }
    const entity = entityModel.toEntity();
    let applicationIcons = {};

    if (Array.isArray(entity.applications)) {
      entity.applications.forEach(applicationEntity => {
        applicationIcons[applicationEntity.id] = applicationEntity.iconPath;
      });
    }

    // Generate the options for each application in this bundle.
    const applicationsList = Object.keys(applications).map(application => {
      const options = applications[application].options || {};
      const id = applications[application].charm.split('cs:').join('');
      // Generate the list of options for this application.
      let optionsList = Object.keys(options).map((name, i) => {
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
      if (optionsList.length === 0) {
        optionsList = null;
      }
      const title = (
        <span>
          <img alt={application}
            className="entity-content__config-image"
            src={applicationIcons[id]} width="26" />
          {application}</span>
      );
      if (optionsList) {
        optionsList = (
          <div className="entity-content__config-description">
            {optionsList}
          </div>
        );
      }
      return (
        <AccordionSection
          key={application}
          title={title}>
          {optionsList}
        </AccordionSection>);
    });
    return (<div>{applicationsList}</div>);
  }

  /**
    Generate the list of configuration options.

    @method _generateOptionsList
    @param {Object} entityModel The entity model.
    @return {Object} The options markup.
  */
  _generateOptionsList(entityModel) {
    let optionsList;
    const isCharm = entityModel.get('entityType') === 'charm';
    if (isCharm) {
      optionsList = this._generateCharmConfig(entityModel);
    } else {
      optionsList = this._generateBundleConfig(entityModel);
    }
    if (optionsList) {
      const title = isCharm ? 'Configuration' : 'Bundle configuration';
      return (
        <div className="entity-content__configuration"
          id="configuration">
          <h3 className="entity-content__header">{title}</h3>
          {optionsList}
        </div>
      );
    }
  }

  /**
    Generates an HTML list from the supplied array.

    @method _generateList
    @param {Array} list The list of objects to markup.
    @param {Function} handler The click handler for each item.
    @return {Array} The list markup.
  */
  _generateList(list, handler) {
    return list.map(function(item, i) {
      return [i > 0 ? ', ' : ''].concat(
        <a className="link" data-id={item} key={item + i} onClick={handler}>
          {item}
        </a>
      );
    });
  }

  /**
    Generate the list of Tags if available.

    @method _generateTags
    @return {Array} The tags markup.
  */
  _generateTags() {
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
      <div className="entity-content__metadata">
        <h4 className="entity-content__metadata-title">Tags:</h4>&nbsp;
        {this._generateList(tags, this._handleTagClick.bind(this))}
      </div>);
  }

  /**
    Handle clicks on tags.

    @method _handleTagClick
    @param {Object} e The event.
  */
  _handleTagClick(e) {
    e.stopPropagation();
    this.props.changeState({
      hash: null,
      search: {
        tags: e.target.getAttribute('data-id'),
        text: ''
      },
      store: null
    });
  }

  /**
    Generate the list of terms if available.

    @method _generateTerms
    @return {Array} The terms markup.
  */
  _generateTerms() {
    const terms = this.state.terms;
    let content;
    if (this.state.termsLoading) {
      content = <Spinner />;
    } else if (terms.length === 0) {
      return null;
    } else {
      content = terms.map((item, i) => {
        return [i > 0 ? ', ' : ''].concat(
          <a className="link"
            key={item.name}
            onClick={this._toggleTerms.bind(this, item)}>
            {item.name}
          </a>
        );
      });
    }
    return (
      <div className="entity-content__metadata">
        <h4 className="entity-content__metadata-title">Terms:</h4>&nbsp;
        {content}
      </div>);
  }

  /**
    Generate the list of terms if available.

    @method _toggleTerms
    @param {Object} terms The terms to display.
  */
  _toggleTerms(terms=null) {
    this.setState({showTerms: terms});
  }

  /**
    Generate the terms popup.

    @method _generateTermsPopup
    @returns {Object} The terms popup markup.
  */
  _generateTermsPopup() {
    const terms = this.state.showTerms;
    if (!terms) {
      return null;
    }
    return (
      <TermsPopup
        close={this._toggleTerms.bind(this)}
        terms={[terms]} />);
  }

  /**
    Generate the description.

    @method _generateDescription
    @param {Object} entityModel The entity model.
    @return {Object} The description markup.
  */
  _generateDescription(entityModel) {
    return (<EntityContentDescription
      changeState={this.props.changeState}
      entityModel={entityModel}
      includeHeading={true}
      renderMarkdown={this.props.renderMarkdown} />);
  }

  /**
  Generate the diagram markup for a bundle.

  @param {Object} entityModel The entity model.
  @return {Object} The diagram markup.
  */
  _generateDiagram(entityModel) {
    if (entityModel.get('entityType') !== 'bundle') {
      return;
    }
    const entity = entityModel.toEntity();
    return (
      <EntityContentDiagram
        clearLightbox={this.props.clearLightbox}
        diagramUrl={this.props.getDiagramURL(entityModel.get('id'))}
        displayLightbox={this.props.displayLightbox}
        isExpandable={true}
        isRow={false}
        title={entity.displayName} />);
  }

  /**
    Generate tags and terms.

    @method _generateTagsAndTerms
    @param {Object} entityModel The entity model.
    @return {Object} The tags and terms markup.
  */
  _generateTagsAndTerms(entityModel) {
    if (this.props.entityModel.get('entityType') === 'charm') {
      return(
        <div className="entity-content__terms">
          {this._generateTags()}
          {this._generateTerms()}
        </div>
      );
    }
    return false;
  }

  /**
    Display the resources if this is a charm.

    @method _generateResources
  */
  _generateResources() {
    var entityModel = this.props.entityModel;
    if (entityModel.get('entityType') === 'charm') {
      return (
        <EntityResources
          apiUrl={this.props.apiUrl}
          entityId={entityModel.get('id')}
          pluralize={this.props.pluralize}
          resources={entityModel.get('resources')} />);
    }
  }

  /**
    We only show the relations when it's a charm, but not a bundle.

    @method _showEntityRelations
  */
  _showEntityRelations() {
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
          <EntityContentRelations
            changeState={this.props.changeState}
            relations={relations} />);
      }
    }
  }

  /**
    Generate the actions links.

    @method _generateActions
  */
  _generateActions() {
    const entity = this.props.entityModel.getAttrs();
    let bugLink = entity.bugUrl;
    let homepageLink = entity.homepage;
    if (entity.entityType === 'bundle' && !homepageLink) {
      homepageLink = 'https://code.launchpad.net/' +
        `~charmers/charms/bundles/${entity.name}/bundle`;
    } else if (entity.entityType === 'charm' && !bugLink) {
      bugLink = 'https://bugs.launchpad.net/charms/' +
        `+source/${entity.name}`;
    }
    return (
      <div className="section">
        <h3 className="section__title">
          Contribute
        </h3>
        <ul className="section__list">
          {bugLink ? (
            <li className="section__list-item">
              <a className="link"
                href={bugLink}
                target="_blank">
                Submit a bug
              </a>
            </li>) : undefined}
          {homepageLink ? (
            <li className="section__list-item">
              <a className="link"
                href={homepageLink}
                target="_blank">
                Project homepage
              </a>
            </li>) : undefined}
        </ul>
      </div>);
  }

  /**
    Generate the expert details
  */
  _generateExpert() {
    const entityModel = this.props.entityModel;
    if (!this.props.hasPlans && entityModel.get('entityType') === 'charm') {
      return null;
    }
    return (
      <ExpertContactCard
        expert={entityModel.get('owner')}
        sendAnalytics={this.props.sendAnalytics}
        staticURL={this.props.staticURL} />);
  }

  /**
    Transform and generate the price list from a provided string of prices.

    @method _generatePriceList
    @param {String} prices The string of prices in the format
      'price/quantity;price/quantity'.
    @returns {Object} The price list JSX components.
  */
  _generatePriceList(prices) {
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
  }

  /**
    Generate the list of plans.

    @method _generatePlans
  */
  _generatePlans() {
    var props = this.props;
    if (props.entityModel.get('entityType') !== 'charm' ||
      !this.props.hasPlans) {
      return;
    }
    var plans = props.plans;
    // Return a spinner if null (we don't have a response yet) or nothing if
    // plans are a 0-length array (no plans found, likely due to an error).
    if (!plans) {
      return <Spinner />;
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
      <div className="row entity-content__plans"
        id="plans">
        <div className="inner-wrapper">
          <div className="twelve-col">
            <h2 className="entity-content__header">Plans</h2>
            <div className="equal-height">
              {plansList}
            </div>
          </div>
        </div>
      </div>);
  }

  /**
    Generate the Juju card example.

    @return {Object} React "div" that contains the card holder.
  */
  _generateCard() {
    const entityModel = this.props.entityModel;
    const entity = entityModel.toEntity();
    const storeId = entity.type === 'charm' ?
      entity.storeId : entity.id.split('cs:').join('');
    const ddeploy = this.props.flags['test.ddeploy'];
    const dataDD = ddeploy ? 'data-dd' : '';
    const script = '<script ' +
    'src="https://assets.ubuntu.com/v1/juju-cards-v1.6.0.js"></script>\n' +
    `<div class="juju-card" ${dataDD} data-id="${storeId}"></div>`;
    let cardElement = <div className="juju-card" data-id={storeId}></div>;
    if (ddeploy) {
      cardElement = <div className="juju-card" data-dd data-id={storeId}></div>;
    }

    return (
      <div className="entity-content__card section clearfix">
        <h3 className="section__title">
          Embed this charm
        </h3>
        <p>
          Add this card to your website by copying the code below.&nbsp;
          <a className="entity-content__card-cta" href="https://jujucharms.com/community/cards"
            target="_blank">
            Learn more
          </a>.
        </p>
        <CopyToClipboard
          value={script} />
        <h4>Preview</h4>
        {cardElement}
      </div>);
  }

  componentDidMount() {
    if (window.jujuCards) {
      window.jujuCards();
    }
  }

  render() {
    const entityModel = this.props.entityModel;
    return (
      <div className="entity-content">
        <div className="row">
          <div className="inner-wrapper">
            <div className="eight-col">
              {this._generateDescription(entityModel)}
              {this._generateDiagram(entityModel)}
              {this._generateTagsAndTerms(entityModel)}
              {this._generatePlans()}
              <EntityContentReadme
                addNotification={this.props.addNotification}
                changeState={this.props.changeState}
                entityModel={entityModel}
                getFile={this.props.getFile}
                hash={this.props.hash}
                renderMarkdown={this.props.renderMarkdown}
                scrollCharmbrowser={this.props.scrollCharmbrowser} />
              {this._generateOptionsList(entityModel)}
            </div>
            <div className="four-col last-col">
              {this._generateExpert()}
              {this._generateActions()}
              {this._generateResources()}
              {this._showEntityRelations()}
              <EntityFiles
                apiUrl={this.props.apiUrl}
                entityModel={entityModel}
                pluralize={this.props.pluralize} />
              {this._generateCard()}
            </div>
          </div>
        </div>
        {this._generateTermsPopup()}
      </div>
    );
  }
};

EntityContent.defaultProps = {
  flags: {}
};

EntityContent.propTypes = {
  addNotification: PropTypes.func.isRequired,
  apiUrl: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  clearLightbox: PropTypes.func,
  displayLightbox: PropTypes.func,
  entityModel: PropTypes.object.isRequired,
  flags: PropTypes.object,
  getDiagramURL: PropTypes.func.isRequired,
  getFile: PropTypes.func.isRequired,
  hasPlans: PropTypes.bool.isRequired,
  hash: PropTypes.string,
  plans: PropTypes.array,
  pluralize: PropTypes.func.isRequired,
  renderMarkdown: PropTypes.func.isRequired,
  scrollCharmbrowser: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  showTerms: PropTypes.func.isRequired,
  staticURL: PropTypes.string
};

module.exports = EntityContent;
