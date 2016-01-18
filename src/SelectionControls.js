/**
 * @classdesc
 * Allows the user to draw a vector box by clicking and dragging on the map.
 * This interaction is only supported for mouse devices.
 *
 * TODO: implementálni a tényleges selection funkciókat, majd
 * TODO: a SelectionControls -ban dragbox eventek helyett az új funkcionalitás
 *
 * @constructor
 * @extends {ol.interaction.DragBox}
 * @fires ol.DragBoxEvent
 * @param {olx.interaction.DragBoxOptions=} opt_options Options.
 */
ol.interaction.SelectBox = function(opt_options) {
    var options = opt_options || {};
    var _this = this;
    
    ol.interaction.DragBox.call(this, options);
    
    this.set('features', options.features || new ol.collection());
    this.set('layers', options.layers || true);
    this.set('styleFunc', options.style || function (start, end) {
        return (start[0] < end[0]) ? 'ol-box ol-dragbox' : 'ol-box ol-dragbox-inverse';
    });
};
ol.inherits(ol.interaction.SelectBox, ol.interaction.DragBox);

/**
 * @override
 * @param {ol.MapBrowserPointerEvent} mapBrowserEvent Event.
 * @this {ol.interaction.DragBox}
 * @private
 */
ol.interaction.DragBox.handleDragEvent_ = function(mapBrowserEvent) {
    if (!ol.events.condition.mouseOnly(mapBrowserEvent)) {
        return;
    }
    var styleFunc = this.get('styleFunc');
    if (typeof styleFunc === 'function') {
        this.box_.element_.className = styleFunc(this.startPixel_, mapBrowserEvent.pixel);
    }
    this.box_.setPixels(this.startPixel_, mapBrowserEvent.pixel);
};


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
ol.control.SelectionControls = function(opt_options) {
   
    var options = opt_options || {};
    var _this = this;
    
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-selectcontrols ol-unselectable ol-control';
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    var removeButton = document.createElement('button');
    removeButton.className = options.removeClassName || 'ol-deselect';
    removeButton.title = options.removeTipLabel || 'Remove selection(s)';
    removeButton.textContent = options.removeLabel || '';
    removeButton.addEventListener('click', function() {
        _this.get('selectedFeatures').clear();
    });
    
    this.setProperties({
        element: controlDiv,
        selectSingle: options.selectSingle || new ol.control.Interaction({
            label: options.selectSingleLabel || ' ',
            tipLabel: options.selectSingleTipLabel || 'Select feature',
            className: options.selectSingleClassName || 'ol-singleselect',
            interaction: options.selectSingleInteraction || null,
            singleButton: true,
            target: controlDiv
        }),
        selectMulti: options.selectMulti || new ol.control.Interaction({
            label: options.selectMultiLabel || ' ',
            tipLabel: options.selectMultiTipLabel || 'Select features with a box',
            className: options.selectMultiClassName || 'ol-multiselect',
            interaction: options.selectMultiInteraction || null,
            singleButton: true,
            target: controlDiv
        }),
        removeButton: options.remove || removeButton,
        selectedFeatures: options.selectedFeatures || new ol.Collection()
    });
};
ol.inherits(ol.control.SelectionControls, ol.control.Control);

ol.control.SelectionControls.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    if (map !== null) {
        var _this = this;
        
        var layermanager = map.getLayerManager();
        
        var selectSingleInteraction = new ol.interaction.Select({
            features: this.get('selectedFeatures'),
            layers: function(layer) {
                if (!layermanager) return true; // fallback: all in
                if (layermanager.selectedLayer) {
                    if (layer === layermanager.getLayerById(layermanager.selectedLayer.id)) {
                        return true;
                    }
                }
                return false;
            }
        });
        
        var selectMultiInteraction = new ol.interaction.SelectBox({
            features: this.get('selectedFeatures'),
            layers: function(layer) {
                if (!layermanager) return true; // fallback: all in
                if (layermanager.selectedLayer) {
                    if (layer === layermanager.getLayerById(layermanager.selectedLayer.id)) {
                        return true;
                    }
                }
                return false;
            }
        });
        
        // TODO: remove from this
        selectMultiInteraction.on('boxstart', function(evt) {
            _this.get('selectedFeatures').clear();
        }, this);
        selectMultiInteraction.on('boxend', function(evt) {
            var geom = selectMultiInteraction.getGeometry();
            var coords = geom.getCoordinates();
            var extent = geom.getExtent();
            if (!layermanager) return false; // fallback: nothing
            if (layermanager.selectedLayer) {
                var source = layermanager.getLayerById(layermanager.selectedLayer.id).getSource();
                if (source instanceof ol.source.Vector) {
                    if (coords[0][0][0] < coords[0][2][0]) {
                        source.forEachFeatureInExtent(extent, function (feature) {
                            var fextent = feature.getGeometry().getExtent(); // [minx miny maxx maxy]
                            if (extent[0] < fextent[0] && extent[1] < fextent[1] && extent[2] > fextent[2] && extent[3] > fextent[3]) {
                                _this.get('selectedFeatures').push(feature);
                            }
                        });
                    } else {
                        source.forEachFeatureIntersectingExtent(extent, function (feature) {
                            _this.get('selectedFeatures').push(feature);
                        });
                    }
                }
            }
        }, this);
        // TODO: remove to this
        
        var selectSingle = this.get('selectSingle');
        if (selectSingle.get('interaction') === null) {
            selectSingle.set('interaction', selectSingleInteraction);
        }
        map.addControl(selectSingle);
        selectSingle.setMap(map);
        
        var selectMulti = this.get('selectMulti');
        if (selectMulti.get('interaction') === null) {
            selectMulti.set('interaction', selectMultiInteraction);
        }
        map.addControl(selectMulti);
        selectMulti.setMap(map);
        
        this.get('element').appendChild(this.get('removeButton'));
        
        // register global
        map.selectedFeatures = this.get('selectedFeatures');
    }
};


/**
 * @classdesc
 * A button control which, when pressed, the view fits the selection.
 * To style this control use the css selector `.ol-zoom-selected`.
 *
 * @requires ol.Editor
 * @requires ol.control.ZoomTo
 *
 * @constructor
 * @extends {ol.control.ZoomTo}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.ZoomToSelection = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    
    ol.control.ZoomTo.call(this, {
        className: options.className || 'ol-zoom-selected ol-unselectable ol-control',
        tipLabel: options.tipLabel || 'Zoom to selected feature',
        label: options.label || ' ',
        extentFunction: function() {
            var map = _this.getMap();
            var extent = ol.extent.createEmpty();
            var features = map.selectedFeatures;
            features.forEach(function(item) {
                ol.extent.extend(extent, item.getGeometry().getExtent());
            });
            if (features.getLength() > 0) {
                return extent;
            } else {
                map.sendMessage('No selected feature to zoom.');
                return false;
            }
        },
        target: options.target
    });
};
ol.inherits(ol.control.ZoomToSelection, ol.control.Control);