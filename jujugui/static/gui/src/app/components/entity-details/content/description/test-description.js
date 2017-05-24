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

var juju = {components: {}}; // eslint-disable-line no-unused-vars

describe('EntityContentDescription', function() {
  let mockEntity;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('entity-content-description', function() { done(); });
  });

  it('can render markdown in the description', () => {
    let mockEntity = jsTestUtils.makeEntity();
    // Note that this functional test is just a sanity check, not a
    // comprehensive test of the markdown syntax.
    mockEntity.set('description', 'A simple [link](http://google.com/).');
    const output = jsTestUtils.shallowRender(
      <juju.components.EntityContentDescription
        entityModel={mockEntity}
        renderMarkdown={marked} />);
    const markupObject = output.props.children.props.children.props.children
      .props.dangerouslySetInnerHTML;
    assert.equal(markupObject.__html,
      '<p>A simple <a href="http://google.com/">link</a>.</p>\n');
  });

  describe('bundle', () => {
    beforeEach(function() {
      mockEntity = jsTestUtils.makeEntity(true);
    });

    afterEach(function() {
      mockEntity = undefined;
    });

    it('can render without description', () => {
      mockEntity.set('description', null);
      const output = jsTestUtils.shallowRender(
        <juju.components.EntityContentDescription
          entityModel={mockEntity}
          renderMarkdown={marked} />);

      assert.equal(output, null);
    });

    it('can render with a description', () => {

      const output = jsTestUtils.shallowRender(
        <juju.components.EntityContentDescription
          entityModel={mockEntity}
          renderMarkdown={marked} />);

      expect(output).toEqualJSX(
        <div className="row row--grey entity-content__description">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <div className="intro"
                dangerouslySetInnerHTML={{
                  __html: '<p>HA Django cluster.</p>\n'
                }}
              />
            </div>
          </div>
        </div>
      );
    });
  });

  describe('charm', () => {
    beforeEach(function() {
      mockEntity = jsTestUtils.makeEntity();
    });

    afterEach(function() {
      mockEntity = undefined;
    });

    it('can render without description', () => {
      mockEntity.set('description', null);
      const output = jsTestUtils.shallowRender(
        <juju.components.EntityContentDescription
          entityModel={mockEntity}
          renderMarkdown={marked} />);

      assert.equal(output, null);
    });

    it('can render with a description', () => {

      const output = jsTestUtils.shallowRender(
        <juju.components.EntityContentDescription
          entityModel={mockEntity}
          renderMarkdown={marked} />);

      expect(output).toEqualJSX(
        <div className="row row--grey entity-content__description">
          <div className="inner-wrapper">
            <div className="twelve-col">
              <div className="intro"
                dangerouslySetInnerHTML={{__html: '<p>Django framework.</p>\n'}}
              />
            </div>
          </div>
        </div>
      );
    });
  });
});
