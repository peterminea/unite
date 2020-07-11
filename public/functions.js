

var autocomp = function(obj, data, enter) {//Not suitable for modals.

  var sel = obj.parent('div').find('select');
  for(var i in data) {
      var opt = '<option ' + 'style="word-wrap: break-word; width: 120px" title="' + data[i].name +'" value="' + data[i].value + '">' + data[i].name + '</option>';
      sel.append(opt);
  }
  /*
  if(1==2)
  $('ul.ui-autocomplete').not('div.container *')
    //.css('position', 'relative')
    .each(function(i, e) {
  if($(this).children('li').length) {
    $(this).css({'height': '75px', 'text-align': 'left'});

    $(this).find('li').each(function(index, element) {
      var name = data[index].name;
      $(element).css({'height': '15px'})
        .find('div').css({'font-family': 'arial', 'font-size': '15px'}).text(name);
      $(element).bind('click', function() {
        obj.val(name);        
        $(this).parent('ul').hide();
        if(enter) {
          //var e = $.Event( "keypress", { which: 13 } );          
          //obj.trigger(e);
          obj.parent('form').submit();
        }
        });
      });
    }
  });*/
};


function initGrid(colModel, data, gridId, pagerId, sortName, theName, width) {
    $(`${gridId}`).jqGrid({
      colModel: colModel,
      data: data,
      guiStyle: "bootstrap4",
      iconSet: "fontAwesome",
      idPrefix: "gb1_",
      viewrecords : true,
      gridview : true,
      altRows: true,
      pager:  pagerId,
      rowNum: 30,
      //scroll: 1,
      shrinkToFit: true,
      //autowidth: true,
      rownumbers : true,
      pagination: true,
      autoencode : false,
      toolbar: [true, "top"],
      width: !width? 2950 : width,
      //height: 300,
      sortname: sortName,
      sortorder: "asc",
      caption: `The ${theName} grid, which uses predefined formatters and templates:`
    });
    
    $(`${gridId}`).navGrid(pagerId, {edit: true, add: true, del: true, refresh: true, view: true});
    $(`${gridId}`).inlineNav(pagerId,
              // the buttons to appear on the toolbar of the grid
      { 
          edit: true, 
          add: true, 
          del: true, 
          cancel: true,
          editParams: {
              keys: true,
          },
          addParams: {
              keys: true
          }
      });
}


function getCurrenciesList(elem, url, token) {//For <select> drop-down currencies.
  var obj = $('' + elem + '');
  
  $.ajax({
    url: url,
    headers: { "X-CSRF-Token": token },
    datatype: 'jsonp',
    type: "GET",
    //data: req,
    success: function(data) {
    if(!data || !data.length || treatError(data, 'loading currencies')) {
        //obj.val('');
        obj.append('<option>No results found.</option>');
        return false;
      }

      for(var i in data) {
        var opt = '<option ' + 'style="word-wrap: break-word; width: 50px" title="' + data[i].value +'" value="' + data[i].name + '">' + data[i].name + '</option>';
        obj.append(opt);
      }
      //res(data);
      //autocomp(obj, data, isEnter);          
    },
    error: function(err) {
      alert(err);
    }
  });
}


function getProductsList(elem, url, token) {//For <select> drop-down currencies.
  var obj = $('' + elem + '');
  
  $.ajax({
    url: url,
    headers: { "X-CSRF-Token": token },
    datatype: 'jsonp',
    data: {supplierId: obj.attr('supplierId')},
    type: "POST",
    success: function(data) {
    if(!data || !data.length || treatError(data, 'retrieving products')) {
        //obj.val('');
        obj.append('<option>No results found.</option>');
        return false;
      }

      obj.append('<option></option>');
      
      for(var i in data) {
        var opt = '<option ' + 'style="word-wrap: break-word; width: 50px" price="' + data[i].price 
          + '" maxAmount="' + data[i].amount + '" productImage="' 
          + data[i].productImage + '" currency="' + data[i].currency + '" title="' 
          + data[i].name +'" value="' + data[i].name + '">' + data[i].name + '</option>';
        
        obj.append(opt);
      }
      //res(data);
      //autocomp(obj, data, isEnter);          
    },
    error: function(err) {
      alert(err);
    }
  });
}

/*
function getValues(elem, url, token, isEnter) {
  var obj = $('' + elem + '');

  $.ajax({
    url: url,
    headers: { "X-CSRF-Token": token },
    datatype: 'jsonp',
    type: "GET",
    //data: req,
    success: function(data) {//alert(res);
    if(!data || !data.length) {//Recommended to disable it for a better user experience. We can add our items as well.
        //obj.val('');
        //return false;
      }
      //res(data);
      //alert(data.length);
      autocomp(obj, data, isEnter);          
    },
    error: function(err) {
      alert(err);
    }
  });
  }
  */


function openDropdown(obj) {
  function down() {
      var obj = $(this);
      var pos = obj.offset(); // remember position
      var len = obj.find("option").length;
      
      if(len > 10) {
        len = 10;
      }
      
      obj.css({"position": "relative", "zIndex": 9999});
      obj.offset(pos);   // reset position
      obj.attr("size", 20+len); // open dropdown
      obj.unbind("focus", down);
      //obj.focus();
  }

  function up() {
      var obj = $(this);    
      obj.css("position", "static");
      obj.attr("size", "1");  // close dropdown
      obj.unbind("change", up);
      //obj.focus();
  }
  
    obj.focus(down).blur(up).focus();
}


function getAutocomplete(elem, url, token, isEnter) {
  $('' + elem + '').autocomplete({
    source: function(req, res) {
      var obj = $(this.element);
      var sel = obj.parent('div').find('select');
      var data = [], found = false;
      
      sel.find('option.autocomp').remove();
      var arr = sel.find('option').not('.first');
      
      arr.each(function(index, element) {
        if(req.term.length) {
          if($(element).text().toLowerCase().includes(req.term.toLowerCase())) {
            data.push($(element).text());
            found = true;
          } else {
            //$(element).css('visibility', 'hidden');
          }
          
          if(found == true && index == arr.length-1) {
            for(var i = data.length-1; i >= 0; i--) {
              sel.prepend(`<option class='autocomp'>${data[i]}</option>`);
            }
            //sel.simulate('click');
            sel.prepend('<option class="autocomp">...</option>');
            sel.find('option.autocomp').eq(0).prop('selected', true);
            openDropdown(sel);
          }
        }
      });
    },
    minLength: 3,
    delay: 50,
    focus: function (event, ui) {
        if(!ui.item)
          return false;
        this.value = ui.item.name;
        event.preventDefault();
     },
    select: function(event, ui) {
      if(ui.item) {
        $(this).val(ui.item.name);
        event.preventDefault();
      }
    }
  });
}


function validatePassword(password) {
  // Do not show anything when the length of password is zero.
  if (password.length === 0) {
      $("#msg").text('');
      return;
  }
  // Create an array and push all possible values that you want in password
  var matchedCase = new Array();
  matchedCase.push("[$@$!%*#?&]"); // Special Character
  matchedCase.push("[A-Z]");      // Uppercase letters
  matchedCase.push("[0-9]");      // Numbers
  matchedCase.push("[a-z]");     // Lowercase letters

  // Check the conditions
  var ctr = 0;
  for (var i = 0; i < matchedCase.length; i++) {
      if (new RegExp(matchedCase[i]).test(password)) {
          ctr++;
      }
  }
  // Display it:
  var color = "", strength = "";
  
  switch (ctr) {
      case 0:
        strength = "Extremely Weak";
        color = "black";
        break;
      case 1:
        strength = "Weak";
        color = "red";
        break;
      case 2:
        strength = "Medium";
        color = "orange";
        break;
      case 3:
        strength = "Good";
        color = "yellow";
        break;
      case 4:
        strength = "Strong";
        color = "green";
        break;
  }
 
  $("#msg")
    .css({'color': color})
    .text(strength);
}


