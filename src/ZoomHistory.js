/**
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
