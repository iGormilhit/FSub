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
var SUB_API_VERSION = "1.8.0";
var SUB_API_CLIENT = "FSub";

var VIEW_ALBUM_LIST = 0;
var VIEW_ARTIST_LIST = 1;

var fsub = null;
var audio = new Audio();
audio.preload = 'auto';
audio.mozAudioChannelType = 'content';

var playList = [];
var indexOfPlaying = -1;

var currentSongList = [];

var sdcard = null;
var cacheEnable = null;
var cacheDir = '';

var currentMainView = VIEW_ALBUM_LIST;

function showAlbumList(data){
    if(data.status === 'failed')
        return;
    
    $("#listview").empty();
    
    currentMainView = VIEW_ALBUM_LIST;
    
    $.each(data.albumList2.album, function(i, album){
        $("#listview").append('<li id="'+album.id+'"><a href="#"><img src="img/cover-cd-128.png"><h2>'+album.name+'</h2><p>'+album.artist+'</p></a></li>');
    });
    
    $("#listview").listview("refresh");
}

function showArtistList(data){
    if(data.status === 'failed')
        return;
    
    $("#listview").empty();
    currentMainView = VIEW_ARTIST_LIST;
    
    $.each(data.artists.index, function(i, index){
        if(typeof index.artist.id !== 'undefined'){
          var artist = index.artist;
          $("#listview").append('<li id="'+artist.id+'"><a href="#"><img src="img/cover-cd-128.png"><h2>'+artist.name+'</h2><p>'+artist.albumCount+' album(s)</p></a></li>');
          $("#listview").listview("refresh");
        }else{
          $.each(index.artist, function(j, artist){
              $("#listview").append('<li id="'+artist.id+'"><a href="#"><img src="img/cover-cd-128.png"><h2>'+artist.name+'</h2><p>'+artist.albumCount+' album(s)</p></a></li>');
              $("#listview").listview("refresh");
          });
        }
    });
}

function showAlbumListByArtist(data){
    if(data.status === 'failed')
        return;
    
    $("#listview").empty();
    
    currentMainView = VIEW_ALBUM_LIST;
    if(typeof data.artist.album.id !== 'undefined'){
      var album = data.artist.album;
      $("#listview").append('<li id="'+album.id+'"><a href="#"><img src="img/cover-cd-128.png"><h2>'+album.name+'</h2><p>'+album.artist+'</p></a></li>');
    }else{
      $.each(data.artist.album, function(i, album){
        $("#listview").append('<li id="'+album.id+'"><a href="#"><img src="img/cover-cd-128.png"><h2>'+album.name+'</h2><p>'+album.artist+'</p></a></li>');
      });
    }
    $("#listview").listview("refresh");
};

function playSong(song){
  if(cacheEnable !== '0'){
    var req = sdcard.get(cacheDir+song.path);
    
    req.onsuccess = function(){
      audio.src = URL.createObjectURL(this.result);
    }
    
    req.onerror = function(){
      fsub.stream(saveSong, song, true);
    }
  }else{
    var param = '?u='+encodeURIComponent(fsub.username);
    param += '&p='+encodeURIComponent(fsub.password);
    param += '&v='+encodeURIComponent(fsub.version);
    param += '&c='+encodeURIComponent(fsub.appname);
    param += '&id='+song.id;
    param += '&f=json';
    audio.src = fsub.server+'stream.view'+param;
  }
  
  audio.play();
  $("#title").html(song.title);
}

function saveSong(blob, song, play){
  var req = sdcard.addNamed(blob, cacheDir+song.path);
  
  req.onsuccess = function(){
    if(typeof play !== 'undefined' && play){
      playSong(song);
    }
  }
  
  req.onerror = function(){
    console.error('Unable to save the song: '+this.error.message);
  }
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
    }
}, false);

// Get form Gaia Music
// https://github.com/mozilla-b2g/gaia/blob/master/apps/music/js/Player.js
// paused when the headset is removed
var acm = navigator.mozAudioChannelManager;
if(acm){
    acm.addEventListener("headphoneschange", function(){
        if(!acm.headphones && audio.duration > 0 && !audio.paused){
            audio.pause();
        }
    });
}

function showAlbum(data){
    if(data.status === 'failed')
        return;
    
    $("#pSong h1").html(data.album.name);
    $("#songList").empty();
    $(":mobile-pagecontainer").pagecontainer( "change", "#pSong");
    
    currentSongList = data.album.song;
    
    $.each(data.album.song, function(i, song){
        $("#songList").append('<input id="sg-'+song.id+'" type="checkbox"><label for="sg-'+song.id+'">'+song.title+' ('+song.artist+')</label>');
    });
    $("#songList input").checkboxradio({defaults: true});
}

