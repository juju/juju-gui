/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2017 Canonical Ltd.

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

const EntityContentDescription = React.createClass({
  displayName: 'EntityContentDescription',

  /* Define and validate the properites available on this component. */
  propTypes: {
    changeState: React.PropTypes.func,
    entityModel: React.PropTypes.object,
    includeHeading: React.PropTypes.bool,
    renderMarkdown: React.PropTypes.func.isRequired
  },

  render: function() {
    const description = this.props.entityModel.get('description');
    if (!description) {
      return false;
    }
    const htmlDescription = this.props.renderMarkdown(description);
    let heading = null;
    if (this.props.includeHeading) {
      heading = (
        <h2 className="entity-content__header" id="description">
          Description
          <juju.components.HashLink
            changeState={this.props.changeState}
            hash="description" />
        </h2>
      );
    }
    return (
      <div className="entity-content__description">
        {heading}
        <div className="entity-content__description-content"
          dangerouslySetInnerHTML={{__html: htmlDescription}}>
        </div>
      </div>
    );
  }
});

YUI.add('entity-content-description', function() {
  juju.components.EntityContentDescription = EntityContentDescription;
}, '0.1.0', {
  requires: ['hash-link']
});
