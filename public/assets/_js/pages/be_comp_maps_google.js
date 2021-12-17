/*
 *  Document   : be_comp_maps_google.js
 *  Author     : pixelcave
 *  Description: Custom JS code used in Google Maps Page
 */

// Gmaps.js, for more examples you can check out https://hpneo.github.io/gmaps/
class pageCompMapsGoogle {
  /*
     * Init Search Map functionality
     *
     */
  static initMapSearch() {
    if (jQuery('#js-map-search').length) {
      // Init Map
      const mapSearch = new GMaps({
        div: '#js-map-search',
        lat: 20,
        lng: 0,
        zoom: 2,
        scrollwheel: false,
      });

      // When the search form is submitted
      jQuery('.js-form-search').on('submit', (e) => {
        const inputGroup = jQuery('.js-search-address').parent('.input-group');

        GMaps.geocode({
          address: jQuery('.js-search-address').val().trim(),
          callback: (results, status) => {
            if ((status === 'OK') && results) {
              const latlng = results[0].geometry.location;

              mapSearch.removeMarkers();
              mapSearch.addMarker({ lat: latlng.lat(), lng: latlng.lng() });
              mapSearch.fitBounds(results[0].geometry.viewport);

              inputGroup.siblings('.form-text').remove();
            } else {
              inputGroup.after('<div class="font-text text-danger text-center animated fadeInDown">Address not found!</div>');
            }
          },
        });

        return false;
      });
    }
  }

  /*
     * Init Satellite Map
     *
     */
  static initMapSat() {
    if (jQuery('#js-map-sat').length) {
      new GMaps({
        div: '#js-map-sat',
        lat: 0,
        lng: 0,
        zoom: 2,
        scrollwheel: false,
      }).setMapTypeId(google.maps.MapTypeId.SATELLITE);
    }
  }

  /*
     * Init Terrain Map
     *
     */
  static initMapTer() {
    if (jQuery('#js-map-ter').length) {
      new GMaps({
        div: '#js-map-ter',
        lat: 0,
        lng: 0,
        zoom: 2,
        scrollwheel: false,
      }).setMapTypeId(google.maps.MapTypeId.TERRAIN);
    }
  }

  /*
     * Init Overlay Map
     *
     */
  static initMapOverlay() {
    if (jQuery('#js-map-overlay').length) {
      new GMaps({
        div: '#js-map-overlay',
        lat: 37.7577,
        lng: -122.4376,
        zoom: 11,
        scrollwheel: false,
      }).drawOverlay({
        lat: 37.7577,
        lng: -122.4376,
        content: '<div class="alert alert-warning text-center" style="width: 220px;"><h4 class="alert-heading mb-2">Message Title</h4><p class="font-size-sm mb-0">You can overlay messages on your maps!</p></div>',
      });
    }
  }

  /*
     * Init Markers Map
     *
     */
  static initMapMarkers() {
    if (jQuery('#js-map-markers').length) {
      jQuery.get('/api/markers', (data) => {
        new GMaps({
          div: '#js-map-markers',
          lat: 10.421482291262777,
          lng: -61.266757942704366,
          zoom: 10.8,
          scrollwheel: false,
        }).addMarkers(data);
      });
    }
  }

  /*
     * Init functionality
     *
     */
  static init() {
    this.initMapMarkers();
  }
}

// Initialize when page loads
jQuery(() => { pageCompMapsGoogle.init(); });