function verifyMatch(password) {
  var mainPass = $('#password').val();
  $('#match').text(password !== mainPass? 'Passwords do not match!' : '')  
}


(function($) {
  $.fn.inputFilter = function(inputFilter) {
    return this.on("input keydown keyup mousedown mouseup select contextmenu drop paste", function() {
      if (inputFilter(this.value)) {
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        this.value = "";
      }
    });
  };
}(jQuery));


function sortTable() {//Ascending or descending. Each <th> column tag is involved.
  var table, rows, switching, i, x, y, colIndex, shouldSwitch;
  table = $(this).closest('table');  
  colIndex = table.find('th').index($(this));  
  table = table[0];
  switching = true;
  /*Make a loop that will continue until no switching has been done:*/
  var asc = 0, isNumber, compX, compY;
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the first, which contains table headers):*/
    for (i = 1; i < (rows.length - 1); i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare, one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[colIndex];
      y = rows[i + 1].getElementsByTagName("TD")[colIndex];
      //check if the two rows should switch place:
      isNumber = (x.innerHTML == parseInt(x.innerHTML)) || (x.innerHTML == parseFloat(x.innerHTML));
      compX = isNumber? Number(x.innerHTML) : x.innerHTML.toLowerCase();
      compY = isNumber? Number(y.innerHTML) : y.innerHTML.toLowerCase();
      
      if (compX > compY) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if(shouldSwitch) {
      asc = 1;
      /*If a switch has been marked, make the switch and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
  
  if(asc == 0) {//Already ASC sorted, let's sort back.
    switching = true;
    
    while (switching) {
      switching = false;
      rows = table.rows;
     
      for (i = 1; i < (rows.length - 1); i++) {
        shouldSwitch = false;       
        x = rows[i].getElementsByTagName("TD")[colIndex];
        y = rows[i + 1].getElementsByTagName("TD")[colIndex];
        
        isNumber = (x.innerHTML == parseInt(x.innerHTML)) || (x.innerHTML == parseFloat(x.innerHTML));
        compX = isNumber? Number(x.innerHTML) : x.innerHTML.toLowerCase();
        compY = isNumber? Number(y.innerHTML) : y.innerHTML.toLowerCase();
        
        if (compX < compY) {          
          shouldSwitch = true;
          break;
        }
      }
      if(shouldSwitch) {
        asc = 1;       
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }    
  }  
}


function treatError(data, message) {
    if(data && data.message) {//Error!
      Swal.fire({
        icon: 'error',
        title: `Error on ${message}!`,
        text: data.message
      });

      return true;
    }
  
  return false;
}


function treatDiv(div, isMulti, val, input) {
    if(isMulti) {
      var newIndex = div.parent('div').find('div').index(div);
      //alert(div.parent('div').length + ' ' + newIndex + ' ' + div.parent('div').hasClass('fileWrapper'));
      var val2 = val.substring(0, val.length-1);
      val2 = val2.split(',');      
      val2.splice(newIndex, 1);      
      input.attr('value', (val2 && val2.length)? val2.toString() + ',' : '');
      
      if(!val2 || !val2.length)
        input.val('');
    } else {
      input.attr('value', '');
      input.val('');
    }
  
  input.trigger('change');//Enable Profile button!
  div.remove();
}


function removeFile(obj, Swal) {//remove from Glitch 
  var token = $(obj).attr('token');
  var file = $(obj).attr('file')? $(obj).attr('file') : '';
  var tr = $(obj).parent('div')? null : $(obj).parent('td').parent('tr');
  var div = tr? null : $(obj).parent('div');
  var isMulti, input, val;
  
  if(tr == null) {
   isMulti = div.parent('div').hasClass('fileWrapper');  
   input = isMulti? 
      div.parent('div').prev('div').find('.upload') : div.prev('div').find('.upload');
   val = input.attr('value');
  }
  
  const SwalCustom = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger'
    },
    buttonsStyling: true
  });
  
  var name = $(obj).attr('name')? $(obj).attr('name') : 'public/' + file.substring(3);
  
  SwalCustom.fire({
    title: 'Are you sure?',
    text: "You will not be able to revert the file deletion!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#445544',
    cancelButtonColor: '#d33d33',
    confirmButtonText: 'I understand!'//,
    //reverseButtons: true
  }).then((result) => {
    if(result.value) {//OK pressed. Undefined if Cancel.
      //return false;
      $.ajax({
        url: '/deleteFile',
        type: 'POST',
        headers: { "X-CSRF-Token": token },
        data: {file: name},
        datatype: 'application/json',
        error: function() {
          tr? tr.remove() : treatDiv(div, isMulti, val, input);
          SwalCustom.fire({
            title: 'Deleted!',
            text: 'The file has been deleted.',
            icon: 'success'
          });
        },
        success: function(data) {
          if(treatError(data, 'deleting file')) {
            return false;
          }
          
          tr? tr.remove() : treatDiv(div, isMulti, val, input);
          SwalCustom.fire({
            title: 'Deleted!',
            text: 'The file has been deleted.',
            icon: 'success'
          });
        }
      });      
    }
  });
}


function isJson(obj) {
  if(!obj || !obj.length || !(Array.isArray(obj)))
    return false;
  if(obj.toString().charAt(0) == '[')//To be or not to be a JSON array.
    return false;
  return true;
}


function isUnique(value, index, self) {//Unique values in JS arrays.
    return self.indexOf(value) === index;
}

 
//var unique = myArray.filter(isUnique);
//var unique = myArray.filter((v, i, a) => a.indexOf(v) === i);
function checkName(arr, name) {
  for(var i in arr) {
    if(arr[i].toLowerCase() == name.toLowerCase())
      return true;
  }
  
  return false;
}

function getId(val) {
  return !val? null : val.substr(val.indexOf('_') + 1);
}


function initBaseRates(fx, elem) {
  if(typeof fx == 'undefined')
    return false;
  
  setTimeout(function() {
    fx.base = 'EUR';
    fx.rates = {
      "EUR" : 1, // eg. 1 USD === 0.745101 EUR
      "GBP" : 0.91, // etc...
      "CHF" : 1.07,
      "CAD" : 1.53,
      "AUD" : 1.64,
      "TRL" : 7.74,
      "SEK" : 10.53,
      "NOK" : 10.81,
      "USD" : 1.13,        // always include the base rate (1:1)
      "RON" : 4.84
      /* etc */
    };
    
    var el = $(''+elem+'');
    if(el && el.length) {
      $(''+elem+'').find('option[value="' + fx.base + '"]').attr('selected', 'selected');
      $(''+elem+'').trigger('change');
    }
  }, 100);
}


