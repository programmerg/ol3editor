/**
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
