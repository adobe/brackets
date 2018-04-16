/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

/* Extension to add TouchBar support to Brackets */
/* This is where we"ll create a Touch Bar instance and render it to the view */
/* currently just runs the test suite */
define(function(require, exports, module) {

    // Global Variable to keep track of TouchBar items
    // used for IDs to make items specifically targetabble
    // don"t start at 0 to avoid any NULL and ! potential errors
    var nextID = 1;

    // Default colors in case no colors provided
    // order: blue, red, yellow, green, white, black
    /** @const */ var defaultColors = ["#3498db", "#e74c3c", "#f1c40f", "#2ecc71", "#FFFFFF", "#000000"];

    // Representation of a text label
    class TextLabel {
        // Requires: nothing
        // Modifies: nothing
        // Effects: creates a Text Label object, if no props are specifed will default
        //          to white colored text with "No Text Specified"
        // Note: valid representations of colors could be # or rgba(), textLabels
        //       can support either
        /** @constructor */ constructor(props) {
            if (props == null) {
                props = {
                    text: "No Text Specified",
                    color: "#FFFFFF",
                };
            }
            this._properties = {};
            this._properties["text"] = props["text"];
            this._properties["type"] = "TextLabel";
            this._properties["color"] = props["color"];
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns the text for a label
        _getText() {
            return this._properties["text"];
        }

        // Requires: newText is a String
        // Modifies: nothing
        // Effects: sets the text element of the label to newText
        _setText(newText) {
            this._properties["text"] = newText;
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns the color of the label
        _getColor() {
            return this._properties["color"];
        }

        // Requires: newColor is a valid color representation string
        // Modifies: nothing
        // Effects: sets the color of the label to newColor
        _setColor(newColor) {
            this._properties["color"] = newColor;
        }
    }

    // this class will represent the touch bar item and its functionality
    // Abstract Touch Bar Item base class
    // Subclasses (instances) will have their own onInteraction property and type
    class TouchBarItem {
        // Constructor -- takes no props b/c it"s a base class!
        // Requires: nothing
        // Modifies: nothing
        // Effects: implements basic functionality for all Touch Bar Items
        /** @constructor */ constructor() {
            // store properties as dictionary
            this._properties = {};
            // there can only be 1 parent
            this._parent = [];
            // create the id
            this._addProperty("id", nextID);
            // don"t forget to increment for the next item!
            nextID += 1;
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: adds a property to the Item
        _addProperty(key, value) {
            this._properties[key] = value;
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: removes a property from the Item
        //          returns true if success, false if property not found
        _removeProperty(key) {
            if (key in this._properties) {
                delete this._properties[key];
                return true;
            }
            else {
                return false;
            }
        }

        // Requires: nothi ng
        // Modifies: nothing
        // Effects: returns the property at a given key
        //          makes no gaurantee that it won"t return undefined
        _getProperty(key) {
            return this._properties[key];
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns the ID for an item
        // Note: much better syntax since this is a commonly used function
        _getID() {
            return this._getProperty("id");
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns all the properties of an Item
        _getProperties() {
            return this._properties;
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: updates the value of a key with value for an Item
        // Note: if the property doesn"t exist for a given key, it will be created
        _setProperty(key, newValue) {
            this._properties[key] = newValue;
        }


        // Requires: parent is a valid Touch Bar
        // Modifies: nothing
        // Effects: adds the parent Touch Bar to the Item
        // Note: throws an error if attempting to add to multiple Touch Bars
        _addParent(parent) {
            // can only add 1 parent!
            if (this._parent.length == 0) {
                this._parent.push(parent);
            }
            else {
                throw new Error("Cannot add item to multiple Touch Bars");
            }
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: removes the parent Touch Bar from the item
        //          returns false if no parent found, otherwise returns true on success
        _removeParent() {
            if (this._parent.length == 0) {
                return false;
            }
            else {
                this._parent = [];
                return true;
            }
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns the parent Touch Bar or undefined if it doesn"t exist
        _getParent() {
            if (this._parent.length == 0) {
                return undefined;
            }
            else {
                return this._parent;
            }
        }
    }

    // A Button for the Touch Bar
    class TouchBarButton extends TouchBarItem {
        // Requires: nothing
        // Modifies: nothing
        // Effects: creates a TouchBarButton item, if props aren"t specified will use
        //          default values of black button with white text and an interaction
        //          of console.log()
        /** @constructor @extends {TouchBarItem} */ constructor(props) {
            super();
            // some defaults
            if (props == null) {
                props = {
                    label: new TextLabel({"text": "#FFFFFF", "color": "#FFFFFF"}),
                    background_color: "#000000",
                    interaction: console.log("please specify an interaction for this button "),
                };
            }

            // pull data out of props
            var label = props["label"];
            var interaction = props["interaction"];
            var background_color = props["background_color"];
            // set type
            this._addProperty("type", "Button");
            this._addProperty("label", label);
            this._addProperty("background_color", background_color);

            // determine what happens on item changing
            // if user doesn"t pass a function, default to console.log()
            if ((typeof(interaction) != "function") || (interaction == null)) {
                this._addProperty("onInteraction", function(event) {
                    console.log("default interaction: ", event);
                });
            }
            // add interaction function property
            else {
                this._addProperty("onInteraction", interaction);
            }
        }
    }

    // A Color Picker for the Touch Bar
    class ColorPicker extends TouchBarItem {
        // Requires: nothing
        // Modifies: nothing
        // Effects: creates a color picker object, if no props are given, uses the default colors
        //          and on interaction uses console.log()
        /** @constructor @extends {TouchBarItem} */ constructor(props) {
            // Need to explicity call the TouchBarItem constructor first
            // b/c it"s the base class -- just like C++ or Swift
            super();

            // Check to see if props were provided, if not use default
            if (props == null) {
                //console.log("no colors specific, using default colors");
                props = {
                    colors: defaultColors,
                    interaction: console.log("please specify an interaction for this colorpicker"),
                };
            }
            // pull colors out of props
            var colors = props["colors"];
            var interaction = props["interaction"];
            // set type
            this._addProperty("type", "ColorPicker");
            // add colors properties, default color is white
            this._addProperty("colors", colors);
            this._addProperty("chosenColor", "#FFFFFF");

            // add the buttons
            var buttonsToAdd = [];
            colors.forEach(function (value, index) {
                buttonsToAdd.push(new TouchBarButton({
                    label: String(colors[index]),
                    background_color: colors[index],
                    interaction: interaction,
                }));
            });
            this._addProperty("colorButtons", buttonsToAdd);


            // determine what happens on item changing
            // if user doesn"t pass a function, default to console.log()
            if ((typeof(interaction) != "function") || (interaction == null)) {
                this._addProperty("onInteraction", function(event) {
                    this._properties["chosenColor"] = event.color;
                    console.log(event.color);
                });
            }
            // add interaction property
            else {
                this._addProperty("onInteraction", function(event) {
                    this._properties["chosenColor"] = event.color;
                });
            }
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns how many colors the picker has
        _getNumColors() {
            return this._properties["colors"].length;
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns all the colors in the picker
        _getAllColors() {
            return this._properties["colors"];
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns the color of the current chosen color
        _getCurrentColor() {
            return this._properties["chosenColor"];
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: sets the current chosen color
        _setCurrentColor(newColor) {
            this._properties["chosenColor"] = newColor;
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns if the color picker contains a color
        _hasColor(colorToCheck) {
            return this._properties["colors"].indexOf(colorToCheck) >= 0;
        }

        // Requires: newColor is a valid color representation
        // Modifies: nothing
        // Effects: adds a color to the Color Picker if it doesn"t already exist
        //          returns true if a successfully added, false otherwise
        _addColor(newColor) {
            if (this._hasColor(newColor)) {
                return false;
            }
            else {
                this._properties["colors"].push(newColor);
                this._properties["colorButtons"].push(new TouchBarButton({
                    label: newColor,
                    background_color: newColor,
                    interaction: this._properties["onInteraction"],
                }));
                return true;
            }
        }

        // Requires: colorToRemove is a valid color representation
        // Modifies: nothing
        // Effects: removes the color if it was found in the picker
        //          returns true if the color was found and removed, false otherwise
        _removeColor(colorToRemove) {
            // cannot use _hasColor because we need the index
            var idx = this._properties["colors"].indexOf(colorToRemove);
            if (idx >= 0) {
                delete this._properties["colors"][idx];
                delete this._properties["colorButtons"][idx];
                return true;
            }
            else {
                return false;
            }
        }
    }

    // this class will represent the Touch Bar + it"s functionality
    // we use _functionName to represent member functions
    class TouchBar {
        // Requires: props is a valid dictionary of TouchBarItems
        // Modifies: nothing
        // Effects: creates a Touch Bar object, will throw Error if no items specified
        /** @constructor */ constructor(props) {

            // User didn"t specify any options, doesn"t
            // make sense to have an empty Touch Bar
            if (props == null) {
                throw new Error("Cannot Instantiate empty Touch Bar\nFix: Specify TouchBar options for configuration as an array");
            }

            // Hold the event listeners
            this._eventListeners = {};
            // Hold items for the Touch Bar
            this._touchBarItems = {};
            // is mounted to window
            this._isMounted = false;
            // window mounted to
            this._parentWindow = [];

            // Add all the items to the Touch Bar
            var itemsToAdd = props["items"];
            var _this = this;
            itemsToAdd.forEach(function(value, index) {
                _this._touchBarItems[itemsToAdd[index]._getID()] = itemsToAdd[index];
            });
        }

        // Requires: item is a valid TouchBarItem
        // Modifies: nothing
        // Effects: determines if the item is a part of a the touch bar
        _hasItem(item) {
            return item._getID() in this._touchBarItems;
        }

        // Requires: item is a valid TouchBarItem
        // Modifies: nothing
        // Effects: adds an item to the Touch Bar if it doesn"t already exist
        //          if the TouchBar is mounted, adds an event listener
        //          returns true on success, false otherwise
        _addItem(item) {
            // if element already exists, return false
            if (this._hasItem(item)) {
                return false;
            }
            // add element, return true
            else {
                this._touchBarItems[item._getID()] = item;
                this._eventListeners[item._getID()] = item;

                // add an event listener if binded to window
                if (this._isMounted) {
                    this._parentWindow.addEventListener(item._getID(), item._getProperty("onInteraction"));
                }

                return true;
            }
        }

        // Requires: item is a valid TouchBarItem
        // Modifies: nothing
        // Effects: removes the element from the Touch Bar and removes any event listeners
        //          returns true on sucess, false otherwise
        _removeItem(item) {
            if (!this._hasItem(item)) {
                return false;
            }
            // remove the element
            else {
                if (this._isMounted) {
                    this._parentWindow.removeEventListener(item._getID());
                }
                delete this._touchBarItems[item._getID()];
                delete this._eventListeners[item._getID()];
                return true;
            }
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns the number of items the Touch Bar has
        _numItems() {
            return Object.keys(this._touchBarItems).length;
        }

        // Requires: window is a valid UI window
        // Modifies: window
        // Effects: adds the Touch Bar as a variable to the window
        //          adds an event listener for item interactions
        //          sets parent window
        _mountToWindow(window) {

            // Check to see if the window already has a Touch Bar,
            // if so, don"t add again
            if (window in this._eventListeners) {
                return;
            }
            // don"t double mount
            else if (this._isMounted) {
                return;
            }

            // add TouchBar variable to the window
            window._touchBar = this;

            // add all event listeners to window
            var _this = this;
            this._touchBarItems.forEach(function(value, index) {
                window.addEventListener(_this._touchBarItems[index]._getID(), _this._touchBarItems[index]._getProperty("onInteraction"));
            })

            this._parentWindow = window;
            this._isMounted = true;
        }

        // Requires: nothing
        // Modifies: nothing
        // Effects: returns if the window is mounted or not
        _hasWindow() {
            return this._isMounted;
        }

        // removes the event listener
        // removes the bar from the window
        // Requires: window is a valid UI window
        // Modifies: window
        // Effects: removes the Touch Bar varaibles from the window
        //          removes any event listeners for all items
        //          unsets the parent element
        _unmountFromWindow(window) {
            var _this = this;
            this._touchBarItems.forEach(function(value, index) {
                window.removeEventListener(this._touchBarItems[index]._getID());
            });

            delete window._touchBar;
            this._parentWindow = [];
            this._isMounted = false;
        }
    }

    /* jshint ignore:start */
    // a simple function for testing onInteractions
    function __print(data) {
        console.log(data);
    }

    // asserts condition and returns pass / fail (true / false)
    function assert(condition, lineNumber) {
        if (!condition) {
            console.log("Assertion Failed on line: " + String(lineNumber));
            return false;
        }
        return true;
    }

    // tests the TextLabel class
    function testTextLabel() {
        // Test Text Label
        var textLabelPassed = true;
        console.log("---- testing text label ----");

        // Checking default
        const defaultTextLabel = new TextLabel();
        textLabelPassed = assert(defaultTextLabel._getText() == "No Text Specified", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        textLabelPassed = assert(defaultTextLabel._getColor() == "#FFFFFF", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // Testing setters on default object
        defaultTextLabel._setText("changing the text");
        defaultTextLabel._setColor("#AABBCC");
        textLabelPassed = assert(defaultTextLabel._getText() == "changing the text", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        textLabelPassed = assert(defaultTextLabel._getColor() == "#AABBCC", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));


        const textLabel1 = new TextLabel({
            "text": "Testing text feature",
            "color": "#F7F7F7"
        });

        textLabelPassed = assert(textLabel1._getText() == "Testing text feature", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        textLabelPassed = assert(textLabel1._getColor() == "#F7F7F7", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // Testing setters on non-default object
        textLabel1._setText("changing the text second time");
        textLabel1._setColor("#DDAABB");
        textLabelPassed = assert(textLabel1._getText() == "changing the text second time", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        textLabelPassed = assert(textLabel1._getColor() == "#DDAABB", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // Final Test
        if (textLabelPassed) {
            console.log("%c---- text label tests passed ----", "color: #27ae60");
        }
        else {
            console.log("%c---- TEXT LABEL DID NOT PASS TESTS ----", "color: #e74c3c");
        }
        return textLabelPassed;
    }

    // tests the TouchBarButton class
    function testTouchBarButton() {
        // Test TouchBarButton
        var touchBarButtonPassed = true;
        console.log("---- testing touch bar button ----");

        // Testing a default button
        console.log("expecting specified interaction message:");
        const defaultButton = new TouchBarButton();
        touchBarButtonPassed = assert(defaultButton._getProperty("background_color") == "#000000", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        touchBarButtonPassed = assert(defaultButton._getProperty("label")._getColor() == "#FFFFFF", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        touchBarButtonPassed = assert(defaultButton._getProperty("label")._getText() == "#FFFFFF", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));


        // Testing non-default button
        const nonDefaultButton = new TouchBarButton({
            "label": new TextLabel({"text": "testing touch bar button", "color": "#AABBDD"}),
            "background_color": "#EEFFEE",
            "interaction": __print,
        });

        touchBarButtonPassed = assert(nonDefaultButton._getProperty("background_color") == "#EEFFEE", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        touchBarButtonPassed = assert(nonDefaultButton._getProperty("label")._getColor() == "#AABBDD", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        touchBarButtonPassed = assert(nonDefaultButton._getProperty("label")._getText() == "testing touch bar button", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        console.log("should see 'testing button interaction' printed below:");
        nonDefaultButton._getProperty("onInteraction")("testing button interaction");

        // Final Test
        if (touchBarButtonPassed) {
            console.log("%c---- touch bar button tests passed ----", "color: #27ae60");
        }
        else {
            console.log("%c---- TOUCH BAR BUTTON DID NOT PASS TESTS ----", "color: #e74c3c");
        }
        return touchBarButtonPassed;
    }

    // tests the TouchBarItem class
    function testTouchBarItem() {
        // Test TouchBarButton
        var touchBarItemPassed = true;
        console.log("---- testing touch bar item abstract class ----");

        // testing default
        const defaultItem = new TouchBarItem();
        touchBarItemPassed = assert(defaultItem._getProperty("id") == 1, new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        touchBarItemPassed = assert(defaultItem._getID() == 1, new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        // testing add property
        defaultItem._addProperty("name", "first-item");
        defaultItem._addProperty("second", "second-item");
        touchBarItemPassed = assert(defaultItem._getProperty("name") == "first-item", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        touchBarItemPassed = assert(defaultItem._getProperty("second") == "second-item", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // testing set property
        defaultItem._setProperty("name", "new-first");
        defaultItem._setProperty("second", "new-second");
        touchBarItemPassed = assert(defaultItem._getProperty("name") == "new-first", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        touchBarItemPassed = assert(defaultItem._getProperty("second") == "new-second", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // testing remove property
        defaultItem._removeProperty("name");
        defaultItem._removeProperty("second");
        touchBarItemPassed = assert(defaultItem._getProperty("name") == undefined, new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        touchBarItemPassed = assert(defaultItem._getProperty("second") == undefined, new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // testing parent functionality
        // should return false because no parent exists
        touchBarItemPassed = assert(!defaultItem._removeParent(), new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        defaultItem._addParent("test touch bar");
        touchBarItemPassed = assert(defaultItem._getParent() == "test touch bar", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        defaultItem._removeParent();
        touchBarItemPassed = assert(defaultItem._getParent() == undefined, new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // Final Test
        if (touchBarItemPassed) {
            console.log("%c---- touch bar item abstract class tests passed ----", "color: #27ae60");
        }
        else {
            console.log("%c---- TOUCH BAR ITEM ABSTRACT CLASS DID NOT PASS TESTS ----", "color: #e74c3c");
        }
        return touchBarItemPassed;
    }

    // tests the ColorPicker class
    function testColorPicker() {
        // TEST COLOR PICKER
        var pickerPassed = true;
        console.log("---- testing color picker ----");

        // default color picker
        console.log("expecting specified interaction message:");
        const defaultPicker = new ColorPicker();
        // There should be 6 colors in the default color picker
        pickerPassed = assert(defaultPicker._getNumColors() == 6, new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        pickerPassed = assert(defaultPicker._getCurrentColor() == "#FFFFFF", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        defaultPicker._setCurrentColor(defaultPicker._getAllColors()[2]);
        pickerPassed = assert(defaultPicker._getCurrentColor() == "#f1c40f", new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        pickerPassed = assert(defaultPicker._hasColor("#f1c40f"), new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        // testing add and remove colors
        defaultPicker._addColor("#AABBCC");
        pickerPassed = assert(defaultPicker._hasColor("#AABBCC"), new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        // should return false because color not found
        pickerPassed = assert(!defaultPicker._removeColor("#FFAABB"), new Error().stack.slice(122, 126).replace(":","").replace(" ",""));
        defaultPicker._removeColor("#AABBCC");
        // color shouldn"t be there anymore
        pickerPassed = assert(!defaultPicker._hasColor("#AABBCC"), new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // non-default color picker
        const colorPicker2 = new ColorPicker({
            colors: ["#374567", "#c0392b"],
            interaction: __print,
        });
        // There should be 2 colors in this one
        pickerPassed = assert(colorPicker2._getNumColors() == 2, new Error().stack.slice(122, 126).replace(":","").replace(" ",""));

        // Final Test
        if (pickerPassed) {
            console.log("%c---- color picker tests passed ----", "color: #27ae60");
        }
        else {
            console.log("%c---- COLOR PICKER DID NOT PASS TESTS ----", "color: #e74c3c");
        }
        return pickerPassed;
    }

    // tests the TouchBar class
    function testTouchBar() {
        // Test Touch Bar
        var touchBarPassed = true;
        console.log("---- testing touch bar ----");

        console.log("expecting specified interaction message:");
        const colorPicker = new ColorPicker();

        const touchBar = new TouchBar({
            items: [colorPicker],
        });

        console.log("expecting specified interaction message:");
        const testButton = new TouchBarButton();

        // should be 1 item
        touchBarPassed = assert(touchBar._numItems() == 1, new Error().stack.slice(122, 126).replace(":","").replace(" ","")); // TODO: is there a better way to do this?
        touchBarPassed = assert(touchBar._hasItem(colorPicker), new Error().stack.slice(122, 126).replace(":","").replace(" ","")); // TODO: is there a better way to do this?

        // testing add
        touchBar._addItem(testButton);
        touchBarPassed = assert(touchBar._numItems() == 2, new Error().stack.slice(122, 126).replace(":","").replace(" ","")); // TODO: is there a better way to do this?
        touchBarPassed = assert(touchBar._hasItem(testButton), new Error().stack.slice(122, 126).replace(":","").replace(" ","")); // TODO: is there a better way to do this?

        // testing remove
        touchBar._removeItem(testButton);
        touchBarPassed = assert(touchBar._numItems() == 1, new Error().stack.slice(122, 126).replace(":","").replace(" ","")); // TODO: is there a better way to do this?
        touchBarPassed = assert(!touchBar._hasItem(testButton), new Error().stack.slice(122, 126).replace(":","").replace(" ","")); // TODO: is there a better way to do this?


        if (touchBarPassed) {
            console.log("%c---- touch bar tests passed ----", "color: #27ae60");
        }
        else {
            console.log("%c---- TOUCH BAR DID NOT PASS TESTS ----", "color: #e74c3c");
        }
        return touchBarPassed;
    }

    // full test suite
    function testSuite() {
        console.log("-----------\nBEGIN TESTS\n-----------");

        testResults = [];

        testResults.push(testTextLabel());
        testResults.push(testTouchBarItem());
        testResults.push(testTouchBarButton());
        testResults.push(testColorPicker());
        testResults.push(testTouchBar());

        if (testResults.indexOf(false) < 0) {
            console.log("%c----------------\nALL TESTS PASSED\n----------------", "color: #27ae60");
        }
        else {
            console.log("%c-----------------\nTEST SUITE FAILED\n-----------------", "color: #e74c3c");
        }
    }

    // Uncomment this line to run the test suite
    testSuite();
});
/* jshint ignore:end */
