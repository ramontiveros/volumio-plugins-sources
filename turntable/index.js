'use strict';

var libQ = require('kew');
var fs=require('fs-extra');
var config = new (require('v-conf'))();
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var spawn = require('child_process').spawn;

module.exports = turntable;
function turntable(context) {
	  var self = this;

	  this.context = context;
	  this.commandRouter = this.context.coreCommand;
	  this.logger = this.context.logger;
	  this.configManager = this.context.configManager;
    this.albumart = "http://volumio.local/albumart?sourceicon=music_service/turntable/turntable.svg";
    this.uri = "http://volumio.local:6000/turntable.mpg";
}



turntable.prototype.onVolumioStart = function()
{
	  var self = this;
	  var configFile=this.commandRouter.pluginManager.getConfigurationFile(this.context,'config.json');
	  this.config = new (require('v-conf'))();
	  this.config.loadFile(configFile);

    return libQ.resolve();
}

turntable.prototype.onStart = function() {
    var self = this;
	  var defer=libQ.defer();

    self.mpdPlugin = this.commandRouter.pluginManager.getPlugin('music_service', 'mpd');
    self.serviceName = "turntable";
    this.addToBrowseSources();
	  // Once the Plugin has successfull started resolve the promise
	  defer.resolve();

    return defer.promise;
};

turntable.prototype.onStop = function() {
    var self = this;
    var defer=libQ.defer();

    // Once the Plugin has successfull stopped resolve the promise
    defer.resolve();

    return libQ.resolve();
};

turntable.prototype.onRestart = function() {
    var self = this;
    // Optional, use if you need it
};


// Configuration Methods -----------------------------------------------------------------------------

turntable.prototype.getUIConfig = function() {
    var defer = libQ.defer();
    var self = this;

    var lang_code = this.commandRouter.sharedVars.get('language_code');

    self.commandRouter.i18nJson(__dirname+'/i18n/strings_'+lang_code+'.json',
                                __dirname+'/i18n/strings_en.json',
                                __dirname + '/UIConfig.json')
        .then(function(uiconf)
              {


                  defer.resolve(uiconf);
              })
        .fail(function()
              {
                  defer.reject(new Error());
              });

    return defer.promise;
};

turntable.prototype.getConfigurationFiles = function() {
	  return ['config.json'];
}

turntable.prototype.setUIConfig = function(data) {
	  var self = this;
	  //Perform your installation tasks here
};

turntable.prototype.getConf = function(varName) {
	  var self = this;
	  //Perform your installation tasks here
};

turntable.prototype.setConf = function(varName, varValue) {
	  var self = this;
	  //Perform your installation tasks here
};



// Playback Controls ---------------------------------------------------------------------------------------
// If your plugin is not a music_sevice don't use this part and delete it


turntable.prototype.addToBrowseSources = function () {
	  // Use this function to add your music service plugin to music sources
    var data = {name: 'Tocadiscos', uri: 'turntable',plugin_type:'music_service',plugin_name:'turntable', albumart: '/albumart?sourceicon=music_service/turntable/turntable.svg'};
    this.commandRouter.volumioAddToBrowseSources(data);
};

turntable.prototype.handleBrowseUri = function (curUri) {
    var self = this;

    self.commandRouter.logger.info(curUri);
    var response;

    if (curUri.startsWith('turntable')) {
        if (curUri == 'turntable') {
            response = libQ.resolve({
                navigation: {
					          lists: [
						            {
                            "availableListViews": [
								                "list"
							              ],
							              "items": [
                                {
                                    service: 'turntable',
				                            type: 'song',
				                            title: 'Prender tocadiscos',
				                            artist: 'Tocadiscos',
				                            album: 'Tocadiscos',
				                            icon: 'fa fa-music',
				                            uri: 'on'
                                }
                            ],
                            "prev": {
						                    uri: 'turntable'
					                  }
                        }
                    ]
                }
            });
        }
    }
    return response;
};

