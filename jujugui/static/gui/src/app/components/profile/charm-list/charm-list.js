/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');
const {urls} = require('jaaslib');

const BasicTable = require('../../shared/basic-table/basic-table');
const ProfileCharmstoreLogin = require('../charmstore-login/charmstore-login');
const Spinner = require('../../spinner/spinner');

/**
  Charm list React component used to display a list of the users charms in
  their profile.
*/
class ProfileCharmList extends React.Component {
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
      this._fetchCharms(user);
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
      this._fetchCharms(nextProps.user);
    }
  }

  /**
    Fetch the users charms from the charmstore.
    @param {String} user The external user name in the format "user@external".
  */
  _fetchCharms(user) {
    const props = this.props;
    this.setState({loading: true}, () => {
      this.xhrs.push(
        props.charmstore.list(
          user,
          (error, data) => {
            if (error) {
              const message = 'Unable to retrieve charms';
              console.error(message, error);
              this.props.addNotification({
                title: message,
                message: `${message}: ${error}`,
                level: 'error'
              });
              return;
            }
            this.setState({loading: false, data});
          },
          'charm'));
    });
  }

  /**
    Prevents the default actions on the link and navigates to the charmstore
    for the supplied id via changeState.
    @param {String} path The GUI charm path to navigate to.
    @param {Object} e The click event.
  */
  _navigateToCharm(path, e) {
    e.preventDefault();
    e.stopPropagation();
    this.props.changeState({profile: null, store: path, hash: null});
  }

  /**
    Display a tag in the store.
    @param tag {String} The name of the tag.
    @param evt {Object} The click event.
  */
  _handleTagClick(tag, evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.changeState({
      profile: null,
      search: {
        owner: null,
        provides: null,
        requires: null,
        series: null,
        tags: tag,
        text: '',
        type: null
      },
      hash: null
    });
  }

  /**
    Generate a list of tags for a charm
    @param tags {Array} A list of tags.
    @returns {Object} JSX for the tags.
  */
  _generateTags(tags) {
    if (!tags || !tags.length) {
      return null;
    }
    const noOfTags = tags.length;
    const tagList = tags.map((tag, i) => (
      <li
        className="p-inline-list__item"
        key={tag + i}
        onClick={this._handleTagClick.bind(this, tag)}
        role="button"
        tabIndex="0">
        {tag}
        {((i + 1) === noOfTags ? null : ',')}
      </li>
    ));
    return <ul className="p-inline-list u-no-margin-bottom">{tagList}</ul>;
  }

  /**
    Generate the main title.
    @returns {Object} JSX for the title.
  */
  _generateTitle() {
    return (
      <h2 className="profile__title">
        {this.props.isActiveUsersProfile ? 'My' : 'Their'} charms
        <span className="profile__title-count">({(this.state.data || []).length})</span>
      </h2>
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
    if (this.state.loading) {
      content = <Spinner />;
    } else if (this.props.isActiveUsersProfile && !(this.state.data || []).length) {
      if (!this.props.user) {
        content = (
          <ProfileCharmstoreLogin
            addNotification={this.props.addNotification}
            bakery={this.props.bakery}
            changeState={this.props.changeState}
            charmstore={shapeup.fromShape(
              this.props.charmstore,
              ProfileCharmstoreLogin.propTypes.charmstore
            )}
            storeUser={this.props.storeUser}
            type="charms" />
        );
      } else {
        content = (
          <React.Fragment>
            {this._generateTitle()}
            <p className="profile-charm-list__onboarding">
              Learn about&nbsp;
              <a
                href="https://jujucharms.com/docs/stable/developer-getting-started"
                target="_blank">
                writing your own charm
              </a>
              .
            </p>
          </React.Fragment>
        );
      }
    } else {
      const rows = this.state.data.map(charm => {
        const id = charm.id;
        const src = `${this.props.charmstore.url}/${id.replace('cs:', '')}/icon.svg`;
        const url = urls.URL.fromLegacyString(id);
        const path = url.path();
        const version = `#${url.revision}`;
        const series = charm.series.join(', ');
        const icon = (
          <img
            key="img"
            src={src}
            title={charm.name} />
        );
        const modelName = this.props.getModelName();
        const title = `Add to ${modelName || 'model'}`;
        return {
          columns: [
            {
              content: (
                <React.Fragment>
                  <span className="profile-charm-list__name">
                    <span className="profile-charm-list__icon">
                      {icon}
                    </span>
                    <span className="profile-charm-list__desc">
                      <a
                        href={`${this.props.baseURL}${path}`}
                        key="link"
                        onClick={this._navigateToCharm.bind(this, path)}>
                        {charm.name}
                      </a>
                      {this._generateTags(charm.tags)}
                    </span>
                  </span>
                </React.Fragment>
              )
            }, {
              content: series
            }, {
              content: version
            }
          ],
          expandedContent: (
            <React.Fragment>
              <td className="profile-charm-list__name">
                <span className="profile-charm-list__icon">
                  {icon}
                </span>
                <span className="profile-charm-list__meta">
                  <a
                    href={`${this.props.baseURL}${path}`}
                    key="link"
                    onClick={this._navigateToCharm.bind(this, path)}>
                    {charm.name}
                  </a>
                  <span className="entity__desc">
                    {charm.description}
                  </span>
                </span>
              </td>
              <td>
                <span className="profile-charm-list__series">
                  {series}
                </span>
                <span className="entity__permissions">
                  Writeable:
                  {this.props.generatePermissions(charm.perm.write, this.props)}
                </span>
                <span className="entity__permissions">
                  Readable:
                  {this.props.generatePermissions(charm.perm.read, this.props)}
                </span>
              </td>
              <td className="profile-charm-list__release">
                <span>
                  {version}
                </span>
                <button
                  // onClick={this.props.handleDeploy(charm.id, this.props)}
                  className="p-button--positive"
                  disabled={this.props.acl.isReadOnly()}
                  tooltip={
                    `Add this ${charm.entityType} to ${this.modelName ? 'your current' : 'a new'} model`}>
                  {title}
                </button>
              </td>
            </React.Fragment>
          ),
          key: charm.id
        };
      });
      content = (
        <React.Fragment>
          {this._generateTitle()}
          <BasicTable
            headers={[
              {
                content: 'Name'
              }, {
                content: 'Series'
              }, {
                content: 'Release'
              }
            ]}
            rows={rows}
            sort={this._byName.bind(this)} />
        </React.Fragment>
      );
    }
    return (
      <div className="profile-charm-list">
        {content}
      </div>);
  }
}

ProfileCharmList.propTypes = {
  acl: shapeup.shape({
    isReadOnly: PropTypes.func.isRequired
  }).frozen.isRequired,
  addNotification: PropTypes.func.isRequired,
  addToModel: PropTypes.func.isRequired,
  bakery: PropTypes.object.isRequired,
  baseURL: PropTypes.string.isRequired,
  changeState: PropTypes.func.isRequired,
  charmstore: shapeup.shape({
    getMacaroon: PropTypes.func.isRequired,
    list: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired
  }).isRequired,
  generatePath: PropTypes.func.isRequired,
  generatePermissions: PropTypes.func.isRequired,
  getModelName: PropTypes.func.isRequired,
  isActiveUsersProfile: PropTypes.bool.isRequired,
  storeUser: PropTypes.func.isRequired,
  user: PropTypes.string
};

module.exports = ProfileCharmList;
