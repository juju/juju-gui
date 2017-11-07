'use strict';
module.exports = function(context) {
  return {
    Identifier: function(node) {
      // Only run these rules if it's in a test file.
      if (context.getFilename().indexOf('test') === -1) {
        return;
      }
      const nodeName = node.name;
      switch(nodeName) {
        case 'only':
          const parentName = node.parent.object.name;
          if (parentName === 'it' || parentName === 'describe') {
            context.report(node, '.only() was left in a test');
          }
          break;
        case 'fdescribe':
          context.report(node, 'fdescribe() was left in a test');
          break;
        case 'fit':
          context.report(node, 'fit() was left in a test');
          break;
      }
    }
  };
};
