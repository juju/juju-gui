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

var juju = {components: {}};
var testUtils = React.addons.TestUtils;

chai.config.includeStack = true;
chai.config.truncateThreshold = 0;

describe('HeaderSearch', function() {
  var icons;

  beforeAll(function(done) {
    // By loading this file it adds the component to the juju components.
    YUI().use('header-search', function() { done(); });
  });

  beforeEach(function() {
    stubIcons();
  });

  afterEach(function() {
    // Make sure we reset the icons after every test even if it fails
    // so that we don't cause cascading failures.
    resetIcons();
  });

  function stubIcons() {
    icons = juju.components.HeaderSearch.icons;
    juju.components.HeaderSearch.prototype.icons = {};
  }

  function resetIcons() {
    if (icons !== null) {
      juju.components.HeaderSearch.prototype.icons = icons;
    }
  }

  it('sets the active class if there is search metadata', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    getAppState.returns({
      search: {
        text: 'apache2'
      }
    });
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState}
        active={true} />);
    assert.deepEqual(output,
      <div className="header-search header-search--active">
        {output.props.children}
      </div>);
  });

  it('hides the close button when not active', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    var output = jsTestUtils.shallowRender(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState}
        active={true} />);
    assert.deepEqual(output.props.children[2],
      <span tabIndex="0" role="button"
        className="header-search__close hidden"
        onClick={output.props.children[2].props.onClick}
        dangerouslySetInnerHTML={{__html: undefined}} />);
  });

  // it('changes state when the close button is clicked', function() {
  // });

  it('becomes active when the input is focused', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    var output = testUtils.renderIntoDocument(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState}
        active={true} />);
    var input = output.getDOMNode().querySelector('.header-search__input');
    testUtils.Simulate.focus(input);
    assert.isTrue(
        output.getDOMNode().className.indexOf('header-search--active') > -1);
    var input = output.getDOMNode().querySelector('.header-search__input');
    assert.equal(input.style.getPropertyValue('width'), '160px');
  });

  it('becomes inactive if the input loses focus with no text', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    var output = testUtils.renderIntoDocument(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState}
        active={true} />);
    var input = output.getDOMNode().querySelector('.header-search__input');
    testUtils.Simulate.focus(input);
    assert.isTrue(
        output.getDOMNode().className.indexOf('header-search--active') > -1);
    testUtils.Simulate.blur(input);
    assert.isFalse(
        output.getDOMNode().className.indexOf('header-search--active') > -1);
    assert.isNull(input.style.getPropertyValue('width'));
  });

  it('remains active if the input loses focus and there is text', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    var output = testUtils.renderIntoDocument(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState}
        active={true} />);
    var input = output.getDOMNode().querySelector('.header-search__input');
    testUtils.Simulate.focus(input);
    assert.isTrue(
        output.getDOMNode().className.indexOf('header-search--active') > -1);
    input.value = 'search text';
    testUtils.Simulate.change(input);
    testUtils.Simulate.blur(input);
    assert.isTrue(
        output.getDOMNode().className.indexOf('header-search--active') > -1);
  });

  it('remains active if there is search metadata', function() {
    var getAppState = sinon.stub();
    var changeState = sinon.stub();
    getAppState.returns({
      search: {
        text: 'apache2'
      }
    });
    var output = testUtils.renderIntoDocument(
      <juju.components.HeaderSearch
        getAppState={getAppState}
        changeState={changeState}
        active={true} />);
    var input = output.getDOMNode().querySelector('.header-search__input');
    testUtils.Simulate.focus(input);
    assert.isTrue(
        output.getDOMNode().className.indexOf('header-search--active') > -1);
    input.value = '';
    testUtils.Simulate.change(input);
    testUtils.Simulate.blur(input);
    assert.isTrue(
        output.getDOMNode().className.indexOf('header-search--active') > -1);
  });
});
