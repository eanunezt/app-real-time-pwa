(function () {
    'use strict';

    var app = {
        isLoading: true,
        visibleCards: {},
        selectedTimetables: [],
        spinner: document.querySelector('.loader'),
        cardTemplate: document.querySelector('.cardTemplate'),
        container: document.querySelector('.main'),
        addDialog: document.querySelector('.dialog-container')
    };

    const DATA_DB_NAME = 'shedule-db-v1';
    const STATIONS_TAB_NAME = 'stations-tab';
    const DB_VERSION = 1;
    let dbShedule=null;

    function createDB(){ 
 
        dbShedule = indexedDB.open(DATA_DB_NAME, DB_VERSION);
        dbShedule.onsuccess= function(event) {
          console.log('making a new object db');
        };
        dbShedule.onupgradeneeded = function(event) {

            var db = event.target.result;
            db.onerror = function(event) {
              console.error('error a new object store='+STATIONS_TAB_NAME);
              return;
            };
        
          // Create an objectStore for this database
            if (!db.objectStoreNames.contains(STATIONS_TAB_NAME)) {   
             var store =db.createObjectStore(STATIONS_TAB_NAME, {keyPath: 'key'});
              store.createIndex('key', 'key', { unique: false });
              console.log('making a new object store='+STATIONS_TAB_NAME);
            }
            };
      
      dbShedule.onerror = function(event) {
        // raised with no InvalidStateError
        if (event.currentTarget.error && event.currentTarget.error.name === 'InvalidStateError') {
            event.preventDefault();
        }
        console.log('Error getting data from getScheduleFromIDB.IndexedDB', event.currentTarget);
        return ;
      };
      
      }
 

    /*****************************************************************************
     *
     * Event listeners for UI elements
     *
     ****************************************************************************/

    document.getElementById('butRefresh').addEventListener('click', function () {
        // Refresh all of the metro stations
        app.updateSchedules();
    });

    document.getElementById('butAdd').addEventListener('click', function () {
        // Open/show the add new station dialog
        app.toggleAddDialog(true);
    });

    document.getElementById('butAddCity').addEventListener('click', function () {


        var select = document.getElementById('selectTimetableToAdd');
        var selected = select.options[select.selectedIndex];
        var key = selected.value;
        var label = selected.textContent;
        if (!app.selectedTimetables) {
            app.selectedTimetables = [];
        }
        app.getSchedule(key, label);
        app.selectedTimetables.push({key: key, label: label});
        app.toggleAddDialog(false);
    });

    document.getElementById('butAddCancel').addEventListener('click', function () {
        // Close the add new station dialog
        app.toggleAddDialog(false);
    });


    /*****************************************************************************
     *
     * Methods to update/refresh the UI
     *
     ****************************************************************************/

    // Toggles the visibility of the add new station dialog.
    app.toggleAddDialog = function (visible) {
        if (visible) {
            app.addDialog.classList.add('dialog-container--visible');
        } else {
            app.addDialog.classList.remove('dialog-container--visible');
        }
    };

    // Updates a timestation card with the latest Schedule. If the card
    // doesn't already exist, it's cloned from the template.

    app.updateTimetableCard = function (data) {
        var key = data.key;
        var dataLastUpdated = new Date(data.created);
        var schedules = data.schedules;
        var card = app.visibleCards[key];

        if (!card) {
            var label = data.label.split(', ');
            var title = label[0];
            var subtitle = label[1];
            card = app.cardTemplate.cloneNode(true);
            card.classList.remove('cardTemplate');
            card.querySelector('.label').textContent = title;
            card.querySelector('.subtitle').textContent = subtitle;
            card.removeAttribute('hidden');
            app.container.appendChild(card);
            app.visibleCards[key] = card;
        }
        card.querySelector('.card-last-updated').textContent = data.created;

        var scheduleUIs = card.querySelectorAll('.schedule');
        for(var i = 0; i<4; i++) {
            var schedule = schedules[i];
            var scheduleUI = scheduleUIs[i];
            if(schedule && scheduleUI) {
                scheduleUI.querySelector('.message').textContent = schedule.message;
            }
        }

        if (app.isLoading) {
            app.spinner.setAttribute('hidden', true);
            app.container.removeAttribute('hidden');
            app.isLoading = false;
        }
    };

    /*****************************************************************************
     *
     * Methods for dealing with the model
     *
     ****************************************************************************/


    app.getSchedule = function (key, label) {

         //Get the Schedule data from the cache.
         app.getScheduleFromIDB(key);

        var url = 'https://api-ratp.pierre-grimaud.fr/v3/schedules/' + key;

        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    var response = JSON.parse(request.response);
                    var result = {};
                    result.key = key;
                    result.label = label;
                    result.created = response._metadata.date;
                    result.schedules = response.result.schedules;
                    app.updateTimetableCard(result);
                    app.addScheduleToIDB(result);
                }
            } else {
                // Return the initial Schedule since no data is available.
                app.updateTimetableCard(initialStationTimetable);
            }
        };
        request.open('GET', url);
        request.send();
    };

    /**
     * Get's the cached Schedule data from the caches object.
     *
     * @param {string} key, path station.
     * @param {string} label, desc station
     * @return {Object} The Schedule, if the request fails, return null.
     */
    app.getScheduleFromIDB = function(key, label) {
    // CODELAB: Add code to get Schedule from the caches object.
    console.dir("getScheduleFromIDB init recovery");
    if (!('indexedDB' in window)) {
        console.log('This browser doesn\'t support IndexedDB');
        return;
      }
      var resDB = indexedDB.open(DATA_DB_NAME,DB_VERSION);
     
      resDB.onsuccess = function(event) {
        var db = resDB.result;
        if(db.objectStoreNames.contains(STATIONS_TAB_NAME)){
        var tx =db.transaction(STATIONS_TAB_NAME, 'readonly');
        var stations = tx.objectStore(STATIONS_TAB_NAME);
        var val=stations.get(key);
        val.onsuccess= function(event) {
            console.dir("getScheduleFromIDB val="+val);
            if(val.result){
                app.updateTimetableCard(val.result); 
            }
        }
        val.onerror= function(event) {
            console.dir("getScheduleFromIDB.onerror val="+event);
        }
    }
    };

    app.addScheduleToIDB = function(result) {
        // CODELAB: Add code to get Schedule from the caches object.
        console.dir("getScheduleFromIDB init recovery");
        if (!('indexedDB' in window)) {
            console.log('This browser doesn\'t support IndexedDB');
            return;
          }
          var resDB = indexedDB.open(DATA_DB_NAME,DB_VERSION);
         
          resDB.onsuccess = function(event) {
            var db = resDB.result;             
            var tx = db.transaction(STATIONS_TAB_NAME, 'readwrite');
            console.log('result-->'+result); 
            var stations = tx.objectStore(STATIONS_TAB_NAME);         
            
            stations.add(result);
            stations.onsuccess = function(){
              console.log('added item to the store os!');
            } 
            tx.complete;
        }
        };
    resDB.onerror = function(event) {
        // raised with no InvalidStateError
        if (event.currentTarget.error && event.currentTarget.error.name === 'InvalidStateError') {
            event.preventDefault();
        }
        console.error('Error setting data to getScheduleFromIDB.IndexedDB', event.currentTarget.error);
        return ;
    };

       
  }


    // Iterate all of the cards and attempt to get the latest timetable data
    app.updateSchedules = function () {
        var keys = Object.keys(app.visibleCards);
        keys.forEach(function (key) {
   
            //Get the Schedule data from the cache or network.
            app.getSchedule(key);
        });
    };

    /*
     * Fake timetable data that is presented when the user first uses the app,
     * or when the user has not saved any stations. See startup code for more
     * discussion.
     */

    var initialStationTimetable = {

        key: 'metros/1/bastille/A',
        label: 'Bastille, Direction La Défense',
        created: '2017-07-18T17:08:42+02:00',
        schedules: [
            {
                message: '0 mn'
            },
            {
                message: '2 mn'
            },
            {
                message: '5 mn'
            }
        ]


    };


    /************************************************************************
     *
     * Code required to start the app
     *
     * NOTE: To simplify this codelab, we've used localStorage.
     *   localStorage is a synchronous API and has serious performance
     *   implications. It should not be used in production applications!
     *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
     *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
     ************************************************************************/
    createDB();
    app.getSchedule('metros/1/bastille/A', 'Bastille, Direction La Défense');
    app.selectedTimetables = [
        {key: initialStationTimetable.key, label: initialStationTimetable.label}
    ];
})();
