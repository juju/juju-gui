/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../spinner/spinner');
const InspectorChangeVersionItem = require('./item/item');

class InspectorChangeVersion extends React.Component {
  constructor() {
    super();
    this.versionsXhr = null;
    this.state = {
      loading: false,
      versionsList: null
    };
  }

  componentDidMount() {
    this._getVersions(this.props.charmId);
  }

  componentWillReceiveProps(nextProps) {
    this._getVersions(nextProps.charmId);
  }

  componentWillUnmount() {
    this.versionsXhr.abort();
  }

  /**
    The callable to be passed to the version item to view the charm details.

    @method _viewCharmDetails
    @param {Object} url The charm url as a window.jujulib.URL instance.
    @param {Object} evt The click event.
  */
  _viewCharmDetails(url, evt) {
    this.props.changeState({store: url.path()});
  }

  /**
    The callable to be passed to the version item to change versions.

      @method _versionButtonAction
      @param {String} charmId The charm id.
      @param {Object} e The click event.
  */
  _versionButtonAction(charmId, e) {
    const callback = this._addCharmCallback.bind(this, charmId);
    // XXX hatch: the ecs doesn't yet support addCharm so we are going to
    // send the command to juju immediately.
    this.props.addCharm(charmId, callback, {immediate: true});
  }

  /**
    Callback for handling the results of addCharm.

    @method _addCharmCallback
    @param {String} charmId The charm id.
    @param {Object} data The response object from the addCharm call in the
      format {err, url}.
  */
  _addCharmCallback(charmId, data) {
    var error = data.err;
    if (error) {
      this._addFailureNotification(charmId, error);
      return;
    }
    this.props.setCharm(this.props.service.get('id'), charmId, false, false,
      this._setCharmCallback.bind(this, charmId));
  }

  /**
    Callback for handling the results of setCharm.

    @method _setCharmCallback
  */
  _setCharmCallback(charmId, data) {
    if (data.err) {
      this._addFailureNotification(charmId, data.err);
      return;
    }
    this.props.getCharm(charmId, this._getCharmCallback.bind(this, charmId));
  }

  /**
    Callback for handling the results of getCharm.

    @method _getCharmCallback
  */
  _getCharmCallback(charmId, data) {
    if (data.err) {
      this._addFailureNotification(charmId, data.err);
      return;
    }
    this.props.service.set('charm', charmId);
  }

  /**
    Add a notification for an upgrade failure.

    @method _addFailureNotification
    @param {String} charmId The charm id.
    @param {Object} error The upgrade error.
  */
  _addFailureNotification(charmId, error) {
    this.props.addNotification({
      title: 'Charm upgrade failed',
      message: 'The charm ' + charmId + ' failed to upgrade:' + error,
      level: 'error'
    });
  }

  /**
    Get a list of versions for the charm.

    @method _getVersions
    @param {String} charmId The charm id.
  */
  _getVersions(charmId) {
    this.setState({loading: true});
    this.versionsXhr = this.props.getAvailableVersions(
      charmId, this._getVersionsCallback.bind(this));
  }

  /**
    Update the state with the returned versions.

    @method _getVersionsSuccess
    @param {String} error The error message, if any. Null if no error.
    @param {Array} versions The available versions.
  */
  _getVersionsCallback(error, versions) {
    if (error) {
      const message = 'unable to retrieve charm versions';
      this.props.addNotification({
        title: message,
        message: `${message}: ${error}`,
        level: 'error'
      });
      console.error(message, error);
      versions = null;
    }
    let components = [];
    if (!versions || versions.length === 1) {
      components = (
        <li className="inspector-change-version__none">
          No other versions found.
        </li>);
    } else {
      const url = window.jujulib.URL.fromLegacyString(this.props.charmId);
      versions.forEach(function(version) {
        const versionURL = window.jujulib.URL.fromLegacyString(version);
        let downgrade = false;
        if (versionURL.revision === url.revision) {
          return true;
        } else if (versionURL.revision < url.revision) {
          downgrade = true;
        }
        components.push(
          <InspectorChangeVersionItem
            acl={this.props.acl}
            buttonAction={this._versionButtonAction.bind(this, version)}
            downgrade={downgrade}
            itemAction={this._viewCharmDetails.bind(this, versionURL)}
            key={version}
            url={versionURL} />);
      }, this);
    }
    this.setState({loading: false});
    this.setState({versionsList: components});
  }

  /**
    Display the versions list or a spinner if it is loading.

    @method _displayVersionsList
  */
  _displayVersionsList(loading, versionsList) {
    if (loading) {
      return(
        <div className="inspector-spinner">
          <Spinner />
        </div>
      );
    } else {
      return (
        <ul className="inspector-change-version__versions">
          {versionsList}
        </ul>
      );
    }
  }

  render() {
    const url = window.jujulib.URL.fromLegacyString(this.props.charmId);
    return (
      <div className="inspector-change-version">
        <div className="inspector-change-version__current">
          Current version:
          <div className="inspector-change-version__current-version"
            onClick={this._viewCharmDetails.bind(this, url)} role="button"
            tabIndex="0">
            {url.path()}
          </div>
        </div>
        {this._displayVersionsList(this.state.loading,
          this.state.versionsList)}
      </div>
    );
  }
};

InspectorChangeVersion.propTypes = {
  acl: PropTypes.object.isRequired,
  addCharm: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  charmId: PropTypes.string.isRequired,
  getAvailableVersions: PropTypes.func.isRequired,
  getCharm: PropTypes.func.isRequired,
  service: PropTypes.object.isRequired,
  setCharm: PropTypes.func.isRequired
};

module.exports = InspectorChangeVersion;