// Define a method to clear, add, and play an array of tracks
turntable.prototype.clearAddPlayTrack = function(track) {
	  var self = this;
	  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::clearAddPlayTrack');
	  self.commandRouter.logger.info(JSON.stringify(track));

    self.startStream();
    return self.sendSpopCommand('uplay', [track.uri]);
/*
    return self.startStream().then(function() {
        self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::StreamStarted');
        return self.mpdPlugin.sendMpdCommand('clear', []);
    }).then(function() {
        return self.mpdPlugin.sendMpdCommand('add "' + track.uri + '"', []);
    }).then(function() {
        return self.mpdPlugin.sendMpdCommand('play', []);
    }).then(function() {
        return libQ.resolve(self.pushSongState());
    }).fail(function(e){
        self.commandRouter.logger.error(e);
        self.commandRouter.pushToastMessage(
            'error',
            'Tocadiscos',
            e
        );
    });
*/
};

turntable.prototype.startStream = function () {
    self.commandRouter.logger.info('startStream');
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::startStream');
    /*
      var defer = libQ.defer();
      self.streamer = spawn('vlc', ['alsa://hw:5,0', '--sout="#transcode{vcodec=hevc,acodec=mpga,ab=128,channels=2,samplerate=44100,scodec=none}:http{dst=:6000/turntable.mpg}"']);
      self.commandRouter.logger.info(`Spawned child pid: ${self.streamer.pid}`);
      self.streamer.stderr.on('data', (data) => self.commandRouter.logger.error(data));
      self.streamer.stdout.on('data', (data) => {
      self.commandRouter.logger.info(data);
      if (data.includes("adding input codec=mpga"))
      defer.resolve();
      });
      self.streamer.on('close', (code) => defer.reject(code));
      defer.timeout(60*1000);
      return defer.promise;
    */
};

turntable.prototype.pushSongState = function () {
    var self = this;
    self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::pushSongState');
    var rpState = {
        status: 'play',
        service: self.serviceName,
        type: 'track',
        trackType: 'Turntable',
        radioType: 'turntable',
        albumart: self.albumart,
        uri: self.uri,
        name: "Turntable",
        title: "Turntable",
        artist: "N/A",
        album: "N/A",
        streaming: true,
        disableUiControls: true,
        duration: Number.MAX_VALUE,
        seek: 0,
        samplerate: '44.1 KHz',
        bitdepth: '16 bit',
        channels: 2
    };

    self.state = rpState;

    //workaround to allow state to be pushed when not in a volatile state
    var vState = self.commandRouter.stateMachine.getState();
    var queueItem = self.commandRouter.stateMachine.playQueue.arrayQueue[vState.position];

    queueItem.name = rpState.name;
    queueItem.artist = rpState.artist;
    queueItem.album = rpState.album;
    queueItem.albumart = rpState.albumart;
    queueItem.trackType = rpState.trackType;
    queueItem.duration = rpState.duration;
    queueItem.samplerate = rpState.samplerate;
    queueItem.bitdepth = rpState.bitdepth;
    queueItem.channels = rpState.channels;

    //reset volumio internal timer
    self.commandRouter.stateMachine.currentSeek = 0;
    self.commandRouter.stateMachine.playbackStart=Date.now();
    self.commandRouter.stateMachine.currentSongDuration=rpState.duration;
    self.commandRouter.stateMachine.askedForPrefetch=false;
    self.commandRouter.stateMachine.prefetchDone=false;
    self.commandRouter.stateMachine.simulateStopStartDone=false;

    //volumio push state
    self.commandRouter.servicePushState(rpState, self.serviceName);
};

turntable.prototype.seek = function (timepos) {
    this.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::seek to ' + timepos);

    return this.sendSpopCommand('seek '+timepos, []);
};

