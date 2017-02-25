/**
 * @name OLEditor
 * @version 0.12
 * @description Desktop-like UI for the OpenLayers 3+ web mapping library.
 * @author Gergő Gelencsér (http://github.com/programmerg)
 * @license Code licensed under the 2-Clause BSD (https://github.com/programmerg/ol3ditor/LICENSE.md)
 * @tutorial https://github.com/programmerg/ol3ditor/
 */

/**
 * @classdesc
 * Button controls which, when pressed, handles specific selection methods.
 * To style this control use the css selector `.ol-attributemanager`.
 *
 * @requires ol.Editor
 * @requires ol.control.Interaction
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.AttributeManager = function(opt_options) {
   
    var options = opt_options || {};
    var _this = this;
  
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-attributemanager';

    var layerContainer = document.createElement('div');
    layerContainer.className = 'ol-attributecontainer';
    controlDiv.appendChild(layerContainer);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.setProperties({
        element: controlDiv
    });
};
ol.inherits(ol.control.AttributeManager, ol.control.Control);

ol.control.AttributeManager.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    if (map === null) {
        ol.Observable.unByKey(this.get('chgEventId'));
    } else {
        this.set('chgEventId', map.getLayerManager().on('change:selected', function () {
            var layer = map.getLayerManager().getSelectedLayer();
            var element = this.get('element');
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            if (layer instanceof ol.layer.Vector) {
                element.appendChild( this.createTable(layer, map) );
            }
        }, this));
    }
};

ol.control.AttributeManager.prototype.createTable = function (layer, map) {
    var headers = [];
    var features = layer.getSource().getFeatures();
    var table = document.createElement('table');
    table.className = 'table table-striped table-collapsed';
  
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    for (var i = 0; i < features.length; i++) {
        var attributes = features[i].getProperties();
        for (var j in attributes) {
            if (typeof attributes[j] !== 'object' && headers.indexOf(j) == -1) {
                headers.push(j);
                var th = document.createElement('th');
                th.appendChild(document.createTextNode(j));
                tr.appendChild(th);
            }
        }
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  
    var tbody = document.createElement('tbody');
    for (var i = 0; i < features.length; i++) {
        var tr = document.createElement('tr');
        tr.setAttribute('data-id', features[i].getId());
        var attributes = features[i].getProperties();
        for (var j in headers) {
            var td = document.createElement('td');
            if (attributes[headers[j]]) {
                td.appendChild(document.createTextNode(attributes[headers[j]]));
            } else {
                td.appendChild(document.createTextNode('\u0020'));
            }
            td.addEventListener('click', function(evt){
                var tr = evt.target.parentNode;
                var trs = tr.parentNode.childNodes;
                for (var t in trs) {
                    if (trs[t].classList !== undefined){
                        trs[t].classList.remove('selected');
                    }
                }
                tr.classList.add('selected');
              
                if (map instanceof ol.Editor) {
                    var id = tr.getAttribute('data-id');
                    var feature = layer.getSource().getFeatureById(id);
                    map.selectedFeatures.clear();
                    map.selectedFeatures.push(feature);
                }
                this.contentEditable = true;
                this.focus();
            });
            td.addEventListener('blur', function (evt) {
                var tr = evt.target.parentNode;
                if (this.contentEditable) {
                    this.contentEditable = false;
                    if (map instanceof ol.Editor) {
                        var id = tr.getAttribute('data-id');
                        var feature = layer.getSource().getFeatureById(id);
                        var prop = [];
                        prop[headers[j]] = this.childNodes[0];
                        feature.setProperties(prop);
                    }
                }
            });
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  
    return table;
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
        if (confirm(options.removeConfirm || 'The selected feature(s) will be removed. Are you sure?')) {
            _this.getMap().getLayers().forEach(function(layer){
                if (layer instanceof ol.layer.Vector) {
                    layer.getSource().removeFeature(features);
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
/**
 * @classdesc
 * A button control which, when pressed, creates a new layer with
 * geolocation API's position and accuracy geometrys.
 * To style this control use the css selector `.ol-geolocate`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Geolocate = function (opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    
	var geolocation = new ol.Geolocation(options.trackingOptions || {
		trackingOptions: {
			maximumAge: 10000,
			enableHighAccuracy: true,
			timeout: 600000
		}
	});

    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-geolocate ol-unselectable ol-control';
    
    var geolocateButton = document.createElement('button');
    geolocateButton.title = options.tipLabel || 'Zoom to my current position';
    geolocateButton.textContent = options.label || '';
    geolocateButton.addEventListener('click', function (evt) {
        _this.set('active', !_this.get('active')); // toggle
    });
    controlDiv.appendChild(geolocateButton);
	
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.setProperties({
        active: false,
        accuracyFeature: options.accuracyFeature || new ol.Feature(),
        positionFeature: options.positionFeature || new ol.Feature(),
        positionStyle: options.positionStyle || new ol.style.Style({
            image: new ol.style.Circle({
              radius: 6,
              fill: new ol.style.Fill({
                color: '#3399CC'
              }),
              stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2
              })
            })
        }),
        featuresOverlay: options.featuresOverlay || new ol.layer.Vector({
            name: 'Current position',
            source: new ol.source.Vector()
        })
    });
    
	this.get('positionFeature').setStyle(this.get('positionStyle'));
    this.get('featuresOverlay').getSource().addFeatures(
        [this.get('accuracyFeature'), this.get('positionFeature')]    
    );
    
    this.on('change:active', function () {
        if (this.get('active') === true) {
            geolocateButton.classList.add('active');
			geolocation.setProjection( this.getMap().getView().getProjection() );
			geolocation.setTracking(true);
			geolocation.once('change', function () {
                this.get('featuresOverlay').setMap(this.getMap());
				if (typeof this.get('accuracyFeature').getGeometry() !== 'undefined') {
					this.getMap().getView().fit(this.get('accuracyFeature').getGeometry(), this.getMap().getSize(), {padding: [100, 100, 100, 100]});
				} else if (typeof this.get('positionFeature').getGeometry() !== 'undefined') {
					this.getMap().getView().fit(this.get('positionFeature').getGeometry(), this.getMap().getSize(), {padding: [100, 100, 100, 100]});
				}
			}, this);
        } else {
			geolocateButton.classList.remove('active');
			this.get('featuresOverlay').setMap(null);
			geolocation.setTracking(false);
        }
    }, this);
    
	geolocation.on('error', function(error) {
		throw new Error('Some error occured: ' + error);
	});
	geolocation.on('change:accuracyGeometry', function() {
		this.get('accuracyFeature').setGeometry(geolocation.getAccuracyGeometry());
	}, this);
	geolocation.on('change:position', function() {
		var coordinates = geolocation.getPosition();
		this.get('positionFeature').setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
	}, this);
};
ol.inherits(ol.control.Geolocate, ol.control.Control);/**
 * @classdesc
 * A button control wich, when pressed, sets the state of
 * interaction to active or inactive.
 * When the type of control is 'toggle', on state change,
 * all the same type control will be switched off.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Interaction = function(opt_options) {
    var _this = this;
    var options = opt_options || {};
    var interaction = options.interaction;

    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-unselectable ol-control';

    var controlButton = document.createElement('button');
    controlButton.textContent = options.label || 'I';
    controlButton.title = options.tipLabel || 'Custom interaction';
    controlButton.addEventListener('click', function() {
        if (_this.get('interaction').getActive()) {
            _this.set('active', false);
        } else {
            _this.set('active', true);
        }
    });
    
    if (options.singleButton && options.singleButton === true) {
        controlButton.className = options.className || '';
        controlDiv = controlButton;
    } else {
        controlDiv.appendChild(controlButton);
    }
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.setProperties({
        interaction: interaction,
        active: false,
        type: 'toggle',
        destroyFunction: function(evt) {
            if (evt.element === _this) {
                this.removeInteraction(_this.get('interaction'));
            }
        }
    });
    
    this.setDisabled = function(bool) {
        if (typeof bool === 'boolean') {
            controlButton.disabled = bool;
            return this;
        }
    };
    
    this.on('change:active', function () {
        this.get('interaction').setActive(this.get('active'));
        if (this.get('active')) {
            controlButton.classList.add('active');
            _this.getMap().getControls().forEach(function(control) {
                if (control.get('type') === 'toggle' && control !== _this) {
                    control.set('active', false);
                }
            });
        } else {
            controlButton.classList.remove('active');
        }
    }, this);
};
ol.inherits(ol.control.Interaction, ol.control.Control);

ol.control.Interaction.prototype.setMap = function (map) {
    ol.control.Control.prototype.setMap.call(this, map);
    var interaction = this.get('interaction');
    if (map === null) {
        ol.Observable.unByKey(this.get('eventId'));
    } else if (map.getInteractions().getArray().indexOf(interaction) === -1) {
        map.addInteraction(interaction);
        interaction.setActive(false);
        this.set('eventId', map.getControls().on('remove', this.get('destroyFunction'), map));
    }
};/**
 * @classdesc
 * Button controls which, when pressed, handles specific layer methods.
 * To style this control use the css selector `.ol-layercontrols`.
 *
 * @requires ol.Editor
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.LayerControls = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-layercontrols ol-unselectable ol-control';
    
    var newVectorButton = document.createElement('button');
    newVectorButton.textContent = options.newVectorLabel || '';
    newVectorButton.title = options.newVectorTipLabel || 'New Vector Layer';
    newVectorButton.className = options.newVectorClassName || 'ol-newvector';
    newVectorButton.addEventListener('click', function () {
		$(document.getElementById(options.newVectorTarget || 'newvector')).modal();
    });
    controlDiv.appendChild(newVectorButton);
    
    var addVectorButton = document.createElement('button');
    addVectorButton.textContent = options.addVectorButtonLabel || '';
    addVectorButton.title = options.addVectorTipLabel || 'Add Vector Layer';
    addVectorButton.className = options.addVectorClassName || 'ol-addvector';
    addVectorButton.addEventListener('click', function () {
		$(document.getElementById(options.addVectorTarget || 'addvector')).modal();
    });
    controlDiv.appendChild(addVectorButton);
    
    var addRasterButton = document.createElement('button');
    addRasterButton.textContent = options.addRasterButtonLabel || '';
    addRasterButton.title = options.addRasterTipLabel || 'Add Raster Layer';
    addRasterButton.className = options.addRasterClassName || 'ol-addraster';
    addRasterButton.addEventListener('click', function () {
		$(document.getElementById(options.addRasterTarget || 'addraster')).modal();
    });
    controlDiv.appendChild(addRasterButton);
    
    var deleteLayerButton = document.createElement('button');
    deleteLayerButton.textContent = options.deleteLayerButtonLabel || '';
    deleteLayerButton.title = options.deleteLayerTipLabel || 'Remove Layer';
    deleteLayerButton.className = options.deleteLayerClassName || 'ol-deletelayer';
    deleteLayerButton.addEventListener('click', function () {
        var map = _this.getMap();
        var layermanager = map.getLayerManager();
		if (layermanager.getSelectedLayer()) {
			var layer = layermanager.getSelectedLayer();
            if (confirm(options.removeConfirm || 'The selected layer will be removed. Are you sure?')) {
                map.removeLayer(layer);
            }
		} else {
			map.sendMessage('No selected layer to remove.');
		}
    });
    controlDiv.appendChild(deleteLayerButton);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
};
ol.inherits(ol.control.LayerControls, ol.control.Control);


/**
 * @classdesc
 * A button control which, when pressed, the view fits the selection.
 * To style this control use the css selector `.ol-zoom-layer`.
 *
 * @requires ol.Editor
 * @requires ol.control.ZoomTo
 *
 * @constructor
 * @extends {ol.control.ZoomTo}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.ZoomToLayer = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    
    ol.control.ZoomTo.call(this, {
        className: options.className || 'ol-zoom-layer ol-unselectable ol-control',
        tipLabel: options.tipLabel || 'Zoom to layer extent',
        label: options.label || ' ',
        extentFunction: function() {
            var map = _this.getMap();
            var layermanager = map.getLayerManager();
            if (layermanager.getSelectedLayer()) {
                var source = layermanager.getSelectedLayer().getSource();
                if (typeof source.getExtent === 'function') {
                    return source.getExtent();
                } else {
                    map.sendMessage('Cannot get the extent of selected layer.');
                    return false;
                }
            } else {
                map.sendMessage('No selected layer to zoom.');
                return false;
            }
        },
        target: options.target
    });
};
ol.inherits(ol.control.ZoomToLayer, ol.control.Control);
/**
 * @classdesc
 * Button controls which, when pressed, handles specific selection methods.
 * To style this control use the css selector `.ol-selectcontrols`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.LayerManager = function(opt_options) {
   
    var options = opt_options || {};
    var _this = this;
	
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-layermanager';

    var layerContainer = document.createElement('div');
    layerContainer.className = 'ol-layercontainer';
    controlDiv.appendChild(layerContainer);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    this.setProperties({
        'element': layerContainer,
        'selected': null,
    });

    this.idCounter_ = 0;
};
ol.inherits(ol.control.LayerManager, ol.control.Control);

ol.control.LayerManager.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    if (map === null) {
        ol.Observable.unByKey(this.get('addEventId'));
        ol.Observable.unByKey(this.get('removeEventId'));
        ol.Observable.unByKey(this.get('dragAndDropEventId'));
    } else {
        
        map.getLayers().forEach(function (element, index) {
			this.createLayerDiv(element);
		}, this);
        
        this.set('addEventId', map.getLayers().on('add', function (evt) {
            this.createLayerDiv(evt.element);
        }, this));
        
        this.set('removeEventId', map.getLayers().on('remove', function (evt) {
            var layerDiv = document.getElementById(evt.element.get('id'));
            this.get('element').removeChild(layerDiv);
            this.set('selected', null);
            // TODO: this.getMap().removeInteraction(snapInteraction);
        }, this));
        
        var dragAndDropInteraction = this.dragAndDropLayer();
        this.set('dragAndDropEventId', map.addInteraction(dragAndDropInteraction));
        
        map.setLayerManager(this); // register global
    }
};

ol.control.LayerManager.prototype.createOption = function (optionValue) {
    var option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    return option;
};

ol.control.LayerManager.prototype.createLayerDiv = function (layer) {
    var _this = this;
    var map = this.getMap();
    
    layer.set('id', 'layer_' + this.idCounter_);
    this.idCounter_ += 1;
    
    var layerDiv = document.createElement('div');
    layerDiv.className = 'ol-layer ol-unselectable';
    layerDiv.title = 'Drag to change order';
    layerDiv.id = layer.get('id');
    layerDiv.draggable = true;
    layerDiv.addEventListener('dragstart', function (evt) {
        evt.dataTransfer.effectAllowed = 'move';
        evt.dataTransfer.setData('Text', this.id);
    });
    layerDiv.addEventListener('dragenter', function (evt) {
        this.classList.add('over');
    });
    layerDiv.addEventListener('dragleave', function (evt) {
        this.classList.remove('over');
    });
    layerDiv.addEventListener('dragover', function (evt) {
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'move';
    });
    layerDiv.addEventListener('drop', function (evt) {
        evt.preventDefault();
        this.classList.remove('over');
        var sourceLayerDiv = document.getElementById(evt.dataTransfer.getData('Text'));
        if (sourceLayerDiv !== this) {
            var layerContainer = _this.get('element');
            layerContainer.removeChild(sourceLayerDiv);
            layerContainer.insertBefore(sourceLayerDiv, this);
            var htmlArray = [].slice.call(layerContainer.children);
            var index = htmlArray.length - htmlArray.indexOf(sourceLayerDiv) - 1;
            var sourceLayer = _this.getLayer(sourceLayerDiv.id);
            var layers = map.getLayers().getArray();
            layers.splice(layers.indexOf(sourceLayer), 1);
            layers.splice(index, 0, sourceLayer);
            map.render();
            map.getLayers().changed();
        }
    });
    
    var layerSpan = document.createElement('span');
    layerSpan.className = 'ol-layermanager-title';
    layerSpan.textContent = layer.get('name') || 'Unnamed layer';
    layerSpan.addEventListener('click', function (evt) {
        evt.stopPropagation();
        var targetNode = evt.target.parentNode;
        if (!targetNode.classList.contains('disabled')) {
            if (_this.get('selected')) {
                _this.get('selected').classList.remove('active');
            }
            _this.set('selected', targetNode);
            targetNode.classList.add('active');
        }
        if (targetNode.classList.contains('active')) {
            this.contentEditable = true;
            layerDiv.draggable = false;
            layerDiv.classList.remove('ol-unselectable');
            this.focus();
        }
    });
    layerSpan.addEventListener('blur', function () {
        if (this.contentEditable) {
            this.contentEditable = false;
            layerDiv.draggable = true;
            layer.set('name', this.textContent);
            layerDiv.classList.add('ol-unselectable');
        }
    });
    layerDiv.appendChild(layerSpan);
    
    var visibleBox = document.createElement('input');
    visibleBox.type = 'checkbox';
    visibleBox.title = 'Visible';
    visibleBox.className = 'ol-layermanager-visible';
    visibleBox.checked = layer.getVisible();
    visibleBox.addEventListener('click', function (evt) {
        evt.stopPropagation();
    });
    visibleBox.addEventListener('change', function () {
        if (this.checked) {
            layer.setVisible(true);
        } else {
            layer.setVisible(false);
        }
    });
    layerDiv.appendChild(visibleBox);
    
    var selectableBox = document.createElement('input');
    selectableBox.type = 'checkbox';
    selectableBox.title = 'Selectable';
    selectableBox.className = 'ol-layermanager-selectable';
    selectableBox.checked = true;
    selectableBox.addEventListener('click', function (evt) {
        evt.stopPropagation();
    });
    selectableBox.addEventListener('change', function (evt) {
        if (this.checked) {
            evt.target.parentNode.classList.remove('disabled');
        } else {
            evt.target.parentNode.classList.add('disabled');
        }
    });
    layerDiv.appendChild(selectableBox);
    
    if (layer instanceof ol.layer.Vector) {
        var snapInteraction = new ol.interaction.Snap({
            source: layer.getSource()
        });
        snapInteraction.setActive(false);
        var snappableBox = document.createElement('input');
        snappableBox.type = 'checkbox';
        snappableBox.title = 'Snappable';
        snappableBox.className = 'ol-layermanager-snappable';
        snappableBox.checked = false;
        snappableBox.addEventListener('click', function (evt) {
            evt.stopPropagation();
        });
        snappableBox.addEventListener('change', function () {
            if (this.checked) {
                snapInteraction.setActive(true);
            } else {
                snapInteraction.setActive(false);
            }
        });
        layerDiv.appendChild(snappableBox);
        _this.getMap().addInteraction(snapInteraction);
    }
    
    var layerStyleDiv = document.createElement('div');
    layerStyleDiv.className = 'ol-layermanager-style';
    layerStyleDiv.addEventListener('click', function (evt) {
        evt.stopPropagation();
        var targetNode = evt.target.parentNode;
        if (_this.get('selected')) {
            _this.get('selected').classList.remove('active');
        }
        _this.set('selected', targetNode);
        targetNode.classList.add('active');
    });
    
    var opacityHandler = document.createElement('input');
    opacityHandler.type = 'range';
    opacityHandler.min = 0;
    opacityHandler.max = 1;
    opacityHandler.step = 0.1;
    opacityHandler.value = layer.getOpacity();
    opacityHandler.addEventListener('input', function () {
        layer.setOpacity(this.value);
    });
    opacityHandler.addEventListener('change', function () {
        layer.setOpacity(this.value);
    });
    opacityHandler.addEventListener('mousedown', function () {
        layerDiv.draggable = false;
    });
    opacityHandler.addEventListener('mouseup', function () {
        layerDiv.draggable = true;
    });
    opacityHandler.addEventListener('click', function (evt) {
        evt.stopPropagation();
    });
    layerStyleDiv.appendChild(opacityHandler);
    
    if (layer instanceof ol.layer.Vector) {
        /*
        var attributeOptions = document.createElement('select');
        attributeOptions.addEventListener('click', function (evt) {
            evt.stopPropagation();
        });
        layerStyleDiv.appendChild(attributeOptions);
        
        layer.on('propertychange', function (evt) {
            if (evt.key === 'headers') {
                attributeOptions.length = 0;
                var headers = layer.get('headers');
                for (var i in headers) {
                    attributeOptions.appendChild(this.createOption(i));
                }
            }
        }, this);
        layer.buildHeaders();
        
        var defaultStyle = document.createElement('button');
        defaultStyle.title = 'Default';
        defaultStyle.className = 'ol-layermanager-default';
        defaultStyle.textContent = 'D';
        defaultStyle.addEventListener('click', function (evt) {
            evt.stopPropagation();
            layer.setStyle(layer.get('style'));
        });
        layerStyleDiv.appendChild(defaultStyle);
        
        var graduatedStyle = document.createElement('button');
        graduatedStyle.title = 'Graduated';
        graduatedStyle.className = 'ol-layermanager-graduated';
        graduatedStyle.textContent = 'G';
        graduatedStyle.addEventListener('click', function (evt) {
            evt.stopPropagation();
            var attribute = graduatedStyle.parentNode.querySelector('select').value;
            _this.styleGraduated.call(_this, layer, attribute);
        });
        layerStyleDiv.appendChild(graduatedStyle);
        
        var categorizedStyle = document.createElement('button');
        categorizedStyle.title = 'Categorized';
        categorizedStyle.className = 'ol-layermanager-categorized';
        categorizedStyle.textContent = 'C';
        categorizedStyle.addEventListener('click', function (evt) {
            evt.stopPropagation();
            var attribute = categorizedStyle.parentNode.querySelector('select').value;
            _this.styleCategorized.call(_this, layer, attribute);
        });
        layerStyleDiv.appendChild(categorizedStyle);
        
        layer.set('style', layer.getStyle());
        */
  
        layer.getSource().on('change', function (evt) {
            switch (evt.target.getState()) {
                case 'ready':   
                    layerDiv.className = layerDiv.className.replace(/(?:^|\s)(error|buffering)(?!\S)/g, '');
                    break;
                case 'error':
                    layerDiv.className += ' error'
                    break;
                default:
                    layerDiv.className += ' buffering';
                    break;
            }
        });
    }
    layerDiv.appendChild(layerStyleDiv);
    this.get('element').insertBefore(layerDiv, this.get('element').firstChild);
    
    return this;
};

