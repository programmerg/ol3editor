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
