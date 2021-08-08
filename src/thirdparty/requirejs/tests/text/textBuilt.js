(function () {
    define('text',[],function () {
        var text = {
            load: function (name, req, onLoad, config) {
                throw "THE TEXT PLUGIN LOAD() FUNCTION SHOULD NOT BE CALLED";
            }
        };

        return text;
    });
}());
define('text!subwidget.html!strip', function () { return '<div data-type="subwidget"><h1>This is a subwidget</h1></div>';});
define('text!subwidget2.html', function () { return '<span>This! is template2</span>';});

define("subwidget",
  ["text!subwidget.html!strip", "text!subwidget2.html"],
  function(template, template2) {
    return {
      name: "subwidget",
      template: template,
      template2: template2
    };
  }
);
define('text!widget.html', function () { return '<div data-type="widget"><h1>This is a widget!</h1><p>I am in a widget</p></div>';});

define("widget",
  ["subwidget", "text!widget.html"],
  function(subwidget, template) {
    return {
      subWidgetName: subwidget.name,
      subWidgetTemplate: subwidget.template,
      subWidgetTemplate2: subwidget.template2,
      template: template
    };
  }
);

/****************** TEST CODE IS BELOW ******************/

require({
    baseUrl: "./",
    paths: {
        text: "../../../text/text"
    }
});
require(
    ["widget"],
    function(widget) {
        doh.register(
            "text",
            [
                function text(t){
                    t.is('<div data-type="widget"><h1>This is a widget!</h1><p>I am in a widget</p></div>', widget.template);
                    t.is('subwidget', widget.subWidgetName);
                    t.is('<div data-type="subwidget"><h1>This is a subwidget</h1></div>', widget.subWidgetTemplate);
                    t.is('<span>This! is template2</span>', widget.subWidgetTemplate2);
                }
            ]
        );
        doh.run();

    }
);
