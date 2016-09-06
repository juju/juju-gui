YUI.add('d3', function(Y) {
  Y.namespace('d3');
  Y.d3 = (function(){
    var d3 = {version: "3.5.16"}; // semver
d3.extent = function(array, f) {
  var i = -1,
      n = array.length,
      a,
      b,
      c;
  if (arguments.length === 1) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  } else {
    while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) { a = c = b; break; }
    while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }
  return [a, c];
};
var d3_arraySlice = [].slice,
    d3_array = function(list) { return d3_arraySlice.call(list); }; // conversion for NodeLists
var d3_document = this.document;

function d3_documentElement(node) {
  return node
      && (node.ownerDocument // node is a Node
      || node.document // node is a Window
      || node).documentElement; // node is a Document
}

function d3_window(node) {
  return node
      && ((node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView); // node is a Document
}

// Redefine d3_array if the browser doesn’t support slice-based conversion.
if (d3_document) {
  try {
    d3_array(d3_document.documentElement.childNodes)[0].nodeType;
  } catch (e) {
    d3_array = function(list) {
      var i = list.length, array = new Array(i);
      while (i--) array[i] = list[i];
      return array;
    };
  }
}
if (!Date.now) Date.now = function() {
  return +new Date;
};

// Redefine style.setProperty et al. if the browser doesn’t coerce arguments.
if (d3_document) {
  try {
    d3_document.createElement("DIV").style.setProperty("opacity", 0, "");
  } catch (error) {
    var d3_element_prototype = this.Element.prototype,
        d3_element_setAttribute = d3_element_prototype.setAttribute,
        d3_element_setAttributeNS = d3_element_prototype.setAttributeNS,
        d3_style_prototype = this.CSSStyleDeclaration.prototype,
        d3_style_setProperty = d3_style_prototype.setProperty;
    d3_element_prototype.setAttribute = function(name, value) {
      d3_element_setAttribute.call(this, name, value + "");
    };
    d3_element_prototype.setAttributeNS = function(space, local, value) {
      d3_element_setAttributeNS.call(this, space, local, value + "");
    };
    d3_style_prototype.setProperty = function(name, value, priority) {
      d3_style_setProperty.call(this, name, value + "", priority);
    };
  }
}
var d3_nsXhtml = "http://www.w3.org/1999/xhtml";

var d3_nsPrefix = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: d3_nsXhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

d3.ns = {
  prefix: d3_nsPrefix,
  qualify: function(name) {
    var i = name.indexOf(":"), prefix = name;
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return d3_nsPrefix.hasOwnProperty(prefix) ? {space: d3_nsPrefix[prefix], local: name} : name;
  }
};
var d3_subclass = {}.__proto__?

// Until ECMAScript supports array subclassing, prototype injection works well.
function(object, prototype) {
  object.__proto__ = prototype;
}:

// And if your browser doesn't support __proto__, we'll use direct extension.
function(object, prototype) {
  for (var property in prototype) object[property] = prototype[property];
};
function d3_vendorSymbol(object, name) {
  if (name in object) return name;
  name = name.charAt(0).toUpperCase() + name.slice(1);
  for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
    var prefixName = d3_vendorPrefixes[i] + name;
    if (prefixName in object) return prefixName;
  }
}

var d3_vendorPrefixes = ["webkit", "ms", "moz", "Moz", "o", "O"];

function d3_selection(groups) {
  d3_subclass(groups, d3_selectionPrototype);
  return groups;
}

var d3_select = function(s, n) { return n.querySelector(s); },
    d3_selectAll = function(s, n) { return n.querySelectorAll(s); },
    d3_selectMatches = function(n, s) {
      var d3_selectMatcher = n.matches || n[d3_vendorSymbol(n, "matchesSelector")];
      d3_selectMatches = function(n, s) {
        return d3_selectMatcher.call(n, s);
      };
      return d3_selectMatches(n, s);
    };

// Prefer Sizzle, if available.
if (typeof Sizzle === "function") {
  d3_select = function(s, n) { return Sizzle(s, n)[0] || null; };
  d3_selectAll = Sizzle;
  d3_selectMatches = Sizzle.matchesSelector;
}

d3.selection = function() {
  return d3.select(d3_document.documentElement);
};

var d3_selectionPrototype = d3.selection.prototype = [];


d3_selectionPrototype.selectAll = function(selector) {
  var subgroups = [],
      subgroup,
      node;

  selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
        subgroup.parentNode = node;
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selectorAll(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_selectAll(selector, this);
  };
}

d3_selectionPrototype.attr = function(name, value) {
  if (arguments.length < 2) {

    // For attr(string), return the attribute value for the first node.
    if (typeof name === "string") {
      var node = this.node();
      name = d3.ns.qualify(name);
      return name.local
          ? node.getAttributeNS(name.space, name.local)
          : node.getAttribute(name);
    }

    // For attr(object), the object specifies the names and values of the
    // attributes to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_attr(value, name[value]));
    return this;
  }

  return this.each(d3_selection_attr(name, value));
};

function d3_selection_attr(name, value) {
  name = d3.ns.qualify(name);

  // For attr(string, null), remove the attribute with the specified name.
  function attrNull() {
    this.removeAttribute(name);
  }
  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  // For attr(string, string), set the attribute with the specified name.
  function attrConstant() {
    this.setAttribute(name, value);
  }
  function attrConstantNS() {
    this.setAttributeNS(name.space, name.local, value);
  }

  // For attr(string, function), evaluate the function for each element, and set
  // or remove the attribute as appropriate.
  function attrFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttribute(name);
    else this.setAttribute(name, x);
  }
  function attrFunctionNS() {
    var x = value.apply(this, arguments);
    if (x == null) this.removeAttributeNS(name.space, name.local);
    else this.setAttributeNS(name.space, name.local, x);
  }

  return value == null
      ? (name.local ? attrNullNS : attrNull) : (typeof value === "function"
      ? (name.local ? attrFunctionNS : attrFunction)
      : (name.local ? attrConstantNS : attrConstant));
}
function d3_collapse(s) {
  return s.trim().replace(/\s+/g, " ");
}
d3.requote = function(s) {
  return s.replace(d3_requote_re, "\\$&");
};

var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;

d3_selectionPrototype.classed = function(name, value) {
  if (arguments.length < 2) {

    // For classed(string), return true only if the first node has the specified
    // class or classes. Note that even if the browser supports DOMTokenList, it
    // probably doesn't support it on SVG elements (which can be animated).
    if (typeof name === "string") {
      var node = this.node(),
          n = (name = d3_selection_classes(name)).length,
          i = -1;
      if (value = node.classList) {
        while (++i < n) if (!value.contains(name[i])) return false;
      } else {
        value = node.getAttribute("class");
        while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
      }
      return true;
    }

    // For classed(object), the object specifies the names of classes to add or
    // remove. The values may be functions that are evaluated for each element.
    for (value in name) this.each(d3_selection_classed(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_classed(name, value));
};

function d3_selection_classedRe(name) {
  return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
}

function d3_selection_classes(name) {
  return (name + "").trim().split(/^|\s+/);
}

// Multiple class names are allowed (e.g., "foo bar").
function d3_selection_classed(name, value) {
  name = d3_selection_classes(name).map(d3_selection_classedName);
  var n = name.length;

  function classedConstant() {
    var i = -1;
    while (++i < n) name[i](this, value);
  }

  // When the value is a function, the function is still evaluated only once per
  // element even if there are multiple class names.
  function classedFunction() {
    var i = -1, x = value.apply(this, arguments);
    while (++i < n) name[i](this, x);
  }

  return typeof value === "function"
      ? classedFunction
      : classedConstant;
}

function d3_selection_classedName(name) {
  var re = d3_selection_classedRe(name);
  return function(node, value) {
    if (c = node.classList) return value ? c.add(name) : c.remove(name);
    var c = node.getAttribute("class") || "";
    if (value) {
      re.lastIndex = 0;
      if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
    } else {
      node.setAttribute("class", d3_collapse(c.replace(re, " ")));
    }
  };
}

d3_selectionPrototype.style = function(name, value, priority) {
  var n = arguments.length;
  if (n < 3) {

    // For style(object) or style(object, string), the object specifies the
    // names and values of the attributes to set or remove. The values may be
    // functions that are evaluated for each element. The optional string
    // specifies the priority.
    if (typeof name !== "string") {
      if (n < 2) value = "";
      for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
      return this;
    }

    // For style(string), return the computed style value for the first node.
    if (n < 2) {
      var node = this.node();
      return d3_window(node).getComputedStyle(node, null).getPropertyValue(name);
    }

    // For style(string, string) or style(string, function), use the default
    // priority. The priority is ignored for style(string, null).
    priority = "";
  }

  // Otherwise, a name, value and priority are specified, and handled as below.
  return this.each(d3_selection_style(name, value, priority));
};

function d3_selection_style(name, value, priority) {

  // For style(name, null) or style(name, null, priority), remove the style
  // property with the specified name. The priority is ignored.
  function styleNull() {
    this.style.removeProperty(name);
  }

  // For style(name, string) or style(name, string, priority), set the style
  // property with the specified name, using the specified priority.
  function styleConstant() {
    this.style.setProperty(name, value, priority);
  }

  // For style(name, function) or style(name, function, priority), evaluate the
  // function for each element, and set or remove the style property as
  // appropriate. When setting, use the specified priority.
  function styleFunction() {
    var x = value.apply(this, arguments);
    if (x == null) this.style.removeProperty(name);
    else this.style.setProperty(name, x, priority);
  }

  return value == null
      ? styleNull : (typeof value === "function"
      ? styleFunction : styleConstant);
}

d3_selectionPrototype.property = function(name, value) {
  if (arguments.length < 2) {

    // For property(string), return the property value for the first node.
    if (typeof name === "string") return this.node()[name];

    // For property(object), the object specifies the names and values of the
    // properties to set or remove. The values may be functions that are
    // evaluated for each element.
    for (value in name) this.each(d3_selection_property(value, name[value]));
    return this;
  }

  // Otherwise, both a name and a value are specified, and are handled as below.
  return this.each(d3_selection_property(name, value));
};

function d3_selection_property(name, value) {

  // For property(name, null), remove the property with the specified name.
  function propertyNull() {
    delete this[name];
  }

  // For property(name, string), set the property with the specified name.
  function propertyConstant() {
    this[name] = value;
  }

  // For property(name, function), evaluate the function for each element, and
  // set or remove the property as appropriate.
  function propertyFunction() {
    var x = value.apply(this, arguments);
    if (x == null) delete this[name];
    else this[name] = x;
  }

  return value == null
      ? propertyNull : (typeof value === "function"
      ? propertyFunction : propertyConstant);
}

d3_selectionPrototype.text = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.textContent = v == null ? "" : v; } : value == null
      ? function() { this.textContent = ""; }
      : function() { this.textContent = value; })
      : this.node().textContent;
};

d3_selectionPrototype.html = function(value) {
  return arguments.length
      ? this.each(typeof value === "function"
      ? function() { var v = value.apply(this, arguments); this.innerHTML = v == null ? "" : v; } : value == null
      ? function() { this.innerHTML = ""; }
      : function() { this.innerHTML = value; })
      : this.node().innerHTML;
};

d3_selectionPrototype.append = function(name) {
  name = d3_selection_creator(name);
  return this.select(function() {
    return this.appendChild(name.apply(this, arguments));
  });
};

function d3_selection_creator(name) {

  function create() {
    var document = this.ownerDocument,
        namespace = this.namespaceURI;
    return namespace === d3_nsXhtml && document.documentElement.namespaceURI === d3_nsXhtml
        ? document.createElement(name)
        : document.createElementNS(namespace, name);
  }

  function createNS() {
    return this.ownerDocument.createElementNS(name.space, name.local);
  }

  return typeof name === "function" ? name
      : (name = d3.ns.qualify(name)).local ? createNS
      : create;
}

d3_selectionPrototype.insert = function(name, before) {
  name = d3_selection_creator(name);
  before = d3_selection_selector(before);
  return this.select(function() {
    return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
  });
};

// TODO remove(selector)?
// TODO remove(node)?
// TODO remove(function)?
d3_selectionPrototype.remove = function() {
  return this.each(d3_selectionRemove);
};

function d3_selectionRemove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}
function d3_class(ctor, properties) {
  for (var key in properties) {
    Object.defineProperty(ctor.prototype, key, {
      value: properties[key],
      enumerable: false
    });
  }
}

d3.map = function(object, f) {
  var map = new d3_Map;
  if (object instanceof d3_Map) {
    object.forEach(function(key, value) { map.set(key, value); });
  } else if (Array.isArray(object)) {
    var i = -1,
        n = object.length,
        o;
    if (arguments.length === 1) while (++i < n) map.set(i, object[i]);
    else while (++i < n) map.set(f.call(object, o = object[i], i), o);
  } else {
    for (var key in object) map.set(key, object[key]);
  }
  return map;
};

function d3_Map() {
  this._ = Object.create(null);
}

var d3_map_proto = "__proto__",
    d3_map_zero = "\0";

d3_class(d3_Map, {
  has: d3_map_has,
  get: function(key) {
    return this._[d3_map_escape(key)];
  },
  set: function(key, value) {
    return this._[d3_map_escape(key)] = value;
  },
  remove: d3_map_remove,
  keys: d3_map_keys,
  values: function() {
    var values = [];
    for (var key in this._) values.push(this._[key]);
    return values;
  },
  entries: function() {
    var entries = [];
    for (var key in this._) entries.push({key: d3_map_unescape(key), value: this._[key]});
    return entries;
  },
  size: d3_map_size,
  empty: d3_map_empty,
  forEach: function(f) {
    for (var key in this._) f.call(this, d3_map_unescape(key), this._[key]);
  }
});

function d3_map_escape(key) {
  return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
}

function d3_map_unescape(key) {
  return (key += "")[0] === d3_map_zero ? key.slice(1) : key;
}

function d3_map_has(key) {
  return d3_map_escape(key) in this._;
}

function d3_map_remove(key) {
  return (key = d3_map_escape(key)) in this._ && delete this._[key];
}

function d3_map_keys() {
  var keys = [];
  for (var key in this._) keys.push(d3_map_unescape(key));
  return keys;
}

function d3_map_size() {
  var size = 0;
  for (var key in this._) ++size;
  return size;
}

function d3_map_empty() {
  for (var key in this._) return false;
  return true;
}

d3.set = function(array) {
  var set = new d3_Set;
  if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
  return set;
};

function d3_Set() {
  this._ = Object.create(null);
}

d3_class(d3_Set, {
  has: d3_map_has,
  add: function(key) {
    this._[d3_map_escape(key += "")] = true;
    return key;
  },
  remove: d3_map_remove,
  values: d3_map_keys,
  size: d3_map_size,
  empty: d3_map_empty,
  forEach: function(f) {
    for (var key in this._) f.call(this, d3_map_unescape(key));
  }
});

d3_selectionPrototype.data = function(value, key) {
  var i = -1,
      n = this.length,
      group,
      node;

  // If no value is specified, return the first value.
  if (!arguments.length) {
    value = new Array(n = (group = this[0]).length);
    while (++i < n) {
      if (node = group[i]) {
        value[i] = node.__data__;
      }
    }
    return value;
  }

  function bind(group, groupData) {
    var i,
        n = group.length,
        m = groupData.length,
        n0 = Math.min(n, m),
        updateNodes = new Array(m),
        enterNodes = new Array(m),
        exitNodes = new Array(n),
        node,
        nodeData;

    if (key) {
      var nodeByKeyValue = new d3_Map,
          keyValues = new Array(n),
          keyValue;

      for (i = -1; ++i < n;) {
        if (node = group[i]) {
          if (nodeByKeyValue.has(keyValue = key.call(node, node.__data__, i))) {
            exitNodes[i] = node; // duplicate selection key
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
          keyValues[i] = keyValue;
        }
      }

      for (i = -1; ++i < m;) {
        if (!(node = nodeByKeyValue.get(keyValue = key.call(groupData, nodeData = groupData[i], i)))) {
          enterNodes[i] = d3_selection_dataNode(nodeData);
        } else if (node !== true) { // no duplicate data key
          updateNodes[i] = node;
          node.__data__ = nodeData;
        }
        nodeByKeyValue.set(keyValue, true);
      }

      for (i = -1; ++i < n;) {
        if (i in keyValues && nodeByKeyValue.get(keyValues[i]) !== true) {
          exitNodes[i] = group[i];
        }
      }
    } else {
      for (i = -1; ++i < n0;) {
        node = group[i];
        nodeData = groupData[i];
        if (node) {
          node.__data__ = nodeData;
          updateNodes[i] = node;
        } else {
          enterNodes[i] = d3_selection_dataNode(nodeData);
        }
      }
      for (; i < m; ++i) {
        enterNodes[i] = d3_selection_dataNode(groupData[i]);
      }
      for (; i < n; ++i) {
        exitNodes[i] = group[i];
      }
    }

    enterNodes.update
        = updateNodes;

    enterNodes.parentNode
        = updateNodes.parentNode
        = exitNodes.parentNode
        = group.parentNode;

    enter.push(enterNodes);
    update.push(updateNodes);
    exit.push(exitNodes);
  }

  var enter = d3_selection_enter([]),
      update = d3_selection([]),
      exit = d3_selection([]);

  if (typeof value === "function") {
    while (++i < n) {
      bind(group = this[i], value.call(group, group.parentNode.__data__, i));
    }
  } else {
    while (++i < n) {
      bind(group = this[i], value);
    }
  }

  update.enter = function() { return enter; };
  update.exit = function() { return exit; };
  return update;
};

function d3_selection_dataNode(data) {
  return {__data__: data};
}

d3_selectionPrototype.datum = function(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.property("__data__");
};

d3_selectionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
        subgroup.push(node);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_filter(selector) {
  return function() {
    return d3_selectMatches(this, selector);
  };
}

d3_selectionPrototype.order = function() {
  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }
  return this;
};
d3.ascending = d3_ascending;

function d3_ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

d3_selectionPrototype.sort = function(comparator) {
  comparator = d3_selection_sortComparator.apply(this, arguments);
  for (var j = -1, m = this.length; ++j < m;) this[j].sort(comparator);
  return this.order();
};

function d3_selection_sortComparator(comparator) {
  if (!arguments.length) comparator = d3_ascending;
  return function(a, b) {
    return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
  };
}
function d3_noop() {}

d3.dispatch = function() {
  var dispatch = new d3_dispatch,
      i = -1,
      n = arguments.length;
  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
  return dispatch;
};

function d3_dispatch() {}

