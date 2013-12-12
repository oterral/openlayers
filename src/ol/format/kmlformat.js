// FIXME use stream-based parser?
// FIXME read flatCoordinates
// FIXME writing

goog.provide('ol.format.KML');

goog.require('goog.asserts');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.format.XML');
goog.require('ol.geom.Geometry');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.style.Fill');
goog.require('ol.style.Image');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.xml');



/**
 * @constructor
 * @extends {ol.format.XML}
 * @param {ol.format.KMLOptions=} opt_options Options.
 */
ol.format.KML = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : options;

  goog.base(this);

  /**
   * @private
   * @type {Object.<string, ol.style.Style>}
   */
  this.styleMap_ = {};

  // FIXME options.extractAttributes
  // FIXME options.extractStyles

};
goog.inherits(ol.format.KML, ol.format.XML);


/**
 * @const {ol.Size}
 * @private
 */
ol.format.KML.DEFAULT_IMAGESTYLE_ANCHOR_ = [2, 20];


/**
 * @const {ol.Size}
 * @private
 */
ol.format.KML.DEFAULT_IMAGESTYLE_SIZE_ = [32, 32];


/**
 * @const {string}
 * @private
 */
ol.format.KML.DEFAULT_IMAGESTYLE_SRC_ =
    'http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png';


/**
 * @const {ol.style.Style}
 * @private
 */
ol.format.KML.DEFAULT_STYLE_ = new ol.style.Style({
  fill: new ol.style.Fill({
    color: '#ffffff'
  }),
  image: new ol.style.Image({
    anchor: ol.format.KML.DEFAULT_IMAGESTYLE_ANCHOR_,
    size: ol.format.KML.DEFAULT_IMAGESTYLE_SIZE_,
    src: ol.format.KML.DEFAULT_IMAGESTYLE_SRC_,
    rotation: 0,
    snapToPixel: undefined,
    subtractViewRotation: false
  }),
  stroke: new ol.style.Stroke({
    color: '#ffffff',
    width: 1
  })
});


/**
 * @typedef {{x: (number|undefined), xunits: (number|undefined),
 *            y: (number|undefined), yunits: (number|undefined)}}
 */
ol.format.KML.Vec2_;


/**
 * @param {ol.style.Style} style Style.
 * @return {ol.FeatureStyleFunction} Feature style function.
 */
ol.format.KML.makeFeatureStyleFunction = function(style) {
  // FIXME handle styleMap?
  var styleArray = [style];
  return (
      /**
       * @param {number} resolution Resolution.
       * @return {Array.<ol.style.Style>} Style.
       * @this {ol.Feature}
       */
      function(resolution) {
        var visibility = this.get('visibility');
        if (!goog.isDef(visibility) || visibility) {
          return styleArray;
        } else {
          return null;
        }
      });
};


/**
 * @param {Node} node Node.
 * @private
 * @return {Array.<ol.Coordinate>} Coordinates.
 */
