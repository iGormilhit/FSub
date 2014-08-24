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
var currentSongList = [];

var sd = navigator.getDeviceStorage('sdcard');

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

function saveSong(blob, song, play){
  var req = sd.addNamed(blob, '/extsdcard/subsonic/'+song.path);
  req.onsuccess = function(){
    console.log(this.result);
    }
  req.onerror = function(){
    console.warn(this.error);
  }
  
  if(typeof play !== 'undefined' && play){
    audio.src = URL.createObjectURL(blob);
    audio.play();
  }
}

function startPlaylist(){
  $.each(playList, function(i, song){
    if(i === 0)
      fsub.stream(saveSong, song, true);
    /*else
      fsub.stream(saveSong, song);*/
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
  var oServer = localStorage.getItem("server");
  var oUsername = localStorage.getItem("username");
  var oPassword = localStorage.getItem("password");
  
  if(oServer !== null){
    $("#opServer").val(oServer);
    $("#opUsername").val(oUsername);
    $("#opPassword").val(oPassword);
  }
  
  $(":mobile-pagecontainer").pagecontainer( "change", "#pOptions");
});

$("#testServer").click(function(){
  var oServer = $("#opServer").val();
  var oUsername = $("#opUsername").val();
  var oPassword = $("#opPassword").val();
  
  if(oServer === '' || oUsername === '' || oPassword === ''){
    alert('Merci de remplir les paramètres');
    return;
  }
  
  var t_fsub = new Subsonic(oUsername, 'enc:'+stringToHex(oPassword), oServer, SUB_API_CLIENT, SUB_API_VERSION);
  $("#test.Server").button("disable");
  t_fsub.ping(testPing);
});

$("#opSave").click(function(){
  var oServer = $("#opServer").val();
  var oUsername = $("#opUsername").val();
  var oPassword = $("#opPassword").val();
  
  if(oServer === '' || oUsername === '' || oPassword === ''){
    alert('Merci de remplir les paramètres');
    return;
  }
  
  localStorage.setItem("server", oServer);
  localStorage.setItem("username", oUsername);
  localStorage.setItem("password", 'enc:'+stringToHex(oPassword));
  
  location.href = 'index.html';
});

$(function(){
  var server = localStorage.getItem("server");
  var username = localStorage.getItem("username");
  var password = localStorage.getItem("password");
  
  if(server === null || username === null || password === null){
    $(":mobile-pagecontainer").pagecontainer( "change", "#pOptions");
  }else{
    fsub = new Subsonic(username, password, server, SUB_API_CLIENT, SUB_API_VERSION);
    if(fsub === null){
      alert('Paramètre du serveur incorrect');
    }else{
      fsub.getAlbumList2(showAlbumList);
    }
  }
});
