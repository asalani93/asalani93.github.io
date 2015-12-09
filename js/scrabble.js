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

Distribution.prototype.shuffle = function() {
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

Deck.prototype.draw = function() {
  if (this.deck.length > 0) {
    var draw = this.deck[0];
    this.deck = _.rest(this.deck);
    return draw;
  } else {
    return null;
  }
};

Deck.prototype.reset = function() {
  this.deck = (function() {
    var dist = new Distribution();
    return dist.shuffle();
  })();
};

Deck.prototype.size = function() {
  return this.deck.length;
};

Deck.prototype.render = function() {
  // do something
};

var initializeEvents = function() {
  var turn = 0;
  var isValid = [false, ''];
  var score = 0;

  var $commitBtn = $('#commit-btn');
  var $restartBtn = $('#restart-btn');
  var $currentScore = $('#current-score');
  var $totalScore = $('#total-score');

  var checkIfValid = function() {
    isValid = board.validateStaging(turn);

    if (isValid[0]) {
      $commitBtn.removeClass('btn-disabled');
      $currentScore.removeClass('err');
      $currentScore.children('p').text('Current Score: ' + board.currentScore());
    } else {
      $commitBtn.addClass('btn-disabled');
      $currentScore.addClass('err');
      $currentScore.children('p').text(isValid[1]);
    }
  };

  // check if the initial board state is valid (it isn't)
  checkIfValid();

  // on a change in the board, check if its valid
  board.onStage(checkIfValid);

  $commitBtn.click(function() {
    if (isValid[0]) {
      // commit the tiles to the board
      var newScore = board.commitTiles();
      score += newScore;
      $totalScore.children('p').text('Total Score: ' + score);
      hand.draw(deck);

      // increment the turn
      turn += 1;

      // redraw the game
      hand.render();
      board.render();
    } else {      
      // flash the errors so people know something's wrong
      $currentScore.css({backgroundColor: '#FF0000'});
      $currentScore.animate({
        backgroundColor: '#000000'
      }, {
        duration: 1000,
        queue: false
      });
    }
  });

  $restartBtn.click(function() {
    turn = 0;

  });
}

$(document).ready(function() {
  window.board = new Board($('#board'), null);
  window.deck = new Deck();
  window.hand = new Hand($('#pane-r'), board);
  board.hand = hand;

  hand.draw(deck);
  hand.render();
  board.render();

  initializeEvents();
});
