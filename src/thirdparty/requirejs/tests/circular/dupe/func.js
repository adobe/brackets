define(['exported'], function (exported) {
    function func(title) {
        return exported.makeMessage(title);
    }

    func.suffix = 'suffix';

    return func;
});

