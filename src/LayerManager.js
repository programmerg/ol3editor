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
    layerContainer.className = 'layercontainer';
    controlDiv.appendChild(layerContainer);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    this.setProperties({
        'element': layerContainer,
        'snap': options.snap || new ol.interaction.Snap();
    });

    this.snap = this.get('snap');
    this.layerContainer = this.get('element');
    this.selectedLayer = null;
    this.selectEventEmitter = new ol.Observable();
};
ol.inherits(ol.control.LayerManager, ol.control.Control);

ol.control.LayerManager.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    if (map !== null) {
        map.setLayerManager(this); // register global
        
        var idCounter = 0;
        this.map = map;
		
        map.getLayers().forEach(function (element, index) {
			this.createRegistry(element);
		}, this);
        
        map.getLayers().on('add', function (evt) {
            if (evt.element instanceof ol.layer.Vector) {
                this.createRegistry(evt.element, true);
            } else {
                this.createRegistry(evt.element);
            }
        }, this);
        
        map.getLayers().on('remove', function (evt) {
            this.removeRegistry(evt.element);
            this.selectEventEmitter.changed();
        }, this);
        
        // listen for drag'n'drop events
		this.dragAndDropLayer();
    }
};

ol.control.LayerManager.prototype.createRegistry = function (layer, buffer) {
    var _this = this;
    
    layer.set('id', 'layer_' + idCounter);
    idCounter += 1;
    
    var layerDiv = document.createElement('div');
    layerDiv.className = buffer ? 'layer ol-unselectable buffering' : 'layer ol-unselectable';
    layerDiv.title = layer.get('name') || 'Unnamed Layer';
    layerDiv.id = layer.get('id');
    this.addSelectEvent(layerDiv);
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
            _this.layerContainer.removeChild(sourceLayerDiv);
            _this.layerContainer.insertBefore(sourceLayerDiv, this);
            var htmlArray = [].slice.call(_this.layerContainer.children);
            var index = htmlArray.length - htmlArray.indexOf(sourceLayerDiv) - 1;
            var sourceLayer = _this.getLayerById(sourceLayerDiv.id);
            var layers = _this.map.getLayers().getArray();
            layers.splice(layers.indexOf(sourceLayer), 1);
            layers.splice(index, 0, sourceLayer);
            _this.map.render();
            _this.map.getLayers().changed();
        }
    });
    
    var layerSpan = document.createElement('span');
    layerSpan.className = 'ol-layermanager-title';
    layerSpan.textContent = layerDiv.title;
    layerDiv.appendChild(this.addSelectEvent(layerSpan, true));
    layerSpan.addEventListener('dblclick', function () {
        this.contentEditable = true;
        layerDiv.draggable = false;
        layerDiv.classList.remove('ol-unselectable');
        this.focus();
    });
    layerSpan.addEventListener('blur', function () {
        if (this.contentEditable) {
            this.contentEditable = false;
            layerDiv.draggable = true;
            layer.set('name', this.textContent);
            layerDiv.classList.add('ol-unselectable');
            layerDiv.title = this.textContent;
        }
    });
    
    var visibleBox = document.createElement('input');
    visibleBox.type = 'checkbox';
    visibleBox.className = 'visible';
    visibleBox.checked = layer.getVisible();
    visibleBox.addEventListener('change', function () {
        if (this.checked) {
            layer.setVisible(true);
        } else {
            layer.setVisible(false);
        }
    });
    layerDiv.appendChild(this.stopPropagationOnEvent(visibleBox, 'click'));
    
    var layerControls = document.createElement('div');
    layerControls.className = 'ol-layermanager-controls';
    this.addSelectEvent(layerControls, true);
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
    layerControls.appendChild(this.stopPropagationOnEvent(opacityHandler, 'click'));
    
    if (layer instanceof ol.layer.Vector) {
        layerControls.appendChild(document.createElement('br'));
        var attributeOptions = document.createElement('select');
        layerControls.appendChild(this.stopPropagationOnEvent(attributeOptions, 'click'));
        layerControls.appendChild(document.createElement('br'));
        
        var defaultStyle = document.createElement('button');
        defaultStyle.title = 'Default';
        defaultStyle.className = 'ol-layermanager-default';
        defaultStyle.textContent = 'Default';
        defaultStyle.addEventListener('click', function () {
            layer.setStyle(layer.get('style'));
        });
        layerControls.appendChild(this.stopPropagationOnEvent(defaultStyle, 'click'));
        
        var graduatedStyle = document.createElement('button');
        graduatedStyle.title = 'Graduated';
        graduatedStyle.className = 'ol-layermanager-graduated';
        graduatedStyle.textContent = 'Graduated';
        graduatedStyle.addEventListener('click', function () {
            var attribute = graduatedStyle.parentNode.querySelector('select').value;
            _this.styleGraduated.call(_this, layer, attribute);
        });
        layerControls.appendChild(this.stopPropagationOnEvent(graduatedStyle, 'click'));
        
        var categorizedStyle = document.createElement('button');
        categorizedStyle.title = 'Categorized';
        categorizedStyle.className = 'ol-layermanager-categorized';
        categorizedStyle.textContent = 'Categorized';
        categorizedStyle.addEventListener('click', function () {
            var attribute = categorizedStyle.parentNode.querySelector('select').value;
            _this.styleCategorized.call(_this, layer, attribute);
        });
        layerControls.appendChild(this.stopPropagationOnEvent(categorizedStyle, 'click'));
        
        layer.set('style', layer.getStyle());
        layer.on('propertychange', function (evt) {
            if (evt.key === 'headers') {
                this.removeContent(attributeOptions);
                var headers = layer.get('headers');
                for (var i in headers) {
                    attributeOptions.appendChild(this.createOption(i));
                }
            }
        }, this);
    }
    layerDiv.appendChild(layerControls);
    this.layerContainer.insertBefore(layerDiv, this.layerContainer.firstChild);
    return this;
};