d3_dispatch.prototype.on = function(type, listener) {
  var i = type.indexOf("."),
      name = "";

  // Extract optional namespace, e.g., "click.foo"
  if (i >= 0) {
    name = type.slice(i + 1);
    type = type.slice(0, i);
  }

  if (type) return arguments.length < 2
      ? this[type].on(name)
      : this[type].on(name, listener);

  if (arguments.length === 2) {
    if (listener == null) for (type in this) {
      if (this.hasOwnProperty(type)) this[type].on(name, null);
    }
    return this;
  }
};

function d3_dispatch_event(dispatch) {
  var listeners = [],
      listenerByName = new d3_Map;

  function event() {
    var z = listeners, // defensive reference
        i = -1,
        n = z.length,
        l;
    while (++i < n) if (l = z[i].on) l.apply(this, arguments);
    return dispatch;
  }

  event.on = function(name, listener) {
    var l = listenerByName.get(name),
        i;

    // return the current listener, if any
    if (arguments.length < 2) return l && l.on;

    // remove the old listener, if any (with copy-on-write)
    if (l) {
      l.on = null;
      listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
      listenerByName.remove(name);
    }

    // add the new listener, if any
    if (listener) listeners.push(listenerByName.set(name, {on: listener}));

    return dispatch;
  };

  return event;
}

d3.event = null;

function d3_eventPreventDefault() {
  d3.event.preventDefault();
}

function d3_eventSource() {
  var e = d3.event, s;
  while (s = e.sourceEvent) e = s;
  return e;
}

// Like d3.dispatch, but for custom events abstracting native UI events. These
// events have a target component (such as a brush), a target element (such as
// the svg:g element containing the brush) and the standard arguments `d` (the
// target element's data) and `i` (the selection index of the target element).
function d3_eventDispatch(target) {
  var dispatch = new d3_dispatch,
      i = 0,
      n = arguments.length;

  while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);

  // Creates a dispatch context for the specified `thiz` (typically, the target
  // DOM element that received the source event) and `argumentz` (typically, the
  // data `d` and index `i` of the target element). The returned function can be
  // used to dispatch an event to any registered listeners; the function takes a
  // single argument as input, being the event to dispatch. The event must have
  // a "type" attribute which corresponds to a type registered in the
  // constructor. This context will automatically populate the "sourceEvent" and
  // "target" attributes of the event, as well as setting the `d3.event` global
  // for the duration of the notification.
  dispatch.of = function(thiz, argumentz) {
    return function(e1) {
      try {
        var e0 =
        e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        dispatch[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };

  return dispatch;
}

d3_selectionPrototype.on = function(type, listener, capture) {
  var n = arguments.length;
  if (n < 3) {

    // For on(object) or on(object, boolean), the object specifies the event
    // types and listeners to add or remove. The optional boolean specifies
    // whether the listener captures events.
    if (typeof type !== "string") {
      if (n < 2) listener = false;
      for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
      return this;
    }

    // For on(string), return the listener for the first node.
    if (n < 2) return (n = this.node()["__on" + type]) && n._;

    // For on(string, function), use the default capture.
    capture = false;
  }

  // Otherwise, a type, listener and capture are specified, and handled as below.
  return this.each(d3_selection_on(type, listener, capture));
};

function d3_selection_on(type, listener, capture) {
  var name = "__on" + type,
      i = type.indexOf("."),
      wrap = d3_selection_onListener;

  if (i > 0) type = type.slice(0, i);
  var filter = d3_selection_onFilters.get(type);
  if (filter) type = filter, wrap = d3_selection_onFilter;

  function onRemove() {
    var l = this[name];
    if (l) {
      this.removeEventListener(type, l, l.$);
      delete this[name];
    }
  }

  function onAdd() {
    var l = wrap(listener, d3_array(arguments));
    onRemove.call(this);
    this.addEventListener(type, this[name] = l, l.$ = capture);
    l._ = listener;
  }

  function removeAll() {
    var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"),
        match;
    for (var name in this) {
      if (match = name.match(re)) {
        var l = this[name];
        this.removeEventListener(match[1], l, l.$);
        delete this[name];
      }
    }
  }

  return i
      ? listener ? onAdd : onRemove
      : listener ? d3_noop : removeAll;
}

var d3_selection_onFilters = d3.map({
  mouseenter: "mouseover",
  mouseleave: "mouseout"
});

if (d3_document) {
  d3_selection_onFilters.forEach(function(k) {
    if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
  });
}

function d3_selection_onListener(listener, argumentz) {
  return function(e) {
    var o = d3.event; // Events can be reentrant (e.g., focus).
    d3.event = e;
    argumentz[0] = this.__data__;
    try {
      listener.apply(this, argumentz);
    } finally {
      d3.event = o;
    }
  };
}

function d3_selection_onFilter(listener, argumentz) {
  var l = d3_selection_onListener(listener, argumentz);
  return function(e) {
    var target = this, related = e.relatedTarget;
    if (!related || (related !== target && !(related.compareDocumentPosition(target) & 8))) {
      l.call(target, e);
    }
  };
}

d3_selectionPrototype.each = function(callback) {
  return d3_selection_each(this, function(node, i, j) {
    callback.call(node, node.__data__, i, j);
  });
};

function d3_selection_each(groups, callback) {
  for (var j = 0, m = groups.length; j < m; j++) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
      if (node = group[i]) callback(node, i, j);
    }
  }
  return groups;
}

d3_selectionPrototype.call = function(callback) {
  var args = d3_array(arguments);
  callback.apply(args[0] = this, args);
  return this;
};

d3_selectionPrototype.empty = function() {
  return !this.node();
};

d3_selectionPrototype.node = function() {
  for (var j = 0, m = this.length; j < m; j++) {
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      var node = group[i];
      if (node) return node;
    }
  }
  return null;
};

d3_selectionPrototype.size = function() {
  var n = 0;
  d3_selection_each(this, function() { ++n; });
  return n;
};

function d3_selection_enter(selection) {
  d3_subclass(selection, d3_selection_enterPrototype);
  return selection;
}

var d3_selection_enterPrototype = [];

d3.selection.enter = d3_selection_enter;
d3.selection.enter.prototype = d3_selection_enterPrototype;

d3_selection_enterPrototype.append = d3_selectionPrototype.append;
d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
d3_selection_enterPrototype.node = d3_selectionPrototype.node;
d3_selection_enterPrototype.call = d3_selectionPrototype.call;
d3_selection_enterPrototype.size = d3_selectionPrototype.size;


d3_selection_enterPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      upgroup,
      group,
      node;

  for (var j = -1, m = this.length; ++j < m;) {
    upgroup = (group = this[j]).update;
    subgroups.push(subgroup = []);
    subgroup.parentNode = group.parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
        subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

d3_selection_enterPrototype.insert = function(name, before) {
  if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
  return d3_selectionPrototype.insert.call(this, name, before);
};

function d3_selection_enterInsertBefore(enter) {
  var i0, j0;
  return function(d, i, j) {
    var group = enter[j].update,
        n = group.length,
        node;
    if (j != j0) j0 = j, i0 = 0;
    if (i >= i0) i0 = i + 1;
    while (!(node = group[i0]) && ++i0 < n);
    return node;
  };
}

// TODO fast singleton implementation?
d3.select = function(node) {
  var group;
  if (typeof node === "string") {
    group = [d3_select(node, d3_document)];
    group.parentNode = d3_document.documentElement;
  } else {
    group = [node];
    group.parentNode = d3_documentElement(node);
  }
  return d3_selection([group]);
};

d3.selectAll = function(nodes) {
  var group;
  if (typeof nodes === "string") {
    group = d3_array(d3_selectAll(nodes, d3_document));
    group.parentNode = d3_document.documentElement;
  } else {
    group = d3_array(nodes);
    group.parentNode = null;
  }
  return d3_selection([group]);
};

d3_selectionPrototype.select = function(selector) {
  var subgroups = [],
      subgroup,
      subnode,
      group,
      node;

  selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    subgroup.parentNode = (group = this[j]).parentNode;
    for (var i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        subgroup.push(subnode = selector.call(node, node.__data__, i, j));
        if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_selection(subgroups);
};

function d3_selection_selector(selector) {
  return typeof selector === "function" ? selector : function() {
    return d3_select(selector, this);
  };
}
// import "../transition/transition";

// TODO Interrupt transitions for all namespaces?
d3_selectionPrototype.interrupt = function(name) {
  return this.each(name == null
      ? d3_selection_interrupt
      : d3_selection_interruptNS(d3_transitionNamespace(name)));
};

var d3_selection_interrupt = d3_selection_interruptNS(d3_transitionNamespace());

function d3_selection_interruptNS(ns) {
  return function() {
    var lock,
        activeId,
        active;
    if ((lock = this[ns]) && (active = lock[activeId = lock.active])) {
      active.timer.c = null;
      active.timer.t = NaN;
      if (--lock.count) delete lock[activeId];
      else delete this[ns];
      lock.active += 0.5;
      active.event && active.event.interrupt.call(this, this.__data__, active.index);
    }
  };
}
// import "../transition/transition";

d3_selectionPrototype.transition = function(name) {
  var id = d3_transitionInheritId || ++d3_transitionId,
      ns = d3_transitionNamespace(name),
      subgroups = [],
      subgroup,
      node,
      transition = d3_transitionInherit || {time: Date.now(), ease: d3_ease_cubicInOut, delay: 0, duration: 250};

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) d3_transitionNode(node, i, ns, id, transition);
      subgroup.push(node);
    }
  }

  return d3_transition(subgroups, ns, id);
};
d3.behavior = {};
function d3_identity(d) {
  return d;
}
// Copies a variable number of methods from source to target.
d3.rebind = function(target, source) {
  var i = 1, n = arguments.length, method;
  while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
  return target;
};

// Method is assumed to be a standard D3 getter-setter:
// If passed with no arguments, gets the value.
// If passed with arguments, sets the value and returns the target.
function d3_rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments);
    return value === source ? target : value;
  };
}

var d3_event_dragSelect,
    d3_event_dragId = 0;

function d3_event_dragSuppress(node) {
  var name = ".dragsuppress-" + ++d3_event_dragId,
      click = "click" + name,
      w = d3.select(d3_window(node))
          .on("touchmove" + name, d3_eventPreventDefault)
          .on("dragstart" + name, d3_eventPreventDefault)
          .on("selectstart" + name, d3_eventPreventDefault);

  if (d3_event_dragSelect == null) {
    d3_event_dragSelect = "onselectstart" in node ? false
        : d3_vendorSymbol(node.style, "userSelect");
  }

  if (d3_event_dragSelect) {
    var style = d3_documentElement(node).style,
        select = style[d3_event_dragSelect];
    style[d3_event_dragSelect] = "none";
  }

  return function(suppressClick) {
    w.on(name, null);
    if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
    if (suppressClick) { // suppress the next click, but only if it’s immediate
      var off = function() { w.on(click, null); };
      w.on(click, function() { d3_eventPreventDefault(); off(); }, true);
      setTimeout(off, 0);
    }
  };
}

d3.mouse = function(container) {
  return d3_mousePoint(container, d3_eventSource());
};

// https://bugs.webkit.org/show_bug.cgi?id=44083
var d3_mouse_bug44083 = this.navigator && /WebKit/.test(this.navigator.userAgent) ? -1 : 0;

function d3_mousePoint(container, e) {
  if (e.changedTouches) e = e.changedTouches[0];
  var svg = container.ownerSVGElement || container;
  if (svg.createSVGPoint) {
    var point = svg.createSVGPoint();
    if (d3_mouse_bug44083 < 0) {
      var window = d3_window(container);
      if (window.scrollX || window.scrollY) {
        svg = d3.select("body").append("svg").style({
          position: "absolute",
          top: 0,
          left: 0,
          margin: 0,
          padding: 0,
          border: "none"
        }, "important");
        var ctm = svg[0][0].getScreenCTM();
        d3_mouse_bug44083 = !(ctm.f || ctm.e);
        svg.remove();
      }
    }
    if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY;
    else point.x = e.clientX, point.y = e.clientY;
    point = point.matrixTransform(container.getScreenCTM().inverse());
    return [point.x, point.y];
  }
  var rect = container.getBoundingClientRect();
  return [e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop];
};

d3.touch = function(container, touches, identifier) {
  if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
  if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
    if ((touch = touches[i]).identifier === identifier) {
      return d3_mousePoint(container, touch);
    }
  }
};

d3.behavior.drag = function() {
  var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"),
      origin = null,
      mousedown = dragstart(d3_noop, d3.mouse, d3_window, "mousemove", "mouseup"),
      touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_identity, "touchmove", "touchend");

  function drag() {
    this.on("mousedown.drag", mousedown)
        .on("touchstart.drag", touchstart);
  }

  function dragstart(id, position, subject, move, end) {
    return function() {
      var that = this,
          target = d3.event.target.correspondingElement || d3.event.target,
          parent = that.parentNode,
          dispatch = event.of(that, arguments),
          dragged = 0,
          dragId = id(),
          dragName = ".drag" + (dragId == null ? "" : "-" + dragId),
          dragOffset,
          dragSubject = d3.select(subject(target)).on(move + dragName, moved).on(end + dragName, ended),
          dragRestore = d3_event_dragSuppress(target),
          position0 = position(parent, dragId);

      if (origin) {
        dragOffset = origin.apply(that, arguments);
        dragOffset = [dragOffset.x - position0[0], dragOffset.y - position0[1]];
      } else {
        dragOffset = [0, 0];
      }

      dispatch({type: "dragstart"});

      function moved() {
        var position1 = position(parent, dragId), dx, dy;
        if (!position1) return; // this touch didn’t move

        dx = position1[0] - position0[0];
        dy = position1[1] - position0[1];
        dragged |= dx | dy;
        position0 = position1;

        dispatch({
          type: "drag",
          x: position1[0] + dragOffset[0],
          y: position1[1] + dragOffset[1],
          dx: dx,
          dy: dy
        });
      }

      function ended() {
        if (!position(parent, dragId)) return; // this touch didn’t end
        dragSubject.on(move + dragName, null).on(end + dragName, null);
        dragRestore(dragged);
        dispatch({type: "dragend"});
      }
    };
  }

  drag.origin = function(x) {
    if (!arguments.length) return origin;
    origin = x;
    return drag;
  };

  return d3.rebind(drag, event, "on");
};

// While it is possible to receive a touchstart event with more than one changed
// touch, the event is only shared by touches on the same target; for new
// touches targetting different elements, multiple touchstart events are
// received even when the touches start simultaneously. Since multiple touches
// cannot move the same target to different locations concurrently without
// tearing the fabric of spacetime, we allow the first touch to win.
function d3_behavior_dragTouchId() {
  return d3.event.changedTouches[0].identifier;
}

d3.touches = function(container, touches) {
  if (arguments.length < 2) touches = d3_eventSource().touches;
  return touches ? d3_array(touches).map(function(touch) {
    var point = d3_mousePoint(container, touch);
    point.identifier = touch.identifier;
    return point;
  }) : [];
};
var ε = 1e-6,
    ε2 = ε * ε,
    π = Math.PI,
    τ = 2 * π,
    τε = τ - ε,
    halfπ = π / 2,
    d3_radians = π / 180,
    d3_degrees = 180 / π;

function d3_sgn(x) {
  return x > 0 ? 1 : x < 0 ? -1 : 0;
}

// Returns the 2D cross product of AB and AC vectors, i.e., the z-component of
// the 3D cross product in a quadrant I Cartesian coordinate system (+x is
// right, +y is up). Returns a positive value if ABC is counter-clockwise,
// negative if clockwise, and zero if the points are collinear.
function d3_cross2d(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function d3_acos(x) {
  return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
}

function d3_asin(x) {
  return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
}

function d3_sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function d3_cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function d3_tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

function d3_haversin(x) {
  return (x = Math.sin(x / 2)) * x;
}

var ρ = Math.SQRT2,
    ρ2 = 2,
    ρ4 = 4;

// p0 = [ux0, uy0, w0]
// p1 = [ux1, uy1, w1]
d3.interpolateZoom = function(p0, p1) {
  var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
      ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
      dx = ux1 - ux0,
      dy = uy1 - uy0,
      d2 = dx * dx + dy * dy,
      i,
      S;

  // Special case for u0 ≅ u1.
  if (d2 < ε2) {
    S = Math.log(w1 / w0) / ρ;
    i = function(t) {
      return [
        ux0 + t * dx,
        uy0 + t * dy,
        w0 * Math.exp(ρ * t * S)
      ];
    }
  }

  // General case.
  else {
    var d1 = Math.sqrt(d2),
        b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1),
        b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1),
        r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
        r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    S = (r1 - r0) / ρ;
    i = function(t) {
      var s = t * S,
          coshr0 = d3_cosh(r0),
          u = w0 / (ρ2 * d1) * (coshr0 * d3_tanh(ρ * s + r0) - d3_sinh(r0));
      return [
        ux0 + u * dx,
        uy0 + u * dy,
        w0 * coshr0 / d3_cosh(ρ * s + r0)
      ];
    }
  }

  i.duration = S * 1000;

  return i;
};

