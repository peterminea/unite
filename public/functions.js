var autocomp = function(obj, data, enter) {
  //Not suitable for modals.

  var sel = obj.parent("div").find("select");
  for (var i in data) {
    var opt =
      "<option " +
      'style="word-wrap: break-word; width: 120px" title="' +
      data[i].name +
      '" value="' +
      data[i].value +
      '">' +
      data[i].name +
      "</option>";
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

function getCurrenciesList(elem, url, token) {
  //For <select> drop-down currencies.
  var obj = $("" + elem + "");

  $.ajax({
    url: url,
    headers: { "X-CSRF-Token": token },
    datatype: "jsonp",
    type: "GET",
    //data: req,
    success: function(data) {
      if (!data || !data.length || treatError(data, "loading currencies")) {
        //obj.val('');
        obj.append("<option>No results found.</option>");
        return false;
      }

      obj.append("<option></option>");
      for (var i in data) {
        var opt =
          "<option " +
          'style="word-wrap: break-word; width: 50px" title="' +
          data[i].value +
          '" value="' +
          data[i].name +
          '">' +
          data[i].name +
          "</option>";
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

function getProductsList(elem, url, token) {
  //For <select> drop-down currencies.
  var obj = $("" + elem + "");

  $.ajax({
    url: url,
    headers: { "X-CSRF-Token": token },
    datatype: "jsonp",
    data: { supplierId: obj.attr("supplierId") },
    type: "POST",
    success: function(data) {
      if (!data || !data.length || treatError(data, "retrieving products")) {
        //obj.val('');
        obj.append("<option>No results found.</option>");
        return false;
      }

      obj.append("<option></option>");

      for (var i in data) {
        var opt =
          "<option " +
          'style="word-wrap: break-word; width: 50px" price="' +
          data[i].price +
          '" totalPrice="' +
          data[i].totalPrice +
          '" maxAmount="' +
          data[i].amount +
          '" productImage="' +
          data[i].productImage +
          '" currency="' +
          data[i].currency +
          '" title="' +
          data[i].name +
          '" value="' +
          data[i].name +
          '">' +
          data[i].name +
          "</option>";

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


function openDropdown(obj) {
  function down() {
    var obj = $(this);
    var pos = obj.offset(); // remember position
    var len = obj.find("option").length;

    if (len > 10) {
      len = 10;
    }

    obj.css({ position: "relative", zIndex: 9999 });
    obj.offset(pos); // reset position
    obj.attr("size", 20 + len); // open dropdown
    obj.unbind("focus", down);
    //obj.focus();
  }

  function up() {
    var obj = $(this);
    obj.css("position", "static");
    obj.attr("size", "1"); // close dropdown
    obj.unbind("change", up);
    //obj.focus();
  }

  obj
    .focus(down)
    .blur(up)
    .focus();
}

function getAutocomplete(elem, url, token, isEnter) {
  $("" + elem + "").autocomplete({
    source: function(req, res) {
      var obj = $(this.element);
      var sel = obj.parent("div").find("select");
      var data = [],
        found = false;

      sel.find("option.autocomp").remove();
      var arr = sel.find("option").not(".first");

      arr.each(function(index, element) {
        if (req.term.length) {
          if (
            $(element)
              .text()
              .toLowerCase()
              .includes(req.term.toLowerCase())
          ) {
            data.push($(element).text());
            found = true;
          } else {
            //$(element).css('visibility', 'hidden');
          }

          if (found == true && index == arr.length - 1) {
            for (var i = data.length - 1; i >= 0; i--) {
              sel.prepend(`<option class='autocomp'>${data[i]}</option>`);
            }
            //sel.simulate('click');
            sel.prepend('<option class="autocomp">...</option>');
            sel
              .find("option.autocomp")
              .eq(0)
              .prop("selected", true);
            openDropdown(sel);
          }
        }
      });
    },
    minLength: 3,
    delay: 50,
    focus: function(event, ui) {
      if (!ui.item) return false;
      this.value = ui.item.name;
      event.preventDefault();
    },
    select: function(event, ui) {
      if (ui.item) {
        $(this).val(ui.item.name);
        event.preventDefault();
      }
    }
  });
}

function validatePassword(password) {
  // Do not show anything when the length of password is zero.
  if (password.length === 0) {
    $("#msg").text("");
    return;
  }
  // Create an array and push all possible values that you want in password
  var matchedCase = new Array();
  matchedCase.push("[$@$!%*#?&]"); // Special Character
  matchedCase.push("[A-Z]"); // Uppercase letters
  matchedCase.push("[0-9]"); // Numbers
  matchedCase.push("[a-z]"); // Lowercase letters

  // Check the conditions
  var ctr = 0;
  for (var i = 0; i < matchedCase.length; i++) {
    if (new RegExp(matchedCase[i]).test(password)) {
      ctr++;
    }
  }
  // Display it:
  var color = "",
    strength = "";

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
    .css({ color: color })
    .text(strength);
}

function verifyMatch(password) {
  var mainPass = $("#password").val();
  $("#match").text(password !== mainPass ? "Passwords do not match!" : "");
}

(function($) {
  $.fn.inputFilter = function(inputFilter) {
    return this.on(
      "input keydown keyup mousedown mouseup select contextmenu drop paste",
      function() {
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
      }
    );
  };
})(jQuery);

function sortTable() {
  //Ascending or descending. Each <th> column tag is involved.
  var table, rows, switching, i, x, y, colIndex, shouldSwitch;
  table = $(this).closest("table");
  colIndex = table.find("th").index($(this));
  table = table[0];
  switching = true;
  /*Make a loop that will continue until no switching has been done:*/
  var asc = 0,
    isNumber,
    compX,
    compY;
  while (switching) {
    //start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    /*Loop through all table rows (except the first, which contains table headers):*/
    for (i = 1; i < rows.length - 1; i++) {
      //start by saying there should be no switching:
      shouldSwitch = false;
      /*Get the two elements you want to compare, one from current row and one from the next:*/
      x = rows[i].getElementsByTagName("TD")[colIndex];
      y = rows[i + 1].getElementsByTagName("TD")[colIndex];
      //check if the two rows should switch place:
      isNumber =
        x.innerHTML == parseInt(x.innerHTML) ||
        x.innerHTML == parseFloat(x.innerHTML);
      compX = isNumber ? Number(x.innerHTML) : x.innerHTML.toLowerCase();
      compY = isNumber ? Number(y.innerHTML) : y.innerHTML.toLowerCase();

      if (compX > compY) {
        //if so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      asc = 1;
      /*If a switch has been marked, make the switch and mark that a switch has been done:*/
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }

  if (asc == 0) {
    //Already ASC sorted, let's sort back.
    switching = true;

    while (switching) {
      switching = false;
      rows = table.rows;

      for (i = 1; i < rows.length - 1; i++) {
        shouldSwitch = false;
        x = rows[i].getElementsByTagName("TD")[colIndex];
        y = rows[i + 1].getElementsByTagName("TD")[colIndex];

        isNumber =
          x.innerHTML == parseInt(x.innerHTML) ||
          x.innerHTML == parseFloat(x.innerHTML);
        compX = isNumber ? Number(x.innerHTML) : x.innerHTML.toLowerCase();
        compY = isNumber ? Number(y.innerHTML) : y.innerHTML.toLowerCase();

        if (compX < compY) {
          shouldSwitch = true;
          break;
        }
      }
      if (shouldSwitch) {
        asc = 1;
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
      }
    }
  }
}

function treatError(data, message) {
  if (data && data.message) {
    //Error!
    Swal.fire({
      icon: "error",
      title: `Error on ${message}!`,
      text: data.message
    });

    return true;
  }

  return false;
}

function treatDiv(div, isMulti, val, input) {
  if (isMulti) {
    var newIndex = div
      .parent("div")
      .find("div")
      .index(div);
    //alert(div.parent('div').length + ' ' + newIndex + ' ' + div.parent('div').hasClass('fileWrapper'));
    var val2 = val.substring(0, val.length - 1);
    val2 = val2.split(",");
    val2.splice(newIndex, 1);
    input.attr("value", val2 && val2.length ? val2.toString() + "," : "");

    if (!val2 || !val2.length) input.val("");
  } else {
    input.attr("value", "");
    input.val("");
  }

  input.trigger("change"); //Enable Profile button!
  div.remove();
}

function removeFile(obj) {
  //remove from Glitch
  var token = $(obj).attr("token");
  var file = $(obj).attr("file") ? $(obj).attr("file") : "";
  var tr = $(obj).parent("div")
    ? null
    : $(obj)
        .parent("td")
        .parent("tr");
  var div = tr ? null : $(obj).parent("div");
  var isMulti, input, val;

  if (tr == null) {
    isMulti = div.parent("div").hasClass("fileWrapper");
    input = isMulti
      ? div
          .parent("div")
          .prev("div")
          .find(".upload")
      : div.prev("div").find(".upload");
    val = input.attr("value");
  }

  const SwalCustom = Swal.mixin({
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: true
  });

  var name = $(obj).attr("name")
    ? $(obj).attr("name")
    : "public/" + file.substring(3);

  SwalCustom.fire({
    title: "Are you sure?",
    text: "You will not be able to revert the file deletion!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#445544",
    cancelButtonColor: "#d33d33",
    confirmButtonText: "I understand!" //,
    //reverseButtons: true
  }).then(result => {
    if (result.value) {
      //OK pressed. Undefined if Cancel.
      //return false;
      $.ajax({
        url: "/deleteFile",
        type: "POST",
        headers: { "X-CSRF-Token": token },
        data: { file: name },
        datatype: "application/json",
        error: function() {
          tr ? tr.remove() : treatDiv(div, isMulti, val, input);
          SwalCustom.fire({
            title: "Deleted!",
            text: "The file has been deleted.",
            icon: "success"
          });
        },
        success: function(data) {
          if (treatError(data, "deleting file")) {
            return false;
          }

          tr ? tr.remove() : treatDiv(div, isMulti, val, input);
          SwalCustom.fire({
            title: "Deleted!",
            text: "The file has been deleted.",
            icon: "success"
          });
        }
      });
    }
  });
}

function isJson(obj) {
  if (!obj || !obj.length || !Array.isArray(obj)) return false;
  if (obj.toString().charAt(0) == "[")
    //To be or not to be a JSON array.
    return false;
  return true;
}

function isUnique(value, index, self) {
  //Unique values in JS arrays.
  return self.indexOf(value) === index;
}

//var unique = myArray.filter(isUnique);
//var unique = myArray.filter((v, i, a) => a.indexOf(v) === i);
function checkName(arr, name) {
  for (var i in arr) {
    if (arr[i].toLowerCase() == name.toLowerCase()) return true;
  }

  return false;
}


function getId(val) {
  return !val ? '' :
    val.indexOf("_") != -1? val.substr(val.indexOf("_") + 1) : '';
}


function bindAddBid(obj, suppCurr) {
  obj.on('click', function() {
    var id = '_' + getId($(this).attr('id'));
    if(id.length == 1)
      id = '';

    var elem = $("#prodServices"+id);
    var amount = $('#amount'+id);
    var input = $("#prodServiceInput"+id);

    var MAX = parseInt($(this).attr('MAX'));

    if(elem.find('li').length >= MAX) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'You have reached the limit of ' + MAX + ' products to request from the supplier.'
        });

        return false;
    }

    $('#status'+id).trigger('change');                      

    if(!amount.val() || amount.val() < 1 || !(Number.isInteger(parseFloat(amount.val())))) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',                          
        text: 'Please select a valid amount of products first.'
      });

      return false;
    }
    if(!input.attr('price'))
      input.attr('price', 1);
    //var req = input.val().length;// && $('#price').val().length && $('#currency').val().length;

    if(input.val() && input.val().length) {
      input.removeClass('errorField');
      var prodVal = input.val();
      var isPresent = false;

      elem.find('.product').each(function() {
        if(prodVal == $(this).text()) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'You have already added ' + prodVal + ' to the list. Please refine your selection.'
          });

          isPresent = true;
          return false;
        }
      });

      if(isPresent) {
        return false;
      }

      var amountVal = amount.val();
      var currencyVal = $('#currency'+id).text();
      var priceVal = input.attr('price');
      var priceUnit = parseFloat(priceVal? priceVal : 1).toFixed(2);
      var addedPrice = parseInt(amountVal? amountVal : 1) * priceUnit;
      var buyerPriceUnit = $('#buyerPriceUnit'+id), buyerPriceCurr = $('#buyerPriceCurrency'+id);
      var buyerCurrSpan = $('span.bidCurrency[index="'+ (id.length? id : '-1') +'"]').first();
      buyerPriceUnit.text(parseFloat(addedPrice).toFixed(2));
      buyerPriceCurr.text(buyerCurrSpan.text());
      var supplierCurrency = $('#supplierCurrency'+id).text();
      var price = parseFloat($('#price'+id).text()? $('#price'+id).text() : 0) + parseFloat(addedPrice);
      var bigPrice = parseFloat(price).toFixed(2);
      $('#price'+id).text(bigPrice);

      var imageInput = $('input.productimageupload[id="productImage'+id+'"]');
      var imagePath = input.attr('productImage')?
        '../' + input.attr('productImage').substring(7) 
        : imageInput.attr('filePath');
      
      var suppId = $('#productsList').length && $('#productsList option:selected').attr('supplierId')?
        $('#productsList option:selected').attr('supplierId') : null;

      if(elem.find('li').length) {
        elem.find('li').attr('totalPrice', bigPrice);
      } else {
        elem.append(`<li class='list-group-item' style='color: brown'><span class='cnt'>#</span><span class='product0'>Name</span><span class='buttonsWrapper'>Buttons</span><span class='imageWrapper'>Images</span><span class='priceWrapper'>Total</span><span class='amountWrapper'>Count</span>
<span class='basicPriceWrapper'>Price</span></span></li>`);
      }

      var lis = elem.find('li').length;
      var divId = $('#jqDiv'+id);

      elem.append("<li class='list-group-item' price='" 
                    + "' supplierId='" + suppId + addedPrice + "' maxAmount='" + (input.attr('maxAmount')? input.attr('maxAmount') : input.attr('defaultMaxAmount'))
                    + "' totalPrice='" + bigPrice + "' amount='" + amountVal + "'>" 
                    + `<span class='cnt'>${lis}</span><span class='product'>${prodVal}</span>
<span class='buttonsWrapper'><span class='rem' title="Delete"></span><span class='dec' title='Remove item'></span><span class='inc' title='Add item'></span></span>
<span class='imageWrapper'><span class='productImage' title='Image of Product'>` + (imagePath && imagePath.length? `<img src="${imagePath}" style="height: 25px; width: 30px" onclick="window.open(this.src)">` : '') +  `</span><span class='uploadImage'>Upload Image</span></span>
<span class='priceWrapper'><span class='totalPrice'>${parseFloat(addedPrice).toFixed(2)}</span> ${currencyVal}</span>
<span class='amountWrapper'><span class='amount'>${amountVal}</span> items</span>
<span class='basicPriceWrapper'><span class='price'>${parseFloat(priceVal).toFixed(2)}</span> <span class='currency'>${currencyVal}</span></span>
</li>`);

        imageInput
          .attr('filePath', null)
          .attr('value', '');

        var gridId = $('#grid'+id);
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

        gridId.jqGrid('addRowData', lis, data, 'last')
          .then(() => {
            //var table = gridId;//divId.find('table').eq(1);//Last
            var tr = gridId.find('tbody tr').eq(lis);
            tr.attr('price', addedPrice);
            tr.attr('totalPrice', bigPrice);
            tr.attr('amount', amountVal);
            tr.attr('supplierId', suppId);
            tr.attr('maxAmount', (input.attr('maxAmount')? input.attr('maxAmount') : input.attr('defaultMaxAmount')));
        });

        var counter = elem.parent('div').find('span.productsCount');
        var newValue = 1 + parseInt(counter.text()? counter.text() : 0);
        var totalAmount = $('#totalAmount'+id).val()? parseInt($('#totalAmount'+id).val()) : 0;
        counter.text(newValue);
        $('#totalAmount'+id).val(totalAmount + parseInt(amountVal));
        var isNewBid = (id.length > 0);

        bindHandleProduct(elem.find('.rem').last(), input, isNewBid, id, true, false);
        bindHandleProduct(elem.find('.inc').last(), input, isNewBid, id, false, true);
        bindHandleProduct(elem.find('.dec').last(), input, isNewBid, id, false, false);                        
        delegateUpload(elem.find('.uploadImage').last());

        bindHandleProduct(gridId.find('.rem').last(), input, isNewBid, id, true, false);
        bindHandleProduct(gridId.find('.inc').last(), input, isNewBid, id, false, true);
        bindHandleProduct(gridId.find('.dec').last(), input, isNewBid, id, false, false);                        
        delegateUpload(gridId.find('.uploadImage').last());

        if(isNewBid) {                        
          var suppPriceUnit = fx.convert(parseFloat(addedPrice), {from: buyerCurrSpan.text(), to: suppCurr});                          
          $('#supplierPriceUnit'+id).text(parseFloat(suppPriceUnit).toFixed(2));
          var supp = fx.convert(parseFloat(bigPrice), {from: buyerCurrSpan.text(), to: suppCurr});
          $('#supplierPrice'+id).text(parseFloat(supp).toFixed(2));
        }

        input.val('').attr('productImage', null);
        amount.val(0);
        amount.val('');
      } else {
          Swal.fire({
            icon: 'warning',
            title: 'Attention!',
            text: 'Please enter valid product data (name, amount).'
          });

          input.addClass('errorField');
          //$('#prodServiceInput,#price,#currency').addClass('errorField');
      }

    $(this).prop('disabled', true);
  });
}


function initBaseRates(fx, elem) {
  if (typeof fx == undefined) 
    return false;

  //EUR default.
  return $.getJSON("https://www.floatrates.com/daily/eur.json")
    /*.then((currency) => {
      return currency;
    })*/
    .then((currency) => {
      currency = '[' + JSON.stringify(currency).split('},').join('}},{') + ']';
      currency = JSON.parse(currency);
      var t, obj, str = 'fx.rates = {\n';
      for(var i in currency) {
        t = JSON.stringify(currency[i]);
        obj = JSON.parse(t.substring(7, t.length-1));
        str += obj.code + ': ' + obj.rate + ',\n';
      }

      str += '\n}';
      fx.base = "EUR";
    
      var t, obj = [], str = 'fx.rates = {\n';

      for(var i in currency) {
        t = JSON.stringify(currency[i]);
        obj.push(JSON.parse(t.substring(7, t.length-1)));
      }

      obj.sort(function(a, b) {
          return a.code.localeCompare(b.code);
        });

      for(var i in obj) {
        str += obj[i].code + ': ' + obj[i].rate + (i == obj.length-1? '' : ',\n');
      } 

      str += '\n}';
    
      eval(str);
      return fx;
  }).then((fx) => {
      var el = $("" + elem + "");
     
        if(el && el.length) {
          el
            .find('option[value="' + fx.base + '"]')
            .prop("selected", true);
          el.find('option:first').remove();
          el.trigger("change");
        }
    return fx;
  });
}

function bindHandleProduct(obj, prodServiceInput, fromBuyer, id, isRow, isAdd) {
  //Add/remove items, delete entire lines of products.
  const SwalCustom = Swal.mixin({
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: true
  });

  obj.off("click").on("click", function() {
    var li = $(this)
        .parent("span")
        .parent("li"),
      ul;
    var divId = fromBuyer ? $("#jqDiv" + id) : $("#jqDiv");
    var gridId = fromBuyer ? $("#grid" + id) : $("#grid");
    var isUl = false,
      rowId;

    if (!li.length) {
      //Not from list, but from grid.
      li = $(this)
        .parent("span")
        .closest("tr");
      ul = li.closest("table");
    } else {
      ul = li.parent("ul");
      isUl = true;
    }

    var counter = divId.prev("div").find("p.term span");
    var entireAmount = parseInt(li.find(".amount").text());
    var index = isUl ? ul.find("li").index(li) : ul.find("tr").index(li);
    var rowid = "gb1_" + index;

    if (isAdd && entireAmount == parseInt(li.attr("maxAmount"))) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          "The maximum stock of the Supplier for the Product " +
          li.find(".product").text() +
          " is " +
          entireAmount +
          "."
      });

      return false;
    }

    var handledAmount = isRow ? entireAmount : 1;
    var rowPrice = parseFloat(li.find("span.totalPrice").text()).toFixed(2);
    var handledPrice =
      handledAmount * parseFloat(li.find("span.price").text()).toFixed(2);
    var theCurrency = fromBuyer
      ? ul.attr("buyerCurrency")
      : li
          .find("span.currency")
          .first()
          .text();
    var supplierCurrency = fromBuyer ? ul.attr("supprCurrency") : theCurrency;

    var totalPagePrice = fromBuyer
      ? parseFloat(li.attr("totalPrice")).toFixed(2)
      : parseFloat($("#hiddenTotalPrice").val()).toFixed(2);

    var canContinue = true;
    var localAmount = isAdd
      ? entireAmount + handledAmount
      : entireAmount - handledAmount;
    var localPrice = isAdd
      ? parseFloat(parseFloat(rowPrice) + parseFloat(handledPrice)).toFixed(2)
      : parseFloat(rowPrice - handledPrice).toFixed(2);
    var totalAmountInput = fromBuyer
      ? $("#totalAmount" + id)
      : $("#totalSupplyAmount");
    var newAmount = isAdd
      ? parseInt(totalAmountInput.val()) + handledAmount
      : parseInt(totalAmountInput.val()) - handledAmount;
    var newPrice = isAdd
      ? parseFloat(
          parseFloat(totalPagePrice) + parseFloat(handledPrice)
        ).toFixed(2)
      : parseFloat(totalPagePrice - handledPrice).toFixed(2);
    var totalPrice = newPrice + " " + theCurrency,
      addedPrice = localPrice + " " + theCurrency;

    if (isRow || (entireAmount == 1 && !isAdd)) {
      SwalCustom.fire({
        title: "Are you sure?",
        text: "You are about to remove the entire product row.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#444444",
        cancelButtonColor: "#d22d22",
        confirmButtonText: "Confirm",
        cancelButtonText: "Dismiss"
        //, reverseButtons: true
      }).then(result => {
        if (result.value) {
          li.remove();
          var newValue = -1 + parseInt(counter.text());
          counter.text(newValue);
          if (!isUl) gridId.jqGrid("delRowData", rowId);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          canContinue = false;
        }
      });
    } else {
      isUl
        ? ul.find("li").attr("totalPrice", parseFloat(newPrice))
        : ul.find("tr").attr("totalPrice", parseFloat(newPrice));
      totalAmountInput.val(parseInt(newAmount));

      li.find("span.amount").text(localAmount);
      li.find("span.totalPrice").text(localPrice);
      if (!fromBuyer) {
        li.attr("amount", localAmount);
        li.attr("price", localPrice);
      }

      if (!isUl && !isRow && (entireAmount > 1 || isAdd)) {
        //No deletion.
        //gridId.jqGrid('editRow', index, true);
        rowId = gridId.jqGrid("getRowData", rowid);
        rowId.hiddenAmount = localAmount;
        rowId.hiddenTotalPrice = addedPrice;
        gridId.jqGrid("setRowData", rowid, rowId);
        //gridId.jqGrid('saveRow', rowid);
        //alert(rowId.totalPrice + '\n' + td.html());
      }
    }

    if (canContinue == false) {
      //Row deletion cancelled, nothing happens.
      return false;
    }

    if (!fromBuyer) {
      $("#hiddenTotalPrice").val(parseFloat(newPrice));
      $("#totalSupplyPrice").text(totalPrice);
      prodServiceInput.trigger("change");
    } else {
      var id2 = getId(id);
      
      var span = $('span.bidCurrency[index="' + (id.length? id : '-1') + '"]').first();
      $("#buyerPriceUnit" + id).text(parseFloat(localPrice).toFixed(2));
      var suppUnitVal = fx.convert(localPrice, {
        from: span.text(),
        to: supplierCurrency
      });
      $("#supplierPriceUnit" + id).text(parseFloat(suppUnitVal).toFixed(2));
      var supp = parseFloat(
        fx.convert(newPrice, { from: span.text(), to: supplierCurrency })
      ).toFixed(2);
      $("#price" + id).text(parseFloat(newPrice).toFixed(2));
      $("#supplierPrice" + id).text(supp);
      gridId.trigger("reloadGrid");
    }
  });
}

function removeAllProducts() {
  //Supplier products.
  $("#prodServices")
    .find("li")
    .remove();
  $("input.supply").each(function() {
    $(this).val("");
  });
  $("span.supply").each(function() {
    $(this).text("0");
  });

  $("#totalSupplyAmount").val(0);
  $("#totalSupplyPrice").text("0 " + $('input[name="currency"]').val());
  $("#hiddenTotalPrice").val("0 " + $('input[name="currency"]').val());
  $("#hiddenTotalAmount").val(0);
}

function removeAllItems(index) {
  //Bid items.
  $("#prodServices" + index)
    .find("li")
    .remove();
  $("#hiddenProdServicesList" + index).val("");
  $("#amountList" + index).val("");
  $("#priceList" + index).val("");
  $("#productImagesList" + index).val("");
  $("#totalAmount" + index).val("0");
  $("span.hid").each(function() {
    var procSpan = $(this)
      .find("span")
      .first();
    procSpan.text(0);
  });
}

function addition(
  prod,
  prodVal,
  priceVal,
  currencyVal,
  amountVal,
  imagePath,
  elem,
  fromBuyer,
  supplierId
) {
  var isPresent = false;
  elem.find(".product").each(function() {
    if ($(this).text() == prodVal) {
      isPresent = true;
      return false;
    }
  });

  if (isPresent) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text:
        "You have already added " +
        prodVal +
        " to the list. Please refine your selection."
    });
  } else {
    var id = fromBuyer ? '_' + getId(elem.attr("id")) : '';
    var addedPrice = parseFloat(priceVal * amountVal).toFixed(2);
    var priceInput = fromBuyer ? $("#price" + id) : $("#totalSupplyPrice");
    var pageCurrency = fromBuyer
      ? $("#currency" + id).text()
      : $('input[name="currency"]').val();
    var buyerInput = fromBuyer || $('#supplierIdsList').length? $("input[id^='prodServiceInput']") : null;

    if (!fromBuyer) {
      $("#hiddenTotalPrice").val(
        parseFloat(
          parseFloat($("#hiddenTotalPrice").val()) + parseFloat(addedPrice)
        ).toFixed(2)
      );
    }

    var buyerPriceVal = fromBuyer
      ? priceInput.text()
        ? parseFloat(priceInput.text())
        : 0
      : null;
    var bigPrice = fromBuyer
      ? parseFloat(buyerPriceVal + parseFloat(addedPrice)).toFixed(2)
      : parseFloat($("#hiddenTotalPrice").val()).toFixed(2);

    if (currencyVal != pageCurrency) {
      //Convert the values to the currency of buyer (or Supplier).
      addedPrice = parseFloat(
        fx.convert(addedPrice, { from: currencyVal, to: pageCurrency })
      ).toFixed(2);
      
      currencyVal = pageCurrency;
      bigPrice = fx.convert(bigPrice, { from: currencyVal, to: pageCurrency });
    }

    if (!elem.find("li").length) {
      elem.append(`<li class='list-group-item' style='color: brown'><span class='cnt'>#</span><span class='product0'>Name</span><span class='buttonsWrapper'>Buttons</span><span class='imageWrapper'>Images</span><span class='priceWrapper'>Total</span><span class='amountWrapper'>Count</span>
<span class='basicPriceWrapper'>Price</span></span></li>`);
    }

    var lis = elem.find("li").length; //table.find('tbody tr').length;

    elem.append(
      "<li class='list-group-item' price='" +
        addedPrice +
      "' supplierId='" +
        supplierId +
        "' totalPrice='" +
        bigPrice +
        (buyerInput?
           "' maxAmount='" +
            (buyerInput.attr("maxAmount")
              ? buyerInput.attr("maxAmount")
              : buyerInput.attr('defaultMaxAmount'))
          : "") +
        "' amount='" +
        amountVal +
        "'>" +
        `<span class='cnt'>${lis}</span><span class='product'>${prodVal}</span>
<span class='buttonsWrapper'><span class='rem' title="Delete"></span><span class='dec' title='Remove item'></span><span class='inc' title='Add item'></span></span>
<span class='imageWrapper'><span class='productImage' title='Image of Product'>` +
        (imagePath && imagePath.length
          ? `<img src="${imagePath}" style="height: 25px; width: 30px" onclick="window.open(this.src)">`
          : "") +
        `</span><span class='uploadImage'>Upload Image</span></span>
<span class='priceWrapper'><span class='totalPrice'>${addedPrice}</span> ${currencyVal}</span>
<span class='amountWrapper'><span class='amount'>${amountVal}</span> items</span>
<span class='basicPriceWrapper'><span class='price'>${priceVal}</span> <span class='currency'>${currencyVal}</span></span>
</li>`
    );

    var totalAmountInput = fromBuyer
      ? $("#totalAmount" + id)
      : $("#totalSupplyAmount");
    totalAmountInput.val(
      parseInt(totalAmountInput.val()) + parseInt(amountVal)
    );
    var gridId = fromBuyer ? $("#grid" + id) : $("#grid");
    var divId = fromBuyer ? $("#jqDiv" + id) : $("#jqDiv");
    var src = imagePath && imagePath.length ? imagePath : null;

    var data = {
      id: lis,
      name: prodVal,
      price: priceVal + " " + currencyVal,
      hiddenPrice: priceVal,
      hiddenTotalPrice: addedPrice,
      hiddenCurrency: currencyVal,
      productImageSource: src
        ? `<img src="${src}" style="height: 25px; width: 30px" onclick="window.open(this.src)">`
        : "",
      amount: parseInt(amountVal),
      totalPrice: addedPrice + " " + currencyVal
    };

    gridId.jqGrid("addRowData", lis, data, "last")
    .then(() => {
      var tr = gridId.find("tbody tr").eq(lis);
      tr.attr("price", addedPrice);
      tr.attr("totalPrice", bigPrice);
      tr.attr("amount", amountVal);
      if (fromBuyer) {
        tr.attr(
          "maxAmount",
          buyerInput.attr("maxAmount")
            ? buyerInput.attr("maxAmount")
            : buyerInput.attr('defaultMaxAmount'));
      }
    });


    if (!fromBuyer) {
      $("#totalSupplyPrice").text(bigPrice + " " + currencyVal);
    } else {
      $("#price" + id).text(parseFloat(bigPrice).toFixed(2));
      var supp = fx.convert(parseFloat($("#price" + id).text()), {
        from: $('span.bidCurrency[index="' + getId(id) + '"]')
          .first()
          .text(),
        to: elem.attr("suppCurrency")
      });
      $("#supplierPrice" + id).text(supp);
      elem.find("li").attr("totalPrice", bigPrice);
    }

    //var counter = elem.parent('div').find('p.term span');
    var counter = divId.prev("div").find("p.term span");
    var newValue = 1 + parseInt(counter.text());
    counter.text(newValue);

    bindHandleProduct(
      elem.find(".rem").last(),
      prod,
      fromBuyer,
      fromBuyer ? getId(elem.attr("id")) : null,
      true,
      false
    );
    bindHandleProduct(
      elem.find(".inc").last(),
      prod,
      fromBuyer,
      fromBuyer ? getId(elem.attr("id")) : null,
      false,
      true
    );
    bindHandleProduct(
      elem.find(".dec").last(),
      prod,
      fromBuyer,
      fromBuyer ? getId(elem.attr("id")) : null,
      false,
      false
    );
    delegateUpload(elem.find(".uploadImage").last());

    bindHandleProduct(
      gridId.find(".rem").last(),
      prod,
      fromBuyer,
      fromBuyer ? getId(elem.attr("id")) : null,
      true,
      false
    );
    bindHandleProduct(
      gridId.find(".inc").last(),
      prod,
      fromBuyer,
      fromBuyer ? getId(elem.attr("id")) : null,
      false,
      true
    );
    bindHandleProduct(
      gridId.find(".dec").last(),
      prod,
      fromBuyer,
      fromBuyer ? getId(elem.attr("id")) : null,
      false,
      false
    );
    delegateUpload(gridId.find(".uploadImage").last());
  }
}

