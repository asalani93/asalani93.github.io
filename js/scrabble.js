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

// returns a shuffled distribution of letters
Distribution.prototype.shuffle = function() {
  var that = this;
  var unshuffled = _.keys(this.dist).reduce(function(prev, curr) {
    var items = _.range(that.dist[curr].count).map(function() { return curr; });
    return prev.concat(items);
  }, []);

  return _.shuffle(unshuffled);
};

// the deck object that holds all of the tiles
window.Deck = function($html) {
  this.$html = $html;
  this.reset();
};

// pull a tile from the deck, return null if nothing is left
Deck.prototype.draw = function() {
  if (this.deck.length > 0) {
    var draw = this.deck[0];
    this.deck = _.rest(this.deck);
    return draw;
  } else {
    return null;
  }
};

// populate the deck with a valid distribution of letters
Deck.prototype.reset = function() {
  this.deck = (function() {
    var dist = new Distribution();
    return dist.shuffle();
  })();
};

// get back the number of tiles still in the deck
Deck.prototype.size = function() {
  return this.deck.length;
};

// redraw the box displaying the number of tiles remaining
Deck.prototype.render = function() {
  this.$html.empty();

  // create an object full of zeros for each letter
  var bins = {
    a: 0, b: 0, c: 0, d: 0, e: 0, f: 0,
    g: 0, h: 0, i: 0, j: 0, k: 0, l: 0,
    m: 0, n: 0, o: 0, p: 0, q: 0, r: 0,
    s: 0, t: 0, u: 0, v: 0, w: 0, x: 0,
    y: 0, z: 0, _: 0
  };
  this.deck.forEach(function(x) {
    bins[x] += 1;
  }, this);

  var letters = Object.keys(bins).sort(function(l, r) {
    var lCode = l.charCodeAt(0);
    var rCode = r.charCodeAt(0);

    // blank tiles should be last
    if (l === '_') {
      lCode += 1000;
    }
    if (r === '_') {
      rCode += 1000;
    }

    return lCode - rCode;
  });

  this.$html.append($('<div class="head">Tiles Left:</div>'));
  letters.forEach(function(x) {
    var $div = $('<div class="count">' +
      '<div class="letter">' + x + ':&nbsp;</div>' +
      '<div class="letter-amt">' + bins[x] + '</div>' +
    '</div>');
    this.$html.append($div);
  }, this);
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
      deck.render();
    } else {      
      // flash the errors so people know something's wrong
      $currentScore.css({backgroundColor: '#FF0000'});
      $currentScore.animate({
        backgroundColor: 'rgba(255, 0, 0, 0)'
      }, {
        duration: 1000,
        queue: false
      });
    }
  });

  $restartBtn.click(function() {
    turn = 0;
    score = 0;
    checkIfValid();
    $totalScore.children('p').text('Total Score: ' + score);

    window.board = new Board($('#board'), null);
    window.deck = new Deck($('#tile-count'));
    window.hand = new Hand($('#pane-r'), board);
    board.hand = hand;
    board.onStage(checkIfValid);

    hand.draw(deck);
    hand.render();
    board.render();
    deck.render();
  });
}

$(document).ready(function() {
  window.board = new Board($('#board'), null);
  window.deck = new Deck($('#tile-count'));
  window.hand = new Hand($('#pane-r'), board);
  board.hand = hand;

  hand.draw(deck);
  hand.render();
  board.render();
  deck.render();

  initializeEvents();
});
