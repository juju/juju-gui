/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

/**
  Displays information for usage and quickstart.
  Shown when a charm or bundle is added to the canvas, and on deploy.
*/
class CanvasInfo extends React.Component {
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
    this.state= {
      content: null,
      displayName: null,
      metadata: {}
    };
  }

  componentDidMount() {
    const entity = this.props.makeEntityModel(this.props.entity).toEntity();

    this.setState({
      displayName: entity.displayName
    });

    const files = this.props.entity.files;
    if (files && files.indexOf('usage.md') !== -1) {
      this.props.getFile(
        this.props.entity.id,
        'usage.md',
        this._getUsageCallback.bind(this)
      );
    }
  }

  /**
    Callback when usage.md is retrieved.
    Even if there is an error we still want to display the basic box.

    @param {Object} error Error from the API.
    @param {String} usageContents The contents of the file.
  */
  _getUsageCallback(error, usageContents) {
    if (error) {
      console.error(error);
    }
    // Rather then parsing the JSON to read the error we check if the returned
    // body starts with a '{'. If it does, it's not a markdown file so ignore.
    if (usageContents && usageContents.substring(0, 1) !== '{') {
      this.setState({
        metadata: this.parseMarkdownMetadata(usageContents)
      });
      const markdown = this.props.marked(
        this.replaceTemplateTags(
          usageContents
        )
      );

      this.setState({
        content: markdown
      });
    }
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
    @return {Object} Parsed metadata.
  */
  parseMarkdownMetadata(markdown) {
    let parsedMetadata = {};
    markdown = markdown.trim();
    // If the first instance of a hr is at position 0 and
    // there is another hr expect metadata.
    if (markdown.indexOf('---') === 0 && markdown.indexOf('---', 1) !== -1) {
      let lineByLine = markdown.split('\n');
      let metadata = [];
      lineByLine.shift();
      while(lineByLine.length > 0 && lineByLine[0] !== '---') {
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

      return parsedMetadata;
    }
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
    this.props.showEntityDetails();
  }

  render() {
    let classes = [
      'modal--right',
      'modal--auto-height',
      'canvas-info'
    ];
    if (this.state.content) {
      return (
        <juju.components.Modal
          closeModal={this.props.closeCanvasInfo}
          extraClasses={classes.join(' ')}>
          <div onClick={this._handleContentClick.bind(this)}
            dangerouslySetInnerHTML={{__html: this.state.content}} />
        </juju.components.Modal>
      );
    } else if (this.state.displayName) {
      classes.push('canvas-info--simple');
      return (
        <juju.components.Modal
          closeModal={this.props.closeCanvasInfo}
          extraClasses={classes.join(' ')}>
          <p>
            {this.state.displayName}
          &nbsp;</p>
          <span
            role="button"
            className="link"
            onClick={this._handleViewDetails.bind(this)}>View details</span>
        </juju.components.Modal>
      );
    }
    return null;
  }
}

CanvasInfo.propTypes = {
  closeCanvasInfo: PropTypes.func.isRequired,
  entity: PropTypes.object.isRequired,
  getFile: PropTypes.func.isRequired,
  makeEntityModel: PropTypes.func.isRequired,
  marked: PropTypes.func.isRequired,
  showEntityDetails: PropTypes.func.isRequired
};

YUI.add('canvas-info', function() {
  juju.components.CanvasInfo = CanvasInfo;
}, '0.1.0', { requires: [
  'modal'
]});
