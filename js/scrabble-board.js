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

window.Board = function($html, hand) {
  // so we can axis this from the draggable event handlers
  var that = this;

  // the DOM element referring to the board (jQuery object)
  this.$html = $html;

  // tiles that have been placed on the board
  this.placedTiles = _.range(15 * 15).map(function() {return null;});

  // tiles that are ready to be placed on the board
  this.stagedTiles = _.range(15 * 15).map(function() {return null;});

  // the tile rack
  this.hand = hand;

  // the callback for when a tile is staged
  this.cb = null;

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
    1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1,
    0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0,
    0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0,
    0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0,
    4, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 4,
    0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0,
    0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0,
    0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0,
    1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 1,
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
    var $tile = $(event.target);
    var x = $tile.offset().left + ($tile.outerWidth() / 2);
    var $board = $('#board');
    var $tileRack = $('#pane-r');
    var boardRightEdge = Math.abs($board.offset().left + $board.outerWidth() - x);
    var tileRackLeftEdge = Math.abs($tileRack.offset().left - x);

    if (boardRightEdge < tileRackLeftEdge) {
      // we dropped closer to the board
      that.dragStopBoard(event, ui);
    } else {
      // we dropped closer to the thing that holds all the tiles
      that.dragStopTileRack(event, ui);
    }
  };

  // called by dragStop when the tile is dropped closer to the board
  this.dragStopBoard = function(event, ui) {
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
      // needs to be done or else tile staging won't allow you to change axis w/ 2 pieces
      // then try to stage the tile to it's new location
      var letter = that.unstageTile(ox, oy);
      var stageRes = that.stageTile(tx, ty, letter);

      if (stageRes !== null) {
        // this is the case where we try to stage a tile over an existing tile
        // this not a valid spot, move the tile back to it's home
        var x = ui.originalPosition.left;
        var y = ui.originalPosition.top;

        // restage the current piece
        that.stageTile(ox, oy, letter);
        slideBoardToBoard(ui.helper, that, x, y);
      } else {
        // unstage the current piece
        if (ox !== tx && oy !== ty) {
          // if we're dropping where we started, don't unstage the tile already there
          that.unstageTile(ox, oy);
        }
        slideBoardToBoard(ui.helper, that, place[2] + 2, place[3] + 2);
      }
    } else {
      // there are no active regions, move the tile back to it's home
      var x = ui.originalPosition.left;
      var y = ui.originalPosition.top;
      slideBoardToBoard(ui.helper, that, x, y);
    }

    // clear the current drop targets
    that.dropTargets = {};
  };

  // called by dragStop when the tile is dropped closer to the tile rack
  this.dragStopTileRack = function(event, ui) {
    var locations = Object.keys(that.hand.dropTargets).map(function(x) {
      // add a bit of info to each drop target containing the euclidean distance
      // to the target
      var $drop = $('#' + x);
      var x = $drop.offset().left;
      var y = $drop.offset().top;
      var dx = ui.offset.left - x;
      var dy = ui.offset.top  - y;
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
      var tx = place[0].index();

      // unstage the current piece
      // needs to be done or else tile staging won't allow you to change axis w/ 2 pieces
      // then try to stage the tile to it's new location
      var letter = that.unstageTile(ox, oy);
      var stageRes = that.hand.addByIndex(tx, letter);

      if (stageRes) {
        var tileRackOffset = $('#pane-r').offset();
        var dx = place[0].offset().left - ui.helper.parent().offset().left + 4;
        var dy = place[0].offset().top  - ui.helper.parent().offset().top + 10;
        slideBoardToHand(ui.helper, that, that.hand, dx, dy);
      } else {
        // this is the case where we try to stage a tile over an existing tile
        // this not a valid spot, move the tile back to it's home
        var x = ui.originalPosition.left;
        var y = ui.originalPosition.top;

        // restage the current piece
        that.stageTile(ox, oy, letter);
        slideBoardToBoard(ui.helper, that, x, y);
      }
    } else {
      // there are no active regions, move the tile back to it's home
      var dx = ui.originalPosition.left;
      var dy = ui.originalPosition.top;
      slideBoardToBoard(ui.helper, that, dx, dy);
    }

    // clear the current drop targets
    that.hand.dropTargets = {};
  };

  // jQuery UI event handler for when a square has a tile moved into it
  this.dropActivate = function(event, ui) {
    // figure out if we're currently in an occupied tile
    var $drop = $(this);
    var tx = Math.floor($drop.position().left / 47);
    var ty = Math.floor($drop.position().top  / 47);
    var idx = pos(tx, ty);

    if (that.placedTiles[idx] !== null || that.placedTiles[idx] !== null) {
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
Board.prototype.stageTile = function(x, y, letter, swapStaged, validOnly) {
  // give some defaults
  if (swapStaged === undefined) {
    swapStaged = false;
  }
  if (validOnly === undefined) {
    swapStaged = false;
  }

  if (this.placedTiles[pos(x, y)] !== null) {
    // this spot is currently occupied by a permanently placed tile
    return false;
  } else if (this.stagedTiles[pos(x, y)] !== null && !swapStaged) {
    // don't swap two staged tiles
    return false;
  } else {
    var positions = getPositions(this.stagedTiles).concat([[x, y]]);
    var isValid = getAxis(positions);

    if (validOnly && isValid[0] === false && isValid[1] === false) {
      // the current spot is not within the row or column of currently placed tiles
      // only runs if we explicity say that we don't want to allow invalid placement
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
Board.prototype.unstageTile = function(x, y) {
  var idx = pos(x, y);
  var tmp = this.stagedTiles[idx];
  this.stagedTiles[idx] = null;
  return tmp;
};

// validate the currently staged tiles and make sure that it's OK
Board.prototype.validateStaging = function(turn) {
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

  if (positions.length === 0) {
    return [false, 'No tiles placed on the board'];
  }

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
    return [false, 'Tiles must be placed in a straight line without gaps'];
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
    return [false, 'Tiles must be placed in a straight line without gaps'];
  }

  // verfiy that if it is the first turn, one piece lies along the star
  if (turn === 0 && this.stagedTiles[pos(7, 7)] === null) {
    return [false, 'The first word must be placed on the center square'];
  }

  // nothing's wrong
  return [true, ''];
};

// 
Board.prototype.currentScore = function() {
  // create a temporary array of tiles that represents the current tiles, but
  //   all committed
  var tempTiles = _.clone(this.placedTiles);
  this.stagedTiles.forEach(function(x, idx) {
    if (x !== null) {
      tempTiles[idx] = x;
    }
  }, this);

  // get the positions of currently staged tiles
  var positions = [];
  this.stagedTiles.forEach(function(x, idx) {
    if (this.stagedTiles[idx] !== null) {
      // push the index to the list of indexes
      positions.push(posInv(idx));
    }
  }, this);

  // get all words to calculate the score for
  var words = getWords(positions, tempTiles);
  var that = this;

  // calculate the score for each word
  return words.reduce(function(prev, curr) {
    return prev + scoreWord(curr, that.squareLayout);
  }, 0);
}

// commit all staged tiles and return the score
Board.prototype.commitTiles = function() {
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
  
  // show the changes made to the placed tiles
  this.render();

  // get all words to calculate the score for
  var words = getWords(positions, this.placedTiles);
  var that = this;

  // calculate the score for each word
  return words.reduce(function(prev, curr) {
    return prev + scoreWord(curr, that.squareLayout);
  }, 0);
};

// display the board
Board.prototype.render = function() {
  this.renderSquares();
  this.renderPlacedTiles();
  this.renderStagedTiles();
};

// render the squares that the tiles go on
Board.prototype.renderSquares = function() {
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
Board.prototype.renderPlacedTiles = function() {
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
      'class': 'tile tile-' + x,
      'style': 'left: ' + (position[0] * 47 + 2) + 'px; top: ' + (position[1] * 47 + 2) + 'px;'
    });
    $placedTiles.append($tile);
  });

  this.$html.append($placedTiles);
};

// render the temporarily placed tiles on the board
Board.prototype.renderStagedTiles = function() {
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
      'class': 'tile tile-' + x,
      'style': 'left: ' + (position[0] * 47 + 2) + 'px; top: ' + (position[1] * 47 + 2) + 'px;'
    });

    $tile.draggable({
      containment: '#mat',
      stop: this.dragStop
    });

    $stagedTiles.append($tile);
  }, this);

  this.$html.append($stagedTiles);

  if (this.cb !== null) {
    this.cb();
  }
};

Board.prototype.onStage = function(cb) {
  this.cb = cb;
};
