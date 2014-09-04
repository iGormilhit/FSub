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

var ALBUM_LIST_TYPE = 'alphabeticalByName';
var ALBUM_LIST_SIZE = 15;

var VIEW_ALBUM_LIST = 0;
var VIEW_ARTIST_LIST = 1;

var fsub = null;

var currentSongList = [];

var sdcard = null;
var cacheEnable = null;
var cacheDir = '';
var songsDir = '';
var coverArtDir = '';

var currentMainView = VIEW_ALBUM_LIST;
var currentAlbumOffset = -1;

function addAlbumItem(album){
  $("#listview").append('<li id="' + album.id + '"><a href="#"><img src="img/cover-cd-128.png"><h2>' + album.name + '</h2><p>' + album.artist + '</p></a></li>');
    
  if(typeof album.coverArt !== 'undefined' && cacheEnable !== '0'){
    var req = sdcard.get(coverArtDir+album.coverArt+'.jpeg');
    
    req.onsuccess = function(){
      $("#"+album.id+" a").find("img").attr("src", URL.createObjectURL(this.result));
    };
    
    req.onerror = function(){
      downloadCoverArt(album);
    };
  }else if(typeof album.coverArt !== 'undefined'){
    var param = '?u='+encodeURIComponent(fsub.username);
    param += '&p='+encodeURIComponent(fsub.password);
    param += '&v='+encodeURIComponent(fsub.version);
    param += '&c='+encodeURIComponent(fsub.appname);
    param += '&id='+album.coverArt;
    param += '&f=json';
    $("#"+album.id+" a").find("img").attr("src", fsub.server+'getCoverArt.view'+param);
  }
  
  $("#listview").listview("refresh");
}

function addArtistItem(artist){
  $("#listview").append('<li id="' + artist.id + '"><a href="#"><img src="img/cover-cd-128.png"><h2>' + artist.name + '</h2><p>' + artist.albumCount + ' album(s)</p></a></li>');

  if(typeof artist.coverArt !== 'undefined' && cacheEnable !== '0'){
    var req = sdcard.get(coverArtDir+artist.coverArt+'.jpeg');
    
    req.onsuccess = function(){
      $("#"+artist.id+" a").find("img").attr("src", URL.createObjectURL(this.result));
    };
    
    req.onerror = function(){
      downloadCoverArt(artist);
    };
  }else if(typeof artist.coverArt !== 'undefined'){
    var param = '?u='+encodeURIComponent(fsub.username);
    param += '&p='+encodeURIComponent(fsub.password);
    param += '&v='+encodeURIComponent(fsub.version);
    param += '&c='+encodeURIComponent(fsub.appname);
    param += '&id='+artist.coverArt;
    param += '&f=json';
    $("#"+artist.id+" a").find("img").attr("src", fsub.server+'getCoverArt.view'+param);
  }
  
  $("#listview").listview("refresh");
}

function addSongItem(song, idList){
  $("#songList").append('<input value="'+idList+'" id="sg-' + song.id + '" type="checkbox"><label for="sg-' + song.id + '">' + song.title + ' (' + song.artist + ')</label>');
  
  $("#songList input").checkboxradio({
		defaults: true
	});
}

function showAlbumList(data) {
	if (data.status === 'failed')
		return;

	$("#listview").empty();
  
	currentMainView = VIEW_ALBUM_LIST;
  currentAlbumOffset = 0;
  loadAlbumList(data);
}

function loadAlbumList(data){
  if(typeof data.albumList2.album.id !== 'undefined'){
    addAlbumItem(data.albumList2.album);
  }else{
    $.each(data.albumList2.album, function(i, album) {
      addAlbumItem(album);
    });
  }
}

function showArtistList(data) {
	if (data.status === 'failed')
		return;

	$("#listview").empty();
	currentMainView = VIEW_ARTIST_LIST;

	$.each(data.artists.index, function(i, index) {
		if (typeof index.artist.id !== 'undefined') {
			addArtistItem(index.artist);
		} else {
			$.each(index.artist, function(j, artist) {
				addArtistItem(artist);
			});
		}
	});
}

function showAlbumListByArtist(data) {
	if (data.status === 'failed')
		return;

	$("#listview").empty();

	currentMainView = VIEW_ALBUM_LIST;
	if (typeof data.artist.album.id !== 'undefined') {
		addAlbumItem(data.artist.album);
	} else {
		$.each(data.artist.album, function(i, album) {
			addAlbumItem(album);
		});
	}
}

function showAlbum(data) {
	if (data.status === 'failed')
		return;
  
	$("#pSong h1").html(data.album.name);
	$("#songList").empty();
	$(":mobile-pagecontainer").pagecontainer("change", "#pSong");

	if(typeof data.album.song.id !== 'undefined'){ // one song only
    currentSongList = [data.album.song];
    addSongItem(data.album.song, 0);
  }else{
    currentSongList = data.album.song;
    $.each(data.album.song, function(i, song) {
      addSongItem(song, i);
    });
  }
}

