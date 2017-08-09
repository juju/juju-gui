/* Copyright (C) 2015 Canonical Ltd. */

'use strict';

class Quickstart extends React.Component {
  constructor(props) {
    super(props);
    this.BASE_URL = 'https://raw.githubusercontent.com/Lukewh/juju-quickstart/master/';
    this.state= {
      content: null,
      metadata: {},
      entity: null
    };
  }

  catch404(text) {
    if (text.indexOf('404: Not Found') !== -1) {
      throw new Error('Catch this');
    }

    return text;
  }

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

      this.setState({
        metadata: parsedMetadata
      });

      return lineByLine.join('\n');
    }
    return markdown;
  }

  replaceVars(markdown) {
    let replacedMarkdown = markdown;
    const variables = {
      'details_link': '[View details](link)'
    }

    Object.keys(variables).forEach(variable => {
      replacedMarkdown = replacedMarkdown.split(`{${variable}}`).join(variables[variable]);
    });

    return replacedMarkdown;
  }

  componentDidMount() {
    this.props.getEntity(`${this.props.entityId}`, (error, result) => {
      this.setState({
        entity: result[0]
      });
      console.log(`${this.BASE_URL}${this.props.entityId.split('/').join('_')}`);
      fetch(`${this.BASE_URL}${this.props.entityId.split('/').join('_')}`)
        .then(response => {
          return response.text();
        })
        .then(this.catch404.bind(this))
        .then(this.parseMarkdownMetadata.bind(this))
        .then(this.replaceVars.bind(this))
        .then(markdown => {
          this.setState({
            content: this.props.marked(markdown)
          });
        })
        .catch(error => {
          console.error(error);
        });
    });
  }

  render() {
    if (this.state.content) {
      return (
        <juju.components.Modal
          closeModal={this.props.closeQuickstart}
          extraClasses="modal--right modal--auto-height quickstart">
          <div dangerouslySetInnerHTML={{__html: this.state.content}} />
        </juju.components.Modal>
      );
    } else if (this.state.entity) {
      return (
        <juju.components.Modal
          closeModal={this.props.closeQuickstart}
          extraClasses="modal--right modal--auto-height quickstart--simple">
          <p>
            {this.state.entity.name} <a>View details</a>
          </p>
          </juju.components.Modal>
      );
    }
    return null;
  }
}

Quickstart.propTypes = {
  closeQuickstart: PropTypes.func.isRequired,
  entityId: PropTypes.string.isRequired,
  getEntity: PropTypes.func.isRequired,
  marked: PropTypes.func.isRequired
};

YUI.add('quickstart', function() {
  juju.components.Quickstart = Quickstart;
}, '0.1.0', { requires: [
  'modal'
]});