function addProduct(obj) {
  obj.on("click", function() {
    var elem = $("#prodServices");
    var MAX = $("#prodServices").attr("MAX");

    if (elem.find("li").length >= MAX) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "You have reached the limit of " + MAX + " products to add."
      });
      return false;
    }

    var input = $("#prodServiceInput");
    var req =
      input.val().length &&
      $("#price").val().length &&
      $("#amount").val().length &&
      $("#price").val() > 0 &&
      $("#amount").val() > 0 &&
      Number.isInteger(parseFloat($("#amount").val()));
    var imagePath = $("input.productimageupload").attr("filePath");

    if (req) {
      $("#prodServiceInput,#price,#currency").removeClass("errorField");
      addition(
        input,
        input.val(),
        $("#price").val(),
        $("#currency").val(),
        $("#amount").val(),
        imagePath,
        elem,
        false,
        null
      );
      
      input.val("");
      $("#price").val("0");
      $("#amount").val("0");
      $("#price").val("");
      $("#amount").val("");
      //$('#currency').val('');
      $("#addProdService").prop("disabled", true);
      
      $(".productRequired").remove();
      $("input.productimageupload")
        .attr("filePath", null)
        .attr("value", "");
    } else {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter valid values for product name, price and amount."
      });
      //alert('Please enter valid values for products, prices and currency.');
      $("#prodServiceInput,#price,#amount").addClass("errorField");
    }
  });
}

