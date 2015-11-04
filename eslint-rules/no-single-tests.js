module.exports = function(context) {
    return {
        Identifier: function(node) {
            var nodeName = node.name;
            if (nodeName === 'only') {
                var parentName = node.parent.object.name;
                if (parentName === 'it' || parentName === 'describe') {
                    context.report(node, '.only() was left in a test');
                }
            } else if (nodeName === 'fdescribe') {
                context.report(node, 'fdescribe() was left in a test');
            } else if (nodeName === 'fit') {
                context.report(node, 'fit() was left in a test');
            }
        }
    };
};