function bindHandleProduct(obj, prodServiceInput, fromBuyer, id, isRow, isAdd) {//Add/remove items, delete entire lines of products.
  const SwalCustom = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger'
    },
    buttonsStyling: true
  });
  
  obj.on('click', function() {
    var li = $(this).parent('span').parent('li'), ul;
    var divId = fromBuyer? $('#jqDiv_'+id) : $('#jqDiv');
    var gridId = fromBuyer? $('#grid_'+id) : $('#grid');
    var isUl = false, rowId;
    
    if(!li.length) {//Not from list, but from grid.
      li = $(this).parent('span').closest('tr');
      ul = li.closest('table');
    } else {
      ul = li.parent('ul');
      isUl = true;
    }
    
    //divId.prev('div').find('ul');
    var counter = divId.prev('div').find('p.term span');
    var entireAmount = parseInt(li.find('.amount').text());
    var index = isUl? ul.find('li').index(li) : ul.find('tr').index(li);
    var rowid = 'gb1_'+(index-1);

    if(isAdd && entireAmount == parseInt(li.attr('maxAmount'))) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'The maximum stock of the Supplier for the Product ' + li.find('.product').text() + ' is ' + entireAmount + '.'
      });
      
      return false;
    }

    var handledAmount = isRow? entireAmount : 1;
    var rowPrice = parseFloat(li.find('span.totalPrice').text()).toFixed(2);      
    var handledPrice = handledAmount * parseFloat(li.find('span.price').text()).toFixed(2);
    var supplierCurrency = fromBuyer? ul.attr('suppCurrency') : li.find('span.currency').first().text();
    var totalPagePrice = fromBuyer? parseFloat(li.attr('totalPrice')).toFixed(2) : parseFloat($('#hiddenTotalPrice').val()).toFixed(2);
    
    var canContinue = true;
    var totalAmountInput = fromBuyer? $('#totalAmount_'+id) : $('#totalSupplyAmount');
    var localAmount = isAdd? entireAmount + handledAmount : entireAmount - handledAmount;
    var localPrice = isAdd? parseFloat(parseFloat(rowPrice) + parseFloat(handledPrice)).toFixed(2) : parseFloat(rowPrice - handledPrice).toFixed(2);
    var newAmount = isAdd? parseInt(totalAmountInput.val()) + handledAmount : parseInt(totalAmountInput.val()) - handledAmount;
    var newPrice = isAdd? parseFloat(parseFloat(totalPagePrice) + parseFloat(handledPrice)).toFixed(2) : parseFloat(totalPagePrice - handledPrice).toFixed(2);
    
    isUl? ul.find('li').attr('totalPrice', parseFloat(newPrice)) : ul.find('tr').attr('totalPrice', parseFloat(newPrice));
    totalAmountInput.val(parseInt(newAmount));    
    
    if(isRow || (entireAmount==1 && !isAdd)) {//Delete Row. If 1.
      //if(!confirm('Warning: You are about to remove the entire product row.'))
        //return false;
      SwalCustom.fire({
        title: 'Are you sure?',
        text: "You are about to remove the entire product row.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#444444',
        cancelButtonColor: '#d22d22',
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Dismiss'
        //, reverseButtons: true
      }).then((result) => {
        if(result.value) {
          li.remove();
          var newValue = -1 + parseInt(counter.text());
          counter.text(newValue);
          if(!isUl)
            gridId.jqGrid('delRowData', rowId);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          canContinue = false;
        }
      });
    } else {
      gridId.jqGrid('editRow', index, true)
      
      li.find('.amount').text(localAmount);
      li.find('span.totalPrice').text(localPrice);
      if(!fromBuyer) {
        li.attr('amount', localAmount);
        li.attr('price', localPrice);
      }
      
      if(!isUl && isAdd) {
        rowId = gridId.jqGrid('getRowData', rowid);
        var td = li.find('span.priceWrapper0').parent('td');
        td.find('span:lt(2)').attr({'title': localPrice});
        rowId.totalPrice = td.html();
        //alert(td.html())
        td = li.find('span.amountWrapper0').parent('td');
        
        td.find('span:gt(0)').attr({'title': localAmount});
        td.find('span:first').attr({'title': localAmount + ' items'});
        //alert(td.html())
        rowId.amount = td.html();
        //alert(5);
        gridId.jqGrid('saveRow', rowid);
        //alert(rowId.totalPrice + '\n' + td.html());
      }
    }
    
    if(!fromBuyer) {
      $('#hiddenTotalPrice').val(parseFloat(newPrice));
      $('#totalSupplyPrice').text(newPrice + ' ' + supplierCurrency);
      prodServiceInput.trigger('change');
    } else {
      var span = $('span.bidCurrency[index="'+id+'"]').first();
      $('#buyerPriceUnit_'+id).text(parseFloat(localPrice).toFixed(2));
      var suppUnitVal = fx.convert(localPrice, {from: span.text(), to: supplierCurrency});
      $('#supplierPriceUnit_'+id).text(parseFloat(suppUnitVal).toFixed(2));
      var supp = parseFloat(fx.convert(newPrice, {from: span.text(), to: supplierCurrency})).toFixed(2);
      $('#price_'+id).text(parseFloat(newPrice).toFixed(2));
      $('#supplierPrice_'+id).text(supp);
      
      gridId.trigger('reloadGrid');
      
      if(canContinue == false)
        return false;
    }
  });
}


function removeAllProducts() {//Supplier products.
  $("#prodServices").find('li').remove();
  $('input.supply').each(function() {
    $(this).val('');
  });
  $('span.supply').each(function() {
    $(this).text('0');
  });
  
  $('#totalSupplyAmount').val(0);
  $('#totalSupplyPrice').text('0 ' + $('input[name="currency"]').val());
  $('#hiddenTotalPrice').val('0 ' + $('input[name="currency"]').val());
  $('#hiddenTotalAmount').val(0);
}


function removeAllItems(index) {//Bid items.
  $("#prodServices_"+index).find('li').remove();
  $("#hiddenProdServicesList_"+index).val('');
  $("#amountList_"+index).val('');
  $("#priceList_"+index).val('');
  $("#productImagesList_"+index).val('');
  $('#totalAmount_'+index).val('0');
  $('span.hid').each(function() {
    var procSpan = $(this).find('span').first();
    procSpan.text(0);
  });
}


