requirejs.config({
    paths: {
        text: '../../circular/complexPlugin/slowText'
    }
});

//First make sure the plugin is loaded, so that there is nothing waiting for
//normalization.

require(['text'], function (text) {

    function trim(text) {
        return text.replace(/^\s+/, '').replace(/\s+$/, '');
    }

    require(['app'], function (app) {

        doh.register(
            "pluginsLast",
            [
                function pluginsLast(t){
                    t.is("app", app.name);
                    t.is("specificCollection", app.specificCollection.name);
                    t.is("specificCollection", app.specificCollection.html);
                    t.is("bigCollection", app.bigCollection.name);
                    t.is("bigCollection", app.bigCollection.html);

                    t.is("collection", app.bigCollection.collection.name);
                    t.is("collectionHelper", app.bigCollection.collection.collectionHelperName);
                    t.is("component", app.bigCollection.collection.componentName);
                    t.is("component", app.bigCollection.collection.componentHtml);
                 }
            ]
        );
        doh.run();

    });

});
