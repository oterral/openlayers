goog.require('ol.Map');
goog.require('ol.View2D');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.proj.Projection');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');

var urls = [
  'http://a.tile.openstreetmap.org/',
  'http://b.tile.openstreetmap.org/',
  'http://c.tile.openstreetmap.org/'
];
var maxExtent = [-20037508.34, -20037508.34, 20037508.34, 20037508.34];
var curUrl = 0;

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      preload: 0,
      source: new ol.source.TileImage({
        crossOrigin: null,
        tileGrid: new ol.tilegrid.TileGrid({
          origin: maxExtent.slice(0, 2),
          resolutions: [156543.03390625, 78271.516953125, 39135.7584765625,
            19567.87923828125, 9783.939619140625, 4891.9698095703125,
            2445.9849047851562, 1222.9924523925781, 611.4962261962891,
            305.74811309814453, 152.87405654907226, 76.43702827453613,
            38.218514137268066, 19.109257068634033, 9.554628534317017,
            4.777314267158508, 2.388657133579254, 1.194328566789627
          ]
        }),
        tileUrlFunction: function(tileCoord, pixelRatio, projection) {

          // Doesn't load tiles outside the max extent
          var extent = this.getTileGrid().getTileCoordExtent(tileCoord);
          if (!ol.extent.containsExtent(maxExtent, extent)) {
            return undefined;
          }

          // OSM uses top-left corner as origin so we need to get the good y
          // coordinate.
          // The PR should fix this: https://github.com/openlayers/ol3/pull/1124
          var y = (1 << tileCoord.z) - tileCoord.y - 1;
          if (tileCoord.x < 0 || y < 0 || tileCoord.z < 0) {
            return undefined;
          }

          // Choose a differnet TMS url on each call
          curUrl = (++curUrl >= urls.length) ? 0 : curUrl;
          return urls[curUrl] + tileCoord.z +
              '/' + tileCoord.x +
              '/' + y + '.png';
        }
      })
    })
  ],
  renderer: 'dom',
  target: 'map',
  view: new ol.View2D({
    projection: new ol.proj.Projection({
      code: 'EPSG:3857',
      units: 'meters',
      extent: maxExtent
    })
  })
});
map.getView().fitExtent(maxExtent, map.getSize());
