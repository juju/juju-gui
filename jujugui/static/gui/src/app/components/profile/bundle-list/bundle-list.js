/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');
const {urls} = require('jaaslib');

const BasicTable = require('../../shared/basic-table/basic-table');
const IconList = require('../../icon-list/icon-list');
const ProfileCharmstoreLogin = require('../charmstore-login/charmstore-login');
const Spinner = require('../../spinner/spinner');
const EntityContentDiagram = require('../../entity-details/content/diagram/diagram');

/**
  Charm list React component used to display a list of the users bundles in
  their profile.
*/
class ProfileBundleList extends React.Component {
  constructor() {
    super();
    this.xhrs = [];
    this.state = {
      data: [],
      loading: false
    };
  }

  componentWillMount() {
    const user = this.props.user;
    if (user) {
      this._fetchBundles(user);
    }
  }

  componentWillUnmount() {
    this.xhrs.forEach(xhr => {
      xhr && xhr.abort && xhr.abort();
    });
  }

  componentWillReceiveProps(nextProps) {
    const props = this.props;
    if (props.user !== nextProps.user) {
      this._fetchBundles(nextProps.user);
    }
  }

  /**
    Fetch the users bundles from the charmstore.
    @param {String} user The external user name in the format "user@external".
  */
  _fetchBundles(user) {
    const props = this.props;
    this.setState({loading: true}, () => {
      this.xhrs.push(
        props.charmstore.list(
          user,
          (error, data) => {
            if (error) {
              const message = 'Unable to retrieve bundles';
              console.error(message, error);
              this.props.addNotification({
                title: message,
                message: `${message}: ${error}`,
                level: 'error'
              });
              return;
            }
            this.setState({
              data,
              loading: false
            });
          },
          'bundle'
        )
      );
    });
  }

  /**
    Prevents the default actions on the link and navigates to the charmstore
    for the supplied id via changeState.
    @param {String} path The GUI bundle path to navigate to.
    @param {Object} e The click event.
  */
  _navigateToBundle(path, e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.changeState({profile: null, store: path, hash: null});
  }

  /**
    Generate the main title.
    @returns {Object} JSX for the title.
  */
  _generateTitle() {
    return (
      <h4 className="profile__title">
        Bundles
        <span className="profile__title-count">({(this.state.data || []).length})</span>
      </h4>
    );
  }

  /**
    Sort by the key attribute.
    @param {Object} a The first value.
    @param {Object} b The second value.
    @returns {Array} The sorted array.
  */
  _byName(a, b) {
    if (a.extraData < b.extraData) {
      return -1;
    }
    if (a.extraData > b.extraData) {
      return 1;
    }
    return 0;
  }

