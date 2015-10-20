/*
  File:  /~asalani/js/assignment-6.js
  91.461 Assignment: Creating an Interactive Dynamic Table
  Anthony Salani, UMass Lowell Computer Science, asalani93@gmail.com
  Copyright (c) 2015 by Anthony Salani.  All rights reserved.  May be freely 
    copied or excerpted for any purpose with credit to the author.
  Created by AAS on October 17, 2015

  Handles form validation and creation of the multiplication table.
*/

"use strict";

(function() {
  /*
    On load, calculate the table from the parameters in the URL
  */
  $(document).ready(function() {
    parseOptions();
    initializeForm();
    if (hasParameters() && validate()) {
      // the timeout is so the validation errors will actually get shown
      // prior to the table displaying - this is needed on large tables
      window.setTimeout(generateTable, 0);
    }
  });

  /*
    On submit, do the same
  */
  $("#input-button > button").click(function(e) {
    // Change the URL without changing the page
    // encodeURIComponent is so you can't enter values that would change the URL
    //   in a meangingful way
    var tx = encodeURIComponent($('#input-tx').val().trim());
    var ty = encodeURIComponent($('#input-ty').val().trim());
    var lx = encodeURIComponent($('#input-lx').val().trim());
    var ly = encodeURIComponent($('#input-ly').val().trim());
    var url = 'assignment-6.html?tx=' + tx + '&ty=' + ty + '&lx=' + lx + '&ly=' + ly;
    window.history.pushState(null, null, url);

    // generate the table from the URL
    parseOptions();
    initializeForm();
    if (hasParameters() && validate()) {
      // the timeout is so the validation errors will actually get shown
      // prior to the table displaying - this is needed on large tables
      window.setTimeout(generateTable);
    }

    // We don't want to reload, the table is already generated
    e.preventDefault();
  });

  /*
    A list of validators to run on the input to the multiplication table.
    All are functions that take the arguments (lx, ly, tx, ty)
    They return a list of two elements: an error and a warning
    A null value in either of these indicates no error/warning
    If there are no errors, the table will generate
  */
  var validators = [
    function(lx, ly, tx, ty) {
      var prod = Math.abs(lx - ly) * Math.abs(tx - ty);
      if (prod > 100000) {
        return ['Generated table area exceeds 50000 cells', null];
      } else {
        return [null, null];
      }
    },
    function(lx, ly, tx, ty) {
      return validateStrToInt('Number 1', tx);
    },
    function(lx, ly, tx, ty) {
      return validateStrToInt('Number 2', ty);
    },
    function(lx, ly, tx, ty) {
      return validateStrToInt('Number 3', lx);
    },
    function(lx, ly, tx, ty) {
      return validateStrToInt('Number 4', ly);
    },
    function(lx, ly, tx, ty) {
      return validateOrder('Number 1', 'Number 2', tx, ty);
    },
    function(lx, ly, tx, ty) {
      return validateOrder('Number 3', 'Number 4', lx, ly);
    },
    function(lx, ly, tx, ty) {
      if (Math.abs(tx - ty) > 24) {
        return [null, 'The table is wide, and you must scroll to see the end'];
      } else {
        return [null, null];
      }
    }
  ];

  /*
    Helper function to assist in validating each number
  */
  var validateStrToInt = function(name, val) {
    var toNum = Number(val);
    var toInt = parseInt(val);
    var toFlt = parseFloat(val);

    if (isNaN(toNum) || isNaN(toInt)) {
      return ['Value for ' + name + ' is not a number', null];
    } else if (toInt !== toFlt) {
      return [null, 'Value for ' + name + ' is not an integer, using ' + toInt + ' instead'];
    } else {
      return [null, null];
    }
  }

  /*
    Helper function to validate the minimum and maximum values in a row or column
  */
  var validateOrder = function(lName, rName, l, r) {
    var lNum = parseInt(l);
    var rNum = parseInt(r);
    if (rNum < lNum) {
      return [null, 'Values for ' + lName + ' and ' + rName + ' are in reverse order'];
    } else {
      return [null, null];
    }
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

  /*
    Validates the given values
  */
  var validate = function() {
    var lx = window.parsedOptions.lx;
    var ly = window.parsedOptions.ly;
    var tx = window.parsedOptions.tx;
    var ty = window.parsedOptions.ty;

    var msgs = {
      errors: [],
      warnings: []
    };

    // check the input against each validator and push any errors or warnings
    validators.forEach(function(x) {
      var res = x(lx, ly, tx, ty);
      if (res[0] !== null) {
        msgs.errors.push(res[0]);
      }
      if (res[1] !== null) {
        msgs.warnings.push(res[1]);
      }
    });

    $('#validation-errors').empty();
    if (msgs.errors.length > 0) {
      var $ul = $("<ul>").append('<li>Errors:</li>');
      msgs.errors.forEach(function(x) {
        $ul.append($('<li>' + x + '</li>'));
      });
      $('#validation-errors').empty().append($ul);
    }

    $('#validation-warnings').empty();
    if (msgs.warnings.length > 0) {
      var $ul = $('<ul>').append('<li>Warnings:</li>');
      msgs.warnings.forEach(function(x) {
        $ul.append($('<li>' + x + '</li>'));
      });
      $('#validation-warnings').empty().append($ul);
    }

    // if we return true here, the table is computed
    return msgs.errors.length === 0;
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
