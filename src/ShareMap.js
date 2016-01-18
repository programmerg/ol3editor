/**
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
}