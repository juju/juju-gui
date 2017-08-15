/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

/**
  Displays post-deployment information for usage and quickstart.
  Shown when a charm or bundle is added to the canvas, and on deploy.
*/
class PostDeployment extends React.Component {
  constructor(props) {
    super(props);
    this.variables = {
      details_link: {
        onClick: this._handleViewDetails.bind(this),
        content: '<span role="button" ' +
          'class="link" ' +
          'data-variable="details_link">View details</span>'
      },
      requires_cli_link: {
        content: '<a ' +
          'href="https://jujucharms.com/docs/stable/reference-install" ' +
          'target="_blank">Juju CLI client</a>'
      }
    };
    this.state= {
      content: null,
      metadata: {}
    };
  }

  componentDidMount() {
    const files = this.props.files;

    // We only want to try and get the usage.md file if there's one there.
    // Unfortunately, the only place we can easily know whether the file
    // exists or not is from the entity details page.
    // The + icon in search results will make an api request for the file
    // and 404 if it's not there.
    if (!files || (files && files.indexOf('usage.md') !== -1)) {
      this.props.getFile(
        this.props.entityId,
        'usage.md',
        this._getUsageCallback.bind(this)
      );
    }
  }

  /**
    Callback when usage.md is retrieved.

    @param {Object} error Error if there is one.
    @param {String} usageContents The contents of the file.
  */
  _getUsageCallback(error, usageContents) {
    if (usageContents && usageContents.substring(0, 1) !== '{') {
      this.setState({
        metadata: this.parseMarkdownMetadata(usageContents)
      });
      const markdown = this.props.marked(
        this.replaceVars(
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
    if (markdown.indexOf('---') === 0) {
      let lineByLine = markdown.split('\n');
      let metadata = [];
      lineByLine.shift();
      while(lineByLine[0] !== '---') {
        metadata.push(lineByLine.shift());
      }
      lineByLine.shift();

      metadata.forEach(option => {
        const splitOption = option.split(':');
        return parsedMetadata[splitOption[0].trim()] = splitOption[1].trim();
      });

      return parsedMetadata;
    }
  }

  /**
    Replace variables within the markdown with a pre-defined list.

    @param {String} markdown The raw markdown.
    @return {String} The replaced string.
  */
  replaceVars(markdown) {
    let replaced = markdown;

    Object.keys(this.variables).forEach(variable => {
      replaced = replaced.split(`{${variable}}`).join(this.variables[variable].content);
    });

    return replaced;
  }

  /**
    Catches click events on the contents of the modal. This allows replaced
    variables to have React functionality.

    @param {SyntheticEvent} evt The click event.
  */
  _handleContentClick(evt) {
    const variable = evt.target.getAttribute('data-variable');
    if (variable) {
      const resolvedVar = this.variables[variable];
      if (resolvedVar && resolvedVar.onClick) {
        resolvedVar.onClick.call(this);
      }
    }
  }

  /**
    Show the details page of a charm or bundle based on the click.

    @param {SyntheticEvent} evt The click event.
  */
  _handleViewDetails(evt) {
    if (evt) evt.preventDefalt();
    const storeState = {
      profile: null,
      search: null,
      store: this.props.entityUrl.path()
    };

    this.props.changeState(storeState);
  }

  render() {
    let classes = [
      'modal--right',
      'modal--auto-height',
      'post-deployment'
    ];
    if (this.state.content) {
      return (
        <juju.components.Modal
          closeModal={this.props.closePostDeployment}
          extraClasses={classes.join(' ')}>
          <div onClick={this._handleContentClick.bind(this)}
            dangerouslySetInnerHTML={{__html: this.state.content}} />
        </juju.components.Modal>
      );
    } else if (this.props.displayName) {
      classes.push('post-deployment--simple');
      return (
        <juju.components.Modal
          closeModal={this.props.closePostDeployment}
          extraClasses={classes.join(' ')}>
          <p>
            {this.props.displayName}
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

PostDeployment.propTypes = {
  changeState: PropTypes.func.isRequired,
  closePostDeployment: PropTypes.func.isRequired,
  displayName: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
  entityUrl: PropTypes.object.isRequired,
  files: PropTypes.array,
  getFile: PropTypes.func.isRequired,
  marked: PropTypes.func.isRequired
};

YUI.add('post-deployment', function() {
  juju.components.PostDeployment = PostDeployment;
}, '0.1.0', { requires: [
  'modal'
]});
