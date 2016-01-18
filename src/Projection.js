/**
 * @classdesc
 * A select control which, when changed, render the map view to a specific
 * projection. To style this control use the css selector `.ol-projection`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Projection = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-projection ol-unselectable ol-control';
    
    var projectionSelect = document.createElement('select');
    projectionSelect.title = options.tipLabel || 'Set projection';
    projectionSelect.addEventListener('change', function(evt) {
        var view = _this.getMap().getView();
        var oldProj = view.getProjection();
        var newProj = ol.proj.get(this.value);
        _this.getMap().setView(new ol.View({
            projection: newProj,
            extent: newProj.getExtent(),
            center: ol.proj.transform(view.getCenter(), oldProj, newProj),
            zoom: view.getZoom()
        }));
        _this.getMap().getLayers().forEach(function(layer) {
            _this.changeLayerProjection(layer, oldProj, newProj);
        });
    });
    controlDiv.appendChild(projectionSelect);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.set('projections', options.projections || ['EPSG:3857','EPSG:4326']);
    this.set('element', projectionSelect);
};
ol.inherits(ol.control.Projection, ol.control.Control);


ol.control.Projection.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    if (map === null) {
        ol.Observable.unByKey(this.get('eventId'));
    } else {
        var _this = this;
        this.get('projections').forEach(function(projection) {
            _this.addProjection(projection);
        });
        var curProj = map.getView().getProjection().getCode();
        this.get('element').value = curProj;
        this.set('eventId', map.getView().on('change:projection', function (evt) {
            this.get('element').value = curProj;
        }, this));
    }
};

ol.control.Projection.prototype.addProjection = function(projCode) {
    
    var projection;
    if (projCode instanceof ol.proj.Projection) {            
        projection = projCode;
        projCode = projection.getCode();
    } else { // instanceof String (EPSG code)
        if (ol.proj.get(projCode) === undefined) {
            if (proj4 === undefined) {
                throw new Error('The Proj4 library is missing. Please visit: http://proj4js.org');
                return false;
            }
            if (proj4.defs(projCode) === undefined) {
                throw new Error('Unknown projection code. Please load the http://epsg.io/EPSGCODE.js file!');
                return false;
            }
            ol.proj.addProjection(projCode);
        }
        projection = ol.proj.get(projCode);
    }
    
    if (this.get('projections')[projection] === undefined) {
        this.get('projections').push(projCode);
    }
    
    var newOption = document.createElement('option');
    newOption.value = projection.getCode();
    newOption.textContent = (!!proj4 && proj4.defs(projCode).title !== undefined) ? proj4.defs(projCode).title : projection.getCode();
    this.get('element').appendChild(newOption);
};

ol.control.Projection.prototype.changeLayerProjection = function(layer, oldProj, newProj) {
    if (layer instanceof ol.layer.Group) {
        layer.getLayers().forEach(function(subLayer) {
            this.changeLayerProjection(subLayer, oldProj, newProj);
        });
    } else if (layer instanceof ol.layer.Tile) {
        var tileLoadFunction = layer.getSource().getTileLoadFunction();
        layer.getSource().setTileLoadFunction(tileLoadFunction);
    } else if (layer instanceof ol.layer.Vector) {
        var currProj = layer.getSource().getProjection();
        var features = layer.getSource().getFeatures();
        if (currProj === null) {
            for (var i = 0; i < features.length; i += 1) {
                features[i].getGeometry().transform(oldProj, newProj);
            }
        }
    }
};
