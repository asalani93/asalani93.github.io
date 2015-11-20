/*
  File:  /~asalani/js/assignment-8.js
  91.461 Assignment: Creating an Interactive Dynamic Table
  Anthony Salani, UMass Lowell Computer Science, asalani93@gmail.com
  Copyright (c) 2015 by Anthony Salani.  All rights reserved.  May be freely 
    copied or excerpted for any purpose with credit to the author.
  Created by AAS on November 18, 2015

  Handles form validation and creation of the multiplication table.
*/

"use strict";

(function() {
  // the validation object
  var validator = null;

  // The array of the currently open tabs (so we can populate the sliders when
  //   the current tab changes.
  var tabs = [];

  // A string containing the HTML for the close button.
  // Taken from the jQuery UI tabs example page.
  var closeBtn = '<span class="ui-icon ui-icon-close" role="presentation">Remove Tab</span>'

  // On load, calculate the table from the parameters in the URL
  $(document).ready(function() {
    // start the multiplication table off as hidden
    $('#mult-tabs').hide();

    // initialize the tabs
    $('#mult-tabs').tabs();

    /*
      Create the sliders.  All of them should behave identically, aside from the
        text box that they are bound to.  Also handles one half of the two-way data
        binding.
    */
    $('.slider').slider({
      max: 100,
      min: -100,
      step: 1,
      value: 0,
      slide: function(event, ui) {
        // Copies the current value of the slider to the bound text box.
        var $textBox = $('#' + $(this).attr('data-bind'));
        $textBox.val(ui.value);
      },
      start: function() {
        $('#input-form').valid();
      },
      stop: function() {
        $('#input-form').valid();
        regenerateTable();
      }
    });

    /*
      Set up data binding for the text boxes.
    */
    $('.textbox').keyup(function() {
      var $slider = $('#' + $(this).attr('data-bind'));
      $slider.slider('value', $(this).val());
      $('#input-form').valid();
    });

    $('.textbox').blur(function() {
      // Reflect this change in the current table, but only once we leave the textbox
      regenerateTable();
    });

    $("#btn-save").click(function(e) {
      // Reflect the most recent change in the current table before making a new one
      regenerateTable();

      // Change the URL without changing the page
      // encodeURIComponent is so you can't enter values that would change the URL
      //   in a meangingful way
      var tx = encodeURIComponent($('#input-tx').val().trim());
      var ty = encodeURIComponent($('#input-ty').val().trim());
      var lx = encodeURIComponent($('#input-lx').val().trim());
      var ly = encodeURIComponent($('#input-ly').val().trim());
      var url = 'assignment-8.html?tx=' + tx + '&ty=' + ty + '&lx=' + lx + '&ly=' + ly;
      window.history.pushState(null, null, url);

      // generate the table from the URL
      parseOptions();
      initializeForm();
      if (hasParameters() && $('#input-form').valid()) {
        window.setTimeout(function() {
          saveTable(lx, ly, tx, ty);
        });
      }

      // We don't want to reload, the table is already generated
      e.preventDefault();
    });

    $('#btn-clear').click(function(e) {
      var $multTabs = $('#mult-tabs');

      // Delete all of the tabs and panes, then efresh the tabbed box
      $multTabs.find('ul > li, div').remove();
      $multTabs.tabs('refresh');

      // Hide the tabbed box
      $multTabs.hide();

      // Clear out the array of tabs because we don't need those anymore
      tabs = [];

      // We don't want to reload, the table is already generated
      e.preventDefault();
    });

    $('#mult-tabs-bar').on('click', '.ui-icon-close', function() {
      // Get the index of the tab that was clicked.
      var tabPos = $(this).parent().index();

      // Remove the associate tab and pane, then refresh the tabs
      $(this).parent().remove();
      $('#mult-tabs').children(':nth-child(' + (tabPos + 2) + ')').remove();
      $('#mult-tabs').tabs('refresh');

      // Remove that item from the tab listing
      tabs = tabs.filter(function(x, idx) { return idx !== tabPos; });

      // Hide the tab interface if we've deleted all of the tabs
      if (tabs.length === 0) {
        $('#mult-tabs').hide(); 
      }
    });

    $('.ui-tabs-nav').on('click', 'li', function() {
      console.log('a');
      var index = $(this).index();
      var values = tabs[index];
      var lx = values[0];
      var ly = values[1];
      var tx = values[2];
      var ty = values[3];

      // Set the text box values
      $('#input-lx').val(lx);
      $('#input-ly').val(ly);
      $('#input-tx').val(tx);
      $('#input-ty').val(ty);

      // Set the slider values
      $('#slider-lx').slider('value', lx);
      $('#slider-ly').slider('value', ly);
      $('#slider-tx').slider('value', tx);
      $('#slider-ty').slider('value', ty);
    });

    parseOptions();
    initializeForm();
    setUpValidator();
    if (hasParameters()) {
      // We have all of the parameters, so we can start validating
      // There's no normal way for the URL to end up with partial values, so
      //   this works fine
      if ($('#input-form').valid()) {
        window.setTimeout(function() {
          var tx = $('#input-tx').val().trim();
          var ty = $('#input-ty').val().trim();
          var lx = $('#input-lx').val().trim();
          var ly = $('#input-ly').val().trim();
          saveTable(lx, ly, tx, ty);
        });
      }
    } else {
      // The validation hasn't actually run yet, here
      // Therefore, we need to manually hide the error box
      $('#validation-errors').hide();
    }
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
        var val = decodeURIComponent(window.parsedOptions[x]).trim()
        $('#input-' + x).val(val);
        $('#slider-' + x).slider('value', val);
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

  var generateTable = function(location, lx, ly, tx, ty) {
    var $table = $('<table>');

    if (lx === undefined) {
      lx = parseInt(window.parsedOptions.lx);
      ly = parseInt(window.parsedOptions.ly);
      tx = parseInt(window.parsedOptions.tx);
      ty = parseInt(window.parsedOptions.ty);
    }

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

    $(location).empty().append($table);
  };

  var saveTable = function(lx, ly, tx, ty) {
    // Make the table visible if it isn't already
    $('#mult-tabs').show();

    // Get a new name for the tab, append tab info to the array
    var tabName = 'tab-' + tabs.length;
    var tabTitle = '[' + lx + ', ' + ly + '] x [' + tx + ', ' + ty + ']';
    tabs.push([lx, ly, tx, ty]);

    // Create the tab
    var elem = '<li><a href="#' + tabName + '">' + tabTitle + '</a>' + closeBtn + '</li>';
    $('#mult-tabs-bar').append(elem);

    // Create the table
    $('#mult-tabs').append('<div id="' + tabName + '" class="mult-table"></div>');
    generateTable('#' + tabName);

    // Add the tab to where it should be in the tab bar
    // Make the most recent tab the visible one
    $('#mult-tabs').tabs('refresh');
    $('#mult-tabs').tabs('option', 'active', tabs.length - 1);
  };

  var regenerateTable = function() {
    // First, find the existing tab panel
    var $activeTab = $('.ui-tabs-nav > .ui-state-active');
    var $activeTabPane = $('.ui-tabs-panel[aria-hidden="false"]');

    // If we don't currently have an active tab, go no further
    if ($activeTabPane.length === 0 || !$('#input-form').valid()) {
      return;
    }

    var tx = $('#input-tx').val().trim();
    var ty = $('#input-ty').val().trim();
    var lx = $('#input-lx').val().trim();
    var ly = $('#input-ly').val().trim();

    // Get a new name for the tab, set tab info in the array
    var tabIndex = $activeTab.index();
    var tabName = $activeTabPane.attr('id');
    var tabTitle = '[' + lx + ', ' + ly + '] x [' + tx + ', ' + ty + ']';
    tabs[tabIndex] = [lx, ly, tx, ty];

    // Now, regenerate with the ID of the old pane so the link still works
    $activeTabPane.children('table').remove();
    generateTable('#' + tabName, lx, ly, tx, ty);

    // Set the tab name
    $activeTab.children('a').text(tabTitle);
  };
})();
