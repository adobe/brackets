require({
    map: {
        '*': {
            'person': 'employee'
        },
        'employee': {
            'person': 'person'
        }
    }
}, ['application'], function (application) {

    doh.register(
        'pluginMapDynamic',
        [
            function pluginMapDynamic(t){
                t.is('application', application.name);
                t.is('employed person', application.person.name);
            }
        ]
    );
    doh.run();

});
