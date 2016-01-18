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
ol.inherits(ol.control.Print, ol.control.Control);