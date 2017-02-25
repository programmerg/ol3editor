/**
 * @name OLEditor
 * @version 0.12
 * @description Desktop-like UI for the OpenLayers 3+ web mapping library.
 * @author Gergő Gelencsér (http://github.com/programmerg)
 * @license Code licensed under the 2-Clause BSD (https://github.com/programmerg/ol3ditor/LICENSE.md)
 * @tutorial https://github.com/programmerg/ol3ditor/
 */

/**
 * @classdesc
 * Button controls which, when pressed, handles specific selection methods.
 * To style this control use the css selector `.ol-attributemanager`.
 *
 * @requires ol.Editor
 * @requires ol.control.Interaction
 *
 * @constructor
 * @extends {ol.control.Control}
 * @param {olx.control.ControlOptions} options Control options.
 */
ol.control.AttributeManager = function(opt_options) {
   
    var options = opt_options || {};
    var _this = this;
  
    var controlDiv = document.createElement('div');
    controlDiv.className = options.className || 'ol-attributemanager';

    var layerContainer = document.createElement('div');
    layerContainer.className = 'ol-attributecontainer';
    controlDiv.appendChild(layerContainer);
    
    ol.control.Control.call(this, {
        element: controlDiv,
        target: options.target
    });
    
    this.setProperties({
        element: controlDiv
    });
};
ol.inherits(ol.control.AttributeManager, ol.control.Control);

ol.control.AttributeManager.prototype.setMap = function(map) {
    ol.control.Control.prototype.setMap.call(this, map);
    if (map === null) {
        ol.Observable.unByKey(this.get('chgEventId'));
    } else {
        this.set('chgEventId', map.getLayerManager().on('change:selected', function () {
            var layer = map.getLayerManager().getSelectedLayer();
            var element = this.get('element');
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            if (layer instanceof ol.layer.Vector) {
                element.appendChild( this.createTable(layer, map) );
            }
        }, this));
    }
};

ol.control.AttributeManager.prototype.createTable = function (layer, map) {
    var headers = [];
    var features = layer.getSource().getFeatures();
    var table = document.createElement('table');
    table.className = 'table table-striped table-collapsed';
  
    var thead = document.createElement('thead');
    var tr = document.createElement('tr');
    for (var i = 0; i < features.length; i++) {
        var attributes = features[i].getProperties();
        for (var j in attributes) {
            if (typeof attributes[j] !== 'object' && headers.indexOf(j) == -1) {
                headers.push(j);
                var th = document.createElement('th');
                th.appendChild(document.createTextNode(j));
                tr.appendChild(th);
            }
        }
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  
    var tbody = document.createElement('tbody');
    for (var i = 0; i < features.length; i++) {
        var tr = document.createElement('tr');
        tr.setAttribute('data-id', features[i].getId());
        var attributes = features[i].getProperties();
        for (var j in headers) {
            var td = document.createElement('td');
            if (attributes[headers[j]]) {
                td.appendChild(document.createTextNode(attributes[headers[j]]));
            } else {
                td.appendChild(document.createTextNode('\u0020'));
            }
            td.addEventListener('click', function(evt){
                var tr = evt.target.parentNode;
                var trs = tr.parentNode.childNodes;
                for (var t in trs) {
                    if (trs[t].classList !== undefined){
                        trs[t].classList.remove('selected');
                    }
                }
                tr.classList.add('selected');
              
                if (map instanceof ol.Editor) {
                    var id = tr.getAttribute('data-id');
                    var feature = layer.getSource().getFeatureById(id);
                    map.selectedFeatures.clear();
                    map.selectedFeatures.push(feature);
                }
                this.contentEditable = true;
                this.focus();
            });
            td.addEventListener('blur', function (evt) {
                var tr = evt.target.parentNode;
                if (this.contentEditable) {
                    this.contentEditable = false;
                    if (map instanceof ol.Editor) {
                        var id = tr.getAttribute('data-id');
                        var feature = layer.getSource().getFeatureById(id);
                        var prop = [];
                        prop[headers[j]] = this.childNodes[0];
                        feature.setProperties(prop);
                    }
                }
            });
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
  
    return table;
};