ol.control.LayerManager.prototype.getLayer = function (id) {
    var layers = this.getMap().getLayers().getArray();
    if (typeof id !== 'string') return false;
    for (var i = 0; i < layers.length; i += 1) {
        if (layers[i].get('id') === id) {
            return layers[i];
        }
    }
    return false;
};

ol.control.LayerManager.prototype.getSelectedLayer = function () {
    var layers = this.getMap().getLayers().getArray();
    if (this.get('selected') === null) return false;
    for (var i = 0; i < layers.length; i += 1) {
        if (layers[i].get('id') === this.get('selected').id) {
            return layers[i];
        }
    }
    return false;
};
/*
ol.layer.Vector.prototype.buildHeaders = function () {
    var headers = this.get('headers') || {};
    var features = this.getSource().getFeatures();
    for (var i = 0; i < features.length; i += 1) {
        var attributes = features[i].getProperties();
        for (var j in attributes) {
            if (typeof attributes[j] !== 'object' && !(j in headers)) {
                headers[j] = 'string';
            }
        }
    }
    this.set('headers', headers);
    return this;
};

ol.control.LayerManager.prototype.styleGraduated = function (layer, attribute) {
    if (layer.get('headers')[attribute] === 'string') {
        this.getMap().sendMessage('A numeric column is required for graduated symbology.');
    } else {
        var attributeArray = [];
        layer.getSource().forEachFeature(function (feat) {
            attributeArray.push(feat.get(attribute));
        });
        var max = Math.max.apply(null, attributeArray);
        var min = Math.min.apply(null, attributeArray);
        var step = (max - min) / 5;
        var colors = this.graduatedColorFactory(5, [254, 240, 217], [179, 0, 0]);
        layer.setStyle(function (feature, res) {
            var property = feature.get(attribute);
            var color = property < min + step * 1 ? colors[0] :
                property < min + step * 2 ? colors[1] :
                property < min + step * 3 ? colors[2] : 
                property < min + step * 4 ? colors[3] : colors[4];
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: [0, 0, 0, 1],
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: color
                })
            });
            return [style];
        });
    }
};

ol.control.LayerManager.prototype.graduatedColorFactory = function (intervals, rgb1, rgb2) {
    var colors = [];
    var step = intervals - 1;
    var redStep = (rgb2[0] - rgb1[0]) / step;
    var greenStep = (rgb2[1] - rgb1[1]) / step;
    var blueStep = (rgb2[2] - rgb1[2]) / step;
    for (var i = 0; i < step; i += 1) {
        var red = Math.ceil(rgb1[0] + redStep * i);
        var green = Math.ceil(rgb1[1] + greenStep * i);
        var blue = Math.ceil(rgb1[2] + blueStep * i);
        colors.push([red, green, blue, 1]);
    }
    colors.push([rgb2[0], rgb2[1], rgb2[2], 1]);
    return colors;
};

ol.control.LayerManager.prototype.styleCategorized = function (layer, attribute) {
    var attributeArray = [];
    var colorArray = [];
    var randomColor;
    layer.getSource().forEachFeature(function (feat) {
        var property = feat.get(attribute).toString();
        if (attributeArray.indexOf(property) === -1) {
            attributeArray.push(property);
            do {
                randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
            } while (colorArray.indexOf(randomColor) !== -1);
            colorArray.push(randomColor);
        }
    }, this);
    layer.setStyle(function (feature, res) {
        var index = attributeArray.indexOf(feature.get(attribute).toString());
        var style = new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: [0, 0, 0, 1],
                width: 1
            }),
            fill: new ol.style.Fill({
                color: colorArray[index]
            })
        });
        return [style];
    });
};
*/
ol.control.LayerManager.prototype.newVectorLayer = function (form) {
    var type = form.type.value;
    if (type !== 'point' && type !== 'line' && type !== 'polygon' && type !== 'geomcollection') {
        this.getMap().sendMessage('Unrecognized layer type.');
        return false;
    }
    var layer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        name: form.displayname.value || 'New ' + type + ' layer',
        type: type
    });
    this.getMap().addLayer(layer);
    layer.getSource().changed();
    return this;
};