ol.format.KML.findCoordinates_ = function(node) {
  var coordinates = ol.xml.parse(ol.format.KML.COORDINATES_PARSER_, node);
  if (goog.isDef(coordinates)) {
    return /** @type {Array.<ol.Coordinate>} */ (coordinates);
  } else {
    return null;
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.geom.RawLinearRing} Raw LinearRing.
 */
ol.format.KML.findRawLinearRing_ = function(node) {
  var coordinates = ol.xml.parse(ol.format.KML.RAW_LINEAR_RING_PARSER_, node);
  if (goog.isDef(coordinates)) {
    return /** @type {ol.geom.RawLinearRing} */ (coordinates);
  } else {
    return null;
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {boolean} Boolean.
 */
ol.format.KML.readBoolean_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  var s = ol.xml.getAllTextContent(node, false);
  var m = /^\s*(0|1)\s*$/.exec(s);
  if (m) {
    return m[1] == '1';
  } else {
    throw new Error('invalid boolean: ' + s);
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.Color} Color.
 */
ol.format.KML.readColor_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  var s = ol.xml.getAllTextContent(node, false);
  var m = /^\s*([0-9A-Fa-f]{8})\s*$/.exec(s);
  if (m) {
    var hexColor = m[1];
    return [
      parseInt(hexColor.substr(6, 2), 16),
      parseInt(hexColor.substr(4, 2), 16),
      parseInt(hexColor.substr(2, 2), 16),
      parseInt(hexColor.substr(0, 2), 16) / 255
    ];
  } else {
    throw new Error('invalid color: ' + s);
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {Array.<ol.Coordinate>} Coordinates.
 */
ol.format.KML.readCoordinates_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'coordinates');
  var s = ol.xml.getAllTextContent(node, false);
  var coordinates = [];
  var re = /^\s*(-?\d+(?:\.\d*)?),(-?\d+(?:\.\d*)?)(?:,(-?\d+(?:\.\d*)?))?/;
  var m;
  while ((m = re.exec(s))) {
    var x = parseFloat(m[1]);
    var y = parseFloat(m[2]);
    var z = m[3] ? parseFloat(m[3]) : 0;
    coordinates.push([x, y, z]);
    s = s.substr(m[0].length);
  }
  return coordinates;
};


/**
 * @param {Node} node Node.
 * @private
 * @return {Object.<string, string>} Extended data.
 */
ol.format.KML.readExtendedData_ = function(node) {
  // FIXME refactor
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'ExtendedData');
  /** @type {Object.<string, string>} */
  var extendedData = {};
  var n, name, m, value;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      if (n.nodeName == 'Data') {
        name = n.getAttribute('name');
        for (m = n.firstChild; !goog.isNull(m); m = m.nextSibling) {
          if (m.nodeType == goog.dom.NodeType.ELEMENT &&
              m.nodeName == 'value') {
            value = goog.string.trim(ol.xml.getAllTextContent(m, false));
            extendedData[name] = value;
          }
        }
      } else if (n.nodeName == 'SchemaData') {
        for (m = n.firstChild; !goog.isNull(m); m = m.nextSibling) {
          if (m.nodeType == goog.dom.NodeType.ELEMENT &&
              m.nodeName == 'SimpleData') {
            name = m.getAttribute('name');
            value = goog.string.trim(ol.xml.getAllTextContent(m, false));
            extendedData[name] = value;
          }
        }
      }
    }
  }
  return extendedData;
};


/**
 * @param {Node} node Node.
 * @private
 * @return {number} Number.
 */
ol.format.KML.readNumber_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  return parseFloat(ol.xml.getAllTextContent(node, false));
};


/**
 * @param {Node} node Node.
 * @private
 * @return {string} String.
 */
ol.format.KML.readString_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  var s = ol.xml.getAllTextContent(node, true);
  return goog.string.trim(s);
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.format.KML.Vec2_}
 */
ol.format.KML.readVec2_ = function(node) {
  var xAttribute = node.getAttribute('x');
  var yAttribute = node.getAttribute('y');
  return {
    x: goog.isDef(xAttribute) ? parseFloat(xAttribute) : undefined,
    xuints: node.getAttribute('xuints'),
    y: goog.isDef(yAttribute) ? parseFloat(yAttribute) : undefined,
    yuints: node.getAttribute('yuints')
  };
};


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readFeatureFromNode = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'Placemark');
  var geometry = this.readGeometryFromNode(node);
  var feature = new ol.Feature(geometry);
  var id = node.getAttribute('id');
  if (!goog.isNull(id)) {
    feature.setId(id);
  }
  var style = this.readStyleSelector_(node);
  if (!goog.isDef(style)) {
    style = ol.format.KML.DEFAULT_STYLE_;
  }
  feature.setStyleFunction(ol.format.KML.makeFeatureStyleFunction(style));
  var n;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      if (n.nodeName in ol.format.KML.ATTRIBUTES_) {
        var value = goog.string.trim(ol.xml.getAllTextContent(n, false));
        feature.set(n.nodeName, value);
      } else if (n.nodeName == 'ExtendedData') {
        feature.setValues(ol.format.KML.readExtendedData_(n));
      }
    }
  }
  return feature;
};


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readFeaturesFromNode = function(node) {
  return this.readFeaturesFromNode_(node, []);
};


/**
 * @param {Node} node Node.
 * @param {Array.<ol.Feature>} features Features.
 * @private
 * @return {Array.<ol.Feature>} Features.
 */
