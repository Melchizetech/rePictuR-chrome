(function (window) {
  'use strict';

  // repictur definition
  function define_repictur () {
    var repictur = {};

    // Variables
    // - Private
    var name = 'repictur';
    var initialized = false;

    // - Public
    repictur.debug = false;
    repictur.applicationId = null;
    repictur.server = {
      hostname: null,
      gateway: null,
      apiVersion: 1
    };
    repictur.dedicated = false;
    repictur.baseUrl = null;
    repictur.clientId = 'JavaScript';
    repictur.clientVersion = '1';

    // Methods
    // - Private
    function initFromLocal () {
      var now = new Date().getTime();

      if (typeof Storage !== 'undefined' && localStorage.getItem('repictur.' + repictur.applicationId)) {
        var localData = JSON.parse(localStorage.getItem('repictur.' + repictur.applicationId));

        if (localData.validityExpiration >= now && localData.checkIntervals <= 8) {
          repictur.baseUrl = localData.baseUrl;

          return true;
        }
      }

      return false;
    }

    function buildBaseUrl () {
      if (repictur.dedicated) {
        repictur.baseUrl = 'http://' + repictur.server.hostname + '/api/' + repictur.server.apiVersion + '/resize?';

        return true;
      } else {
        var now = new Date().getTime();
        var url = 'http://' + repictur.server.hostname + '/p/' + repictur.server.apiVersion
        + '/server/getApplicationConfiguration?applicationId=' + repictur.applicationId + '&client=' + repictur.clientId
        + '&version=' + repictur.clientVersion;
        var request = new XMLHttpRequest();
        request.open('GET', url, false);
        request.send(null);
        var response = JSON.parse(request.response);

        if (response.code == 0) {
          // Check license validity
          if (response.content.enabled && response.content.validityExpiration >= now) {
            repictur.server.gateway = response.content.webServiceUrl;
            repictur.baseUrl = repictur.server.gateway + '/api/' + repictur.server.apiVersion + '/resize?';

            // Save data in Local Storage if supported
            if (typeof Storage !== 'undefined') {
              localStorage.setItem('repictur.' + repictur.applicationId, JSON.stringify({
                validityExpiration: response.content.validityExpiration,
                checkIntervals: response.content.checkIntervals,
                baseUrl: repictur.baseUrl
              }));
            }

            return true;
          }
        }

        if (repictur.debug)
        console.debug('repictur: initialization aborted, please check your license details.');

        return false;
      }
    }

    // - Public
    /**
    ** Initializes the repictur SDK. This method must be imperatively invoked for first.
    **
    ** @param applicationId (String): the repictur application identifier
    ** @param hostname (String): the repictur server hostname
    ** @param dedicated (Boolean): whether the repictur service should be used in dedicated-mode.
    ** Set it to "true" ONLY if you purchased a dedicated repictur license.
    */
    repictur.initialize = function (applicationId, hostname, dedicated) {
      if (!initialized) {
        repictur.applicationId = applicationId || null;
        repictur.server.hostname = hostname || null;
        repictur.dedicated = (dedicated == null || typeof dedicated !== 'boolean') ? null : dedicated;

        // Check parameters
        if (!repictur.applicationId || !repictur.server.hostname || repictur.dedicated == null)
        throw new Error('repictur: bad initialization parameters.');

        if (initFromLocal())
        initialized = true;
        else
        initialized = buildBaseUrl();
      } else {
        if (repictur.debug)
        console.debug('repictur has already been initialized.');
      }
    }

    /**
    ** Return if the SDK is initialized or not.
    **
    ** @return SDK initialized state.
    */
    repictur.isInitialized = function () {
      return initialized;
    }

    // Modules
    // - Builder
    repictur.Builder = (function (repictur) {
      var Builder = {};

      // Variables
      // - Private
      var name = 'repictur.Builder';
      // -- Options
      var IMAGETYPE = {
        JPEG: { value: 'JPEG', quality: true },
        PNG: { value: 'PNG', quality: false }
      };
      var options = {
        imageUrl: null,
        width: -1,
        height: -1,
        crop: true,
        absoluteFocus: null,
        focusX: -1,
        focusY: -1,
        enlarge: true,
        exact: false,
        format: IMAGETYPE.JPEG,
        quality: 80
      };

      // Methods
      // - Private

      // - Public
      /**
      ** Set the image url to build the rePictuR url (MANDATORY).
      **
      ** @param url (String): the url of the image you want to resize.
      */
      Builder.setImageUrl = function (url) {
        options.imageUrl = url;

        return this;
      }

      /**
      ** Set the image dimensions of the resulting image (MANDATORY).
      **
      ** @param width (Integer): the width of your resulting image
      ** @param height (Integer): the height of your resulting image.
      */
      Builder.setDimensions = function (width, height) {
        options.width = width;
        options.height = height;

        return this;
      }

      /**
      ** Set the crop parameter. Defaults to true.
      **
      ** @param crop (Boolean): true if you want to crop, else false.
      */
      Builder.setCrop = function (crop) {
        options.crop = crop;

        if (crop)
        options.exact = false;

        return this;
      }

      /**
      ** Set the relative focus point.
      **
      ** @param x (Double): x coordinate of the focus point
      ** @param y (Double): y coordinate of the focus point.
      */
      Builder.setRelativeFocus = function (x, y) {
        options.absoluteFocus = false;
        options.focusX = x;
        options.focusY = y;

        return this;
      }

      /**
      ** Set the absolute focus point.
      **
      ** @param x (Double): x coordinate of the focus point
      ** @param y (Double): y coordinate of the focus point.
      */
      Builder.setAbsoluteFocus = function (x, y) {
        options.absoluteFocus = true;
        options.focusX = x;
        options.focusY = y;

        return this;
      }

      /**
      ** Set the enlarge parameter. Defaults to true.
      **
      ** @param enlarge (Boolean): true if you want to allow image enlargement, else false.
      */
      Builder.setEnlarge = function (enlarge) {
        options.enlarge = enlarge;

        return this;
      }

      /**
      ** Set the exact parameter. Defaults to false. Exact and Crop cannot be both true.
      **
      ** @param exact (Boolean): true if you want keep exact image dimensions, else false.
      */
      Builder.setExact = function (exact) {
        options.exact = exact;

        if (exact)
        options.crop = false;

        return this;
      }

      /**
      ** Set the JPEG format for the resulting image. Defaults with 80 as image quality.
      **
      ** @param quality (Integer): the JPEG quality, must be between 1 and 100.
      */
      Builder.setJpegFormat = function (quality) {
        options.quality = quality;

        options.format = IMAGETYPE.JPEG;

        return this;
      }

      /**
      ** Set the PNG format for the resulting image.
      */
      Builder.setPngFormat = function () {
        options.format = IMAGETYPE.PNG;

        return this;
      }

      /**
      ** Build the resulting resized image url.
      */
      Builder.build = function () {
        // Check options
        if (!repictur.isInitialized())
        throw new Error('repictur has not been initialized.');
        if (!options.imageUrl)
        throw new Error('repictur: image url has not been set.');
        if (options.width <= 0 || options.height <= 0)
        throw new Error('repictur: dimensions has not been set.');
        if (!options.crop && options.absoluteFocus !== null)
        throw new Error('repictur: "crop" parameter must be set to true when setting focus point.');
        if (options.crop && options.exact)
        throw new Error('repictur: "crop" and "exact" parameters cannot be both set to true.');
        if (options.absoluteFocus === false && (options.focusX < 0 || options.focusX > 1 || options.focusY < 0 || options.focusY > 1))
        throw new Error('repictur: for relative focus, coordinates should be set between 0 and 1.');
        if (options.absoluteFocus === true && (options.focusX < 0 || options.focusY < 0))
        throw new Error('repictur: for absolute focus, coordinates should be greater than 0.');

        // Build url
        var url = repictur.baseUrl + 'a=' + repictur.applicationId;
        url += '&u=' + encodeURIComponent(options.imageUrl);
        url += '&w=' + options.width;
        url += '&h=' + options.height;
        url += '&c=' + options.crop;
        if (options.crop && options.absoluteFocus !== null)
        url += '&fpa=' + options.absoluteFocus;
        if (options.crop && options.focusX > 0)
        url += '&fpx=' + options.focusX;
        if (options.crop && options.focusY > 0)
        url += '&fpy=' + options.focusY;
        url += '&e=' + options.enlarge;
        url += '&x=' + options.exact;
        url += '&f=' + options.format.value;
        if (options.format.quality)
        url += '&cv=' + options.quality;
        url += '&ci=' + repictur.clientId;
        url += '&cav=' + repictur.clientVersion;

        if (repictur.debug)
        console.debug(url);

        return url;
      }

      return Builder;
    }(repictur));

    return repictur;
  }

  // Define globally if it doesn't already exist
  if (typeof repictur === 'undefined') {
    window.repictur = define_repictur();
  } else {
    throw new Error('repictur is already defined.');
  }
})(window);
