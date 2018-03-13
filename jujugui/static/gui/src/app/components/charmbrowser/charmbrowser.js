/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');

const EntityDetails = require('../entity-details/entity-details');
const Panel = require('../panel/panel');
const SearchResults = require('../search-results/search-results');
const Store = require('../store/store');

class Charmbrowser extends React.Component {
  /**
    Get the current state of the charmbrowser.

    @method getInitialState
    @returns {String} The current state.
  */
  constructor(props) {
    super(props);
    // Setting a default state object.
    var state = this.generateState(this.props);
    state.scrollPosition = 0;
    this.state = state;
  }

  componentDidMount() {
    // The ref cannot exist at this point in the tests.
    if (this.refs.charmbrowser) {
      this.refs.charmbrowser.addEventListener(
        'scroll', this._onScroll.bind(this));
    }
  }

  componentWillUnmount() {
    if (this.refs.charmbrowser) {
      this.refs.charmbrowser.removeEventListener(
        'scroll', this._onScroll.bind(this));
    }
  }

  /**
    Scroll the charmbrowser to an element with an id that matches the
    hash state.

    @param container {Object} a DOM node that contains the element with the
      id to scroll to.
  */
  _scrollCharmbrowser(container) {
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
  }

  /**
    Set the scroll position state.

    @method _onScroll
    @param {Object} e The scroll event
  */
  _onScroll(e) {
    if (this.state.activeComponent === 'entity-details') {
      this.setState({scrollPosition: e.target.scrollTop});
    }
  }

  /**
    Closes the charmbrowser.

    @method _close
  */
  _close() {
    this.props.appState.changeState({
      hash: null,
      root: null,
      search: null,
      store: null
    });
  }

  /**
    Generates the state for the charmbrowser based on the app state.

    @method generateState
    @param {Object} nextProps The props which were sent to the component.
    @return {Object} A generated state object which can be passed to setState.
  */
  generateState(nextProps) {
    let state = {};
    let activeComponent = 'store';
    const currentState = nextProps.appState.current;
    if (currentState.store) {
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
  }

  /**
    Generate the content based on the state.

    @method _generateContent
    @return {Object} The child components for the content.
  */
  _generateContent() {
    let activeChild;
    const utils = this.props.utils;
    const appState = this.props.appState;
    const currentState = appState.current;
    const changeState = appState.changeState.bind(appState);
    switch (this.state.activeComponent) {
      case 'store':
        activeChild = (
          <Store
            apiVersion={this.props.apiVersion}
            changeState={changeState}
            charmstoreURL={this.props.charmstoreURL}
            gisf={this.props.gisf}
            setPageTitle={this.props.setPageTitle}
            staticURL={this.props.staticURL} />
        );
        break;
      case 'search-results':
        const search = currentState.search;
        activeChild = (
          <SearchResults
            acl={this.props.acl}
            addToModel={this.props.addToModel}
            changeState={changeState}
            charmstoreSearch={this.props.charmstoreSearch}
            generatePath={appState.generatePath.bind(appState)}
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
          <EntityDetails
            acl={this.props.acl}
            addNotification={this.props.addNotification}
            apiUrl={this.props.apiUrl}
            changeState={changeState}
            clearLightbox={this.props.clearLightbox}
            deployService={this.props.deployService}
            displayLightbox={this.props.displayLightbox}
            flags={this.props.flags}
            getBundleYAML={this.props.getBundleYAML}
            getDiagramURL={this.props.getDiagramURL}
            getEntity={this.props.getEntity}
            getFile={this.props.getFile}
            getModelName={this.props.getModelName}
            hash={currentState.hash}
            id={id}
            importBundleYAML={this.props.importBundleYAML}
            key={id}
            listPlansForCharm={this.props.listPlansForCharm}
            makeEntityModel={this.props.makeEntityModel}
            // This is used to force a component remount when the entity
            // changes, for instance a charm detail page has a link to
            // another charm detail page.
            pluralize={utils.pluralize}
            renderMarkdown={this.props.renderMarkdown}
            scrollCharmbrowser={this._scrollCharmbrowser.bind(this)}
            scrollPosition={this.state.scrollPosition}
            sendAnalytics={this.props.sendAnalytics}
            setPageTitle={this.props.setPageTitle}
            showTerms={this.props.showTerms}
            staticURL={this.props.staticURL}
            urllib={this.props.urllib} />
        );
        break;
    }
    return activeChild;
  }

  componentWillReceiveProps(nextProps) {
    this.setState(this.generateState(nextProps));
  }

  render() {
    return (
      <Panel
        clickAction={this._close.bind(this)}
        focus={false}
        instanceName="white-box"
        visible={true}>
        <div className="charmbrowser"
          ref="charmbrowser">
          {this._generateContent()}
        </div>
      </Panel>
    );
  }
};

Charmbrowser.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  addToModel: PropTypes.func.isRequired,
  apiUrl: PropTypes.string.isRequired,
  apiVersion: PropTypes.string.isRequired,
  appState: PropTypes.object.isRequired,
  charmstoreSearch: PropTypes.func.isRequired,
  charmstoreURL: PropTypes.string.isRequired,
  clearLightbox: PropTypes.func,
  deployService: PropTypes.func.isRequired,
  displayLightbox: PropTypes.func,
  flags: PropTypes.object,
  getBundleYAML: PropTypes.func.isRequired,
  getDiagramURL: PropTypes.func.isRequired,
  getEntity: PropTypes.func.isRequired,
  getFile: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  gisf: PropTypes.bool.isRequired,
  importBundleYAML: PropTypes.func.isRequired,
  listPlansForCharm: PropTypes.func.isRequired,
  makeEntityModel: PropTypes.func.isRequired,
  renderMarkdown: PropTypes.func.isRequired,
  sendAnalytics: PropTypes.func.isRequired,
  series: PropTypes.object.isRequired,
  setPageTitle: PropTypes.func.isRequired,
  showTerms: PropTypes.func.isRequired,
  staticURL: PropTypes.string,
  urllib: PropTypes.func.isRequired,
  utils: PropTypes.object.isRequired
};

module.exports = Charmbrowser;