function addition(prod, prodVal, priceVal, currencyVal, amountVal, imagePath, elem, fromBuyer) {  
  var isPresent = false;
  elem.find('.product').each(function() {
    if($(this).text() == prodVal) {
      isPresent = true;
      return false;
    }
  });
  
  if(isPresent) {
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'You have already added ' + prodVal + ' to the list. Please refine your selection.'
    });
  } else {
      var id = fromBuyer? getId(elem.attr('id')) : null;
      var addedPrice = parseFloat(priceVal * amountVal).toFixed(2);
      var priceInput = fromBuyer? $('#price_'+id) : $('#totalSupplyPrice');
      var pageCurrency = fromBuyer? $('#currency_'+id).text() : $('input[name="currency"]').val();
      var buyerInput = fromBuyer? $("#prodServiceInput_"+id) : null;
      
      if(!fromBuyer) {
        $('#hiddenTotalPrice').val(parseFloat(parseFloat($('#hiddenTotalPrice').val()) + parseFloat(addedPrice)).toFixed(2));
      }
    
      var buyerPriceVal = fromBuyer? (priceInput.text()? parseFloat(priceInput.text()): 0): null;
      var bigPrice = fromBuyer? parseFloat((buyerPriceVal) + parseFloat(addedPrice)).toFixed(2) : parseFloat($('#hiddenTotalPrice').val()).toFixed(2);

      if(currencyVal != pageCurrency) {//Convert the values to the currency of buyer (or Supplier).
        addedPrice = parseFloat(fx.convert((addedPrice), {from: currencyVal, to: pageCurrency})).toFixed(2);
        currencyVal = pageCurrency;
        bigPrice = (fx.convert((bigPrice), {from: currencyVal, to: pageCurrency}));
      }
    
      if(!(elem.find('li').length)) {
        elem.append(`<li class='list-group-item' style='color: brown'><span class='cnt'>#</span><span class='product0'>Name</span><span class='buttonsWrapper'>Buttons</span><span class='imageWrapper'>Images</span><span class='priceWrapper'>Total</span><span class='amountWrapper'>Count</span>
<span class='basicPriceWrapper'>Price</span></span></li>`);
      }
                        
      var lis = elem.find('li').length;//table.find('tbody tr').length;
      
      elem.append(
        "<li class='list-group-item' price='" + addedPrice + "' totalPrice='" + bigPrice + (fromBuyer? "' maxAmount='" + (buyerInput.attr('maxAmount')? buyerInput.attr('maxAmount') : 2*amountVal) : '') + "' amount='" + amountVal + "'>"
        + `<span class='cnt'>${lis}</span><span class='product'>${prodVal}</span>
<span class='buttonsWrapper'><span class='rem' title="Delete"></span><span class='dec' title='Remove item'></span><span class='inc' title='Add item'></span></span>
<span class='imageWrapper'><span class='productImage' title='Image of Product'>` + (imagePath && imagePath.length? `<img src="${imagePath}" style="height: 25px; width: 30px" onclick="window.open(this.src)">` : '') +  `</span><span class='uploadImage'>Upload Image</span></span>
<span class='priceWrapper'><span class='totalPrice'>${addedPrice}</span> ${currencyVal}</span>
<span class='amountWrapper'><span class='amount'>${amountVal}</span> items</span>
<span class='basicPriceWrapper'><span class='price'>${priceVal}</span> <span class='currency'>${currencyVal}</span></span>
</li>`);
      
      var totalAmountInput = fromBuyer? $('#totalAmount_'+id) : $('#totalSupplyAmount');
      totalAmountInput.val(parseInt(totalAmountInput.val()) + parseInt(amountVal));
      var gridId = fromBuyer? $('#grid_'+id) : $('#grid');
      var divId = fromBuyer? $('#jqDiv_'+id) : $('#jqDiv');
      var src = imagePath && imagePath.length? imagePath : null;

      var data = {
                id: lis,
                name: prodVal,
                price: priceVal + ' ' + currencyVal,
                hiddenPrice: priceVal,
                hiddenTotalPrice: addedPrice,
                hiddenCurrency: currencyVal,
                productImageSource: src? `<img src="${src}" style="height: 25px; width: 30px" onclick="window.open(this.src)">` : '',
                amount: parseInt(amountVal),
                totalPrice: addedPrice + ' ' + currencyVal
      };
    
      gridId.jqGrid('addRowData', lis, data, 'last');
      var table = divId.find('table').eq(1);//Last
      var tr = table.find('tbody tr').eq(lis);
      tr.attr('price', addedPrice);
      tr.attr('totalPrice', bigPrice);
      tr.attr('amount', amountVal);
      if(fromBuyer) {
        tr.attr('maxAmount', (buyerInput.attr('maxAmount')? buyerInput.attr('maxAmount') : 2*amountVal));
      } 
    
      if(!fromBuyer) {
        $('#totalSupplyPrice').text(bigPrice + ' ' + currencyVal);
      } else {
        $('#price_'+id).text(parseFloat(bigPrice).toFixed(2));
        var supp = fx.convert(parseFloat($('#price_'+id).text()), {from: $('span.bidCurrency[index="'+id+'"]').first().text(), to: elem.attr('suppCurrency')});
        $('#supplierPrice_'+id).text(supp);
        elem.find('li').attr('totalPrice', bigPrice);
      }
      
      //var counter = elem.parent('div').find('p.term span');
      var counter = divId.prev('div').find('p.term span');
      var newValue = 1 + parseInt(counter.text());
      counter.text(newValue);
    
      bindHandleProduct(elem.find('.rem').last(), prod, fromBuyer, fromBuyer? getId(elem.attr('id')) : null, true, false);
      bindHandleProduct(elem.find('.inc').last(), prod, fromBuyer, fromBuyer? getId(elem.attr('id')) : null, false, true);
      bindHandleProduct(elem.find('.dec').last(), prod, fromBuyer, fromBuyer? getId(elem.attr('id')) : null, false, false);
      delegateUpload(elem.find('.uploadImage').last());
    
      bindHandleProduct(gridId.find('.rem').last(), prod, fromBuyer, fromBuyer? getId(elem.attr('id')) : null, true, false);
      bindHandleProduct(gridId.find('.inc').last(), prod, fromBuyer, fromBuyer? getId(elem.attr('id')) : null, false, true);
      bindHandleProduct(gridId.find('.dec').last(), prod, fromBuyer, fromBuyer? getId(elem.attr('id')) : null, false, false);
      delegateUpload(gridId.find('.uploadImage').last());
  }
}


function addProduct(obj) {
  obj.on('click', function() {
     var elem = $("#prodServices");
     var MAX = $("#prodServices").attr('MAX');

     if(elem.find('li').length >= MAX) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'You have reached the limit of ' + MAX + ' products to add.'
        });
        return false;
      }

      var input = $("#prodServiceInput");     
      var req = input.val().length && $('#price').val().length && $('#amount').val().length 
      && $('#price').val()> 0 && $('#amount').val() > 0
      && Number.isInteger(parseFloat($('#amount').val()));
      var imagePath = $('input.productimageupload').attr('filePath');

      if(req) {
        $('#prodServiceInput,#price,#currency').removeClass('errorField');
        addition(input, input.val(), $('#price').val(), $('#currency').val(), $('#amount').val(), imagePath, elem, false);
        input.val('');
        $('#price').val('0');
        $('#amount').val('0');
        $('#price').val('');
        $('#amount').val('');
        //$('#currency').val('');
        $('#addProdService').prop('disabled', true);
        $('.productRequired').remove();
        $('input.productimageupload')
          .attr('filePath', null)
          .attr('value', '');
        
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Warning',
          text: 'Please enter valid values for product name, price and amount.'
          });
        //alert('Please enter valid values for products, prices and currency.');
        $('#prodServiceInput,#price,#amount').addClass('errorField');
      }
    });
}


function userInputs(id, role, avatar, name, type, ul) {//Home, About, Terms, Antibribery - ensure link to user's profile if they are logged into session.
    var link = "";
    
    switch(type) {
      case 'Buyer':
        link = "/buyer";
        break;
        
      case 'Supervisor':
        link = "/supervisor";
        break;
        
      case 'Supplier':
        link = "/supplier";
        break;
        
      default:
        break;
      }
   
  if(id) {//We are logged in!
    ul.prepend('<li class="nav-item user">'
          +'<a class="nav-link" title="Hello" href="' + link + '">Hello, ' + name + ' (' + role + ')! ' 
               + (avatar? '<img src="'+ avatar +'" title="Profile image" style="height: 20px; width: 50px"' : '') + '</a>'
       + '</li>');
    
    var str = '';
    str += '<li class="nav-item logout">'
        + '<a class="btn btn-danger admin" marg="240" style="margin-top: -240px;" href="?exit=true&home=true" title="Clear user session/Logout">Logout</a>'
        + '</li>';
    
    ul.append(str);
    $('.signup').hide();
  }
}


