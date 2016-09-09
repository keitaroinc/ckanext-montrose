this.ckan = this.ckan || {};
this.ckan.montrose = this.ckan.montrose || {};
this.ckan.montrose.dashboardmap = this.ckan.dashboardmap || {};

(function (self, $) {

  self.init = function init(elementId, countryName, mapURL, color, mainProperty) {
    renderMap(elementId, countryName, mapURL, color, mainProperty);
  };

  function renderMap(elementId, countryName, mapURL, color, mainProperty) {
    if (mapURL.length > 0) {
      var mapURLS = mapURL.split(',');
      var mainProperties = mainProperty.split(',');
    }
    $.getJSON('https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURI(countryName)).done(function (data) {
      if (data['status'] == 'ZERO_RESULTS') {
        initLeaflet(elementId, 39, 40, 2);
      } else {
        var lat = data['results'][0]['geometry']['location']['lat'],
          lng = data['results'][0]['geometry']['location']['lng'];
        initLeaflet(elementId, lat, lng, 5);
      }
    }).fail(function (data) {
      console.log(data);
    })

    // geo layer
    var geoL;

    function initLeaflet(elementId, lat, lng, zoom) {
      var map = new L.Map(elementId, {scrollWheelZoom: false, inertiaMaxSpeed: 200}).setView([lat, lng], zoom);
      var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      var osmAttrib = 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
      var osm = new L.TileLayer(osmUrl, {
        minZoom: 2,
        maxZoom: 18,
        attribution: osmAttrib
      });

      map.addLayer(osm);

      // Initialize markers
      initDatasetMarkers(mapURLS[0], mainProperties[0]);

      function initDatasetMarkers(mapURL, mainField) {

        var layers = [];

        var smallIcon = L.icon({
          iconUrl: '/images/marker-icon.png',
          shadowUrl: '/images/marker-shadow.png',
          iconRetinaUrl: '/images/marker-icon-2x.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        $.getJSON(mapURL).done(function (data) {
          geoL = L.geoJson(data, {
            style: function (feature) {
              return feature.properties.style;
            },
            pointToLayer: function (fauture, latlng) {
              return L.marker(latlng, {
                icon: smallIcon
              });
            },
            onEachFeature: function (feature, layer) {
              var popup = document.createElement("div"),
                header = document.createElement("h5"),
                headerText = document.createTextNode(feature.properties[mainField]),
                list = document.createElement("ul"),
                listElement,
                listElementText,
                boldElement,
                boldElementText;
              header.appendChild(headerText);
              for (var info in feature.properties) {
                if (info != mainField) {
                  boldElementText = document.createTextNode(info + ': ');
                  boldElement = document.createElement("b");
                  boldElement.appendChild(boldElementText);

                  listElementText = document.createTextNode(feature.properties[info]);
                  listElement = document.createElement("li");
                  listElement.appendChild(boldElement);
                  listElement.appendChild(listElementText);

                  list.appendChild(listElement);
                }
              }
              popup.appendChild(header);
              popup.appendChild(list);
              layer.bindPopup(popup);
              layer.name = feature.properties[mainField];
              layers.push(layer);
            }
          }).addTo(map);

          map.on('popupopen', function (e) {
            if (map._zoom == 10) {
              var px = map.project(e.popup._latlng, 10);
              px.y -= e.popup._container.clientHeight / 2;
              map.flyTo(map.unproject(px), 10, {animate: true, duration: 1});
            } else {
              map.flyTo(e.popup._latlng, 10, {animate: true, duration: 1})
            }
            $('.leaflet-popup-content-wrapper').css({'border-top': '5px solid ' + color});
          });

          var select_dataset = $('#dataset');
          var select_resource = $('#montrose_resource');
          select_dataset.append('<option>Select Data Set</option>');

          for (var elem in layers) {
            select_dataset.append('<option>' + layers[elem].name + '</option>');
          }


          select_dataset.change(
            function datasetsClick(a) {
              var selected = $('#dataset option:selected').text();
              for (var elem in layers) {
                if (layers[elem].name == selected) {
                  layers[elem].openPopup();
                }
              }
            }
          );

          $('#map-info').removeClass('hidden');

        }).fail(function (data) {
          console.log("GeoJSON could not be loaded " + mapURL);
        });

      }


      $(document).ready(function () {
        $('.leaflet-control-zoom-in').css({'color': color});
        $('.leaflet-control-zoom-out').css({'color': color});

        var select_resource = $('#montrose_resource');
        var select_dataset = $('#dataset');

        select_resource.change(function click() {
          var selectedIndex = $('#montrose_resource').prop('selectedIndex');
          select_dataset.children('option').remove();
          layers = [];
          map.removeLayer(geoL);
          initDatasetMarkers(mapURLS[selectedIndex], mainProperties[selectedIndex]);
        });

      });
    }

  }
})(this.ckan.montrose.dashboardmap, this.jQuery);