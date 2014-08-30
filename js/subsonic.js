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

var SUBSONIC_ERROR_PARAM_MISSING = {status: "failed", error: {message: "Required parameter is missing.", code: 10}};

/* class Subsonic for API (see http://www.subsonic.org/pages/api.jsp)
 * 
 * @param
 * @return {Subsonic}
 */
function Subsonic(username, password, server, appname, version){
  if(server.search(/^(https?):(\/\/[a-zA-Z0-9\.-]+\.[a-z]{2,4})\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/) !== -1){ // valid URL?
    if(server.search(/\/rest\/$/) === -1 && server.search(/\/$/) === -1)
      this.server = server+'/rest/';
    else if(server.search(/\/rest\/$/) === -1 && server.search(/\/$/) !== -1)
      this.server = server+'rest/';
    else if(server.search(/\/$/) === -1)
      this.server = server+'/';
     else
      this.server = server;
  }else{
    console.error('Subsonic : Invalid URL');
    return null;
  }
  
	this.username = username;
	this.password = password;
	this.appname = appname;
	this.version = version;
}

/*
 * @param {string} path
 * @param {string} callback
 * @param {string} query
 */
Subsonic.prototype.query = function(path, callback, query){
	if(typeof path === 'undefined' || typeof callback === 'undefined'){ // must be defined
		console.error('[error] query : path and/or callback parameter must be defined');
		return;
	}
	
	// add default param
	var param = '?u='+encodeURIComponent(this.username);
	param += '&p='+encodeURIComponent(this.password);
	param += '&v='+encodeURIComponent(this.version);
	param += '&c='+encodeURIComponent(this.appname);
	param += '&f=json';
	
	// add optional param
	if(typeof query !== 'undefined'){
		for(var key in query){
			param += '&'+key+'='+query[key];
		}
	}

	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onreadystatechange = function(){
		if(xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 0)){
			obj = JSON.parse(xhr.responseText);
			callback(obj['subsonic-response']);
		}
	};
	xhr.open('GET', this.server+path+'.view'+param, true);
	xhr.send(null);
};

/*
 * http://your-server/rest/ping.view
 * @param {string} callback
 */
Subsonic.prototype.ping = function(callback){
	if(typeof callback === 'undefined'){
    	console.error('[error] ping : callback parameter must be defined');
    	return;
    }
	this.query('ping', callback);
};

/*
 * http://your-server/rest/getArtists.view
 */
Subsonic.prototype.getArtists = function(callback){
	if(typeof callback === 'undefined'){
    	console.error('[error] getArtists : callback parameter must be defined');
    	return;
    }
	this.query('getArtists', callback);
};

/*
 * http://your-server/rest/getArtist.view
 *
 * @param {number} id
 */
Subsonic.prototype.getArtist = function(callback, id){
	if(typeof callback === 'undefined' || typeof id == 'undefined'){
    	console.error('[error] getArtist : id and/or callback parameter must be defined');
    	return;
    }
	this.query('getArtist', callback, {id:id});
};

/*
 * http://your-server/rest/getUser.view
 *
 * @param {string} callback
 * @param {string} username
 */
Subsonic.prototype.getUser = function(callback, username){
    if(typeof callback === 'undefined' || typeof username === 'undefined'){
    	console.error('[error] getUser : username and/or callback parameter must be defined');
    	return;
    }
    
    this.query('getUser', callback, {username:username});
};

/*
 * http://your-server/rest/getAlbumList2.view
 *
 * @param {string} callback
 * @param {string} type
 * @param {number} size
 * @param {number} offset
 */
Subsonic.prototype.getAlbumList2 = function(callback, type, size, offset){
	if(typeof callback === 'undefined'){
    	console.error('[error] getAlbumList2 : callback parameter must be defined');
    	return;
    }
    
	// set optional parameters if needed
	if(typeof size === 'undefined')
    type='alphabeticalByArtist';
    
	if(typeof size === 'undefined')
    size=10;
    
	if(typeof offset === 'undefined')
    offset=0;
	
	this.query('getAlbumList2', callback, {type:type, size:size, offset:offset});
};

/*
 * http://your-server/rest/search3.view
 *
 * @param {string} callback
 * @param {number} query
 */
Subsonic.prototype.search3 = function(callback, query){
	if(typeof callback === 'undefined' || typeof query === 'undefined'){
    	console.error('[error] search3 : query and/or callback parameter must be defined');
    	return;
    }
    
    this.query('search3', callback, {query:query});
};

/*
 * http://your-server/rest/getAlbum.view
 *
 * @param {string} callback
 * @param {number} id
 */
Subsonic.prototype.getAlbum = function(callback, id){
    if(typeof callback === 'undefined' || typeof id === 'undefined'){
    	console.error('[error] getAlbum : id and/or callback parameter must be defined');
    	return;
    }
    
    this.query('getAlbum', callback, {id:id});
};

/*
 * http://your-server/rest/getSong.view
 * 
 * @param {string} callback
 * @param {number} id 
 */
Subsonic.prototype.getSong = function(callback, id){
    if(typeof callback === 'undefined' || typeof id === 'undefined'){
    	console.error('[error] getSong : id and/or callback parameter must be defined');
    	return;
    }
    
	this.query('getSong', callback, {id:id});
};

/*
 * http://your-server/rest/stream.view
 * 
 * @param {string} callback
 * @param {obj} song
 * @param {json} callback_param
 */
Subsonic.prototype.stream = function(callback, song){
	if(typeof callback === 'undefined' || typeof song === 'undefined'){
		console.error('[error] stream : song and/or callback parameter must be defined');
		return;
	}
  
	// add default param
	var param = '?u='+encodeURIComponent(this.username);
	param += '&p='+encodeURIComponent(this.password);
	param += '&v='+encodeURIComponent(this.version);
	param += '&c='+encodeURIComponent(this.appname);
  param += '&id='+song.id;
	param += '&f=json';

	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onreadystatechange = function(){
		if(xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 0)){
      callback(xhr.response, song);
		}
	};
	xhr.open('GET', this.server+'stream.view'+param, true);
  xhr.responseType = 'blob';
  if(typeof song.transcodedContentType !== 'undefined')
    xhr.overrideMimeType(song.transcodedContentType);
  else
    xhr.overrideMimeType(song.contentType);
	xhr.send(null);
};

/*
 * http://your-server/rest/getCoverArt.view
 * 
 * @param {string} callback
 * @param {number} id
 * * @param {number} size
 * @param {json} callback_param
 */
Subsonic.prototype.getCoverArt = function(callback, song, size){
	if(typeof callback === 'undefined' || typeof song === 'undefined'){
		console.error('[error] getCoverArt : song and/or callback parameter must be defined');
		return;
	}
  
	// add default param
	var param = '?u='+encodeURIComponent(this.username);
	param += '&p='+encodeURIComponent(this.password);
	param += '&v='+encodeURIComponent(this.version);
	param += '&c='+encodeURIComponent(this.appname);
  param += '&id='+song.coverArt;
	param += '&f=json';
  
  if(typeof size !== 'undefined')
    param += '&size='+size;
  
	var xhr = new XMLHttpRequest({mozSystem: true});
	xhr.onreadystatechange = function(){
		if(xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 0)){
      callback(xhr.response, song);
		}
	};
	xhr.open('GET', this.server+'getCoverArt.view'+param, true);
  xhr.responseType = 'blob';
  xhr.overrideMimeType('image/jpeg');
	xhr.send(null);
};