d3.behavior.zoom = function() {
  var view = {x: 0, y: 0, k: 1},
      translate0, // translate when we started zooming (to avoid drift)
      center0, // implicit desired position of translate0 after zooming
      center, // explicit desired position of translate0 after zooming
      size = [960, 500], // viewport size; required for zoom interpolation
      scaleExtent = d3_behavior_zoomInfinity,
      duration = 250,
      zooming = 0,
      mousedown = "mousedown.zoom",
      mousemove = "mousemove.zoom",
      mouseup = "mouseup.zoom",
      mousewheelTimer,
      touchstart = "touchstart.zoom",
      touchtime, // time of last touchstart (to detect double-tap)
      event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"),
      x0,
      x1,
      y0,
      y1;

  // Lazily determine the DOM’s support for Wheel events.
  // https://developer.mozilla.org/en-US/docs/Mozilla_event_reference/wheel
  if (!d3_behavior_zoomWheel) {
    d3_behavior_zoomWheel = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() { return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1); }, "wheel")
        : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() { return d3.event.wheelDelta; }, "mousewheel")
        : (d3_behavior_zoomDelta = function() { return -d3.event.detail; }, "MozMousePixelScroll");
  }

  function zoom(g) {
    g   .on(mousedown, mousedowned)
        .on(d3_behavior_zoomWheel + ".zoom", mousewheeled)
        .on("dblclick.zoom", dblclicked)
        .on(touchstart, touchstarted);
  }

  zoom.event = function(g) {
    g.each(function() {
      var dispatch = event.of(this, arguments),
          view1 = view;
      if (d3_transitionInheritId) {
        d3.select(this).transition()
            .each("start.zoom", function() {
              view = this.__chart__ || {x: 0, y: 0, k: 1}; // pre-transition state
              zoomstarted(dispatch);
            })
            .tween("zoom:zoom", function() {
              var dx = size[0],
                  dy = size[1],
                  cx = center0 ? center0[0] : dx / 2,
                  cy = center0 ? center0[1] : dy / 2,
                  i = d3.interpolateZoom(
                    [(cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k],
                    [(cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k]
                  );
              return function(t) {
                var l = i(t), k = dx / l[2];
                this.__chart__ = view = {x: cx - l[0] * k, y: cy - l[1] * k, k: k};
                zoomed(dispatch);
              };
            })
            .each("interrupt.zoom", function() {
              zoomended(dispatch);
            })
            .each("end.zoom", function() {
              zoomended(dispatch);
            });
      } else {
        this.__chart__ = view;
        zoomstarted(dispatch);
        zoomed(dispatch);
        zoomended(dispatch);
      }
    });
  }

  zoom.translate = function(_) {
    if (!arguments.length) return [view.x, view.y];
    view = {x: +_[0], y: +_[1], k: view.k}; // copy-on-write
    rescale();
    return zoom;
  };

  zoom.scale = function(_) {
    if (!arguments.length) return view.k;
    view = {x: view.x, y: view.y, k: null}; // copy-on-write
    scaleTo(+_);
    rescale();
    return zoom;
  };

  zoom.scaleExtent = function(_) {
    if (!arguments.length) return scaleExtent;
    scaleExtent = _ == null ? d3_behavior_zoomInfinity : [+_[0], +_[1]];
    return zoom;
  };

  zoom.center = function(_) {
    if (!arguments.length) return center;
    center = _ && [+_[0], +_[1]];
    return zoom;
  };

  zoom.size = function(_) {
    if (!arguments.length) return size;
    size = _ && [+_[0], +_[1]];
    return zoom;
  };

  zoom.duration = function(_) {
    if (!arguments.length) return duration;
    duration = +_; // TODO function based on interpolateZoom distance?
    return zoom;
  };

  zoom.x = function(z) {
    if (!arguments.length) return x1;
    x1 = z;
    x0 = z.copy();
    view = {x: 0, y: 0, k: 1}; // copy-on-write
    return zoom;
  };

  zoom.y = function(z) {
    if (!arguments.length) return y1;
    y1 = z;
    y0 = z.copy();
    view = {x: 0, y: 0, k: 1}; // copy-on-write
    return zoom;
  };

  function location(p) {
    return [(p[0] - view.x) / view.k, (p[1] - view.y) / view.k];
  }

  function point(l) {
    return [l[0] * view.k + view.x, l[1] * view.k + view.y];
  }

  function scaleTo(s) {
    view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
  }

  function translateTo(p, l) {
    l = point(l);
    view.x += p[0] - l[0];
    view.y += p[1] - l[1];
  }

  function zoomTo(that, p, l, k) {
    that.__chart__ = {x: view.x, y: view.y, k: view.k};

    scaleTo(Math.pow(2, k));
    translateTo(center0 = p, l);

    that = d3.select(that);
    if (duration > 0) that = that.transition().duration(duration);
    that.call(zoom.event);
  }

  function rescale() {
    if (x1) x1.domain(x0.range().map(function(x) { return (x - view.x) / view.k; }).map(x0.invert));
    if (y1) y1.domain(y0.range().map(function(y) { return (y - view.y) / view.k; }).map(y0.invert));
  }

  function zoomstarted(dispatch) {
    if (!zooming++) dispatch({type: "zoomstart"});
  }

  function zoomed(dispatch) {
    rescale();
    dispatch({type: "zoom", scale: view.k, translate: [view.x, view.y]});
  }

  function zoomended(dispatch) {
    if (!--zooming) dispatch({type: "zoomend"}), center0 = null;
  }

  function mousedowned() {
    var that = this,
        dispatch = event.of(that, arguments),
        dragged = 0,
        subject = d3.select(d3_window(that)).on(mousemove, moved).on(mouseup, ended),
        location0 = location(d3.mouse(that)),
        dragRestore = d3_event_dragSuppress(that);

    d3_selection_interrupt.call(that);
    zoomstarted(dispatch);

    function moved() {
      dragged = 1;
      translateTo(d3.mouse(that), location0);
      zoomed(dispatch);
    }

    function ended() {
      subject.on(mousemove, null).on(mouseup, null);
      dragRestore(dragged);
      zoomended(dispatch);
    }
  }

  // These closures persist for as long as at least one touch is active.
  function touchstarted() {
    var that = this,
        dispatch = event.of(that, arguments),
        locations0 = {}, // touchstart locations
        distance0 = 0, // distance² between initial touches
        scale0, // scale when we started touching
        zoomName = ".zoom-" + d3.event.changedTouches[0].identifier,
        touchmove = "touchmove" + zoomName,
        touchend = "touchend" + zoomName,
        targets = [],
        subject = d3.select(that),
        dragRestore = d3_event_dragSuppress(that);

    started();
    zoomstarted(dispatch);

    // Workaround for Chrome issue 412723: the touchstart listener must be set
    // after the touchmove listener.
    subject.on(mousedown, null).on(touchstart, started); // prevent duplicate events

    // Updates locations of any touches in locations0.
    function relocate() {
      var touches = d3.touches(that);
      scale0 = view.k;
      touches.forEach(function(t) {
        if (t.identifier in locations0) locations0[t.identifier] = location(t);
      });
      return touches;
    }

    // Temporarily override touchstart while gesture is active.
    function started() {

      // Listen for touchmove and touchend on the target of touchstart.
      var target = d3.event.target;
      d3.select(target).on(touchmove, moved).on(touchend, ended);
      targets.push(target);

      // Only track touches started on the same subject element.
      var changed = d3.event.changedTouches;
      for (var i = 0, n = changed.length; i < n; ++i) {
        locations0[changed[i].identifier] = null;
      }

      var touches = relocate(),
          now = Date.now();

      if (touches.length === 1) {
        if (now - touchtime < 500) { // dbltap
          var p = touches[0];
          zoomTo(that, p, locations0[p.identifier], Math.floor(Math.log(view.k) / Math.LN2) + 1);
          d3_eventPreventDefault();
        }
        touchtime = now;
      } else if (touches.length > 1) {
        var p = touches[0], q = touches[1],
            dx = p[0] - q[0], dy = p[1] - q[1];
        distance0 = dx * dx + dy * dy;
      }
    }

    function moved() {
      var touches = d3.touches(that),
          p0, l0,
          p1, l1;

      d3_selection_interrupt.call(that);

      for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
        p1 = touches[i];
        if (l1 = locations0[p1.identifier]) {
          if (l0) break;
          p0 = p1, l0 = l1;
        }
      }

      if (l1) {
        var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1,
            scale1 = distance0 && Math.sqrt(distance1 / distance0);
        p0 = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        l0 = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
        scaleTo(scale1 * scale0);
      }

      touchtime = null;
      translateTo(p0, l0);
      zoomed(dispatch);
    }

    function ended() {
      // If there are any globally-active touches remaining, remove the ended
      // touches from locations0.
      if (d3.event.touches.length) {
        var changed = d3.event.changedTouches;
        for (var i = 0, n = changed.length; i < n; ++i) {
          delete locations0[changed[i].identifier];
        }
        // If locations0 is not empty, then relocate and continue listening for
        // touchmove and touchend.
        for (var identifier in locations0) {
          return void relocate(); // locations may have detached due to rotation
        }
      }
      // Otherwise, remove touchmove and touchend listeners.
      d3.selectAll(targets).on(zoomName, null);
      subject.on(mousedown, mousedowned).on(touchstart, touchstarted);
      dragRestore();
      zoomended(dispatch);
    }
  }

  function mousewheeled() {
    var dispatch = event.of(this, arguments);
    if (mousewheelTimer) clearTimeout(mousewheelTimer);
    else d3_selection_interrupt.call(this), translate0 = location(center0 = center || d3.mouse(this)), zoomstarted(dispatch);
    mousewheelTimer = setTimeout(function() { mousewheelTimer = null; zoomended(dispatch); }, 50);
    d3_eventPreventDefault();
    scaleTo(Math.pow(2, d3_behavior_zoomDelta() * 0.002) * view.k);
    translateTo(center0, translate0);
    zoomed(dispatch);
  }

  function dblclicked() {
    var p = d3.mouse(this),
        k = Math.log(view.k) / Math.LN2;

    zoomTo(this, p, location(p), d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1);
  }

  return d3.rebind(zoom, event, "on");
};

var d3_behavior_zoomInfinity = [0, Infinity], // default scale extent
    d3_behavior_zoomDelta, // initialized lazily
    d3_behavior_zoomWheel;
function d3_functor(v) {
  return typeof v === "function" ? v : function() { return v; };
}

d3.functor = d3_functor;
d3.geom = {};
function d3_geom_pointX(d) {
  return d[0];
}

function d3_geom_pointY(d) {
  return d[1];
}

/**
 * Computes the 2D convex hull of a set of points using the monotone chain
 * algorithm:
 * http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain)
 *
 * The runtime of this algorithm is O(n log n), where n is the number of input
 * points. However in practice it outperforms other O(n log n) hulls.
 *
 * @param vertices [[x1, y1], [x2, y2], ...]
 * @returns polygon [[x1, y1], [x2, y2], ...]
 */
d3.geom.hull = function(vertices) {
  var x = d3_geom_pointX,
      y = d3_geom_pointY;

  if (arguments.length) return hull(vertices);

  function hull(data) {
    // Hull of < 3 points is not well-defined
    if (data.length < 3) return [];

    var fx = d3_functor(x),
        fy = d3_functor(y),
        i,
        n = data.length,
        points = [], // of the form [[x0, y0, 0], ..., [xn, yn, n]]
        flippedPoints = [];

    for (i = 0 ; i < n; i++) {
      points.push([+fx.call(this, data[i], i), +fy.call(this, data[i], i), i]);
    }

    // sort ascending by x-coord first, y-coord second
    points.sort(d3_geom_hullOrder);

    // we flip bottommost points across y axis so we can use the upper hull routine on both
    for (i = 0; i < n; i++) flippedPoints.push([points[i][0], -points[i][1]]);

    var upper = d3_geom_hullUpper(points),
        lower = d3_geom_hullUpper(flippedPoints);

    // construct the polygon, removing possible duplicate endpoints
    var skipLeft = lower[0] === upper[0],
        skipRight  = lower[lower.length - 1] === upper[upper.length - 1],
        polygon = [];

    // add upper hull in r->l order
    // then add lower hull in l->r order
    for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
    for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);

    return polygon;
  }

  hull.x = function(_) {
    return arguments.length ? (x = _, hull) : x;
  };

  hull.y = function(_) {
    return arguments.length ? (y = _, hull) : y;
  };

  return hull;
};

// finds the 'upper convex hull' (see wiki link above)
// assumes points arg has >=3 elements, is sorted by x, unique in y
// returns array of indices into points in left to right order
function d3_geom_hullUpper(points) {
  var n = points.length,
      hull = [0, 1],
      hs = 2; // hull size

  for (var i = 2; i < n; i++) {
    while (hs > 1 && d3_cross2d(points[hull[hs-2]], points[hull[hs-1]], points[i]) <= 0) --hs;
    hull[hs++] = i;
  }

  // we slice to make sure that the points we 'popped' from hull don't stay behind
  return hull.slice(0, hs);
}

// comparator for ascending sort by x-coord first, y-coord second
function d3_geom_hullOrder(a, b) {
  return a[0] - b[0] || a[1] - b[1];
}

d3.geom.polygon = function(coordinates) {
  d3_subclass(coordinates, d3_geom_polygonPrototype);
  return coordinates;
};

var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];

d3_geom_polygonPrototype.area = function() {
  var i = -1,
      n = this.length,
      a,
      b = this[n - 1],
      area = 0;

  while (++i < n) {
    a = b;
    b = this[i];
    area += a[1] * b[0] - a[0] * b[1];
  }

  return area * 0.5;
};

d3_geom_polygonPrototype.centroid = function(k) {
  var i = -1,
      n = this.length,
      x = 0,
      y = 0,
      a,
      b = this[n - 1],
      c;

  if (!arguments.length) k = -1 / (6 * this.area());

  while (++i < n) {
    a = b;
    b = this[i];
    c = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * c;
    y += (a[1] + b[1]) * c;
  }

  return [x * k, y * k];
};

// The Sutherland-Hodgman clipping algorithm.
// Note: requires the clip polygon to be counterclockwise and convex.
d3_geom_polygonPrototype.clip = function(subject) {
  var input,
      closed = d3_geom_polygonClosed(subject),
      i = -1,
      n = this.length - d3_geom_polygonClosed(this),
      j,
      m,
      a = this[n - 1],
      b,
      c,
      d;

  while (++i < n) {
    input = subject.slice();
    subject.length = 0;
    b = this[i];
    c = input[(m = input.length - closed) - 1];
    j = -1;
    while (++j < m) {
      d = input[j];
      if (d3_geom_polygonInside(d, a, b)) {
        if (!d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        subject.push(d);
      } else if (d3_geom_polygonInside(c, a, b)) {
        subject.push(d3_geom_polygonIntersect(c, d, a, b));
      }
      c = d;
    }
    if (closed) subject.push(subject[0]);
    a = b;
  }

  return subject;
};

function d3_geom_polygonInside(p, a, b) {
  return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
}

// Intersect two infinite lines cd and ab.
function d3_geom_polygonIntersect(c, d, a, b) {
  var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
      y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
      ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}

// Returns true if the polygon is closed.
function d3_geom_polygonClosed(coordinates) {
  var a = coordinates[0],
      b = coordinates[coordinates.length - 1];
  return !(a[0] - b[0] || a[1] - b[1]);
}
var abs = Math.abs;

d3.range = function(start, stop, step) {
  if (arguments.length < 3) {
    step = 1;
    if (arguments.length < 2) {
      stop = start;
      start = 0;
    }
  }
  if ((stop - start) / step === Infinity) throw new Error("infinite range");
  var range = [],
       k = d3_range_integerScale(abs(step)),
       i = -1,
       j;
  start *= k, stop *= k, step *= k;
  if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k);
  else while ((j = start + step * ++i) < stop) range.push(j / k);
  return range;
};

function d3_range_integerScale(x) {
  var k = 1;
  while (x * k % 1) k *= 10;
  return k;
}
d3.color = d3_color;

function d3_color() {}

d3_color.prototype.toString = function() {
  return this.rgb() + "";
};

d3.hcl = d3_hcl;

function d3_hcl(h, c, l) {
  return this instanceof d3_hcl ? void (this.h = +h, this.c = +c, this.l = +l)
      : arguments.length < 2 ? (h instanceof d3_hcl ? new d3_hcl(h.h, h.c, h.l)
      : (h instanceof d3_lab ? d3_lab_hcl(h.l, h.a, h.b)
      : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b)))
      : new d3_hcl(h, c, l);
}

var d3_hclPrototype = d3_hcl.prototype = new d3_color;

d3_hclPrototype.brighter = function(k) {
  return new d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
};

d3_hclPrototype.darker = function(k) {
  return new d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
};

d3_hclPrototype.rgb = function() {
  return d3_hcl_lab(this.h, this.c, this.l).rgb();
};

function d3_hcl_lab(h, c, l) {
  if (isNaN(h)) h = 0;
  if (isNaN(c)) c = 0;
  return new d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
}

d3.lab = d3_lab;

function d3_lab(l, a, b) {
  return this instanceof d3_lab ? void (this.l = +l, this.a = +a, this.b = +b)
      : arguments.length < 2 ? (l instanceof d3_lab ? new d3_lab(l.l, l.a, l.b)
      : (l instanceof d3_hcl ? d3_hcl_lab(l.h, l.c, l.l)
      : d3_rgb_lab((l = d3_rgb(l)).r, l.g, l.b)))
      : new d3_lab(l, a, b);
}

// Corresponds roughly to RGB brighter/darker
var d3_lab_K = 18;

// D65 standard referent
var d3_lab_X = 0.950470,
    d3_lab_Y = 1,
    d3_lab_Z = 1.088830;

var d3_labPrototype = d3_lab.prototype = new d3_color;

d3_labPrototype.brighter = function(k) {
  return new d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
};

d3_labPrototype.darker = function(k) {
  return new d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
};

d3_labPrototype.rgb = function() {
  return d3_lab_rgb(this.l, this.a, this.b);
};

function d3_lab_rgb(l, a, b) {
  var y = (l + 16) / 116,
      x = y + a / 500,
      z = y - b / 200;
  x = d3_lab_xyz(x) * d3_lab_X;
  y = d3_lab_xyz(y) * d3_lab_Y;
  z = d3_lab_xyz(z) * d3_lab_Z;
  return new d3_rgb(
    d3_xyz_rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z),
    d3_xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
    d3_xyz_rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z)
  );
}

function d3_lab_hcl(l, a, b) {
  return l > 0
      ? new d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l)
      : new d3_hcl(NaN, NaN, l);
}

function d3_lab_xyz(x) {
  return x > 0.206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
}
function d3_xyz_lab(x) {
  return x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
}

function d3_xyz_rgb(r) {
  return Math.round(255 * (r <= 0.00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055));
}

d3.rgb = d3_rgb;

function d3_rgb(r, g, b) {
  return this instanceof d3_rgb ? void (this.r = ~~r, this.g = ~~g, this.b = ~~b)
      : arguments.length < 2 ? (r instanceof d3_rgb ? new d3_rgb(r.r, r.g, r.b)
      : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb))
      : new d3_rgb(r, g, b);
}

function d3_rgbNumber(value) {
  return new d3_rgb(value >> 16, value >> 8 & 0xff, value & 0xff);
}

function d3_rgbString(value) {
  return d3_rgbNumber(value) + "";
}

var d3_rgbPrototype = d3_rgb.prototype = new d3_color;

d3_rgbPrototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  var r = this.r,
      g = this.g,
      b = this.b,
      i = 30;
  if (!r && !g && !b) return new d3_rgb(i, i, i);
  if (r && r < i) r = i;
  if (g && g < i) g = i;
  if (b && b < i) b = i;
  return new d3_rgb(Math.min(255, r / k), Math.min(255, g / k), Math.min(255, b / k));
};

d3_rgbPrototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_rgb(k * this.r, k * this.g, k * this.b);
};

d3_rgbPrototype.hsl = function() {
  return d3_rgb_hsl(this.r, this.g, this.b);
};

d3_rgbPrototype.toString = function() {
  return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
};

function d3_rgb_hex(v) {
  return v < 0x10
      ? "0" + Math.max(0, v).toString(16)
      : Math.min(255, v).toString(16);
}

