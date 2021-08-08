//Example layer file.

define("alpha",
    ["beta", "gamma"],
    function (beta, gamma) {
        return {
            name: "alpha",
            betaName: beta.name
        };
    }
);

define("beta",
    ["gamma"],
    function (gamma) {
        return {
            name: "beta",
            gammaName: gamma.name
        };
    }
);

define("gamma",
    ["epsilon"],
    function (epsilon) {
        return {
            name: "gamma",
            epsilonName: epsilon.name
        };
    }
);