ol.control.LayerManager.prototype.dragAndDropLayer = function ()
{
	var dragAndDropInteraction = new ol.interaction.DragAndDrop({
        formatConstructors: [
            ol.format.GPX,
            ol.format.KML,
            ol.format.OSMXML,
            ol.format.EsriJSON,
            ol.format.GeoJSON,
            ol.format.TopoJSON,
            ol.format.IGC,
            ol.format.Polyline,
            ol.format.WKT,
            ol.format.MVT
        ]
    });
    var map = this.getMap();
	dragAndDropInteraction.on('addfeatures', function(event) {
        var layer = new ol.layer.Vector({
            name: event.file.name,
            source: new ol.source.Vector({
                features: event.features
            })
        });
		map.addLayer(layer);
    });
	return dragAndDropInteraction;
};

ol.control.LayerManager.prototype.addVectorLayer = function (form)
{
    var map = this.getMap();
    
	var name = form.displayname.value;
	var type = form.type.value;
	var format = form.format.value;
	var file = form.file.files[0];
	var url = form.server.value;
	var typeName = form.layer.value;
	var tiled = form.tiled.checked;
	var projection = form.projection.value;
    
	var sourceFormat;
	switch (format) {
        // xml
		case 'gml3':
			sourceFormat = new ol.format.GML3({
                srsName: projection
            });
			break;
		case 'gml2':
			sourceFormat = new ol.format.GML2({
                srsName: projection
            });
			break;
		case 'gpx':
			sourceFormat = new ol.format.GPX();
			break;
		case 'kml':
			sourceFormat = new ol.format.KML();
			break;
		case 'osmxml':
			sourceFormat = new ol.format.OSMXML();
			break;
        // json
		case 'esrijson':
			sourceFormat = new ol.format.EsriJSON();
			break;
		case 'geojson':
			sourceFormat = new ol.format.GeoJSON();
            format = 'application/json'; // mime type
			break;
		case 'topojson':
            sourceFormat = new ol.format.TopoJSON();
			break;
        // text
		case 'igc':
			sourceFormat = new ol.format.IGC();
			break;
		case 'polyline':
			sourceFormat = new ol.format.Polyline();
			break;
		case 'wkt':
			sourceFormat = new ol.format.WKT();
			break;
        // mapbox own
		case 'mvt':
			sourceFormat = new ol.format.MVT();
			break;
		default:
            map.sendMessage('Please select vector format first!');
			return false;
	}
    if (type == 'wfs') {
		url = /^((http)|(https))(:\/\/)/.test(url) ? url : 'http://' + url;
		url = /\?/.test(url) ? url + '&' : url + '?';
		url = url + 'SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=' + typeName + '&SRSNAME=' + projection + '&OUTPUTFORMAT=' + format;
        if (name.length < 1) { name = typeName + ' WFS'; }
    }
    
	ol.featureloader.file = function(extent, resolution, proj){
        try {
            var _this = this;
            var fr = new FileReader();
            fr.onload = function (evt) {
                var vectorData = evt.target.result;
                _this.addFeatures(sourceFormat.readFeatures(vectorData, {
                    dataProjection: sourceFormat.readProjection(vectorData) || projection,
                    featureProjection: map.getView().getProjection()
                }));
            };
            fr.readAsText(file);
        } catch (error) {
            this.setState('error')
            map.sendMessage('Unexpected error: ' + error.message);
        }
    }
    /* featureloader.xhr is the same
	ol.featureloader.url = function(extent, resolution, proj){
        try {
            var _this = this;            
            var request = new XMLHttpRequest();
            request.onreadystatechange = function (evt) {
                if (request.readyState === 4 && request.status === 200) {
                    var vectorData = request.responseText;
                    _this.addFeatures(sourceFormat.readFeatures(vectorData, {
                        dataProjection: sourceFormat.readProjection(vectorData) || projection,
                        featureProjection: map.getView().getProjection()
                    }));   
                }
            };
            request.open('GET', url, true);
            request.send();
        } catch (error) {
            this.setState('error')
            map.sendMessage('Unexpected error: ' + error.message);
        }
    }*/
    
	var layer = new ol.layer.Vector({
		name: ((type == 'file' && name.length < 1) ? file.name : name ),
		source: new ol.source.Vector({
			url: (type == 'file' ? undefined : (tiled ? function(extent, resolution, proj) {
				return url + '&bbox=' + extent.join(',') + ',' + proj.getCode();
			} : url)),
			strategy: (tiled ? ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
                maxZoom: 19
            })) : ol.loadingstrategy.all),
			loader: (type == 'file' ? ol.featureloader.file : undefined),
			format: sourceFormat
		})
	});
	
    map.addLayer(layer);
    layer.getSource().changed();
    return this;
};

