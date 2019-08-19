'use strict';

// CODELAB: Update cache names any time any of the cached files change.
const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';
const DATA_DB_NAME = 'shedule-db-v1';
const STATIONS_TAB_NAME = 'stations-tab';
const DB_VERSION = 1;
const url_base = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/';

// CODELAB: Add list of files to cache here.
const FILES_TO_CACHE = ['./manifest.json',
  './offline.html',
  /*'./404.html',*/
  './index.html',
  'scripts/app.js',
  'scripts/install.js',
  'styles/inline.css',
  'images/offline.svg',
  'images/install.svg',
  'images/ic_add_white_24px.svg',
  'images/ic_refresh_white_24px.svg',
  'images/favicon.ico',
];

self.addEventListener('install', (evt) => {
  console.log('[ServiceWorker] Install');
  // CODELAB: Precache static resources here.
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline page');
      return cache.addAll(FILES_TO_CACHE);
    })
);

  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  console.log('[ServiceWorker] Activate');
  
  // CODELAB: Remove previous cached data from disk.
  evt.waitUntil( 
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME /*&& key !== DATA_CACHE_NAME*/) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
);

  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  console.log('[ServiceWorker] Fetch', evt.request.url);
  var key=evt.request.url.replace(url_base,'');
  // CODELAB: Add fetch event handler here.
 if (evt.request.url.includes('/metros/')) {
  console.log('[Service Worker] Fetch (data)', evt.request.url);
  //check for support
/*  var dbShedule = indexedDB.open(DATA_DB_NAME,DB_VERSION);
dbShedule.onsuccess=function() {
  return fetch(evt.request)
      .then((response) => {
        // If the response was good, clone it and store it in the cache.
        if (response.status === 200) {
          var db = dbShedule.result;               
          var tx = db.transaction(STATIONS_TAB_NAME, 'readwrite');
        console.log('response.clone()'+response.body.result); 

          var stations = tx.objectStore(STATIONS_TAB_NAME);         
          //var resp = JSON.parse(response);
            var result = {};
            result.key = key;
            result.created = response._metadata.date;
            result.schedules = response.result.schedules;
            console.log('result-->'+result);
          stations.add(result);
          stations.onsuccess = function(){
            console.log('added item to the store os!');
          } 
          tx.complete;        
        }
        return response;
      }).catch((err) => {
        // Network request failed, try to get it from the db.
        var db = dbShedule.result;           
              if(db.objectStoreNames.contains(STATIONS_TAB_NAME)){
                var tx = db.transaction(STATIONS_TAB_NAME, 'readonly');
                var stations = tx.objectStore(STATIONS_TAB_NAME);
                return stations.get(key);
              }
      });
}*/


  
  
 /* evt.respondWith( 
    caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(evt.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
              return response;
            }).catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
      })
      );*/
  return;
}
evt.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(evt.request)
          .then((response) => {
            return response || fetch(evt.request);
          });
    })
);
});