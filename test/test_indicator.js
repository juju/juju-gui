/* Copyright (c) 2011, Canonical Ltd. All rights reserved. */

YUI.add('lp.indicator.test', function (Y) {
    var tests = Y.namespace('lp.indicator.test');
    tests.suite = new Y.Test.Suite('Indicator Tests');
    var Assert = Y.Assert;

    // add the suite to the NS for the testrunner.js to find
    tests.suite.add(new Y.Test.Case({

        name: 'indicator_tests',

        setUp: function () {
            this.div = Y.Node.create('<div/>');
            // Generate an id so we can keep these around as we work.
            this.div.generateID();
            // We want to store this for the testing of the target, after that
            // we can just use this.div.
            this.div_id = this.div.get('id');
            Y.one('body').appendChild(this.div);
        },

        tearDown: function () {
            // Delete the reference to this.div so we can recreate new ones for
            // each test without worry.
            this.div.remove();
            delete this.div;
            if (Y.Lang.isValue(this.indicator)) {
                this.indicator.destroy();
            }
        },

        test_target_attribute: function () {
            // Constrain attribute should be set from passing in target.
            var test_node = Y.one('#' + this.div_id);
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: test_node
            });
            this.indicator.render();
            Assert.areEqual(test_node, this.indicator.get('target'));
        },

        test_indicator_appended_to_parent: function() {
            // Indicator node is appended to target's parent, rather
            // than target or body.
            var child_div = Y.Node.create('<div/>');
            // We need to create some nesting to really ensure
            // the test is good.
            this.div.appendChild(child_div);
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: child_div
            });
            this.indicator.render();
            // this.div is actually the parentNode now.
            Assert.areEqual(
                this.div,
                this.indicator.get('boundingBox').get('parentNode'));
        },

        test_indicator_has_loading_icon: function () {
            // The indicator should have a loading image added
            // to the contentBox.
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div
            });
            this.indicator.render();
            var content = this.indicator.get('boundingBox');
            var test = content.getContent();
            var img = content.one('img');
            Assert.areEqual('file:///@@/spinner-big', img.get('src'));
        },

        test_indiciator_starts_invisible: function () {
            // Indicator widgets should start hidden.
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div
            });
            this.indicator.render();
            Assert.isFalse(this.indicator.get('visible'));
            Assert.isTrue(this.indicator.get('boundingBox').hasClass(
                'yui3-overlay-indicator-hidden'));
        },

        test_set_busy_shows_overlay: function() {
            // setBusy should show the overlay.
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div
            });
            this.indicator.render();
            this.indicator.setBusy();
            Assert.isTrue(this.indicator.get('visible'));
            Assert.isFalse(this.indicator.get('boundingBox').hasClass(
                'yui3-overlay-indicator-hidden'));
        },

        test_size_matches_on_set_busy: function() {
            // Indicator should always resize when target changes size.
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div
            });
            this.indicator.render();
            // Mess with the size of target div.
            var expected_width = 800;
            var expected_height = 600;
            this.div.set('offsetWidth', expected_width);
            this.div.set('offsetHeight', expected_height);
            Assert.areNotEqual(
                expected_width,
                this.indicator.get('boundingBox').get('offsetWidth'));
            Assert.areNotEqual(
                expected_height,
                this.indicator.get('boundingBox').get('offsetHeight'));
            this.indicator.setBusy();
            Assert.areEqual(
                expected_width,
                this.indicator.get('boundingBox').get('offsetWidth'));
            Assert.areEqual(
                expected_height,
                this.indicator.get('boundingBox').get('offsetHeight'));
        },

        test_position_matches_on_set_busy: function() {
            // Indicator should always reposition itself before setBusy.
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div
            });
            this.indicator.render();
            // Change the position of target div.
            var expected_xy = [100, 300];
            this.div.setXY(expected_xy);
            var actual_xy = this.indicator.get('boundingBox').getXY();
            Assert.areNotEqual(expected_xy[0], actual_xy[0]);
            Assert.areNotEqual(expected_xy[1], actual_xy[1]);
            this.indicator.setBusy();
            var final_xy = this.indicator.get('boundingBox').getXY();
            Assert.areEqual(expected_xy[0], final_xy[0]);
            Assert.areEqual(expected_xy[1], final_xy[1]);

        },

        test_success_hides_overlay: function() {
            // Calling success should hide the overlay.
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div
            });
            this.indicator.render();
            this.indicator.setBusy();
            this.indicator.success();
            Assert.isFalse(this.indicator.get('visible'));
            Assert.isTrue(this.indicator.get('boundingBox').hasClass(
                'yui3-overlay-indicator-hidden'));
        },

        test_success_callback: function() {
            // We should be able to pass in a callback as success_action.
            var called = false;
            var callback = function() {
                called = true;
            };
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div,
                success_action: callback
            });
            this.indicator.render();
            this.indicator.success();
            Assert.isTrue(called);
        },

        test_focus_target_scrolls_success: function () {
            // Provided function scroll_to_target should scroll to target.
            var viewport = Y.DOM.viewportRegion();
            this.div.set('offsetWidth', viewport.right + 1000);
            this.div.set('offsetHeight', viewport.bottom + 1000);
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div,
                success_action: Y.lp.app.indicator.actions.scroll_to_target
            });
            this.indicator.render();
            window.scrollTo(1000, 1000);
            Assert.areEqual(1000, Y.DOM.docScrollX());
            Assert.areEqual(1000, Y.DOM.docScrollY());
            this.indicator.setBusy();
            this.indicator.success();
            var expected_xy = this.indicator.get('target').getXY();
            Assert.areEqual(expected_xy[0], Y.DOM.docScrollX());
            Assert.areEqual(expected_xy[1], Y.DOM.docScrollY());
        },

        test_error_hides_overlay: function () {
            // Calling error should hide the overlay.
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div
            });
            this.indicator.render();
            this.indicator.setBusy();
            this.indicator.error();
            Assert.isFalse(this.indicator.get('visible'));
            Assert.isTrue(this.indicator.get('boundingBox').hasClass(
                'yui3-overlay-indicator-hidden'));
        },

        test_error_callback: function() {
            // We should be able to pass in a callback as error_action.
            var called = false;
            var callback = function() {
                called = true;
            };
            this.indicator = new Y.lp.app.indicator.OverlayIndicator({
                target: this.div,
                error_action: callback
            });
            this.indicator.render();
            this.indicator.error();
            Assert.isTrue(called);
        }
    }));


}, '0.1', {'requires': ['test', 'lp.app.indicator']});
