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

var currentSongList = [];

var sdcard = null;
var cacheEnable = null;
var cacheDir = '';
var songsDir = '';
var coverArtDir = '';

var currentMainView = VIEW_ALBUM_LIST;

function showAlbumList(data) {
	if (data.status === 'failed')
		return;

	$("#listview").empty();

	currentMainView = VIEW_ALBUM_LIST;

	$.each(data.albumList2.album, function(i, album) {
		$("#listview").append('<li id="' + album.id + '"><a href="#"><img src="img/cover-cd-128.png"><h2>' + album.name + '</h2><p>' + album.artist + '</p></a></li>');
	});

	$("#listview").listview("refresh");
}

function showArtistList(data) {
	if (data.status === 'failed')
		return;

	$("#listview").empty();
	currentMainView = VIEW_ARTIST_LIST;

	$.each(data.artists.index, function(i, index) {
		if (typeof index.artist.id !== 'undefined') {
			var artist = index.artist;
			$("#listview").append('<li id="' + artist.id + '"><a href="#"><img src="img/cover-cd-128.png"><h2>' + artist.name + '</h2><p>' + artist.albumCount + ' album(s)</p></a></li>');
			$("#listview").listview("refresh");
		} else {
			$.each(index.artist, function(j, artist) {
				$("#listview").append('<li id="' + artist.id + '"><a href="#"><img src="img/cover-cd-128.png"><h2>' + artist.name + '</h2><p>' + artist.albumCount + ' album(s)</p></a></li>');
				$("#listview").listview("refresh");
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
		var album = data.artist.album;
		$("#listview").append('<li id="' + album.id + '"><a href="#"><img src="img/cover-cd-128.png"><h2>' + album.name + '</h2><p>' + album.artist + '</p></a></li>');
	} else {
		$.each(data.artist.album, function(i, album) {
			$("#listview").append('<li id="' + album.id + '"><a href="#"><img src="img/cover-cd-128.png"><h2>' + album.name + '</h2><p>' + album.artist + '</p></a></li>');
		});
	}
	$("#listview").listview("refresh");
}

function showAlbum(data) {
	if (data.status === 'failed')
		return;

	$("#pSong h1").html(data.album.name);
	$("#songList").empty();
	$(":mobile-pagecontainer").pagecontainer("change", "#pSong");

	currentSongList = data.album.song;

	$.each(data.album.song, function(i, song) {
		$("#songList").append('<input id="sg-' + song.id + '" type="checkbox"><label for="sg-' + song.id + '">' + song.title + ' (' + song.artist + ')</label>');
	});
	$("#songList input").checkboxradio({
		defaults: true
	});
}

function showSearch(data) {
  if (data.status === 'failed')
    return;
  
  $("#pSong h1").html("Search");
	$("#songList").empty();
	$(":mobile-pagecontainer").pagecontainer("change", "#pSong");
  
	currentSongList = data.searchResult3.song;
  
	$.each(data.searchResult3.song, function(i, song) {
		$("#songList").append('<input id="sg-' + song.id + '" type="checkbox"><label for="sg-' + song.id + '">' + song.title + ' (' + song.artist + ')</label>');
	});
	$("#songList input").checkboxradio({
		defaults: true
	});
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
	if ($("#opCacheEnable").val())
		$("#opCacheDir").selectmenu("enable");
	else
		$("#opCacheDir").selectmenu("disable");

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
	fsub.getAlbumList2(showAlbumList);
});

$("#goArtistList").click(function() {
	fsub.getArtists(showArtistList);
});

$("#playAll").click(function() {
	playList = currentSongList;
	startPlaylist();
	$(":mobile-pagecontainer").pagecontainer("change", "#pPlayer");
});

$("#playSelected").click(function() {
	alert($("#songList").children().attr('id'));
});

$("#downloadSongs").click(function() {
	if (cacheEnable === '0')
		alert(_('download-nok'));
	else
		downloadSong(currentSongList);
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
	if (cacheEnable !== '0') {
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

$("#playerSongInfos").bind("overflow", function() {
	$("#playerSongInfos").addClass("marquee");
});

$("#playerSongInfos").bind("underflow", function() {
	$("#playerSongInfos").removeClass("marquee");
});

$(function() {
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
			fsub.getAlbumList2(showAlbumList);
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
