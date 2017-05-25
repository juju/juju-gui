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
    displayName: 'Charmbrowser',
    propTypes: {
      acl: React.PropTypes.object.isRequired,
      addNotification: React.PropTypes.func.isRequired,
      apiUrl: React.PropTypes.string.isRequired,
      apiVersion: React.PropTypes.string.isRequired,
      appState: React.PropTypes.object.isRequired,
      charmstoreSearch: React.PropTypes.func.isRequired,
      charmstoreURL: React.PropTypes.string.isRequired,
      deployService: React.PropTypes.func.isRequired,
      deployTarget: React.PropTypes.func.isRequired,
      getBundleYAML: React.PropTypes.func.isRequired,
      getDiagramURL: React.PropTypes.func.isRequired,
      getEntity: React.PropTypes.func.isRequired,
      getFile: React.PropTypes.func.isRequired,
      getModelName: React.PropTypes.func.isRequired,
      gisf: React.PropTypes.bool.isRequired,
      importBundleYAML: React.PropTypes.func.isRequired,
      listPlansForCharm: React.PropTypes.func.isRequired,
      makeEntityModel: React.PropTypes.func.isRequired,
      renderMarkdown: React.PropTypes.func.isRequired,
      series: React.PropTypes.object.isRequired,
      setPageTitle: React.PropTypes.func.isRequired,
      showTerms: React.PropTypes.func.isRequired,
      staticURL: React.PropTypes.string,
      urllib: React.PropTypes.func.isRequired,
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
      if (this.refs.charmbrowser) {
        this.refs.charmbrowser.removeEventListener('scroll', this._onScroll);
      }
    },

    /**
      Scroll the charmbrowser to an element with an id that matches the
      hash state.

      @param container {Object} a DOM node that contains the element with the
        id to scroll to.
    */
    _scrollCharmbrowser: function(container) {
      const hash = this.props.appState.current.hash;
      const target = container.querySelector(`#${hash}`);
      // The charmbrowser element does the scrolling.
      const charmbrowser = ReactDOM.findDOMNode(this).querySelector(
        '.charmbrowser');
      if (target && charmbrowser) {
        // Set the scroll position to the element's top position taking into
        // account the sticky header size.
        charmbrowser.scrollTop += target.getBoundingClientRect().top - 200;
      }
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
      this.props.appState.changeState({
        hash: null,
        root: null,
        search: null,
        store: null
      });
    },

    /**
      Generates the state for the charmbrowser based on the app state.

      @method generateState
      @param {Object} nextProps The props which were sent to the component.
      @return {Object} A generated state object which can be passed to setState.
    */
    generateState: function(nextProps) {
      let state = {};
      let activeComponent = 'store';
      const currentState = nextProps.appState.current;
      // Because it's invalid to have these values be in state at the same time
      // we can simply check for their existance.
      if (currentState.store || currentState.user) {
        activeComponent = 'entity-details';
      } else if (currentState.search) {
        activeComponent = 'search-results';
      }
      // If the contents of the charmbrowser changes we need to scroll the
      // container to the top.
      if (this.state && activeComponent !== this.state.activeComponent) {
        this.refs.charmbrowser.scrollTop = 0;
        state.scrollPosition = 0;
      }
      state.activeComponent = activeComponent;
      return state;
    },

    /**
      Generate the content based on the state.

      @method _generateContent
      @return {Object} The child components for the content.
    */
    _generateContent: function() {
      let activeChild;
      const utils = this.props.utils;
      const currentState = this.props.appState.current;
      const changeState = this.props.appState.changeState.bind(
        this.props.appState);
      switch (this.state.activeComponent) {
        case 'store':
          activeChild = (
              <juju.components.Store
                changeState={changeState}
                gisf={this.props.gisf}
                staticURL={this.props.staticURL}
                charmstoreURL={this.props.charmstoreURL}
                apiVersion={this.props.apiVersion}
                setPageTitle={this.props.setPageTitle} />
          );
          break;
        case 'search-results':
          const search = currentState.search;
          activeChild = (
              <juju.components.SearchResults
                acl={this.props.acl}
                changeState={changeState}
                charmstoreSearch={this.props.charmstoreSearch}
                deployTarget={this.props.deployTarget}
                getName={utils.getName}
                makeEntityModel={this.props.makeEntityModel}
                owner={search.owner}
                provides={search.provides}
                query={search.text}
                requires={search.requires}
                series={search.series}
                seriesList={this.props.series}
                setPageTitle={this.props.setPageTitle}
                sort={search.sort}
                tags={search.tags}
                type={search.type} />
          );
          break;
        case 'entity-details':
          // TODO frankban: do we still really need this?
          const id = currentState.store || `~${currentState.user}`;
          activeChild = (
              <juju.components.EntityDetails
                acl={this.props.acl}
                addNotification={this.props.addNotification}
                apiUrl={this.props.apiUrl}
                changeState={changeState}
                importBundleYAML={this.props.importBundleYAML}
                getBundleYAML={this.props.getBundleYAML}
                getEntity={this.props.getEntity}
                deployService={this.props.deployService}
                getDiagramURL={this.props.getDiagramURL}
                getModelName={this.props.getModelName}
                getFile={this.props.getFile}
                hash={currentState.hash}
                scrollPosition={this.state.scrollPosition}
                renderMarkdown={this.props.renderMarkdown}
                id={id}
                // This is used to force a component remount when the entity
                // changes, for instance a charm detail page has a link to
                // another charm detail page.
                key={id}
                pluralize={utils.pluralize}
                listPlansForCharm={this.props.listPlansForCharm}
                makeEntityModel={this.props.makeEntityModel}
                scrollCharmbrowser={this._scrollCharmbrowser}
                setPageTitle={this.props.setPageTitle}
                showTerms={this.props.showTerms}
                urllib={this.props.urllib}
              />
          );
          break;
      }
      return activeChild;
    },

    componentWillReceiveProps: function(nextProps) {
      this.setState(this.generateState(nextProps));
    },

    render: function() {
      return (
        <juju.components.Panel
          clickAction={this._close}
          instanceName="white-box"
          focus={false}
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
    'search-results',
    'store'
  ]
});