ol.control.LayerManager.prototype.addBufferIcon = function (layer) {
    layer.getSource().on('change', function (evt) {
        var layerElem = document.getElementById(layer.get('id'));
        switch (evt.target.getState()) {
            case 'ready':
                layerElem.className = layerElem.className.replace(/(?:^|\s)(error|buffering)(?!\S)/g, '');
                break;
            case 'error':
                layerElem.className += ' error'
                break;
            default:
                layerElem.className += ' buffering';
                break;
        }
    });
};

ol.control.LayerManager.prototype.removeContent = function (element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
    return this;
};

ol.control.LayerManager.prototype.createOption = function (optionValue) {
    var option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    return option;
};

ol.control.LayerManager.prototype.checkWmsLayer = function (form) {
    form.check.disabled = true;
    var _this = this;
    this.removeContent(form.layer).removeContent(form.format);
    var url = form.server.value;
    url = /^((http)|(https))(:\/\/)/.test(url) ? url : 'http://' + url;
    form.server.value = url;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
            var parser = new ol.format.WMSCapabilities();
            try {
                var capabilities = parser.read(request.responseText);
                var currentProj = _this.map.getView().getProjection().getCode();
                var crs;
                var messageText = 'Layers read successfully.';
                if (capabilities.version === '1.3.0') {
                    crs = capabilities.Capability.Layer.CRS;
                } else {
                    crs = [currentProj];
                    messageText += ' Warning! Projection compatibility could not be checked due to version mismatch (' + capabilities.version + ').';
                }
                var layers = capabilities.Capability.Layer.Layer;
                if (layers.length > 0 && crs.indexOf(currentProj) > -1) {
                    for (var i = 0; i < layers.length; i += 1) {
                        form.layer.appendChild(_this.createOption(layers[i].Name));
                    }
                    var formats = capabilities.Capability.Request.GetMap.Format;
                    for (i = 0; i < formats.length; i += 1) {
                        form.format.appendChild(_this.createOption(formats[i]));
                    }
                    _this.map.sendMessage(messageText);
                }
            } catch (error) {
                _this.map.sendMessage('Some unexpected error occurred: (' + error.message + ').');
            } finally {
                form.check.disabled = false;
            }
        } else if (request.status > 200) {
            form.check.disabled = false;
        }
    };
    url = /\?/.test(url) ? url + '&' : url + '?';
    url = url + 'REQUEST=GetCapabilities&SERVICE=WMS';
    //request.open('GET', '../../../cgi-bin/proxy.py?' + encodeURIComponent(url), true);
    request.open('GET', url, true);
    request.send();
};

