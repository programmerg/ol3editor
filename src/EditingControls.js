
/*
ol.interaction.DragFeature = function (opt_options) {
    ol.interaction.Pointer.call(this, {
        handleDownEvent: function (evt) {
            this.set('draggedFeature', evt.map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    if (this.get('features').getArray().indexOf(feature) !== -1) {
                        return feature;
                    }
                }, this
            ));
            if (this.get('draggedFeature')) {
                this.set('coords', evt.coordinate);
            }
            return !!this.get('draggedFeature');
        },
        handleDragEvent: function (evt) {
            var deltaX = evt.coordinate[0] - this.get('coords')[0];
            var deltaY = evt.coordinate[1] - this.get('coords')[1];
            this.get('draggedFeature').getGeometry().translate(deltaX, deltaY);
            this.set('coords', evt.coordinate);
        },
        handleUpEvent: function (evt) {
            this.setProperties({
                coords: null,
                draggedFeature: null
            });
        }
    });
    this.setProperties({
        features: opt_options.features,
        coords: null,
        draggedFeature: null
    });
};
ol.inherits(ol.interaction.DragFeature, ol.interaction.Pointer);

ol.interaction.RemoveFeature = function (opt_options) {
    ol.interaction.Pointer.call(this, {
        handleDownEvent: function (evt) {
            this.set('deleteCandidate', evt.map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    if (this.get('features').getArray().indexOf(feature) !== -1) {
                        return feature;
                    }
                }, this
            ));
            return !!this.get('deleteCandidate');
        },
        handleUpEvent: function (evt) {
            evt.map.forEachFeatureAtPixel(evt.pixel, 
                function (feature, layer) {
                    if (feature === this.get('deleteCandidate')) {
                        layer.getSource().removeFeature(feature);
                        this.get('features').remove(feature);
                    }
                }, this
            );
            this.set('deleteCandidate', null);
        }
    });
    this.setProperties({
        features: opt_options.features,
        deleteCandidate: null
    });
};
ol.inherits(ol.interaction.RemoveFeature, ol.interaction.Pointer);

*/

/**
 * @classdesc
 * Button controls which, when pressed, handles specific selection methods.
 * To style this control use the css selector `.ol-selectcontrols`.
 *
 * @requires ol.Editor
 * @requires ol.control.Interaction
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.EditingControls = function(opt_options) {
   
    var options = opt_options || {};
    var _this = this;
    
    this.newControls_ = new ol.Collection();
    this.editingControls_ = new ol.Collection();
    this.selectedFeatures_ = new ol.Collection();
    this.activeFeatures_ = new ol.Collection();
	
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-editingcontrols ol-unselectable ol-control';
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    var removeFeature = document.createElement('button');
    removeFeature.className = options.removeClassName || 'ol-removefeature';
    removeFeature.title = options.removeTipLabel || 'Remove feature(s)';
    removeFeature.textContent = options.removeLabel || '';
    removeFeature.addEventListener('click', function() {
        var features = _this.get('selectedFeatures');
        _this.getMap.getLayers().forEach(function(layer){
            if (layer instanceof ol.layer.Vector) {
                layer.getSource().removeFeature(features);
            }
        });
    });
    
    this.setProperties({
        element: controlDiv,
        drawPoint: options.drawPoint || new ol.control.Interaction({
            label: options.drawPointLabel || ' ',
            tipLabel: options.drawPointTipLabel || 'Add points',
            className: options.drawPointClassName || 'ol-addpoint',
            interaction: options.drawPointInteraction || new ol.interaction.Draw({
                type: 'Point',
                snapTolerance: 1
            }),
            singleButton: true,
            target: controlDiv
        }),
        drawLine: options.drawLine || new ol.control.Interaction({
            label: options.drawLineLabel || ' ',
            tipLabel: options.drawLineTipLabel || 'Add lines',
            className: options.drawLineClassName || 'ol-addline',
            interaction: options.drawLineInteraction || new ol.interaction.Draw({
                type: 'LineString',
                snapTolerance: 1
            }),
            singleButton: true,
            target: controlDiv
        }),
        drawPolygon: options.drawPolygon || new ol.control.Interaction({
            label: options.drawPolygonLabel || ' ',
            tipLabel: options.drawPolygonTipLabel || 'Add polygons',
            className: options.drawPolygonClassName || 'ol-addpolygon',
            interaction: options.drawPolygonInteraction || new ol.interaction.Draw({
                type: 'Polygon',
                snapTolerance: 1
            }),
            singleButton: true,
            target: controlDiv
        }),
        dragFeature: options.dragFeature || new ol.control.Interaction({
            label: options.dragFeatureLabel || ' ',
            tipLabel: options.dragFeatureTipLabel || 'Drag features',
            className: options.dragFeatureClassName || 'ol-dragfeature',
            interaction: options.dragFeatureInteraction || new ol.interaction.Translate({
                features: this.selectedFeatures_
            }),
            singleButton: true,
            target: controlDiv
        }),
        modifyFeature: options.modifyFeature || new ol.control.Interaction({
            label: options.modifyFeatureLabel || ' ',
            tipLabel: options.modifyFeatureTipLabel || 'Modify features',
            className: options.modifyFeatureClassName || 'ol-modifyfeature',
            interaction: options.modifyFeatureInteraction || new ol.interaction.Modify({
                features: this.selectedFeatures_
            }),
            singleButton: true,
            target: controlDiv
        }),
        removeFeature: options.removeFeature || removeFeature
        /*new ol.control.Interaction({
            label: options.removeFeatureLabel || ' ',
            tipLabel: options.removeFeatureTipLabel || 'Remove features',
            className: options.removeFeatureClassName || 'ol-removefeature',
            interaction: options.removeFeatureInteraction || new ol.interaction.RemoveFeature({
                features: this.selectedFeatures_
            }),
            singleButton: true,
            target: controlDiv
        })*/
    });
};
ol.inherits(ol.control.EditingControls, ol.control.Control);

