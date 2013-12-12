goog.provide('ol.xml');

goog.require('goog.asserts');
goog.require('goog.dom.NodeType');


/**
 * @typedef {Object.<string, (function(Node): *|ol.xml.Parser)>}
 */
ol.xml.Parser;


/**
 * @param {function(this: S, Node): T|ol.xml.Parser} value Value.
 * @param {Node} node Node.
 * @param {S=} opt_obj Scope.
 * @return {T} Result.
 * @template S,T
 */
ol.xml.parse = function(value, node, opt_obj) {
  if (goog.isFunction(value)) {
    var nodeReader = /** @type {function(Node): *} */ (value);
    return nodeReader.call(opt_obj, node);
  } else if (goog.isObject(value)) {
    var parser = /** @type {ol.xml.Parser} */ (value);
    var n;
    for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
      if (n.nodeType == goog.dom.NodeType.ELEMENT) {
        if (parser.hasOwnProperty(n.nodeName)) {
          var result = ol.xml.parse(parser[n.nodeName], n, opt_obj);
          if (result) {
            return result;
          }
        }
      }
    }
  } else {
    goog.asserts.fail();
  }
  return undefined;
};


/**
 * @param {ol.xml.Parser} parser Parser.
 * @param {Node} node Node.
 * @param {*=} opt_obj Scope.
 * @return {*} Result.
 */
ol.xml.parseNode = function(parser, node, opt_obj) {
  if (parser.hasOwnProperty(node.nodeName)) {
    return ol.xml.parse(parser[node.nodeName], node, opt_obj);
  } else {
    return undefined;
  }
};
