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

YUI.add('entity-files', function() {

  juju.components.EntityFiles = React.createClass({
    /* Define and validate the properites available on this component. */
    propTypes: {
      entityModel: React.PropTypes.object.isRequired,
      pluralize: React.PropTypes.func.isRequired
    },

    render: function() {
      var entityModel = this.props.entityModel;
      var files = entityModel.get('files');
      var archiveUrl = 'https://api.jujucharms.com/charmstore/v4/' +
                       `${entityModel.get('full_name')}/archive`;
      debugger;
      var codeUrl = entityModel.get('code_source').location;
      var codeLink;
      if (codeUrl) {
        codeUrl = codeUrl.replace('lp:', 'https://code.launchpad.net/');
        codeLink = (
          <li>
            <a target="_blank"
              className="section__actions--launchpad"
              href={codeUrl}>
              View code
            </a>
          </li>
        );
      } else {
        codeLink = '';
      }
      var fileItems = files.map(function(file) {
        /*
        XXX Verify whether or not these should be links. Mock seems to
        show them as unlinked.
        var fileLink = `${archiveUrl}/${file}`;
        return (
          <li key={file} className="section__list-item">
            <a href={fileLink} target="_blank">
              {file}
            </a>
          </li>
        );
        */
        return (
          <li key={file} className="section__list-item">
            {file}
          </li>
        );
      });
      return (
        <div className="entity-files section" id="files">
          <h3 className="section__title">
            {files.length + ' ' + this.props.pluralize('file', files.length)}
          </h3>
          <ul className="section__links">
            {codeLink}
            <li>
              <a target="_blank"
                className="section__actions--archive-url"
                href={archiveUrl}>
                Download .zip
              </a>
            </li>
          </ul>
          <ul className="section__list">
            {fileItems}
          </ul>
        </div>
      );
    }
  });

}, '0.1.0', {
  requires: []
});
