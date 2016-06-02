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

YUI.add('charmbrowser-component', function() {

  juju.components.Charmbrowser = React.createClass({
    propTypes: {
      addNotification: React.PropTypes.func.isRequired,
      apiUrl: React.PropTypes.string.isRequired,
      appState: React.PropTypes.object.isRequired,
      changeState: React.PropTypes.func.isRequired,
      charmstoreSearch: React.PropTypes.func.isRequired,
      currentModel: React.PropTypes.string,
      deployService: React.PropTypes.func.isRequired,
      environmentName: React.PropTypes.string.isRequired,
      getBundleYAML: React.PropTypes.func.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      getEntity: React.PropTypes.func.isRequired,
      getFile: React.PropTypes.func.isRequired,
      importBundleYAML: React.PropTypes.func.isRequired,
      listModels: React.PropTypes.func.isRequired,
      makeEntityModel: React.PropTypes.func.isRequired,
      renderMarkdown: React.PropTypes.func.isRequired,
      series: React.PropTypes.object.isRequired,
      switchModel: React.PropTypes.func.isRequired,
      user: React.PropTypes.object.isRequired,
      utils: React.PropTypes.object.isRequired
    },

    /**
      Get the current state of the charmbrowser.

      @method getInitialState
      @returns {String} The current state.
    */
    getInitialState: function() {
      // Setting a default state object.
      var state = this.generateState(this.props);
      state.scrollPosition = 0;
      return state;
    },

    componentDidMount: function() {
      this.refs.charmbrowser.addEventListener('scroll', this._onScroll);
    },

    componentWillUnmount: function() {
      this.refs.charmbrowser.removeEventListener('scroll', this._onScroll);
    },

    /**
      Set the scroll position state.

      @method _onScroll
      @param {Object} e The scroll event
    */
    _onScroll: function(e) {
      if (this.state.activeComponent === 'entity-details') {
        this.setState({scrollPosition: e.target.scrollTop});
      }
    },

    /**
      Closes the charmbrowser.

      @method _close
    */
    _close: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: null
        }
      });
    },

    /**
      Generates the state for the charmbrowser based on the app state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      var metadata = nextProps.appState.sectionC.metadata;
      var activeComponent = metadata.activeComponent;
      var state = {activeComponent: activeComponent};
      // If the contents of the charmbrowser changes we need to scroll the
      // container to the top.
      if (this.state && activeComponent !== this.state.activeComponent) {
        this.refs.charmbrowser.scrollTop = 0;
        state.scrollPosition = 0;
      }
      return state;
    },

    /**
      Generate the content based on the state.

      @method _generateContent
      @return {Object} The child components for the content.
    */
    _generateContent: function() {
      var activeChild;
      var metadata = this.props.appState.sectionC.metadata;
      var utils = this.props.utils;
      switch (this.state.activeComponent) {
        case 'mid-point':
          activeChild = (
              <juju.components.MidPoint
                changeState={this.props.changeState}
                outsideClickClose={true}
                storeOpen={false} />
          );
          break;
        case 'store':
          activeChild = (
              <juju.components.Store
                charmstoreSearch={this.props.charmstoreSearch}
                changeState={this.props.changeState}
                getName={utils.getName}
                seriesList={this.props.series}
                makeEntityModel={this.props.makeEntityModel} />
          );
          break;
        case 'search-results':
          activeChild = (
              <juju.components.SearchResults
                changeState={this.props.changeState}
                charmstoreSearch={this.props.charmstoreSearch}
                getName={utils.getName}
                makeEntityModel={this.props.makeEntityModel}
                query={metadata.search}
                seriesList={this.props.series}
                type={metadata.type}
                sort={metadata.sort}
                series={metadata.series}
                provides={metadata.provides}
                requires={metadata.requires}
                owner={metadata.owner}
                tags={metadata.tags} />
          );
          break;
        case 'entity-details':
          activeChild = (
              <juju.components.EntityDetails
                addNotification={this.props.addNotification}
                apiUrl={this.props.apiUrl}
                changeState={this.props.changeState}
                currentModel={this.props.currentModel}
                environmentName={this.props.environmentName}
                importBundleYAML={this.props.importBundleYAML}
                getBundleYAML={this.props.getBundleYAML}
                getEntity={this.props.getEntity}
                getDiagramURL={this.props.getDiagramURL}
                deployService={this.props.deployService}
                getFile={this.props.getFile}
                id={metadata.id}
                listModels={this.props.listModels}
                makeEntityModel={this.props.makeEntityModel}
                scrollPosition={this.state.scrollPosition}
                user={this.props.user}
                renderMarkdown={this.props.renderMarkdown}
                pluralize={utils.pluralize}
                switchModel={this.props.switchModel} />
          );
          break;
      }
      return activeChild;
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState(this.generateState(nextProps));
    },

    render: function() {
      // Do not focus on the panel when the midpoint is opened so that the focus
      // remains on the search box.
      var focus = this.state.activeComponent !== 'mid-point';
      return (
        <juju.components.Panel
          clickAction={this._close}
          instanceName="white-box"
          focus={focus}
          visible={true}>
          <div className="charmbrowser"
            ref="charmbrowser">
            {this._generateContent()}
          </div>
        </juju.components.Panel>
      );
    }

  });

}, '0.1.0', {
  requires: [
    'entity-details',
    'mid-point',
    'search-results',
    'store'
  ]
});
