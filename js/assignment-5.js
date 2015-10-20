// Load the JSON file, pass content to placeContet()
$(document).ready(function() {
  $.get('data/SmashMouthAllStar.json', placeContent, 'json');
});

var placeContent = function(data) {
  // Create DOM elements for title and band
  var $songInfo = $('<div id="song-info"></div>');
  var $songName = $('<div id="song-name">' + data.title + '</div>');
  $songInfo.append($songName);
  var $songBand = $('<div id="song-band">by ' + data.band + '</div>');
  $songInfo.append($songBand);
  var $songAlbum = $('<div id="song-album">' + data.album + '</div>');
  $songInfo.append($songAlbum);
  var $songDate = $('<div id="song-date">' + data.date + '</div>');
  $songInfo.append($songDate);

  // Iterate through the verses and add each one to the DOM
  var $verseContainer = $('<div id="verse-container"></div>');
  data.verses.map(function(x, index) {
    // Concatenate the lines with line breaks
    var text = x.lines.join('<br>');
    // Create the actual block for the verse
    var id = x.type + '-' + x.count;
    var classes = 'verse-block ' + x.type;
    var $verseBlock = $('<div class="' + classes + '" id="' + id + '">' + text + '</div>');
    return $verseBlock;
  }).reduce(function(memo, x) {
    // Append the verse the verse container
    memo.append(x);
    return memo;
  }, $verseContainer);

  // Add the song info and verses to the page
  var $insertPoint = $('#json-content');
  $insertPoint.append($songInfo);
  $insertPoint.append($verseContainer);
};
