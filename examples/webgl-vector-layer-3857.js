import proj4 from 'proj4';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import TileLayer from '../src/ol/layer/WebGLTile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import {register} from '../src/ol/proj/proj4.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

proj4.defs(
  'EPSG:2056',
  '+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs +type=crs',
);
register(proj4);

/** @type {import('../src/ol/style/flat.js').FlatStyleLike} */
const style = [
  {
    filter: ['==', ['var', 'highlightedId'], ['get', 'belegungid']],
    style: {
      'stroke-color': [0, 255, 0, 1],
      'stroke-width': 3,
      'fill-color': [0, 255, 0, 0.5],
      'z-index': 100,
    },
  },
  {
    else: true,
    style: {
      'stroke-color': '#ff3f3f',
      'stroke-width': 2,
      'fill-color': '#006688',
      'z-index': 0,
    },
  },
];

const osm = new TileLayer({
  source: new OSM(),
});

const layers = [
  'data/geojson/belegungungen_Aktivitat.geojson',
  // 'data/geojson/belegungungen_Festivitat.geojson',
  // 'data/geojson/belegungungen_Bauinstallation.geojson',
  // 'data/geojson/belegungungen_Baustelle.geojson',
  // 'data/geojson/belegungungen_Umleitung.geojson',
  // 'data/geojson/belegungungen_Veranstaltung.geojson',
].map((url) => {
  return new WebGLVectorLayer({
    source: new VectorSource({
      url: url,
      format: new GeoJSON({dataProjection: 'EPSG:2056', featureProjection: 'EPSG:3857'}),
      wrapX: true,
    }),
    style,
    variables: {
      highlightedId: -1,
    },
  });
});

const map = new Map({
  layers: [osm, ...layers],
  target: 'map',
  view: new View({
    center: [843060.4096853775, 6033263.012624491],
    zoom: 12.40203575668279,
  }),
});

let highlightedId = -1;
const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  });

  const info = document.getElementById('info');
  if (feature) {
    const properties = feature.getProperties();
    delete properties.geometry;
    info.innerHTML = JSON.stringify(properties);
  }
  const id = feature ? feature.get('belegungid') : -1;
  if (id !== highlightedId) {
    highlightedId = id;
    layers.forEach((layer) => layer.updateStyleVariables({highlightedId}));
  }
};
map.on('moveend', function () {
  console.log('moveend', map.getView().getCenter(), map.getView().getZoom());
});
map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  displayFeatureInfo(evt.pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
});