function d3_rgb_parse(format, rgb, hsl) {
  var r = 0, // red channel; int in [0, 255]
      g = 0, // green channel; int in [0, 255]
      b = 0, // blue channel; int in [0, 255]
      m1, // CSS color specification match
      m2, // CSS color specification type (e.g., rgb)
      color;

  /* Handle hsl, rgb. */
  m1 = /([a-z]+)\((.*)\)/.exec(format = format.toLowerCase());
  if (m1) {
    m2 = m1[2].split(",");
    switch (m1[1]) {
      case "hsl": {
        return hsl(
          parseFloat(m2[0]), // degrees
          parseFloat(m2[1]) / 100, // percentage
          parseFloat(m2[2]) / 100 // percentage
        );
      }
      case "rgb": {
        return rgb(
          d3_rgb_parseNumber(m2[0]),
          d3_rgb_parseNumber(m2[1]),
          d3_rgb_parseNumber(m2[2])
        );
      }
    }
  }

  /* Named colors. */
  if (color = d3_rgb_names.get(format)) {
    return rgb(color.r, color.g, color.b);
  }

  /* Hexadecimal colors: #rgb and #rrggbb. */
  if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.slice(1), 16))) {
    if (format.length === 4) {
      r = (color & 0xf00) >> 4; r = (r >> 4) | r;
      g = (color & 0xf0); g = (g >> 4) | g;
      b = (color & 0xf); b = (b << 4) | b;
    } else if (format.length === 7) {
      r = (color & 0xff0000) >> 16;
      g = (color & 0xff00) >> 8;
      b = (color & 0xff);
    }
  }

  return rgb(r, g, b);
}

function d3_rgb_hsl(r, g, b) {
  var min = Math.min(r /= 255, g /= 255, b /= 255),
      max = Math.max(r, g, b),
      d = max - min,
      h,
      s,
      l = (max + min) / 2;
  if (d) {
    s = l < 0.5 ? d / (max + min) : d / (2 - max - min);
    if (r == max) h = (g - b) / d + (g < b ? 6 : 0);
    else if (g == max) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  } else {
    h = NaN;
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new d3_hsl(h, s, l);
}

function d3_rgb_lab(r, g, b) {
  r = d3_rgb_xyz(r);
  g = d3_rgb_xyz(g);
  b = d3_rgb_xyz(b);
  var x = d3_xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / d3_lab_X),
      y = d3_xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / d3_lab_Y),
      z = d3_xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / d3_lab_Z);
  return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
}

function d3_rgb_xyz(r) {
  return (r /= 255) <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
}

function d3_rgb_parseNumber(c) { // either integer or percentage
  var f = parseFloat(c);
  return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
}

var d3_rgb_names = d3.map({
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
});

d3_rgb_names.forEach(function(key, value) {
  d3_rgb_names.set(key, d3_rgbNumber(value));
});

d3.hsl = d3_hsl;

function d3_hsl(h, s, l) {
  return this instanceof d3_hsl ? void (this.h = +h, this.s = +s, this.l = +l)
      : arguments.length < 2 ? (h instanceof d3_hsl ? new d3_hsl(h.h, h.s, h.l)
      : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl))
      : new d3_hsl(h, s, l);
}

var d3_hslPrototype = d3_hsl.prototype = new d3_color;

d3_hslPrototype.brighter = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_hsl(this.h, this.s, this.l / k);
};

d3_hslPrototype.darker = function(k) {
  k = Math.pow(0.7, arguments.length ? k : 1);
  return new d3_hsl(this.h, this.s, k * this.l);
};

d3_hslPrototype.rgb = function() {
  return d3_hsl_rgb(this.h, this.s, this.l);
};

function d3_hsl_rgb(h, s, l) {
  var m1,
      m2;

  /* Some simple corrections for h, s and l. */
  h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
  s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
  l = l < 0 ? 0 : l > 1 ? 1 : l;

  /* From FvD 13.37, CSS Color Module Level 3 */
  m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s;
  m1 = 2 * l - m2;

  function v(h) {
    if (h > 360) h -= 360;
    else if (h < 0) h += 360;
    if (h < 60) return m1 + (m2 - m1) * h / 60;
    if (h < 180) return m2;
    if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
    return m1;
  }

  function vv(h) {
    return Math.round(v(h) * 255);
  }

  return new d3_rgb(vv(h + 120), vv(h), vv(h - 120));
}

d3.interpolateRgb = d3_interpolateRgb;

function d3_interpolateRgb(a, b) {
  a = d3.rgb(a);
  b = d3.rgb(b);
  var ar = a.r,
      ag = a.g,
      ab = a.b,
      br = b.r - ar,
      bg = b.g - ag,
      bb = b.b - ab;
  return function(t) {
    return "#"
        + d3_rgb_hex(Math.round(ar + br * t))
        + d3_rgb_hex(Math.round(ag + bg * t))
        + d3_rgb_hex(Math.round(ab + bb * t));
  };
}

d3.interpolateArray = d3_interpolateArray;

function d3_interpolateArray(a, b) {
  var x = [],
      c = [],
      na = a.length,
      nb = b.length,
      n0 = Math.min(a.length, b.length),
      i;
  for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
  for (; i < na; ++i) c[i] = a[i];
  for (; i < nb; ++i) c[i] = b[i];
  return function(t) {
    for (i = 0; i < n0; ++i) c[i] = x[i](t);
    return c;
  };
}
d3.interpolateNumber = d3_interpolateNumber;

function d3_interpolateNumber(a, b) {
  a = +a, b = +b;
  return function(t) { return a * (1 - t) + b * t; };
}

d3.interpolateString = d3_interpolateString;

function d3_interpolateString(a, b) {
  var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = d3_interpolate_numberA.exec(a))
      && (bm = d3_interpolate_numberB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: d3_interpolateNumber(am, bm)});
    }
    bi = d3_interpolate_numberB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2
      ? (q[0] ? (b = q[0].x, function(t) { return b(t) + ""; })
      : function() { return b; })
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");

d3.interpolate = d3_interpolate;

function d3_interpolate(a, b) {
  var i = d3.interpolators.length, f;
  while (--i >= 0 && !(f = d3.interpolators[i](a, b)));
  return f;
}

d3.interpolators = [
  function(a, b) {
    var t = typeof b;
    return (t === "string" ? (d3_rgb_names.has(b.toLowerCase()) || /^(#|rgb\(|hsl\()/i.test(b) ? d3_interpolateRgb : d3_interpolateString)
        : b instanceof d3_color ? d3_interpolateRgb
        : Array.isArray(b) ? d3_interpolateArray
        : t === "object" && isNaN(b) ? d3_interpolateObject
        : d3_interpolateNumber)(a, b);
  }
];

d3.interpolateObject = d3_interpolateObject;

function d3_interpolateObject(a, b) {
  var i = {},
      c = {},
      k;
  for (k in a) {
    if (k in b) {
      i[k] = d3_interpolate(a[k], b[k]);
    } else {
      c[k] = a[k];
    }
  }
  for (k in b) {
    if (!(k in a)) {
      c[k] = b[k];
    }
  }
  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}
d3.interpolateRound = d3_interpolateRound;

function d3_interpolateRound(a, b) {
  b -= a;
  return function(t) { return Math.round(a + b * t); };
}
function d3_uninterpolateNumber(a, b) {
  b = (b -= a = +a) || 1 / b;
  return function(x) { return (x - a) / b; };
}

function d3_uninterpolateClamp(a, b) {
  b = (b -= a = +a) || 1 / b;
  return function(x) { return Math.max(0, Math.min(1, (x - a) / b)); };
}
function d3_format_precision(x, p) {
  return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
}
d3.round = function(x, n) {
  return n
      ? Math.round(x * (n = Math.pow(10, n))) / n
      : Math.round(x);
};

var d3_formatPrefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"].map(d3_formatPrefix);

d3.formatPrefix = function(value, precision) {
  var i = 0;
  if (value = +value) {
    if (value < 0) value *= -1;
    if (precision) value = d3.round(value, d3_format_precision(value, precision));
    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
    i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
  }
  return d3_formatPrefixes[8 + i / 3];
};

function d3_formatPrefix(d, i) {
  var k = Math.pow(10, abs(8 - i) * 3);
  return {
    scale: i > 8 ? function(d) { return d / k; } : function(d) { return d * k; },
    symbol: d
  };
}

function d3_locale_numberFormat(locale) {
  var locale_decimal = locale.decimal,
      locale_thousands = locale.thousands,
      locale_grouping = locale.grouping,
      locale_currency = locale.currency,
      formatGroup = locale_grouping && locale_thousands ? function(value, width) {
        var i = value.length,
            t = [],
            j = 0,
            g = locale_grouping[0],
            length = 0;
        while (i > 0 && g > 0) {
          if (length + g + 1 > width) g = Math.max(1, width - length);
          t.push(value.substring(i -= g, i + g));
          if ((length += g + 1) > width) break;
          g = locale_grouping[j = (j + 1) % locale_grouping.length];
        }
        return t.reverse().join(locale_thousands);
      } : d3_identity;

  return function(specifier) {
    var match = d3_format_re.exec(specifier),
        fill = match[1] || " ",
        align = match[2] || ">",
        sign = match[3] || "-",
        symbol = match[4] || "",
        zfill = match[5],
        width = +match[6],
        comma = match[7],
        precision = match[8],
        type = match[9],
        scale = 1,
        prefix = "",
        suffix = "",
        integer = false,
        exponent = true;

    if (precision) precision = +precision.substring(1);

    if (zfill || fill === "0" && align === "=") {
      zfill = fill = "0";
      align = "=";
    }

    switch (type) {
      case "n": comma = true; type = "g"; break;
      case "%": scale = 100; suffix = "%"; type = "f"; break;
      case "p": scale = 100; suffix = "%"; type = "r"; break;
      case "b":
      case "o":
      case "x":
      case "X": if (symbol === "#") prefix = "0" + type.toLowerCase();
      case "c": exponent = false;
      case "d": integer = true; precision = 0; break;
      case "s": scale = -1; type = "r"; break;
    }

    if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];

    // If no precision is specified for r, fallback to general notation.
    if (type == "r" && !precision) type = "g";

    // Ensure that the requested precision is in the supported range.
    if (precision != null) {
      if (type == "g") precision = Math.max(1, Math.min(21, precision));
      else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
    }

    type = d3_format_types.get(type) || d3_format_typeDefault;

    var zcomma = zfill && comma;

    return function(value) {
      var fullSuffix = suffix;

      // Return the empty string for floats formatted as ints.
      if (integer && (value % 1)) return "";

      // Convert negative to positive, and record the sign prefix.
      var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign === "-" ? "" : sign;

      // Apply the scale, computing it from the value's exponent for si format.
      // Preserve the existing suffix, if any, such as the currency symbol.
      if (scale < 0) {
        var unit = d3.formatPrefix(value, precision);
        value = unit.scale(value);
        fullSuffix = unit.symbol + suffix;
      } else {
        value *= scale;
      }

      // Convert to the desired precision.
      value = type(value, precision);

      // Break the value into the integer part (before) and decimal part (after).
      var i = value.lastIndexOf("."),
          before,
          after;
      if (i < 0) {
        // If there is no decimal, break on "e" where appropriate.
        var j = exponent ? value.lastIndexOf("e") : -1;
        if (j < 0) before = value, after = "";
        else before = value.substring(0, j), after = value.substring(j);
      } else {
        before = value.substring(0, i);
        after = locale_decimal + value.substring(i + 1);
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (!zfill && comma) before = formatGroup(before, Infinity);

      var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length),
          padding = length < width ? new Array(length = width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (zcomma) before = formatGroup(padding + before, padding.length ? width - after.length : Infinity);

      // Apply prefix.
      negative += prefix;

      // Rejoin integer and decimal parts.
      value = before + after;

      return (align === "<" ? negative + value + padding
            : align === ">" ? padding + negative + value
            : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length)
            : negative + (zcomma ? value : padding + value)) + fullSuffix;
    };
  };
}

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;

var d3_format_types = d3.map({
  b: function(x) { return x.toString(2); },
  c: function(x) { return String.fromCharCode(x); },
  o: function(x) { return x.toString(8); },
  x: function(x) { return x.toString(16); },
  X: function(x) { return x.toString(16).toUpperCase(); },
  g: function(x, p) { return x.toPrecision(p); },
  e: function(x, p) { return x.toExponential(p); },
  f: function(x, p) { return x.toFixed(p); },
  r: function(x, p) { return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p)))); }
});

function d3_format_typeDefault(x) {
  return x + "";
}
var d3_time = d3.time = {},
    d3_date = Date;

function d3_date_utc() {
  this._ = new Date(arguments.length > 1
      ? Date.UTC.apply(this, arguments)
      : arguments[0]);
}

d3_date_utc.prototype = {
  getDate: function() { return this._.getUTCDate(); },
  getDay: function() { return this._.getUTCDay(); },
  getFullYear: function() { return this._.getUTCFullYear(); },
  getHours: function() { return this._.getUTCHours(); },
  getMilliseconds: function() { return this._.getUTCMilliseconds(); },
  getMinutes: function() { return this._.getUTCMinutes(); },
  getMonth: function() { return this._.getUTCMonth(); },
  getSeconds: function() { return this._.getUTCSeconds(); },
  getTime: function() { return this._.getTime(); },
  getTimezoneOffset: function() { return 0; },
  valueOf: function() { return this._.valueOf(); },
  setDate: function() { d3_time_prototype.setUTCDate.apply(this._, arguments); },
  setDay: function() { d3_time_prototype.setUTCDay.apply(this._, arguments); },
  setFullYear: function() { d3_time_prototype.setUTCFullYear.apply(this._, arguments); },
  setHours: function() { d3_time_prototype.setUTCHours.apply(this._, arguments); },
  setMilliseconds: function() { d3_time_prototype.setUTCMilliseconds.apply(this._, arguments); },
  setMinutes: function() { d3_time_prototype.setUTCMinutes.apply(this._, arguments); },
  setMonth: function() { d3_time_prototype.setUTCMonth.apply(this._, arguments); },
  setSeconds: function() { d3_time_prototype.setUTCSeconds.apply(this._, arguments); },
  setTime: function() { d3_time_prototype.setTime.apply(this._, arguments); }
};

var d3_time_prototype = Date.prototype;

function d3_time_interval(local, step, number) {

  function round(date) {
    var d0 = local(date), d1 = offset(d0, 1);
    return date - d0 < d1 - date ? d0 : d1;
  }

  function ceil(date) {
    step(date = local(new d3_date(date - 1)), 1);
    return date;
  }

  function offset(date, k) {
    step(date = new d3_date(+date), k);
    return date;
  }

  function range(t0, t1, dt) {
    var time = ceil(t0), times = [];
    if (dt > 1) {
      while (time < t1) {
        if (!(number(time) % dt)) times.push(new Date(+time));
        step(time, 1);
      }
    } else {
      while (time < t1) times.push(new Date(+time)), step(time, 1);
    }
    return times;
  }

  function range_utc(t0, t1, dt) {
    try {
      d3_date = d3_date_utc;
      var utc = new d3_date_utc();
      utc._ = t0;
      return range(utc, t1, dt);
    } finally {
      d3_date = Date;
    }
  }

  local.floor = local;
  local.round = round;
  local.ceil = ceil;
  local.offset = offset;
  local.range = range;

  var utc = local.utc = d3_time_interval_utc(local);
  utc.floor = utc;
  utc.round = d3_time_interval_utc(round);
  utc.ceil = d3_time_interval_utc(ceil);
  utc.offset = d3_time_interval_utc(offset);
  utc.range = range_utc;

  return local;
}

function d3_time_interval_utc(method) {
  return function(date, k) {
    try {
      d3_date = d3_date_utc;
      var utc = new d3_date_utc();
      utc._ = date;
      return method(utc, k)._;
    } finally {
      d3_date = Date;
    }
  };
}

d3_time.day = d3_time_interval(function(date) {
  var day = new d3_date(2000, 0);
  day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return day;
}, function(date, offset) {
  date.setDate(date.getDate() + offset);
}, function(date) {
  return date.getDate() - 1;
});

d3_time.days = d3_time.day.range;
d3_time.days.utc = d3_time.day.utc.range;

d3_time.dayOfYear = function(date) {
  var year = d3_time.year(date);
  return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
};

d3_time.year = d3_time_interval(function(date) {
  date = d3_time.day(date);
  date.setMonth(0, 1);
  return date;
}, function(date, offset) {
  date.setFullYear(date.getFullYear() + offset);
}, function(date) {
  return date.getFullYear();
});

d3_time.years = d3_time.year.range;
d3_time.years.utc = d3_time.year.utc.range;

["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].forEach(function(day, i) {
  i = 7 - i;

  var interval = d3_time[day] = d3_time_interval(function(date) {
    (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
    return date;
  }, function(date, offset) {
    date.setDate(date.getDate() + Math.floor(offset) * 7);
  }, function(date) {
    var day = d3_time.year(date).getDay();
    return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
  });

  d3_time[day + "s"] = interval.range;
  d3_time[day + "s"].utc = interval.utc.range;

  d3_time[day + "OfYear"] = function(date) {
    var day = d3_time.year(date).getDay();
    return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
  };
});

d3_time.week = d3_time.sunday;
d3_time.weeks = d3_time.sunday.range;
d3_time.weeks.utc = d3_time.sunday.utc.range;
d3_time.weekOfYear = d3_time.sundayOfYear;