ol.control.EditingControls.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    if (map !== null) {
        var _this = this;
        
        var drawPoint = this.get('drawPoint');
        map.addControl(drawPoint);
        drawPoint.setMap(map);
        this.newControls_.push(drawPoint);
        
        var drawLine = this.get('drawLine');
        map.addControl(drawLine);
        drawLine.setMap(map);
        this.newControls_.push(drawLine);
        
        var drawPolygon = this.get('drawPolygon');
        map.addControl(drawPolygon);
        drawPolygon.setMap(map);
        this.newControls_.push(drawPolygon);
        
        var dragFeature = this.get('dragFeature');
        map.addControl(dragFeature);
        dragFeature.setMap(map);
        this.editingControls_.push(dragFeature);
        
        var modifyFeature = this.get('modifyFeature');
        map.addControl(modifyFeature);
        modifyFeature.setMap(map);
        this.editingControls_.push(modifyFeature);
        
        // var removeFeature = this.get('removeFeature');
        // map.addControl(removeFeature);
        // removeFeature.setMap(map);
        // this.editingControls_.push(removeFeature);
        this.get('element').appendChild(this.get('removeFeature'));
        
        // var separator1 = document.createElement('span');
        // separator1.className = 'ol-separator';
        // this.get('element').appendChild(separator1);
        
        this.newControls_.forEach(function (control) {
            control.setDisabled(true);
        });
        this.editingControls_.forEach(function (control) {
            control.setDisabled(true);
        });
    
        var layermanager = map.getLayerManager();
        layermanager.selectEventEmitter.on('change', function () {
            var layer = layermanager.getLayerById(layermanager.selectedLayer.id);
            if (layer instanceof ol.layer.Vector) {
                setTimeout(function(){
                    _this.activeFeatures_.clear();
                    _this.activeFeatures_.extend(layer.getSource().getFeatures());
                }, 0);
                this.newControls_.forEach(function (control) {
                    control.setDisabled(false);
                });
                var layerType = layer.get('type');
                if (layerType !== 'point' && layerType !== 'geomcollection')
                    drawPoint.setDisabled(true).set('active', false);
                if (layerType !== 'line' && layerType !== 'geomcollection')
                    drawLine.setDisabled(true).set('active', false);
                if (layerType !== 'polygon' && layerType !== 'geomcollection')
                    drawPolygon.setDisabled(true).set('active', false);
            } else {
                this.activeFeatures_.clear();
                this.newControls_.forEach(function (control) {
                    control.setDisabled(true).set('active', false);
                });
            }
        }, this);

        map.selectedFeatures.on('change:length', function(){
            if (map.selectedFeatures.getArray().length > 0) {
                setTimeout(function(){
                    _this.selectedFeatures_.clear();
                    map.selectedFeatures.forEach(function(item){
                        _this.selectedFeatures_.push(item);
                    });
                }, 0);
                this.editingControls_.forEach(function (control) {
                    control.setDisabled(false);
                });
            } else {
                _this.selectedFeatures_.clear();
                this.editingControls_.forEach(function (control) {
                    control.setDisabled(true).set('active', false);
                });
            }
        }, this);
        
        this.handleEvents = function(interaction, type) {
            if (type !== 'point') {
                interaction.on('drawstart', function (evt) {
                    var error = false;
                    if (layermanager.selectedLayer) {
                        var selectedLayer = layermanager.getLayerById(layermanager.selectedLayer.id);
                        var layerType = selectedLayer.get('type');
                        error = (layerType !== type && layerType !== 'geomcollection') ? true : false;
                    } else {
                        error = true;
                    }
                    if (error) {
                        interaction.finishDrawing();
                    }
                }, this);
            }
            interaction.on('drawend', function (evt) {
                var error = '';
                errorcheck: if (layermanager.selectedLayer) {
                    var selectedLayer = layermanager.getLayerById(layermanager.selectedLayer.id);
                    error = selectedLayer instanceof ol.layer.Vector ? '' : 'Please select a valid vector layer.';
                    if (error) break errorcheck;
                    var layerType = selectedLayer.get('type');
                    error = (layerType === type || layerType === 'geomcollection') ? '' : 'Selected layer has a different vector type.';
                } else {
                    error = 'Please select a layer first.';
                }
                if (error) {
                    map.sendMessage(error);
                } else {
                    selectedLayer.getSource().addFeature(evt.feature);
                    this.activeFeatures_.push(evt.feature);
                }
            }, this);
        };
        this.handleEvents(drawPoint.get('interaction'), 'point');
        this.handleEvents(drawLine.get('interaction'), 'line');
        this.handleEvents(drawPolygon.get('interaction'), 'polygon');
    }
};