ol.control.LayerManager.prototype.addRasterLayer = function (form)
{
    var map = this.getMap();
    
	var name = form.displayname.value;
	var format = form.format.value;
	var file = form.file.files[0];
	var url = form.server.value;
    url = /^((http)|(https))(:\/\/)/.test(url) ? url : 'http://' + url;
	var typeName = form.layer.value;
	var projection = form.projection.value;
    
	var sourceFormat;
	switch (format) {
        // tile services
		case 'wms':
			sourceFormat = new ol.source.TileWMS({
				url: url,
                projection: projection,
				params: { layers: typeName, tiled: true }
			});
			break;
		case 'wmts':
            url = /\?/.test(url) ? url + '&' : url + '?';
            var request = new XMLHttpRequest();
            request.open('GET', url + 'REQUEST=GetCapabilities&SERVICE=WMTS', false);
            request.send(); // false - synchronous, deprecated, but here is useful !!!
            if (request.readyState === 4 && request.status === 200) {
                try {
                    var parser = new ol.format.WMTSCapabilities();
                    var response = parser.read(request.responseText);
                } catch (error) {
                    map.sendMessage('Unexpected error: ' + error.message );
                }
            }
			sourceFormat = new ol.source.WMTS(
                ol.source.WMTS.optionsFromCapabilities(response,
                    { layer: typeName, matrixSet: projection }
                )
            );
			break;
		case 'bing':
			sourceFormat = new ol.source.BingMaps({
				key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSrOvOKhA-CJlm3',
				imagerySet: typeName
			});
            if (name.length < 1) { name = 'Bing Maps ' + typeName; }
			break;
		case 'mapquest':
			sourceFormat = new ol.source.MapQuest({
                layer: typeName
            });
            if (name.length < 1) { name = 'MapQuest ' + typeName; }
			break;
		case 'stamen':
			sourceFormat = new ol.source.Stamen({
                layer: typeName
            });
            if (name.length < 1) { name = 'Stamen ' + typeName; }
			break;
		case 'osm':
			sourceFormat = new ol.source.OSM();
            if (name.length < 1) { name = 'OpenStreetMap'; }
			break;
		case 'xyz':
			sourceFormat = new ol.source.XYZ({
                urls: [ url ],
                projection: projection
            });
			break;
        // single images
		case 'static':
            if (!file.type.match('image.*')) {
                map.sendMessage('Warning! No raster file selected.');
                return false;
            }
            var extent = prompt("Please enter the image extent coordinates:\nleft,bottom,right,top", "0,0,0,0");
            extent = extent.split(',');
			sourceFormat = new ol.source.ImageStatic({
                url: '',
                imageExtent: [extent[0], extent[1], extent[2], extent[3]],
                projection: projection,
                imageLoadFunction: function(image, src){
                    try {
                        var fr = new FileReader();
                        fr.onload = function (evt) {
                            image.getImage().src = evt.target.result;
                        };
                        fr.readAsDataURL(file);
                    } catch (error) {
                        map.sendMessage('Unexpected error: ' + error.message);
                    }
                }
            });
            if (name.length < 1) { name = file.name; }
			break;
		default:
            map.sendMessage('Please select raster source first!');
			return false;
	}
	
	if (format != 'static') {
		layer = new ol.layer.Tile({
			name: name,
			source: sourceFormat
		});
	} else {
		layer = new ol.layer.Image({
			name: name,
			source: sourceFormat
		});
	}
	map.addLayer(layer);
    layer.getSource().changed();
	return this;
};