ol.control.LayerManager.prototype.addRasterLayer = function (form)
{
	var layer;
	var name = form.displayname.value;
	var format = form.format.value;
	var file = form.file.files[0];
	var url = form.server.value;
	var typeName = form.layer.value;
	var projection = form.projection.value;
	var currentProj = this.map.getView().getProjection();
	var tiled = form.tiled.checked;
	var sourceFormat;
	switch (format) {
		case 'wms':
			var params = {
				url: url,
				params: { layers: typeName, format: format }, // version, width, height, bbox, crs, 
				//serverType: 'geoserver',
				//tileGrid: tiled ? ol.tilegrid.createXYZ({ maxZoom: 19, tileSize: [256, 256] }) : null
			};
			sourceFormat = tiled ? new ol.source.TileWMS(params) : new ol.source.ImageWMS(params);
			break;
		case 'bing':
			sourceFormat = new ol.source.BingMaps({
				key: 'Key from http://bingmapsportal.com/',
				imagerySet: 'Road,Aerial,AerialWithLabels,collinsBart,ordnanceSurvey'
			});
			break;
		case 'mapquest':
			sourceFormat = new ol.source.MapQuest({layer: 'sat'}); // osm, hyb
			break;
		case 'osm':
			sourceFormat = new ol.source.OSM();
			break;
		case 'tifw':
			sourceFormat = new ol.format.ImageStatic({imageExtent: [], imageSize: [], url: '', projection: projection || currentProj});
			break;
		case 'jpw':
			sourceFormat = new ol.format.ImageStatic({imageExtent: [], imageSize: [], url: '', projection: projection || currentProj});
			break;
		default:
			return false;
	}
	
	if (tiled) {
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
	this.map.addLayer(layer);
	return this;
};


ol.control.LayerManager.prototype.addVectorLayer = function (form)
{
	var layer;
	var name = form.displayname.value;
	var format = form.format.value;
	var file = form.file.files[0];
	var url = form.server.value;
	var typeName = form.layer.value;
	var projection = form.projection.value;
	var currentProj = this.map.getView().getProjection();
	var tiled = form.tiled.checked;
	var sourceFormat;
	switch (format) {
		case 'wfs':
			sourceFormat = new ol.format.WFS();
			break;
		case 'esrijson':
			sourceFormat = new ol.format.EsriJSON(); // { defaultDataProjection: projection, geometryName: 'geom' }
			break;
		case 'geojson':
			sourceFormat = new ol.format.GeoJSON();
			break;
		case 'topojson':
			sourceFormat = new ol.format.TopoJSON();
			break;
		case 'gpx':
			sourceFormat = new ol.format.GPX();
			break;
		case 'igc':
			sourceFormat = new ol.format.IGC();
			break;
		case 'kml':
			sourceFormat = new ol.format.KML();
			break;
		case 'mvt':
			sourceFormat = new ol.format.MVT();
			break;
		case 'osm':
			sourceFormat = new ol.format.OSMXML();
			break;
		case 'wkt':
			sourceFormat = new ol.format.WKT();
			break;
		default:
			return false;
	}
	
	layer = new ol.layer.Vector({
		name: name,
		source: new ol.source.Vector({
			//format: sourceFormat,
			strategy: ol.loadingstrategy.bbox
			//loader: function(extent, resolution, proj) {},
			//strategy: tiled ? ol.loadingstrategy.bbox : ol.loadingstrategy.tile(ol.tilegrid.createXYZ({ maxZoom: 19, tileSize: [256, 256] })),
			//url: tiled ? function(extent, resolution, proj) {
			//	return url + '&bbox=' + extent.join(',') + ',' + projection;
			//} : null
		})
	});
	
	if (format == 'wfs') {
		var dataProjection = projection || currentProj;
		url = /^((http)|(https))(:\/\/)/.test(url) ? url : 'http://' + url;
		url = /\?/.test(url) ? url + '&' : url + '?';
		url = url + 'SERVICE=WFS&REQUEST=GetFeature&TYPENAME=' + typeName + '&VERSION=1.1.0&SRSNAME=' + dataProjection;
		var request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (request.readyState === 4 && request.status === 200) {
				layer.getSource().addFeatures(sourceFormat.readFeatures(request.responseText, {
					dataProjection: dataProjection,
					featureProjection: currentProj
				}));
			}
		};
		request.open('GET', url);
		request.send();
		this.addBufferIcon(layer);
		this.map.addLayer(layer);
		return this;
	} else {
		try {
			var fr = new FileReader();
			fr.onload = function (evt) {
				var vectorData = evt.target.result;
				var dataProjection = projection || sourceFormat.readProjection(vectorData) || currentProj;
				layer.getSource().addFeatures(sourceFormat.readFeatures(vectorData, {
					dataProjection: dataProjection,
					featureProjection: currentProj
				}));
			};
			fr.readAsText(file);
			this.addBufferIcon(layer);
			this.map.addLayer(layer);
			return this;
		} catch (error) {
			this.map.sendMessage('Some unexpected error occurred: (' + error.message + ').');
			return error;
		}	
	}
};

