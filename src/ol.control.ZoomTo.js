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
ol.inherits(ol.control.ZoomTo, ol.control.Control);