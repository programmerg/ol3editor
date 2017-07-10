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
        var features = _this.selectedFeatures_;
        if (confirm(options.removeConfirm || 'The selected feature(s) will be removed. Are you sure?')) {
            _this.getMap().getLayers().forEach(function(layer){
                if (layer instanceof ol.layer.Vector) {
		    features.forEach(function (f) {
                        layer.getSource().removeFeature(f);
			_this.getMap().selectedFeatures.remove(f);
		    });
                }
            });
        }
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
        this.get('removeFeature').disabled = true;
    
        var layermanager = map.getLayerManager();
        layermanager.on('change:selected', function () {
            var layer = layermanager.getSelectedLayer();
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
                this.get('removeFeature').disabled = false;
            } else {
                _this.selectedFeatures_.clear();
                this.editingControls_.forEach(function (control) {
                    control.setDisabled(true).set('active', false);
                });
                this.get('removeFeature').disabled = true;
            }
        }, this);
        
        this.handleEvents = function(interaction, type) {
            if (type !== 'point') {
                interaction.on('drawstart', function (evt) {
                    var error = false;
                    if (layermanager.getSelectedLayer()) {
                        var selectedLayer = layermanager.getSelectedLayer();
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
                errorcheck: if (layermanager.getSelectedLayer()) {
                    var selectedLayer = layermanager.getSelectedLayer();
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
