/*
This file is part of the Juju GUI, which lets users view and manage Juju
environments within a graphical interface (https://launchpad.net/juju-gui).
Copyright (C) 2012-2013 Canonical Ltd.

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

/**
 Taken from Launchpad.  Original copyright is below.  Adapted to juju-gui
 testing style.
 */

/* Copyright 2012 Canonical Ltd.  This software is licensed under the
 * GNU Affero General Public License version 3 (see the file LICENSE). */

describe('textarea autosize plugin', function() {

  var Y, test_text, container, textarea, target, target2, utils;

  before(function(done) {
    Y = YUI(GlobalConfig).use([
      'resizing-textarea',
      'juju-tests-utils',
      'node-event-simulate'],
    function(Y) {

      test_text = ['Lorem ipsum dolor sit amet, consectetur adipiscing.',
        'Maecenas ut viverra nibh. Morbi sit amet tellus accumsan justo ',
        'blandit sit amet ac augue. Pellentesque eget diam at purus suscipit',
        'venenatis. Proin non neque lacus. Curabitur venenatis tempus sem, ',
        'porttitor magna fringilla vel. Cras dignissim egestas lacus nec',
        'hendrerit. Proin pharetra, felis ac auctor dapibus, neque orci ',
        'lorem, sit amet posuere erat quam euismod arcu. Nulla pharetra ',
        'enim tempus faucibus. Sed dictum tristique nisl sed rhoncus. Etiam ',
        'tristique nisl eget risus blandit iaculis. Lorem ipsum dolor sit ,',
        'consectetur adipiscing elit.'].join('');

      utils = Y.namespace('juju-tests.utils');
      done();
    });
  });

  beforeEach(function() {
    container = utils.makeContainer(this, 'container');
    textarea = Y.Node.create('<textarea class="autosize"></textarea>');
    container.append(textarea);
    target = undefined;
    target2 = undefined;
  });

  afterEach(function() {
    if (target) {
      target.remove().destroy(true);
    }
    if (target2) {
      target2.remove().destroy(true);
    }
  });


  /**
   * Helper function to turn the string from getComputedStyle to int.
   *
   */
  function clean_size(val) {
    return parseInt(val.replace('px', ''), 10);
  }

  /**
   * Helper to extract the computed height of the element.
   *
   */
  function get_height(target) {
    return clean_size(target.getStyle('height'));
  }

  /**
   * In order to update the content we need to change the text, but also to
   * fire the event that the content has changed since we're modifying it
   * programatically.
   *
   */
  function update_content(target, val) {
    target.set('value', val);

    // Instead of hitting the changed event directly, we'll just manually
    // call into the hook for the event itself.
    target.resizingTextarea._run_change(val);
  }

  it('should be able to load the plugin', function() {
    assert.isDefined(Y.juju.plugins.ResizingTextarea);
  });

  it('can plug into a node', function() {
    target = Y.Node.create(
        '<textarea style="width: auto;">Initial text</textarea>');
    container.append(target);
    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true
    });
    assert.isDefined(target.resizingTextarea);
  });

  it('initial resizable', function() {
    target = Y.Node.create(
        '<textarea style="width: auto;">Initial text</textarea>');
    container.append(target);
    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true
    });
    assert.equal('Initial text', target.get('value'));
    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true
    });

    // Get the current sizes so we can pump text into it and make sure
    // it grows.
    var orig_height = get_height(target);
    update_content(target, test_text);

    var new_height = get_height(target);
    assert.isTrue(new_height > orig_height,
        'The height should increase with content');
  });

  it('computes max height', function() {
    target = Y.Node.create(
        '<textarea style="width: auto;">has defaults</textarea>');
    container.append(target);
    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true,
      max_height: 200,
      min_height: 100
    });
    var min_height = get_height(target);
    assert.equal(100, min_height,
        'The height should be no smaller than 100px');

    update_content(target, test_text);

    var new_height = get_height(target);
    assert.equal(200, new_height, 'The height should only get to 200px');

  });

  it('resizes when removing content', function() {
    target = Y.Node.create(
        '<textarea style="width: auto;"></textarea>');
    container.append(target);
    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true,
      min_height: 100
    });
    update_content(target, test_text);
    var max_height = get_height(target);
    assert.isTrue(max_height > 100,
        'The height should be larger than our min with content');

    update_content(target, 'shrinkage');
    var min_height = get_height(target);
    assert.equal(100, min_height,
        'The height should shrink back to our min');
  });

  it('handles multiple targets', function() {
    target = Y.Node.create(
        '<textarea class="test_multiple first" style="width: auto;">' +
        '</textarea>');
    target2 = Y.Node.create(
        '<textarea class="test_multiple second" style="width: auto;">' +
        '</textarea>');
    container.append(target);
    container.append(target2);

    var targets = container.all('.test_multiple');

    targets.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true,
      min_height: 100
    });

    targets.each(function(node) {
      var min_height = get_height(node);
      assert.equal(100, min_height,
          'The height of the node should be 100');
    });

    // Now set the content in the first one and check it's unique.
    update_content(container.one('.first'), test_text);

    var first = container.one('.first');
    var second = container.one('.second');

    var first_height = get_height(first);
    assert.isTrue(first_height > 100,
        'The height of the first should now be > 100');

    var second_height = get_height(second);
    assert.equal(100, second_height,
        'The height of the second should still be 100');
  });

  it('css height preset', function() {
    target = Y.Node.create(
        '<textarea style="height: 120px; width: auto;"></textarea>');
    container.append(target);
    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true
    });
    var current_height = get_height(target);
    assert.equal(120, current_height,
        'The height should match the css property at 120px');
  });

  it('initial min height after hidden', function() {
    // If we pass in a min height, the text area should resize on init
    // to that min height.
    target2 = Y.Node.create(
        '<div style="display: none;">' +
        '  <textarea id="config_height" rows="15" name="field.comment"' +
        '    style="max-width: 60em; width: 90%; display: block;" cols="44">' +
        '  </textarea>' +
        '</div>');

    container.append(target2);

    var target = Y.one('#config_height');

    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true,
      min_height: 300
    });

    target.show();
    var current_height = get_height(target);
    assert.equal(300, current_height,
        'The height should start out at 300px per the min_height cfg');
  });

  it('height stays consistent', function() {
    // Once we adjust the height, another keystroke shouldn't move the
    // height on us again, see bug #919299.
    target = Y.Node.create(
        '<textarea style="width: auto;"></textarea>');
    container.append(target);

    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true,
      max_height: 200,
      min_height: 100
    });

    update_content(target, test_text);
    var new_height = get_height(target);
    assert.equal(200, new_height,
        'The height should hit max at 200px');

    update_content(target, test_text + '\nanother line');
    var adjusted_height = get_height(target);
    assert.equal(200, adjusted_height,
        'The height should still be at 200px');

    update_content(target, test_text + '\ntwo more\nlines');
    var adjusted_height2 = get_height(target);
    assert.equal(200, adjusted_height2,
        'The height should still be at 200px');
  });

  it('one line should size to single em', function() {
    // Passing single_line in the cfg should limit the height to 1em even
    // though a normal textarea would be two lines tall.

    target2 = Y.Node.create(
        '<textarea style="height: 28px; overflow: hidden; resize: none; ' +
        '  width: auto;">' +
        '</textarea>');
    container.append(target2);

    target = Y.Node.create(
        '<textarea style="height: 1em; width: auto;"></textarea>');
    container.append(target);

    var sample_height = get_height(target2);

    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true,
      single_line: 28
    });

    var initial_height = get_height(target);
    assert.equal(sample_height, initial_height,
        'The initial height should be 28px');

    // After adding a bunch of text and removing it, we should be back
    // at one em height.
    update_content(target, test_text);
    assert.isTrue(get_height(target) > initial_height,
        'Verify that we did change the height');

    update_content(target, '');
    assert.equal(sample_height, get_height(target),
        'The updated final height should be 1em');
  });

  it('should change by single line height when focus changes', function() {
    target = Y.Node.create(
        '<textarea style="width: auto;">Initial text</textarea>');
    container.append(target);
    target.plug(Y.juju.plugins.ResizingTextarea, {
      skip_animations: true,
      single_line: 28
    });
    var orig_height = get_height(target);
    target.focus();
    var focused_height = get_height(target);
    assert.isTrue(focused_height > orig_height);
    target.blur();
    var blurred_height = get_height(target);
    assert.equal(orig_height, blurred_height);
  });

});