function getCancelReasonTitles(obj, token, url) {//For deleting user accounts and cancelling bids. Types (titles) of reasons, expressed as radio buttons, should be chosen.
  $.ajax({
    url: url,//bidCancelReasonTitles or userCancelReasonTitles.
    type: 'GET',
    headers: { "X-CSRF-Token": token },
    datatype: 'application/json',
    error: function() {
    },
    success: function(data) {//data = titles.
      if(!data || !data.length || treatError(data, 'getting Cancellation Reasons')) {
        return false;
      }

      var str = '<div class="form-group">';
      str += '<label>Please select an option below and explain it.</label><br>';
      for(var i in data) {
        str += '<input type="radio" id="'+i+'" value="' + data[i].name + '">&nbsp;<label for="'+i+'">' + data[i].name + '</label><br>';
      }
      
      str += '</div>';
      obj.prepend(str);
      $('input[type="radio"]').on('change', function() {
        $('input[type="radio"]').not(this).prop('checked', false);
      });
    }
  });
}


function getFeedbackSubjects(obj, token, url) {
  $.ajax({
    url: url,
    type: 'GET',
    headers: { "X-CSRF-Token": token },
    datatype: 'application/json',
    error: function() {
    },
    success: function(data) {//data = subjects.
      if(!data || !data.length || treatError(data, 'getting Feedback Subjects')) {
        return false;
      }
      
      var str = '<div class="form-group">';
      str += '<label>Please select an option below and explain it*.</label><br>';
      str += '<select id="subjects"><option></option>';
      for(var i in data) {
        str += '<option id="'+i+'" value="' + data[i].name + '">'+ data[i].name + '</option>';
      }
      
      str += '</select></div>';
      obj.prepend(str);
      
      $('#subjects').on('change', function() {
        $(this).attr('title', $(this).find('option:selected').text());
      });
    }
  });
}


function getFeedbacks(obj, token, url) {
  $.ajax({
    url: url,
    type: 'GET',
    headers: { "X-CSRF-Token": token },
    datatype: 'application/json',
    error: function() {
    },
    success: function(data) {//data = feedbacks.
      if(!data || !data.length || treatError(data, 'getting Feedbacks')) {
        obj.prepend('<p class="term">There are currently no Feedbacks available. Please engage with your users first.</p>');
        return false;
      }
      
      var str = '';
      for(var i in data) {
        str += '<h5>#'+parseInt(1+parseInt(i))+'</h5><div class="form-group" style="border-style: dotted; border-color: green; text-align: center; color: brown; word-wrap: break-word; margin-bottom: 8px">';
        str += '<label>From:</label><br>';
        str += '<span id="name_'+i+'"><b>' + data[i].userName + '</b></span><br><br>';
        str += '<label>E-mail:</label><br>';
        str += '<span id="email_'+i+'"><b>' + data[i].userEmail + '</b></span><br><br>';
        str += '<label>Subject:</label><br>';
        str += '<span id="subject_'+i+'"><b>' + data[i].subject + '</b></span><br><br>';
        str += '<label>Message: </label><br>';
        str += '<span style="white-space: pre-line" id="text_'+i+'">' + data[i].message + '</span><br><br>';
        str += '<label>Date: </label><br>';
        str += '<span id="date_'+i+'">' + data[i].createdAt + '</span>';
        str += '</div>';
      }
     
      obj.prepend(str);     
    }
  });
}

function imageExists(image_url){
  var http = new XMLHttpRequest();
  http.open('HEAD', image_url, false);
  http.send();
  return http.status != 404;
}


function validCountry(obj) {
  var inputs = [];
  obj.each(function() {
    if(!($(this).hasClass('present'))) {
      inputs.push($(this).attr('title'));
    }
  });

  if(inputs.length) {
      Swal.fire({
        icon: 'error',
        title: 'error',
        text: 'Please enter a valid country name from the list for the input(s): ' + inputs.toString()
      });
    return false;
  }
  
  return true;
}


function treatLastLi() {
  var nextLi = $('li.last').next('li');
  $('li.last').removeClass('last');
  nextLi.addClass('last');
  return 30;
}


function supplierValidateFields(fx) {
  if($('#prodServices li').length == 0) {
    var obj = '<p class="productRequired littleNote">You are required to include at least one product or service.</p>';
    $(obj).insertBefore($(this));
    return false;
  } 

  if(!validCountry($('.country'))) {
    return false;
  }
  
  $('input.autocomp').not(".country").each(function() {
    var cls = !($(this).hasClass('present')) && !($(this).hasClass('changed'));
    $(this).next('input').val(cls? 'canSave' : '');
  });

  $('#hiddenTotalAmount').val(parseInt($('#totalSupplyAmount').val()));
  $('#hiddenTotalPrice').val($('#totalSupplyPrice').text());
  
  var arr = [], arr1 = [], arr2 = [], arr3 = [], arr4 = [];
  
  $('#prodServices li').not(':first').each(function(index, el) {
    var product = $(this).find('.product'), price = $(this).find('.price'), currency = $(this).find('.currency'), quantity = $(this).find('.amount'), productImageSpan = $(this).find('.productImage');
    var src = productImageSpan.find('img').length? productImageSpan.find('img').attr('src') : null;
    
    arr.push(product.text());
    arr1.push(parseFloat(price.text()).toFixed(2));
    arr2.push(currency.text());
    arr3.push(quantity.text());
    arr4.push(src? 'public/' + src.substring(3) : '');
  });

  var preferred = $('select.currency').find('option:selected').text();
  var isChanged = false;
  $('span.currency').each(function(ind, elem) {
    var curr = $(this).text();
    //var last = text.lastIndexOf(' ');
    //var curr = text.substring(last+1);
  
    if(preferred != curr) {
      isChanged = true;
      return false;
    }
  });

  if(isChanged && !confirm('One or more of your products have a different currency from the default you entered ('+ preferred +'). Conversion rates may apply if you continue. Please confirm or cancel.')) {
    return false;
  }
  
  $('#prodServicesList').val(arr);
  $('#pricesList').val(arr1);
  $('#currenciesList').val(arr2);
  $('#amountsList').val(arr3);
  $('#productImagesList').val(arr4);
  return true;
}


function registrationDialog(accountType) {
  $("#dialog").dialog({
    modal: true,
    width: 300,
    height: 450,
    open: function(event, ui) {
      var password = $('input[name="password"]').val(), passwordRepeat = $('input[name="passwordRepeat"]').val();
      if(password !== passwordRepeat) {
        $('#registration').addClass('error');
        $('#dialog').append('<p><b>Passwords do not match.</b></p>');
      } else {
        $('#registration').removeClass('error');
        $('#dialog').append('<p>Congratulations for choosing to register your ' + accountType + ' account on UNITE!<br>Your next step is to verify your e-mail address for the Account Confirmation link.<br>Please confirm your new Account in order to start using our Services.</p>');
      }
    },
    close: function(event, ui) {
        $('#dialog').text('');
    },
    buttons: {
      OK: function() {
        if(!($('#registration').hasClass('error'))) {
          setTimeout(function() {
            $('#registration').submit();
          }, 150);
        }
        
        $(this).dialog("close");
      },              
      Cancel: function() {
        $('#dialog').text('');
        $(this).dialog("close");
      }
    }
  });
}


