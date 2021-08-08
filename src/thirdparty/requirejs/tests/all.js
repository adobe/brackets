//PS3 does not have a usable Function.prototype.toString,
//so avoid those tests.
var hasToString = (function () {
    var test = 'hello world';
}).toString().indexOf('hello world') !== -1;

doh.registerUrl("simple", "../simple.html");

//PS3 does not like this test
doh.registerUrl("baseUrl", "../baseUrl.html");

doh.registerUrl("toUrl", "../toUrl/toUrl.html");
doh.registerUrl("urlArgsToUrl", "../urlArgsToUrl.html");

doh.registerUrl("config", "../config.html");
doh.registerUrl("configRequirejs", "../configRequirejs.html");
doh.registerUrl("dataMain", "../dataMain/dataMain.html");
doh.registerUrl("skipDataMain", "../dataMain/skipDataMain/skipDataMain.html");
doh.registerUrl("dataMainIndex", "../dataMain/dataMainIndex/dataMainIndex.html");
doh.registerUrl("dataMainBaseUrl", "../dataMain/baseUrl/dataMainBaseUrl.html");

doh.registerUrl("moduleExports", "../moduleExports/moduleExports.html");

if (hasToString) {
    doh.registerUrl("anonSimple", "../anon/anonSimple.html");
    doh.registerUrl("cjsSpace", "../cjsSpace/cjsSpace.html");
    doh.registerUrl("cjsDotRequire", "../cjsSpace/cjsDotRequire.html");
    doh.registerUrl("packages", "../packages/packages.html");
    doh.registerUrl("packagesConfig", "../packages/config/config.html");
    doh.registerUrl("packagesNestedMain", "../packagesNestedMain/packagesNestedMain.html");
    doh.registerUrl("packagesNode", "../packagesNode/packagesNode.html");
    doh.registerUrl("packagesNodeAdapter", "../packagesNodeAdapter/packagesNodeAdapter.html");
    doh.registerUrl("specialDeps", "../specialDeps/specialDeps.html");
}

doh.registerUrl("simple-nohead", "../simple-nohead.html");

doh.registerUrl("hasOwnPropertyTests", "../hasOwnProperty/hasOwnProperty.html");

//Only do the base test if the urls work out.
if (location.href.indexOf('http://127.0.0.1/requirejs/') === 0) {
    doh.registerUrl("simple-badbase", "../simple-badbase.html");
}


doh.registerUrl("circular", "../circular.html");
doh.registerUrl("circularDupe", "../circular/dupe/dupe.html");
doh.registerUrl("circularPlugin", "../circular/circularPlugin.html");
doh.registerUrl("circularComplexPlugin", "../circular/complexPlugin/complexPlugin.html");
doh.registerUrl("circular414", "../circular/414/414.html");
doh.registerUrl("circularTranspiler", "../circular/transpiler/transpiler.html");

doh.registerUrl("nestedRequire", "../nestedRequire/nestedRequire.html");

doh.registerUrl("depEmpty", "../depEmpty.html");
doh.registerUrl("depoverlap", "../depoverlap.html");
doh.registerUrl("urlfetch", "../urlfetch/urlfetch.html");
doh.registerUrl("uniques", "../uniques/uniques.html");
doh.registerUrl("dotTrim", "../dotTrim/dotTrim.html");
doh.registerUrl("multiversion", "../multiversion.html", 10000);

doh.registerUrl("isBrowser", "../isBrowser/isBrowser.html");
doh.registerUrl("onResourceLoadNestedRequire", "../onResourceLoad/nestedRequire.html", 5000);

doh.registerUrl("jquery", "../jquery/jquery.html");

//Next three tests fail in PS3
doh.registerUrl("jqueryDynamic", "../jquery/jqueryDynamic.html");
doh.registerUrl("jqueryDynamic2", "../jquery/jqueryDynamic2.html");

doh.registerUrl("i18nlocaleunknown", "../i18n/i18n.html?bundle=i18n!nls/fr-fr/colors");