ol.control.LayerManager.prototype.getCapabilities = function (form) {
    var _this = this;
    var map = this.getMap();
    var url = form.server.value;
    url = /^((http)|(https))(:\/\/)/.test(url) ? url : 'http://' + url;
    
    form.server.value = url;
    form.check.disabled = true;
    form.layer.options.length = 0;
    
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            try {
                if (form.format.value=='wmts') {
                    var parser = new ol.format.WMTSCapabilities();
                    var response = parser.read(request.responseText);
                    if (form.displayname.value == '') {
                        form.displayname.value = response.ServiceIdentification.Title;
                    }
                    var layers = response.Contents.Layer;
                    for (var i = 0; i < layers.length; i += 1) {
                        form.layer.appendChild( _this.createOption(layers[i].Identifier) );
                    }
                } else if (form.format.value=='wms') {
                    var parser = new ol.format.WMSCapabilities();
                    var response = parser.read(request.responseText);
                    if (form.displayname.value == '') {
                        form.displayname.value = response.Capability.Layer.Title;
                    }
                    var layers = response.Capability.Layer.Layer;
                    for (var i = 0; i < layers.length; i += 1) {
                        form.layer.appendChild( _this.createOption(layers[i].Name) );
                    }
                } else { // wfs
                    var parser = new DOMParser();
                    var response = parser.parseFromString(request.responseText, 'text/html');
                    if (form.displayname.value == '') {
                        form.displayname.value = response.getElementsByTagName('Title')[0].childNodes[0].nodeValue;
                        //form.displayname.value = response.ServiceIdentification.Title;
                    }
                    var layers = response.getElementsByTagName('FeatureType');
                    //var layers = response.FeatureTypeList.FeatureType;
                    for (var i = 0; i < layers.length; i += 1) {
                        form.layer.appendChild( _this.createOption(layers[i].getElementsByTagName('Name')[0].childNodes[0].nodeValue) );
                        //form.layer.appendChild( _this.createOption(layers[i].Name) );
                    }
                }
            } catch (error) {
                map.sendMessage('Unexpected error: ' + error.message );
            }
        }
        form.check.disabled = false;
    };
    var service;
    switch (form.format.value) {
        case 'wmts': service = 'WMTS'; break;
        case 'wms':  service = 'WMS';  break;
        default:     service = 'WFS';  break;
    }
    url = /\?/.test(url) ? url + '&' : url + '?';
    request.open('GET', url + 'REQUEST=GetCapabilities&SERVICE=' + service, true);
    request.send();
};

