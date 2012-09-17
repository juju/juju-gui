YUI.add("svg-layouts", function(Y) {
    // package to help compute svg layouts,
    // particuallary around text
    Y.Node.addMethod("getClientRect", function(node) {
        // Chrome and FF both support this at the DOM level
        var rect = node.getClientRects()[0];
        if (typeof(rect) == "undefined" || !rect.width) {
            return null;
        }
        return rect;
    });
            

}, "0.0.1", {
    requires: ["node"]
});