function d3_locale_timeFormat(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_days = locale.days,
      locale_shortDays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  function d3_time_format(template) {
    var n = template.length;

    function format(date) {
      var string = [],
          i = -1,
          j = 0,
          c,
          p,
          f;
      while (++i < n) {
        if (template.charCodeAt(i) === 37) {
          string.push(template.slice(j, i));
          if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
          if (f = d3_time_formats[c]) c = f(date, p == null ? (c === "e" ? " " : "0") : p);
          string.push(c);
          j = i + 1;
        }
      }
      string.push(template.slice(j, i));
      return string.join("");
    }

    format.parse = function(string) {
      var d = {y: 1900, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0, Z: null},
          i = d3_time_parse(d, template, string, 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // If a time zone is specified, it is always relative to UTC;
      // we need to use d3_date_utc if we aren’t already.
      var localZ = d.Z != null && d3_date !== d3_date_utc,
          date = new (localZ ? d3_date_utc : d3_date);

      // Set year, month, date.
      if ("j" in d) date.setFullYear(d.y, 0, d.j);
      else if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
        date.setFullYear(d.y, 0, 1);
        date.setFullYear(d.y, 0, "W" in d
            ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7
            :  d.w          + d.U * 7 - (date.getDay() + 6) % 7);
      } else date.setFullYear(d.y, d.m, d.d);

      // Set hours, minutes, seconds and milliseconds.
      date.setHours(d.H + (d.Z / 100 | 0), d.M + d.Z % 100, d.S, d.L);

      return localZ ? date._ : date;
    };

    format.toString = function() {
      return template;
    };

    return format;
  }

  function d3_time_parse(date, template, string, j) {
    var c,
        p,
        t,
        i = 0,
        n = template.length,
        m = string.length;
    while (i < n) {
      if (j >= m) return -1;
      c = template.charCodeAt(i++);
      if (c === 37) {
        t = template.charAt(i++);
        p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
        if (!p || ((j = p(date, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }
    return j;
  }

  d3_time_format.utc = function(template) {
    var local = d3_time_format(template);

    function format(date) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date();
        utc._ = date;
        return local(utc);
      } finally {
        d3_date = Date;
      }
    }

    format.parse = function(string) {
      try {
        d3_date = d3_date_utc;
        var date = local.parse(string);
        return date && date._;
      } finally {
        d3_date = Date;
      }
    };

    format.toString = local.toString;

    return format;
  };

  d3_time_format.multi =
  d3_time_format.utc.multi = d3_time_formatMulti;

  var d3_time_periodLookup = d3.map(),
      d3_time_dayRe = d3_time_formatRe(locale_days),
      d3_time_dayLookup = d3_time_formatLookup(locale_days),
      d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays),
      d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays),
      d3_time_monthRe = d3_time_formatRe(locale_months),
      d3_time_monthLookup = d3_time_formatLookup(locale_months),
      d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths),
      d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);

  locale_periods.forEach(function(p, i) {
    d3_time_periodLookup.set(p.toLowerCase(), i);
  });

  var d3_time_formats = {
    a: function(d) { return locale_shortDays[d.getDay()]; },
    A: function(d) { return locale_days[d.getDay()]; },
    b: function(d) { return locale_shortMonths[d.getMonth()]; },
    B: function(d) { return locale_months[d.getMonth()]; },
    c: d3_time_format(locale_dateTime),
    d: function(d, p) { return d3_time_formatPad(d.getDate(), p, 2); },
    e: function(d, p) { return d3_time_formatPad(d.getDate(), p, 2); },
    H: function(d, p) { return d3_time_formatPad(d.getHours(), p, 2); },
    I: function(d, p) { return d3_time_formatPad(d.getHours() % 12 || 12, p, 2); },
    j: function(d, p) { return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3); },
    L: function(d, p) { return d3_time_formatPad(d.getMilliseconds(), p, 3); },
    m: function(d, p) { return d3_time_formatPad(d.getMonth() + 1, p, 2); },
    M: function(d, p) { return d3_time_formatPad(d.getMinutes(), p, 2); },
    p: function(d) { return locale_periods[+(d.getHours() >= 12)]; },
    S: function(d, p) { return d3_time_formatPad(d.getSeconds(), p, 2); },
    U: function(d, p) { return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2); },
    w: function(d) { return d.getDay(); },
    W: function(d, p) { return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2); },
    x: d3_time_format(locale_date),
    X: d3_time_format(locale_time),
    y: function(d, p) { return d3_time_formatPad(d.getFullYear() % 100, p, 2); },
    Y: function(d, p) { return d3_time_formatPad(d.getFullYear() % 10000, p, 4); },
    Z: d3_time_zone,
    "%": function() { return "%"; }
  };

  var d3_time_parsers = {
    a: d3_time_parseWeekdayAbbrev,
    A: d3_time_parseWeekday,
    b: d3_time_parseMonthAbbrev,
    B: d3_time_parseMonth,
    c: d3_time_parseLocaleFull,
    d: d3_time_parseDay,
    e: d3_time_parseDay,
    H: d3_time_parseHour24,
    I: d3_time_parseHour24,
    j: d3_time_parseDayOfYear,
    L: d3_time_parseMilliseconds,
    m: d3_time_parseMonthNumber,
    M: d3_time_parseMinutes,
    p: d3_time_parseAmPm,
    S: d3_time_parseSeconds,
    U: d3_time_parseWeekNumberSunday,
    w: d3_time_parseWeekdayNumber,
    W: d3_time_parseWeekNumberMonday,
    x: d3_time_parseLocaleDate,
    X: d3_time_parseLocaleTime,
    y: d3_time_parseYear,
    Y: d3_time_parseFullYear,
    Z: d3_time_parseZone,
    "%": d3_time_parseLiteralPercent
  };

  function d3_time_parseWeekdayAbbrev(date, string, i) {
    d3_time_dayAbbrevRe.lastIndex = 0;
    var n = d3_time_dayAbbrevRe.exec(string.slice(i));
    return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseWeekday(date, string, i) {
    d3_time_dayRe.lastIndex = 0;
    var n = d3_time_dayRe.exec(string.slice(i));
    return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseMonthAbbrev(date, string, i) {
    d3_time_monthAbbrevRe.lastIndex = 0;
    var n = d3_time_monthAbbrevRe.exec(string.slice(i));
    return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseMonth(date, string, i) {
    d3_time_monthRe.lastIndex = 0;
    var n = d3_time_monthRe.exec(string.slice(i));
    return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
  }

  function d3_time_parseLocaleFull(date, string, i) {
    return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
  }

  function d3_time_parseLocaleDate(date, string, i) {
    return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
  }

  function d3_time_parseLocaleTime(date, string, i) {
    return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
  }

  function d3_time_parseAmPm(date, string, i) {
    var n = d3_time_periodLookup.get(string.slice(i, i += 2).toLowerCase());
    return n == null ? -1 : (date.p = n, i);
  }

  return d3_time_format;
}

var d3_time_formatPads = {"-": "", "_": " ", "0": "0"},
    d3_time_numberRe = /^\s*\d+/, // note: ignores next directive
    d3_time_percentRe = /^%/;

function d3_time_formatPad(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function d3_time_formatRe(names) {
  return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
}

function d3_time_formatLookup(names) {
  var map = new d3_Map, i = -1, n = names.length;
  while (++i < n) map.set(names[i].toLowerCase(), i);
  return map;
}

function d3_time_parseWeekdayNumber(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 1));
  return n ? (date.w = +n[0], i + n[0].length) : -1;
}

function d3_time_parseWeekNumberSunday(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i));
  return n ? (date.U = +n[0], i + n[0].length) : -1;
}

function d3_time_parseWeekNumberMonday(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i));
  return n ? (date.W = +n[0], i + n[0].length) : -1;
}

function d3_time_parseFullYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 4));
  return n ? (date.y = +n[0], i + n[0].length) : -1;
}

function d3_time_parseYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
}

function d3_time_parseZone(date, string, i) {
  return /^[+-]\d{4}$/.test(string = string.slice(i, i + 5))
      ? (date.Z = -string, i + 5) // sign differs from getTimezoneOffset!
      : -1;
}

function d3_time_expandYear(d) {
  return d + (d > 68 ? 1900 : 2000);
}

function d3_time_parseMonthNumber(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
}

function d3_time_parseDay(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.d = +n[0], i + n[0].length) : -1;
}

function d3_time_parseDayOfYear(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 3));
  return n ? (date.j = +n[0], i + n[0].length) : -1;
}

// Note: we don't validate that the hour is in the range [0,23] or [1,12].
function d3_time_parseHour24(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.H = +n[0], i + n[0].length) : -1;
}

function d3_time_parseMinutes(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.M = +n[0], i + n[0].length) : -1;
}

function d3_time_parseSeconds(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 2));
  return n ? (date.S = +n[0], i + n[0].length) : -1;
}

function d3_time_parseMilliseconds(date, string, i) {
  d3_time_numberRe.lastIndex = 0;
  var n = d3_time_numberRe.exec(string.slice(i, i + 3));
  return n ? (date.L = +n[0], i + n[0].length) : -1;
}

// TODO table of time zone offset names?
function d3_time_zone(d) {
  var z = d.getTimezoneOffset(),
      zs = z > 0 ? "-" : "+",
      zh = abs(z) / 60 | 0,
      zm = abs(z) % 60;
  return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
}

function d3_time_parseLiteralPercent(date, string, i) {
  d3_time_percentRe.lastIndex = 0;
  var n = d3_time_percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function d3_time_formatMulti(formats) {
  var n = formats.length, i = -1;
  while (++i < n) formats[i][0] = this(formats[i][0]);
  return function(date) {
    var i = 0, f = formats[i];
    while (!f[1](date)) f = formats[++i];
    return f[0](date);
  };
}

d3.locale = function(locale) {
  return {
    numberFormat: d3_locale_numberFormat(locale),
    timeFormat: d3_locale_timeFormat(locale)
  };
};

var d3_locale_enUS = d3.locale({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""],
  dateTime: "%a %b %e %X %Y",
  date: "%m/%d/%Y",
  time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

d3.format = d3_locale_enUS.numberFormat;
function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
  var u = uninterpolate(domain[0], domain[1]),
      i = interpolate(range[0], range[1]);
  return function(x) {
    return i(u(x));
  };
}

function d3_scale_nice(domain, nice) {
  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      dx;

  if (x1 < x0) {
    dx = i0, i0 = i1, i1 = dx;
    dx = x0, x0 = x1, x1 = dx;
  }

  domain[i0] = nice.floor(x0);
  domain[i1] = nice.ceil(x1);
  return domain;
}

function d3_scale_niceStep(step) {
  return step ? {
    floor: function(x) { return Math.floor(x / step) * step; },
    ceil: function(x) { return Math.ceil(x / step) * step; }
  } : d3_scale_niceIdentity;
}

var d3_scale_niceIdentity = {
  floor: d3_identity,
  ceil: d3_identity
};

function d3_bisector(compare) {
  return {
    left: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (arguments.length < 3) lo = 0;
      if (arguments.length < 4) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

var d3_bisect = d3_bisector(d3_ascending);
d3.bisectLeft = d3_bisect.left;
d3.bisect = d3.bisectRight = d3_bisect.right;

d3.bisector = function(f) {
  return d3_bisector(f.length === 1
      ? function(d, x) { return d3_ascending(f(d), x); }
      : f);
};

function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
  var u = [],
      i = [],
      j = 0,
      k = Math.min(domain.length, range.length) - 1;

  // Handle descending domains.
  if (domain[k] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++j <= k) {
    u.push(uninterpolate(domain[j - 1], domain[j]));
    i.push(interpolate(range[j - 1], range[j]));
  }

  return function(x) {
    var j = d3.bisect(domain, x, 1, k) - 1;
    return i[j](u[j](x));
  };
}
d3.scale = {};

function d3_scaleExtent(domain) {
  var start = domain[0], stop = domain[domain.length - 1];
  return start < stop ? [start, stop] : [stop, start];
}

function d3_scaleRange(scale) {
  return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
}

d3.scale.linear = function() {
  return d3_scale_linear([0, 1], [0, 1], d3_interpolate, false);
};

function d3_scale_linear(domain, range, interpolate, clamp) {
  var output,
      input;

  function rescale() {
    var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear,
        uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
    output = linear(domain, range, uninterpolate, interpolate);
    input = linear(range, domain, uninterpolate, d3_interpolate);
    return scale;
  }

  function scale(x) {
    return output(x);
  }

  // Note: requires range is coercible to number!
  scale.invert = function(y) {
    return input(y);
  };

  scale.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x.map(Number);
    return rescale();
  };

  scale.range = function(x) {
    if (!arguments.length) return range;
    range = x;
    return rescale();
  };

  scale.rangeRound = function(x) {
    return scale.range(x).interpolate(d3_interpolateRound);
  };

  scale.clamp = function(x) {
    if (!arguments.length) return clamp;
    clamp = x;
    return rescale();
  };

  scale.interpolate = function(x) {
    if (!arguments.length) return interpolate;
    interpolate = x;
    return rescale();
  };

  scale.ticks = function(m) {
    return d3_scale_linearTicks(domain, m);
  };

  scale.tickFormat = function(m, format) {
    return d3_scale_linearTickFormat(domain, m, format);
  };

  scale.nice = function(m) {
    d3_scale_linearNice(domain, m);
    return rescale();
  };

  scale.copy = function() {
    return d3_scale_linear(domain, range, interpolate, clamp);
  };

  return rescale();
}

function d3_scale_linearRebind(scale, linear) {
  return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
}

function d3_scale_linearNice(domain, m) {
  d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
  d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
  return domain;
}

function d3_scale_linearTickRange(domain, m) {
  if (m == null) m = 10;

  var extent = d3_scaleExtent(domain),
      span = extent[1] - extent[0],
      step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)),
      err = m / span * step;

  // Filter ticks to get closer to the desired count.
  if (err <= 0.15) step *= 10;
  else if (err <= 0.35) step *= 5;
  else if (err <= 0.75) step *= 2;

  // Round start and stop values to step interval.
  extent[0] = Math.ceil(extent[0] / step) * step;
  extent[1] = Math.floor(extent[1] / step) * step + step * 0.5; // inclusive
  extent[2] = step;
  return extent;
}

function d3_scale_linearTicks(domain, m) {
  return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
}

function d3_scale_linearTickFormat(domain, m, format) {
  var range = d3_scale_linearTickRange(domain, m);
  if (format) {
    var match = d3_format_re.exec(format);
    match.shift();
    if (match[8] === "s") {
      var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
      if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
      match[8] = "f";
      format = d3.format(match.join(""));
      return function(d) {
        return format(prefix.scale(d)) + prefix.symbol;
      };
    }
    if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
    format = match.join("");
  } else {
    format = ",." + d3_scale_linearPrecision(range[2]) + "f";
  }
  return d3.format(format);
}

var d3_scale_linearFormatSignificant = {s: 1, g: 1, p: 1, r: 1, e: 1};

// Returns the number of significant digits after the decimal point.
function d3_scale_linearPrecision(value) {
  return -Math.floor(Math.log(value) / Math.LN10 + 0.01);
}

// For some format types, the precision specifies the number of significant
// digits; for others, it specifies the number of digits after the decimal
// point. For significant format types, the desired precision equals one plus
// the difference between the decimal precision of the range’s maximum absolute
// value and the tick step’s decimal precision. For format "e", the digit before
// the decimal point counts as one.
function d3_scale_linearFormatPrecision(type, range) {
  var p = d3_scale_linearPrecision(range[2]);
  return type in d3_scale_linearFormatSignificant
      ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e")
      : p - (type === "%") * 2;
}

d3.scale.log = function() {
  return d3_scale_log(d3.scale.linear().domain([0, 1]), 10, true, [1, 10]);
};

function d3_scale_log(linear, base, positive, domain) {

  function log(x) {
    return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);
  }

  function pow(x) {
    return positive ? Math.pow(base, x) : -Math.pow(base, -x);
  }

  function scale(x) {
    return linear(log(x));
  }

  scale.invert = function(x) {
    return pow(linear.invert(x));
  };

  scale.domain = function(x) {
    if (!arguments.length) return domain;
    positive = x[0] >= 0;
    linear.domain((domain = x.map(Number)).map(log));
    return scale;
  };

  scale.base = function(_) {
    if (!arguments.length) return base;
    base = +_;
    linear.domain(domain.map(log));
    return scale;
  };

  scale.nice = function() {
    var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);
    linear.domain(niced); // do not modify the linear scale’s domain in-place!
    domain = niced.map(pow);
    return scale;
  };

  scale.ticks = function() {
    var extent = d3_scaleExtent(domain),
        ticks = [],
        u = extent[0],
        v = extent[1],
        i = Math.floor(log(u)),
        j = Math.ceil(log(v)),
        n = base % 1 ? 2 : base;
    if (isFinite(j - i)) {
      if (positive) {
        for (; i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);
        ticks.push(pow(i));
      } else {
        ticks.push(pow(i));
        for (; i++ < j;) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);
      }
      for (i = 0; ticks[i] < u; i++) {} // strip small values
      for (j = ticks.length; ticks[j - 1] > v; j--) {} // strip big values
      ticks = ticks.slice(i, j);
    }
    return ticks;
  };

  scale.tickFormat = function(n, format) {
    if (!arguments.length) return d3_scale_logFormat;
    if (arguments.length < 2) format = d3_scale_logFormat;
    else if (typeof format !== "function") format = d3.format(format);
    var k = Math.max(1, base * n / scale.ticks().length);
    return function(d) {
      var i = d / pow(Math.round(log(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? format(d) : "";
    };
  };

  scale.copy = function() {
    return d3_scale_log(linear.copy(), base, positive, domain);
  };

  return d3_scale_linearRebind(scale, linear);
}

var d3_scale_logFormat = d3.format(".0e"),
    d3_scale_logNiceNegative = {floor: function(x) { return -Math.ceil(-x); }, ceil: function(x) { return -Math.floor(-x); }};

var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;
function d3_true() {
  return true;
}

d3_time.hour = d3_time_interval(function(date) {
  var timezone = date.getTimezoneOffset() / 60;
  return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 36e5); // DST breaks setHours
}, function(date) {
  return date.getHours();
});

d3_time.hours = d3_time.hour.range;
d3_time.hours.utc = d3_time.hour.utc.range;

d3_time.minute = d3_time_interval(function(date) {
  return new d3_date(Math.floor(date / 6e4) * 6e4);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 6e4); // DST breaks setMinutes
}, function(date) {
  return date.getMinutes();
});

d3_time.minutes = d3_time.minute.range;
d3_time.minutes.utc = d3_time.minute.utc.range;

d3_time.month = d3_time_interval(function(date) {
  date = d3_time.day(date);
  date.setDate(1);
  return date;
}, function(date, offset) {
  date.setMonth(date.getMonth() + offset);
}, function(date) {
  return date.getMonth();
});

d3_time.months = d3_time.month.range;
d3_time.months.utc = d3_time.month.utc.range;

d3_time.second = d3_time_interval(function(date) {
  return new d3_date(Math.floor(date / 1e3) * 1e3);
}, function(date, offset) {
  date.setTime(date.getTime() + Math.floor(offset) * 1e3); // DST breaks setSeconds
}, function(date) {
  return date.getSeconds();
});

d3_time.seconds = d3_time.second.range;
d3_time.seconds.utc = d3_time.second.utc.range;

