/* Copyright (C) 2017 Canonical Ltd. */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');
const ReactDOM = require('react-dom');

const HashLink = require('../../../hash-link/hash-link');

class EntityContentReadme extends React.Component {
  constructor() {
    super();
    this.readmeXhr = null;
    this.state = {
      readme: null
    };
  }

  componentDidMount() {
    this._getReadme();
  }

  componentDidUpdate(prevProps, prevState) {
    const hash = this.props.hash;
    if (hash && hash !== prevProps.hash) {
      this.props.scrollCharmbrowser(this._getContainer());
    }
  }

  componentWillUnmount() {
    if (this.readmeXhr) {
      this.readmeXhr.abort();
    }
    // Remove the readme link components.
    this._getContainer().querySelectorAll('.readme-link').forEach(
      link => {
        ReactDOM.unmountComponentAtNode(link);
      });
  }

  /**
    Get the container node for the component. There is a bug with using
    findDOMNode in the tests so use this method to stub it out.

    @return {Object} The comonent's container node.
  */
  _getContainer() {
    return ReactDOM.findDOMNode(this);
  }

  /**
    Get the content for the readme.

    @method _getReadme
    @return {Object} The readme content.
  */
  _getReadme() {
    const entityModel = this.props.entityModel;
    const readmeFile = this._getReadmeFile(entityModel);
    if (!readmeFile) {
      this._getReadmeCallback('No readme file.');
    } else {
      const id = entityModel.get('id');
      this.readmeXhr = this.props.getFile(
        id, readmeFile, this._getReadmeCallback.bind(this));
    }
  }

  /**
    Get the filename for the readme.

    @method _getReadmeFile
    @param {Object} entityModel The entity model.
    @return {Object} The readme filename.
  */
  _getReadmeFile(entityModel) {
    var files = entityModel.get('files');
    var match;
    for (var i = 0, l = files.length; i < l; i++) {
      var file = files[i];
      if (file.toLowerCase().slice(0, 6) === 'readme') {
        match = file;
        break;
      }
    }
    return match;
  }

  /**
    Update the readme with the retrieved markdown.

    @method _getReadmeCallback
    @param {String} error The error message from the charmstore, if any.
    @param {Object} data The returned data for the readme.
  */
  _getReadmeCallback(error, data) {
    if (error) {
      const message = 'unable to get readme';
      this.props.addNotification({
        title: message,
        message: `${message}: ${error}`,
        level: 'error'
      });
      console.error(message, error);
      this.setState({readme: 'No readme.'});
      return;
    }
    const readme = data;
    const renderMarkdown = this.props.renderMarkdown;
    const entity = this.props.entityModel.toEntity();
    let renderer = new renderMarkdown.Renderer();
    renderer.heading = (text, level) => {
      const escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
      if (level === 1 &&
        entity.displayName.toLowerCase() === text.toLowerCase()) {
        return '';
      }
      return `<h${level} id="${escapedText}">
          ${text}
          <span class="readme-link" data-id="${escapedText}">link</span>
        </h${level}>`;
    };
    this.setState(
      {readme: renderMarkdown(readme, {renderer: renderer})}, () => {
        if (this.props.hash) {
          this.props.scrollCharmbrowser(this._getContainer());
        }
        // Set up the components to link to the readme headings.
        this._getContainer().querySelectorAll('.readme-link').forEach(
          link => {
            const id = link.getAttribute('data-id');
            // The components have to be rendered to the elements due to the
            // headings having been created by the markdown lib.
            ReactDOM.render(
              <HashLink
                changeState={this.props.changeState}
                hash={id} />,
              link);
          });
      });
  }

  render() {
    return (
      <div className="entity-content__readme">
        <div
          className="entity-content__readme-content"
          dangerouslySetInnerHTML={{__html: this.state.readme}}
          ref="content" />
      </div>
    );
  }
};

EntityContentReadme.propTypes = {
  addNotification: PropTypes.func.isRequired,
  changeState: PropTypes.func.isRequired,
  entityModel: PropTypes.object.isRequired,
  getFile: PropTypes.func.isRequired,
  hash: PropTypes.string,
  renderMarkdown: PropTypes.func.isRequired,
  scrollCharmbrowser: PropTypes.func.isRequired
};

module.exports = EntityContentReadme;
