/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');
const {urls} = require('jaaslib');

const {Button} = require('@canonical/juju-react-components');
const IconList = require('../../icon-list/icon-list');
const SeriesList = require('../../series-list/series-list');
const {SvgIcon} = require('@canonical/juju-react-components');

class SearchResultsItem extends React.Component {
  constructor(props) {
    super(props);
    this.analytics = this.props.analytics.addCategory('Search Item');
  }

  /**
    Generate the element for the special flag.

    @method _generateSpecialFlag
    @returns {String} The generated elements.
  */
  _generateSpecialFlag() {
    if (!this.props.item.special) {
      return;
    }
    return (
      <span className="special-flag"></span>
    );
  }

  /**
    Generate the elements for the tag list.

    @method _generateTagList
    @returns {String} The generated elements.
  */
  _generateTagList() {
    var components = [];
    var tags = this.props.item.tags || [];
    if (tags.length === 0) {
      return <span>{' '}</span>;
    }
    tags.forEach(function(tag, i) {
      components.push(
        <li
          className="tag-list--item"
          key={tag + i}>
          <a
            className="list-block__list--item-link"
            href={this.props.generatePath({search: {tags: tag}})}
            onClick={this._handleTagClick.bind(this, tag)}>
            {tag}
          </a>
        </li>
      );
    }, this);
    return components;
  }

  /**
    Generate the base classes from the props.

    @method _generateClasses
    @param {Boolean} selected Whether the filter is selected.
    @returns {String} The collection of class names.
  */
  _generateClasses(selected) {
    return classNames(
      {selected: selected}
    );
  }

  /**
    Generate the store state for the item.

    @param {String} id The entity id.
  */
  _generateStoreState(id) {
    // TODO frankban: it should be clear whether this id is legacy or not.
    let url;
    try {
      url = urls.URL.fromLegacyString(id);
    } catch(_) {
      url = urls.URL.fromString(id);
    }
    return {
      profile: null,
      search: null,
      store: url.path()
    };
  }

  /**
    Generate the store URL for an entity.

    @param {String} id The entity id.
  */
  _generateStoreURL(id) {
    return this.props.generatePath(this._generateStoreState(id));
  }

  /**
    Show the entity details when clicked.

    @method _handleItemClick
    @param {String} id The entity id.
    @param {Object} evt The click event.
  */
  _handleItemClick(id, evt) {
    evt.preventDefault();
    this.props.changeState(this._generateStoreState(id));
    this.analytics.addCategory('Entity').sendEvent(
      this.props.analytics.CLICK, {label: `entity: ${id}`});
  }

  /**
    Show search results for the given tag.

    @method _handleTagClick
    @param {String} tag The tag name.
    @param {Object} evt The click event.
  */
  _handleTagClick(tag, evt) {
    evt.preventDefault();
    this.props.changeState({
      search: {
        owner: null,
        provides: null,
        requires: null,
        series: null,
        tags: tag,
        text: '',
        type: null
      }
    });
    this.analytics.addCategory('Tag').sendEvent(
      this.props.analytics.CLICK, {label: `tag: ${tag}`});
  }

  /**
    Navigate to the profile page of the given owner.

    @method _handleOwnerClick
    @param {String} owner The owner's name.
    @param {Object} evt The click event.
  */
  _handleOwnerClick(owner, evt) {
    evt.preventDefault();
    this.props.changeState({search: null, profile: owner});
    this.analytics.addCategory('Owner').sendEvent(
      this.props.analytics.CLICK, {label: `owner: ${owner}`});
  }

  /**
    Deploy the entity.

    @param id {String} The id of the entity to deploy.
  */
  _handleDeploy(id) {
    this.props.addToModel(id);
    // Close the search results so that the deployed entity is visible on the
    // canvas.
    this.props.changeState({
      search: null,
      profile: null
    });
    this.analytics.addCategory('Add to canvas').sendEvent(
      this.props.analytics.CLICK, {label: `entity: ${id}`});
  }

  /**
    Generate the series list item class based on entity type

    @method _generateSeriesClass
    @returns {String} The generated class name.
  */
  _generateSeriesClass() {
    var item = this.props.item.type;
    return classNames(
      'series__column',
      {
        'two-col': item === 'bundle'
      },
      {
        'four-col': item === 'charm'
      }
    );
  }

  /**
    Generate the charms column class based on entity type

    @method _generateCharmsClass
    @returns {String} The generated class name.
  */
  _generateCharmsClass() {
    var item = this.props.item.type;
    return classNames(
      'charm-logos__column list-block__column',
      {
        'three-col': item === 'bundle'
      },
      {
        'one-col': item === 'charm'
      }
    );
  }

  render() {
    var item = this.props.item;
    return (
      <li className={'list-block__list--item ' + item.type}>
        <a
          className="list-block__list--item-main-link"
          href={this._generateStoreURL(item.id)}
          onClick={this._handleItemClick.bind(this, item.id)}></a>
        <div className="four-col charm-name__column">
          <h3 className="list-block__list--item-title">
            {item.displayName}
            {this._generateSpecialFlag()}
          </h3>
          <ul className="tag-list">
            {this._generateTagList()}
          </ul>
        </div>
        <div className={this._generateSeriesClass()}>
          <SeriesList items={this.props.item.series.map(series => series.name)} />
        </div>
        <div className={this._generateCharmsClass()}>
          <IconList
            applications={this.props.item.applications || [this.props.item]}
            changeState={this.props.changeState}
            generatePath={this.props.generatePath} />
        </div>
        <div className="two-col owner__column list-block__column">
          <p className="cell">
            {'By '}
            <a
              className="list-block__list--item-link"
              href={
                this.props.generatePath({search: null, profile: item.owner})}
              onClick={this._handleOwnerClick.bind(this, item.owner)}
              title={`See other charms and bundles by ${item.owner}`}>
              {item.owner}
            </a>
          </p>
        </div>
        <div className="one-col last-col list-block__list--item-deploy v1">
          <Button
            action={this._handleDeploy.bind(this, item.id)}
            disabled={this.props.acl.isReadOnly()}
            extraClasses="is-inline list-block__list--item-deploy-link"
            modifier="neutral">
            <SvgIcon
              name="add-icon"
              size="16" />
          </Button>
        </div>
      </li>
    );
  }
};

SearchResultsItem.propTypes = {
  acl: PropTypes.object.isRequired,
  addToModel: PropTypes.func.isRequired,
  analytics: PropTypes.object.isRequired,
  changeState: PropTypes.func.isRequired,
  generatePath: PropTypes.func.isRequired,
  item: PropTypes.object.isRequired
};

module.exports = SearchResultsItem;
