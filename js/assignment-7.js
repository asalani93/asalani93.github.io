/*
  File:  /~asalani/js/assignment-6.js
  91.461 Assignment: Creating an Interactive Dynamic Table
  Anthony Salani, UMass Lowell Computer Science, asalani93@gmail.com
  Copyright (c) 2015 by Anthony Salani.  All rights reserved.  May be freely 
    copied or excerpted for any purpose with credit to the author.
  Created by AAS on November 4, 2015

  Handles form validation and creation of the multiplication table.
*/

"use strict";

(function() {
  // the validation object
  var validator = null;

  // On load, calculate the table from the parameters in the URL
  $(document).ready(function() {
    parseOptions();
    initializeForm();
    setUpValidator();
    if (hasParameters()) {
      // We have all of the parameters, so we can start validating
      // There's no normal way for the URL to end up with partial values, so
      //   this works fine
      if ($('#input-form').valid()) {
        window.setTimeout(generateTable);
      }
    } else {
      // The validation hasn't actually run yet, here
      // Therefore, we need to manually hide the error box
      $('#validation-errors').hide();
    }

    $("#input-button > button").click(function(e) {
      // Change the URL without changing the page
      // encodeURIComponent is so you can't enter values that would change the URL
      //   in a meangingful way
      var tx = encodeURIComponent($('#input-tx').val().trim());
      var ty = encodeURIComponent($('#input-ty').val().trim());
      var lx = encodeURIComponent($('#input-lx').val().trim());
      var ly = encodeURIComponent($('#input-ly').val().trim());
      var url = 'assignment-7.html?tx=' + tx + '&ty=' + ty + '&lx=' + lx + '&ly=' + ly;
      window.history.pushState(null, null, url);

      // generate the table from the URL
      parseOptions();
      initializeForm();
      if (hasParameters() && $('#input-form').valid()) {
        window.setTimeout(generateTable);
      }

      // We don't want to reload, the table is already generated
      e.preventDefault();
    });
  });

  var setUpValidator = function() {
    // A custom validator to tell if the user is making a really big table
    $.validator.addMethod('max_size', function(value, element, params) {
      // Parse and store the text field contents
      var lx = Number($('#input-lx').val().trim());
      var ly = Number($('#input-ly').val().trim());
      var tx = Number($('#input-tx').val().trim());
      var ty = Number($('#input-ty').val().trim());

      // Determine the range of numbers
      var lRange = Math.abs(lx - ly);
      var tRange = Math.abs(tx - ty);

      // If anything is NaN (invalid) or the range is small enough, return true
      // Otherwise, return false
      return ((lRange * tRange) <= params) || isNaN(lRange * tRange);
    }, 'Size of table is too large');

    // A custom validator to tell if the numbers are reversed.  If they are,
    //   we'll treat it as an error because I can't figure out how to convey
    //   warnings (ie: non-interrupting messages) to the user.
    $.validator.addMethod('reversed', function(value, element, params) {
      var l = Number($(params).val().trim());
      var r = Number(value.trim());

      if (isNaN(l) || isNaN(r)) {
        // If one of the numbers is not valid, don't bother showing an error
        // One will already be facing the user, and it wouldn't make sense to
        //   tell them that an unentered value is reversed.
        return true;
      } else if (l > r) {
        //  If the values are both numbers and are in reverse order, complain
        return false;
      } else {
        // Things are good
        return true;
      }
    }, 'Values are reversed');

    validator = $('#input-form').validate({
      rules: {
        lx: {
          number: true,
          required: true
        },
        ly: {
          number: true,
          required: true,
          reversed: '#input-lx'
        },
        tx: {
          number: true,
          required: true
        },
        ty: {
          number: true,
          required: true,
          max_size: 50000,
          reversed: '#input-tx'
        }
      },
      messages: {
        lx: {
          number: 'A number must be entered for multiplicand 1',
          required: 'A number must be entered for multiplicand 1'
        },
        ly: {
          number: 'A number must be entered for multiplicand 2',
          required: 'A number must be entered for multiplicand 2',
          reversed: 'The multiplicand values are reversed'
        },
        tx: {
          number: 'A number must be entered for multiplier 1',
          required: 'A number must be entered for multiplier 1'
        },
        ty: {
          number: 'A number must be entered for multiplier 2',
          required: 'A number must be entered for multiplier 2',
          max_size: 'The table is too large (exceeds 50000 elements)',
          reversed: 'The multiplier values are reversed'
        }
      },
      wrapper: 'li',
      errorContainer: '#validation-errors',
      errorElement: 'span',
      errorLabelContainer: '#validation-errors > ul',
      onkeyup: false,
      onfocusout: false
    });
  };

  /*
    Converts the search options in the URL to an Object and saves it to the
    window object so everything can use it
  */
  var parseOptions = function() {
    var searchQuery = location.search.substr(1);
    window.parsedOptions = searchQuery.split('&').map(function(x) {
      return x.split('=');
    }).reduce(function(prev, curr) {
      prev[curr[0]] = curr[1];
      return prev;
    }, {});
  };

  /*
    Initialize the form to the given values
  */
  var initializeForm = function() {
    var properties = ['tx', 'ty', 'lx', 'ly'];
    properties.forEach(function(x) {
      if (x in window.parsedOptions) {
        // decodeURIComponent is one half of the sanitization needed for these inputs
        // It prevents the same string from being repeatedly URI encoded.
        $('#input-' + x).val(decodeURIComponent(window.parsedOptions[x]).trim());
      }
    });
  };

  /*
    Do we have all of the parameters to compute the table?
    Not an error, a user can visit the page without having searched for anything
    so this doesn't belong in the list of validators
  */
  var hasParameters = function() {
    return ('tx' in window.parsedOptions) &&
           ('ty' in window.parsedOptions) &&
           ('lx' in window.parsedOptions) &&
           ('ly' in window.parsedOptions);
  };

  var generateTable = function() {
    var $table = $('<table>');

    var lx = parseInt(window.parsedOptions.lx);
    var ly = parseInt(window.parsedOptions.ly);
    var tx = parseInt(window.parsedOptions.tx);
    var ty = parseInt(window.parsedOptions.ty);

    var lRange = _.range(Math.min(lx, ly), Math.max(lx, ly) + 1);
    var tRange = _.range(Math.min(tx, ty), Math.max(tx, ty) + 1);

    var $headRow = $('<tr>');
    $headRow.append($('<td>*</td>'));
    tRange.forEach(function(x) {
      $headRow.append($('<td>' + x + '</td>'));
    });
    $table.append($headRow);

    lRange.forEach(function(x) {
      var rowVals = tRange.map(function(y) {
        return '<td>' + (x * y) + '</td>'
      });
      rowVals.unshift('<td>' + x + '</td>');
      $table.append($('<tr>' + rowVals.join() + '</tr>'));
    });

    $('#mult-table').empty().append($table);
  };
})();
