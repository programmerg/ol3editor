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
ol.inherits(ol.control.Geolocate, ol.control.Control);