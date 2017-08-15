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
    const xhr = this.props.getEntity(
      this.props.id, this._fetchCallback.bind(this));
    this.xhrs.push(xhr);
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr.abort();
    });
    this.props.setPageTitle();
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
            <juju.components.Spinner />
          </div>
        );
        break;
      case 'entity-details':
        var entityModel = this.state.entityModel;
        activeChild = (
          <div>
            <juju.components.EntityHeader
              acl={this.props.acl}
              displayPostDeployment={this.props.displayPostDeployment}
              entityModel={entityModel}
              addNotification={this.props.addNotification}
              importBundleYAML={this.props.importBundleYAML}
              getBundleYAML={this.props.getBundleYAML}
              getModelName={this.props.getModelName}
              hasPlans={this.state.hasPlans}
              changeState={this.props.changeState}
              deployService={this.props.deployService}
              plans={this.state.plans}
              pluralize={this.props.pluralize}
              scrollPosition={this.props.scrollPosition}
              urllib={this.props.urllib}
            />
            {this._generateDiagram(entityModel)}
            <juju.components.EntityContent
              addNotification={this.props.addNotification}
              apiUrl={this.props.apiUrl}
              changeState={this.props.changeState}
              flags={this.props.flags}
              getFile={this.props.getFile}
              hash={this.props.hash}
              hasPlans={this.state.hasPlans}
              renderMarkdown={this.props.renderMarkdown}
              entityModel={entityModel}
              plans={this.state.plans}
              pluralize={this.props.pluralize}
              scrollCharmbrowser={this.props.scrollCharmbrowser}
              showTerms={this.props.showTerms}
            />
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

    @method fetchSuccess
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
      const model = this.props.makeEntityModel(data);
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
  Generate the diagram markup for a bundle.

  @method _generateDiagram
  @param {Object} entityModel The entity model.
  @return {Object} The diagram markup.
  */
  _generateDiagram(entityModel) {
    if (entityModel.get('entityType') !== 'bundle') {
      return;
    }
    return <juju.components.EntityContentDiagram
      getDiagramURL={this.props.getDiagramURL}
      id={entityModel.get('id')}
      isRow={true} />;
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
  apiUrl: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  deployService: PropTypes.func.isRequired,
  displayPostDeployment: PropTypes.func.isRequired,
  flags: PropTypes.object,
  getBundleYAML: PropTypes.func.isRequired,
  getDiagramURL: PropTypes.func.isRequired,
  getEntity: PropTypes.func.isRequired,
  getFile: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  hash: PropTypes.string,
  id: PropTypes.string.isRequired,
  importBundleYAML: PropTypes.func.isRequired,
  listPlansForCharm: PropTypes.func.isRequired,
  makeEntityModel: PropTypes.func.isRequired,
  pluralize: PropTypes.func.isRequired,
  renderMarkdown: PropTypes.func.isRequired,
  scrollCharmbrowser: PropTypes.func.isRequired,
  scrollPosition: PropTypes.number.isRequired,
  setPageTitle: PropTypes.func.isRequired,
  showTerms: PropTypes.func.isRequired,
  urllib: PropTypes.func.isRequired
};

YUI.add('entity-details', function() {
  juju.components.EntityDetails = EntityDetails;
}, '0.1.0', {
  requires: [
    'entity-header',
    'entity-content',
    'entity-content-diagram',
    'jujulib-utils',
    'loading-spinner'
  ]
});
