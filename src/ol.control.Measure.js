/**
 * @classdesc
 * A button control which, when pressed, handles the measure interaction.
 * To style this control use the css selector `.ol-measure`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Measure = function (opt_options) {
    
    var options = opt_options || {};
    var _this = this;

    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-measure ol-unselectable ol-control';
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.setProperties({
        element: controlDiv,
        measureLength: options.measureLength || new ol.control.Interaction({
            label: options.measureLengthLabel || ' ',
            tipLabel: options.measureLengthTipLabel || 'Measure length',
            className: options.measureLengthClassName || 'ol-measure-length',
            interaction: options.measureLengthInteraction || new ol.interaction.Measure({
                type: 'length',
                style: options.measureLengthStyle || null,
                startLabel: options.measureLengthStartLabel || null,
                nextLabel: options.measureLengthNextLabel || null,
                tooltipElement: options.measureLengthTooltipElement || null
            }),
            singleButton: true,
            target: controlDiv
        }),
        measureArea: options.measureArea || new ol.control.Interaction({
            label: options.measureAreaLabel || ' ',
            tipLabel: options.measureAreaTipLabel || 'Measure area',
            className: options.measureAreaClassName || 'ol-measure-area',
            interaction: options.measureAreaInteraction || new ol.interaction.Measure({
                type: 'area',
                style: options.measureAreaStyle || null,
                startLabel: options.measureAreaStartLabel || null,
                nextLabel: options.measureAreaNextLabel || null,
                tooltipElement: options.measureAreaTooltipElement || null
            }),
            singleButton: true,
            target: controlDiv
        }),
        measureAngle: options.measureAngle || new ol.control.Interaction({
            label: options.measureAngleLabel || ' ',
            tipLabel: options.measureAngleTipLabel || "Measure angle\n(center-start-end)",
            className: options.measureAngleClassName || 'ol-measure-angle',
            interaction: options.measureAngleInteraction || new ol.interaction.Measure({
                type: 'angle',
                style: options.measureAngleStyle || null,
                startLabel: options.measureAngleStartLabel || null,
                nextLabel: options.measureAngleNextLabel || null,
                tooltipElement: options.measureAngleTooltipElement || null
            }),
            singleButton: true,
            target: controlDiv
        })
    });
    
};
ol.inherits(ol.control.Measure, ol.control.Control);

ol.control.Measure.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    if (map !== null) {
        var _this = this;
        
        var measureLength = this.get('measureLength');
        measureLength.get('interaction').set('map', map);
        map.addControl(measureLength);
        measureLength.setMap(map);
        
        var measureArea = this.get('measureArea');
        measureArea.get('interaction').set('map', map);
        map.addControl(measureArea);
        measureArea.setMap(map);
        
        var measureAngle = this.get('measureAngle');
        measureAngle.get('interaction').set('map', map);
        map.addControl(measureAngle);
        measureAngle.setMap(map);
    }
};


ol.interaction.Measure = function (opt_options) {
  
    var options = opt_options || {};
    
    var session = null;
    var coordinates = [];
    var cursorFeature = new ol.Feature();
    var lineFeature = new ol.Feature();
    var polygonFeature = new ol.Feature();
    var circleFeature = new ol.Feature();
    var tooltipElement = document.createElement('div');
    tooltipElement.className = 'ol-tooltip ol-unselectable';
    var textOverlayElement = document.createElement('div');
    textOverlayElement.className = 'ol-tooltip ol-tooltip-arrow ol-unselectable';
    
    ol.interaction.Interaction.call(this, {
        handleEvent: function (evt) {
            if (evt.dragging) {
                return;
            }
            switch (evt.type) {
                case 'pointermove':
                    coordinates[coordinates.length - 1] = evt.coordinate;
                    cursorFeature.getGeometry().setCoordinates(evt.coordinate);
                    if (session === 'active') {
                        if (this.get('type') === 'angle') {
                            var geom = lineFeature.getGeometry();
                            geom.setCoordinates(coordinates);
                            this.get('textOverlay').get('element').innerHTML = this.formatAngle(geom);
                            this.get('textOverlay').setPosition(coordinates[0]);
                            var geomHelper = circleFeature.getGeometry();
                            geomHelper.setCenter(coordinates[0]);
                            geomHelper.setRadius(Math.sqrt(Math.pow(coordinates[1][0]-coordinates[0][0],2) + Math.pow(coordinates[1][1]-coordinates[0][1],2)));
                        }
                        else if (this.get('type') === 'area') {
                            var geom = polygonFeature.getGeometry();
                            geom.setCoordinates([coordinates]);
                            this.get('textOverlay').get('element').innerHTML = this.formatArea(geom);
                            this.get('textOverlay').setPosition(geom.getInteriorPoint().getCoordinates());
                        }
                        else { // get('type') === 'length'
                            var geom = lineFeature.getGeometry();
                            geom.setCoordinates(coordinates);
                            this.get('textOverlay').get('element').innerHTML = this.formatLength(geom);
                            this.get('textOverlay').setPosition(evt.coordinate);
                        }
                        this.get('tooltip').get('element').innerHTML = '';
                        this.get('tooltip').setPosition(undefined);
                    } else {
                        this.get('tooltip').get('element').innerHTML = options.startLabel || 'Click to start measure';
                        this.get('tooltip').setPosition(evt.coordinate);
                    }
                    break;
                case 'click':
                    if (session !== 'active') {
                        session = 'active';
                        coordinates = [evt.coordinate];
                    }
                    if (this.get('type') === 'angle') {
                        if (coordinates.length == 2) {
                            // add center again
                            coordinates.push(coordinates[0]);
                        } else if (coordinates.length >= 4) {
                            // trigger dblclick
                            var geom = polygonFeature.getGeometry();
                            this.set('result', this.formatArea(geom));
                            session = null;
                        }
                    }
                    coordinates.push([evt.coordinate]);
                    return false;
                case 'dblclick':
                    if (this.get('type') === 'angle') {
                        var geom = lineFeature.getGeometry();
                        this.set('result', this.formatAngle(geom));
                    } else if (this.get('type') === 'area') {
                        var geom = polygonFeature.getGeometry();
                        this.set('result', this.formatArea(geom));
                    } else { // get('type') === 'length'
                        var geom = lineFeature.getGeometry();
                        this.set('result', this.formatLength(geom));
                    }
                    session = null;
                    return false;
            }
            return true;
        }
    });
    this.on('change:active', function (evt) {
        if (this.getActive()) {
            this.get('overlay').setMap(this.get('map'));
            this.get('textOverlay').setMap(this.get('map'));
            this.get('tooltip').setMap(this.get('map'));
            cursorFeature.setGeometry(new ol.geom.Point([0, 0]));
            lineFeature.setGeometry(new ol.geom.LineString([[0, 0]]));
            polygonFeature.setGeometry(new ol.geom.Polygon([[[0, 0]]]));
            circleFeature.setGeometry(new ol.geom.Circle([0, 0], 0));
        } else {
            session = null;
            this.get('overlay').setMap(null);
            this.get('textOverlay').setPosition(undefined);
            this.get('textOverlay').setMap(null);
            this.get('tooltip').setPosition(undefined);
            this.get('tooltip').setMap(null);
            cursorFeature.setGeometry(null);
            lineFeature.setGeometry(null);
            polygonFeature.setGeometry(null);
            circleFeature.setGeometry(null);
        }
    });
    this.setProperties({
        overlay: new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [cursorFeature, lineFeature, polygonFeature, circleFeature]
            }),
            style: options.style || function(feature, resolution) {
                return ol.style.createDefaultMeasureStyles();
            }
        }),
        tooltip: new ol.Overlay({
            element: options.tooltipElement || tooltipElement,
            offset: [15, 0],
            positioning: 'center-left'
        }),
        textOverlay: new ol.Overlay({
            element: options.textOverlayElement || textOverlayElement,
            offset: [0, -15],
            positioning: 'bottom-center'
        }),
        map: options.map,
        type: options.type,
        result: null
    });
};
ol.inherits(ol.interaction.Measure, ol.interaction.Interaction);


ol.interaction.Measure.prototype.formatLength = function(line) {
  var length = Math.round(line.getLength() * 100) / 100;
  var output;
  if (length > 100) {
    output = (Math.round(length / 1000 * 100) / 100) + ' km';
  } else {
	  if (length < 1) {
      output = (Math.round(length * 100 * 100) / 100) + ' cm';
	  } else {
      output = (Math.round(length * 100) / 100) + ' m';
	  }
  }
  return output;
};

ol.interaction.Measure.prototype.formatArea = function(polygon) {
  var area = polygon.getArea();
  var output;
  if (area > 10000) {
    output = (Math.round(area / 1000000 * 100) / 100) + ' km<sup>2</sup>';
  } else {
    output = (Math.round(area * 100) / 100) + ' m<sup>2</sup>';
  }
  return output;
};

ol.interaction.Measure.prototype.formatAngle = function(line) {
  var coords = line.getCoordinates();
  // center, start, center, end
  var start_center = this.getAngle(coords[0], coords[1] || coords[0]);
  var end_center = this.getAngle(coords[0], coords[3] || coords[1]);
  var output = (start_center - end_center) * 180 / Math.PI;
  if (output < 0) output = output + 360;
  if (output > 180) output = 360 - output;
  output = (Math.round(output * 100) / 100) + ' °';
  return output;
};

ol.interaction.Measure.prototype.getAngle = function(point1, point2) {
    if ((point2[0] - point1[0]) != 0) {
        if (point2[0] - point1[0] >= 0 && point2[1] - point1[1] < 0) {
            return 2 * Math.PI + Math.atan((point2[1] - point1[1]) / (point2[0] - point1[0]));
        }
        if (point2[0] - point1[0] < 0) {
            return Math.PI + Math.atan((point2[1] - point1[1]) / (point2[0] - point1[0]));
        }
        //if (point2[0] - point1[0] >= 0 && point2[1] - point1[1] >= 0) {
            return Math.atan((point2[1] - point1[1]) / (point2[0] - point1[0]));
        //}
    } else {
        return Math.PI / 2;
	}
}


/**
 * Default styles for measuring features.
 * @return {Object.<ol.geom.GeometryType, Array.<ol.style.Style>>} Styles
 */
ol.style.createDefaultMeasureStyles = function() {
  var white = [255, 255, 255, 1];
  var yellow = [255, 200, 50, 1];
  var width = 3;
  return [
    new ol.style.Style({
      fill: new ol.style.Fill({
        color: [255, 255, 255, 0.5]
      }),
      stroke: new ol.style.Stroke({
        color: yellow,
        width: width
      }),
      image: new ol.style.Circle({
        radius: width * 2,
        fill: new ol.style.Fill({
          color: yellow
        }),
        stroke: new ol.style.Stroke({
          color: white,
          width: width / 2
        })
      }),
      zIndex: Infinity
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: white,
        width: width + 2
      })
    })
  ];
};