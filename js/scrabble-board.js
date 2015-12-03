/*
  File:  /~asalani/js/scrabble-util.js
  91.461 Assignment 9: Implementing a Bit of Scrabble
  Anthony Salani, UMass Lowell Computer Science, asalani93@gmail.com
  Copyright (c) 2015 by Anthony Salani.  All rights reserved.  May be freely 
    copied or excerpted for any purpose with credit to the author.
  Created by AAS on November 25, 2015

  Provides scrabble and scrabble-related services.
  The class for the board itself.  Handles the placement and validation of the
    location of pieces, as well as determining how much a move is worth.
*/

"use strict";

window.Board = function($html) {
  // so we can axis this from the draggable event handlers
  var that = this;

  // the DOM element referring to the board (jQuery object)
  this.$html = $html;
  // tiles that have been placed on the board
  this.placedTiles = _.range(15 * 15).map(function() {return null;});
  // tiles that are ready to be placed on the board
  this.stagedTiles = _.range(15 * 15).map(function() {return null;});
  // how to arrange the squares on the board
  // each row is 15 long
  // 0 = nothing
  // 1 = double letter
  // 2 = triple letter
  // 3 = double word
  // 4 = triple word
  // 5 = start
  this.squareLayout = [
    4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4,
    0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0,
    0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0,
    1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0,
    0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0,
    0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0,
    0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0,
    4, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 4,
    0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0,
    0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0,
    0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0,
    1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0,
    0, 0, 3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 3, 0, 0,
    0, 3, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 3, 0,
    4, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 4
  ];
  // which number corresponds to which class
  this.squareClasses = ['', 'ltr2', 'ltr3', 'wrd2', 'wrd3', 'star'];

  // places where we can currently drop the moving tile
  this.dropTargets = {};
  // jQuery UI event handler for letting go of a tile
  this.dragStop = function(event, ui) {
    var locations = Object.keys(that.dropTargets).map(function(x) {
      // add a bit of info to each drop target containing the euclidean distance
      // to the target
      var $drop = $('#' + x);
      var x = $drop.position().left;
      var y = $drop.position().top;
      var dx = ui.position.left - x;
      var dy = ui.position.top  - y;
      var distance = Math.sqrt(dx * dx + dy * dy);
      return [$drop, distance, x, y];
    }).sort(function(l, r) {
      // find the droppable location that is the closest to the tile
      return l[1] - r[1];
    });

    if (locations.length > 0) {
      // translate the piece to the closest location if there is one
      var place = locations[0];
      var ox = Math.floor(ui.originalPosition.left / 47);
      var oy = Math.floor(ui.originalPosition.top / 47);
      var tx = Math.floor(place[2] / 47);
      var ty = Math.floor(place[3] / 47);

      // unstage the current piece
      var letter = that.unstageTile(ox, oy);

      // try to stage the tile to it's new location
      var stageRes = that.stageTile(tx, ty, letter);

      if (stageRes === false) {
        // this is the case where we try to stage a tile over an existing tile
        // this not a valid spot, move the tile back to it's home
        var x = ui.originalPosition.left;
        var y = ui.originalPosition.top;
        
        ui.helper.draggable('disable');
        ui.helper.animate({
          left: x + 'px',
          top: y + 'px'
        }, {
          complete: function() {
            ui.helper.draggable('enable');
          }
        });
        return;
      } else if (stageRes !== null) {
        console.log('poop');
        // if we're placing a tile over another tile, move it to where we started from
        that.stageTile(ox, oy, stageRes);

        // find the overlapped tile by its position
        var q = '#staged-tiles > .tile[style*="left: ' + (place[2] + 2) + 'px"][style*="top: ' + (place[3] + 2) + 'px"]';
        var $tile = $(q);

        $tile.draggable('disable');
        $tile.animate({
          left: ui.originalPosition.left,
          top: ui.originalPosition.top
        }, {
          complete: function() {
            $tile.draggable('enable');
          }
        });
      }

      ui.helper.draggable('disable');
      ui.helper.animate({
        left: (place[2] + 2) + 'px',
        top: (place[3] + 2) + 'px'
      }, {
        complete: function() {
          console.log('abacus');
          ui.helper.draggable('enable');
        }
      });
    } else {
      // there are no active regions, move the tile back to it's home
      var x = ui.originalPosition.left;
      var y = ui.originalPosition.top;
      
      ui.helper.animate({
        left: x + 'px',
        top: y + 'px'
      });
    }

    // clear the current drop targets
    that.dropTargets = {};
  };
  // jQuery UI event handler for when a square has a tile moved into it
  this.dropActivate = function(event, ui) {
    // figure out if we're currently in an occupied tile
    var $drop = $(this);
    var tx = Math.floor($drop.position().left / 47);
    var ty = Math.floor($drop.position().top  / 47);
    var idx = pos(tx, ty);

    if (that.placedTiles[idx] !== null) {
      return;
    }

    // store the id of the droppable as a key in the dropTargets object
    // the value is a function to call when the tile is released
    var dropName = this.id;
    that.dropTargets[dropName] = 1;
  };
  // jQuery UI event handler for when a square has a tile moved out of it
  this.dropOut = function(event, ui) {
    var dropName = this.id;
    delete that.dropTargets[dropName];
  };
};

