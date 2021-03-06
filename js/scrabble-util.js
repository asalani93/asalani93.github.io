/*
  File:  /~asalani/js/scrabble-util.js
  91.461 Assignment 9: Implementing a Bit of Scrabble
  Anthony Salani, UMass Lowell Computer Science, asalani93@gmail.com
  Copyright (c) 2015 by Anthony Salani.  All rights reserved.  May be freely 
    copied or excerpted for any purpose with credit to the author.
  Created by AAS on November 25, 2015

  Provides scrabble and scrabble-related services.
  A bunch of utility functions that are possibly reusable and that I don't want
    to have cluttering different files.
*/

"use strict";

var pos = function(x, y) {
  return y * 15 + x;
};

var posInv = function(idx) {
  return [idx % 15, Math.floor(idx / 15)];
};

// returns newVal if oldVal is true, or newVal equals oldVal
// return false otherwise
// very useful for determining which axis a piece lies along
var someFunc = function(oldVal, newVal) {
  if (oldVal === false) {
    return false;
  } else if (oldVal === true) {
    return newVal;
  } else if (oldVal !== newVal) {
    return false;
  } else {
    return newVal;
  }
}

// returns a list of all piece positions
var getPositions = function(board) {
  return board.map(function(x, idx) {
    // convert each cell to either null (if it's already null),
    // or an (x,y) pair
    if (x === null) {
      return null;
    } else {
      return posInv(idx);
    }
  }).filter(function(x) {
    // remove all of the nulls from the list so we can ignore them
    return x != null;
  });
}

// determines which axis the tiles lie along
var getAxis = function(positions) {
  return positions.reduce(function(prev, curr) {
    var x = someFunc(prev[0], curr[0]);
    var y = someFunc(prev[1], curr[1]);
    return [x, y];
  }, [true, true]);
}

// given a list of positions changed and the current state of the board, return
//   a list of all "words" that should be scored
// this is the word along the axis that was changed, and every word perpendicular
//   to the axis at each changed position
var getWords = function(positions, board) {
  // compute which axis the positions lie along (0 = x, 1 = y)
  var alignment = positions.reduce(function(prev, curr) {
    var x = someFunc(prev[0], curr[0]);
    var y = someFunc(prev[1], curr[1]);
    return [x, y];
  }, [true, true]);

  var idxSample = pos(positions[0][0], positions[0][1]);
  var words = [];

  if (alignment[0] === false) {
    // case for x-axis

    // determine each off-axis word, discard results of length 1
    var hasOffAxis = false;
    positions.forEach(function(x) {
      var idx = pos(x[0], x[1]);
      var word = spanToEdge(board, idx, 1); 
      if (word.length > 1) {
        hasOffAxis = true;
        words.push(word);
      }
    });

    // determine the on-axis word
    var onAxis = spanToEdge(board, idxSample, 0);
    if (onAxis.length > 1 || !hasOffAxis) {
      // only use a word of length 1 if we don't have off-axis words
      words.push(onAxis);
    }
  } else if (alignment[1] === false) {
    // case for the y-axis

    // determine each off-axis word, discard results of length 1
    var hasOffAxis = false;
    positions.forEach(function(x) {
      var idx = pos(x[0], x[1]);
      var word = spanToEdge(board, idx, 0);
      if (word.length > 1) {
        hasOffAxis = true;
        words.push(word);
      }
    });

    // determine the on-axis word
    var onAxis = spanToEdge(board, idxSample, 1);
    if (onAxis.length > 1 || !hasOffAxis) {
      // only use a word of length 1 if we don't have off-axis words
      words.push(onAxis);
    }
  } else {
    // handle the case where the user placed just one letter
    var xWord = spanToEdge(board, idxSample, 0);
    var yWord = spanToEdge(board, idxSample, 1);
    var minSize = Math.min(xWord.length, yWord.length);
    var maxSize = Math.max(xWord.length, yWord.length);
    if (maxSize === 1) {
      words.push(xWord);
    } else if (minSize === 1) {
      if (xWord.length === 1) {
        words.push(yWord);
      } else {
        words.push(xWord);
      }
    } else {
      words.push(xWord);
      words.push(yWord);
    }
  }

  return words;
};