ol.format.KML.prototype.readFeaturesFromNode_ = function(node, features) {
  var n;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      if (n.nodeName == 'Document' || n.nodeName == 'Folder') {
        features = this.readFeaturesFromNode_(n, features);
      } else if (n.nodeName == 'Style') {
        this.readStyle_(n);
      } else if (n.nodeName == 'Placemark') {
        features.push(this.readFeatureFromNode(n));
      }
    }
  }
  return features;
};


/**
 * @inheritDoc
 */
ol.format.KML.prototype.readGeometryFromNode = function(node) {
  var geometry = ol.xml.parse(ol.format.KML.GEOMETRY_PARSER_, node, this);
  if (goog.isDef(geometry)) {
    goog.asserts.assertInstanceof(geometry, ol.geom.Geometry);
    return /** @type {ol.geom.Geometry} */ (geometry);
  } else {
    return null;
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.geom.LineString} LineString.
 */
ol.format.KML.prototype.readLineString_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'LineString');
  var coordinates = ol.format.KML.findCoordinates_(node);
  return new ol.geom.LineString(coordinates);
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.geom.Geometry} MultiGeometry.
 */
ol.format.KML.prototype.readMultiGeometry_ = function(node) {
  // FIXME handle nested MultiGeometries
  /** @type {Array.<ol.geom.Geometry>} */
  var geometries = [];
  var homogeneous = true;
  var geometry, i, ii, n, type;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      geometry = /** @type {ol.geom.Geometry|undefined} */
          (ol.xml.parseNode(ol.format.KML.GEOMETRY_PARSER_, n, this));
      if (goog.isDef(geometry)) {
        geometries.push(geometry);
        if (geometries.length > 1 && homogeneous) {
          homogeneous = geometry.getType() == geometries[0].getType();
        }
      }
    }
  }
  if (homogeneous && geometries.length > 0) {
    type = geometries[0].getType();
    if (type == ol.geom.GeometryType.POINT) {
      /** @type {ol.geom.RawMultiPoint} */
      var coordinates = [];
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        goog.asserts.assertInstanceof(geometry, ol.geom.Point);
        coordinates.push(geometry.getCoordinates());
      }
      return new ol.geom.MultiPoint(coordinates);
    } else if (type == ol.geom.GeometryType.LINE_STRING) {
      /** @type {ol.geom.RawMultiLineString} */
      var coordinatess = [];
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        goog.asserts.assertInstanceof(geometry, ol.geom.LineString);
        coordinatess.push(geometry.getCoordinates());
      }
      return new ol.geom.MultiLineString(coordinatess);
    } else if (type == ol.geom.GeometryType.POLYGON) {
      /** @type {ol.geom.RawMultiPolygon} */
      var coordinatesss = [];
      for (i = 0, ii = geometries.length; i < ii; ++i) {
        geometry = geometries[i];
        goog.asserts.assertInstanceof(geometry, ol.geom.Polygon);
        coordinatesss.push(geometry.getCoordinates());
      }
      return new ol.geom.MultiPolygon(coordinatesss);
    } else {
      goog.asserts.fail();
      return null;
    }
  } else {
    return new ol.geom.GeometryCollection(geometries);
  }
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.geom.Point} Point.
 */
ol.format.KML.prototype.readPoint_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'Point');
  var coordinates = ol.format.KML.findCoordinates_(node);
  goog.asserts.assert(coordinates.length == 1);
  return new ol.geom.Point(coordinates[0]);
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.geom.Polygon} Polygon.
 */
ol.format.KML.prototype.readPolygon_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'Polygon');
  /** @type {Array.<ol.geom.RawLinearRing>} */
  var rawLinearRings = [null];
  var n;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      if (n.nodeName == 'outerBoundaryIs') {
        goog.asserts.assert(goog.isNull(rawLinearRings[0]));
        rawLinearRings[0] = ol.format.KML.findRawLinearRing_(n);
      } else if (n.nodeName == 'innerBoundaryIs') {
        rawLinearRings.push(ol.format.KML.findRawLinearRing_(n));
      }
    }
  }
  if (goog.isNull(rawLinearRings[0])) {
    goog.asserts.assert(rawLinearRings.length == 1);
    rawLinearRings.pop();
  }
  return new ol.geom.Polygon(rawLinearRings);
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.geom.RawLinearRing} LinearRing.
 */
