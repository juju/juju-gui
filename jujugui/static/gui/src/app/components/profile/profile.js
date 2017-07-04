/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

class Profile extends React.Component {

  constructor(props) {
    super(props);
    const activeSection = this.props.activeSection || 'models';
    this.state = {activeSection};
  }

  componentWillReceiveProps(nextProps) {
    this.setState({activeSection: nextProps.activeSection});
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.activeSection !== this.state.activeSection) {
      return true;
    }
    return false;
  }

  _generateContent() {
    switch(this.state.activeSection) {
      case 'models':
        return 'Models';
        break;
      case 'bundles':
        return 'Bundles';
        break;
      case 'charms':
        return 'Charms';
        break;
      case 'cloud credentials':
        return 'Cloud Credentials';
        break;
      default:
        // Render the default as the model list for now, but the Summary later.
        return 'Models';
        break;
    }
  }

  render() {
    return (
      <juju.components.Panel
        instanceName="profile"
        visible={true}>
        <juju.components.ProfileHeader />
        <div className="inner-wrapper">
          <div className="three-col">
            <juju.components.ProfileNavigation
              changeState={this.props.changeState}
              activeSection={this.state.activeSection}/>
          </div>
          <div className="six-col last-col">
            {this._generateContent()}
          </div>
        </div>
      </juju.components.Panel>
    );
  }

};

Profile.propTypes = {
  activeSection: React.PropTypes.string,
  changeState: React.PropTypes.func.isRequired
};

YUI.add('profile', function() {
  juju.components.Profile = Profile;
}, '', {
  requires: [
    'panel-component',
    'profile-navigation',
    'profile-header'
  ]
});
