# [![OLEditor](res/logo.png "OLEditor")](http://github.com/programmerg/ol3editor)
_Desktop-like UI for the OpenLayers 3+ web mapping library._

Try the [online demo](http://programmerg.github.io/ol3editor)!

## License
This project is licensed under the 2-Clause BSD. This means you can use and modify it for free in private or commercial projects so long as you include the BSD [copyright notice](LICENSE) in it.

## Getting Started
- Download the [latest stable release](http://github.com/programmerg/ol3editor/archive/master.zip)
- Unpack the `dist` folder to your project directory
- Create a new `index.html` file, and copy in the contents below
- Finally, open it in your favorite browser!

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>OLEditor - quick start example</title>
    <!-- 1. include stylesheets in the header -->
    <link rel="stylesheet" href="//openlayers.org/en/master/css/ol.css">
    <link rel="stylesheet" href="ol.editor.css">
  </head>
  <body>
    <!-- 2. place a map container somewhere in your document's body -->
    <div id="map" class="map"></div>
    
    <!-- 3. include the javascript librarys in the bottom of your document -->
    <script src="http://openlayers.org/en/master/build/ol.js"></script>
    <script src="ol.editor.js"></script>
    <script>// and create the editor just like ol.Map
      var editor = new ol.Editor({
        target: 'map', // the ID of map container
        controls: [    // the available controls
          new ol.control.Zoom(),
          new ol.control.ScaleLine(),
          new ol.control.Attribution(),
          // ... and the cool new controls
          new ol.control.LayerManager(),
          new ol.control.LayerControls(),
          new ol.control.SelectionControls(),
          new ol.control.EditingControls(),
          new ol.control.Message(),
          new ol.control.Projection()
        ],
        layers: [ // add some layers
          new ol.layer.Tile({
            name: 'OpenStreetMap',
            source: new ol.source.OSM()
          }) //, ...
        ],
        view: new ol.View({ // set the view settings
          center: ol.proj.fromLonLat([37.41, 8.82]),
          zoom: 4
        })
      });
      // be happy! :)
    </script>
  </body>
</html>
```

## Documentation
See the quick summary [here](APIDOC.md) or check out the source files in the `src` folder.

The original OpenLayers documentation can be found [here](http://openlayers.org/en/master/apidoc/), and a lot of examples can be found [here](http://openlayers.org/en/master/examples/).

## Bugs & features
Please use the [GitHub issue tracker](https://github.com/programmerg/ol3ditor/issues) for all bugs and feature requests.

## Contributing
The develop branch holds the in-development version and the master branch holds the tested and stable version. If you're intrested in getting involved, make a GitHub account and send me pull requests.

## Support
I prefer beer.
