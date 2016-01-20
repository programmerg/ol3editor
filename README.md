# [![OL3ditor](res/logo.png "OL3ditor")](http://github.com/programmerg/ol3ditor)
_Desktop-like functionalities for the OpenLayers 3 web mapping library._

Try the [online demo](http://programmerg.github.io/ol3ditor)!

## License
This project is licensed under the 2-Clause BSD. This means you can use and modify it for free in private or commercial projects so long as you include the BSD [copyright notice](LICENSE) in it.

## Getting Started
- Download the [latest stable release](http://github.com/programmerg/ol3ditor/archive/master.zip)
- Unpack the `dist` folder to your project directory
- Create a new `index.html` file, and copy in the contents below
- Finally, open it in your favorite browser!

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>OL3ditor minimalist example</title>
    <!-- include the OpenLayers and OL3editor stylesheets in the header -->
    <link href="http://openlayers.org/en/v3.12.1/css/ol.css" rel="stylesheet">
    <link href="ol3ditor.css" rel="stylesheet">
  </head>
  <body>
    <!-- place a map container somewhere in your document's body -->
    <div id="map" class="map"></div>
    ...
    <!-- include the OpenLayers and OL3editor javascript librarys
    in the bottom of your document, and finally, initialize the Editor -->
    <script src="http://openlayers.org/en/v3.12.1/build/ol.js"></script>
    <script src="ol3ditor.js"></script>
    <script>
      var editor = new ol.Editor({
        target: 'map', // this is the ID of map container element
        view: new ol.View({ // some user defined view settings
          projection: 'EPSG:3857',
          center: ol.proj.fromLonLat([37.41, 8.82]),
          zoom: 4
        }),
        layers: [ // this array is used to define the list of layers available
          new ol.layer.Tile({
            name: 'MapQuest layer',
            source: new ol.source.MapQuest({layer: 'sat'})
          }) //, ...
        ],
        controls: [ // define here the available controls
          new ol.control.Zoom(),
          new ol.control.ScaleLine(),
          new ol.control.Attribution(),
          // ... and the new Editor controls
          new ol.control.LayerManager(),
          new ol.control.LayerControls(),
          new ol.control.SelectionControls(),
          new ol.control.EditingControls(),
          new ol.control.Message(),
          new ol.control.Projection({
            projections: ['EPSG:3857','EPSG:4326', userDefined]
          })
        ]
      });
    </script>
  </body>
</html>
```

## Documentation
The project has no own documentation jet. Check out the source files in the `src` folder, or see the quick summary [here](APIDOC.md).

The original OpenLayers 3 API documentation can be found [here](http://openlayers.org/en/master/apidoc/), and a lot of examples can be found [here](http://openlayers.org/en/master/examples/).

## Bugs & features
Please use the [GitHub issue tracker](https://github.com/programmerg/ol3ditor/issues) for all bugs and feature requests. My native language is hungarian, so I appologize for my poor english.

## Contributing
Please commit into the develop branch (which holds the in-development version), not into master branch (which holds the tested and stable version) if you're interested in getting involved.

## Support
If you want to support OL3ditor, then send me an e-mail. Thanks! :)