function d3_time_scale(linear, methods, format) {

  function scale(x) {
    return linear(x);
  }

  scale.invert = function(x) {
    return d3_time_scaleDate(linear.invert(x));
  };

  scale.domain = function(x) {
    if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
    linear.domain(x);
    return scale;
  };

  function tickMethod(extent, count) {
    var span = extent[1] - extent[0],
        target = span / count,
        i = d3.bisect(d3_time_scaleSteps, target);
    return i == d3_time_scaleSteps.length ? [methods.year, d3_scale_linearTickRange(extent.map(function(d) { return d / 31536e6; }), count)[2]]
        : !i ? [d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2]]
        : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
  }

  scale.nice = function(interval, skip) {
    var domain = scale.domain(),
        extent = d3_scaleExtent(domain),
        method = interval == null ? tickMethod(extent, 10)
          : typeof interval === "number" && tickMethod(extent, interval);

    if (method) interval = method[0], skip = method[1];

    function skipped(date) {
      return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
    }

    return scale.domain(d3_scale_nice(domain, skip > 1 ? {
      floor: function(date) {
        while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
        return date;
      },
      ceil: function(date) {
        while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
        return date;
      }
    } : interval));
  };

  scale.ticks = function(interval, skip) {
    var extent = d3_scaleExtent(scale.domain()),
        method = interval == null ? tickMethod(extent, 10)
          : typeof interval === "number" ? tickMethod(extent, interval)
          : !interval.range && [{range: interval}, skip]; // assume deprecated range function

    if (method) interval = method[0], skip = method[1];

    return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip); // inclusive upper bound
  };

  scale.tickFormat = function() {
    return format;
  };

  scale.copy = function() {
    return d3_time_scale(linear.copy(), methods, format);
  };

  return d3_scale_linearRebind(scale, linear);
}

function d3_time_scaleDate(t) {
  return new Date(t);
}

var d3_time_scaleSteps = [
  1e3,    // 1-second
  5e3,    // 5-second
  15e3,   // 15-second
  3e4,    // 30-second
  6e4,    // 1-minute
  3e5,    // 5-minute
  9e5,    // 15-minute
  18e5,   // 30-minute
  36e5,   // 1-hour
  108e5,  // 3-hour
  216e5,  // 6-hour
  432e5,  // 12-hour
  864e5,  // 1-day
  1728e5, // 2-day
  6048e5, // 1-week
  2592e6, // 1-month
  7776e6, // 3-month
  31536e6 // 1-year
];

var d3_time_scaleLocalMethods = [
  [d3_time.second, 1],
  [d3_time.second, 5],
  [d3_time.second, 15],
  [d3_time.second, 30],
  [d3_time.minute, 1],
  [d3_time.minute, 5],
  [d3_time.minute, 15],
  [d3_time.minute, 30],
  [d3_time.hour, 1],
  [d3_time.hour, 3],
  [d3_time.hour, 6],
  [d3_time.hour, 12],
  [d3_time.day, 1],
  [d3_time.day, 2],
  [d3_time.week, 1],
  [d3_time.month, 1],
  [d3_time.month, 3],
  [d3_time.year, 1]
];

var d3_time_scaleLocalFormat = d3_time_format.multi([
  [".%L", function(d) { return d.getMilliseconds(); }],
  [":%S", function(d) { return d.getSeconds(); }],
  ["%I:%M", function(d) { return d.getMinutes(); }],
  ["%I %p", function(d) { return d.getHours(); }],
  ["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
  ["%b %d", function(d) { return d.getDate() != 1; }],
  ["%B", function(d) { return d.getMonth(); }],
  ["%Y", d3_true]
]);

var d3_time_scaleMilliseconds = {
  range: function(start, stop, step) { return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate); },
  floor: d3_identity,
  ceil: d3_identity
};

d3_time_scaleLocalMethods.year = d3_time.year;

d3_time.scale = function() {
  return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
};

d3.transform = function(string) {
  var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
  return (d3.transform = function(string) {
    if (string != null) {
      g.setAttribute("transform", string);
      var t = g.transform.baseVal.consolidate();
    }
    return new d3_transform(t ? t.matrix : d3_transformIdentity);
  })(string);
};

// Compute x-scale and normalize the first row.
// Compute shear and make second row orthogonal to first.
// Compute y-scale and normalize the second row.
// Finally, compute the rotation.
function d3_transform(m) {
  var r0 = [m.a, m.b],
      r1 = [m.c, m.d],
      kx = d3_transformNormalize(r0),
      kz = d3_transformDot(r0, r1),
      ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
  if (r0[0] * r1[1] < r1[0] * r0[1]) {
    r0[0] *= -1;
    r0[1] *= -1;
    kx *= -1;
    kz *= -1;
  }
  this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
  this.translate = [m.e, m.f];
  this.scale = [kx, ky];
  this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
};

d3_transform.prototype.toString = function() {
  return "translate(" + this.translate
      + ")rotate(" + this.rotate
      + ")skewX(" + this.skew
      + ")scale(" + this.scale
      + ")";
};

function d3_transformDot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

function d3_transformNormalize(a) {
  var k = Math.sqrt(d3_transformDot(a, a));
  if (k) {
    a[0] /= k;
    a[1] /= k;
  }
  return k;
}

function d3_transformCombine(a, b, k) {
  a[0] += k * b[0];
  a[1] += k * b[1];
  return a;
}

var d3_transformIdentity = {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0};

d3.interpolateTransform = d3_interpolateTransform;

function d3_interpolateTransformPop(s) {
  return s.length ? s.pop() + "," : "";
}

function d3_interpolateTranslate(ta, tb, s, q) {
  if (ta[0] !== tb[0] || ta[1] !== tb[1]) {
    var i = s.push("translate(", null, ",", null, ")");
    q.push({i: i - 4, x: d3_interpolateNumber(ta[0], tb[0])}, {i: i - 2, x: d3_interpolateNumber(ta[1], tb[1])});
  } else if (tb[0] || tb[1]) {
    s.push("translate(" + tb + ")");
  }
}

function d3_interpolateRotate(ra, rb, s, q) {
  if (ra !== rb) {
    if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360; // shortest path
    q.push({i: s.push(d3_interpolateTransformPop(s) + "rotate(", null, ")") - 2, x: d3_interpolateNumber(ra, rb)});
  } else if (rb) {
    s.push(d3_interpolateTransformPop(s) + "rotate(" + rb + ")");
  }
}

function d3_interpolateSkew(wa, wb, s, q) {
  if (wa !== wb) {
    q.push({i: s.push(d3_interpolateTransformPop(s) + "skewX(", null, ")") - 2, x: d3_interpolateNumber(wa, wb)});
  } else if (wb) {
    s.push(d3_interpolateTransformPop(s) + "skewX(" + wb + ")");
  }
}

function d3_interpolateScale(ka, kb, s, q) {
  if (ka[0] !== kb[0] || ka[1] !== kb[1]) {
    var i = s.push(d3_interpolateTransformPop(s) + "scale(", null, ",", null, ")");
    q.push({i: i - 4, x: d3_interpolateNumber(ka[0], kb[0])}, {i: i - 2, x: d3_interpolateNumber(ka[1], kb[1])});
  } else if (kb[0] !== 1 || kb[1] !== 1) {
    s.push(d3_interpolateTransformPop(s) + "scale(" + kb + ")");
  }
}

function d3_interpolateTransform(a, b) {
  var s = [], // string constants and placeholders
      q = []; // number interpolators
  a = d3.transform(a), b = d3.transform(b);
  d3_interpolateTranslate(a.translate, b.translate, s, q);
  d3_interpolateRotate(a.rotate, b.rotate, s, q);
  d3_interpolateSkew(a.skew, b.skew, s, q);
  d3_interpolateScale(a.scale, b.scale, s, q);
  a = b = null; // gc
  return function(t) {
    var i = -1, n = q.length, o;
    while (++i < n) s[(o = q[i]).i] = o.x(t);
    return s.join("");
  };
}

var d3_timer_queueHead,
    d3_timer_queueTail,
    d3_timer_interval, // is an interval (or frame) active?
    d3_timer_timeout, // is a timeout active?
    d3_timer_frame = this[d3_vendorSymbol(this, "requestAnimationFrame")] || function(callback) { setTimeout(callback, 17); };

// The timer will continue to fire until callback returns true.
d3.timer = function() {
  d3_timer.apply(this, arguments);
};

function d3_timer(callback, delay, then) {
  var n = arguments.length;
  if (n < 2) delay = 0;
  if (n < 3) then = Date.now();

  // Add the callback to the tail of the queue.
  var time = then + delay, timer = {c: callback, t: time, n: null};
  if (d3_timer_queueTail) d3_timer_queueTail.n = timer;
  else d3_timer_queueHead = timer;
  d3_timer_queueTail = timer;

  // Start animatin'!
  if (!d3_timer_interval) {
    d3_timer_timeout = clearTimeout(d3_timer_timeout);
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }

  return timer;
}

function d3_timer_step() {
  var now = d3_timer_mark(),
      delay = d3_timer_sweep() - now;
  if (delay > 24) {
    if (isFinite(delay)) {
      clearTimeout(d3_timer_timeout);
      d3_timer_timeout = setTimeout(d3_timer_step, delay);
    }
    d3_timer_interval = 0;
  } else {
    d3_timer_interval = 1;
    d3_timer_frame(d3_timer_step);
  }
}

d3.timer.flush = function() {
  d3_timer_mark();
  d3_timer_sweep();
};

function d3_timer_mark() {
  var now = Date.now(),
      timer = d3_timer_queueHead;
  while (timer) {
    if (now >= timer.t && timer.c(now - timer.t)) timer.c = null;
    timer = timer.n;
  }
  return now;
}

// Flush after callbacks to avoid concurrent queue modification.
// Returns the time of the earliest active timer, post-sweep.
function d3_timer_sweep() {
  var t0,
      t1 = d3_timer_queueHead,
      time = Infinity;
  while (t1) {
    if (t1.c) {
      if (t1.t < time) time = t1.t;
      t1 = (t0 = t1).n;
    } else {
      t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
    }
  }
  d3_timer_queueTail = t0;
  return time;
}

function d3_transition(groups, ns, id) {
  d3_subclass(groups, d3_transitionPrototype);

  // Note: read-only!
  groups.namespace = ns;
  groups.id = id;

  return groups;
}

var d3_transitionPrototype = [],
    d3_transitionId = 0,
    d3_transitionInheritId,
    d3_transitionInherit;

d3_transitionPrototype.call = d3_selectionPrototype.call;
d3_transitionPrototype.empty = d3_selectionPrototype.empty;
d3_transitionPrototype.node = d3_selectionPrototype.node;
d3_transitionPrototype.size = d3_selectionPrototype.size;

d3.transition = function(selection, name) {
  return selection && selection.transition
      ? (d3_transitionInheritId ? selection.transition(name) : selection)
      : d3.selection().transition(selection);
};

d3.transition.prototype = d3_transitionPrototype;


d3_transitionPrototype.selectAll = function(selector) {
  var id = this.id,
      ns = this.namespace,
      subgroups = [],
      subgroup,
      subnodes,
      node,
      subnode,
      transition;

  selector = d3_selection_selectorAll(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if (node = group[i]) {
        transition = node[ns][id];
        subnodes = selector.call(node, node.__data__, i, j);
        subgroups.push(subgroup = []);
        for (var k = -1, o = subnodes.length; ++k < o;) {
          if (subnode = subnodes[k]) d3_transitionNode(subnode, k, ns, id, transition);
          subgroup.push(subnode);
        }
      }
    }
  }

  return d3_transition(subgroups, ns, id);
};

d3_transitionPrototype.filter = function(filter) {
  var subgroups = [],
      subgroup,
      group,
      node;

  if (typeof filter !== "function") filter = d3_selection_filter(filter);

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
        subgroup.push(node);
      }
    }
  }

  return d3_transition(subgroups, this.namespace, this.id);
};

d3_transitionPrototype.tween = function(name, tween) {
  var id = this.id, ns = this.namespace;
  if (arguments.length < 2) return this.node()[ns][id].tween.get(name);
  return d3_selection_each(this, tween == null
        ? function(node) { node[ns][id].tween.remove(name); }
        : function(node) { node[ns][id].tween.set(name, tween); });
};

function d3_transition_tween(groups, name, value, tween) {
  var id = groups.id, ns = groups.namespace;
  return d3_selection_each(groups, typeof value === "function"
      ? function(node, i, j) { node[ns][id].tween.set(name, tween(value.call(node, node.__data__, i, j))); }
      : (value = tween(value), function(node) { node[ns][id].tween.set(name, value); }));
}

d3_transitionPrototype.attr = function(nameNS, value) {
  if (arguments.length < 2) {

    // For attr(object), the object specifies the names and values of the
    // attributes to transition. The values may be functions that are
    // evaluated for each element.
    for (value in nameNS) this.attr(value, nameNS[value]);
    return this;
  }

  var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate,
      name = d3.ns.qualify(nameNS);

  // For attr(string, null), remove the attribute with the specified name.
  function attrNull() {
    this.removeAttribute(name);
  }
  function attrNullNS() {
    this.removeAttributeNS(name.space, name.local);
  }

  // For attr(string, string), set the attribute with the specified name.
  function attrTween(b) {
    return b == null ? attrNull : (b += "", function() {
      var a = this.getAttribute(name), i;
      return a !== b && (i = interpolate(a, b), function(t) { this.setAttribute(name, i(t)); });
    });
  }
  function attrTweenNS(b) {
    return b == null ? attrNullNS : (b += "", function() {
      var a = this.getAttributeNS(name.space, name.local), i;
      return a !== b && (i = interpolate(a, b), function(t) { this.setAttributeNS(name.space, name.local, i(t)); });
    });
  }

  return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
};

d3_transitionPrototype.attrTween = function(nameNS, tween) {
  var name = d3.ns.qualify(nameNS);

  function attrTween(d, i) {
    var f = tween.call(this, d, i, this.getAttribute(name));
    return f && function(t) { this.setAttribute(name, f(t)); };
  }
  function attrTweenNS(d, i) {
    var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
    return f && function(t) { this.setAttributeNS(name.space, name.local, f(t)); };
  }

  return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
};

d3_transitionPrototype.style = function(name, value, priority) {
  var n = arguments.length;
  if (n < 3) {

    // For style(object) or style(object, string), the object specifies the
    // names and values of the attributes to set or remove. The values may be
    // functions that are evaluated for each element. The optional string
    // specifies the priority.
    if (typeof name !== "string") {
      if (n < 2) value = "";
      for (priority in name) this.style(priority, name[priority], value);
      return this;
    }

    // For style(string, string) or style(string, function), use the default
    // priority. The priority is ignored for style(string, null).
    priority = "";
  }

  // For style(name, null) or style(name, null, priority), remove the style
  // property with the specified name. The priority is ignored.
  function styleNull() {
    this.style.removeProperty(name);
  }

  // For style(name, string) or style(name, string, priority), set the style
  // property with the specified name, using the specified priority.
  // Otherwise, a name, value and priority are specified, and handled as below.
  function styleString(b) {
    return b == null ? styleNull : (b += "", function() {
      var a = d3_window(this).getComputedStyle(this, null).getPropertyValue(name), i;
      return a !== b && (i = d3_interpolate(a, b), function(t) { this.style.setProperty(name, i(t), priority); });
    });
  }

  return d3_transition_tween(this, "style." + name, value, styleString);
};

d3_transitionPrototype.styleTween = function(name, tween, priority) {
  if (arguments.length < 3) priority = "";

  function styleTween(d, i) {
    var f = tween.call(this, d, i, d3_window(this).getComputedStyle(this, null).getPropertyValue(name));
    return f && function(t) { this.style.setProperty(name, f(t), priority); };
  }

  return this.tween("style." + name, styleTween);
};

d3_transitionPrototype.text = function(value) {
  return d3_transition_tween(this, "text", value, d3_transition_text);
};

function d3_transition_text(b) {
  if (b == null) b = "";
  return function() { this.textContent = b; };
}

d3_transitionPrototype.remove = function() {
  var ns = this.namespace;
  return this.each("end.transition", function() {
    var p;
    if (this[ns].count < 2 && (p = this.parentNode)) p.removeChild(this);
  });
};

var d3_ease_default = function() { return d3_identity; };

var d3_ease = d3.map({
  linear: d3_ease_default,
  poly: d3_ease_poly,
  quad: function() { return d3_ease_quad; },
  cubic: function() { return d3_ease_cubic; },
  sin: function() { return d3_ease_sin; },
  exp: function() { return d3_ease_exp; },
  circle: function() { return d3_ease_circle; },
  elastic: d3_ease_elastic,
  back: d3_ease_back,
  bounce: function() { return d3_ease_bounce; }
});

var d3_ease_mode = d3.map({
  "in": d3_identity,
  "out": d3_ease_reverse,
  "in-out": d3_ease_reflect,
  "out-in": function(f) { return d3_ease_reflect(d3_ease_reverse(f)); }
});

d3.ease = function(name) {
  var i = name.indexOf("-"),
      t = i >= 0 ? name.slice(0, i) : name,
      m = i >= 0 ? name.slice(i + 1) : "in";
  t = d3_ease.get(t) || d3_ease_default;
  m = d3_ease_mode.get(m) || d3_identity;
  return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
};

function d3_ease_clamp(f) {
  return function(t) {
    return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
  };
}

function d3_ease_reverse(f) {
  return function(t) {
    return 1 - f(1 - t);
  };
}

function d3_ease_reflect(f) {
  return function(t) {
    return 0.5 * (t < 0.5 ? f(2 * t) : (2 - f(2 - 2 * t)));
  };
}

function d3_ease_quad(t) {
  return t * t;
}

function d3_ease_cubic(t) {
  return t * t * t;
}

// Optimized clamp(reflect(poly(3))).
function d3_ease_cubicInOut(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  var t2 = t * t, t3 = t2 * t;
  return 4 * (t < 0.5 ? t3 : 3 * (t - t2) + t3 - 0.75);
}

function d3_ease_poly(e) {
  return function(t) {
    return Math.pow(t, e);
  };
}

function d3_ease_sin(t) {
  return 1 - Math.cos(t * halfπ);
}

function d3_ease_exp(t) {
  return Math.pow(2, 10 * (t - 1));
}

function d3_ease_circle(t) {
  return 1 - Math.sqrt(1 - t * t);
}

function d3_ease_elastic(a, p) {
  var s;
  if (arguments.length < 2) p = 0.45;
  if (arguments.length) s = p / τ * Math.asin(1 / a);
  else a = 1, s = p / 4;
  return function(t) {
    return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);
  };
}

function d3_ease_back(s) {
  if (!s) s = 1.70158;
  return function(t) {
    return t * t * ((s + 1) * t - s);
  };
}

function d3_ease_bounce(t) {
  return t < 1 / 2.75 ? 7.5625 * t * t
      : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
      : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
      : 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
}

