'user strict'
/*
 * This file is part of Fsub.
 *
 * Fsub is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * Fsub is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 */

var audio = new Audio();
audio.preload = 'auto';
audio.mozAudioChannelType = 'content';

// paused when the headset is removed
var acm = navigator.mozAudioChannelManager;
acm.addEventListener("headphoneschange", function(){
    if(!acm.headphones && audio.duration > 0 && !audio.paused){
        audio.pause();
    }
});

var playList = [];
var indexOfPlaying = -1;

var downloadList = [];

function playSong(song){
  var param = '?u='+encodeURIComponent(fsub.username);
  param += '&p='+encodeURIComponent(fsub.password);
  param += '&v='+encodeURIComponent(fsub.version);
  param += '&c='+encodeURIComponent(fsub.appname);
  param += '&id='+song.id;
  param += '&f=json';
  audio.src = fsub.server+'stream.view'+param;
  
  if(cacheEnable !== '0'){ // check if already on cache
    var req = sdcard.get(cacheDir+song.path);
    
    req.onsuccess = function(){
      audio.src = URL.createObjectURL(this.result);
    }
  }
  
  audio.play();
  $("#title").html(song.title);
  $("#songTitle").html(song.title);
}

function startPlaylist(){
  indexOfPlaying = 0;
  playSong(playList[indexOfPlaying]);
}

audio.addEventListener("ended", function(){ // play next in playlist
    indexOfPlaying++;
    if(typeof playList[indexOfPlaying] !== 'undefined'){
        playSong(playList[indexOfPlaying]);
    }else{
        indexOfPlaying=0;
        $("#title").html('FSub');
        $("#songTitle").html(song.title);
    }
}, false);

function saveSong(blob, song){
  var req = sdcard.addNamed(blob, cacheDir+song.path);
  
  req.onsuccess = function(){
    console.log('Save the song: '+this.result);
  }
  
  req.onerror = function(){
    console.error('Unable to save the song: '+this.error.message);
  }
  
  download();
}

function download(songs){
  if(typeof songs !== 'undefined')
    downloadList = downloadList.concat(songs);
  
  if(downloadList.length > 0){
    var req = sdcard.get(cacheDir+downloadList[0].path);
    
    downloadList.splice(0, 1);
    
    req.onsuccess = function(){
      download();
    }
    
    req.error = function(){
      fsub.stream(saveSong, downloadList[0]);
    }
  }
}
