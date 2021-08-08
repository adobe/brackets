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