ol.control.LayerManager.prototype.getOtherCapabilities = function(form){
    form.layer.options.length = 0;
    if (form.format.value == 'bing') {
        var items = ['Road', 'Aerial', 'AerialWithLabels', 'collinsBart', 'ordnanceSurvey'];
        items.forEach(function(item){
            form.layer.appendChild(this.createOption(item));
        }, this);
    }
    if (form.format.value == 'mapquest') {
        var items = ['sat', 'osm', 'hyb'];
        items.forEach(function(item){
            form.layer.appendChild(this.createOption(item));
        }, this);
    }
    if (form.format.value == 'stamen') {
        var items = ['toner', 'terrain', 'watercolor'];
        items.forEach(function(item){
            form.layer.appendChild(this.createOption(item));
        }, this);
    }
    if (form.format.value == 'osm') {
        // form.layer.appendChild();
    }
    if (form.format.value == 'xyz') {
        form.layer.appendChild(this.createOption(''));
    }
};/**
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
};/**
 * @classdesc
 * A static control which, indicates the current status of the map.
 * To style this control use the css selector `.ol-message`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Message = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    var timeout = options.timeout || 10; // sec. or null
    
    var controlDiv = document.createElement('div');
    controlDiv.title = options.tipLabel || '';
    controlDiv.className = options.className || 'ol-message ol-unselectable ol-control';
    controlDiv.textContent = options.label || '';
    
    var observer = new MutationObserver(function(mutations) {
        if (timeout && mutations[0].target.textContent) {
            var oldText = mutations[0].target.textContent;
            var timeoutFunction = function() {
                if (oldText !== mutations[0].target.textContent) {
                    oldText = mutations[0].target.textContent;
                    setTimeout(timeoutFunction, timeout * 1000);
                } else {
                    oldText = '';
                    mutations[0].target.textContent = '';
                }
            };
            setTimeout(timeoutFunction, timeout * 1000);
        }
    });
    observer.observe(controlDiv, {childList: true});
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
};
ol.inherits(ol.control.Message, ol.control.Control);
/**
 * @classdesc
 * A button control which, when pressed, render the map view to a specific
 * PNG image. To style this control use the css selector `.ol-print`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Print = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    var dataURL;
    
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-print ol-unselectable ol-control';
    
    var printButton = document.createElement('button');
    printButton.textContent = options.label || '';
    printButton.title = options.tipLabel || 'Print map';
    printButton.addEventListener('click', function(evt) {
        _this.getMap().once('postcompose', function(evt) {
            var canvas = evt.context.canvas;
            dataURL = canvas.toDataURL('image/png');
        });
        _this.getMap().renderSync();
        window.open(dataURL, '_blank').print();
        dataURL = null;
    });
    
    controlDiv.appendChild(printButton);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
};
ol.inherits(ol.control.Print, ol.control.Control);/**
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
/**
 * @classdesc
 * An imput control which, when changed, change the rotation of view.
 * To style this control use the css selector `.ol-rotation-input`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Rotation = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-rotation ol-unselectable ol-control';
    
    var rotationInput = document.createElement('input');
    rotationInput.title = options.tipLabel || 'Set rotation';
    rotationInput.type = 'number';
    rotationInput.min = 0;
    rotationInput.max = 360;
    rotationInput.step = 1;
    rotationInput.value = 0;
    controlDiv.appendChild(rotationInput);
    rotationInput.addEventListener('change', function(evt) {
        var radianValue = this.value / 180 * Math.PI;
        _this.getMap().getView().setRotation(radianValue);
    });
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.set('element', rotationInput);
};
ol.inherits(ol.control.Rotation, ol.control.Control);

ol.control.Rotation.prototype.setMap = function(map) {
    
    ol.control.Control.prototype.setMap.call(this, map);
    
    if (map === null) {
        ol.Observable.unByKey(this.get('eventId'));
    } else {
        this.set('eventId', map.getView().on('change:rotation', function (evt) {
            var degreeValue = Math.round(map.getView().getRotation() / Math.PI * 180);
            this.get('element').value = degreeValue;
        }, this));
    }
};
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
                if (layermanager.getSelectedLayer()) {
                    if (layer === layermanager.getSelectedLayer()) {
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
                if (layermanager.getSelectedLayer()) {
                    if (layer === layermanager.getSelectedLayer()) {
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
            if (layermanager.getSelectedLayer()) {
                var source = layermanager.getSelectedLayer().getSource();
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
ol.inherits(ol.control.ZoomToSelection, ol.control.Control);/**
 * @classdesc
 * A button control which, when pressed, creates a permalink with the map
 * current view parameters. To style this control use the css selector `.ol-share`.
 * When the control is creted, the permalink updates the view automatically on load.
 * When the autoUpdate option is true, then every view action updates the permalink.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.ShareMap = function(opt_options) {
    
    // singleton hack - we want the setMap function only once
    if (typeof ol.control.ShareMap.instance === 'object') {
        return ol.control.ShareMap.instance;
    }
    
    var options = opt_options || {};
    var _this = this;
    
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-share ol-unselectable ol-control';
    
    var shareButton = document.createElement('button');
    shareButton.textContent = options.label || '';
    shareButton.title = options.tiplabel || 'Share map';
    shareButton.addEventListener('click', function(evt) {
		var state = _this.getState();
		location.hash = (ol.coordinate.format(state.center, '{x},{y}', _this.get('precision')) + ',' + state.zoom + ',' + state.rotation);
		alert('Please copy the URL from the addressbar.');
    });
    controlDiv.appendChild(shareButton);
	
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    this.setProperties({
        precision: options.precision || 6,
        autoUpdate: options.autoUpdate || false,
        projection: options.projection || 'EPSG:4326'
    });
    
    // singleton hack - we want the setMap function only once
    ol.control.ShareMap.instance = this;
};
ol.inherits(ol.control.ShareMap, ol.control.Control);


ol.control.ShareMap.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    
    if (map === null) {
        ol.Observable.unByKey(this.get('eventId'));
    } else {
        
		// get permalink on document load
		var permalink = location.hash.substr(1).split(',');
		if (typeof permalink === 'object' && permalink.length == 4) {
			this.setState({
				center: [ parseFloat(permalink[0]), parseFloat(permalink[1]) ],
				zoom: parseInt(permalink[2], 10),
				rotation: parseFloat(permalink[3])
			});
		}
        
		// update permalink on map move, when autoUpdate is true
		if (this.get('autoUpdate') === true) {
			var permalinkUpdate = true;
            this.set('eventId', map.on('moveend', function() {
				if (!permalinkUpdate) {
					permalinkUpdate = true;
					return;
				}
				var state = this.getState();
				var hash = (ol.coordinate.format(state.center, '{x},{y}', this.get('precision')) + ',' + state.zoom + ',' + state.rotation);
				window.history.pushState(state, 'map', '#' + hash);
			}, this));
            var _this = this;
			window.addEventListener('popstate', function(event) {
				if (event.state === null) return;
				if (typeof event.state.center !== 'undefined') {
					_this.setState(event.state);
				}
				permalinkUpdate = false;
			});
		}
    }
};

ol.control.ShareMap.prototype.getState = function() {
    var view = this.getMap().getView();
	return {
		center: ol.proj.transform(view.getCenter(), view.getProjection(), this.get('projection')),
		zoom: Math.round( view.getZoom() *100)/100,
		rotation: Math.round( view.getRotation() *100)/100
	};
}

ol.control.ShareMap.prototype.setState = function(state) {
	var state = state || {};
	var view = this.getMap().getView();
    view.setCenter( ol.proj.transform(state.center, this.get('projection'), view.getProjection()) );
	view.setZoom(state.zoom);
	view.setRotation(state.rotation);
}/**
 * @classdesc
 * A select control which, when changed, render the map view to a specific
 * projection. To style this control use the css selector `.ol-projection`.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.ZoomHistory = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-navhist ol-unselectable ol-control';
    
    var backButton = document.createElement('button');
    backButton.className = options.backClassName || 'ol-navhist-back';
    backButton.textContent = options.backLabel || '';
    backButton.title = options.backTipLabel || 'Previous view';
    backButton.addEventListener('click', function(evt) {
        var history = _this.get('history');
        var index = _this.get('index');
        if (index > 0) {
            _this.setProperties({
                shouldSave: false,
                index: index - 1
            });
            _this.getMap().getView().setProperties(history[index - 1]);
        }
    });
    backButton.disabled = true;
    controlDiv.appendChild(backButton);
    
    var nextButton = document.createElement('button');
    nextButton.className = options.nextClassName || 'ol-navhist-next';
    nextButton.textContent = options.nextLabel || '';
    nextButton.title = options.nextTipLabel || 'Next view';
    nextButton.addEventListener('click', function(evt) {
        var history = _this.get('history');
        var index = _this.get('index');
        if (index < history.length - 1) {
            _this.setProperties({
                shouldSave: false,
                index: index + 1
            });
            _this.getMap().getView().setProperties(history[index + 1]);
        }
    });
    nextButton.disabled = true;
    controlDiv.appendChild(nextButton);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.setProperties({
        history: [],
        index: -1,
        maxSize: options.maxSize || 50,
        eventId: null,
        shouldSave: true
    });
    
    this.on('change:index', function () {
        if (this.get('index') === 0) {
            backButton.disabled = true;
        } else {
            backButton.disabled = false;
        }
        if (this.get('history').length - 1 === this.get('index')) {
            nextButton.disabled = true;
        } else {
            nextButton.disabled = false;
        }
    });
};
ol.inherits(ol.control.ZoomHistory, ol.control.Control);


ol.control.ZoomHistory.prototype.setMap = function(map) {
    
    ol.control.Control.prototype.setMap.call(this, map);
    
    if (map === null) {
        ol.Observable.unByKey(this.get('eventId'));
    } else {
        this.set('eventId', map.on('moveend', function (evt) {
            if (this.get('shouldSave')) {
                var history = this.get('history');
                var index = this.get('index');
                history.splice(index + 1, history.length - index - 1);
                if (history.length === this.get('maxSize')) {
                    history.splice(0, 1);
                } else {
                    index += 1;
                }
                history.push(map.getView().getProperties());
                this.set('index', index);
            } else {
                this.set('shouldSave', true);
            }
        }, this));
    }
};
/**
 * @classdesc
 * A button control which, when pressed, changes the map view to a specific
 * extent. This extent calculated from the extentFunction option.
 * The extentFunction returns with ol.geom.SimpleGeometry / ol.Extent.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.ZoomTo = function(opt_options) {
    
    var options = opt_options || {};
    var _this = this;
    
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-unselectable ol-control';
    
    var controlButton = document.createElement('button');
    controlButton.textContent = options.label || '';
    controlButton.title = options.tipLabel || 'Zoom to extent';
    controlButton.addEventListener('click', function(evt) {
        var map = _this.getMap();
        var zoomCandidate = _this.get('extentFunction')();
        if (zoomCandidate instanceof ol.geom.SimpleGeometry || 
            (Object.prototype.toString.call(zoomCandidate) === '[object Array]'
            && zoomCandidate.length === 4)
        ) {
            map.getView().fit(zoomCandidate, map.getSize());
        }
    });
    
    controlDiv.appendChild(controlButton);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.set('extentFunction', options.extentFunction);
};
ol.inherits(ol.control.ZoomTo, ol.control.Control);/**
 * @classdesc
 * The Editor is the core component of OL3ditor.
 * This is very similar to the Map object, but has a few extra
 * methods and properties.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {olx.MapOptions} options Map options.
 * @fires ol.MapBrowserEvent
 * @fires ol.MapEvent
 * @fires ol.render.Event#postcompose
 * @fires ol.render.Event#precompose
 * @api stable
 */
