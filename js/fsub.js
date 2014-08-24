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
var SIZE_ALBUM_LIST = 10;

var server = "";
var username = "";
var password = "";

var albumListOffset = 0;
var idAlbumList = [];
var idSongList = [];
var idSongListOfPlaylist = [];
var indexOfPlaying = -1;
var songPlaying = null;

var fsub = null;

var audio = new Audio();
audio.preload = 'auto';
audio.mozAudioChannelType = 'content';

var sd = navigator.getDeviceStorage('sdcard');

function setCookie(cname, cvalue, exdays){
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+d.toGMTString();
	document.cookie = cname + "=" + cvalue + "; " + expires;
}

function delCookie(cname){
    if(getCookie(cname) !== ""){
        document.cookie = cname + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
    }
}

function getCookie(cname){
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length,c.length);
    }
    return "";
}

function stringToHex(str){
	var hex ='';
    for(var i=0;i<str.length;i++){
        hex += str.charCodeAt(i).toString(16);
    }
    
    return hex;
}

function setUserInfo(){
    var user = fsub.getUser(username);
    if(user.status === 'ok' && user.user.coverArtRole)
        $("#panelUserInfo").html('<img height="80" width="80" src="'+server+'getAvatar.view?u='+username+'&p='+password+'&username='+username+'&v='+SUB_API_VERSION+'&c='+SUB_API_CLIENT+'" alt="User Avatar"><h2>'+username+'</h2><p>'+server+'</p>');
    else
        $("#panelUserInfo").html('<img height="80" width="80" src="img/avatar.png" alt="User Avatar"><h2>'+username+'</h2><p>'+server+'</p>');
    $("#panel ul").listview("refresh");
}

function addAlbum(album){
    if(idAlbumList.indexOf(album.id) !== -1) return; // return if album is already added
    
    var item = '<li id="'+album.id+'"><a href="#">';
    
    if(typeof album.coverArt === 'undefined'){
    	item += '<img src="img/cover-cd-128.png">';
    }else if(album.songCount>0){
    	var req = fsub.getAlbum(album.id);
    	
    	if(req.album.songCount === 1)
    		item += '<img src="'+server+"getCoverArt.view?u="+username+"&p="+password+"&id="+req.album.song.id+"&size=160&v="+SUB_API_VERSION+"&c="+SUB_API_CLIENT+'">';
	    else{
		    item += '<img src="'+server+"getCoverArt.view?u="+username+"&p="+password+"&id="+req.album.song[0].id+"&size=160&v="+SUB_API_VERSION+"&c="+SUB_API_CLIENT+'">';
	    }
    }else{
    	item += '<img src="img/cover-cd-128.png">';
    }
    
    item += '<h2>'+album.name+'</h2>';
    item += '<p>'+album.artist+'</p>';
    item += '</a></li>';
    $("#albumsList").append(item);
    $("#albumsList").listview("refresh");
    idAlbumList.push(album.id);
}

function goHome(refresh){
    $("#songList").hide();
    $("#playlist").hide();
    $("#albums").show();
    
    if(typeof refresh === 'undefined' || refresh){ // refresh album list
        $("#albumsList").empty();
        
        albumListOffset = 0;
        idAlbumList = [];
        
        var albumList = fsub.getAlbumList2('alphabeticalByArtist', SIZE_ALBUM_LIST);
        if(typeof albumList.albumList2.album !== 'undefined'){
            $.each(albumList.albumList2.album, function(key, album){
                addAlbum(album);
            });
        }
    }
}

