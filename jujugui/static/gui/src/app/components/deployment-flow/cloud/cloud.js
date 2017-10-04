/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

const Spinner = require('../../spinner/spinner');
const SvgIcon = require('../../svg-icon/svg-icon');

class DeploymentCloud extends React.Component {
  constructor() {
    super();
    this.state = {
      clouds: [],
      cloudsLoading: true
    };
  }

  componentWillMount() {
    const listClouds = () => {
      // It is possible that the controller hasn't yet connected so
      // bounce until it's connected then fetch the clouds list.
      if (!this.props.controllerIsReady()) {
        setTimeout(listClouds, 500);
        return;
      }
      this.props.listClouds((error, clouds) => {
        if (error) {
          const message = 'unable to list clouds';
          this.props.addNotification({
            title: message,
            message: `${message}: ${error}`,
            level: 'error'
          });
          console.error(message, error);
          return;
        }
        let cloudList = [];
        if (clouds) {
          cloudList = Object.keys(clouds).map(name => {
            const cloud = clouds[name];
            cloud.name = name;
            return cloud;
          });
        }
        this.setState({
          clouds: cloudList,
          cloudsLoading: false
        });
        // If there is only one cloud then automatically select it.
        if (cloudList.length === 1) {
          this.props.setCloud(cloudList[0]);
        }
      });
    };
    listClouds();
  }

  /**
    Generate the list of clouds.

    @method _generateClouds
    @returns {Object} The cloud list.
  */
  _generateClouds() {
    if (this.state.cloudsLoading) {
      return (
        <div className="deployment-cloud__loading">
          <Spinner />
        </div>);
    }
    if (this.props.cloud) {
      return;
    }
    var clouds = [];
    this.state.clouds.forEach((cloud, i) => {
      var classes = classNames(
        'deployment-cloud__cloud',
        'four-col',
        {'last-col': i % 3 === 2});
      clouds.push(
        <li className={classes}
          key={cloud.name}
          onClick={this.props.setCloud.bind(null, cloud)}
          role="button"
          tabIndex="0">
          <span className="deployment-cloud__cloud-logo">
            {this._generateLogo(cloud)}
          </span>
        </li>);
    });
    return (
      <ul className="deployment-cloud__list">
        {clouds}
      </ul>);
  }

  /**
    Generate the logo for the selected cloud.

    @method _generateCloud
    @returns {Object} The cloud.
  */
  _generateCloud() {
    var cloud = this.props.cloud;
    if (!cloud) {
      return;
    }
    return (
      <div className="deployment-cloud__chosen">
        {this._generateLogo(cloud)}
      </div>);
  }

  /**
    Generate the logo for a cloud;

    @method _generateLogo
    @param {Object} cloud A cloud.
    @returns {Array} The logo.
  */
  _generateLogo(cloud) {
    const info = this.props.getCloudProviderDetails(cloud.cloudType);
    if (!info) {
      return cloud.name;
    }
    return info.showLogo ? (
      <SvgIcon
        height={info.svgHeight}
        name={info.id}
        width={info.svgWidth} />) : info.title;
  }

  render() {
    return (
      <div>
        {this._generateClouds()}
        {this._generateCloud()}
      </div>
    );
  }
};

DeploymentCloud.propTypes = {
  acl: PropTypes.object.isRequired,
  addNotification: PropTypes.func.isRequired,
  cloud: PropTypes.object,
  controllerIsReady: PropTypes.func.isRequired,
  getCloudProviderDetails: PropTypes.func.isRequired,
  listClouds: PropTypes.func.isRequired,
  setCloud: PropTypes.func.isRequired
};

module.exports = DeploymentCloud;
