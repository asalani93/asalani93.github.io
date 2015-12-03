/*
  File:  /~asalani/js/scrabble.js
  91.461 Assignment 9: Implementing a Bit of Scrabble
  Anthony Salani, UMass Lowell Computer Science, asalani93@gmail.com
  Copyright (c) 2015 by Anthony Salani.  All rights reserved.  May be freely 
    copied or excerpted for any purpose with credit to the author.
  Created by AAS on November 25, 2015

  Provides scrabble and scrabble-related services.
*/

"use strict";

window.Distribution = function() {
  this.dist = {
    'a': {count:  9, value:  1},
    'b': {count:  2, value:  3},
    'c': {count:  2, value:  3},
    'd': {count:  4, value:  2},
    'e': {count: 12, value:  1},
    'f': {count:  2, value:  4},
    'g': {count:  3, value:  2},
    'h': {count:  2, value:  4},
    'i': {count:  9, value:  1},
    'j': {count:  1, value:  8},
    'k': {count:  1, value:  5},
    'l': {count:  4, value:  1},
    'm': {count:  2, value:  3},
    'n': {count:  6, value:  1},
    'o': {count:  8, value:  1},
    'p': {count:  2, value:  3},
    'q': {count:  1, value: 10},
    'r': {count:  6, value:  1},
    's': {count:  4, value:  1},
    't': {count:  6, value:  1},
    'u': {count:  4, value:  1},
    'v': {count:  2, value:  4},
    'w': {count:  2, value:  4},
    'x': {count:  1, value:  8},
    'y': {count:  2, value:  4},
    'z': {count:  1, value: 10},
    '_': {count:  2, value:  0}
  };
}

window.Distribution.prototype.shuffle = function() {
  var that = this;
  var unshuffled = _.keys(this.dist).reduce(function(prev, curr) {
    var items = _.range(that.dist[curr].count).map(function() { return curr; });
    return prev.concat(items);
  }, []);

  return _.shuffle(unshuffled);
};

window.Deck = function($html) {
  this.$html = $html;
  this.reset();
};

window.Deck.prototype.draw = function() {
  var draw = this.deck[0];
  this.deck = _.rest(this.deck);
  return draw;
};

window.Deck.prototype.reset = function() {
  this.deck = (function() {
    var dist = new Distribution();
    return dist.shuffle();
  })();
};

window.Deck.prototype.size = function() {
  return this.deck.length;
};

window.Deck.prototype.render = function() {
  // do something
};

window.Hand = function($html, board) {
  var that = this;

  this.$html = $html;
  this.hand = [];
  this.board = board;

  this.dragStop = function(event, ui) {
    var $tile = $(event.target);
    var x = $tile.offset().left + ($tile.outerWidth() / 2);
    var $board = $('#board');
    var boardRightEdge = Math.abs($board.offset().left + $board.outerWidth() - x);
    var paneRLeftEdge = Math.abs(that.$html.offset().left - x);

    if (boardRightEdge < paneRLeftEdge) {
      // we dropped closer to the board
      // shift the coords to the frame of reference of the board
      var $paneR = $('#pane-r');
      var boardOff = $board.offset();
      var paneROff = $paneR.offset();
      ui.boardPosition = {
        left: ui.position.left + paneROff.left - boardOff.left,
        top: ui.position.top + paneROff.top - boardOff.top
      };
      that.dragStopBoard(event, ui);
    } else {
      // we dropped closer to the thing that holds all the tiles
      that.dragStopPaneR(event, ui);
    }
  };

  this.dragStopBoard = function(event, ui) {
    var locations = Object.keys(that.board.dropTargets).map(function(x) {
      // add a bit of info to each drop target containing the euclidean distance
      // to the target
      var $drop = $('#' + x);
      var x = $drop.position().left;
      var y = $drop.position().top;
      var dx = ui.boardPosition.left - x;
      var dy = ui.boardPosition.top  - y;
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
      var letter = that.board.unstageTile(ox, oy);
      // try to stage the tile to it's new location
      var stageRes = that.board.stageTile(tx, ty, letter, false);

      if (stageRes !== null) {
        // this is the case where we try to stage a tile over an existing tile
        // this not a valid spot, move the tile back to it's home
        var x = ui.originalPosition.left;
        var y = ui.originalPosition.top;

        // unstage the current piece
        that.board.stageTile(ox, oy, letter, false);
        slideTo(ui.helper, that.board, x, y);
      } else {
        // unstage the current piece
        if (ox !== tx && oy !== ty) {
          that.board.unstageTile(ox, oy);
        }
        slideTo(ui.helper, that.board, place[2] + 2, place[3] + 2);
      }
    } else {
      // there are no active regions, move the tile back to it's home
      var x = ui.originalPosition.left;
      var y = ui.originalPosition.top;
      slideTo(ui.helper, that.board, x, y);
    }

    // clear the current drop targets
    that.dropTargets = {};
  };

  this.dragStopPaneR = function(event, ui) {

  };
};

window.Hand.prototype.draw = function(deck) {
  while (this.hand.length < 7) {
    var letter = deck.draw();
    this.hand.push(letter);
  }
};

window.Hand.prototype.remove = function(letter) {
  var idx = _.indexOf(this.hand, letter);
  if (idx === -1) {
    return false;
  } else {
    this.hand.splice(idx, 1);
    return true;
  }
};

window.Hand.prototype.render = function() {
  this.$html.empty();

  var handWidth = 230;
  var tileWidth = 43;
  var tileYOffset = 43;
  var tileYSpacing = 10;
  var left = (handWidth / 2) - (tileWidth / 2);

  this.hand.forEach(function(x, idx) {
    var top = tileYOffset + tileYSpacing * idx + tileWidth * idx;
    var $tile = $('<div>', {
      'class': 'tile tile-' + x,
      'style': 'left: ' + left + 'px; top: ' + top + 'px;',
      'data-pos': idx
    });

    $tile.draggable({
      containment: '#mat',
      stop: this.dragStop
    });

    this.$html.append($tile);
  }, this);
};

$(document).ready(function() {
  window.board = new Board($('#board'));
  window.deck = new Deck();
  window.hand = new Hand($('#pane-r'), board);

  hand.draw(deck);
  hand.render();

  board.stageTile(5, 5, 'a');
  board.stageTile(5, 6, 'a');
  board.stageTile(5, 7, 'a');
  board.stageTile(6, 6, 'a');
  board.stageTile(5, 7, 'a');
  board.stageTile(5, 4, 'c');
  board.unstageTile(5, 4);
  board.commitTiles();

  board.stageTile(4, 4, 'b');
  board.stageTile(4, 5, 'b');

  board.render();
});