d3_transitionPrototype.ease = function(value) {
  var id = this.id, ns = this.namespace;
  if (arguments.length < 1) return this.node()[ns][id].ease;
  if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
  return d3_selection_each(this, function(node) { node[ns][id].ease = value; });
};

d3_transitionPrototype.delay = function(value) {
  var id = this.id, ns = this.namespace;
  if (arguments.length < 1) return this.node()[ns][id].delay;
  return d3_selection_each(this, typeof value === "function"
      ? function(node, i, j) { node[ns][id].delay = +value.call(node, node.__data__, i, j); }
      : (value = +value, function(node) { node[ns][id].delay = value; }));
};

d3_transitionPrototype.duration = function(value) {
  var id = this.id, ns = this.namespace;
  if (arguments.length < 1) return this.node()[ns][id].duration;
  return d3_selection_each(this, typeof value === "function"
      ? function(node, i, j) { node[ns][id].duration = Math.max(1, value.call(node, node.__data__, i, j)); }
      : (value = Math.max(1, value), function(node) { node[ns][id].duration = value; }));
};

d3_transitionPrototype.each = function(type, listener) {
  var id = this.id, ns = this.namespace;
  if (arguments.length < 2) {
    var inherit = d3_transitionInherit,
        inheritId = d3_transitionInheritId;
    try {
      d3_transitionInheritId = id;
      d3_selection_each(this, function(node, i, j) {
        d3_transitionInherit = node[ns][id];
        type.call(node, node.__data__, i, j);
      });
    } finally {
      d3_transitionInherit = inherit;
      d3_transitionInheritId = inheritId;
    }
  } else {
    d3_selection_each(this, function(node) {
      var transition = node[ns][id];
      (transition.event || (transition.event = d3.dispatch("start", "end", "interrupt"))).on(type, listener);
    });
  }
  return this;
};

d3_transitionPrototype.transition = function() {
  var id0 = this.id,
      id1 = ++d3_transitionId,
      ns = this.namespace,
      subgroups = [],
      subgroup,
      group,
      node,
      transition;

  for (var j = 0, m = this.length; j < m; j++) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = 0, n = group.length; i < n; i++) {
      if (node = group[i]) {
        transition = node[ns][id0];
        d3_transitionNode(node, i, ns, id1, {time: transition.time, ease: transition.ease, delay: transition.delay + transition.duration, duration: transition.duration});
      }
      subgroup.push(node);
    }
  }

  return d3_transition(subgroups, ns, id1);
};

function d3_transitionNamespace(name) {
  return name == null ? "__transition__" : "__transition_" + name + "__";
}

function d3_transitionNode(node, i, ns, id, inherit) {
  var lock = node[ns] || (node[ns] = {active: 0, count: 0}),
      transition = lock[id],
      time,
      timer,
      duration,
      ease,
      tweens;

  function schedule(elapsed) {
    var delay = transition.delay;
    timer.t = delay + time;
    if (delay <= elapsed) return start(elapsed - delay);
    timer.c = start;
  }

  function start(elapsed) {

    // Interrupt the active transition, if any.
    var activeId = lock.active,
        active = lock[activeId];
    if (active) {
      active.timer.c = null;
      active.timer.t = NaN;
      --lock.count;
      delete lock[activeId];
      active.event && active.event.interrupt.call(node, node.__data__, active.index);
    }

    // Cancel any pre-empted transitions. No interrupt event is dispatched
    // because the cancelled transitions never started.
    for (var cancelId in lock) {
      if (+cancelId < id) {
        var cancel = lock[cancelId];
        cancel.timer.c = null;
        cancel.timer.t = NaN;
        --lock.count;
        delete lock[cancelId];
      }
    }

    // Defer tween invocation to end of current frame; see mbostock/d3#1576.
    // Note that this transition may be canceled before then!
    // This must be scheduled before the start event; see d3/d3-transition#16!
    timer.c = tick;
    d3_timer(function() {
      if (timer.c && tick(elapsed || 1)) {
        timer.c = null;
        timer.t = NaN;
      }
      return 1;
    }, 0, time);

    // Start the transition.
    lock.active = id;
    transition.event && transition.event.start.call(node, node.__data__, i);

    // Initialize the tweens.
    tweens = [];
    transition.tween.forEach(function(key, value) {
      if (value = value.call(node, node.__data__, i)) {
        tweens.push(value);
      }
    });

    // Defer capture to allow tween initialization to set ease & duration.
    ease = transition.ease;
    duration = transition.duration;
  }

  function tick(elapsed) {
    var t = elapsed / duration,
        e = ease(t),
        n = tweens.length;

    while (n > 0) {
      tweens[--n].call(node, e);
    }

    if (t >= 1) {
      transition.event && transition.event.end.call(node, node.__data__, i);
      if (--lock.count) delete lock[id];
      else delete node[ns];
      return 1;
    }
  }

  if (!transition) {
    time = inherit.time;
    timer = d3_timer(schedule, 0, time);

    transition = lock[id] = {
      tween: new d3_Map,
      time: time,
      timer: timer,
      delay: inherit.delay,
      duration: inherit.duration,
      ease: inherit.ease,
      index: i
    };

    inherit = null; // allow gc

    ++lock.count;
  }
}

d3_transitionPrototype.select = function(selector) {
  var id = this.id,
      ns = this.namespace,
      subgroups = [],
      subgroup,
      subnode,
      node;

  selector = d3_selection_selector(selector);

  for (var j = -1, m = this.length; ++j < m;) {
    subgroups.push(subgroup = []);
    for (var group = this[j], i = -1, n = group.length; ++i < n;) {
      if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        d3_transitionNode(subnode, i, ns, id, node[ns][id]);
        subgroup.push(subnode);
      } else {
        subgroup.push(null);
      }
    }
  }

  return d3_transition(subgroups, ns, id);
};
d3.svg = {};

function d3_svg_line(projection) {
  var x = d3_geom_pointX,
      y = d3_geom_pointY,
      defined = d3_true,
      interpolate = d3_svg_lineLinear,
      interpolateKey = interpolate.key,
      tension = 0.7;

  function line(data) {
    var segments = [],
        points = [],
        i = -1,
        n = data.length,
        d,
        fx = d3_functor(x),
        fy = d3_functor(y);

    function segment() {
      segments.push("M", interpolate(projection(points), tension));
    }

    while (++i < n) {
      if (defined.call(this, d = data[i], i)) {
        points.push([+fx.call(this, d, i), +fy.call(this, d, i)]);
      } else if (points.length) {
        segment();
        points = [];
      }
    }

    if (points.length) segment();

    return segments.length ? segments.join("") : null;
  }

  line.x = function(_) {
    if (!arguments.length) return x;
    x = _;
    return line;
  };

  line.y = function(_) {
    if (!arguments.length) return y;
    y = _;
    return line;
  };

  line.defined  = function(_) {
    if (!arguments.length) return defined;
    defined = _;
    return line;
  };

  line.interpolate = function(_) {
    if (!arguments.length) return interpolateKey;
    if (typeof _ === "function") interpolateKey = interpolate = _;
    else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
    return line;
  };

  line.tension = function(_) {
    if (!arguments.length) return tension;
    tension = _;
    return line;
  };

  return line;
}

d3.svg.line = function() {
  return d3_svg_line(d3_identity);
};

// The various interpolators supported by the `line` class.
var d3_svg_lineInterpolators = d3.map({
  "linear": d3_svg_lineLinear,
  "linear-closed": d3_svg_lineLinearClosed,
  "step": d3_svg_lineStep,
  "step-before": d3_svg_lineStepBefore,
  "step-after": d3_svg_lineStepAfter,
  "basis": d3_svg_lineBasis,
  "basis-open": d3_svg_lineBasisOpen,
  "basis-closed": d3_svg_lineBasisClosed,
  "bundle": d3_svg_lineBundle,
  "cardinal": d3_svg_lineCardinal,
  "cardinal-open": d3_svg_lineCardinalOpen,
  "cardinal-closed": d3_svg_lineCardinalClosed,
  "monotone": d3_svg_lineMonotone
});

d3_svg_lineInterpolators.forEach(function(key, value) {
  value.key = key;
  value.closed = /-closed$/.test(key);
});

// Linear interpolation; generates "L" commands.
function d3_svg_lineLinear(points) {
  return points.length > 1 ? points.join("L") : points + "Z";
}

function d3_svg_lineLinearClosed(points) {
  return points.join("L") + "Z";
}

// Step interpolation; generates "H" and "V" commands.
function d3_svg_lineStep(points) {
  var i = 0,
      n = points.length,
      p = points[0],
      path = [p[0], ",", p[1]];
  while (++i < n) path.push("H", (p[0] + (p = points[i])[0]) / 2, "V", p[1]);
  if (n > 1) path.push("H", p[0]);
  return path.join("");
}

// Step interpolation; generates "H" and "V" commands.
function d3_svg_lineStepBefore(points) {
  var i = 0,
      n = points.length,
      p = points[0],
      path = [p[0], ",", p[1]];
  while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
  return path.join("");
}

// Step interpolation; generates "H" and "V" commands.
function d3_svg_lineStepAfter(points) {
  var i = 0,
      n = points.length,
      p = points[0],
      path = [p[0], ",", p[1]];
  while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
  return path.join("");
}

// Open cardinal spline interpolation; generates "C" commands.
function d3_svg_lineCardinalOpen(points, tension) {
  return points.length < 4
      ? d3_svg_lineLinear(points)
      : points[1] + d3_svg_lineHermite(points.slice(1, -1),
        d3_svg_lineCardinalTangents(points, tension));
}

// Closed cardinal spline interpolation; generates "C" commands.
function d3_svg_lineCardinalClosed(points, tension) {
  return points.length < 3
      ? d3_svg_lineLinearClosed(points)
      : points[0] + d3_svg_lineHermite((points.push(points[0]), points),
        d3_svg_lineCardinalTangents([points[points.length - 2]]
        .concat(points, [points[1]]), tension));
}

// Cardinal spline interpolation; generates "C" commands.
function d3_svg_lineCardinal(points, tension) {
  return points.length < 3
      ? d3_svg_lineLinear(points)
      : points[0] + d3_svg_lineHermite(points,
        d3_svg_lineCardinalTangents(points, tension));
}

// Hermite spline construction; generates "C" commands.
function d3_svg_lineHermite(points, tangents) {
  if (tangents.length < 1
      || (points.length != tangents.length
      && points.length != tangents.length + 2)) {
    return d3_svg_lineLinear(points);
  }

  var quad = points.length != tangents.length,
      path = "",
      p0 = points[0],
      p = points[1],
      t0 = tangents[0],
      t = t0,
      pi = 1;

  if (quad) {
    path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3)
        + "," + p[0] + "," + p[1];
    p0 = points[1];
    pi = 2;
  }

  if (tangents.length > 1) {
    t = tangents[1];
    p = points[pi];
    pi++;
    path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1])
        + "," + (p[0] - t[0]) + "," + (p[1] - t[1])
        + "," + p[0] + "," + p[1];
    for (var i = 2; i < tangents.length; i++, pi++) {
      p = points[pi];
      t = tangents[i];
      path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1])
          + "," + p[0] + "," + p[1];
    }
  }

  if (quad) {
    var lp = points[pi];
    path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3)
        + "," + lp[0] + "," + lp[1];
  }

  return path;
}

// Generates tangents for a cardinal spline.
function d3_svg_lineCardinalTangents(points, tension) {
  var tangents = [],
      a = (1 - tension) / 2,
      p0,
      p1 = points[0],
      p2 = points[1],
      i = 1,
      n = points.length;
  while (++i < n) {
    p0 = p1;
    p1 = p2;
    p2 = points[i];
    tangents.push([a * (p2[0] - p0[0]), a * (p2[1] - p0[1])]);
  }
  return tangents;
}

// B-spline interpolation; generates "C" commands.
function d3_svg_lineBasis(points) {
  if (points.length < 3) return d3_svg_lineLinear(points);
  var i = 1,
      n = points.length,
      pi = points[0],
      x0 = pi[0],
      y0 = pi[1],
      px = [x0, x0, x0, (pi = points[1])[0]],
      py = [y0, y0, y0, pi[1]],
      path = [x0, ",", y0, "L", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py)];
  points.push(points[n - 1]);
  while (++i <= n) {
    pi = points[i];
    px.shift(); px.push(pi[0]);
    py.shift(); py.push(pi[1]);
    d3_svg_lineBasisBezier(path, px, py);
  }
  points.pop();
  path.push("L", pi);
  return path.join("");
}

// Open B-spline interpolation; generates "C" commands.
function d3_svg_lineBasisOpen(points) {
  if (points.length < 4) return d3_svg_lineLinear(points);
  var path = [],
      i = -1,
      n = points.length,
      pi,
      px = [0],
      py = [0];
  while (++i < 3) {
    pi = points[i];
    px.push(pi[0]);
    py.push(pi[1]);
  }
  path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px)
    + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
  --i; while (++i < n) {
    pi = points[i];
    px.shift(); px.push(pi[0]);
    py.shift(); py.push(pi[1]);
    d3_svg_lineBasisBezier(path, px, py);
  }
  return path.join("");
}

// Closed B-spline interpolation; generates "C" commands.
function d3_svg_lineBasisClosed(points) {
  var path,
      i = -1,
      n = points.length,
      m = n + 4,
      pi,
      px = [],
      py = [];
  while (++i < 4) {
    pi = points[i % n];
    px.push(pi[0]);
    py.push(pi[1]);
  }
  path = [
    d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",",
    d3_svg_lineDot4(d3_svg_lineBasisBezier3, py)
  ];
  --i; while (++i < m) {
    pi = points[i % n];
    px.shift(); px.push(pi[0]);
    py.shift(); py.push(pi[1]);
    d3_svg_lineBasisBezier(path, px, py);
  }
  return path.join("");
}

function d3_svg_lineBundle(points, tension) {
  var n = points.length - 1;
  if (n) {
    var x0 = points[0][0],
        y0 = points[0][1],
        dx = points[n][0] - x0,
        dy = points[n][1] - y0,
        i = -1,
        p,
        t;
    while (++i <= n) {
      p = points[i];
      t = i / n;
      p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
      p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
    }
  }
  return d3_svg_lineBasis(points);
}