function showSearch(data) {
  if (data.status === 'failed')
    return;
  
  $("#pSong h1").html("Search");
	$("#songList").empty();
	$(":mobile-pagecontainer").pagecontainer("change", "#pSong");
  
	if(typeof data.searchResult3.song.id !== 'undefined'){ // only one song
    currentSongList = [data.searchResult3.song];
    addSongItem(data.searchResult3.song, 0);
  }else{
    $.each(data.searchResult3.song, function(i, song) {
      currentSongList = data.searchResult3.song;
      addSongItem(song, i);
    });
  }
}

function refreshPlayList(){
    if(playList.length === 0)
        return;
    
    $("#playlist").empty();
    for(var i=0;i<playList.length;i++){
        $("#playlist").append('<a href="#" class="ui-btn ui-corner-all" id="pl-'+i+'">'+playList[i].title+' ('+playList[i].artist+')</a>');
    }
    
    updateSongPlaying();
}

function updateSongPlaying(){
    $("#playlist").find(".ui-icon-play").removeClass("ui-icon-play ui-btn-icon-left"); // remove previous icon play
    
    if(indexOfPlaying !== -1){
        $("#pl-"+indexOfPlaying).addClass("ui-icon-play ui-btn-icon-left");
    }
}

function showOptions() {
	$(":mobile-pagecontainer").pagecontainer("change", "#pOptions");

	var server = localStorage.getItem("server");
	var username = localStorage.getItem("username");
	var password = localStorage.getItem("password");

	if (server !== null) {
		$("#opServer").val(server);
		$("#opUsername").val(username);
		password = password.substr(4, password.length); // get only after 'enc:'
		password = hexToString(password); // convert hex to string
		$("#opPassword").val(password);
	}

	var sdcards = navigator.getDeviceStorages("sdcard");
	// disable cache option if non SDcard
	// on Firefox simulator, have one SDcard but not have name
	if (sdcards.length === 0 || sdcards[0].storageName === '') {
		$("#opCacheEnable").slider("disable");
		$("#opCacheDir").selectmenu("disable");
    $("#clearCache").addClass("ui-state-disabled");
	} else {
		$("#opCacheEnable").slider("enable");
    
		$("#opCacheDir").empty();
		for (var i = 0; i < sdcards.length; i++)
			$("#opCacheDir").append('<option value="' + sdcards[i].storageName + '">' + sdcards[i].storageName + '</option>');

		var cacheEnable = localStorage.getItem("cacheEnable");
		var cacheDir = localStorage.getItem("cacheDir");

		if (cacheEnable !== null && cacheEnable === '1') {
			$("#opCacheEnable").val(1);
			$("#opCacheDir").selectmenu("enable");
			$("#opCacheDir option[value=" + cacheDir + "]").attr("selected", "selected");
		} else { // disable cache dir if cache is off
			$("#opCacheEnable").val(0);
			$("#opCacheDir").selectmenu("disable");
      $("#clearCache").addClass("ui-state-disabled");
		}

		$("#opCacheEnable").slider("refresh");
		$("#opCacheDir").selectmenu("refresh");
	}
}

function testPing(data) {
	$("#test.Server").button("enable");
	if (data.status === 'ok')
		alert(_('test-ok'));
	else
		alert(_('test-nok', {
			msg: data.error.message
		}));
}

$("#listview").delegate("li", "click", function() {
	var id = $(this).attr('id');

	switch (currentMainView) {
		case VIEW_ALBUM_LIST:
			fsub.getAlbum(showAlbum, id);
			break;
		case VIEW_ARTIST_LIST:
			fsub.getArtist(showAlbumListByArtist, id);
			break;
	}
});

$("#opCacheEnable").on("change", function() {
	if ($("#opCacheEnable").val() === "1"){
		$("#opCacheDir").selectmenu("enable");
    $("#clearCache").removeClass("ui-state-disabled");
	}else{
		$("#opCacheDir").selectmenu("disable");
    $("#clearCache").addClass("ui-state-disabled");
  }
	$("#opCacheDir").selectmenu("refresh");
});

$("#fSearch").submit(function(e){
  e.preventDefault();
  var str = $("#search").val();
  if(str.length > 2){
    fsub.search3(showSearch, str);
  }
});

$("#goAlbumList").click(function() {
  fsub.getAlbumList2(showAlbumList, ALBUM_LIST_TYPE, ALBUM_LIST_SIZE);
});

$("#goArtistList").click(function() {
	fsub.getArtists(showArtistList);
});

