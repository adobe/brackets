<?
if($_GET['quirks'] == "")
{
    echo "<!DOCTYPE html>\n";
}
else
{
    echo "\n";
}
?>
<html>
<head>
    <title>Async Attribute Test</title>
    <script type="text/javascript" src="../common.js"></script>
    <script type="text/javascript">
    var attachScript = function(url, name, approach){
        url += "?stamp=" + (new Date()).getTime();

        var node = document.createElement("script");
        node.src = url;
        node.type = "text/javascript";
        node.charset = "utf-8";
        if (approach === 'boolean') {
            node.async = true;
        } else if (approach === 'string') {
            node.async = 'async';
        } else if (approach === 'attribute') {
            node.setAttribute('async', 'async');
        }

        document.getElementsByTagName("head")[0].appendChild(node);
    }

    var urls = [
        "one.php",
        "two.js"
    ];

    var loadUrls = function(approach) {
        for (var i = 0, url; url = urls[i]; i++) {
            attachScript(url, url, approach);
        }
    }

    function onFormAction () {
        var select = document.getElementById('approach'),
            approach = select.value,
            text = select.options[select.selectedIndex].text;
        window.log('Using approach: [' + text + '] (' + approach + ')...');
        loadUrls(approach);
    };

    </script>
</head>
<body>
    <h1>Async Attribute Test</h1>
    <p><b>This test requires PHP to be enabled to run.</b></p>

    <p>This test tests async attribute. It attaches two scripts to the DOM, <b>one.php</b> and <b>two.js</b>.
    The URLs to the scripts always has a timestamp querystring to make sure the scripts are fetched
    fresh for each request.</p>
    
    <p>one.php uses a PHP sleep of 3 seconds before returning its result (a log message), where two.js will return
    immediately with a log message.</p>
    
    <p>If the async attribute is being effective (In Gecko 1.9.2+/Firefox 3.6+ browsers, maybe
    Opera in the future), then the log message for two.js should appear before the one.php log message.
    If async is <b>not</b> effective, then one.php's log message will appear first.</p>

    <p>You can also <b><a href="async.php?quirks=true">try this page in quirks mode</a></b>.
    When you are done, come back to <b><a href="async.php">standards mode</a></b>.</p>

    <p>Watch the console for log messages. If no console is available, then it should print
    the log messages in the DOM.</p>

    <p><b>Expected Results in All Browsers (except Opera)</b>:</p>
    <ul>
        <li>two.js script</li>
        <li>one.php script</li>
    </ul>

    <form onsubmit="onFormAction(); return false;">
        <label for="approach">Choose an approach to indicate async:</label>
        <select id="approach" onchange="onFormAction();">
            <option value="boolean">script.async = true</option>
            <option value="string">script.async = 'async'</option>
            <option value="attribute">script.setAttribute('async', 'async')</option>
            <option value="">No async (one.php should be first in Firefox 3.6+)</option>
        </select>
        <input type="submit" name="Go" value="Go"> 
    </form>

</body>
</html>
