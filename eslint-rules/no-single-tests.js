module.exports = function(context) {
  return {
    Identifier: function(node) {
      var nodeName = node.name;
      switch(nodeName) {
        case 'only':
          var parentName = node.parent.object.name;
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