doh.registerUrl("i18n", "../i18n/i18n.html");
//Fail in PS3
doh.registerUrl("i18nlocale", "../i18n/i18n.html?locale=en-us-surfer");
//Fail in PS3
doh.registerUrl("i18nbundle", "../i18n/i18n.html?bundle=i18n!nls/en-us-surfer/colors");

//Probably fail in PS3
doh.registerUrl("i18ncommon", "../i18n/common.html");
doh.registerUrl("i18ncommonlocale", "../i18n/common.html?locale=en-us-surfer");


doh.registerUrl("shimBasic", "../shim/basic.html");
doh.registerUrl("shimBasicBuilt", "../shim/built/basic-built.html");

doh.registerUrl("paths", "../paths/paths.html");
doh.registerUrl("pathsRelativeNormalize", "../paths/relativeNormalize/relativeNormalize.html");

doh.registerUrl("moduleConfig", "../moduleConfig/moduleConfig.html");

doh.registerUrl("mapConfig", "../mapConfig/mapConfig.html");
doh.registerUrl("mapConfigBuilt", "../mapConfig/built/mapConfigBuilt.html");
doh.registerUrl("mapConfigStar", "../mapConfig/mapConfigStar.html");
doh.registerUrl("mapConfigStarBuilt", "../mapConfig/built/mapConfigStarBuilt.html");
doh.registerUrl("mapConfigStarAdapter", "../mapConfig/mapConfigStarAdapter.html");
doh.registerUrl("mapConfigStarAdapterBuilt", "../mapConfig/built/mapConfigStarAdapterBuilt.html");
doh.registerUrl("mapConfigMulti", "../mapConfig/mapConfigMulti.html");
doh.registerUrl("mapConfigDelayed", "../mapConfig/mapConfigDelayed.html");
doh.registerUrl("mapConfigRelative", "../mapConfig/mapConfigRelative.html");
doh.registerUrl("mapConfigSpecificity", "../mapConfig/mapConfigSpecificity.html");
doh.registerUrl("mapConfigPlugin", "../mapConfig/mapConfigPlugin.html");
doh.registerUrl("mapConfigPluginBuilt", "../mapConfig/built/mapConfigPluginBuilt.html");

doh.registerUrl("layers", "../layers/layers.html", 10000);

doh.registerUrl("bundles", "../bundles/bundles.html");

doh.registerUrl("afterload", "../afterload.html", 10000);

doh.registerUrl("universal", "../universal/universal.html");
doh.registerUrl("universalBuilt", "../universal/universal-built.html");

doh.registerUrl("defineDouble", "../defineDouble/defineDouble.html");
doh.registerUrl("definedSpecified", "../definedSpecified/definedSpecified.html");
doh.registerUrl("delayedDefine", "../delayedDefine/delayedDefine.html");
doh.registerUrl("nestedDefine", "../nestedDefine/nestedDefine.html");
doh.registerUrl("nestedDefine2", "../nestedDefine/nestedDefine2.html");
doh.registerUrl("nestedRelativeRequire", "../nestedRelativeRequire/nestedRelativeRequire.html");
doh.registerUrl("nestedRequireConfig", "../nestedRequireConfig/nestedRequireConfig.html");

doh.registerUrl("pluginBundles", "../plugins/pluginBundles/pluginBundles.html");
doh.registerUrl("pluginBundlesSeparateText", "../plugins/pluginBundlesSeparateText/pluginBundlesSeparateText.html");

doh.registerUrl("pluginsSync", "../plugins/sync.html");
doh.registerUrl("pluginsOnError", "../plugins/onerror/onerror.html");
doh.registerUrl("doublePluginCall", "../plugins/double.html");
doh.registerUrl("pluginsNameOnly", "../plugins/nameOnly.html");
doh.registerUrl("pluginsDelegated", "../plugins/delegated/delegated.html");
doh.registerUrl("pluginsFromText", "../plugins/fromText/fromText.html");
doh.registerUrl("pluginsFromTextEvalError", "../plugins/fromTextEvalError/fromTextEvalError.html");
doh.registerUrl("pluginsFromTextConfig", "../plugins/fromText/fromTextConfig.html");
doh.registerUrl("pluginsFromTextNoDefine", "../plugins/fromTextNoDefine/fromTextNoDefine.html");
doh.registerUrl("pluginsTextDepend", "../plugins/textDepend/textDepend.html");
doh.registerUrl("pluginLast", "../plugins/pluginLast/pluginLast.html");
doh.registerUrl("pluginShim", "../plugins/pluginShim/pluginShim.html");
doh.registerUrl("pluginMap", "../plugins/pluginMap/pluginMap.html");
doh.registerUrl("pluginMapSameName", "../plugins/pluginMapSameName/pluginMapSameName.html");
doh.registerUrl("pluginMapDynamic", "../plugins/pluginMap/dynamic/pluginMapDynamic.html");
doh.registerUrl("pluginComplexNormalize", "../plugins/complexNormalize/complexNormalize.html");
doh.registerUrl("pluginNormalize", "../plugins/pluginNormalize/pluginNormalize.html");

