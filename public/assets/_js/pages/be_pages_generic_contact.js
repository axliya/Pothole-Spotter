/*
 *  Document   : be_pages_generic_contact.js
 *  Author     : pixelcave
 *  Description: Custom JS code used in Contact Page
 */

class pageContact {
  /*
     * Init Contact Map functionality
     *
     */
  static contactMap() {
    new GMaps({
      div: '#js-map-contact',
      lat: 10.6415913,
      lng: -61.4016597,
      zoom: 15,
      disableDefaultUI: true,
      scrollwheel: false,
    });
  }

  /*
     * Init functionality
     *
     */
  static init() {
    this.contactMap();
  }
}

// Initialize when page loads
jQuery(() => { pageContact.init(); });