function userInputs(id, role, avatar, name, type, ul) {
  //Home, About, Terms, Antibribery - ensure link to user's profile if they are logged into session.
  var link = "";

  switch (type) {
    case "Buyer":
      link = "/buyer";
      break;

    case "Supervisor":
      link = "/supervisor";
      break;

    case "Supplier":
      link = "/supplier";
      break;

    default:
      break;
  }

  if (id) {
    //We are logged in!
    ul.prepend(
      '<li class="nav-item user">' +
        '<a class="nav-link" title="Hello" href="' +
        link +
        '">Hello, ' +
        name +
        " (" +
        role +
        ")! " +
        (avatar
          ? '<img src="' +
            avatar +
            '" title="Profile image" style="height: 20px; width: 50px"'
          : "") +
        "</a>" +
        "</li>"
    );

    var str = "";
    str +=
      '<li class="nav-item logout">' +
      '<a class="btn btn-danger admin" marg="240" style="margin-top: -240px;" href="?exit=true&home=true" title="Clear user session/Logout">Logout</a>' +
      "</li>";

    ul.append(str);
    $(".signup").hide();
  }
}

function getCancelReasonTitles(obj, token, url) {
  //For deleting user accounts and cancelling bids. Types (titles) of reasons, expressed as radio buttons, should be chosen.
  $.ajax({
    url: url, //bidCancelReasonTitles or userCancelReasonTitles.
    type: "GET",
    headers: { "X-CSRF-Token": token },
    datatype: "application/json",
    error: function() {},
    success: function(data) {
      //data = titles.
      if (
        !data ||
        !data.length ||
        treatError(data, "getting Cancellation Reasons")
      ) {
        return false;
      }

      var str = '<div class="form-group">';
      str += "<label>Please select an option below and explain it.</label><br>";
      for (var i in data) {
        str +=
          '<input type="radio" id="' +
          i +
          '" value="' +
          data[i].name +
          '">&nbsp;<label for="' +
          i +
          '">' +
          data[i].name +
          "</label><br>";
      }

      str += "</div>";
      obj.prepend(str);
      $('input[type="radio"]').on("change", function() {
        $('input[type="radio"]')
          .not(this)
          .prop("checked", false);
      });
    }
  });
}

