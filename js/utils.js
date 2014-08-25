function stringToHex(str){
  var hex = '';
  for(var i=0;i<str.length;i++){
    hex += str.charCodeAt(i).toString(16);
  }
  return hex;
}

function hexToString(hex){
  var str = '';
  for(var i=0;i<str.length;i++){
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return hex;
}