ol.control.LayerManager.prototype.dragAndDropLayer = function ()
{
	var layer;
	var currentProj = this.map.getView().getProjection();
	var name = 'Dropped Vector';
	var dragAndDropInteraction = new ol.interaction.DragAndDrop({
        formatConstructors: [
          ol.format.EsriJSON,
          ol.format.GeoJSON,
          ol.format.TopoJSON,
          ol.format.GPX,
          ol.format.IGC,
          ol.format.KML,
		  ol.format.MVT,
		  ol.format.OSMXML,
		  ol.format.WKT
        ],
		projection: currentProj
    });
	dragAndDropInteraction.on('addfeatures', function(event) {
        layer = new ol.layer.Vector({
		  name: name,
          source: new ol.source.Vector({
			features: event.features
		  })
        });
		this.addBufferIcon(layer);
		this.map.addLayer(layer);
        //this.map.getView().fit( layer.getSource().getExtent(), this.map.getSize() );
		return this;
    });
	return false;
};

ol.control.LayerManager.prototype.addSelectEvent = function (node, isChild) {
    var _this = this;
    node.addEventListener('click', function (evt) {
        var targetNode = evt.target;
        if (isChild) {
            evt.stopPropagation();
            targetNode = targetNode.parentNode;
        }
        if (_this.selectedLayer) {
            _this.selectedLayer.classList.remove('active');
        }
        _this.selectedLayer = targetNode;
        targetNode.classList.add('active');
        _this.selectEventEmitter.changed();
    });
    return node;
};

ol.control.LayerManager.prototype.removeRegistry = function (layer) {
    var layerDiv = document.getElementById(layer.get('id'));
    this.layerContainer.removeChild(layerDiv);
    return this;
};

ol.control.LayerManager.prototype.getLayerById = function (id) {
    var layers = this.map.getLayers().getArray();
    for (var i = 0; i < layers.length; i += 1) {
        if (layers[i].get('id') === id) {
            return layers[i];
        }
    }
    return false;
};

ol.control.LayerManager.prototype.stopPropagationOnEvent = function (node, event) {
    node.addEventListener(event, function (evt) {
        evt.stopPropagation();
    });
    return node;
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
        this.map.sendMessage('A numeric column is required for graduated symbology.');
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
                randomColor = this.randomHexColor();
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

ol.control.LayerManager.prototype.randomHexColor = function() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
};


ol.control.LayerManager.prototype.newVectorLayer = function (form) {
    var type = form.type.value;
    if (type !== 'point' && type !== 'line' && type !== 'polygon' && type !== 'geomcollection') {
        this.map.sendMessage('Unrecognized layer type.');
        return false;
    }
    var layer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        name: form.displayname.value || 'Unnamed Layer',
        type: type
    });
    this.addBufferIcon(layer);
    this.map.addLayer(layer);
    layer.getSource().changed();
    return this;
};