function delegateUpload(obj) {
  obj.on('click', function() {
    var uploadInput,  li = $(this).parent('span').parent('li');
    var index;
    var id = getId(obj.attr('id'));
    
    if(li.length) {//List
      var ul = li.parent('ul');
      var div = ul.closest('div');
      var index = ul.find('li').index(li);
      uploadInput = div.find('input[id^="productImage"]');
    } else {//jqGrid
      var divId = id? $('#jqDiv_'+id) : $('#jqDiv');
      
      var tr = $(this).closest('tr');//parent('span').parent('td').parent('tr');
      var table = tr.closest('table');//parent('tbody').parent('table');
      var div = divId.prev('div');
      index = table.find('tr').index(tr);
      uploadInput = div.find('input[id^="productImage"]');
    }
 
    uploadInput
      .attr('fromOutside', index)
      .trigger('click');
  });
}


function prepareSortTable() {
  if($('th').length) {
    $('th').css({cursor: 'pointer'}).attr('title', 'Sort Asc/Desc');
    $('th').on('click', sortTable);
  }
}


function errorSuccess(Swal, errorMessage, successMessage) {
  if (errorMessage.length > 0) {
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: errorMessage
    });
  }
    

  if (successMessage.length > 0) {
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: successMessage
    });
  }
}


function fileExists(absolutePath, isMulti, ob, theDiv, fileId, i, val, token) {
    $.ajax({
      url: '/exists',
      type: 'POST',
      headers: { "X-CSRF-Token": token },
      data: {path: absolutePath},
      datatype: 'application/json',
      error: function() {
        Swal.fire({
          title: 'Not found!',
          text: 'Your file, ' + absolutePath + ', was not found.',
          icon: 'error'
        });
      },
      success: function(data) {
        if(!data || !data.exists) {
          Swal.fire({
            title: 'Not found!',
            text: 'Your file, ' + absolutePath + ', was not found.',
            icon: 'error'
          });
          return false;
        }
        
        var displayName = fileId.substring(fileId.lastIndexOf('/')+1);
        if(isMulti) {          
          ob += '<div><span class="fileName">' + displayName + '</span>&nbsp;&nbsp;<a href="' + fileId + '" file="' + fileId + '" title="Download ' + val[i] + '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;&nbsp;<span token="' + token + '" file="' + fileId + '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' + val[i] + ' file">Remove</span></div>';
          if(i == val.length-1) {
            ob += '<br></div>';
            if(ob.contains('href'))
              $(ob).insertAfter(theDiv);
          }
        } else {
          ob += '<div><span class="fileName">' + displayName + '</span>&nbsp;&nbsp;<a href="' + fileId + '" file="' + fileId + '" title="Download ' + val + '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;&nbsp;<span token="' + token + '" file="' + fileId + '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' + val + ' file">Remove</span><br></div>';
          $(ob).insertAfter(theDiv);
        }
      }
    });
}


function processSingleFile(response, val, ob, input, prevInput, token, theDiv) {
    val = response.path? '../' + response.path.substring(7) : response.file.originalname;
    input.attr('value', val);
    var file = response.path? response.path : response.file.id;
    if(prevInput && prevInput.length)
      prevInput.attr('value', val);//file

    ob = '<div><a href="' + val + '" file="' + file + '" title="Download ' + val + '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;<span token="' + token + '" file="' + file + '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the '+ val +' file">Remove</span></div>';
    $(ob).insertAfter(theDiv);
}


function checkPresence(obj) {
    var sel = obj.parent('div').find('select');
    var val = obj.val();
    obj.removeClass('present');
    var isPresent = false;
    
    sel.find('option').not(':first').each(function(index, element) {
      if($(this).text() == val) {
        isPresent = true;
        return true;
      }
    });
    
    if(isPresent) {
      obj.addClass('present');
    }
}



//jqGrid Formatters:

function productFormatter(cellvalue, options, rowObject ) {
// format the cellvalue to new format
  //alert(JSON.stringify(rowObject));
return `<span class='product'>${cellvalue}</span>`;
}


function priceFormatter(cellvalue, options, rowObject ) {
  return `<span class='basicPriceWrapper0'><span class='price'>${parseFloat(rowObject.hiddenPrice).toFixed(2)}</span> <span class='currency'>${rowObject.hiddenCurrency}</span></span>`;
}


function totalPriceFormatter(cellvalue, options, rowObject ) {
  return `<span class='priceWrapper0'><span class='totalPrice'>${parseFloat(rowObject.hiddenTotalPrice).toFixed(2)}</span> <span class='currency'>${rowObject.hiddenCurrency}</span></span>`;
}


function productPriceFormatter(cellvalue, options, rowObject ) {
  return `<span class='priceWrapper0'><span class='totalPrice'>${parseFloat(rowObject.hiddenTotalPrice).toFixed(2)}</span> <span class='currency'>${rowObject.currency}</span></span>`;
}


function amountFormatter(cellvalue, options, rowObject ) {
return `<span class='amountWrapper0'><span class='amount'>${parseInt(cellvalue)}</span> items </span>`;
}


function buttonsWrapperFormatter(cellvalue, options, rowObject) {
  return `<span class='buttonsWrapper'><span class='rem' title="Delete"></span><span class='dec' title='Remove item'></span><span class='inc' title='Add item'></span></span>`;
}


function imageWrapperFormatter(cellvalue, options, rowObject) {
  return `<span class='imageWrapper0'><span class='uploadImage'>Upload Image</span>  <span class='productImage' title="Product Image">${rowObject.productImageSource}</span></span>`;
}


function removalFormatter(cellvalue, options, rowObject) {
  return rowObject.hiddenHref.length? `<a href="${rowObject.hiddenHref}"><span class="adminDelete">Remove User</span></a>` : '';
}


function downloadFormatter(cellvalue, options, rowObject) {
  return `<a href="${rowObject.downloadHref}" title="Download ${rowObject.downloadName}" class="downloadFile" download>Download file</a>`;
}


function fileRemovalFormatter(cellvalue, options, rowObject) {
  return `<span name="${rowObject.deletionHref}" class="deleteFile">Remove</span>`;
}


function buyerPriceFormatter(cellvalue, options, rowObject) {
  return `<span>${rowObject.buyerPriceHref}</span>`;
}


function supplierPriceFormatter(cellvalue, options, rowObject) {
  return `<span>${rowObject.supplierPriceHref}</span>`;
}


function productImageFormatter(cellvalue, options, rowObject) {
  return `<img src="${rowObject.hiddenImageSrc}" style="height: 20px; width: 20px" onclick="window.open(this.src)">`;
}


