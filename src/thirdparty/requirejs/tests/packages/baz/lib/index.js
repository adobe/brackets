define(['bar', 'foo', './helper'], function (bar, foo, helper) {
    return {
        name: 'baz',
        barDepVersion: bar.version,
        fooName: foo.name,
        helperName: helper.name
    };
});
