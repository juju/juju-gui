/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');


const BasicTable = require('../../basic-table/basic-table');
const ProfileCharmstoreLogin = require('../charmstore-login/charmstore-login');
const ProfileExpandedContent = require('../expanded-content/expanded-content');
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
      hash: null});
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
    const tagList = tags.map((tag, i) => (
      <li className="link profile-charm-list__tag"
        key={tag + i}
        onClick={this._handleTagClick.bind(this, tag)}
        role="button"
        tabIndex="0">
        {tag}
      </li>));
    return (
      <ul className="profile-charm-list__tags">
        {tagList}
      </ul>);
  }

  /**
    Generate the main title.
    @returns {Object} JSX for the title.
  */
  _generateTitle() {
    return (
      <h2 className="profile__title">
        {this.props.isActiveUsersProfile ? 'My' : 'Their'} charms
        <span className="profile__title-count">
          ({(this.state.data || []).length})
        </span>
      </h2>);
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
      content = (<Spinner />);
    } else if (this.props.isActiveUsersProfile && !(this.state.data || []).length) {
      if (!this.props.user) {
        content = (
          <ProfileCharmstoreLogin
            addNotification={this.props.addNotification}
            bakery={this.props.bakery}
            changeState={this.props.changeState}
            charmstore={shapeup.fromShape(this.props.charmstore,
              ProfileCharmstoreLogin.propTypes.charmstore)}
            storeUser={this.props.storeUser}
            type="charms" />);
      } else {
        content = (
          <div>
            {this._generateTitle()}
            <p>
              Learn about&nbsp;
              <a href="https://jujucharms.com/docs/stable/developer-getting-started"
                target="_blank">
                writing your own charm
              </a>.
            </p>
          </div>);
      }
    } else {
      const rows = this.state.data.map(charm => {
        const id = charm.id;
        const src = `${this.props.charmstore.url}/${id.replace('cs:', '')}/icon.svg`;
        const url = window.jujulib.URL.fromLegacyString(id);
        const path = url.path();
        const version = `#${url.revision}`;
        const series = charm.series.join(', ');
        const icon = (
          <img className="profile-charm-list__icon"
            key="img"
            src={src}
            title={charm.name} />);
        return ({
          columns: [{
            content: (
              <div>
                <div className="profile-charm-list__item">
                  <div>
                    {icon}
                  </div>
                  <div>
                    <a href={`${this.props.baseURL}${path}`}
                      key="link"
                      onClick={this._navigateToCharm.bind(this, path)}>
                      {charm.name}
                    </a>
                    {this._generateTags(charm.tags)}
                  </div>
                </div>
              </div>),
            columnSize: 6
          }, {
            content: series,
            columnSize: 3
          }, {
            content: version,
            columnSize: 3
          }],
          expandedContent: (
            <ProfileExpandedContent
              acl={this.props.acl}
              addToModel={this.props.addToModel}
              changeState={this.props.changeState}
              entity={charm}
              generatePath={this.props.generatePath}
              getModelName={this.props.getModelName}
              topRow={(
                <div>
                  <div className="six-col profile-expanded-content__top-row">
                    {icon}
                    <a href={`${this.props.baseURL}${path}`}
                      key="link"
                      onClick={this._navigateToCharm.bind(this, path)}>
                      {charm.name}
                    </a>
                  </div>
                  <div className="three-col profile-expanded-content__top-row">
                    {series}
                  </div>
                  <div className="three-col last-col profile-expanded-content__top-row">
                    {version}
                  </div>
                </div>)} />),
          extraData: charm.name,
          key: charm.id
        });
      });
      content = (
        <div>
          {this._generateTitle()}
          <BasicTable
            headerClasses={['profile__entity-table-header-row']}
            headerColumnClasses={['profile__entity-table-header-column']}
            headers={[{
              content: 'Name',
              columnSize: 6
            }, {
              content: 'Series',
              columnSize: 3
            }, {
              content: 'Release',
              columnSize: 3
            }]}
            rowClasses={['profile__entity-table-row']}
            rowColumnClasses={['profile__entity-table-column']}
            rows={rows}
            sort={this._byName.bind(this)} />
        </div>);
    }
    return (
      <div className="profile-charm-list">
        {content}
      </div>);
  }
};

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
  getModelName: PropTypes.func.isRequired,
  isActiveUsersProfile: PropTypes.bool.isRequired,
  storeUser: PropTypes.func.isRequired,
  user: PropTypes.string
};

module.exports = ProfileCharmList;