doh.registerUrl("requirePluginLoad", "../requirePluginLoad/requirePluginLoad.html");

doh.registerUrl("requireAsync", "../requireAsync/requireAsync.html");

doh.registerUrl("issue379", "../issue379/issue379.html");

doh.registerUrl("text", "../text/text.html");
doh.registerUrl("textOnly", "../text/textOnly.html");
doh.registerUrl("textBuilt", "../text/textBuilt.html");
doh.registerUrl("textOnError", "../text/textOnError.html");
doh.registerUrl("textOnXhr", "../text/textOnXhr.html");
doh.registerUrl("jsonp", "../jsonp/jsonp.html");
doh.registerUrl("domReady", "../domReady/domReady.html");
doh.registerUrl("domReadyExtraConfig", "../domReady/domReadyExtraConfig.html");

doh.registerUrl("relative", "../relative/relative.html");
doh.registerUrl("relativeBaseUrl", "../relative/relativeBaseUrl.html");
doh.registerUrl("relativeOutsideBaseUrl", "../relative/outsideBaseUrl/a/outsideBaseUrl.html");

doh.registerUrl("remoteUrls", "../remoteUrls/remoteUrls.html");

// IE does not support data URIs for scripts. This is a crude exclusion test
// but is good enough that the test is run in enough browsers to prove it works.
if (!document.attachEvent) {
    doh.registerUrl("datauri", "../datauri/datauri.html");
}

doh.registerUrl("queryPath", "../queryPath.html");

doh.registerUrl("trailingComma", "../trailingComma/trailingComma.html");

//Hmm, PS3 does not like exports test? assign2 is undefined?
doh.registerUrl("exports", "../exports/exports.html");

doh.registerUrl("moduleAndExports", "../exports/moduleAndExports.html");

if (typeof Worker !== "undefined") {
    doh.registerUrl("workers", "../workers.html");
}

doh.registerUrl("undef", "../undef/undef.html", 8000);
doh.registerUrl("undefNoRequire", "../undef/undefNoRequire.html", 3000);
doh.registerUrl("undefNoRequire2", "../undef/undefNoRequire2.html", 3000);
doh.registerUrl("undefEnforceShim", "../undef/undefEnforceShim.html", 8000);
doh.registerUrl("undefLocal", "../undef/undefLocal.html", 8000);
doh.registerUrl("errorContinue", "../error/errorContinue.html", 8000);
doh.registerUrl("errorContinueLocal", "../error/errorContinueLocal.html", 8000);
doh.registerUrl("errorDoubleRequire", "../error/doubleRequire/doubleRequire.html", 8000);
doh.registerUrl("errorRequireErrback", "../error/requireErrback.html", 2000);
doh.registerUrl("errorGlobalOnError", "../error/globalOnError.html", 2000);
doh.registerUrl("pluginErrorContinue", "../error/pluginErrorContinue.html", 8000);
doh.registerUrl("pluginErrorContinueLocal", "../error/pluginErrorContinueLocal.html", 8000);
doh.registerUrl("defineErrorLocal", "../error/defineErrorLocal.html");

doh.registerUrl("pathArray", "../pathArray/pathArray.html", 8000);
doh.registerUrl("pathArrayWithMap", "../pathArray/withMap/withMap.html", 8000);
doh.registerUrl("pathArrayFail", "../pathArray/pathArrayFail.html", 10000);
