/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

class EntityFiles extends React.Component {

  constructor() {
    super();
    this.state = {};
  }
  /**
    Expand a directory when clicked.

    @method _onDirectoryClick
    @param {Object} e the event object.
  */
  _onDirectoryClick(e) {
    e.stopPropagation();
    const target = e.currentTarget;
    const controls = target.getAttribute('aria-controls');
    const isExpanded = target.getAttribute('aria-expanded') === 'true';
    this.setState({
      [`${controls}-isExpanded`]: !isExpanded
    });
  }

  /**
    Recursively build a tree structure representing the entity's file.

    @method _buildFiletree
    @param {Array} files the list of file paths.
    @returns {Object} filetree the corresponding tree structure.
  */
  _buildFiletree(files) {
    /**
      Recursive helper adds a single path to an existing file tree.

      @method _buildFiletree
      @param {Object} node current node in the tree structure.
      @param {Array} segments remaining file paths to parse.
    */
    function extendTree(node, segments) {
      var segment = segments.shift();
      // Skip the root node, signified by an empty string.
      if (segment === '') {
        segment = segments.shift();
      }
      if (segments.length) {
        if (!node[segment]) {
          node[segment] = {};
        };
        extendTree(node[segment], segments);
      } else {
        node[segment] = null;
      }
    }

    var filetree = {};
    files.forEach(function(file) {
      extendTree(filetree, file.split('/'));
    });
    return filetree;
  }

  /**
    If able, generates a link to the entity's source code.

    @method _generateCodeLink
    @param {Object} codeSource metadata about the entity's source code.
    @return {Object} The markup for the link to the code.
  */
  _generateCodeLink(codeSource) {
    codeSource = codeSource || {};
    var codeUrl = codeSource.location;
    var codeLink;
    if (codeUrl) {
      codeUrl = codeUrl.replace('lp:', 'https://code.launchpad.net/');
      codeLink = (
        <li className="section__list-item entity-files__code-link">
          <a className="button--inline-neutral entity-files__link"
            href={codeUrl}
            ref="codeLink"
            target="_blank">
            View code
          </a>
        </li>
      );
    } else {
      codeLink = '';
    }
    return codeLink;
  }

  /**
    Create a list of linked files.

    @method _generateFileItems
    @param {Array} files An array of file names (Strings).
    @param {String} url The base URL for where the files are stored.
    @return {Array} The markup for the linked files.
  */
  _generateFileItems(files, url) {
    const filetree = this._buildFiletree(files);

    /**
      Recursively create a nested list.

      @method buildList
      @param {String} path The current path.
      @param {Array} children All child files and directories located under
      the current path.
      @return {Array} The nested markup for the list of files.
    */
    function buildList(path, children) {
      const fileName = path.split('/').pop();
      if (children === null) {
        const fileLink = `${url}/${path}`;
        return (
          <li className="p-list-tree__item" key={path}>
            <a className="link"
              href={fileLink}
              target="_blank"
              title={fileName}>
              {fileName}
            </a>
          </li>
        );
      } else {
        let childItems = [];
        // Note that this logic covers everything *but* the root node; see
        // the corresponding comment below.
        Object.keys(children).forEach(child => {
          childItems.push(buildList.call(this, `${path}/${child}`,
            children[child]));
        });
        const isExpanded = this.state[`/${fileName}-isExpanded`] || false;
        return (
          <li className="p-list-tree__item p-list-tree__item--group"
            key={path}
            tabIndex="0"
            title={`/${fileName}`}>
            <button aria-controls={`/${fileName}`}
              aria-expanded={`${isExpanded}`}
              className="p-list-tree__toggle"
              id={`/${fileName}-toggle`}
              onClick={this._onDirectoryClick.bind(this)}
              role="tab">
              {`/${fileName}`}
            </button>
            <ul aria-hidden={`${!isExpanded}`}
              aria-labelledby={`/${fileName}-toggle`}
              className="p-list-tree"
              id={`/${fileName}`}
              role="tabpanel">
              {childItems}
            </ul>
          </li>
        );
      }
    }

    // Need to handle the root node separate from the recursive logic.
    // The loop that covers everything *but* the root node is above.
    let markup = [];
    Object.keys(filetree).forEach(file => {
      markup.push(buildList.call(this, file, filetree[file]));
    });
    return markup;
  }

  render() {
    const entityModel = this.props.entityModel;
    const files = entityModel.get('files');
    const url = window.jujulib.URL.fromLegacyString(entityModel.get('id'));
    const archiveUrl = `${this.props.apiUrl}/${url.legacyPath()}/archive`;
    return (
      <div className="entity-files section" id="files">
        <h3 className="section__title">
          {this.props.pluralize('File', files.length)}
        </h3>
        <ul aria-multiselectable="true"
          className="p-list-tree"
          ref="files"
          role="tablist">
          {this._generateFileItems(files, archiveUrl)}
        </ul>
        <ul className="section__list">
          {this._generateCodeLink(entityModel.get('code_source'))}
          <li className="section__list-item">
            <a className="button--inline-neutral entity-files__link"
              href={archiveUrl}
              target="_blank">
              Download .zip
            </a>
          </li>
        </ul>
      </div>
    );
  }
};

EntityFiles.propTypes = {
  apiUrl: PropTypes.string.isRequired,
  entityModel: PropTypes.object.isRequired,
  pluralize: PropTypes.func.isRequired
};

module.exports = EntityFiles;
