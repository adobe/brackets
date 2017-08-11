// Preact test utils version 0.1.3
define(function(require, exports, module) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _preactCompat = require('./preact-compat');

    var _preactCompat2 = _interopRequireDefault(_preactCompat);

    var _simulateEvent = require('./simulate-event');

    var _simulateEvent2 = _interopRequireDefault(_simulateEvent);

    var _events = require('./events');

    var _events2 = _interopRequireDefault(_events);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    //TODO
    var ReactShallowRenderer = function () {
        function ReactShallowRenderer() {
            _classCallCheck(this, ReactShallowRenderer);
        }

        ReactShallowRenderer.prototype.render = function render(node, context) {};

        ReactShallowRenderer.prototype.getRenderOutput = function getRenderOutput() {};

        return ReactShallowRenderer;
    }();

    var ReactTestUtils = {
        renderIntoDocument: function renderIntoDocument(element) {
            var div = document.createElement('div');
            return _preactCompat2['default'].render(element, div);
        },
        isElement: function isElement(element) {
            return _preactCompat2['default'].isValidElement(element);
        },
        isElementOfType: function isElementOfType(inst, convenienceConstructor) {
            return _preactCompat2['default'].isValidElement(inst) && inst.type === convenienceConstructor;
        },
        isDOMComponent: function isDOMComponent(inst) {
            return !!(inst && inst.nodeType === 1 && inst.tagName);
        },
        isCompositeComponent: function isCompositeComponent(inst) {
            if (ReactTestUtils.isDOMComponent(inst)) {
                return false;
            }
            return inst != null && typeof inst.render === 'function' && typeof inst.setState === 'function';
        },
        isCompositeComponentWithType: function isCompositeComponentWithType(inst, type) {
            if (!ReactTestUtils.isCompositeComponent(inst)) {
                return false;
            }
            var constructor = inst.type;
            return constructor === type;
        },
        isCompositeComponentElement: function isCompositeComponentElement(inst) {
            if (!_preactCompat2['default'].isValidElement(inst)) {
                return false;
            }
            // We check the prototype of the type that will get mounted, not the
            // instance itself. This is a future proof way of duck typing.
            var prototype = inst.type.prototype;
            return typeof prototype.render === 'function' && typeof prototype.setState === 'function';
        },
        findAllInRenderedTree: function findAllInRenderedTree(inst, test) {
            if (!inst) {
                return [];
            }
            var findTreeFromDOM = function findTreeFromDOM(dom, test) {
                var ret = [];
                var inc = dom._component;
                if (inc && test(inc)) {
                    ret.push(inc, dom);
                    for (var i = 0; i < dom.childNodes.length; i++) {
                        var childNode = dom.childNodes[i];
                        ret = ret.concat(findTreeFromDOM(childNode, test));
                    }
                } else if (_preactCompat2['default'].isDOMComponent(dom)) {
                    ret.push(dom);
                }
                return ret;
            };
            return findTreeFromDOM(inst.base, test);
        },
        mockComponent: function mockComponent(module, mockTagName) {
            mockTagName = mockTagName || module.mockTagName || 'div';

            module.prototype.render.mockImplementation(function () {
                return _preactCompat2['default'].createElement(mockTagName, null, this.props.children);
            });
            return this;
        },
        batchedUpdates: function batchedUpdates(callback) {
            callback();
        },
        createRenderer: function createRenderer() {
            return new ReactShallowRenderer();
        },

        Simulate: {}
    };

    function buildSimulate() {
        _events2['default'].forEach(function (event) {
            ReactTestUtils.Simulate[event] = function (node, mock) {
                _simulateEvent2['default'].simulate(node, event.toLowerCase(), mock);
            };
        });
    }

    buildSimulate();

    exports['default'] = ReactTestUtils;
    module.exports = exports['default'];
});
