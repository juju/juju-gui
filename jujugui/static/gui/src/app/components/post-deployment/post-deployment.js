'use strict';

const marked = require('marked');
const PropTypes = require('prop-types');
const React = require('react');
const shapeup = require('shapeup');
const { urls } = require('jaaslib');

const GenericButton = require('../generic-button/generic-button');
const Panel = require('../panel/panel');
const SvgIcon = require('../svg-icon/svg-icon');

/**
  Displays information for usage and quickstart.
  Shown when a charm or bundle is added to the canvas, and on deploy.
*/
class PostDeployment extends React.Component {
  constructor(props) {
    super(props);
    this.templateTags = {
      details_link: {
        onClick: this._handleViewDetails.bind(this),
        content: '<span role="button" ' +
          'class="link" ' +
          'data-templatetag="details_link">View details</span>'
      },
      requires_cli_link: {
        content: '<a ' +
          'href="https://jujucharms.com/docs/stable/reference-install" ' +
          'target="_blank">Juju CLI client</a>'
      }
    };

    this.state = {
      content: null,
      metadata: {},
      script: null
    };
  }

  componentWillMount() {
    const props = this.props;
    const getFile = props.charmstore.getFile;
    props.entityURLs.forEach(entityURL => {
      const url = urls.URL.fromAnyString(entityURL).toLegacyString();
      getFile(url, 'getstarted.md', this._handleFileResponse.bind(this, 'content'));
      getFile(url, 'post-deployment.sh', this._handleFileResponse.bind(this, 'script'));
    });
  }

  /**
    Handles the response from the various getFile requests by processing and
    storing in the necessary state.

    @param {String} type The type of the file request. This is also the key used
      when storing the value in the component state.
    @param {Object} error The error object from the file request
    @param {String} fileContents the contents of the file from the request.
   */
  _handleFileResponse(type, error, fileContents) {
    if (error) {
      console.log(error);
      return;
    }
    // Rather then parsing the JSON to read the error we check if the returned
    // body starts with a '{'. If it does, it's not a markdown file so ignore.
    if (fileContents.substring(0, 1) === '{') {
      return;
    }
    if (type === 'content') {
      fileContents = this._processGetStarted(fileContents);
    }
    this.setState({[type]: fileContents});
  }

  /**
    Processes the get started markdown file contents into html and adding links
    where tags were added
    @param {String} fileContents The markdown content from the files.
    @returns {String} The rendered markdown content.
   */
  _processGetStarted(fileContents) {
    const frontmatterAndMarkdown = this.extractFrontmatter(fileContents);
    this.setState({
      metadata: frontmatterAndMarkdown.metadata
    });
    let renderer = new marked.Renderer();
    renderer.link = (href, title, text) =>
      `<a href="${href}" title="${title}" target="_blank">${text}</a>`;
    const markdown = marked(
      this.replaceTemplateTags(frontmatterAndMarkdown.markdown),
      {renderer: renderer});
    return markdown;
  }

  /**
    Render a button for executing the post-deployment script if one exists.

    @return {Object} The button if required, otherwise nothing.
  */
  _renderPostDeploymentScriptButton() {
    if (this.state.script) {
      return (<div>
        <GenericButton
          action={this._executePostDeploymentScript.bind(this)}>
            Execute post-deployment script
        </GenericButton>
      </div>);
    }
  }

  /**
    Execute the post-deployment script by opening the terminal with the script
    as a payload.
  */
  _executePostDeploymentScript() {
    this.props.changeState({terminal: this.state.script.split('\n')});
  }

  /**
    Parse header information from markdown files.
    If the markdown passed in starts with:
    ---
    metadata: value
    ---
    an object like:
    {
      metadata: value
    }
    will be assigned to the state.

    @param {String} markdown The raw markdown.
    @return {Object} {'metadata': {Object}, 'markdown': {String}} Parsed
    metadata and modified markdown.
  */
  extractFrontmatter(markdown) {
    let parsedMetadata = {};
    let lineByLine;
    markdown = markdown.trim();
    // If the first instance of a hr is at position 0 and
    // there is another hr expect metadata.
    if (markdown.indexOf('---') === 0 && markdown.indexOf('---', 1) !== -1) {
      lineByLine = markdown.split('\n');
      let metadata = [];
      lineByLine.shift();
      while (lineByLine.length > 0 && lineByLine[0] !== '---') {
        metadata.push(lineByLine.shift());
      }
      lineByLine.shift();

      metadata.forEach(option => {
        if (option.indexOf(':') !== -1) {
          const splitOption = option.split(':');
          parsedMetadata[splitOption[0].trim()] = splitOption[1].trim();
        } else {
          console.error(`${option} does not conform to the metadata format of
            key: value`);
        }
      });
    }

    return {
      metadata: parsedMetadata,
      markdown: lineByLine ? lineByLine.join('\n') : markdown
    };
  }

  /**
    Replace templateTags within the markdown with a pre-defined list.

    @param {String} markdown The raw markdown.
    @return {String} The replaced string.
  */
  replaceTemplateTags(markdown) {
    let replaced = markdown;

    Object.keys(this.templateTags).forEach(templateTag => {
      replaced = replaced
        .split(`{${templateTag}}`)
        .join(this.templateTags[templateTag].content);
    });

    return replaced;
  }

  /**
    Catches click events on the contents of the modal. This allows replaced
    templateTags to have React functionality.

    @param {SyntheticEvent} evt The click event.
  */
  _handleContentClick(evt) {
    const templateTag = evt.target.getAttribute('data-templatetag');
    if (templateTag) {
      const resolvedVar = this.templateTags[templateTag];
      if (resolvedVar && resolvedVar.onClick) {
        resolvedVar.onClick.call(this);
      }
    }
  }

  /**
    Show the details page of a charm or bundle based on the click.
  */
  _handleViewDetails() {
    const url = urls.URL.fromAnyString(this.props.entityURLs[0]);
    this.props.changeState({
      profile: null,
      search: null,
      store: url.path()
    });
  }

  /**
    Close the panel.

    @param {Object} evt The click event.
  */
  _closePostDeployment(evt) {
    evt.stopPropagation();
    this.props.changeState({
      postDeploymentPanel: null
    });
  }

  render() {
    let classes = [
      'post-deployment'
    ];
    if (this.state.content) {
      return (
        <Panel
          extraClasses={classes.join(' ')}
          instanceName="post-deployment"
          visible={true}>
          <span className="close" onClick={this._closePostDeployment.bind(this)} role="button"
            tabIndex="0">
            <SvgIcon name="close_16"
              size="16" />
          </span>
          <div dangerouslySetInnerHTML={{__html: this.state.content}}
            onClick={this._handleContentClick.bind(this)} />
          {this._renderPostDeploymentScriptButton()}
        </Panel>
      );
    }
    return null;
  }
}

PostDeployment.propTypes = {
  changeState: PropTypes.func.isRequired,
  charmstore: shapeup.shape({
    getEntity: PropTypes.func.isRequired,
    getFile: PropTypes.func.isRequired
  }).isRequired,
  entityURLs: PropTypes.array.isRequired
};

module.exports = PostDeployment;
