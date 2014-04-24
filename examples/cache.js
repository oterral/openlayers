goog.require('ol.BrowserFeature');
goog.require('ol.Map');
goog.require('ol.TileCoord');
goog.require('ol.View2D');
goog.require('ol.dom');
goog.require('ol.layer.Tile');
goog.require('ol.source.OSM');
goog.require('ol.source.TileImage');

var proxyUrl = document.getElementById('proxyUrl');

var source = new ol.source.OSM({
  crossOrigin: null
});

var map = new ol.Map({
  layers: [
    new ol.layer.Tile({
      ratio: 0,
      source: source
    })
  ],
  renderer: exampleNS.getRendererFromQueryString(),
  target: 'map',
  view: new ol.View2D({
    center: [829498.1058685041, 5930292.957489865],
    zoom: 17,
    maxZoom: 18
  })
});

var defaultTileLoad = source.getTileLoadFunction();

var localStorageTileLoad = function(imageTile, src) {
  var content = window.localStorage.getItem(src);
  imageTile.getImage().src = (content) ? content : '';
};

// Rerender layer when changinging the tileLoadFunction
var useLocalStorage = document.getElementById('useLocalStorage');
useLocalStorage.addEventListener('click', function() {
  source.setTileLoadFunction((useLocalStorage.checked) ?
      localStorageTileLoad : defaultTileLoad);
}, false);

// Load tiles in local storage
var loadInCache = document.getElementById('loadInCache');
loadInCache.addEventListener('click', function() {
  this.disabled = true;
  window.localStorage.clear();
  var isStorageFull = false;
  var nbTilesCached = 0;
  var nbTilesTotal = 0;
  var size = map.getSize();
  var view = map.getView();
  var initialZoom = view.getZoom();
  var projection = view.getView2D().getProjection();
  document.getElementById('progress').style.display = 'block';

  map.getLayers().forEach(function(layer) {
    var source = layer.getSource();

    if (source instanceof ol.source.TileImage) {
      var tileGrid = source.getTileGrid();
      var tileUrlFunction = source.getTileUrlFunction();
      for (var z = initialZoom; z <= tileGrid.getMaxZoom() && !isStorageFull;
          z++) {
        //view.setZoom(z);
        var extent = view.calculateExtent(size);
        // Get the ranges of tiles to save
        var tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);

        for (var x = tileRange.minX; x <= tileRange.maxX && !isStorageFull;
            x++) {

          for (var y = tileRange.minY; y <= tileRange.maxY && !isStorageFull;
              y++) {
            var tileUrl = tileUrlFunction(new ol.TileCoord(z, x, y),
                ol.BrowserFeature.DEVICE_PIXEL_RATIO, projection);
            var img = document.createElement('img');
            // When the image is loaded, add it to the localStorage
            img.onload = function() {
              if (isStorageFull) {
                return;
              }

              var tileSize = tileGrid.getTileSize(z);
              var context = ol.dom.createCanvasContext2D(tileSize, tileSize);
              context.drawImage(this, 0, 0);
              var key = this.src.substring(this.src.indexOf(proxyUrl.value) +
                  proxyUrl.value.length);

              try {
                window.localStorage.setItem(key,
                    context.canvas.toDataURL('image/png'));
                nbTilesCached++;
                updateCacheStatusMessage(nbTilesCached, nbTilesTotal,
                    isStorageFull);

                if (nbTilesCached === nbTilesTotal) {
                  document.getElementById('progress').style.display = 'none';
                  loadInCache.disabled = false;
                  view.setZoom(initialZoom);
                }

              } catch (e) {
                window.console.log(e.message);
                isStorageFull = true;
                updateCacheStatusMessage(nbTilesCached, nbTilesTotal,
                    isStorageFull);
                loadInCache.disabled = false;
                view.setZoom(initialZoom);
              }
            };
            img.src = proxyUrl.value + tileUrl;
            nbTilesTotal++;
            updateCacheStatusMessage(nbTilesCached, nbTilesTotal,
                isStorageFull);
          }
        }
      }
      view.setZoom(initialZoom);
    }
  });
}, false);


/**
 * Update HTML elements
 */
var updateElements = function() {
  var display = (window.localStorage.length > 0) ? 'block' : 'none';
  document.getElementById('labelUseLocalStorage').style.display = display;
  document.getElementById('message').style.display = display;
};


/**
 * Display the status of the cache
 * @param {number|undefined} nbTilesCached
 * @param {number|undefined} nbTilesTotal
 * @param {boolean|undefined} isStorageFull
 */
var updateCacheStatusMessage = function(nbTilesCached, nbTilesTotal,
    isStorageFull) {
  var message = document.getElementById('message');
  if (!nbTilesCached && !nbTilesTotal) {
    message.innerHTML = window.localStorage.length + ' tiles cached.';
  } else {

    message.innerHTML = nbTilesCached + '/' + nbTilesTotal + ' tiles cached.';
    var progress = document.getElementById('progress');
    progress.value = nbTilesCached;
    progress.max = nbTilesTotal;

    if (isStorageFull) {
      message.innerHTML += ' Storage full !!!!';
    }
  }
  updateElements();
};
updateCacheStatusMessage(undefined, undefined, undefined);
