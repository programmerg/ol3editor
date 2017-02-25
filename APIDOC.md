# [![OLEditor](res/logo.png "OLEditor")](http://github.com/programmerg/ol3editor)
_Desktop-like UI for the OpenLayers 3+ web mapping library._

## API documentation

Class | Options and methods
----- | --------------------
ol.Editor<br><sub>_extends ol.Map_</sub> | selectedFeatures: `ol.Collection`<br><br> `ol.control.LayerManager` getLayerManager(),<br> `null` setLayerManager(`ol.control.LayerManager`),<br> `ol.control.AttributeManager` getAttributeManager(),<br> `null` setAttributeManager(`ol.control.AttributeManager`),<br> `null` sendMessage(`String`) 
ol.control.AttributeManager<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> ... 
ol.control.EditingControls<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> drawpoint: `ol.control.Interaction`,<br> drawline: `ol.control.Interaction`,<br> drawPolygon: `ol.control.Interaction`,<br> dragFeature: `ol.control.Interaction`,<br> modifyFeature: `ol.control.Interaction`,<br> removeFeature: `ol.control.Interaction`<br><br>_and each has #Label, #TipLabel, #ClassName and #Interaction_
ol.control.Geolocate<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> label: `String`,<br> tipLabel: `String`,<br> active: `bool`,<br> accuracyFeature: `ol.Feature`,<br> positionFeature: `ol.Feature`,<br> positionStyle: `ol.style.Style`,<br> featuresOverlay: `ol.layer.Vector`
ol.control.Interaction<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> label: `String`,<br> tipLabel: `String`,<br> singleButton: `bool`,<br> active: `bool`,<br> type: `String:toggle`,<br> interaction: `ol.interaction.Interaction`,<br> destroyFunction: `function(evt)`
ol.control.LayerControls<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> #ClassName: `String`,<br> #Label: `String`,<br> #TipLabel: `String`<br><br>_# can be addVector, addRaster, createVector and deleteLayer_
ol.control.LayerManager<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> ... 
ol.control.Message<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> label: `String`,<br> tipLabel: `String`,<br> timeout: `int`
ol.control.Print<br><sub>_extends ol.control.Control_ </sub>| target: `DOM element`,<br> className: `String`,<br> label: `String`,<br> tipLabel: `String`
ol.control.Projection<br><sub>_extends ol.control.Control_</sub><br>_require Proj4.js_ | target: `DOM element`,<br> className: `String`,<br> tipLabel: `String`,<br> projections: `ol.ProjectionLike Array`<br><br> `null` addProjection(`ol.ProjectionLike`),<br> `null` changeLayerProjection(layer: `ol.layer.Group`, oldproj: `ol.ProjectionLike`, newproj: `ol.ProjectionLike`)
ol.control.Rotation<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> tipLabel: `String`
ol.control.SelectionControls<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> selectedFeatures: `ol.Collection`,<br> selectSingle: `ol.control.Interaction`,<br> selectMulti: `ol.control.Interaction`,<br> remove: `ol.control.Interaction`,<br><br> _and each has #Label, #TipLabel and #Interaction_
ol.control.ShareMap<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> label: `String`,<br> tipLabel: `String`,<br> precision: `int`,<br> autoUpdate: `bool`,<br> projection: `ol.ProjectionLike` | `{center, zoom, rotation}` getState(),<br> `null` setState(`{center, zoom, rotation}`) 
ol.control.ZoomHistory<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> #ClassName: `String`,<br> #Label: `String`,<br> #TipLabel: `String`,<br> maxSize: `int` <br><br>_# can be next and back_
ol.control.ZoomTo<br><sub>_extends ol.control.Control_</sub> | target: `DOM element`,<br> className: `String`,<br> label: `String`,<br> tipLabel: `String`,<br> extentFunction: `function`
ol.control.ZoomToLayer<br><sub>_extends ol.control.ZoomTo_</sub> | target: `DOM element`,<br> className: `String`,<br> label: `String`,<br> tipLabel: `String`
ol.control.ZoomToSelection<br><sub>_extends ol.control.ZoomTo_</sub> | target: `DOM element`,<br> className: `String`,<br> label: `String`,<br> tipLabel: `String`
ol.interaction.SelectBox<br><sub>_extends ol.interaction.DragBox_</sub> | features:  `ol.Collection`,<br> layers:  `ol.layer.Group`,<br> styleFunc: `function(startpx, endpx)`
