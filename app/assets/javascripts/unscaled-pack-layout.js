/**
 * Unscaled pack layout.
 * 
 * This code is mostly taken from D3, which explains some of the non-standard
 * coding practices used within.  The pack layout as used by D3 always scales
 * the layout to fit within the viewport, which is not what we want, as this
 * causes overlap with service nodes when there are a large number of them
 * on the canvas.  This removes the scaling factor (by setting it to always
 * be 1).  This is an interim fix until we come up with our own auto-layout
 * not based on circle packing.  For now, this remains a patch.
 *
 * @module unscaled-pack-layout
 */
YUI.add('unscaled-pack-layout', function(Y) {
  // A method assignment helper for hierarchy subclasses.
  // Taken from d3.layout.hierarchy
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, 'sort', 'children', 'value');

    // Add an alias for links, for convenience.
    object.links = d3_layout_hierarchyLinks;

    // If the new API is used, enable inlining.
    object.nodes = function(d) {
      d3_layout_hierarchyInline = true;
      return (object.nodes = object)(d);
    };

    return object;
  };

  // Returns an array source+target objects for the specified nodes.
  // Taken from d3.layout.hierarchy
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {source: parent, target: child};
      });
    }));
  }

  // For backwards-compatibility, don't enable inlining by default.
  // Taken from d3.layout.hierarchy
  var d3_layout_hierarchyInline = false;

  // Taken from d3.layout.tree
  function d3_layout_treeVisitAfter(node, callback) {
    function visit(node, previousSibling) {
      var children = node.children;
      if (children && (n = children.length)) {
        var child,
            previousChild = null,
            i = -1,
                        n;
        while (++i < n) {
          child = children[i];
          visit(child, previousChild);
          previousChild = child;
        }
      }
      callback(node, previousSibling);
    }
    visit(node, null);
  }


  // Create an unscaled pack layout.
  // The majority of this was taken from d3.layout.pack
  d3.layout.unscaledPack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort),
        padding = 0,
        size = [1, 1];

    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i),
          root = nodes[0];

      // Recursively compute the layout.
      root.x = 0;
      root.y = 0;
      d3_layout_treeVisitAfter(root, function(d) { d.r = Math.sqrt(d.value); });
      d3_layout_treeVisitAfter(root, d3_layout_packSiblings);

      // Compute the scale factor the initial layout.
      var w = size[0],
          h = size[1],
          k = 1;
      // Here, d3 would recompute the layout using scaled padding,
      // but we're going to skip that as it makes things cluttered
      // when there are a lot of services.
      // When padding, recompute the layout using scaled padding.
      if (padding > 0) {
        var dr = padding * k / 2;
        d3_layout_treeVisitAfter(root, function(d) { d.r += dr; });
        d3_layout_treeVisitAfter(root, d3_layout_packSiblings);
        d3_layout_treeVisitAfter(root, function(d) { d.r -= dr; });
      }

      // Scale the layout to fit the requested size.
      d3_layout_packTransform(root, (w + padding) / 2,
          (h + padding / 2) / 2, 1 / k);

      // d3.layout.hierarchy, by defualt, creates a node with the original
      // content as a 'data' attribute, unless flag is set in the d3
      // internals.  In order to get around having to include more of d3,
      // simply mix some of the computed attributes into the data object,
      // then make the node the data object, which is our bounding box.
      nodes.forEach(function(d) {
        // Only mix attributes in if they have the data attribute and the
        // _modelName attribute on data.
        if (d.data && d.data._modelName) {
          d.data.x = d.x;
          d.data.y = d.y;
          d.data.r = d.r;
          d = d.data;
        }
      });
      return nodes;
    }

    pack.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return pack;
    };

    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };


    return d3_layout_hierarchyRebind(pack, hierarchy);
  };

  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }

  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }

  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }

  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x,
        dy = b.y - a.y,
        dr = a.r + b.r;
    return dr * dr - dx * dx - dy * dy > .001; // within epsilon
  }

  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;

    var nodes,
        xMin = Infinity,
        xMax = -Infinity,
        yMin = Infinity,
        yMax = -Infinity,
        a, b, c, i, j, k, n;

    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }

    // Create node links.
    nodes.forEach(d3_layout_packLink);

    // Create first node.
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);

    // Create second node.
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);

      // Create third node and build chain.
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;

        // Now iterate through the rest.
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);

          // Search for the closest intersection.
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }

          // Update node chain.
          if (isect) {
            if (s1 < s2 || (s1 == s2 && b.r < a.r))
              d3_layout_packSplice(a, b = j);
            else
              d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }

    // Re-center the circles and compute the encompassing radius.
    var cx = (xMin + xMax) / 2,
        cy = (yMin + yMax) / 2,
        cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;

    // Remove node links.
    nodes.forEach(d3_layout_packUnlink);
  }

  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }

  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }

  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = (x += k * node.x);
    node.y = (y += k * node.y);
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }

  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r,
        dx = b.x - a.x,
        dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r,
          dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc),
          y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) *
          db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
}, '0.0.1', {
  requires: ['d3']
});