// given a list of letter/index pairs, compute the score of the word
// note on scrabble rules: each multiplier box can only be used once.  it follows
//   that the only time a box can be used is when a tile is placed on it.  however,
//   if multiple words are formed on a multplier, that multplier is used for each
//   word.  confused yet?
var scoreWord = function(word, board) {
  var wordMult = 1;
  var distribution = new Distribution();
  var baseScore = word.reduce(function(prev, curr) {
    var tileType = board[curr[1]];
    var tileScore = distribution.dist[curr[0]].value;
    if (tileType === 1) {
      // letter x 2 spot
      tileScore *= 2;
    } else if (tileType === 2) {
      // letter x 3 spot
      tileScore *= 3;
    } else if (tileType === 3 || tileType === 5) {
      // word x 2 spot
      wordMult *= 2;
    } else if (tileType === 4) {
      // word x 3 spot
      wordMult *= 3;
    }
    return prev + tileScore;
  }, 0);
  return baseScore * wordMult;
};

// given a position, board, and axis: return a list of letter/index pairs that
//   extend from the first non-null value to the last non-null value along the
//   specified axis
// note: 0 is the x axis, 1 is the y axis
var spanToEdge = function(board, idx, axis) {
  var position = posInv(idx);

  // handle the case where the provided index isn't on a letter
  if (board[idx] === null) {
    return [];
  }

  if (axis === 0) {
    // if we're along the x axis
    var minPos = position[0];
    var maxPos = position[0];
    var y = position[1];
    
    // find the end point of the current word
    while (minPos > 0  && board[pos(minPos - 1, y)] !== null) {
      minPos -= 1;
    }

    // find the start point of the current word
    while (maxPos < 14 && board[pos(maxPos + 1, y)] !== null) {
      maxPos += 1
    }

    // convert the calculated range in an array of letters and indices
    return _.range(minPos, maxPos + 1).map(function(x) {
      var idx = pos(x, y);
      return [board[idx], idx];
    });
  } else {
    // if we're along the y axis
    var minPos = position[1];
    var maxPos = position[1];
    var x = position[0];

    // find the start point of the current word
    while (minPos > 0  && board[pos(x, minPos - 1)] != null) {
      minPos -= 1;
    }

    // find the end point of the current word
    while (maxPos < 14 && board[pos(x, maxPos + 1)] != null) {
      maxPos += 1;
    }

    // convert the calculated range in an array of letters and indices
    return _.range(minPos, maxPos + 1).map(function(y) {
      var idx = pos(x, y);
      return [board[idx], idx];
    });
  }
};

// the following functions simplify sliding the tiles from point A to point B
// the last two are identical, but I made them seperate functions in case they
//   needed to be different in the future
var slideBoardToBoard = function($tile, board, x, y) {
  $('.tile.ui-draggable').draggable('disable');
  $tile.animate({
    left: x + 'px',
    top: y + 'px'
  }, {
    complete: function() {
      $('.tile.ui-draggable').draggable('enable');
      board.renderStagedTiles();
    }
  });
};

var slideHandToBoard = function($tile, board, hand, x, y) {
  $('.tile.ui-draggable').draggable('disable');
  $tile.animate({
    left: x + 'px',
    top: y + 'px'
  }, {
    complete: function() {
      $('.tile.ui-draggable').draggable('enable');
      board.renderStagedTiles();
      hand.render();
    }
  });
};

var slideHandToHand = function($tile, hand, x, y) {
  $('.tile.ui-draggable').draggable('disable');
  $tile.animate({
    left: x + 'px',
    top: y + 'px'
  }, {
    complete: function() {
      $('.tile.ui-draggable').draggable('enable');
      hand.render();
    }
  });
};

var slideBoardToHand = function($tile, board, hand, x, y) {
  $('.tile.ui-draggable').draggable('disable');
  $tile.animate({
    left: x + 'px',
    top: y + 'px'
  }, {
    complete: function() {
      $('.tile.ui-draggable').draggable('enable');
      board.renderStagedTiles();
      hand.render();
    }
  });
};
