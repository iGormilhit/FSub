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

$.ajaxSetup({
	async: false
});

/* class Subsonic for API (see http://www.subsonic.org/pages/api.jsp)
 * 
 * @param
 * @return {Subsonic}
 */
function Subsonic(username, password, server, appname, format, version){
	this.username = username;
	this.password = password;
	this.server = server;
	this.appname = appname;
	this.format = format;
	this.version = version;
}

/*
 * @param {string} path
 * @param {string} query
 * @return {object}
 */
Subsonic.prototype.query = function(path, query){
	var param = {u: this.username, p: this.password, v: this.version, c: this.appname, f: this.format};
	if(typeof query !== 'undefined')
		param = $.extend({}, param, query);
	
	var res = [];
	$.getJSON(this.server+path+'.view', param, function(json){
		res = json['subsonic-response'];
	});
	
	return res;
};

/*
 * http://your-server/rest/ping.view
 * 
 * @return {bool}
 */
Subsonic.prototype.ping = function(){
	return this.query('ping');
};

/*
 * http://your-server/rest/getUser.view
 *
 * @param {string} username
 * @return {array}
 */
Subsonic.prototype.getUser = function(username){
    if(typeof username === 'undefined')
      return SUBSONIC_ERROR_PARAM_MISSING;
    
    return this.query('getUser', {username:username});
};

/*
 * http://your-server/rest/getAlbumList2.view
 *
 * @param {string} type
 * @param {number} size
 * @param {number} offset
 * @return {array}
 */
Subsonic.prototype.getAlbumList2 = function(type, size, offset){
	// set optional parameters if needed
	if(typeof size === 'undefined')
    type='alphabeticalByArtist';
    
	if(typeof size === 'undefined')
    size=10;
    
	if(typeof offset === 'undefined')
    offset=0;
	
	return this.query('getAlbumList2', {type:type, size:size, offset:offset});
};

/*
 * http://your-server/rest/search3.view
 *
 * @param {number} query
 * @return {array}
 */
Subsonic.prototype.search3 = function(query){
    if(typeof query === 'undefined')
      return SUBSONIC_ERROR_PARAM_MISSING;
    
    return this.query('search3', {query:query});
};

/*
 * http://your-server/rest/getAlbum.view
 *
 * @param {number} id
 * @return {array}
 */
Subsonic.prototype.getAlbum = function(id){
    if(typeof id === 'undefined')
      return SUBSONIC_ERROR_PARAM_MISSING;
    
    return this.query('getAlbum', {id:id});
};

/*
 * http://your-server/rest/getSong.view
 * 
 * @param {number} id
 * @return {array}
 */
Subsonic.prototype.getSong = function(id){
    if(typeof id === 'undefined')
      return SUBSONIC_ERROR_PARAM_MISSING;
    
	return this.query('getSong', {id:id});
};
