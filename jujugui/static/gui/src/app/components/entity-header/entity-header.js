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

YUI.add('entity-header', function() {

  juju.components.EntityHeader = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      changeState: React.PropTypes.func.isRequired,
      deployService: React.PropTypes.func.isRequired,
      entityModel: React.PropTypes.object.isRequired,
      scrollPosition: React.PropTypes.number.isRequired
    },

    /**
      Generate the initial state of the component.

      @method getInitialState
      @returns {String} The intial state.
    */
    getInitialState: function() {
      return {headerHeight: 0};
    },

    componentDidMount: function() {
      this.setState({headerHeight: this.refs.headerWrapper.clientHeight});
    },

    /**
      Add a service for this charm to the canvas.

      @method _handleDeployClick
      @param {Object} e The click event
    */
    _handleDeployClick: function(e) {
      var entityModel = this.props.entityModel;
      var entity = entityModel.toEntity();
      if (entity.type === 'charm') {
        this.props.deployService(entityModel);
        this._closeEntityDetails();
      } else {
        var id = entity.id.replace('cs:', '');
        this.props.getBundleYAML(id, this._getBundleYAMLCallback);
      }
    },

    /**
      Close the entity details

      @method _closeEntityDetails
    */
    _closeEntityDetails: function() {
      this.props.changeState({
        sectionC: {
          component: null,
          metadata: null
        }
      });
    },

    /**
      Callback for getting the bundle YAML.

      @method _getBundleYAMLSuccess
      @param {String} error The error, if any. Null if no error.
      @param {String} yaml The yaml for the bundle
    */
    _getBundleYAMLCallback: function(error, yaml) {
      if (error) {
        console.error(error);
        this.props.addNotification({
          title: 'Bundle failed to deploy',
          message: 'The bundle ' + this.props.entityModel.get('name') +
            ' failed to deploy:' + error,
          level: 'error'
        });
        return;
      }
      this.props.importBundleYAML(yaml);
      this._closeEntityDetails();
    },

    /**
      Builds a URL that links to the standalone Juju store, for sharing
      purposes.

      @method _getStoreURL
      @param {Object} entity The entity being linked to
    */
    _getStoreURL: function(entity) {
      var url = ['https://jujucharms.com'];
      if (entity.id.indexOf('~') >= 0) {
        url.push('u');
        url.push(entity.owner);
      }
      url.push(entity.name);
      url.push(entity.series);
      url.push(entity.revision);
      return encodeURIComponent(url.join('/'));
    },

    /**
      Generate the styles for the header wrapper.

      @method _generateWrapperStyles
    */
    _generateWrapperStyles: function() {
      if (this.state.headerHeight > 0) {
        // Set the height of the wrapper so that it doesn't collapse when the
        // header becomes sticky.
        return {height: this.state.headerHeight + 'px'};
      }
      return {};
    },

    /**
      Generate the classes for the component.

      @method _generateClasses
    */
    _generateClasses: function() {
      return classNames(
        'entity-header',
        {
          'entity-header--sticky':
            this.props.scrollPosition > this.state.headerHeight
        }
      );
    },

    render: function() {
      var entity = this.props.entityModel.toEntity();
      var ownerUrl = 'https://launchpad.net/~' + entity.owner;
      var series = entity.series ?
        <li className="entity-header__series">{entity.series}</li> : null;
      var twitterUrl = [
        'https://twitter.com/intent/tweet?text=',
        entity.displayName,
        '%20charm&via=ubuntu_cloud&url=',
        this._getStoreURL(entity)
      ].join('');
      var googlePlusUrl = [
        'https://plus.google.com/share?url=',
        this._getStoreURL(entity)
      ].join('');

      return (
        <div className="row-hero"
          ref="headerWrapper"
          style={this._generateWrapperStyles()}>
          <header className={this._generateClasses()}>
            <div className="inner-wrapper">
              <div className="eight-col no-margin-bottom">
                <img src={entity.iconPath} alt={entity.displayName}
                     width="96" className="entity-header__icon"/>
                <h1
                  className="entity-header__title"
                  itemProp="name"
                  ref="entityHeaderTitle">
                  {entity.displayName}
                </h1>
                <ul className="bullets inline entity-header__properties">
                  <li className="entity-header__by">
                    By <a href={ownerUrl} target="_blank"
                          ref="entityHeaderBy">{entity.owner}</a>
                  </li>
                  {series}
                </ul>
                <ul className="entity-header__social-list">
                  <li>
                    <a id="item-twitter"
                      target="_blank"
                      href={twitterUrl}>
                      <juju.components.SvgIcon
                        name="icon-social-twitter"
                        size="35"/>
                    </a>
                  </li>
                  <li>
                    <a id="item-googleplus"
                       target="_blank"
                       href={googlePlusUrl}>
                      <juju.components.SvgIcon
                        name="icon-social-google"
                        size="35"/>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="four-col last-col no-margin-bottom">
                <juju.components.CopyToClipboard
                  value={'juju deploy ' + entity.id} />
                <juju.components.GenericButton
                  ref="deployButton"
                  action={this._handleDeployClick}
                  type="confirm"
                  title="Add to canvas" />
              </div>
            </div>
          </header>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: [
    'copy-to-clipboard',
    'generic-button'
  ]
});