ol.format.KML.prototype.readRawLinearRing_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'LinearRing');
  var coordinates = ol.format.KML.findCoordinates_(node);
  return coordinates;
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.style.Style} Style.
 */
ol.format.KML.prototype.readStyle_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'Style');
  var kmlStyle = new ol.format.KMLStyle_(node);
  var style = kmlStyle.getStyle();
  var id = kmlStyle.getId();
  if (goog.isDef(id)) {
    this.styleMap_[id] = style;
  }
  return style;
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.style.Style} Style.
 */
ol.format.KML.prototype.readStyleSelector_ = function(node) {
  return ol.xml.parse(ol.format.KML.STYLE_SELECTOR_PARSER_, node, this);
};


/**
 * @param {Node} node Node.
 * @private
 * @return {ol.style.Style} Style.
 */
ol.format.KML.prototype.readstyleUrl_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'styleUrl');
  var s = ol.xml.getAllTextContent(node, false);
  // FIXME calculate real URLs
  var m = /^.*#(\S+)\s*$/.exec(s);
  if (m) {
    var url = m[1];
    if (url in this.styleMap_) {
      return this.styleMap_[url];
    } else {
      // throw new Error('unknown style url: ' + url);
      return null;
    }
  } else {
    // throw new Error('invalid style url:' + s);
    return null;
  }
};


/**
 * @const {Object.<string, number>}
 * @private
 */
ol.format.KML.ATTRIBUTES_ = {
  'address': 1,
  'description': 1,
  'name': 1,
  'open': 1,
  'phoneNumber': 1,
  'Snippet': 1,
  'visibility': 1
};


/**
 * @const {ol.xml.Parser}
 * @private
 */
ol.format.KML.COORDINATES_PARSER_ = {
  'coordinates': ol.format.KML.readCoordinates_
};


/**
 * @const {ol.xml.Parser}
 * @private
 */
ol.format.KML.GEOMETRY_PARSER_ = {
  'Point': ol.format.KML.prototype.readPoint_,
  'LineString': ol.format.KML.prototype.readLineString_,
  'Polygon': ol.format.KML.prototype.readPolygon_,
  'MultiGeometry': ol.format.KML.prototype.readMultiGeometry_
};


/**
 * @const {ol.xml.Parser}
 * @private
 */
ol.format.KML.RAW_LINEAR_RING_PARSER_ = {
  'LinearRing': ol.format.KML.COORDINATES_PARSER_
};


/**
 * @const {ol.xml.Parser}
 * @private
 */
ol.format.KML.STYLE_SELECTOR_PARSER_ = {
  'Style': ol.format.KML.prototype.readStyle_,
  'styleUrl': ol.format.KML.prototype.readstyleUrl_
};



/**
 * @constructor
 * @param {Node} node Node.
 * @private
 */
ol.format.KMLStyle_ = function(node) {

  /**
   * @private
   * @type {ol.style.Style}
   */
  this.style_ = new ol.style.Style();

  /**
   * @private
   * @type {string}
   */
  this.id_ = node.getAttribute('id');

  /**
   * @private
   * @type {boolean}
   */
  this.fill_ = true; // FIXME check default

  /**
   * @private
   * @type {boolean}
   */
  this.outline_ = true; // FIXME check default

  ol.xml.parse(ol.format.KMLStyle_.PARSER_, node, this);

};


/**
 * @return {string|undefined} Id.
 */
ol.format.KMLStyle_.prototype.getId = function() {
  return this.id_;
};


/**
 * @return {ol.style.Style} Style.
 */
ol.format.KMLStyle_.prototype.getStyle = function() {
  var style = this.style_;
  goog.asserts.assert(!goog.isNull(style));
  if (!this.fill_) {
    style.fill = null;
  }
  if (!this.outline_) {
    style.stroke = null;
  }
  this.style_ = null;
  return style;
};


/**
 * @param {Node} node Node.
 * @private
 */