$(document).ready(function() {
  var cnt = $('div.container').first();
  
  if(!(cnt.hasClass('nobackforward')))
    cnt
      .prepend('<div><button class="back btn btn-primary" style=" margin-right: 50px" ' 
                                      + ' title="Go back one page" onclick="history.go(-1)">Back</button>'
                  + '<button class="forward btn btn-primary" style=" margin-left: 50px"' 
                                      + ' title="Go forward one page" onclick="history.go(1)">Forward</button>'
                                     +'</div>');
  
  if(!cnt.hasClass('terms')) {
    $('input,textarea,span,label,li,button,a,b,p,h1,h2,h3,h4,h5,option')
      .each(function(index, el) {//Tooltips in the App.
      if(!$(el).attr('title')) {
        $(el).attr('title', $(el).val()? $(el).val() : $(el).text());
      }
    });
  }
  
  var nav = $('body').find('nav');
  if(nav.length && nav.next('div').hasClass('home')) {    
    
    var $str =
        ' <div class="collapse navbar-collapse" id="navbarSupportedContent">'
        + '<ul class="navbar-nav mr-auto">'
        + '<li class="nav-item">'
        + '<a class="nav-link" title="Home" href="/">Home</a>'
        + '</li>'        
        + '<li class="nav-item">'
        + '<a class="nav-link" title="About" href="/about">About</a>'
        + '</li>'
        + '<li class="nav-item">'
        + '<a class="nav-link" href="/termsConditions" title="Terms and Conditions">Terms</a>'
        + '</li>'
        + '<li class="nav-item last">'
        + '<a class="nav-link" href="/antibriberyAgreement" title="Anti-Bribery Agreement">Anti-Bribery</a>'
        + '</li>'
        + '</ul>'
        + '<br>'
        + '<button class="signup btn btn-primary" data-toggle="modal" data-target="#signUpModal">Sign up</button>'
        + '</div>';
    
    nav.append($str);
   
      var ul = $('#navbarSupportedContent')
        .find('ul');
      
      $('<li class="nav-item"><a class="nav-link" href="/feedback" title="Feedback/Suggestions">User Feedback</a></li>')
        .insertAfter('li.last');
      
      var isAdmin = nav.find('input[id="userData"]').attr('isAdmin');
      var bigScreen = window.matchMedia("(min-width: 900px)");
      var marg = bigScreen.matches? 0 : 180;
    
      $(window).off('resize').on('resize', function() {
          if($(window).width() >= 900) {
            $('a.admin').css({'margin-top': 0, float: ''});
          } else {
            $('a.admin').each(function() {
              $(this).css({'margin-top': -$(this).attr('marg'), 'float': 'right'});
            });
          }
      });
      
      if(isAdmin == 'true') {
        treatLastLi();
        $('<li class="nav-item"><a class="nav-link admin" marg="' + marg + '" style="margin-top: -' + marg + 'px" title="Admin specific fields"><b>Admin Section<b></a></li>')
          .insertAfter('li.last');
        marg -= treatLastLi();
        $('<li class="nav-item"><a class="nav-link admin" marg="' + marg + '" style="margin-top: -' + marg + 'px" href="/viewFeedbacks" title="Check Feedbacks">View Feedbacks</a></li>')
          .insertAfter('li.last');
        marg -= treatLastLi();
        $('<li class="nav-item"><a class="nav-link admin" marg="' + marg + '" style="margin-top: -' + marg + 'px" href="/memberList" title="List of UNITE Members">List of our members</a></li>')
          .insertAfter('li.last');
        marg -= treatLastLi();
        $('<li class="nav-item"><a class="nav-link admin" marg="' + marg + '" style="margin-top: -' + marg + 'px" href="/filesList" title="View Uploaded Files List">View Uploaded Files</a></li>')
          .insertAfter('li.last');
        marg -= treatLastLi();
        $('<li class="nav-item"><a class="nav-link admin" marg="' + marg + '" style="margin-top: -' + marg + 'px" href="/bidsList" title="View UNITE Bids List">View All Bids</a></li>')
          .insertAfter('li.last');
      }
      
      var ind = parseInt(nav.attr('pos'));
    //$('li.admin').css('float', 'right');
      
      if(ul.find('li').first().hasClass('user')) {
        ind++;
      }
      
      var li = ul.find('li').eq(ind);
      li.addClass('active');
      var text = li.find('a').text();
      //li.find('a').text(text + ' (current)');//Askin said that this is not necessary. So REMOVE it!
    //}
  } else {
    if(nav.length && !(nav.hasClass('noMenu')) ) {
      var user = nav.attr('user');
      var bigScreen = window.matchMedia("(min-width: 900px)");
      var offset = user == 'supplier'? 112 : user == 'buyer'? 80 : 40;
      var profilePx = parseInt(offset+32), logoutPx = parseInt(offset);
      
      if(bigScreen.matches) {
        profilePx = 0;
        logoutPx = 0;
      }
      
      $(window).off('resize').on('resize', function() {
        if($(window).width() >= 900) {
          $('a.userRight').css({'margin-top': 0, 'margin-right': '10px', 'float': ''});
        } else {
          $('a.userRight').each(function() {
            $(this).css({'margin-top': -$(this).attr('marg'), 'float': 'right'});
          });
        }
      });
      
      var str = '<div class="collapse navbar-collapse" id="navbarSupportedContent">' 
        + '<ul class="navbar-nav mr-auto">'
        + '<li class="nav-item"><a class="nav-link" href="/">Home<span class="sr-only"></span></a> </li>'
        + '<li class="nav-item"><a class="nav-link" href="/'+user+'">Dashboard <span class="sr-only"></span></a></li>'
        + (user == 'supervisor'? '' : '<li class="nav-item"><a class="nav-link" href="/'+user+'/balance">Balance <span class="sr-only"></span></a></li>')
        + (user == 'supplier'? '<li class="nav-item"><a class="nav-link" href="/'+user+'/bid-requests">Bid Requests</a></li>' : '')
        + '<li class="nav-item"><a class="btn btn-primary userRight" marg="' + profilePx + '" style="margin-top: -' + profilePx + 'px" href="/'+user+'/profile">Profile</a></li><br>'
        + '<li class="nav-item"><a class="btn btn-danger userRight" marg="' + logoutPx + '" style="margin-top: -' + logoutPx + 'px" title="Logout" href="?exit=true">Logout</a></li></ul></div>';
     
      nav.append(str);  
      
      if(bigScreen.matches) {        
        $('a.userRight').css({'margin-right': '10px'});
      }
      
      if(nav.attr('pos')) {
        var ind = parseInt(nav.attr('pos')), ul = $('#navbarSupportedContent').find('ul');
        var li = ul.find('li').eq(ind);
        li.addClass('active');
        var text = li.find('a').text();
        //li.find('a').text(text + ' (current)');
      }
    }
  }
  
    $("body").css({"background-image": "url(https://cdn.glitch.com/e38447e4-c245-416f-8ea1-35b246c6af5d%2FWH.png?v=1592308122673)", "background-repeat": "repeat"});//That white! 
  
  if(nav)
    nav.find('span').attr('title', 'Expand/collapse UNITE basic options');
  
  $('.cancelForm').submit(function() {
    return confirm('Are you sure you want to cancel this order?');
  });
  
  $('select.currency').on('change', function() {
    var val = $(this).val();
    $('input[name="currency"]').val(val);
    $('#currency').val(val);

    //Re-make the list of products accordingly, with the new currency.
    if(!($('#prodServices').length))
      return false;
    
    $('#prodServices').find('li').each(function(index, elem) {
      var price = parseFloat($(this).find('.price').text()).toFixed(2), currency = $(this).find('.currency').text();
      var newPrice = fx.convert(price, {from: currency, to: val});
      $(this).find('.price').text(parseFloat(newPrice).toFixed(2));
      $(this).find('span.currency').text(val);
    });
  });
   
  
  $('select.autocomp')
    .prepend('<option class="first" value=""></option>')
    .css({'width': '100%'})
    .find('option.first')
    .prop('selected', true);
  
  $('select.autocomp').on('change', function() {
    var input = $(this).parent('div').find('input.form-control');
    input.val($(this).val());
    $(this).find('option.autocomp').remove();
    
    if(input.hasClass('search')) {
      input.parent('div').parent('form').submit();
    } else {
      input.addClass('fromList');
    }
    
    $(this).blur();
  });
  
  $('input.autocomp').each(function(index, element) {
    checkPresence($(this));
  });
  
  $('input.autocomp').on('change', function() {
    checkPresence($(this));
    $(this).addClass('changed');
  });
  
  if($('#match').length) {
    $('#match').css({color: 'red'});
  }
  
 
  if(!($('input.upload').length))
    return false;
  
  var token = $("input[name='_csrf']:first").val();
  
  $('input.upload').on('change', function() {
    var nextInput = $(this).next('input');    
    $(this).attr('fromOutside') != null?
      nextInput.trigger('click') : nextInput.prop('disabled', ($(this).val()? false : true));
  });

  $('.single,.multiple').each(function(index, element) {
    var input = $(this).prev('input');
    var prevInput = input.prev('input');
    var val = input.attr('value'), fileId = prevInput && prevInput.length? prevInput.val() : null;
    var theDiv = $(this).parent('div');
    input.attr('value', fileId);
    val = fileId;
    
    if(fileId && fileId.length) {
      var isMulti = false;
    
      if(val.charAt(val.length-1) == ',') {
        var newVal = val.substring(0, val.length-1);
        if(newVal.indexOf(',') != -1) {
          isMulti = true;
          val = newVal.split(',');
          newVal = fileId.substring(0, fileId.length-1);
          fileId = newVal.split(',');
        }
      }

      if(isMulti) {
        var ob = '<div class="fileWrapper">';
        for(var i in val) {
          fileExists('public/' + fileId[i].substring(3), isMulti, ob, theDiv, fileId[i], i, val, token);
        }
      } else {
        var ob = '';
        fileExists('public/' + fileId.substring(3), false, ob, theDiv, fileId, 0, val, token);
      }
    }
  });
  
  delegateUpload($('.uploadImage'));

  $('.single,.multiple').click(function (e) {
    var input = $(this).prev('input');
    var isExcel = input.hasClass('fileexcelupload')? true : false;
    var isProduct = input.hasClass('productimageupload')? true : false;
    var isAvatar = input.hasClass('avatarupload')? true : false;
    
    var isMultiple = $(this).hasClass('multiple');
    var formData = new FormData();
    formData.append("_csrf", token);
    formData.append("upload_file", true);

    if(isMultiple == false) {
      formData.append('single', input[0].files[0]);
    }
    else {
      $.each(input[0].files, function(i, file) {
        formData.append('multiple', file);
      });
    }

    var theUrl = isAvatar? '/avatarUpload' 
    : isMultiple == true? "/uploadMultiple"
    : isProduct == true? "/uploadProductImage"
    : isExcel? "/uploadExcel" 
    : "/uploadFile";//uploadmultiple versus uploadfile.
    
    var xhr = new XMLHttpRequest();
    xhr.open('POST', theUrl, true);
    xhr.setRequestHeader('X-CSRF-TOKEN', token);
    xhr.onload = function(e) {
    };

    xhr.send(formData);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {//Success!         
          input.next('input').prop('disabled', true);
          var prevInput = input.prev('input');
          var ob, val, response = isAvatar? xhr.responseText : JSON.parse(xhr.responseText);
          var theDiv = input.parent('div');
          
          if(isAvatar) {
            var src = '../' + response.substring(7);
            $('input[name="avatar"]').val(src);//'../../../'+response
            $(`<div><img src="${src}" alt="avatar" style="width: 60px; height: 60px"  onclick="window.open(this.src)"><br><span token="${token}" file="${response}" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ${src} file">Remove</span></div>`).insertAfter(input);
            //var loc = window.location.pathname;
            //var dir = loc.substring(0, loc.lastIndexOf('/'));
            //alert(loc + ' ' + dir);
            //alert(imageExists('../avatars/Avatar-3:15:pm-a.jpg'));
          } else if(isProduct) {//Supplier Profile/Sign-up pages; Add Product page.            
            var res = '../' + response.path.substring(7);
            
            input.attr('filePath', res);
            if(input.hasClass('separated')) {//The separated Add Product Page.
              $('#productImage').val(response.path);
            }
            
            if(input.attr('fromOutside') != null) {
              var index = input.attr('fromOutside');
              var div = input.parent('div');
              var ul = div.parent('div').find('ul').last();   
              var li = ul.find('li').eq(index);
              var span = li.find('.productImage');
              var img = span.find('img');
              
              var table = ul.parent('div').next('div').find('table').eq(1);//Last
              var tr = table.find('tbody tr').eq(index);
              var span2 = tr.find('span.productImage');
              var img2 = span2.find('img');
              
              if(img != null && img.attr('src') != null) {
                img.attr('src', res);
              } else {
                var str = `<img src="${res}" style="height: 25px; width: 30px" onclick="window.open(this.src)">`;
                span.append(str);
              }
              
              if(img2 != null && img2.attr('src') != null) {
                img2.attr('src', res);
              } else {
                var str = `<img src="${res}" style="height: 25px; width: 30px" onclick="window.open(this.src)">`;
                span2.append(str);
              }
              
              input.removeAttr('fromOutside');
              input.prev('input').val('');
              input.removeAttr('filePath');
            } else {
              processSingleFile(response, val, ob, input, prevInput, token, theDiv);
            }
          } else if(isExcel) {
            var fromBuyer = input.hasClass('fromBuyer');
            var div = fromBuyer? input.parent('div').next('div') : null;
            var el = fromBuyer? div.find('ul') : $('#prodServices');
            var productInput = fromBuyer? div.find('input[id^="prodServiceInput"]') : $("#prodServiceInput");
            
            var MAX = el.attr('MAX');//parseInt("<%= MAX_PROD %>");
            
            if(Array.isArray(response) && response.length == 4) {
              for(var i in response) {//Each Supplier product should come here.                      
                if(i < 1) 
                  continue;
                var elem = response[i];//Assume that elem fields are called name, price, and currency.
                
                if(el.find('li').length >= MAX) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'You have reached the limit of ' + MAX + ' products to add.'
                    });
                   return false;
                 }

                fromBuyer? addition(productInput, elem[0], elem[1], elem[2], elem[3], null, el, true) : addition(productInput, elem[0], elem[1], elem[2],  elem[3], null, el, false);
              }
            } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: 'Invalid Excel data. Please make sure that: 1) Your first row contains the column names; 2) You have four columns: name, price, currency, and amount.'
                  });
                 return false;
            }
          } else if(isMultiple) {//response.file.filename, originalname, fieldname, 
            var hasDiv = theDiv.next('div').hasClass('fileWrapper');
            ob = hasDiv? '' : '<div class="fileWrapper">';
            for(var i in response) {
              var absolutePath = response[i].path? '../' + response[i].path.substring(7) : response[i].file.originalname;
              val = !(input.attr('value') && input.attr('value').length)? absolutePath + '' : input.attr('value') + absolutePath + '';
              input.attr('value', val);
              var file = response[i].path? response[i].path : response[i].file.id;
              prevInput.attr('value', !(prevInput.val() && prevInput.val().length)? val + '' : prevInput.val() + val + '');
              
              ob += '<div><a href="' + absolutePath + '" file="' + file + '" title="Download ' + absolutePath + '" style="color: blue; cursor: pointer" download>Download file "' + i + '"</a>&nbsp;<span token="' + token + '" file="' + file + '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the '+ absolutePath +' file">Remove</span></div>';
            }

            if(hasDiv) {
              theDiv.next('div').append(ob);
            } else {
              ob += '</div>';
              $(ob).insertAfter(theDiv);
            }
          } else {//Single file
            processSingleFile(response, val, ob, input, prevInput, token, theDiv);
          }

          if (xhr.status === 200) {
             console.log('successful');
          } else {
             console.log('failed');
          }
      }
    };

    e.preventDefault();
  });
});