function showOptions(){
  $(":mobile-pagecontainer").pagecontainer( "change", "#pOptions");
  
  var server = localStorage.getItem("server");
  var username = localStorage.getItem("username");
  var password = localStorage.getItem("password");
  
  if(server !== null){
    $("#opServer").val(server);
    $("#opUsername").val(username);
    password = password.substr(4, password.length); // get only after 'enc:'
    password = hexToString(password); // convert hex to string
    $("#opPassword").val(password);
  }
  
  var sdcards = navigator.getDeviceStorages("sdcard");
  // disable cache option if non SDcard
  // on Firefox simulator, have one SDcard but not have name
  if(sdcards.length === 0 || sdcards[0].storageName === ''){
    $("#opCacheEnable").slider("disable");
    $("#opCacheDir").selectmenu("disable");
  }else{
    $("#opCacheEnable").slider("enable");
    
    $("#opCacheDir").empty();
    for(var i=0;i<sdcards.length;i++)
      $("#opCacheDir").append('<option value="'+sdcards[i].storageName+'">'+sdcards[i].storageName+'</option>');
    
    var cacheEnable = localStorage.getItem("cacheEnable");
    var cacheDir = localStorage.getItem("cacheDir");
    
    if(cacheEnable !== null && cacheEnable === '1'){
      $("#opCacheEnable").val(1);
      $("#opCacheDir").selectmenu("enable");
      $("#opCacheDir option[value="+cacheDir+"]").attr("selected", "selected");
    }else{ // disable cache dir if cache is off
      $("#opCacheEnable").val(0);
      $("#opCacheDir").selectmenu("disable");
    }
    
    $("#opCacheEnable").slider("refresh");
    $("#opCacheDir").selectmenu("refresh");
  }
}

function testPing(data){
  $("#test.Server").button("enable");
  if(data.status === 'ok')
    alert('Connexion OK');
  else
    alert('Error: '+data.error.message);
}

$("#listview").delegate("li", "click", function(){
    var id = $(this).attr('id');
    
    switch(currentMainView){
        case VIEW_ALBUM_LIST:
            fsub.getAlbum(showAlbum, id);
            break;
        case VIEW_ARTIST_LIST:
            fsub.getArtist(showAlbumListByArtist, id);
            break;
    }
});

$("#opCacheEnable").on("change", function(){
  if($("#opCacheEnable").val())
    $("#opCacheDir").selectmenu("enable");
  else
    $("#opCacheDir").selectmenu("disable");
  
  $("#opCacheDir").selectmenu("refresh");
});

$("#goAlbumList").click(function(){
    fsub.getAlbumList2(showAlbumList);
});

$("#goArtistList").click(function(){
    fsub.getArtists(showArtistList);
});

$("#btAllPlay").click(function(){
  playList = currentSongList;
  startPlaylist();
});

$("#goOptions").click(function(){
  showOptions();
});

$("#testServer").click(function(){
  var server = $("#opServer").val();
  var username = $("#opUsername").val();
  var password = $("#opPassword").val();
  
  if(server === '' || username === '' || password === ''){
    alert('Merci de remplir les paramètres');
    return;
  }
  
  var t_fsub = new Subsonic(username, 'enc:'+stringToHex(password), server, SUB_API_CLIENT, SUB_API_VERSION);
  $("#test.Server").button("disable");
  t_fsub.ping(testPing);
});

$("#reinitFSub").click(function(){
  if(confirm('Êtes-vous sûr de réinitialiser FSub ?')){
    localStorage.clear();
    location.href = 'index.html';
  }
});

$("#opSave").click(function(){
  var server = $("#opServer").val();
  var username = $("#opUsername").val();
  var password = $("#opPassword").val();
  
  var cacheEnable = $("#opCacheEnable").val();
  var cacheDir = $("#opCacheDir").val();
  
  if(server === '' || username === '' || password === ''){
    alert('Merci de remplir les paramètres');
    return;
  }
  
  localStorage.setItem("server", server);
  localStorage.setItem("username", username);
  localStorage.setItem("password", 'enc:'+stringToHex(password));
  
  localStorage.setItem("cacheEnable", cacheEnable);
  localStorage.setItem("cacheDir", cacheDir);
  
  location.href = 'index.html';
});

$(function(){
  $("#opPlayer").hide();
  
  var server = localStorage.getItem("server");
  var username = localStorage.getItem("username");
  var password = localStorage.getItem("password");
  
  if(server === null || username === null || password === null){
    showOptions();
  }else{
    fsub = new Subsonic(username, password, server, SUB_API_CLIENT, SUB_API_VERSION);
    if(fsub === null){
      alert('Paramètre du serveur incorrect');
    }else{
      fsub.getAlbumList2(showAlbumList);
      cacheEnable = localStorage.getItem('cacheEnable');
      if(cacheEnable !== '0'){
        sdcard = navigator.getDeviceStorage('sdcard');
        cacheDir = '/'+localStorage.getItem('cacheDir')+'/subsonic/';
      }
    }
  }
});