function getSelectedSongs(){
	var list = [];
	var nbSongsSelected = $("#songList input:checked").length;
	
	if(nbSongsSelected > 0){
		$("#songList input:checked").each(function(){
			var idList = $(this).val();
			list.push(currentSongList[idList]);
		});
	}
	
	return list;
}

$("#playSongs").click(function() {
	playList = getSelectedSongs();
	
	if(playList.length === 0) // play all is non selected
		playList = currentSongList;
	
	refreshPlayList();
	$(":mobile-pagecontainer").pagecontainer("change", "#pPlayer");
	startPlaylist();
});

$("#addSongs").click(function(){
	var list = getSelectedSongs();
	if(list.length === 0)
		playList = playList.concat(currentSongList);
	else
		playList = playList.concat(list);
	
	refreshPlayList();
});

$("#downloadSongs").click(function() {
	if (cacheEnable === '0')
		alert(_('download-nok'));
	else{
		var list = getSelectedSongs();
		if(list.length === 0) // download all
			downloadSong(currentSongList);
		else
			downloadSong(list);
	}
});

$("#goOptions").click(function() {
	showOptions();
});

$("#testServer").click(function() {
	var server = $("#opServer").val();
	var username = $("#opUsername").val();
	var password = $("#opPassword").val();

	if (server === '' || username === '' || password === '') {
		alert(_('fill-all-parameters'));
		return;
	}

	var t_fsub = new Subsonic(username, 'enc:' + stringToHex(password), server, SUB_API_CLIENT, SUB_API_VERSION);
	$("#test.Server").button("disable");
	t_fsub.ping(testPing);
});

$("#clearCache").click(function() {
	if (cacheEnable === '0') {
		alert(_('cache-disabled'));
	} else if (confirm(_('confirm-clear-cache'))) {
		var req = sdcard.delete(cacheDir);

		req.onsuccess = function() {
			console.log(cacheDir + ' successfully removed');
			alert(_('clear-cache-ok'));
		};

		req.onerror = function() {
			console.error('Unable to remove ' + cacheDir);
			alert(_('clear-cache-nok'));
		};
	}
});

$("#resetFSub").click(function() {
	if (confirm(_('confirm-rest-fsub'))) {
		localStorage.clear();
		location.href = 'index.html';
	}
});

$("#opSave").click(function() {
	var server = $("#opServer").val();
	var username = $("#opUsername").val();
	var password = $("#opPassword").val();

	var cacheEnable = $("#opCacheEnable").val();
	var cacheDir = $("#opCacheDir").val();

	if (server === '' || username === '' || password === '') {
		alert(_('fill-all-parameters'));
		return;
	}

	localStorage.setItem("server", server);
	localStorage.setItem("username", username);
	localStorage.setItem("password", 'enc:' + stringToHex(password));

	localStorage.setItem("cacheEnable", cacheEnable);
	localStorage.setItem("cacheDir", cacheDir);

	location.href = 'index.html';
});

$("#goPlayer").click(function() {
	$(":mobile-pagecontainer").pagecontainer("change", "#pPlayer");
});

$("#playerPlayOrPause").click(function() {
	PlayPause();
});

$("#playerStop").click(function() {
	stop();
});

$("#playerPrevious").click(function() {
	playPrevious();
});

$("#playerNext").click(function() {
	playNext();
});

$("#goAbout").click(function() {
	$(":mobile-pagecontainer").pagecontainer("change", "#pAbout");
});

$(document).scroll(function(){
  if($(window).scrollTop() + $(window).height() === $(document).height() && currentMainView === VIEW_ALBUM_LIST){
    console.log('loading...');
    currentAlbumOffset += ALBUM_LIST_SIZE;
    fsub.getAlbumList2(loadAlbumList, ALBUM_LIST_TYPE, ALBUM_LIST_SIZE, currentAlbumOffset);
  }
});

$(function() {
  $.getJSON("manifest.webapp", function(json){
    $("#fsubVersion").html(json.version);
  });
  
	var server = localStorage.getItem("server");
	var username = localStorage.getItem("username");
	var password = localStorage.getItem("password");

	if (server === null || username === null || password === null) {
		showOptions();
	} else {
		fsub = new Subsonic(username, password, server, SUB_API_CLIENT, SUB_API_VERSION);
		if (fsub === null) {
			alert(_('server-connection-nok'));
		} else {
			fsub.getAlbumList2(showAlbumList, ALBUM_LIST_TYPE, ALBUM_LIST_SIZE);
			cacheEnable = localStorage.getItem('cacheEnable');
			if (cacheEnable !== '0') {
				sdcard = navigator.getDeviceStorage('sdcard');
				cacheDir = '/' + localStorage.getItem('cacheDir') + '/subsonic/';
				songsDir = cacheDir + 'songs/';
				coverArtDir = cacheDir + 'coverArt/';
			}
		}
	}
});
