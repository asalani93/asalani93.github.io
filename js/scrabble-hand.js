/*
  File:  /~asalani/js/scrabble.js
  91.461 Assignment 9: Implementing a Bit of Scrabble
  Anthony Salani, UMass Lowell Computer Science, asalani93@gmail.com
  Copyright (c) 2015 by Anthony Salani.  All rights reserved.  May be freely 
    copied or excerpted for any purpose with credit to the author.
  Created by AAS on November 25, 2015

  Provides scrabble and scrabble-related services.
  The class for the player's hand of scrabble tiles.
*/

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
      var hx = ui.helper.index();
      var tx = Math.floor(place[2] / 47);
      var ty = Math.floor(place[3] / 47);

      // unstage the current piece
      // needs to be done or else tile staging won't allow you to change axis w/ 2 pieces
      var letter = that.removeByIndex(hx);
      // try to stage the tile to it's new location
      var stageRes = that.board.stageTile(tx, ty, letter, false);

      if (stageRes !== null) {
        // this is the case where we try to stage a tile over an existing tile
        // this not a valid spot, move the tile back to it's home
        var x = ui.originalPosition.left;
        var y = ui.originalPosition.top;

        // add the current piece to the hand again
        that.addByIndex(hx, letter);
        slideHandToBoard(ui.helper, that.board, that, x, y);
      } else {
        var offBoard = $('#board').offset();
        var offPaneR = $('#pane-r').offset();
        var a = (place[2] + 2) + offBoard.left - offPaneR.left;
        var b = (place[3] + 2) + offBoard.top - offPaneR.top;
        slideHandToBoard(ui.helper, that.board, that, a, b);
      }
    } else {
      // there are no active regions, move the tile back to it's home
      var x = ui.originalPosition.left;
      var y = ui.originalPosition.top;
      slideHandToBoard(ui.helper, that.board, that, x, y);
    }

    // clear the current drop targets
    that.board.dropTargets = {};
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

window.Hand.prototype.removeByIndex = function(idx) {
  var letter = this.hand[idx];
  this.hand.splice(idx, 1);
  return letter;
}

window.Hand.prototype.addByIndex = function(idx, letter) {
  this.hand.splice(idx, 0, letter);
}

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