function getFeedbackSubjects(obj, token, url) {
  $.ajax({
    url: url,
    type: "GET",
    headers: { "X-CSRF-Token": token },
    datatype: "application/json",
    error: function() {},
    success: function(data) {
      //data = subjects.
      if (
        !data ||
        !data.length ||
        treatError(data, "getting Feedback Subjects")
      ) {
        return false;
      }

      var str = '<div class="form-group">';
      str +=
        "<label>Please select an option below and explain it*.</label><br>";
      str += '<select id="subjects"><option></option>';
      for (var i in data) {
        str +=
          '<option id="' +
          i +
          '" value="' +
          data[i].name +
          '">' +
          data[i].name +
          "</option>";
      }

      str += "</select></div>";
      obj.prepend(str);

      $("#subjects").on("change", function() {
        $(this).attr(
          "title",
          $(this)
            .find("option:selected")
            .text()
        );
      });
    }
  });
}

function getFeedbacks(obj, token, url) {
  $.ajax({
    url: url,
    type: "GET",
    headers: { "X-CSRF-Token": token },
    datatype: "application/json",
    error: function() {},
    success: function(data) {
      //data = feedbacks.
      if (!data || !data.length || treatError(data, "getting Feedbacks")) {
        obj.prepend(
          '<p class="term">There are currently no Feedbacks available. Please engage with your users first.</p>'
        );
        return false;
      }

      var str = "";
      for (var i in data) {
        str +=
          "<h5>#" +
          parseInt(1 + parseInt(i)) +
          '</h5><div class="form-group" style="border-style: dotted; border-color: green; text-align: center; color: brown; word-wrap: break-word; margin-bottom: 8px">';
        str += "<label>From:</label><br>";
        str +=
          '<span id="name_' +
          i +
          '"><b>' +
          data[i].userName +
          "</b></span><br><br>";
        str += "<label>E-mail:</label><br>";
        str +=
          '<span id="email_' +
          i +
          '"><b>' +
          data[i].userEmail +
          "</b></span><br><br>";
        str += "<label>Subject:</label><br>";
        str +=
          '<span id="subject_' +
          i +
          '"><b>' +
          data[i].subject +
          "</b></span><br><br>";
        str += "<label>Message: </label><br>";
        str +=
          '<span style="white-space: pre-line" id="text_' +
          i +
          '">' +
          data[i].message +
          "</span><br><br>";
        str += "<label>Date: </label><br>";
        str += '<span id="date_' + i + '">' + data[i].createdAt + "</span>";
        str += "</div>";
      }

      obj.prepend(str);
    }
  });
}

function imageExists(image_url) {
  var http = new XMLHttpRequest();
  http.open("HEAD", image_url, false);
  http.send();
  return http.status != 404;
}

function validCountry(obj) {
  var inputs = [];
  obj.each(function() {
    if (!$(this).hasClass("present")) {
      inputs.push($(this).attr("title"));
    }
  });

  if (inputs.length) {
    Swal.fire({
      icon: "error",
      title: "error",
      text:
        "Please enter a valid country name from the list for the input(s): " +
        inputs.toString()
    });
    return false;
  }

  return true;
}