// Stop
turntable.prototype.stop = function() {
	  var self = this;
	  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::stop');
    if (self.timer) {
        self.timer.clear();
    }
    self.commandRouter.pushToastMessage(
        'info',
        'Tocadiscos',
        'Se ha apagado el tocadiscos'
    );

    if (self.streamer) self.streamer.kill();

    return self.mpdPlugin.stop()
        .then(function () {
            self.state.status = 'stop';
            self.commandRouter.servicePushState(self.state, self.serviceName);
        });
};

// Spop pause
turntable.prototype.pause = function() {
	  var self = this;
	  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::pause');

    // pause the timeout of this song
    if (self.timer) {
        self.timer.pause();
    }

    // pause the song and store the seek position needed for the new setTimeout calculation
    return self.mpdPlugin.sendMpdCommand('pause', [1])
        .then(function () {
            var vState = self.commandRouter.stateMachine.getState();
            self.state.status = 'pause';
            self.state.seek = vState.seek;
            self.commandRouter.servicePushState(self.state, self.serviceName);
        });
};

turntable.prototype.resume = function () {
    var self = this;

    // seek back 1 sec to prevent mpd crashing on resume of a paused stream
    var fixMpdCrashCmds = [
        { command: 'seekcur', parameters: ['-1'] },
        { command: 'play', parameters: [] }
    ];

    return self.mpdPlugin.sendMpdCommandArray(fixMpdCrashCmds)
        .then(function () {
            // setTimeout
            if (self.timer) {
                self.timer.resume();
            }

            // adapt play status and update state machine
            self.state.status = 'play';
            self.commandRouter.servicePushState(self.state, self.serviceName);
        });

}

// Get state
turntable.prototype.getState = function() {
	  var self = this;
    var defer=libQ.defer();
	  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::getState');

    defer.resolve({
        status: "play",
        seek: 50
    });
	  return defer.promise;
};

//Parse state
turntable.prototype.parseState = function(sState) {
	  var self = this;
	  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::parseState');

	  //Use this method to parse the state and eventually send it with the following function
};

// Announce updated State
turntable.prototype.pushState = function(state) {
	  var self = this;
	  self.commandRouter.pushConsoleMessage('[' + Date.now() + '] ' + 'turntable::pushState');

	  return self.commandRouter.servicePushState(state, self.servicename);
};


turntable.prototype.explodeUri = function(uri) {
	  var self = this;
	  var defer=libQ.defer();

    self.commandRouter.logger.info(`Entro a explodeUri con: ${uri}`);

    defer.resolve({
        uri: self.uri,
        service: 'turntable',
        name: "Turntable",
        type: 'track',
        albumart: self.albumart
    });
	  return defer.promise;
};

turntable.prototype.getAlbumArt = function (data, path) {

	  var artist, album;

	  if (data != undefined && data.path != undefined) {
		    path = data.path;
	  }

	  var web;

	  if (data != undefined && data.artist != undefined) {
		    artist = data.artist;
		    if (data.album != undefined)
			      album = data.album;
		    else album = data.artist;

		    web = '?web=' + nodetools.urlEncode(artist) + '/' + nodetools.urlEncode(album) + '/large'
	  }

	  var url = '/albumart';

	  if (web != undefined)
		    url = url + web;

	  if (web != undefined && path != undefined)
		    url = url + '&';
	  else if (path != undefined)
		    url = url + '?';

	  if (path != undefined)
		    url = url + 'path=' + nodetools.urlEncode(path);

	  return url;
};





turntable.prototype.search = function (query) {
	  var self=this;
	  var defer=libQ.defer();

	  // Mandatory, search. You can divide the search in sections using following functions

	  return defer.promise;
};

turntable.prototype._searchArtists = function (results) {

};

turntable.prototype._searchAlbums = function (results) {

};

turntable.prototype._searchPlaylists = function (results) {


};

turntable.prototype._searchTracks = function (results) {

};

turntable.prototype.goto=function(data){
    var self=this
    var defer=libQ.defer()

    // Handle go to artist and go to album function

    return defer.promise;
};