function goPlaylist(){
    $("#albums").hide();
    $("#songList").hide();
    
    $("#playlist").show();
    
    $.each(idSongListOfPlaylist, function(key, id){
        var req = fsub.getSong(id);
        if(typeof req.song !== 'undefined' && !req.song.isVideo){
            var hr = Math.floor(req.song.duration / 3600);
            var min = Math.floor((req.song.duration - hr * 3600) / 60);
            var sec = req.song.duration - hr * 3600 - min * 60;
            
            var duration = hr < 10 ? '0'+hr.toString()+':' : hr.toString()+':';
            duration += min < 10 ? '0'+min.toString()+':' : min.toString()+':';
            duration += sec < 10 ? '0'+sec.toString() : sec.toString();
            
            $("#songInPlaylist").append('<li id="'+req.song.id+'">'+req.song.title+' ('+duration+')</li>');
            $("#songInPlaylist").listview("refresh");
        }
    });
}

function moreAlbums(){
    albumListOffset++;
    var albumList = fsub.getAlbumList2('alphabeticalByArtist', SIZE_ALBUM_LIST, SIZE_ALBUM_LIST*albumListOffset);
    if(typeof albumList.albumList2.album !== 'undefined'){
        $.each(albumList.albumList2.album, function(key, album){
            addAlbum(album);
        });
    }
}

function addSong(song){
    if(!song.isVideo){ // add only music
        var hr = Math.floor(song.duration / 3600);
        var min = Math.floor((song.duration - hr * 3600) / 60);
        var sec = song.duration - hr * 3600 - min * 60;
        
        var duration = hr < 10 ? '0'+hr.toString()+':' : hr.toString()+':';
        duration += min < 10 ? '0'+min.toString()+':' : min.toString()+':';
        duration += sec < 10 ? '0'+sec.toString() : sec.toString();
        
        $("#song").append('<li id="'+song.id+'">'+song.title+' ('+duration+')</li>');
        $("#song").listview("refresh");
        idSongList.push(song.id);
    }
}

function showSong(id){
    $("#albums").hide();
    $("#song").empty();
    $("#songList").show();
    
    idSongList = [];
    
    var req = fsub.getAlbum(id);
    
    if(typeof req.album === 'undefined') return;
    else if(req.album.songCount === 1) addSong(req.album.song);
    else{
	    $.each(req.album.song, function(key, song){
	        addSong(song);
	    });
    }
}

function playSong(id){
    var req = fsub.getSong(id);
    if(typeof req.song !== 'undefined' && !req.song.isVideo){
        audio.src = server+"stream.view?u="+username+"&p="+password+"&id="+id+"&v="+SUB_API_VERSION+"&c="+SUB_API_CLIENT;
        audio.play();
        songPlaying = req.song;
    }
}

function refreshPlayer(){
    if(songPlaying !== null && !audio.paused){
        $("#currentPlaying").html(songPlaying.artist+" - "+songPlaying.title);
        var pos = parseInt(audio.currentTime*100/audio.duration);
        $("#sliderPlayer").val(pos);
        $("#sliderPlayer").slider("refresh");
    }
}

$("#fLogon").submit(function(e){
    server = $("#server").val();
    username = $("#username").val();
    password = $("#password").val();
    if(server.search(/^(https?):(\/\/[a-zA-Z0-9\.-]+\.[a-z]{2,4})\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/) !== -1){ // valid URL?
        if(server.search(/\/rest\/$/) === -1 && server.search(/\/$/) === -1) server += '/rest/';
        else if(server.search(/\/rest\/$/) === -1 && server.search(/\/$/) !== -1) server += 'rest/';
        else if(server.search(/\/$/) === -1) server += '/';
        
        fsub = new Subsonic(username, 'enc:'+stringToHex(password), server, SUB_API_CLIENT, 'json', SUB_API_VERSION);
        var req = fsub.ping();
        if(req.status === 'ok'){
            setCookie("server", server, 30);
            setCookie("username", username, 30);
            setCookie("password", 'enc:'+stringToHex(password), 30);
            
            $("#fLogon").hide();
            $("#btnPanel").show();
            $("#home").show();
            $("#fSearch").show();
            $("#player").show();
            $("#footer").show();
            
            setUserInfo();
            goHome();
        }else{
            alert('Error : '+req.error.message);
        }
    }else{
        alert('Adresse du serveur incorrect!');
    }
    
    e.preventDefault();
});