function treatLastLi() {
  var nextLi = $("li.last").next("li");
  $("li.last").removeClass("last");
  nextLi.addClass("last");
  return 30;
}

function supplierValidateFields(fx) {
  if ($("#prodServices li").length == 0) {
    var obj =
      '<p class="productRequired littleNote">You are required to include at least one product or service.</p>';
    $(obj).insertBefore($(this));
    return false;
  }

  if (!validCountry($(".country"))) {
    return false;
  }

  $("input.autocomp")
    .not(".country")
    .each(function() {
      var cls = !$(this).hasClass("present") && !$(this).hasClass("changed");
      $(this)
        .next("input")
        .val(cls ? "canSave" : "");
    });

  $("#hiddenTotalAmount").val(parseInt($("#totalSupplyAmount").val()));
  $("#hiddenTotalPrice").val($("#totalSupplyPrice").text());

  var arr = [],
    arr1 = [],
    arr2 = [],
    arr3 = [],
    arr4 = [];

  $("#grid tr")
    .not(":first")
    .each(function(index, el) {
      var product = $(this).find("span.product"),
        price = $(this).find("span.price"),
        currency = $(this).find("span.currency"),
        quantity = $(this).find("span.amount"),
        productImageSpan = $(this).find("span.productImage");
      var src = productImageSpan.find("img").length
        ? productImageSpan.find("img").attr("src")
        : null;

      arr.push(product.text());
      arr1.push(parseFloat(price.text()).toFixed(2));
      arr2.push(currency.text());
      arr3.push(quantity.text());
      arr4.push(src ? "public/" + src.substring(3) : "");
    });

  var preferred = $("select.currency")
    .find("option:selected")
    .text();
  var isChanged = false;
  $("span.currency").each(function(ind, elem) {
    var curr = $(this).text();
    //var last = text.lastIndexOf(' ');
    //var curr = text.substring(last+1);

    if (preferred != curr) {
      isChanged = true;
      return false;
    }
  });

  if (
    isChanged &&
    !confirm(
      "One or more of your products have a different currency from the default you entered (" +
        preferred +
        "). Conversion rates may apply if you continue. Please confirm or cancel."
    )
  ) {
    return false;
  }

  $("#prodServicesList").val(arr);
  $("#pricesList").val(arr1);
  $("#currenciesList").val(arr2);
  $("#amountsList").val(arr3);
  $("#productImagesList").val(arr4);
  return true;
}

function registrationDialog(accountType) {
  $("#dialog").dialog({
    modal: true,
    width: 300,
    height: 450,
    open: function(event, ui) {
      var password = $('input[name="password"]').val(),
        passwordRepeat = $('input[name="passwordRepeat"]').val();
      if (password !== passwordRepeat) {
        $("#registration").addClass("error");
        $("#dialog").append("<p><b>Passwords do not match.</b></p>");
      } else {
        $("#registration").removeClass("error");
        $("#dialog").append(
          "<p>Congratulations for choosing to register your " +
            accountType +
            " account on UNITE!<br>Your next step is to verify your e-mail address for the Account Confirmation link.<br>Please confirm your new Account in order to start using our Services.</p>"
        );
      }
    },
    close: function(event, ui) {
      $("#dialog").text("");
    },
    buttons: {
      OK: function() {
        if (!$("#registration").hasClass("error")) {
          setTimeout(function() {
            $("#registration").submit();
          }, 150);
        }

        $(this).dialog("close");
      },
      Cancel: function() {
        $("#dialog").text("");
        $(this).dialog("close");
      }
    }
  });
}

function delegateUpload(obj) {
  obj.off("click").on("click", function() {
    var uploadInput,
      li = $(this)
        .parent("span")
        .parent("li");
    var index;
    
    var id = '_' + getId(obj.attr("id"));
    if(id.length == 1)
      id = '';

    if (li.length) {
      //List
      var ul = li.parent("ul");
      var div = ul.closest("div");
      var index = ul.find("li").index(li);
      uploadInput = div.find('input[id^="productImage"]');
    } else {
      //jqGrid
      var divId = id.length? $("#jqDiv" + id) : $("#jqDiv");

      var tr = $(this).closest("tr"); //parent('span').parent('td').parent('tr');
      var table = tr.closest("table"); //parent('tbody').parent('table');
      var div = divId.prev("div");
      index = table.find("tr").index(tr);
      uploadInput = div.find('input[id^="productImage"]');
    }

    uploadInput.attr("fromOutside", index).trigger("click");
  });
}

function prepareSortTable() {
  if ($("th").length) {
    $("th")
      .css({ cursor: "pointer" })
      .attr("title", "Sort Asc/Desc");
    $("th").on("click", sortTable);
  }
}

function errorSuccess(Swal, errorMessage, successMessage) {
  if (errorMessage.length > 0) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text: errorMessage
    });
  }

  if (successMessage.length > 0) {
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: successMessage
    });
  }
}

function initGrid(
  colModel,
  data,
  gridId,
  pagerId,
  sortName,
  theName,
  width,
  token
) {
  $(`${gridId}`).jqGrid({
    colModel: colModel,
    data: data,
    guiStyle: "bootstrap4",
    iconSet: "glyph",
    idPrefix: "gb1_",
    datatype: "local",
    viewrecords: true,
    gridview: true,
    altRows: true,
    pager: pagerId,
    rowNum: 30,
    //scroll: 1,
    shrinkToFit: true,
    //autowidth: true,
    multiselect: true,
    rownumbers: true,
    pagination: true,
    autoencode: false,
    toolbar: [true, "top"],
    width: !width ? 2950 : width,
    //height: 320,
    sortname: sortName,
    sortorder: "asc",
    loadComplete: function() {
      var divId = $(`${gridId}`).parent("div");
      var table = divId.find("table").first();
      if (token) {
        table.find(".downloadFile,.deleteFile").attr("token", token);
        table
          .find(".downloadFile > a,.deleteFile")
          .css({ cursor: "pointer", color: "teal", "font-weight": "bold" });

        table
          .find(".deleteFile")
          .off("click")
          .on("click", function() {
            removeFile(this);
          });
      } else if (table.find(".rem").length) {
        var id = '_' + getId(divId.attr("id"));
        
        var prod = $("#prodServiceInput").length
          ? $("#prodServiceInput")
          : $("#prodServiceInput" + id);
        bindHandleProduct(table.find(".rem"), prod, false, null, true, false);
        bindHandleProduct(table.find(".inc"), prod, false, null, false, true);
        bindHandleProduct(table.find(".dec"), prod, false, null, false, false);
        delegateUpload(table.find(".uploadImage"));
      } else {
      }
    },
    gridComplete: function() {},
    caption: `The ${theName} grid, which uses predefined formatters and templates:`
  });

  $(`${gridId}`).navGrid(pagerId, {
    edit: true,
    add: true,
    del: true,
    refresh: true,
    view: true
  });
  $(`${gridId}`).inlineNav(
    pagerId,
    // the buttons to appear on the toolbar of the grid
    {
      edit: true,
      add: true,
      del: true,
      cancel: true,
      editParams: {
        keys: true
      },
      addParams: {
        keys: true
      }
    }
  );
}

function fileExists(absolutePath, isMulti, ob, theDiv, fileId, i, val, token) {
  $.ajax({
    url: "/exists",
    type: "POST",
    headers: { "X-CSRF-Token": token },
    data: { path: absolutePath },
    datatype: "application/json",
    error: function() {
      Swal.fire({
        title: "Not found!",
        text: "Your file, " + absolutePath + ", was not found.",
        icon: "error"
      });
    },
    success: function(data) {
      if (!data || !data.exists) {
        Swal.fire({
          title: "Not found!",
          text: "Your file, " + absolutePath + ", was not found.",
          icon: "error"
        });
        return false;
      }

      var displayName = fileId.substring(fileId.lastIndexOf("/") + 1);
      if (isMulti) {
        ob +=
          '<div><span class="fileName">' +
          displayName +
          '</span>&nbsp;&nbsp;<a href="' +
          fileId +
          '" file="' +
          fileId +
          '" title="Download ' +
          val[i] +
          '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;&nbsp;<span token="' +
          token +
          '" file="' +
          fileId +
          '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' +
          val[i] +
          ' file">Remove</span></div>';
        if (i == val.length - 1) {
          ob += "<br></div>";
          if (ob.contains("href")) $(ob).insertAfter(theDiv);
        }
      } else {
        ob +=
          '<div><span class="fileName">' +
          displayName +
          '</span>&nbsp;&nbsp;<a href="' +
          fileId +
          '" file="' +
          fileId +
          '" title="Download ' +
          val +
          '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;&nbsp;<span token="' +
          token +
          '" file="' +
          fileId +
          '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' +
          val +
          ' file">Remove</span><br></div>';
        $(ob).insertAfter(theDiv);
      }
    }
  });
}

function processSingleFile(response, val, ob, input, prevInput, token, theDiv) {
  val = response.path
    ? "../" + response.path.substring(7)
    : response.file.originalname;
  input.attr("value", val);
  var file = response.path ? response.path : response.file.id;
  if (prevInput && prevInput.length) prevInput.attr("value", val); //file

  ob =
    '<div><a href="' +
    val +
    '" file="' +
    file +
    '" title="Download ' +
    val +
    '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;<span token="' +
    token +
    '" file="' +
    file +
    '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' +
    val +
    ' file">Remove</span></div>';
  $(ob).insertAfter(theDiv);
}

function checkPresence(obj) {
  var sel = obj.parent("div").find("select");
  var val = obj.val();
  obj.removeClass("present");
  var isPresent = false;

  sel
    .find("option")
    .not(":first")
    .each(function(index, element) {
      if ($(this).text() == val) {
        isPresent = true;
        return true;
      }
    });

  if (isPresent) {
    obj.addClass("present");
  }
}