// Returns the dot product of the given four-element vectors.
function d3_svg_lineDot4(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

// Matrix to transform basis (b-spline) control points to bezier
// control points. Derived from FvD 11.2.8.
var d3_svg_lineBasisBezier1 = [0, 2/3, 1/3, 0],
    d3_svg_lineBasisBezier2 = [0, 1/3, 2/3, 0],
    d3_svg_lineBasisBezier3 = [0, 1/6, 2/3, 1/6];

// Pushes a "C" Bézier curve onto the specified path array, given the
// two specified four-element arrays which define the control points.
function d3_svg_lineBasisBezier(path, x, y) {
  path.push(
      "C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x),
      ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
}

// Computes the slope from points p0 to p1.
function d3_svg_lineSlope(p0, p1) {
  return (p1[1] - p0[1]) / (p1[0] - p0[0]);
}

// Compute three-point differences for the given points.
// http://en.wikipedia.org/wiki/Cubic_Hermite_spline#Finite_difference
function d3_svg_lineFiniteDifferences(points) {
  var i = 0,
      j = points.length - 1,
      m = [],
      p0 = points[0],
      p1 = points[1],
      d = m[0] = d3_svg_lineSlope(p0, p1);
  while (++i < j) {
    m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
  }
  m[i] = d;
  return m;
}

// Interpolates the given points using Fritsch-Carlson Monotone cubic Hermite
// interpolation. Returns an array of tangent vectors. For details, see
// http://en.wikipedia.org/wiki/Monotone_cubic_interpolation
function d3_svg_lineMonotoneTangents(points) {
  var tangents = [],
      d,
      a,
      b,
      s,
      m = d3_svg_lineFiniteDifferences(points),
      i = -1,
      j = points.length - 1;

  // The first two steps are done by computing finite-differences:
  // 1. Compute the slopes of the secant lines between successive points.
  // 2. Initialize the tangents at every point as the average of the secants.

  // Then, for each segment…
  while (++i < j) {
    d = d3_svg_lineSlope(points[i], points[i + 1]);

    // 3. If two successive yk = y{k + 1} are equal (i.e., d is zero), then set
    // mk = m{k + 1} = 0 as the spline connecting these points must be flat to
    // preserve monotonicity. Ignore step 4 and 5 for those k.

    if (abs(d) < ε) {
      m[i] = m[i + 1] = 0;
    } else {
      // 4. Let ak = mk / dk and bk = m{k + 1} / dk.
      a = m[i] / d;
      b = m[i + 1] / d;

      // 5. Prevent overshoot and ensure monotonicity by restricting the
      // magnitude of vector <ak, bk> to a circle of radius 3.
      s = a * a + b * b;
      if (s > 9) {
        s = d * 3 / Math.sqrt(s);
        m[i] = s * a;
        m[i + 1] = s * b;
      }
    }
  }

  // Compute the normalized tangent vector from the slopes. Note that if x is
  // not monotonic, it's possible that the slope will be infinite, so we protect
  // against NaN by setting the coordinate to zero.
  i = -1; while (++i <= j) {
    s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
    tangents.push([s || 0, m[i] * s || 0]);
  }

  return tangents;
}

function d3_svg_lineMonotone(points) {
  return points.length < 3
      ? d3_svg_lineLinear(points)
      : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
}
function d3_zero() {
  return 0;
}

d3.svg.arc = function() {
  var innerRadius = d3_svg_arcInnerRadius,
      outerRadius = d3_svg_arcOuterRadius,
      cornerRadius = d3_zero,
      padRadius = d3_svg_arcAuto,
      startAngle = d3_svg_arcStartAngle,
      endAngle = d3_svg_arcEndAngle,
      padAngle = d3_svg_arcPadAngle;

  function arc() {
    var r0 = Math.max(0, +innerRadius.apply(this, arguments)),
        r1 = Math.max(0, +outerRadius.apply(this, arguments)),
        a0 = startAngle.apply(this, arguments) - halfπ,
        a1 = endAngle.apply(this, arguments) - halfπ,
        da = Math.abs(a1 - a0),
        cw = a0 > a1 ? 0 : 1;

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) rc = r1, r1 = r0, r0 = rc;

    // Special case for an arc that spans the full circle.
    if (da >= τε) return circleSegment(r1, cw) + (r0 ? circleSegment(r0, 1 - cw) : "") + "Z";

    var rc,
        cr,
        rp,
        ap,
        p0 = 0,
        p1 = 0,
        x0,
        y0,
        x1,
        y1,
        x2,
        y2,
        x3,
        y3,
        path = [];

    // The recommended minimum inner radius when using padding is outerRadius *
    // padAngle / sin(θ), where θ is the angle of the smallest arc (without
    // padding). For example, if the outerRadius is 200 pixels and the padAngle
    // is 0.02 radians, a reasonable θ is 0.04 radians, and a reasonable
    // innerRadius is 100 pixels.

    if (ap = (+padAngle.apply(this, arguments) || 0) / 2) {
      rp = padRadius === d3_svg_arcAuto ? Math.sqrt(r0 * r0 + r1 * r1) : +padRadius.apply(this, arguments);
      if (!cw) p1 *= -1;
      if (r1) p1 = d3_asin(rp / r1 * Math.sin(ap));
      if (r0) p0 = d3_asin(rp / r0 * Math.sin(ap));
    }

    // Compute the two outer corners.
    if (r1) {
      x0 = r1 * Math.cos(a0 + p1);
      y0 = r1 * Math.sin(a0 + p1);
      x1 = r1 * Math.cos(a1 - p1);
      y1 = r1 * Math.sin(a1 - p1);

      // Detect whether the outer corners are collapsed.
      var l1 = Math.abs(a1 - a0 - 2 * p1) <= π ? 0 : 1;
      if (p1 && d3_svg_arcSweep(x0, y0, x1, y1) === cw ^ l1) {
        var h1 = (a0 + a1) / 2;
        x0 = r1 * Math.cos(h1);
        y0 = r1 * Math.sin(h1);
        x1 = y1 = null;
      }
    } else {
      x0 = y0 = 0;
    }

    // Compute the two inner corners.
    if (r0) {
      x2 = r0 * Math.cos(a1 - p0);
      y2 = r0 * Math.sin(a1 - p0);
      x3 = r0 * Math.cos(a0 + p0);
      y3 = r0 * Math.sin(a0 + p0);

      // Detect whether the inner corners are collapsed.
      var l0 = Math.abs(a0 - a1 + 2 * p0) <= π ? 0 : 1;
      if (p0 && d3_svg_arcSweep(x2, y2, x3, y3) === (1 - cw) ^ l0) {
        var h0 = (a0 + a1) / 2;
        x2 = r0 * Math.cos(h0);
        y2 = r0 * Math.sin(h0);
        x3 = y3 = null;
      }
    } else {
      x2 = y2 = 0;
    }

    // Compute the rounded corners.
    if (da > ε && (rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments))) > 1e-3) {
      cr = r0 < r1 ^ cw ? 0 : 1;
      var rc1 = rc,
          rc0 = rc;

      // Compute the angle of the sector formed by the two sides of the arc.
      if (da < π) {
        var oc = x3 == null ? [x2, y2] : x1 == null ? [x0, y0] : d3_geom_polygonIntersect([x0, y0], [x3, y3], [x1, y1], [x2, y2]),
            ax = x0 - oc[0],
            ay = y0 - oc[1],
            bx = x1 - oc[0],
            by = y1 - oc[1],
            kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2),
            lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
        rc0 = Math.min(rc, (r0 - lc) / (kc - 1));
        rc1 = Math.min(rc, (r1 - lc) / (kc + 1));
      }

      // Compute the outer corners.
      if (x1 != null) {
        var t30 = d3_svg_arcCornerTangents(x3 == null ? [x2, y2] : [x3, y3], [x0, y0], r1, rc1, cw),
            t12 = d3_svg_arcCornerTangents([x1, y1], [x2, y2], r1, rc1, cw);

        // Detect whether the outer edge is fully circular.
        if (rc === rc1) {
          path.push(
            "M", t30[0],
            "A", rc1, ",", rc1, " 0 0,", cr, " ", t30[1],
            "A", r1, ",", r1, " 0 ", (1 - cw) ^ d3_svg_arcSweep(t30[1][0], t30[1][1], t12[1][0], t12[1][1]), ",", cw, " ", t12[1],
            "A", rc1, ",", rc1, " 0 0,", cr, " ", t12[0]);
        } else {
          path.push(
            "M", t30[0],
            "A", rc1, ",", rc1, " 0 1,", cr, " ", t12[0]);
        }
      } else {
        path.push("M", x0, ",", y0);
      }

      // Compute the inner corners.
      if (x3 != null) {
        var t03 = d3_svg_arcCornerTangents([x0, y0], [x3, y3], r0, -rc0, cw),
            t21 = d3_svg_arcCornerTangents([x2, y2], x1 == null ? [x0, y0] : [x1, y1], r0, -rc0, cw);

        // Detect whether the inner edge is fully circular.
        if (rc === rc0) {
          path.push(
            "L", t21[0],
            "A", rc0, ",", rc0, " 0 0,", cr, " ", t21[1],
            "A", r0, ",", r0, " 0 ", cw ^ d3_svg_arcSweep(t21[1][0], t21[1][1], t03[1][0], t03[1][1]), ",", 1 - cw, " ", t03[1],
            "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
        } else {
          path.push(
            "L", t21[0],
            "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
        }
      } else {
        path.push("L", x2, ",", y2);
      }
    }

    // Compute straight corners.
    else {
      path.push("M", x0, ",", y0);
      if (x1 != null) path.push("A", r1, ",", r1, " 0 ", l1, ",", cw, " ", x1, ",", y1);
      path.push("L", x2, ",", y2);
      if (x3 != null) path.push("A", r0, ",", r0, " 0 ", l0, ",", 1 - cw, " ", x3, ",", y3);
    }

    path.push("Z");
    return path.join("");
  }

  function circleSegment(r1, cw) {
    return "M0," + r1
        + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + -r1
        + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + r1;
  }

  arc.innerRadius = function(v) {
    if (!arguments.length) return innerRadius;
    innerRadius = d3_functor(v);
    return arc;
  };

  arc.outerRadius = function(v) {
    if (!arguments.length) return outerRadius;
    outerRadius = d3_functor(v);
    return arc;
  };

  arc.cornerRadius = function(v) {
    if (!arguments.length) return cornerRadius;
    cornerRadius = d3_functor(v);
    return arc;
  };

  arc.padRadius = function(v) {
    if (!arguments.length) return padRadius;
    padRadius = v == d3_svg_arcAuto ? d3_svg_arcAuto : d3_functor(v);
    return arc;
  };

  arc.startAngle = function(v) {
    if (!arguments.length) return startAngle;
    startAngle = d3_functor(v);
    return arc;
  };

  arc.endAngle = function(v) {
    if (!arguments.length) return endAngle;
    endAngle = d3_functor(v);
    return arc;
  };

  arc.padAngle = function(v) {
    if (!arguments.length) return padAngle;
    padAngle = d3_functor(v);
    return arc;
  };

  arc.centroid = function() {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - halfπ;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };

  return arc;
};

var d3_svg_arcAuto = "auto";

function d3_svg_arcInnerRadius(d) {
  return d.innerRadius;
}

function d3_svg_arcOuterRadius(d) {
  return d.outerRadius;
}

function d3_svg_arcStartAngle(d) {
  return d.startAngle;
}

function d3_svg_arcEndAngle(d) {
  return d.endAngle;
}

function d3_svg_arcPadAngle(d) {
  return d && d.padAngle;
}

// Note: similar to d3_cross2d, d3_geom_polygonInside
function d3_svg_arcSweep(x0, y0, x1, y1) {
  return (x0 - x1) * y0 - (y0 - y1) * x0 > 0 ? 0 : 1;
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function d3_svg_arcCornerTangents(p0, p1, r1, rc, cw) {
  var x01 = p0[0] - p1[0],
      y01 = p0[1] - p1[1],
      lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x1 = p0[0] + ox,
      y1 = p0[1] + oy,
      x2 = p1[0] + ox,
      y2 = p1[1] + oy,
      x3 = (x1 + x2) / 2,
      y3 = (y1 + y2) / 2,
      dx = x2 - x1,
      dy = y2 - y1,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x1 * y2 - x2 * y1,
      d = (dy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x3,
      dy0 = cy0 - y3,
      dx1 = cx1 - x3,
      dy1 = cy1 - y3;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

  return [
    [cx0 - ox, cy0 - oy],
    [cx0 * r1 / r, cy0 * r1 / r]
  ];
}

d3.svg.axis = function() {
  var scale = d3.scale.linear(),
      orient = d3_svg_axisDefaultOrient,
      innerTickSize = 6,
      outerTickSize = 6,
      tickPadding = 3,
      tickArguments_ = [10],
      tickValues = null,
      tickFormat_;

  function axis(g) {
    g.each(function() {
      var g = d3.select(this);

      // Stash a snapshot of the new scale, and retrieve the old snapshot.
      var scale0 = this.__chart__ || scale,
          scale1 = this.__chart__ = scale.copy();

      // Ticks, or domain values for ordinal scales.
      var ticks = tickValues == null ? (scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain()) : tickValues,
          tickFormat = tickFormat_ == null ? (scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity) : tickFormat_,
          tick = g.selectAll(".tick").data(ticks, scale1),
          tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", ε),
          tickExit = d3.transition(tick.exit()).style("opacity", ε).remove(),
          tickUpdate = d3.transition(tick.order()).style("opacity", 1),
          tickSpacing = Math.max(innerTickSize, 0) + tickPadding,
          tickTransform;

      // Domain.
      var range = d3_scaleRange(scale1),
          path = g.selectAll(".domain").data([0]),
          pathUpdate = (path.enter().append("path").attr("class", "domain"), d3.transition(path));

      tickEnter.append("line");
      tickEnter.append("text");

      var lineEnter = tickEnter.select("line"),
          lineUpdate = tickUpdate.select("line"),
          text = tick.select("text").text(tickFormat),
          textEnter = tickEnter.select("text"),
          textUpdate = tickUpdate.select("text"),
          sign = orient === "top" || orient === "left" ? -1 : 1,
          x1, x2, y1, y2;

      if (orient === "bottom" || orient === "top") {
        tickTransform = d3_svg_axisX, x1 = "x", y1 = "y", x2 = "x2", y2 = "y2";
        text.attr("dy", sign < 0 ? "0em" : ".71em").style("text-anchor", "middle");
        pathUpdate.attr("d", "M" + range[0] + "," + sign * outerTickSize + "V0H" + range[1] + "V" + sign * outerTickSize);
      } else {
        tickTransform = d3_svg_axisY, x1 = "y", y1 = "x", x2 = "y2", y2 = "x2";
        text.attr("dy", ".32em").style("text-anchor", sign < 0 ? "end" : "start");
        pathUpdate.attr("d", "M" + sign * outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + sign * outerTickSize);
      }

      lineEnter.attr(y2, sign * innerTickSize);
      textEnter.attr(y1, sign * tickSpacing);
      lineUpdate.attr(x2, 0).attr(y2, sign * innerTickSize);
      textUpdate.attr(x1, 0).attr(y1, sign * tickSpacing);

      // If either the new or old scale is ordinal,
      // entering ticks are undefined in the old scale,
      // and so can fade-in in the new scale’s position.
      // Exiting ticks are likewise undefined in the new scale,
      // and so can fade-out in the old scale’s position.
      if (scale1.rangeBand) {
        var x = scale1, dx = x.rangeBand() / 2;
        scale0 = scale1 = function(d) { return x(d) + dx; };
      } else if (scale0.rangeBand) {
        scale0 = scale1;
      } else {
        tickExit.call(tickTransform, scale1, scale0);
      }

      tickEnter.call(tickTransform, scale0, scale1);
      tickUpdate.call(tickTransform, scale1, scale1);
    });
  }

  axis.scale = function(x) {
    if (!arguments.length) return scale;
    scale = x;
    return axis;
  };

  axis.orient = function(x) {
    if (!arguments.length) return orient;
    orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
    return axis;
  };

  axis.ticks = function() {
    if (!arguments.length) return tickArguments_;
    tickArguments_ = d3_array(arguments);
    return axis;
  };

  axis.tickValues = function(x) {
    if (!arguments.length) return tickValues;
    tickValues = x;
    return axis;
  };

  axis.tickFormat = function(x) {
    if (!arguments.length) return tickFormat_;
    tickFormat_ = x;
    return axis;
  };

  axis.tickSize = function(x) {
    var n = arguments.length;
    if (!n) return innerTickSize;
    innerTickSize = +x;
    outerTickSize = +arguments[n - 1];
    return axis;
  };

  axis.innerTickSize = function(x) {
    if (!arguments.length) return innerTickSize;
    innerTickSize = +x;
    return axis;
  };

  axis.outerTickSize = function(x) {
    if (!arguments.length) return outerTickSize;
    outerTickSize = +x;
    return axis;
  };

  axis.tickPadding = function(x) {
    if (!arguments.length) return tickPadding;
    tickPadding = +x;
    return axis;
  };

  axis.tickSubdivide = function() {
    return arguments.length && axis;
  };

  return axis;
};

var d3_svg_axisDefaultOrient = "bottom",
    d3_svg_axisOrients = {top: 1, right: 1, bottom: 1, left: 1};

function d3_svg_axisX(selection, x0, x1) {
  selection.attr("transform", function(d) { var v0 = x0(d); return "translate(" + (isFinite(v0) ? v0 : x1(d)) + ",0)"; });
}

function d3_svg_axisY(selection, y0, y1) {
  selection.attr("transform", function(d) { var v0 = y0(d); return "translate(0," + (isFinite(v0) ? v0 : y1(d)) + ")"; });
}
d3.layout = {};
d3.merge = function(arrays) {
  var n = arrays.length,
      m,
      i = -1,
      j = 0,
      merged,
      array;

  while (++i < n) j += arrays[i].length;
  merged = new Array(j);

  while (--n >= 0) {
    array = arrays[n];
    m = array.length;
    while (--m >= 0) {
      merged[--j] = array[m];
    }
  }

  return merged;
};

d3.layout.hierarchy = function() {
  var sort = d3_layout_hierarchySort,
      children = d3_layout_hierarchyChildren,
      value = d3_layout_hierarchyValue;

  function hierarchy(root) {
    var stack = [root],
        nodes = [],
        node;

    root.depth = 0;

    while ((node = stack.pop()) != null) {
      nodes.push(node);
      if ((childs = children.call(hierarchy, node, node.depth)) && (n = childs.length)) {
        var n, childs, child;
        while (--n >= 0) {
          stack.push(child = childs[n]);
          child.parent = node;
          child.depth = node.depth + 1;
        }
        if (value) node.value = 0;
        node.children = childs;
      } else {
        if (value) node.value = +value.call(hierarchy, node, node.depth) || 0;
        delete node.children;
      }
    }

    d3_layout_hierarchyVisitAfter(root, function(node) {
      var childs, parent;
      if (sort && (childs = node.children)) childs.sort(sort);
      if (value && (parent = node.parent)) parent.value += node.value;
    });

    return nodes;
  }

  hierarchy.sort = function(x) {
    if (!arguments.length) return sort;
    sort = x;
    return hierarchy;
  };

  hierarchy.children = function(x) {
    if (!arguments.length) return children;
    children = x;
    return hierarchy;
  };

  hierarchy.value = function(x) {
    if (!arguments.length) return value;
    value = x;
    return hierarchy;
  };

  // Re-evaluates the `value` property for the specified hierarchy.
  hierarchy.revalue = function(root) {
    if (value) {
      d3_layout_hierarchyVisitBefore(root, function(node) {
        if (node.children) node.value = 0;
      });
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var parent;
        if (!node.children) node.value = +value.call(hierarchy, node, node.depth) || 0;
        if (parent = node.parent) parent.value += node.value;
      });
    }
    return root;
  };

  return hierarchy;
};

// A method assignment helper for hierarchy subclasses.
function d3_layout_hierarchyRebind(object, hierarchy) {
  d3.rebind(object, hierarchy, "sort", "children", "value");

  // Add an alias for nodes and links, for convenience.
  object.nodes = object;
  object.links = d3_layout_hierarchyLinks;

  return object;
}

// Pre-order traversal.
function d3_layout_hierarchyVisitBefore(node, callback) {
  var nodes = [node];
  while ((node = nodes.pop()) != null) {
    callback(node);
    if ((children = node.children) && (n = children.length)) {
      var n, children;
      while (--n >= 0) nodes.push(children[n]);
    }
  }
}

// Post-order traversal.
function d3_layout_hierarchyVisitAfter(node, callback) {
  var nodes = [node], nodes2 = [];
  while ((node = nodes.pop()) != null) {
    nodes2.push(node);
    if ((children = node.children) && (n = children.length)) {
      var i = -1, n, children;
      while (++i < n) nodes.push(children[i]);
    }
  }
  while ((node = nodes2.pop()) != null) {
    callback(node);
  }
}

function d3_layout_hierarchyChildren(d) {
  return d.children;
}

function d3_layout_hierarchyValue(d) {
  return d.value;
}

function d3_layout_hierarchySort(a, b) {
  return b.value - a.value;
}

// Returns an array source+target objects for the specified nodes.
function d3_layout_hierarchyLinks(nodes) {
  return d3.merge(nodes.map(function(parent) {
    return (parent.children || []).map(function(child) {
      return {source: parent, target: child};
    });
  }));
}

d3.layout.pack = function() {
  var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort),
      padding = 0,
      size = [1, 1],
      radius;

  function pack(d, i) {
    var nodes = hierarchy.call(this, d, i),
        root = nodes[0],
        w = size[0],
        h = size[1],
        r = radius == null ? Math.sqrt : typeof radius === "function" ? radius : function() { return radius; };

    // Recursively compute the layout.
    root.x = root.y = 0;
    d3_layout_hierarchyVisitAfter(root, function(d) { d.r = +r(d.value); });
    d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);

    // When padding, recompute the layout using scaled padding.
    if (padding) {
      var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;
      d3_layout_hierarchyVisitAfter(root, function(d) { d.r += dr; });
      d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
      d3_layout_hierarchyVisitAfter(root, function(d) { d.r -= dr; });
    }

    // Translate and scale the layout to fit the requested size.
    d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));

    return nodes;
  }

  pack.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return pack;
  };

  pack.radius = function(_) {
    if (!arguments.length) return radius;
    radius = _ == null || typeof _ === "function" ? _ : +_;
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
  return 0.999 * dr * dr > dx * dx + dy * dy; // relative error within epsilon
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
          if (s1 < s2 || (s1 == s2 && b.r < a.r)) d3_layout_packSplice(a, b = j);
          else d3_layout_packSplice(a = k, b);
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
  node.x = x += k * node.x;
  node.y = y += k * node.y;
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
    var x = 0.5 + (db - da) / (2 * dc),
        y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
    c.x = a.x + x * dx + y * dy;
    c.y = a.y + x * dy - y * dx;
  } else {
    c.x = a.x + db;
    c.y = a.y;
  }
}
return d3;
  })();
}, '3.5.16', {
  requires: []
});
