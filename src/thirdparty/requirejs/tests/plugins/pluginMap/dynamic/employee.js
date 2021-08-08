define('employee', ['plugin!person'], function(person) {
    return {
        name: 'employed ' + person.name
    };
});
