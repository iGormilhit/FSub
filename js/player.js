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
if(acm){
    acm.addEventListener("headphoneschange", function(){
        if(!acm.headphones && audio.duration > 0 && !audio.paused){
            audio.pause();
        }
    });
}

var playList = [];
var indexOfPlaying = -1;

var downloadList = [];

function startPlay(){
	if(cacheEnable !== '0'){
  	var req = sdcard.get(coverArtDir+playList[indexOfPlaying].coverArt);
  	
	  req.onsuccess = function(){
	    $("#coverInPlayer").attr("src", URL.createObjectURL(this.result));
	  };
	  
	  req.onerror = function(){
	    var param = '?u='+encodeURIComponent(fsub.username);
	    param += '&p='+encodeURIComponent(fsub.password);
	    param += '&v='+encodeURIComponent(fsub.version);
	    param += '&c='+encodeURIComponent(fsub.appname);
	    param += '&id='+playList[indexOfPlaying].coverArt;
	    param += '&f=json';
	    $("#coverInPlayer").attr("src", fsub.server+'getCoverArt.view'+param);
	  };
	}else{
		var param = '?u='+encodeURIComponent(fsub.username);
    param += '&p='+encodeURIComponent(fsub.password);
    param += '&v='+encodeURIComponent(fsub.version);
    param += '&c='+encodeURIComponent(fsub.appname);
    param += '&id='+playList[indexOfPlaying].coverArt;
    param += '&f=json';
    $("#coverInPlayer").attr("src", fsub.server+'getCoverArt.view'+param);
	}
	
  audio.play();
  
  $("#playerPlayOrPause").removeClass("ui-icon-play");
  $("#playerPlayOrPause").addClass("ui-icon-pause");
  
  $("#title").html(playList[indexOfPlaying].title);
  $("#songTitle").html(playList[indexOfPlaying].title);
}

function PlayPause(){
  if(audio.duration > 0 && !audio.paused){ // paused
    audio.pause();
    
    $("#playerPlayOrPause").removeClass("ui-icon-pause");
    $("#playerPlayOrPause").addClass("ui-icon-play");
  }else if(audio.duration > 0 && audio.paused){
    audio.play();
    
    $("#playerPlayOrPause").removeClass("ui-icon-play");
    $("#playerPlayOrPause").addClass("ui-icon-pause");
  }else{
    startPlaylist();
  }
}

function stop(){
  if(audio.duration > 0){
    audio.pause();
    audio.currentTime = 0;
    audio.src = '';
    
    indexOfPlaying=0;
    
    $("#playerPlayOrPause").removeClass("ui-icon-pause");
    $("#playerPlayOrPause").addClass("ui-icon-play");
    
    $("#title").html('FSub');
    $("#songTitle").html('FSub');
  }
}

function playPrevious(){
  if(typeof playList[indexOfPlaying-1] === 'undefined')
    return;

  indexOfPlaying--;
  playSong(playList[indexOfPlaying]);
}

function playNext(){
  if(typeof playList[indexOfPlaying+1] === 'undefined')
    return;

  indexOfPlaying++;
  playSong(playList[indexOfPlaying]);
}

function directPlaySong(song){
  var param = '?u='+encodeURIComponent(fsub.username);
  param += '&p='+encodeURIComponent(fsub.password);
  param += '&v='+encodeURIComponent(fsub.version);
  param += '&c='+encodeURIComponent(fsub.appname);
  param += '&id='+song.id;
  param += '&f=json';
  audio.src = fsub.server+'stream.view'+param;
  
  startPlay();
}

function songFilename(song){
  if(typeof song.transcodedSuffix !== 'undefined')
    return songsDir+song.id+'.'+song.transcodedSuffix;
  else
    return songsDir+song.id+'.'+song.suffix;
}

function playSong(song){
  if(cacheEnable !== '0'){ // check if already on cache
    var req = sdcard.get(songFilename(song));
    
    req.onsuccess = function(){
      audio.src = URL.createObjectURL(this.result);
      startPlay();
    };
    
    req.onerror = function(){
      directPlaySong(song);
    };
  }else{
    directPlaySong(song);
  }
}

function startPlaylist(){
  if(playList.length > 0){
    if(cacheEnable !== '0'){
      downloadSong(playList);
    }
    indexOfPlaying = 0;
    playSong(playList[indexOfPlaying]);
  }
}

function saveSong(blob, song){
  var req = sdcard.addNamed(blob, songFilename(song));
  
  req.onsuccess = function(){
    console.log('Save the song: '+this.result);
  };
  
  req.onerror = function(){
    console.error('Unable to save the song ('+song.title+'): '+this.error.message);
  };
  
  downloadSong();
}

function downloadSong(songs){
	if(cacheEnable === '0'){
		console.error('[downloadSong] cache is disable');
		return;
	}
	
  if(typeof songs !== 'undefined')
    downloadList = downloadList.concat(songs);
  
  if(downloadList.length > 0){
    downloadCoverArt(downloadList[0]);
    
    var req = sdcard.get(songFilename(downloadList[0]));
    
    req.onsuccess = function(){
      downloadList.splice(0, 1);
      downloadSong();
    };
    
    req.onerror = function(){
      fsub.stream(saveSong, downloadList[0]);
      downloadList.splice(0, 1);
    };
  }
}

function saveCoverArt(blob, song){
  var req = sdcard.addNamed(blob, coverArtDir+song.coverArt+'.jpeg');
  
  req.onsuccess = function(){
    console.log('Save the song: '+this.result);
  };
  
  req.onerror = function(){
    console.error('Unable to save the cover ('+song.title+'): '+this.error.message);
  };
}

function downloadCoverArt(song){
  var req = sdcard.get(coverArtDir+song.coverArt+'.jpeg');
  
  req.onerror = function(){
    fsub.getCoverArt(saveCoverArt, song);
  };
}

audio.addEventListener("ended", function(){ // play next in playlist
    indexOfPlaying++;
    if(typeof playList[indexOfPlaying] !== 'undefined'){
        playSong(playList[indexOfPlaying]);
    }else{
        indexOfPlaying=0;
        $("#title").html('FSub');
        $("#songTitle").html('FSub');
        $("#coverInPlayer").attr("src", "img/cover-cd-128.png");
    }
}, false);
