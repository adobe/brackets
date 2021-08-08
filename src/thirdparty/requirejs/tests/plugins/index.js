(function () {

    function parse(name) {
        var parts = name.split('?'),
            index = parseInt(parts[0], 10),
            choices = parts[1].split(':'),
            choice = choices[index];

        return {
            index: index,
            choices: choices,
            choice: choice
        };
    }

    define({
        pluginBuilder: './indexBuilder',
        normalize: function (name, normalize) {
            var parsed = parse(name),
                choices = parsed.choices;

            //Normalize each path choice.
            for (i = 0; i < choices.length; i++) {
                choices[i] = normalize(choices[i]);
            }

            return parsed.index + '?' + choices.join(':');
        },

        load: function (name, req, load, config) {
            req([parse(name).choice], function (value) {
                load(value);
            });
        }
    });

}());
