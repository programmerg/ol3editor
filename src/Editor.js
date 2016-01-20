/**
 * @classdesc
 * The Editor is the core component of OL3ditor.
 * This is very similar to the Map object, but has a few extra
 * methods and properties.
 *
 * @constructor
 * @extends {ol.Object}
 * @param {olx.MapOptions} options Map options.
 * @fires ol.MapBrowserEvent
 * @fires ol.MapEvent
 * @fires ol.render.Event#postcompose
 * @fires ol.render.Event#precompose
 * @api stable
 */
ol.Editor = function(options) {
    var options = options || {};
    var attributeManager_, layerManager_;
    
    this.selectedFeatures = (options.selectedFeatures
        && options.selectedFeatures instanceof ol.Collection)
        ? options.selectedFeatures : new ol.Collection();
    
    this.getLayerManager = function() {
        if (layerManager_ === undefined) {
            layerManager_ = null;
        }
        return layerManager_;
    };
    
    this.setLayerManager = function(object) {
        if (object instanceof ol.control.LayerManager) {
            layerManager_ = object;
        }
        return layerManager_;
    };
    
    this.getAttributeManager = function() {
        if (attributeManager_ === undefined) {
            attributeManager_ = null;
        }
        return attributeManager_;
    };
    
    this.setAttributeManager = function(object) {
        if (object instanceof ol.control.AttributeManager) {
            attributeManager_ = object;
        }
        return attributeManager_;
    };
    
    this.sendMessage = function(text) {
        var success = false;
        this.getControls().forEach( function(control) {
            if (control instanceof ol.control.Message) {
                control.element.textContent = text;
                success = true;
            }
        }, this);
        if (!success) {
            console.log(text);
        }
    };

    ol.Map.call(this, options);
};
ol.inherits(ol.Editor, ol.Map);

/**
 * Add the given control to the editor.
 * @param {ol.control.Control} control Control.
 * @api stable
 */
ol.Editor.prototype.addControl = function(control) {
    ol.Map.prototype.addControl.call(this, control);
    /*
    if (control instanceof ol.control.LayerManager) {
        this.setLayerManager(control);
    }
    if (control instanceof ol.control.AttributeManager) {
        this.setAttributeManager(control);
    }
    */
};