//jqGrid Formatters:
function productFormatter(cellvalue, options, rowObject) {
  // format the cellvalue to new format
  //alert(JSON.stringify(rowObject));
  return `<span class='product'>${cellvalue}</span>`;
}

function amountFormatter(cellvalue, options, rowObject) {
  return `<span class='amountWrapper0'><span class='amount'>${parseInt(
    rowObject.hiddenAmount
  )}</span> items </span>`;
}

function priceFormatter(cellvalue, options, rowObject) {
  return `<span class='basicPriceWrapper0'><span class='price'>${parseFloat(
    rowObject.hiddenPrice
  ).toFixed(2)}</span> <span class='currency'>${
    rowObject.hiddenCurrency
  }</span></span>`;
}

function totalPriceFormatter(cellvalue, options, rowObject) {
  return `<span class='priceWrapper0'><span class='totalPrice'>${parseFloat(
    rowObject.hiddenTotalPrice
  ).toFixed(2)}</span> <span class='currency'>${
    rowObject.hiddenCurrency
  }</span></span>`;
}

function buttonsWrapperFormatter(cellvalue, options, rowObject) {
  return `<span class='buttonsWrapper' style="text-align: center"><span class='rem' title="Delete"></span><span class='dec' title='Remove item'></span><span class='inc' title='Add item'></span></span>`;
}

function imageWrapperFormatter(cellvalue, options, rowObject) {
  return `<span class='imageWrapper0'><span style='text-align: center' class='uploadImage'>Upload Image</span>  <span class='productImage' title="Product Image">${rowObject.productImageSource}</span></span>`;
}

function productPriceFormatter(cellvalue, options, rowObject) {
  return `<span class='priceWrapper0'><span class='totalPrice'>${parseFloat(
    rowObject.hiddenTotalPrice
  ).toFixed(2)}</span> <span class='currency'>${
    rowObject.currency
  }</span></span>`;
}

function removalFormatter(cellvalue, options, rowObject) {
  return rowObject.hiddenHref.length
    ? `<a href="${rowObject.hiddenHref}"><span class="adminDelete">Remove User</span></a>`
    : "";
}

function downloadFormatter(cellvalue, options, rowObject) {
  return `<span class='downloadFile'><a href="${rowObject.downloadHref}" title="Download ${rowObject.downloadName}" class="downloadFileHref" download>Download file</a></span>`;
}

function linkFormatter(cellvalue, options, rowObject) {
  return (
    '<span class="placeBid" style="font-weight: bold"><a href="../buyer/placeBid/' +
    rowObject.buyerId +
    "/" +
    rowObject.productId +
    "/" +
    rowObject.supplierId +
    '"><b>Bid on this Product</b></a></span>'
  );
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
  return `<img src="${rowObject.hiddenImageSrc}" title="Product Image" style="height: 20px; width: 20px" onclick="window.open(this.src)">`;
}

function getExt(name) {
  var ind = name.lastIndexOf(".");
  ind = name.substring(ind + 1);
  return ind.toLowerCase();
}

function imageFormatter(cellvalue, options, rowObject) {
  var ext = getExt(rowObject.downloadHref);

  return ext == "png" || ext == "jpg" || ext == "jpeg"
    ? `<img src="${rowObject.downloadHref}" title="Image" style="height: 30px; width: 30px" onclick="window.open(this.src)">`
    : `<span style="cursor: pointer" name="${rowObject.downloadHref}" onclick="window.open('https://www.google.com/')">No image</span>`;
}