  render() {
    let content;
    const props = this.props;
    if (this.state.loading) {
      content = <Spinner />;
    } else if (props.isActiveUsersProfile && !(this.state.data || []).length) {
      if (!props.user) {
        content = (
          <ProfileCharmstoreLogin
            addNotification={props.addNotification}
            bakery={props.bakery}
            changeState={props.changeState}
            charmstore={shapeup.fromShape(
              props.charmstore,
              ProfileCharmstoreLogin.propTypes.charmstore
            )}
            storeUser={props.storeUser}
            type="bundles"
          />
        );
      } else {
        content = (
          <React.Fragment>
            {this._generateTitle()}
            <p className="profile-bundle-list__onboarding">
              Learn about&nbsp;
              <a
                href="https://jujucharms.com/docs/stable/charms-bundles#creating-a-bundle"
                target="_blank"
              >
                writing your own bundle
              </a>
              .
            </p>
          </React.Fragment>
        );
      }
    } else {
      const rows = (this.state.data || []).map(bundle => {
        const url = urls.URL.fromLegacyString(bundle.id);
        const path = url.path();
        const version = `#${url.revision}`;
        const charmstore = props.charmstore;
        const charmstoreURL = props.charmstore.url;
        const getDiagramURL = charmstore.getDiagramURL.bind(charmstore);
        const applications = Object.keys(bundle.applications).map(name => {
          const app = bundle.applications[name];
          return {
            displayName: name,
            iconPath: `${charmstoreURL}/${app.charm.replace('cs:', '')}/icon.svg`,
            id: app.charm
          };
        });
        const modelName = props.getModelName();
        const title = `Add to ${modelName || 'model'}`;
        return {
          columns: [
            {
              content: (
                <a
                  href={`${props.baseURL}${path}`}
                  onClick={this._navigateToBundle.bind(this, path)}
                >
                  {bundle.name}
                </a>
              )
            },
            {
              content: (
                <IconList
                  applications={applications}
                  changeState={props.changeState}
                  generatePath={props.generatePath}
                />
              )
            },
            {
              content: bundle.machineCount,
              classes: ['u-align-text--right']
            },
            {
              content: bundle.unitCount,
              classes: ['u-align-text--right']
            },
            {
              content: version,
              classes: ['u-align-text--right']
            }
          ],
          expandedContent: (
            <React.Fragment>
              <td>
                <span className="profile-bundle-list__meta">
                  <a
                    href={`${props.baseURL}${path}`}
                    onClick={this._navigateToBundle.bind(this, path)}
                  >
                    {bundle.name}
                  </a>
                  {bundle.description ? (
                    <span className="entity__desc u-hide--small">{bundle.description}</span>
                  ) : null}
                </span>
                {getDiagramURL ? (
                  <EntityContentDiagram diagramUrl={getDiagramURL(bundle.id)} />
                ) : null}
              </td>
              <td>
                {bundle.bugUrl ? (
                  <a href={bundle.bugUrl} onClick={e => e.stopPropagation} target="_blank">
                    Bugs
                  </a>
                ) : null}
                {bundle.homepage ? (
                  <a href={bundle.homepage} onClick={e => e.stopPropagation} target="_blank">
                    Homepage
                  </a>
                ) : null}
                {bundle.bugUrl || bundle.homepage ? <hr /> : null}
                <span className="entity__permissions">
                  Writeable:
                  {props.generatePermissions(bundle.perm.write, props)}
                </span>
                <span className="entity__permissions">
                  Readable:
                  {props.generatePermissions(bundle.perm.read, props)}
                </span>
              </td>
              <td className="u-align-text--right">{bundle.machineCount}</td>
              <td className="u-align-text--right">{bundle.unitCount}</td>
              <td className="entity__release u-align-text--right">
                <span>{version}</span>
                <button
                  className="p-button--positive"
                  disabled={this.props.acl.isReadOnly()}
                  onClick={e => props.handleDeploy(e, bundle.id, this.props)}
                  tooltip={`Add this ${bundle.entityType} to
                      ${this.modelName ? 'your current' : 'a new'} model`}
                >
                  {title}
                </button>
              </td>
            </React.Fragment>
          ),
          extraData: bundle.name,
          key: bundle.id
        };
      });
      content = (
        <React.Fragment>
          {this._generateTitle()}
          <BasicTable
            headers={[
              {
                content: 'Name'
              },
              {
                content: ''
              },
              {
                content: 'Machines',
                classes: ['u-align-text--right']
              },
              {
                content: 'Units',
                classes: ['u-align-text--right']
              },
              {
                content: 'Release',
                classes: ['u-align-text--right']
              }
            ]}
            rows={rows}
            sort={this._byName.bind(this)}
          />
        </React.Fragment>
      );
    }
    return <div className="profile-bundle-list">{content}</div>;
  }
}

ProfileBundleList.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  addNotification: PropTypes.func.isRequired,
  addToModel: PropTypes.func.isRequired,
  bakery: PropTypes.object.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: shapeup.shape({
    getDiagramURL: PropTypes.func.isRequired,
    getMacaroon: PropTypes.func.isRequired,
    list: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  generatePath: PropTypes.func.isRequired,
  generatePermissions: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  handleDeploy: PropTypes.func.isRequired,
  isActiveUsersProfile: PropTypes.bool.isRequired,
  storeUser: PropTypes.func.isRequired,
  user: PropTypes.string
};

module.exports = ProfileBundleList;
