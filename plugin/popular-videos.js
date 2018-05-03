videojs.registerPlugin('popularVideos', function() {
    var myPlayer = this,
      apiRequest = document.getElementById('apiRequest'),
      responseData = document.getElementById('responseData'),
      videoIds = [],
      videoData = {},
      JSONanalyticsData = {};
    // create an array holder for the videos
    videoData.videos = [];

    // Build options needed for Analytics API request
    var options = {},
      baseURL = "https://analytics.api.brightcove.com/v1/data";
    options.proxyURL = "https://solutions.brightcove.com/bcls/bcls-proxy/brightcove-learning-proxy-v2.php";
    options.requestType = "GET";

    // set up data for Analytics API request
    setRequestData();
    // make the Analytics API request
    makeRequest(options, function(analyticsData) {
      // Convert response string into JSON
      JSONanalyticsData = JSON.parse(analyticsData);
      responseData.textContent = JSON.stringify(JSONanalyticsData, null, '  ');
      console.log("JSONanalyticsData",JSONanalyticsData);
      // extract the video ids into an array
      videoIds = extractVideoIds(JSONanalyticsData);
      // use the catalog to get the video data
      getVideoData(videoIds, function() {
        // add the popular videos list to the player as a playlist
        console.log(videoData.videos)
        myPlayer.playlist(videoData.videos);
      });
    });

    // +++ Set up Analytics API request +++
    /**
     * sets up the data for the API request
     */
    function setRequestData() {
      var endPoint = '',
        // get the epoch time in milliseconds 24 hours ago
        // 12 hours in milliseconds = 1000 * 24 * 60 * 60 = 86,400,000
        yesterday = new Date().valueOf() - 86400000,
      // note that we don't have to set the to date to now because that's the default
      endPoint = '?accounts=1752604059001&dimensions=video&sort=-video_view&limit=6&from=' + yesterday;
      options.url = baseURL + endPoint;
      apiRequest.textContent = options.url;
    }

    // +++ Make the Analytics API request +++
    /**
    * send API request to the proxy
    * @param  {Object} options for the request
    * @param  {String} options.url the full API request URL
    * @param  {String="GET","POST","PATCH","PUT","DELETE"} requestData [options.requestType="GET"] HTTP type for the request
    * @param  {String} options.proxyURL proxyURL to send the request to
    * @param  {String} options.client_id client id for the account (default is in the proxy)
    * @param  {String} options.client_secret client secret for the account (default is in the proxy)
    * @param  {JSON} [options.requestBody] Data to be sent in the request body in the form of a JSON string
    * @param  {Function} [callback] callback function that will process the response
    */
    function makeRequest(options, callback) {
      var httpRequest = new XMLHttpRequest(),
          response,
          requestParams,
          dataString,
          proxyURL = options.proxyURL,
          // response handler
          getResponse = function() {
            try {
              if (httpRequest.readyState === 4) {
                if (httpRequest.status >= 200 && httpRequest.status < 300) {
                  response = httpRequest.responseText;
                  // some API requests return '{null}' for empty responses - breaks JSON.parse
                  if (response === "{null}") {
                    response = null;
                  }
                  // return the response
                  callback(response);
                } else {
                  alert(
                    "There was a problem with the request. Request returned " +
                    httpRequest.status
                  );
                }
              }
            } catch (e) {
              alert("Caught Exception: " + e);
            }
          };
       /**
        * set up request data
        * the proxy used here takes the following request body:
        * JSON.strinify(options)
        */
      // set response handler
      httpRequest.onreadystatechange = getResponse;
      // open the request
      httpRequest.open("POST", proxyURL);
      // set headers if there is a set header line, remove it
      // open and send request
      httpRequest.send(JSON.stringify(options));
    }

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
});
