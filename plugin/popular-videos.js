videojs.registerPlugin('popularVideos', function() {
    var myPlayer = this,
        reportURL = 'https://analytics.api.brightcove.com/v1/data',
        proxyURL = 'https://solutions.brightcove.com/bcls/bcls-proxy/doc-samples-proxy.php',
        apiRequest = document.getElementById('apiRequest'),
        responseData = document.getElementById('responseData'),
        // this var needs to be in the function scope because multiple functions will access it
        videoData = {};
    // launch the controller function to kick things off
    init();

    // +++ Extract the video ids +++
    /**
    * extract video ids from Analytics API response
    * @param {array} aapiData the data from the Analytics API
    * @return {array} videoIds array of video ids
    */
    function extractVideoIds(aapiData) {
      var i,
          iMax = aapiData.items.length,
          videoIds = [];
      for (i = 0; i < iMax; i++) {
        if (aapiData.items[i].video !== null) {
          videoIds.push(aapiData.items[i].video);
        }
      }
      return videoIds;
    }

    // +++ Get the video objects +++
    /**
    * get video objects
    * @param {array} videoIds array of video ids
    * @return {array} videoData array of video objects
    */
    function getVideoData(videoIds, callback) {
      var i = 0,
          iMax = videoIds.length;

      /**
      * makes catalog calls for all video ids in the array
      */
      getVideo();

      function getVideo() {
        if (i < iMax) {
          myPlayer.catalog.getVideo(videoIds[i], pushData);
        } else {
          callback(videoData);
        }

      }
      /**
      * callback for the catalog calls
      * pushes the returned data object into an array
      * @param {string} error error returned if the call fails
      * @parap {object} video the video object
      */
      function pushData(error, video) {
        videoData.videos.push(video);
        i++;
        getVideo();
      }
    }

    // +++ Set up Analytics API request +++
    /**
    * sets up the data for the API request
    */
    function setRequestData() {
      var endPoint = '',
          // get the epoch time in milliseconds 24 hours ago
          // 12 hours in milliseconds = 1000 * 24 * 60 * 60 = 86,400,000
          yesterday = new Date().valueOf() - 86400000,
          requestData = {};
      // note that we don't have to set the to date to now because that's the default
      endPoint = '?accounts=1752604059001&dimensions=video&sort=-video_view&limit=6&from=' + yesterday;
      requestData.url = reportURL + endPoint;
      requestData.requestType = 'GET';
      apiRequest.textContent = requestData.url;
      return requestData;
    }

    // +++ Get data from Analytics API +++
    /**
    * send API request to the proxy
    * @param  {object} requestData options for the request
    * @param  {string} requestID the type of request = id of the button
    * @return {object} parsedData the parsed API response
    */
    function getAnalyticsData(options, callback) {
      var httpRequest = new XMLHttpRequest(),
          responseRaw,
          parsedData,
          requestParams;
      // set up request data
      requestParams = 'url=' + encodeURIComponent(options.url) + '&requestType=' + options.requestType;
      // set response handler
      httpRequest.onreadystatechange = getResponse;
      // open the request
      httpRequest.open('POST', proxyURL);
      // set headers
      httpRequest.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      // open and send request
      httpRequest.send(requestParams);
      // response handler
      function getResponse() {
        try {
          if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
              responseRaw = httpRequest.responseText;
              responseData.textContent = responseRaw;
              parsedData = JSON.parse(responseRaw);
              responseData.textContent = JSON.stringify(parsedData, null, '  ');
              callback(parsedData);
            } else {
              alert('There was a problem with the request. Request returned ' + httpRequest.status);
            }
          }
        } catch (e) {
          alert('Caught Exception: ' + e);
        }
      }
    }

    /**
    * acts as a controller for the rest of the script
    */
    function init() {
      var requestData = {},
          videoIds = [];
      // create an array holder for the videos
      videoData.videos = [];
      // set up data for Analytics API request
      requestData = setRequestData();
      // make the Analytics API request
      getAnalyticsData(requestData, function(analyticsData) {
        // extract the video ids into an array
        videoIds = extractVideoIds(analyticsData);
        // use the catalog to get the video data
        getVideoData(videoIds, function() {
          // add the popular videos list to the player as a playlist
          //console.log(videoData.videos)
          // +++ Load the playlist +++
          myPlayer.playlist(videoData.videos);
        });
      });
    }
});
