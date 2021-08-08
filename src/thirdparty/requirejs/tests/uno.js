define("uno",
  ["dos", "tres"],
  function(dos, tres) {
    return {
      name: "uno",
      doSomething: function() {
        return {
          dosName: dos.name,
          tresName: tres.name
        };
      }
    };
  }
);
