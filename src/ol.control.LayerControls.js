/**
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
