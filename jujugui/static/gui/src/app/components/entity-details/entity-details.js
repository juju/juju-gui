'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');
const { urls } = require('jaaslib');

const EntityContent = require('./content/content');
const EntityHeader = require('./header/header');
const jujulibConversionUtils = require('../../init/jujulib-conversion-utils');
const Spinner = require('../spinner/spinner');

class EntityDetails extends React.Component {
  constructor(props) {
    super(props);
    this.xhrs = [];
    var state = this.generateState(this.props);
    state.entityModel = null;
    state.hasPlans = false;
    state.plans = null;
    this.state = state;
  }

  componentDidMount() {
    // Set the keyboard focus on the component so it can be scrolled with the
    // keyboard. Requires tabIndex to be set on the element.
    this.refs.content.focus();
    // Be sure to convert the id to the legacy id as the URL will be in the
    // new id format.
    const xhr = this._getEntity(this.props.id, this._fetchCallback.bind(this));
    this.xhrs.push(xhr);
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr.abort();
    });
    this.props.setPageTitle();
  }

  /**
   Retrieve from the charm store information on the charm or bundle with
   the given new style id.

   @param id {String} The entity id.
   @param callback {Function} The function to call when the entity has be retrieved.
   @returns {Object} The XHR reference for the getEntity call.
  */
  _getEntity(id, callback) {
    let url;
    try {
      url = urls.URL.fromString(id);
    } catch(err) {
      callback(err, {});
      return;
    }
    // Get the entity and return the XHR.
    return this.props.charmstore.getEntity(url.legacyPath(), callback);
  }

  /**
    Generates the state for the search results.

    @method generateState
    @param {Object} nextProps The props which were sent to the component.
    @return {Object} A generated state object which can be passed to setState.
  */
  generateState(nextProps) {
    return {
      activeComponent: nextProps.activeComponent || 'loading'
    };
  }

  /**
    Generate the content based on the state.

    @method _generateContent
    @return {Object} The child components for the content.
  */
  _generateContent() {
    var activeChild;
    switch (this.state.activeComponent) {
      case 'loading':
        activeChild = (
          <div>
            <Spinner />
          </div>
        );
        break;
      case 'entity-details':
        var entityModel = this.state.entityModel;
        const { charmstore } = this.props;
        activeChild = (
          <div>
            <EntityHeader
              acl={this.props.acl}
              addNotification={this.props.addNotification}
              changeState={this.props.changeState}
              deployService={this.props.deployService}
              entityModel={entityModel}
              getBundleYAML={this.props.charmstore.getBundleYAML}
              getModelName={this.props.getModelName}
              hasPlans={this.state.hasPlans}
              importBundleYAML={this.props.importBundleYAML}
              plans={this.state.plans}
              scrollPosition={this.props.scrollPosition} />
            <EntityContent
              addNotification={this.props.addNotification}
              changeState={this.props.changeState}
              charmstore={shapeup.addReshape({
                getDiagramURL: charmstore.getDiagramURL,
                getFile: charmstore.getFile,
                url: charmstore.url
              })}
              clearLightbox={this.props.clearLightbox}
              displayLightbox={this.props.displayLightbox}
              entityModel={entityModel}
              flags={this.props.flags}
              hash={this.props.hash}
              hasPlans={this.state.hasPlans}
              plans={this.state.plans}
              scrollCharmbrowser={this.props.scrollCharmbrowser}
              sendAnalytics={this.props.sendAnalytics}
              showTerms={this.props.showTerms}
              staticURL={this.props.staticURL} />
          </div>
        );
        break;
      case 'error':
        activeChild = (
          <p className="error">
              There was a problem while loading the entity details.
              You could try searching for another charm or bundle or go{' '}
            <span className="link"
              onClick={this._handleBack.bind(this)}>
                back
            </span>.
          </p>
        );
        break;
    }
    return activeChild;
  }

  /**
    Change the state to reflect the chosen component.

    @method _changeActiveComponent
    @param {String} newComponent The component to switch to.
  */
  _changeActiveComponent(newComponent) {
    var nextProps = this.state;
    nextProps.activeComponent = newComponent;
    this.setState(this.generateState(nextProps));
  }

  /**
    Callback for when an entity has been successfully fetched. Though the
    data passed in is an Array of models, only the first model is used.
    @param {String} error An error message, or null if there's no error.
    @param {Array} models A list of the entity models found.
  */
  _fetchCallback(error, data) {
    if (error || !data) {
      this._changeActiveComponent('error');
      const message = 'cannot fetch the entity';
      this.props.addNotification({
        title: message,
        message: `${message}: ${error}`,
        level: 'error'
      });
      console.error(message, error);
      return;
    }
    if (data.length > 0) {
      data = data[0];
      const model = jujulibConversionUtils.makeEntityModel(data);
      this.setState({entityModel: model}, () => {
        this._changeActiveComponent('entity-details');
        this._getPlans();
      });
      const modelEntity = model.toEntity();
      const displayName = modelEntity.displayName;
      const revision_id = modelEntity.revision_id;
      const title = `${displayName} (#${revision_id})`;
      this.props.setPageTitle(title);
    }
  }

  /**
    Get the list of plans available for a charm.

    @method _getPlans
  */
  _getPlans() {
    var entityModel = this.state.entityModel;
    if (entityModel.get('entityType') === 'charm') {
      if (entityModel.hasMetrics()) {
        this.setState({hasPlans: true}, () => {
          const xhr = this.props.listPlansForCharm(
            entityModel.get('id'), this._getPlansCallback.bind(this));
          this.xhrs.push(xhr);
        });
      }
    }
  }

  /**
    Callback for when plans for an entity have been successfully fetched.

    @method _getPlansCallback
    @param {String} error An error message, or null if there's no error.
    @param {Array} models A list of the plans found.
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
      this.setState({plans: []});
    } else {
      this.setState({plans: plans});
    }
  }

  /**
    Handle navigating back.

    @method _handleBack
  */
  _handleBack() {
    window.history.back();
  }

  /**
    Generate the base classes from the props.

    @method _generateClasses
    @returns {String} The collection of class names.
  */
  _generateClasses() {
    var classes = {};
    var entityModel = this.state.entityModel;
    if (entityModel) {
      classes[entityModel.get('entityType')] = true;
    }
    return classNames(
      'entity-details',
      classes
    );
  }

  render() {
    return (
      <div className={this._generateClasses()}
        ref="content"
        tabIndex="0">
        {this._generateContent()}
      </div>
    );
  }
};

EntityDetails.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: shapeup.shape({
    getBundleYAML: PropTypes.func.isRequired,
    getDiagramURL: PropTypes.func.isRequired,
    getEntity: PropTypes.func.isRequired,
    getFile: PropTypes.func.isRequired,
    reshape: shapeup.reshapeFunc,
    url: PropTypes.string.isRequired
  }).isRequired,
  clearLightbox: PropTypes.func,
  deployService: PropTypes.func.isRequired,
  displayLightbox: PropTypes.func,
  flags: PropTypes.object,
  getModelName: PropTypes.func.isRequired,
  hash: PropTypes.string,
  id: PropTypes.string.isRequired,
  importBundleYAML: PropTypes.func.isRequired,
  listPlansForCharm: PropTypes.func.isRequired,
  scrollCharmbrowser: PropTypes.func.isRequired,
  scrollPosition: PropTypes.number.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  setPageTitle: PropTypes.func.isRequired,
  showTerms: PropTypes.func.isRequired,
  staticURL: PropTypes.string
};

module.exports = EntityDetails;