// place a tile on the board and get it ready for commiting
window.Board.prototype.stageTile = function(x, y, letter) {
  if (this.placedTiles[pos(x, y)] != null) {
    // this spot is currently occupied by a permanently placed tile
    return false;
  } else {
    var positions = getPositions(this.stagedTiles).concat([[x, y]]);
    var isValid = getAxis(positions);

    if (isValid[0] === false && isValid[1] === false) {
      // the current spot is not within the row or column of currently placed tiles
      return false;
    } else {
      // this spot is either occupied by a staged tile or nothing
      // in either case, return the old value
      var tmp = this.stagedTiles[pos(x, y)];
      this.stagedTiles[pos(x, y)] = letter;
      return tmp;
    }
  }
};

// remove a pending tile from the board
window.Board.prototype.unstageTile = function(x, y) {
  var idx = pos(x, y);
  var tmp = this.stagedTiles[idx];
  this.stagedTiles[idx] = null;
  return tmp;
};

// validate the currently staged tiles and make sure that it's OK
window.Board.prototype.validateStaging = function(turn) {
  // get the positions of all tiles
  var positions = getPositions(this.stagedTiles).sort(function(l, r) {
    if (pos(l[0], l[1]) < pos(r[0], r[1])) {
      return -1;
    } else if (pos(l[0], l[1]) > pos(r[0], r[1])) {
      return 1;
    } else {
      return 0;
    }
  });

  // get the axis of the word
  var axis = getAxis(positions);
  
  // create a dummy array of tiles to work on
  var tempTiles = _.clone(this.placedTiles);
  this.stagedTiles.forEach(function(x, idx) {
    if (x !== null) {
      tempTiles[idx] = x;
    }
  });

  // verify that the tiles lie along the same axis
  if (axis[0] === false && axis[1] === false) {
    return false;
  }

  // determine the number of gaps in the combined staged and placed tile maps
  //   between the start and end tiles
  if (axis[0] === false) {
    // check for gaps along the x-axis
    // note: if axis[0] is false, that means that the x-axis changes
    var f = _.first(positions)[0];
    var l = _.last(positions)[0];
    var y = _.first(positions)[1];
    var gaps = _.range(f, l + 1).filter(function(x) {
      return tempTiles[pos(x, y)] == null;
    }).length;
  } else {
    // check for gaps along the y-axis
    var f = _.first(positions)[1];
    var l = _.last(positions)[1];
    var x = _.first(positions)[0];
    var gaps = _.range(f, l + 1).filter(function(y) {
      return tempTiles[pos(x, y)] == null;
    }).length;
  }

  // verify that there are no gaps on the board between the start and end word
  if (gaps > 0) {
    return false;
  }

  // verfiy that if it is the first turn, one piece lies along the star
  if (turn === 0 && this.stagedTiles[pos(8, 8)] === null) {
    return false;
  }

  // nothing's wrong
  return true;
};

// commit all staged tiles and return the score
window.Board.prototype.commitTiles = function() {
  var positions = [];
  this.stagedTiles.forEach(function(x, idx) {
    if (this.stagedTiles[idx] !== null) {
      // place the tile on the board permanently
      this.placedTiles[idx] = x;
      // remove that tile from the list of staged tiles
      this.stagedTiles[idx] = null;
      // push the index to the list of indexes
      positions.push(posInv(idx));
    }
  }, this);

  // get all words to calculate the score for
  var words = getWords(positions, this.placedTiles);

  // calculate the score for each word
  return words.reduce(function(prev, curr) {
    return prev + scoreWord(curr);
  }, 0);
};

// display the board
window.Board.prototype.render = function() {
  this.renderSquares();
  this.renderPlacedTiles();
  this.renderStagedTiles();
};

// render the squares that the tiles go on
window.Board.prototype.renderSquares = function() {
  // remove all of the squares
  this.$html.children('#squares').remove();

  var $squares = $('<div>', {
    'id': 'squares'
  });

  // put all of the squares back
  this.squareLayout.forEach(function(x, idx) {
    var useClass = this.squareClasses[x];
    var $square = $('<div>', {
      'class': 'square ' + useClass,
      'id': 'square-' + idx
    })

    $square.droppable({
      over: this.dropActivate,
      out: this.dropOut,
      tolerance: 'touch'
    });

    $squares.append($square);
  }, this);

  this.$html.append($squares);
};

// render the permanently placed tiles on the board
window.Board.prototype.renderPlacedTiles = function() {
  // remove all of the currently placed tiles
  this.$html.children('#placed-tiles').remove();

  var $placedTiles = $('<div>', {
    'id': 'placed-tiles'
  });

  // put all of the placed tiles back
  this.placedTiles.forEach(function(x, idx) {
    if (x === null) {
      return;
    }

    var position = posInv(idx);
    var $tile = $('<div>', {
      'class': 'tile',
      'style': 'left: ' + (position[0] * 47 + 2) + 'px; top: ' + (position[1] * 47 + 2) + 'px;'
    });
    $placedTiles.append($tile);
  });

  this.$html.append($placedTiles);
};

// render the temporarily placed tiles on the board
window.Board.prototype.renderStagedTiles = function() {
  // remove all of the currently placed tiles
  this.$html.children('#staged-tiles').remove();

  var $stagedTiles = $('<div>', {
    'id': 'staged-tiles'
  });

  // put all of the placed tiles back
  this.stagedTiles.forEach(function(x, idx) {
    if (x === null) {
      return;
    }

    var position = posInv(idx);
    var $tile = $('<div>', {
      'class': 'tile',
      'style': 'left: ' + (position[0] * 47 + 2) + 'px; top: ' + (position[1] * 47 + 2) + 'px;'
    });

    $tile.draggable({
      containment: '#mat',
      stop: this.dragStop
    });

    $stagedTiles.append($tile);
  }, this);

  this.$html.append($stagedTiles);
};
