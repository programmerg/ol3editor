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
    }
    layerDiv.appendChild(layerStyleDiv);
    this.get('element').insertBefore(layerDiv, this.get('element').firstChild);
    
    if (layer instanceof ol.layer.Vector) {
        layer.buildHeaders();
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
};