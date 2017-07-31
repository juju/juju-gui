/* Copyright (C) 2017 Canonical Ltd. */

'use strict';

function shape(obj) {
  const wrappedValidator = PropTypes.shape(obj);
  const shapeFields = Object.keys(obj);

  const propType = (props, propName, componentName, ...rest) => {
    const propValue = props[propName];
    if (!propValue) {
      return null;
    }
    // Check that the object has the declared shape.
    // Note that including "...rest" is required to avoid warnings about
    // calling PropTypes validators directly.
    // See <https://facebook.github.io/react/warnings/dont-call-proptypes.html
    // #fixing-the-false-positive-in-third-party-proptypes>.
    const err = wrappedValidator(props, propName, componentName, ...rest);
    if (err) {
      return err;
    }
    // Check that no extraneous fields are present.
    const fields = Object.getOwnPropertyNames(propValue).filter(field => {
      return shapeFields.indexOf(field) === -1;
    });
    if (fields.length) {
      return new Error(
        `invalid property "${propName}" provided to component ` +
        `"${componentName}": the provided object includes properties that ` +
        `are not declared in the shape: ${fields.join(', ')}`
      );
    }
    return null;
  };

  propType.isRequired = (props, propName, componentName, ...rest) => {
    if (!props[propName]) {
      return new Error(
        `the property "${propName}" is marked as required for the component ` +
        `"${componentName}" but "${props[propName]}" has been provided`
      );
    }
    return propType(props, propName, componentName, ...rest);
  };

  propType[SHAPE] = propType.isRequired[SHAPE] = new Declaration(obj);
  return propType;
}
/**
  Declare a property type as the given shape.
  This is just a wrapper around PropTypes.shape.

  @param {Object} obj The object defining the shape.
  @returns {Function} The shape property type.
*/
function shape2(obj) {
  const propType = PropTypes.shape(obj);
  // We need to annotate on possible chained prop types as well.
  propType[SHAPE] = propType.isRequired[SHAPE] = new Declaration(obj);
  return propType;
}

/**
  Build a property from the given object and shape property type.
  The resulting property is a deeply frozen object, with initially unbound
  methods bound to the provided object.
  All fields in the provided object that are not declared in the shape are not
  included in the returned object.
  If the shape property type includes the special field "shapeTypes.reshape",
  then a reshape method is included in that field of the returned object,
  providing the ability to reshape from the object itself using a new shape
  property type.

  @param {Object} obj The object from which to build the shape. This object is
    assumed to include all properties declared in the shape, except for the
    optionally declared "shapeTypes.reshape" property.
  @param {Function} propType The property type with the declared shape
    (built using "shapeTypes.shape").
  @returns {Object} The resulting property, as a deeply frozen object.
*/
function fromShape(obj, propType) {
  const declaration = propType[SHAPE];
  if (!(declaration instanceof Declaration)) {
    throw new Error('from shape called with a non-shape property type');
  }
  const shape = declaration.shape;
  const instance = {};
  const checker = {};
  Object.keys(shape).forEach(key => {
    const type = shape[key];
    if (!type) {console.log('======================== KEY:', key)};
    if (type[SHAPE] instanceof Reshape) {
      // Add the reshape method to the resulting instance.
      instance[key] = fromShape.bind(null, instance);
      return;
    }
    let value = obj[key];
    if (value === undefined) {
      // The object does not have the declared shape.
      // An error will be returned by PropTypes.shape.
      return;
    }
    if (type[SHAPE] instanceof Declaration) {
      // This is a nested shape type.
      instance[key] = fromShape(value, type);
      return;
    }
    if (checker.toString.call(value) === '[object Function]') {
      // This can be an unbound method: try to bind it.
      value = value.bind(obj);
    }
    instance[key] = value;
  });
  return deepFreeze(instance);
}

/**
  Deep freeze the given object and all its properties.

  @param {Object} obj The object to freeze.
  @returns {Object} The resulting deeply frozen object.
*/
function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const prop = obj[name];
    const type = typeof obj;
    if (prop !== null && (type === 'object' || type === 'function')) {
      deepFreeze(prop);
    }
  });
  return Object.freeze(obj);
}

// Define the property name for the shape information.
const SHAPE = '__shape__';

/**
  Wrapper for the shape declaration, used for identifying a shape property.
*/
const Declaration = class Declaration {
  constructor(shape) {
    this.shape = shape;
  }
};

/**
  Identifier for the reshape property.
*/
const Reshape = class Reshape {};

const reshapeFunc = () => null;
reshapeFunc[SHAPE] = new Reshape();

this.shapeTypes = {
  fromShape: fromShape,
  reshapeFunc: reshapeFunc,
  shape: shape
};
