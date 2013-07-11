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
  Provide the DataBinding library.

  @module views
  @submodule views.databinding
  */

YUI.add('d3-statusbar', function(Y) {

  var views = Y.namespace('juju.views'),
  utils = Y.namespace('juju.views.utils');

  views.StatusBar = (function() {
    var key = function(d) {return d.key;};


    function StatusBar(options) {
      this.options = Y.mix(options || {}, {
        container: 'body',
        target: 'svg',
        width: 250,
        font_size: 16,
        transition_time: 750,
        resize: true,
        'sort': function(a, b) {
          return a.key < b.key ? -1: a.key > b.key ? 1 : 0;
        }
      });
    }

    StatusBar.prototype.render = function() {
      var self = this;
      this.node = d3.select(this.options.target);

      if (this.node.empty()) {
        this.node = d3.select(this.options.container)
        .append(this.options.target);

        this.node.append('g')
        .classed('statusbar', true);
      }

      if (this.options.resize) {
        this.node.attr({
          width: self.options.width,
          height: self.options.font_size + 2
        });
      }

      this.scale = d3.scale.linear()
      .domain([0, 100])
      .range([0, this.options.width]);
      return this;
    };

    StatusBar.prototype.mapData = function(data) {
      var total = 0;
      var max_range = 0;
      var result = [];
      var min_reserve = 10; // percent
      var reserved = 0;
      var k;
      var start = 0;

      for (k in data) {
        if (data.hasOwnProperty(k)) {
          total += data[k];
          if (data[k] > max_range) {
            max_range = data[k];
          }
        }
      }

      for (k in data) {
        if (data.hasOwnProperty(k)) {
          var v = data[k];
          if (v === 0) {
            continue;
          }
          if ((v / total * 100.0) < min_reserve) {
            reserved += (min_reserve - ((v / total) * 100.0));
          }
          var p = Math.max(min_reserve, v / total * 100.0);
          result.push({key: k, percent: p, count: v});
        }

        if (this.options.sort) {
          result.sort(this.options.sort);
        }
      }

      result.forEach(function(d) {
        if (d.count === max_range) {
          d.percent -= reserved;
        }
      });

      result.forEach(function(d) {
        d.start = start;
        start += d.percent;
      });

      // Correct any rounding errors to keep the size fixed.
      result.forEach(function(d) {
        if (d.count === max_range) {
          d.percent += (100.0 - start);
        }
      });

      return result;
    };

    StatusBar.prototype.update = function(data) {
      var self = this;
      var font_size = 18;
      var result = this.mapData(data);

      var rects = this.node.selectAll('rect')
      .data(result, key);
      var labels = this.node.selectAll('text')
      .data(result, key);

      // Enter/Update/Exit Bars
      rects
      .enter()
      .append('rect')
      .each(function(d) {
        var node = d3.select(this);
        node.classed(d.key, true);
      })
      .attr({
        height: self.options.font_size + 2
      });

      rects
      .transition()
      .duration(self.options.transition_time)
      .attr({
        width: function(d, i) { return self.scale(d.percent);},
        x: function(d, i) { return self.scale(d.start);}
      });

      rects
      .exit()
      .transition()
      .duration(self.options.transition_time)
      .attr({width: 0})
      .remove();

      // Enter/Update/Exit labels
      labels
      .enter()
      .append('text');

      labels
      .text(function(d) { return d.count;})
      .classed('label', true)
      .style({
        'font-size': self.options.font_size
      })
      .transition()
      .duration(self.options.transition_time)
      .attr({
        x: function(d) {return self.scale(d.start) + 2;},
        y: self.options.font_size - 1
      });

      labels
      .exit().remove();
      return this;
    };

    return StatusBar;
  })();

}, '0.1.0', {
  requires: ['juju-view-utils' ]
});