$(document).ready(function() {
  var cnt = $("div.container").first();

  if (!cnt.hasClass("terms")) {
    $("input,textarea,span,label,li,button,a,b,p,h1,h2,h3,h4,h5,option").each(
      function(index, el) {
        //Tooltips in the App.
        if (!$(el).attr("title")) {
          $(el).attr("title", $(el).val() ? $(el).val() : $(el).text());
        }
      }
    );
  }

  var nav = $("body").find("nav");
  if (nav.length && nav.next("div").hasClass("home")) {
    var $str =
      ' <div class="collapse navbar-collapse" id="navbarSupportedContent">' +
      '<ul class="navbar-nav mr-auto">' +
      '<li class="nav-item">' +
      '<a class="nav-link" title="Home" href="/">Home</a>' +
      "</li>" +
      '<li class="nav-item">' +
      '<a class="nav-link" title="About" href="/about">About</a>' +
      "</li>" +
      '<li class="nav-item">' +
      '<a class="nav-link" href="/termsConditions" title="Terms and Conditions">Terms</a>' +
      "</li>" +
      '<li class="nav-item last">' +
      '<a class="nav-link" href="/antibriberyAgreement" title="Anti-Bribery Agreement">Anti-Bribery</a>' +
      "</li>" +
      "</ul>" +
      "<br>" +
      '<button class="signup btn btn-primary" data-toggle="modal" data-target="#signUpModal">Sign up</button>' +
      "</div>";

    nav.append($str);

    var ul = $("#navbarSupportedContent").find("ul");

    $(
      '<li class="nav-item"><a class="nav-link" href="/feedback" title="Feedback/Suggestions">User Feedback</a></li>'
    ).insertAfter("li.last");

    var isAdmin = nav.find('input[id="userData"]').attr("isAdmin");
    var bigScreen = window.matchMedia("(min-width: 900px)");
    var marg = bigScreen.matches ? 0 : 180;

    $(window)
      .off("resize")
      .on("resize", function() {
        if ($(window).width() >= 900) {
          $("a.admin").css({ "margin-top": 0, float: "" });
        } else {
          $("a.admin").each(function() {
            $(this).css({
              "margin-top": -$(this).attr("marg"),
              float: "right"
            });
          });
        }
      });

    if (isAdmin == "true") {
      treatLastLi();
      $(
        '<li class="nav-item"><a class="nav-link admin" marg="' +
          marg +
          '" style="margin-top: -' +
          marg +
          'px" title="Admin specific fields"><b>Admin Section<b></a></li>'
      ).insertAfter("li.last");
      marg -= treatLastLi();
      $(
        '<li class="nav-item"><a class="nav-link admin" marg="' +
          marg +
          '" style="margin-top: -' +
          marg +
          'px" href="/viewFeedbacks" title="Check Feedbacks">View Feedbacks</a></li>'
      ).insertAfter("li.last");
      marg -= treatLastLi();
      $(
        '<li class="nav-item"><a class="nav-link admin" marg="' +
          marg +
          '" style="margin-top: -' +
          marg +
          'px" href="/memberList" title="List of UNITE Members">List of our members</a></li>'
      ).insertAfter("li.last");
      marg -= treatLastLi();
      $(
        '<li class="nav-item"><a class="nav-link admin" marg="' +
          marg +
          '" style="margin-top: -' +
          marg +
          'px" href="/filesList" title="View Uploaded Files List">View Uploaded Files</a></li>'
      ).insertAfter("li.last");
      marg -= treatLastLi();
      $(
        '<li class="nav-item"><a class="nav-link admin" marg="' +
          marg +
          '" style="margin-top: -' +
          marg +
          'px" href="/bidsList" title="View UNITE Bids List">View All Bids</a></li>'
      ).insertAfter("li.last");
    }

    var ind = parseInt(nav.attr("pos"));
    //$('li.admin').css('float', 'right');

    if (
      ul
        .find("li")
        .first()
        .hasClass("user")
    ) {
      ind++;
    }

    var li = ul.find("li").eq(ind);
    li.addClass("active");
    var text = li.find("a").text();
    //li.find('a').text(text + ' (current)');// Askin said that this is not necessary. So REMOVE it!
    //}
  } else {
    if (nav.length && !nav.hasClass("noMenu")) {
      var user = nav.attr("user");
      var bigScreen = window.matchMedia("(min-width: 900px)");
      var offset = user == "supplier" ? 112 : user == "buyer" ? 80 : 40;
      var profilePx = parseInt(offset + 32),
        logoutPx = parseInt(offset);

      if (bigScreen.matches) {
        profilePx = 0;
        logoutPx = 0;
      }

      $(window)
        .off("resize")
        .on("resize", function() {
          if ($(window).width() >= 900) {
            $("a.userRight").css({
              "margin-top": 0,
              "margin-right": "10px",
              float: ""
            });
          } else {
            $("a.userRight").each(function() {
              $(this).css({
                "margin-top": -$(this).attr("marg"),
                float: "right"
              });
            });
          }
        });

      var str =
        '<div class="collapse navbar-collapse" id="navbarSupportedContent">' +
        '<ul class="navbar-nav mr-auto">' +
        '<li class="nav-item"><a class="nav-link" href="/">Home<span class="sr-only"></span></a> </li>' +
        '<li class="nav-item"><a class="nav-link" href="/' +
        user +
        '">Dashboard <span class="sr-only"></span></a></li>' +
        (user == "supervisor"
          ? ""
          : '<li class="nav-item"><a class="nav-link" href="/' +
            user +
            '/balance">Balance <span class="sr-only"></span></a></li>') +
        (user == "supplier"
          ? '<li class="nav-item"><a class="nav-link" href="/' +
            user +
            '/bid-requests">Bid Requests</a></li>'
          : "") +
        '<li class="nav-item"><a class="btn btn-primary userRight" marg="' +
        profilePx +
        '" style="margin-top: -' +
        profilePx +
        'px" href="/' +
        user +
        '/profile">Profile</a></li><br>' +
        '<li class="nav-item"><a class="btn btn-danger userRight" marg="' +
        logoutPx +
        '" style="margin-top: -' +
        logoutPx +
        'px" title="Logout" href="?exit=true">Logout</a></li></ul></div>';

      nav.append(str);

      if (bigScreen.matches) {
        $("a.userRight").css({ "margin-right": "10px" });
      }

      if (nav.attr("pos")) {
        var ind = parseInt(nav.attr("pos")),
          ul = $("#navbarSupportedContent").find("ul");
        var li = ul.find("li").eq(ind);
        li.addClass("active");
        var text = li.find("a").text();
        //li.find('a').text(text + ' (current)');
      }
    }
  }

  $("body").css({
    "background-image":
      "url(https://cdn.glitch.com/e38447e4-c245-416f-8ea1-35b246c6af5d%2FWH.png?v=1592308122673)",
    "background-repeat": "repeat"
  }); //That white!

  if (nav)
    nav.find("span").attr("title", "Expand/collapse UNITE basic options");

  $(".cancelForm").submit(function() {
    return confirm("Are you sure you want to cancel this order?");
  });

  $("select.currency").on("change", function() {
    var val = $(this).val();
    $('input[name="currency"]').val(val);
    $("#currency").val(val);

    //Re-make the list of products accordingly, with the new currency.
    if (!$("#prodServices").length) return false;

    $("#prodServices")
      .find("li")
      .each(function(index, elem) {
        var price = parseFloat(
            $(this)
              .find(".price")
              .text()
          ).toFixed(2),
          currency = $(this)
            .find(".currency")
            .text();
        var newPrice = fx.convert(price, { from: currency, to: val });
        $(this)
          .find(".price")
          .text(parseFloat(newPrice).toFixed(2));
        $(this)
          .find("span.currency")
          .text(val);
      });
  });

  $("select.autocomp")
    .prepend('<option class="first" value=""></option>')
    .css({ width: "100%" })
    .find("option.first")
    .prop("selected", true);

  $("select.autocomp").on("change", function() {
    var input = $(this)
      .parent("div")
      .find("input.form-control");
    input.val($(this).val());
    $(this)
      .find("option.autocomp")
      .remove();

    if (input.hasClass("search")) {
      input
        .parent("div")
        .parent("form")
        .submit();
    } else {
      input.addClass("fromList");
    }

    $(this).blur();
  });

  $("input.autocomp").each(function(index, element) {
    checkPresence($(this));
  });

  $("input.autocomp").on("change", function() {
    checkPresence($(this));
    $(this).addClass("changed");
  });

  if ($("#match").length) {
    $("#match").css({ color: "red" });
  }
  
  
  if($('button.placeBid').length) {//Placing a bid from Buyer Index or PlaceBid.    
      $('button.placeBid').on('click', function() {
        var id = '_' + $(this).attr('index');
        if(id.charAt(1) == '-')
            id = '';
        
        var elem = 1 == 2? $("#prodServices"+id) : $('#grid'+id);
        
        if(!(elem.find('tr')) || !(elem.find('tr').length)) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            //timer: 2000,
            text: 'You must choose at least one product from your Supplier\'s offer before placing the Order.'
          });
          
          return false;
        }
       
        var prodInput = $("#hiddenProdServicesList"+id);
        var amountInput = $("#amountList"+id);
        var priceInput = $("#priceList"+id), priceOrigInput = $("#priceOriginalList"+id);
        var prodImageInput = $("#productImagesList"+id);
        var arr = [], arr1 = [], arr2 = [], arr3 = [], arr4 = [], arr5 = [];
        var totalPriceOriginal = 0, totalPriceConverted = 0;
        
        elem.find('tr').each(function() {
          arr.push($(this).find('span.product').text());
          arr1.push($(this).attr('amount'));
          var originalPrice = parseFloat($(this).attr('bigPrice')).toFixed(2);
          var val = fx.convert(originalPrice, {from: $(this).find('.currency').text(), to: elem.attr('suppCurrency')});
          arr2.push(val);
          arr4.push(originalPrice);
          totalPriceOriginal += originalPrice;
          totalPriceConverted += parseFloat(val).toFixed(2);
          var img = $(this).find('span.productImage img');
          var src = img && img.length? 'public/' + img.attr('src').substring(3) : '';
          arr3.push(src);
          
          if($('#supplierIdsList').length) {//PlaceBid Multi Supplier.
            arr5.push($(this).attr('supplierId'));
          }
        });
        
        prodInput.val(arr);
        amountInput.val(arr1);
        priceInput.val(arr2);
        prodImageInput.val(arr3);
        priceOrigInput.val(arr4);
        
        if(arr5.length) {
          $('#supplierIdsList').val(arr5);
        }
        
        $('#price'+id).text(totalPriceOriginal);
        if($('#supplierPrice'+id).length) 
          $('#supplierPrice'+id).text(totalPriceConverted);
      });
    
      $('input[id^="prodServiceInput"]').on('change', function() {
        if($(this).val()) {
          var id = '_' + getId($(this).attr('id'));
          if(id.length == 1)
            id = '';
          
          $("#addProdService"+id).prop('disabled', false);
          var price = $(this).attr('price')? $(this).attr('price') : 1;
          price *= parseInt($('#amount'+id).val());
          $('#buyerPriceUnit'+id).text(price);
          
          var supplierCurrency = $('#supplierCurrency'+id).text();
          var suppPrice = fx.convert(price, {from: $('span.bidCurrency[index="'+ (id.length? id : '-1') +'"]').first().text(), to: supplierCurrency
       });
          $('#supplierPriceUnit'+id).text(suppPrice);
        }
      });
      
      $('input[id^="amount"]').inputFilter(function(value) {
        return /^\d*$/.test(value);
      });

      $('input[id^="amount"]').on('change', function() {
        var id = '_' + getId($(this).attr('id'));
        if(id.length == 1)
            id = '';
        
        var price = $("#prodServiceInput"+id).attr('price')? $("#prodServiceInput"+id).attr('price') : 1;
        price *= parseInt($(this).val());
        var maxAmount = $("#prodServiceInput"+id).attr('maxAmount');

        if(maxAmount && $(this).val() > maxAmount) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'You have reached the limit of ' + maxAmount + ' samples of this product. Supplier\'s stock is not enough.'
          });

          return false;
        }

        $('#buyerPriceUnit'+id).text(price);
        
        var supplierCurrency = $('#supplierCurrency'+id).text();
        var suppPrice = fx.convert(price, {from: $('span.bidCurrency[index="'+ (id.length? id : '-1') +'"]').first().text(), to: supplierCurrency
        });
        $('#supplierPriceUnit'+id).text(suppPrice);
      });

      $('select.buyerCurrency').on('change', function() {
        var curr = $(this).val();
        var id = '_' + $(this).attr('index');
        if(id.charAt(1) == '-')
            id = '';
        
        var elem = $("#prodServices"+id), grid = $("#grid"+id);
        elem.attr('buyerCurrency', curr);
        grid.attr('buyerCurrency', curr);
        
        var suppCurrency = elem.attr('suppCurrency');
        
        if(curr && curr != suppCurrency) {
          Swal.fire({
            icon: 'warning',
            title: 'Warning',
            timer: 2000,
            html: 'The currency of your order is different from the Supplier\'s.<br>Yours is ' + curr + ', theirs is ' + suppCurrency  + '.<br>Please note that conversion rates will be applied.'
          });
        }
        
        var priceInput = $('#price'+id);
        var oldBidCurrencySpan = $('span.bidCurrency[index="'+ (id.length? id : '-1') +'"]').first();
        var val = fx.convert(parseFloat(priceInput.text()).toFixed(2), {from: oldBidCurrencySpan.text(), to: curr});
        priceInput.text(val);
        $('span.bidCurrency[index="'+ (id.length? id : '-1') +'"]').each(function(i, e) {
          $(this).text(curr);
        });
        
        var buyerPriceUnit = $('#buyerPriceUnit'+id), buyerPriceCurr = $('#buyerPriceCurrency'+id);
        if(buyerPriceUnit.text() != null && buyerPriceUnit.text() != '0') {
          var newPriceUnit = fx.convert(parseFloat(buyerPriceUnit.text()).toFixed(2), {from: buyerPriceCurr.text(), to: curr});
          buyerPriceUnit.text(newPriceUnit);
        }
        
        buyerPriceCurr.text(curr);
        
        if(!elem.find('li') || !elem.find('li').length) {
          return false;
        }
        
        elem.find('li').each(function() {
          var addedPrice = $(this).attr('price'), totalPrice = $(this).attr('totalPrice'), shownPrice = $(this).find('.price').text(), theCurr = $(this).find('.currency').text();
          
          addedPrice = fx.convert(parseFloat(addedPrice).toFixed(2), {from: theCurr, to: curr});
          totalPrice = fx.convert(parseFloat(totalPrice).toFixed(2), {from: theCurr, to: curr});
          shownPrice = fx.convert(parseFloat(shownPrice).toFixed(2), {from: theCurr, to: curr});
          
          $(this).attr('price', addedPrice);
          $(this).attr('totalPrice', totalPrice);
          $(this).find('.price').text(shownPrice);
          $(this).find('.currency').text(curr);
        });
      });    
    
      $('select.productsList').on('change', function() {
        if(!$(this).val() || !$(this).val().length) {
          return false;
        }
        
        var name = $(this).val();
        var opt = $(this).find('option:selected');
        var price = opt.attr('price');
        var totalPrice = opt.attr('totalPrice');
        var currency = opt.attr('currency');
        var maxAmount = opt.attr('maxAmount');
        var bidCurrency = $('select.buyerCurrency').find('option:selected').val();
        
        if(bidCurrency != currency) {
          Swal.fire({
            icon: 'warning',
            title: 'Warning',
            timer: 2000,
            html: "The currency of your order is different from the Supplier's.<br>Yours is " + bidCurrency + ', theirs is ' + currency  + '.<br>Please note that conversion rates will be applied.'
          });
        }
        
        var val = fx.convert(parseFloat(price).toFixed(2), {from: currency, to: bidCurrency});
        var input = $(this).parent('div').next('div').find('.prodInput');
        input.attr({'price': val, 'maxAmount': maxAmount});
        input.val(name);
        input.trigger('change');
      });
    
    
      $('input.prodInput').autocomplete({
        source: function(req, res) {
          var obj = $(this.element);
          $('.prov').remove();
          req.supplierId = obj.attr('supplierId');

          $.ajax({
            url: "/prodServiceAutocomplete",
            headers: { "X-CSRF-Token": token },
            datatype: 'jsonp',
            type: "POST",
            data: req,
            scroll: true,
            success: function(data) {
              if(!data || !data.length) {
                //obj.val('');
                //obj.next('.prodButton').prop('disabled', true);
               //return false;
              }

              res(data);
              //autocomp(obj, data);
              var $obj = '<div class="prov"><ul class="autocomp">';
              for(var i in data) {
                $obj += '<li id="' + data[i].price + '" amount="' + data[i].amount + '" totalPrice="' + data[i].totalPrice + '" productImage="' + data[i].productImage + '" currency="' + data[i].currency + '">' + data[i].name + '</li>';
              }

              $obj += '</ul><div>';
              $($obj)
                .insertAfter(obj.parent('div'))
                .find('li')
                .click(function() {
                  var id = '_' + getId(obj.attr('id'));
                  if(id.length == 1)
                    id = '';
                
                  var buyerCurr = $('select.buyerCurrency[index="' + id.length? id : '-1' +'"]').val();
                  var val = fx.convert(parseFloat($(this).attr('id')).toFixed(2), {from: $(this).attr('currency'), to: buyerCurr});
                
                  obj
                    .attr({'price': val, 'maxAmount': $(this).attr('amount'), 'currency': buyerCurr})
                    .val($(this).text())
                    .trigger('change');
                  $(this).parent('ul').hide();
              });
            },
            error: function(err) {
              alert(err.message);
            }
          });
        },
        minLength: 3
      });    
  }
  

  if (!$("input.upload").length) return false;

  var token = $("input[name='_csrf']:first").val();

  $("input.upload").on("change", function() {
    var nextInput = $(this).next("input");
    $(this).attr("fromOutside") != null
      ? nextInput.trigger("click")
      : nextInput.prop("disabled", $(this).val() ? false : true);
  });

  $(".single,.multiple").each(function(index, element) {
    var input = $(this).prev("input");
    var prevInput = input.prev("input");
    var val = input.attr("value"),
      fileId = prevInput && prevInput.length ? prevInput.val() : null;
    var theDiv = $(this).parent("div");
    input.attr("value", fileId);
    val = fileId;

    if (fileId && fileId.length) {
      var isMulti = false;

      if (val.charAt(val.length - 1) == ",") {
        var newVal = val.substring(0, val.length - 1);
        if (newVal.indexOf(",") != -1) {
          isMulti = true;
          val = newVal.split(",");
          newVal = fileId.substring(0, fileId.length - 1);
          fileId = newVal.split(",");
        }
      }

      if (isMulti) {
        var ob = '<div class="fileWrapper">';
        for (var i in val) {
          fileExists(
            "public/" + fileId[i].substring(3),
            isMulti,
            ob,
            theDiv,
            fileId[i],
            i,
            val,
            token
          );
        }
      } else {
        var ob = "";
        fileExists(
          "public/" + fileId.substring(3),
          false,
          ob,
          theDiv,
          fileId,
          0,
          val,
          token
        );
      }
    }
  });

  delegateUpload($(".uploadImage"));

  $(".single,.multiple").click(function(e) {
    var input = $(this).prev("input");
    var isExcel = input.hasClass("fileexcelupload") ? true : false;
    var isProduct = input.hasClass("productimageupload") ? true : false;
    var isAvatar = input.hasClass("avatarupload") ? true : false;

    var isMultiple = $(this).hasClass("multiple");
    var formData = new FormData();
    formData.append("_csrf", token);
    formData.append("upload_file", true);

    if (isMultiple == false) {
      formData.append("single", input[0].files[0]);
    } else {
      $.each(input[0].files, function(i, file) {
        formData.append("multiple", file);
      });
    }

    var theUrl = isAvatar
      ? "/avatarUpload"
      : isMultiple == true
      ? "/uploadMultiple"
      : isProduct == true
      ? "/uploadProductImage"
      : isExcel
      ? "/uploadExcel"
      : "/uploadFile"; //uploadmultiple versus uploadfile.

    var xhr = new XMLHttpRequest();
    xhr.open("POST", theUrl, true);
    xhr.setRequestHeader("X-CSRF-TOKEN", token);
    xhr.onload = function(e) {};

    xhr.send(formData);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        //Success!
        input.next("input").prop("disabled", true);
        var prevInput = input.prev("input");
        var ob,
          val,
          response = isAvatar ? xhr.responseText : JSON.parse(xhr.responseText);
        var theDiv = input.parent("div");

        if (isAvatar) {
          var src = "../" + response.substring(7);
          $('input[name="avatar"]').val(src); //'../../../'+response
          $(
            `<div><img src="${src}" alt="avatar" style="width: 60px; height: 60px"  onclick="window.open(this.src)"><br><span token="${token}" file="${response}" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ${src} file">Remove</span></div>`
          ).insertAfter(input);
          //var loc = window.location.pathname;
          //var dir = loc.substring(0, loc.lastIndexOf('/'));
          //alert(loc + ' ' + dir);
          //alert(imageExists('../avatars/Avatar-3:15:pm-a.jpg'));
        } else if (isProduct) {
          //Supplier Profile/Sign-up pages; Add Product page.
          var res = "../" + response.path.substring(7);

          input.attr("filePath", res);
          if (input.hasClass("separated")) {
            //The separated Add Product Page.
            $("#productImage").val(response.path);
          }

          if (input.attr("fromOutside") != null) {
            var index = input.attr("fromOutside");
            var div = input.parent("div");
            var ul = div
              .parent("div")
              .find("ul")
              .last();
            var li = ul.find("li").eq(index);
            var span = li.find(".productImage");
            var img = span.find("img");

            var table = ul
              .parent("div")
              .next("div")
              .find("table")
              .eq(1); //Last
            var tr = table.find("tbody tr").eq(index);
            var span2 = tr.find("span.productImage");
            var img2 = span2.find("img");

            if (img != null && img.attr("src") != null) {
              img.attr("src", res);
            } else {
              var str = `<img src="${res}" style="height: 25px; width: 30px" onclick="window.open(this.src)">`;
              span.append(str);
            }

            if (img2 != null && img2.attr("src") != null) {
              img2.attr("src", res);
            } else {
              var str = `<img src="${res}" style="height: 25px; width: 30px" onclick="window.open(this.src)">`;
              span2.append(str);
            }

            input.removeAttr("fromOutside");
            input.prev("input").val("");
            input.removeAttr("filePath");
          } else {
            processSingleFile(
              response,
              val,
              ob,
              input,
              prevInput,
              token,
              theDiv
            );
          }
        } else if (isExcel) {
          var fromBuyer = input.hasClass("fromBuyer");
          var div = fromBuyer ? input.parent("div").next("div") : null;
          var el = fromBuyer ? div.find("ul") : $("#prodServices");
          var productInput = fromBuyer
            ? div.find('input[id^="prodServiceInput"]')
            : $("#prodServiceInput");

          var MAX = el.attr("MAX"); //parseInt("<%= MAX_PROD %>");

          if (Array.isArray(response) && response.length == 4) {
            for (var i in response) {
              //Each Supplier product should come here.
              if (i < 1) continue;
              var elem = response[i]; //Assume that elem fields are called name, price, and currency.

              if (el.find("li").length >= MAX) {
                Swal.fire({
                  icon: "error",
                  title: "Error!",
                  text:
                    "You have reached the limit of " + MAX + " products to add."
                });
                return false;
              }// placeBid isMulti
              
              var suppId = $('#productsList').length && $('#productsList option:selected').attr('supplierId')?
                  $('#productsList option:selected').attr('supplierId') : null;

              fromBuyer
                ? addition(
                    productInput,
                    elem[0],
                    elem[1],
                    elem[2],
                    elem[3],
                    null,
                    el,
                    true,
                    suppId
                  )
                : addition(
                    productInput,
                    elem[0],
                    elem[1],
                    elem[2],
                    elem[3],
                    null,
                    el,
                    false,
                    suppId
                  );
            }
          } else {
            Swal.fire({
              icon: "error",
              title: "Error!",
              text:
                "Invalid Excel data. Please make sure that: 1) Your first row contains the column names; 2) You have four columns: name, price, currency, and amount."
            });
            return false;
          }
        } else if (isMultiple) {
          //response.file.filename, originalname, fieldname,
          var hasDiv = theDiv.next("div").hasClass("fileWrapper");
          ob = hasDiv ? "" : '<div class="fileWrapper">';
          for (var i in response) {
            var absolutePath = response[i].path
              ? "../" + response[i].path.substring(7)
              : response[i].file.originalname;
            val = !(input.attr("value") && input.attr("value").length)
              ? absolutePath + ""
              : input.attr("value") + absolutePath + "";
            input.attr("value", val);
            var file = response[i].path
              ? response[i].path
              : response[i].file.id;
            prevInput.attr(
              "value",
              !(prevInput.val() && prevInput.val().length)
                ? val + ""
                : prevInput.val() + val + ""
            );

            ob +=
              '<div><a href="' +
              absolutePath +
              '" file="' +
              file +
              '" title="Download ' +
              absolutePath +
              '" style="color: blue; cursor: pointer" download>Download file "' +
              i +
              '"</a>&nbsp;<span token="' +
              token +
              '" file="' +
              file +
              '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' +
              absolutePath +
              ' file">Remove</span></div>';
          }

          if (hasDiv) {
            theDiv.next("div").append(ob);
          } else {
            ob += "</div>";
            $(ob).insertAfter(theDiv);
          }
        } else {
          //Single file
          processSingleFile(response, val, ob, input, prevInput, token, theDiv);
        }

        if (xhr.status === 200) {
          console.log("successful");
        } else {
          console.log("failed");
        }
      }
    };

    e.preventDefault();
  });
});
