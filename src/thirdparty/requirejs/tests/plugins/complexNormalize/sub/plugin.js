define(['module', 'sub/pluginDep'], function() {
    return {
        normalize: function(name, normalize) {
            // Add the string "Normalized" onto the end of the module name
            if (!/normalized/i.test(name)) { name += 'Normalized'; }
            return normalize(name);
        },

        load: function(name, req, onload, config) {
            // Instead of loading a module, just return the name so it can be inspected
            onload(name);
        }
    };
});
