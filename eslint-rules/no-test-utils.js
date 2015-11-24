module.exports = function(context) {
  return {
    Identifier: function(node) {
      var nodeName = node.name;
      if (node.parent.object && node.parent.object.name === 'jsTestUtils') {
        switch(nodeName) {
          case 'log':
            context.report(node, 'log() was left in a test');
            break;
          case 'compare':
            context.report(node, 'compare() was left in a test');
            break;
        }
      }
    }
  };
};