ol.format.KMLStyle_.prototype.readIconStyle_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'IconStyle');
  goog.asserts.assert(goog.isNull(this.style_.image));
  // FIXME color
  // FIXME colorMode
  // FIXME scale
  var imageStyle = new ol.style.Image({
    anchor: null,
    size: null,
    src: undefined,
    rotation: 0,
    snapToPixel: undefined,
    subtractViewRotation: false
  });
  var n;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      if (n.nodeName == 'Icon') {
        // FIXME gx:x
        // FIXME gx:y
        // FIXME gx:w
        // FIXME gx:h
        // FIXME refreshMode
        // FIXME refreshInterval
        // FIXME viewRefreshTime
        // FIXME viewBoundScale
        // FIXME viewFormat
        // FIXME httpQuery
        imageStyle.src = ol.xml.parse(ol.format.KMLStyle_.HREF_PARSER_, n);
      } else if (n.nodeName == 'heading') {
        imageStyle.rotation = ol.format.KML.readNumber_(n);
      } else if (n.nodeName == 'hotSpot') {
        // FIXME fraction
        // FIXME insetPixels
        var hotspot = ol.format.KML.readVec2_(n);
        if (hotspot.xunits == 'pixels' && hotspot.yunits == 'pixels') {
          goog.asserts.assert(goog.isDef(hotspot.x));
          goog.asserts.assert(goog.isDef(hotspot.y));
          imageStyle.anchor = [hotspot.x, hotspot.y];
        }
      }
    }
  }
  if (!goog.isDef(imageStyle.src)) {
    imageStyle.src = ol.format.KML.DEFAULT_IMAGESTYLE_SRC_;
  }
  if (imageStyle.src == ol.format.KML.DEFAULT_IMAGESTYLE_SRC_) {
    if (goog.isNull(imageStyle.anchor)) {
      imageStyle.anchor = ol.format.KML.DEFAULT_IMAGESTYLE_ANCHOR_;
    }
    if (goog.isNull(imageStyle.size)) {
      imageStyle.size = ol.format.KML.DEFAULT_IMAGESTYLE_SIZE_;
    }
  }
  this.style_.image = imageStyle;
};


/**
 * @param {Node} node Node.
 * @private
 */
ol.format.KMLStyle_.prototype.readLineStyle_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'LineStyle');
  // FIXME colorMode
  // FIXME gx:outerColor
  // FIXME gx:outerWidth
  // FIXME gx:physicalWidth
  // FIXME gx:labelVisibility
  goog.asserts.assert(goog.isNull(this.style_.stroke));
  var strokeStyle = new ol.style.Stroke();
  var n;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      if (n.nodeName == 'color') {
        strokeStyle.color = ol.format.KML.readColor_(n);
      } else if (n.nodeName == 'width') {
        strokeStyle.width = ol.format.KML.readNumber_(n);
      }
    }
  }
  this.style_.stroke = strokeStyle;
};


/**
 * @param {Node} node Node.
 * @private
 */
ol.format.KMLStyle_.prototype.readPolyStyle_ = function(node) {
  goog.asserts.assert(node.nodeType == goog.dom.NodeType.ELEMENT);
  goog.asserts.assert(node.nodeName == 'PolyStyle');
  // FIXME colorMode
  goog.asserts.assert(goog.isNull(this.style_.fill));
  var fillStyle = new ol.style.Fill();
  var n;
  for (n = node.firstChild; !goog.isNull(n); n = n.nextSibling) {
    if (n.nodeType == goog.dom.NodeType.ELEMENT) {
      if (n.nodeName == 'color') {
        fillStyle.color = ol.format.KML.readColor_(n);
      } else if (n.nodeName == 'fill') {
        this.fill_ = ol.format.KML.readBoolean_(n);
      } else if (n.nodeName == 'outline') {
        this.outline_ = ol.format.KML.readBoolean_(n);
      }
    }
  }
  this.style_.fill = fillStyle;
};


/**
 * @const {ol.xml.Parser}
 * @private
 */
ol.format.KMLStyle_.HREF_PARSER_ = {
  'href': ol.format.KML.readString_
};


/**
 * @const {ol.xml.Parser}
 * @private
 */
ol.format.KMLStyle_.PARSER_ = {
  'IconStyle': ol.format.KMLStyle_.prototype.readIconStyle_,
  'LineStyle': ol.format.KMLStyle_.prototype.readLineStyle_,
  'PolyStyle': ol.format.KMLStyle_.prototype.readPolyStyle_
};
