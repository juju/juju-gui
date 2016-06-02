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

YUI.add('entity-details', function() {

  juju.components.EntityDetails = React.createClass({
    detailsXhr: null,

    /* Define and validate the properites available on this component. */
    propTypes: {
      addNotification: React.PropTypes.func.isRequired,
      apiUrl: React.PropTypes.string.isRequired,
      changeState: React.PropTypes.func.isRequired,
      currentModel: React.PropTypes.string,
      deployService: React.PropTypes.func.isRequired,
      environmentName: React.PropTypes.string.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      getEntity: React.PropTypes.func.isRequired,
      getFile: React.PropTypes.func.isRequired,
      id: React.PropTypes.string.isRequired,
      importBundleYAML: React.PropTypes.func.isRequired,
      listModels: React.PropTypes.func.isRequired,
      makeEntityModel: React.PropTypes.func.isRequired,
      pluralize: React.PropTypes.func.isRequired,
      renderMarkdown: React.PropTypes.func.isRequired,
      scrollPosition: React.PropTypes.number.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      user: React.PropTypes.object.isRequired
    },

    /**
      Generates the state for the search results.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      return {
        activeComponent: nextProps.activeComponent || 'loading'
      };
    },

    /**
      Generate the content based on the state.

      @method _generateContent
      @return {Object} The child components for the content.
    */
    _generateContent: function() {
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
                  addNotification={this.props.addNotification}
                  changeState={this.props.changeState}
                  currentModel={this.props.currentModel}
                  deployService={this.props.deployService}
                  entityModel={entityModel}
                  environmentName={this.props.environmentName}
                  importBundleYAML={this.props.importBundleYAML}
                  getBundleYAML={this.props.getBundleYAML}
                  listModels={this.props.listModels}
                  pluralize={this.props.pluralize}
                  scrollPosition={this.props.scrollPosition}
                  switchModel={this.props.switchModel}
                  user={this.props.user} />
                {this._generateDiagram(entityModel)}
                <juju.components.EntityContent
                  apiUrl={this.props.apiUrl}
                  changeState={this.props.changeState}
                  getFile={this.props.getFile}
                  renderMarkdown={this.props.renderMarkdown}
                  entityModel={entityModel}
                  pluralize={this.props.pluralize} />
              </div>
          );
          break;
        case 'error':
          activeChild = (
              <p className="error">
                There was a problem while loading the entity details.
                You could try searching for another charm or bundle or go{' '}
                <span className="link"
                  onClick={this._handleBack}>
                  back
                </span>.
              </p>
          );
          break;
      }
      return activeChild;
    },

    /**
      Change the state to reflect the chosen component.

      @method _changeActiveComponent
      @param {String} newComponent The component to switch to.
    */
    _changeActiveComponent: function(newComponent) {
      var nextProps = this.state;
      nextProps.activeComponent = newComponent;
      this.setState(this.generateState(nextProps));
    },

    /**
      Callback for when an entity has been successfully fetched. Though the
      data passed in is an Array of models, only the first model is used.

      @method fetchSuccess
      @param {String} error An error message, or null if there's no error.
      @param {Array} models A list of the entity models found.
    */
    fetchCallback: function(error, data) {
      if (error) {
        this._changeActiveComponent('error');
        console.error('Fetching the entity failed.');
        return;
      }
      if (data.length > 0) {
        var data = data[0];
        var model = this.props.makeEntityModel(data);
        this.setState({entityModel: model});
        this._changeActiveComponent('entity-details');
      }
    },

    getInitialState: function() {
      var state = this.generateState(this.props);
      state.entityModel = null;
      return state;
    },

    componentDidMount: function() {
      // Set the keyboard focus on the component so it can be scrolled with the
      // keyboard. Requires tabIndex to be set on the element.
      this.refs.content.focus();
      this.detailsXhr = this.props.getEntity(
          this.props.id, this.fetchCallback);
    },

    componentWillUnmount: function() {
      this.detailsXhr.abort();
    },

    /**
    Generate the diagram markup for a bundle.

    @method _generateDiagram
    @param {Object} entityModel The entity model.
    @return {Object} The diagram markup.
    */
    _generateDiagram: function(entityModel) {
      if (entityModel.get('entityType') !== 'bundle') {
        return;
      }
      return <juju.components.EntityContentDiagram
        getDiagramURL={this.props.getDiagramURL}
        id={entityModel.get('id')} />;
    },

    /**
      Handle navigating back.

      @method _handleBack
    */
    _handleBack: function() {
      window.history.back();
    },

    /**
      Generate the base classes from the props.

      @method _generateClasses
      @returns {String} The collection of class names.
    */
    _generateClasses: function() {
      var classes = {};
      var entityModel = this.state.entityModel;
      if (entityModel) {
        classes[entityModel.get('entityType')] = true;
      }
      return classNames(
        'entity-details',
        classes
      );
    },

    render: function() {
      return (
        <div className={this._generateClasses()}
          ref="content"
          tabIndex="0">
          {this._generateContent()}
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'entity-header',
    'entity-content',
    'entity-content-diagram',
    'jujulib-utils',
    'loading-spinner'
  ]
});
