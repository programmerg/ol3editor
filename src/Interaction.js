/**
 * @classdesc
 * A button control wich, when pressed, sets the state of
 * interaction to active or inactive.
 * When the type of control is 'toggle', on state change,
 * all the same type control will be switched off.
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.Interaction = function(opt_options) {
    var _this = this;
    var options = opt_options || {};
    var interaction = options.interaction;

    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-unselectable ol-control';

    var controlButton = document.createElement('button');
    controlButton.textContent = options.label || 'I';
    controlButton.title = options.tipLabel || 'Custom interaction';
    controlButton.addEventListener('click', function() {
        if (_this.get('interaction').getActive()) {
            _this.set('active', false);
        } else {
            _this.set('active', true);
        }
    });
    
    if (options.singleButton && options.singleButton === true) {
        controlButton.className = options.className || '';
        controlDiv = controlButton;
    } else {
        controlDiv.appendChild(controlButton);
    }
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.setProperties({
        interaction: interaction,
        active: false,
        type: 'toggle',
        destroyFunction: function(evt) {
            if (evt.element === _this) {
                this.removeInteraction(_this.get('interaction'));
            }
        }
    });
    
    this.setDisabled = function(bool) {
        if (typeof bool === 'boolean') {
            controlButton.disabled = bool;
            return this;
        }
    };
    
    this.on('change:active', function () {
        this.get('interaction').setActive(this.get('active'));
        if (this.get('active')) {
            controlButton.classList.add('active');
            _this.getMap().getControls().forEach(function(control) {
                if (control.get('type') === 'toggle' && control !== _this) {
                    control.set('active', false);
                }
            });
        } else {
            controlButton.classList.remove('active');
        }
    }, this);
};
ol.inherits(ol.control.Interaction, ol.control.Control);

ol.control.Interaction.prototype.setMap = function (map) {
    ol.control.Control.prototype.setMap.call(this, map);
    var interaction = this.get('interaction');
    if (map === null) {
        ol.Observable.unByKey(this.get('eventId'));
    } else if (map.getInteractions().getArray().indexOf(interaction) === -1) {
        map.addInteraction(interaction);
        interaction.setActive(false);
        this.set('eventId', map.getControls().on('remove', this.get('destroyFunction'), map));
    }
};