ol.Editor = function(options) {
    var options = options || {};
    var attributeManager_, layerManager_;
    
    this.selectedFeatures = (options.selectedFeatures
        && options.selectedFeatures instanceof ol.Collection)
        ? options.selectedFeatures : new ol.Collection();
    
    this.getLayerManager = function() {
        if (layerManager_ === undefined) {
            layerManager_ = null;
        }
        return layerManager_;
    };
    
    this.setLayerManager = function(object) {
        if (object instanceof ol.control.LayerManager) {
            layerManager_ = object;
        }
        return layerManager_;
    };
    
    this.getAttributeManager = function() {
        if (attributeManager_ === undefined) {
            attributeManager_ = null;
        }
        return attributeManager_;
    };
    
    this.setAttributeManager = function(object) {
        if (object instanceof ol.control.AttributeManager) {
            attributeManager_ = object;
        }
        return attributeManager_;
    };
    
    this.sendMessage = function(text) {
        var success = false;
        this.getControls().forEach( function(control) {
            if (control instanceof ol.control.Message) {
                control.element.textContent = text;
                success = true;
            }
        }, this);
        if (!success) {
            console.log(text);
        }
    };

    ol.Map.call(this, options);
};
ol.inherits(ol.Editor, ol.Map);

/**
 * Add the given control to the editor.
 * @param {ol.control.Control} control Control.
 * @api stable
 */
ol.Editor.prototype.addControl = function(control) {
    ol.Map.prototype.addControl.call(this, control);
    /*
    if (control instanceof ol.control.LayerManager) {
        this.setLayerManager(control);
    }
    if (control instanceof ol.control.AttributeManager) {
        this.setAttributeManager(control);
    }
    */
};