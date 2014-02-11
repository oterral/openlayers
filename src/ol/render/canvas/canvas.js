goog.provide('ol.render.canvas');

goog.require('ol.color');


/**
 * @typedef {{fillStyle: string}}
 */
ol.render.canvas.FillState;


/**
 * @typedef {{lineCap: string,
 *            lineDash: Array.<number>,
 *            lineJoin: string,
 *            lineWidth: number,
 *            miterLimit: number,
 *            strokeStyle: string}}
 */
ol.render.canvas.StrokeState;


/**
 * @typedef {{font: string,
 *            textAlign: string,
 *            textBaseline: string}}
 */
ol.render.canvas.TextState;


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultFont = '10px sans-serif';


/**
 * @const
 * @type {ol.Color}
 */
ol.render.canvas.defaultFillStyle = ol.color.fromString('black');


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultLineCap = 'round';


/**
 * @const
 * @type {Array.<number>}
 */
ol.render.canvas.defaultLineDash = [];


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultLineJoin = 'round';


/**
 * @const
 * @type {number}
 */
ol.render.canvas.defaultMiterLimit = 10;


/**
 * @const
 * @type {ol.Color}
 */
ol.render.canvas.defaultStrokeStyle = [0, 0, 0, 1];


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultTextAlign = 'center';


/**
 * @const
 * @type {string}
 */
ol.render.canvas.defaultTextBaseline = 'middle';


/**
 * @const
 * @type {number}
 */
ol.render.canvas.defaultLineWidth = 1;


/**
 * @param {Array.<number>} lineDash Line dash.
 * @return {!Array.<number>} Line dash.
 */
ol.render.canvas.copyLineDash = function(lineDash) {
  if (goog.isNull(lineDash) || lineDash.length === 0) {
    // Re-use an existing object to avoid generating garbage
    return ol.render.canvas.emptyLineDash;
  } else {
    return lineDash.slice();
  }
};


/**
 * @type {!Array.<number>}
 * @const
 */
ol.render.canvas.emptyLineDash = [];