$("#albumsList").delegate("li", "click", function(){
    var id = $(this).attr('id');
    showSong(id);
});

$("#song").delegate("li", "click", function(){
    var id = $(this).attr('id');
    
    idSongListOfPlaylist = [];
    idSongListOfPlaylist[0] = id;
    indexOfPlaying = 0;
    
    playSong(id);
});

$("#logoff").click(function(){
    delCookie('server');
    delCookie('username');
    delCookie('password');
    
    // stop playing if need
    audio.pause();
    audio.src = '';
    
    location.reload();
});

$("#albumsMore").click(function(){
    moreAlbums();
});

$("#fSearch").submit(function(e){
    query = $("#search").val();
    
    if(query.length > 2){
        $("#albums").hide();
        $("#song").empty();
        $("#songList").show();
        
        idSongList = [];
        
        var req = fsub.search3(query);
        if(req.searchResult3.song !== 'undefined'){
            $.each(req.searchResult3.song, function(key, song){
                addSong(song);
            });
        }
    }
    
    e.preventDefault();
});

$("#pauseOrPlay").click(function(){
    if(audio.duration > 0 && !audio.paused){ // paused
        audio.pause();
    }else if(audio.duration > 0 && audio.paused){
        audio.play();
    }else{
        console.log(audio.duration);
    }
});

$("#playPrevious").click(function(){
    if(typeof idSongListOfPlaylist[indexOfPlaying-1] === 'undefined')
        return;
    
    indexOfPlaying--;
    playSong(idSongListOfPlaylist[indexOfPlaying]);
});

$("#playNext").click(function(){
    if(typeof idSongListOfPlaylist[indexOfPlaying+1] === 'undefined')
        return;
    
    indexOfPlaying++;
    playSong(idSongListOfPlaylist[indexOfPlaying]);
});

$("#volPlus").click(function(){
    if(audio.volume < 1)
        audio.volume = (audio.volume + 0.1).toFixed(1); // toFixed to have one decimal
});

$("#volMinus").click(function(){
    if(audio.volume > 0)
        audio.volume = (audio.volume - 0.1).toFixed(1);
});

$("#goHome").click(function(){
    goHome(false);
});

$("#goPlaylist").click(function(){
    goPlaylist();
});

$("#playAll").click(function(){
    if($("#songList").is(":hidden")) return; // @home do nothing
    
    idSongListOfPlaylist = idSongList;
    indexOfPlaying = 0;
    playSong(idSongListOfPlaylist[indexOfPlaying]);
});

$("#addToPlaylist").click(function(){
    if($("#songList").is(":hidden")) return; // @home do nothing
    
    idSongListOfPlaylist = idSongListOfPlaylist.concat(idSongList);
});

audio.addEventListener("ended", function(){ // play next in playlist
    indexOfPlaying++;
    if(typeof idSongListOfPlaylist[indexOfPlaying] !== 'undefined'){
        playSong(idSongListOfPlaylist[indexOfPlaying]);
    }else{
        indexOfPlaying=0;
        $("#currentPlaying").html("");
        $("#sliderPlayer").val(0);
        $("#sliderPlayer").slider("refresh");
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

$(function(){
    // check if already logon
    if(getCookie("server") !== ''){
        server = getCookie("server");
        username = getCookie("username");
        password = getCookie("password");
        $("#fLogon").hide();
        fsub = new Subsonic(username, password, server, SUB_API_CLIENT, 'json', SUB_API_VERSION);
        setUserInfo();
        goHome();
    }else{
        $("#btnPanel").hide();
        $("#home").hide();
        $("#albums").hide();
        $("#songList").hide();
        $("#fSearch").hide();
        $("#player").hide();
        $("#footer").hide();
    }
    
    $("#playlist").hide();
    
    setInterval(refreshPlayer, 1000);
});
