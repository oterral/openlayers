goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.layer.Image');
goog.require('ol.layer.Tile');
goog.require('ol.layer.Vector');
goog.require('ol.source.BingMaps');
goog.require('ol.source.ImageVector');
goog.require('ol.source.KML');

var vector3 = new ol.layer.Vector({
  source: new ol.source.KML({
    projection: 'EPSG:3857',
    url: 'data/kml/washa-schiessplatz.kml'
  })
});

var map = new ol.Map({
  layers: [vector3],
  renderer: 'canvas',
  target: document.getElementById('map'),
  view: new ol.View2D({
    center: [913194.942080376, 5915162.400465135],
    zoom:7
  })
});
