const autocomp = function(obj, data, enter) {
  //Not suitable for modals.
  let sel = obj.parent("div").find("select");
  for (const i in data) {
    const opt =
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
};


//jqGrid Formatters:
function productFormatter(cellvalue, options, rowObject) {
  return `<span class='product'>${cellvalue}</span>`;
}

function supplierFormatter(cellvalue, options, rowObject) {
  return `<span class='supplierName'>${cellvalue}</span>`;
}

function amountFormatter(cellvalue, options, rowObject) {
  return `<span class='amountWrapper0'><span class='amount'>${parseInt(rowObject.hiddenAmount)}</span><span> items</span> </span>`;
}

function priceFormatter(cellvalue, options, rowObject) {
  return `<span class='basicPriceWrapper0'><span class='price'>${parseFloat(rowObject.hiddenPrice).toFixed(2)}</span> <span class='currency'>${rowObject.hiddenCurrency}</span></span>`;
}

function totalPriceFormatter(cellvalue, options, rowObject) {
  return `<span class='priceWrapper0'><span class='totalPrice'>${parseFloat(rowObject.hiddenTotalPrice).toFixed(2)}</span> <span class='currency'>${rowObject.hiddenCurrency}</span></span>`;
}

function buttonsWrapperFormatter(cellvalue, options, rowObject) {
  return `<span class='buttonsWrapper' style="text-align: center"><span class='rem' title="Delete"></span><span class='dec' title='Remove item'></span><span class='inc' title='Add item'></span></span>`;
}

function imageWrapperFormatter(cellvalue, options, rowObject) {
  return `<span class='imageWrapper0'><span style='text-align: center' class='uploadImage'>Upload Image</span>  <span class='productImage' title="Product Image">${rowObject.productImageSource}</span></span>`;
}

function productPriceFormatter(cellvalue, options, rowObject) {
  return `<span class='priceWrapper0'><span class='totalPrice'>${parseFloat(rowObject.hiddenTotalPrice).toFixed(2)}</span> <span class='currency'>${rowObject.currency }</span></span>`;
}

function removalFormatter(cellvalue, options, rowObject) {
  return rowObject.hiddenDeleteHref && rowObject.hiddenDeleteHref.length
    ? `<a href="${rowObject.hiddenDeleteHref}"><span class="adminDelete">Remove User</span></a>`
    : "";
}

function banFormatter(cellvalue, options, rowObject) {
  return rowObject.hiddenBanHref && rowObject.hiddenBanHref.length
    ? `<a href="${rowObject.hiddenBanHref}"><span class="adminBan">Ban User</span></a>`
    : "";
}

function downloadFormatter(cellvalue, options, rowObject) {
  return `<span class='downloadFile'><a href="${rowObject.downloadHref}" title="Download ${rowObject.downloadName}" class="downloadFileHref" download>Download file</a></span>`;
}

function linkFormatter(cellvalue, options, rowObject) {
  return (
    '<span class="newBid" style="font-weight: bold"><a href="../buyer/placeBid/' +
    rowObject.buyerId +
    "/" +
    rowObject.supplierId +
    "/" +
    rowObject.productId +
    '"><b>Bid on this Product</b></a></span>'
  );
}

function fileRemovalFormatter(cellvalue, options, rowObject) {
  return `<span name="${rowObject.deletionHref}" class="deleteFile">Remove</span>`;
}

function buyerPriceFormatter(cellvalue, options, rowObject) {
  return `${rowObject.buyerPriceHref} ${rowObject.buyerCurrencyHref}`;
}

function supplierPriceFormatter(cellvalue, options, rowObject) {
  return `${rowObject.supplierPriceHref} ${rowObject.supplierCurrencyHref}`;
}

function productImageFormatter(cellvalue, options, rowObject) {
  return rowObject.productImageSource && rowObject.productImageSource.length? 
    `<img src="${rowObject.productImageSource}" title="Product Image" style="height: 20px; width: 20px" onclick="window.open(this.src)">` : 'None';
}

function getExt(name) {
  let ind = name.lastIndexOf(".");
  ind = name.substring(ind + 1);
  return ind.toLowerCase();
}

function imageFormatter(cellvalue, options, rowObject) {
  let ext = getExt(rowObject.downloadHref);

  return ext == "png" || ext == "jpg" || ext == "jpeg"
    ? `<img src="${rowObject.downloadHref}" title="Image" style="height: 30px; width: 30px" onclick="window.open(this.src)">`
    : `<span style="cursor: pointer" name="${rowObject.downloadHref}" onclick="window.open('https://www.google.com/')">No image</span>`;
}


function buyerRemovalFormatter(cellvalue, options, rowObject) {  
  return `<a href="delete/${rowObject.buyerId}"><button title="Remove selected Buyer from UNITE" id="process_${rowObject.index}" class="btn btn-danger">Process</button></a>`;
}


function chatFormatter(cellvalue, options, rowObject) {
  return `<a href="../../../supervisor/chatLogin/${rowObject.supervisorId}/${rowObject.buyerId}/0/None/${rowObject. buyerOrganizationName}/(Supervisor)-${rowObject.supervisorOrganizationName}>`;
}


//Unformatters:
function priceUnformatter(cellvalue, options, cell) {
  return parseFloat($('span.price', cell).text()).toFixed(2);
}

function amountUnformatter(cellvalue, options, cell) {
  return parseInt($('span.amount', cell).text());
}

function totalPriceUnformatter(cellvalue, options, cell) {
  return parseFloat($('span.totalPrice', cell).text()).toFixed(2);
}


//Formatters for Supervisor's Buyers Table:

function totalBidsPriceFormatter(cellvalue, options, rowObject) {
  return `<span class='basicPriceWrapper0'><span class='price'>${parseFloat(rowObject.hiddenTotalBidsPrice).toFixed(2)}</span> <span class='currency'>${rowObject.hiddenCurrency}</span></span>`;
}


function validBidsPriceFormatter(cellvalue, options, rowObject) {
  return `<span class='basicPriceWrapper0'><span class='price'>${parseFloat(rowObject.hiddenValidBidsPrice).toFixed(2)}</span> <span class='currency'>${rowObject.hiddenCurrency}</span></span>`;
}


function cancelledBidsPriceFormatter(cellvalue, options, rowObject) {
  return `<span class='basicPriceWrapper0'><span class='price'>${parseFloat(rowObject.hiddenCancelledBidsPrice).toFixed(2)}</span> <span class='currency'>${rowObject.hiddenCurrency}</span></span>`;
}


function expiredBidsPriceFormatter(cellvalue, options, rowObject) {
  return `<span class='basicPriceWrapper0'><span class='price'>${parseFloat(rowObject.hiddenExpiredBidsPrice).toFixed(2)}</span> <span class='currency'>${rowObject.hiddenCurrency}</span></span>`;
}


//Products Grid Col Model:
  const productColModel = [
    { name: 'productId', hidden: true },
    { name: 'buyerId', hidden: true },
    { name: 'supplierId', hidden: true },
    { name: 'hiddenAmount', hidden: true },
    { name: 'hiddenPrice', hidden: true },
    { name: 'hiddenTotalPrice', hidden: true },
    { name: 'hiddenCurrency', hidden: true },
    { name: 'productImageSource', hidden: true },
    { name: 'supplierCurrency', hidden: true },
    { name: 'maxAmount', hidden: true },
    { name: 'bigPrice', hidden: true },
    { name: 'name', label: 'Product name', formatter: productFormatter, search: true, width: 140},
    { name: 'supplierName', label: 'Supplier name', formatter: supplierFormatter, search: true, width: 140},
    { name: 'price', label: 'Product price', align: 'center', formatter: priceFormatter, unformat: priceUnformatter, template: 'number', sorttype: function(cellValue, rowObject) { return parseFloat(parseFloat(rowObject.hiddenPrice).toFixed(2));}, search: true, width: 140},
    { name: 'amount', label: 'Amount', formatter: amountFormatter, unformat: amountUnformatter, template: 'number', sorttype: function(cellValue, rowObject) { return parseInt(rowObject.hiddenAmount);}, align: 'center', search: true, width: 70},
    { name: 'totalPrice', label: 'Total price', align: 'center', formatter: totalPriceFormatter, unformat: totalPriceUnformatter, template: 'number', sorttype: function(cellValue, rowObject) { return parseFloat(parseFloat(rowObject.hiddenTotalPrice).toFixed(2));}, search: true, width: 90}, 
    { name: 'imageWrapper', label: 'Image Zone', align: 'center', width: 170, search: false, sortable: false, formatter: imageWrapperFormatter},
    { name: 'buttonsWrapper', label: 'Buttons Zone', align: 'center', width: 110, search: false, sortable: false, formatter: buttonsWrapperFormatter}
  ];

  const colModelGridBids = [
      { name: 'bidName', label: 'Bid Request Name', search: true, width: 210},
      { name: 'supplierName', label: 'Bid Supplier Name', align: 'center', sorttype: 'text', search: true, width: 220},      
      { name: 'buyerPrice', label: 'Buyer\'s Price', align: 'center', formatter: buyerPriceFormatter, sorttype: function(cellValue, rowObject) { return parseFloat(parseFloat(rowObject.buyerPriceHref).toFixed(2));}, search: true, width: 100},
      { name: 'supplierPrice', label: 'Supplier\'s Price', align: 'center', formatter: supplierPriceFormatter, sorttype: function(cellValue, rowObject) { return parseFloat(parseFloat(rowObject.supplierPriceHref).toFixed(2));}, search: true, width: 100 }, 
      { name: 'preferredDeliveryDate', label: 'Preferred Delivery Date', align: 'center', search: true, width: 100},
      { name: 'dateCreated', label: 'Creation Date', align: 'center', search: true, width: 200},
      { name: 'expiryDate', label: 'Expiry Date', align: 'center', search: true, width: 100},
      { name: 'isCancelled', label: 'Is Cancelled?', align: 'center', search: true, width: 100},
      { name: 'isExpired', label: 'Is Expired?', align: 'center', search: true, width: 100 },
      { name: 'buyerPriceHref', hidden: true },
      { name: 'buyerCurrencyHref', hidden: true },
      { name: 'supplierPriceHref', hidden: true },
      { name: 'supplierCurrencyHref', hidden: true }
    ];


function getCurrenciesList(elem, url, token, defaultBidCurrency, cancelChange) {
  let obj = $("" + elem + "");
  
  $.ajax({
    url: url,
    headers: { "X-CSRF-Token": token },
    datatype: "jsonp",
    type: "POST",
    success: function(data) {
       obj.each(function(ind, elem) {
         let obj2 = $(elem);
         
        if (!data || !data.length || treatError(data, "loading currencies")) {
          //obj2.val('');
          obj2.append("<option>No results found.</option>");
          return false;
        }

        obj2.append("<option></option>");
        for (let i in data) {
          let opt =
            "<option " +
            'style="word-wrap: break-word; width: 50px" title="' +
            data[i].value +
            '" value="' +
            data[i].name +
            '">' +
            data[i].name +
            "</option>";
          obj2.append(opt);
        }

        obj2
          .find('option[value="' + defaultBidCurrency + '"]')
          .prop('selected', true);

        if($('span.bidCurrency').length) {
          $('span.bidCurrency').each(function() {
            $(this).text(defaultBidCurrency);
            });

          if($('select.productsList').length) {
            $('select.productsList').each(function(ind, elem) {
              let opt = $(elem).find('option:selected');

              if(opt && opt.length && opt.text() && !(opt.text().toLowerCase().includes('no results found'))) {
                $(elem)
                  .addClass('init')
                  .trigger('change');
              }
            });
          }
        }

        if(!cancelChange)
          obj2.addClass('init').trigger('change');
      });
    },
    error: function(err) {
      alert(err);
    }
  }); 
}

function getProductsList(elem, url, token) {
  //For <select> drop-down currencies.
  let obj = $("" + elem + "");

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

      for (let i in data) {
        let opt =
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
    },
    error: function(err) {
      alert(err);
    }
  });
}


function openDropdown(obj) {
  function down() {
    let obj = $(this);
    let pos = obj.offset(); // remember position
    let len = obj.find("option").length;

    if (len > 10) {
      len = 10;
    }

    obj.css({ position: "relative", zIndex: 9999 });
    obj.offset(pos); // reset position
    obj.attr("size", 20 + len); // open dropdown
    obj.unbind("focus", down);
  }

  function up() {
    let obj = $(this);
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
      let obj = $(this.element);
      let sel = obj.parent("div").find("select");
      let data = [],
        found = false;

      sel.find("option.autocomp").remove();
      let arr = sel.find("option").not(".first");

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
            for (let i = data.length - 1; i >= 0; i--) {
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
  // Create an array and push all possible values that you want in password:
  let matchedCase = new Array();
  matchedCase.push("[$@$!%*#?&]"); // Special Character
  matchedCase.push("[A-Z]"); // Uppercase letters
  matchedCase.push("[0-9]"); // Numbers
  matchedCase.push("[a-z]"); // Lowercase letters

  // Check the conditions:
  let ctr = 0;
  for (let i = 0; i < matchedCase.length; i++) {
    if (new RegExp(matchedCase[i]).test(password)) {
      ctr++;
    }
  }
  // Display it:
  let color = "",
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
      color = "blue";
      break;
    case 4:
      strength = "Strong";
      color = "green";
      break;
  }

  $("#msg")
    .css({ color: color })
    .text(strength);
  
  $("#match").text(checkMatch()? "" : "Passwords do not match!");
}


function verifyMatch(password) {
  let mainPass = $("#password").val();
  $("#match").text(password !== mainPass ? "Passwords do not match!" : "");
}


function checkMatch() {
  let password = $('input[name="password"]').val(),
  passwordRepeat = $('input[name="passwordRepeat"]').val();
  if (password !== passwordRepeat) {
    return false;
  }
  
  return true;
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
  let table, rows, switching, i, x, y, colIndex, shouldSwitch;
  table = $(this).closest("table");
  colIndex = table.find("th").index($(this));
  table = table[0];
  switching = true;
  /*Make a loop that will continue until no switching has been done:*/
  let asc = 0,
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
    let newIndex = div
      .parent("div")
      .find("div")
      .index(div);
    
    let val2 = val.substring(0, val.length - 1);
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
  let token = $(obj).attr("token");
  let file = $(obj).attr("file") ? $(obj).attr("file") : "";
  let tr = $(obj).parent("div")
    ? null
    : $(obj)
        .parent("td")
        .parent("tr");
  let div = tr ? null : $(obj).parent("div");
  let isMulti, input, val;

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

  let name = $(obj).attr("name")
    ? $(obj).attr("name")
    : file.charAt(0) == 'p'? file : "public/" + file.substring(3);

  SwalCustom.fire({
    title: "Are you sure?",
    text: "You will not be able to revert the file deletion!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#445544",
    cancelButtonColor: "#d33d33",
    confirmButtonText: "I understand!" //,
    //reverseButtons: true
  }).then((result) => {
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


//let unique = myArray.filter(isUnique);
//let unique = myArray.filter((v, i, a) => a.indexOf(v) === i);
function checkName(arr, name) {
  for (let i in arr) {
    if (arr[i].toLowerCase() == name.toLowerCase()) return true;
  }

  return false;
}


function getId(val) {
  return !val ? '' :
    val.indexOf("_") != -1? val.substr(val.indexOf("_") + 1) : '';
}


function getIdClear(obj) {
  let id = '_' + getId(obj.attr('id'));
  if(id.length == 1)
    id = '';
  
  return id;
}


function bindAddBid(obj, suppCurr) {//Add product amount in Bid.
  obj.on('click', function() {
    let grid = $('#grid');
    let amount = $('#amount');
    let input = $("#prodServiceInput");
    let MAX = parseInt($(this).attr('MAX'));
    
    if(grid.find('tr').length > MAX) {//One row is extra. The header row.
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'You have reached the limit of ' + MAX + ' products to request from the supplier.'
        });

        return false;
    }

    $('#status').trigger('change');                      

    if(!amount.val() || amount.val() < 1 || !(Number.isInteger(parseFloat(amount.val())))) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Please select a valid amount of products first.'
      });

      return false;
    }
    
    let isProposedPriceHandled = !($('#proposedPrice').length) || $('proposedPrice').val();
    
    if(!input.attr('price'))
      input.attr('price', input.attr('defaultPrice'));//Default price when there is no product and the buyer must invent products not being on the UNITE Catalog.
    //let req = input.val().length;// && $('#price').val().length && $('#currency').val().length;
    if($('#proposedPrice').length && $('proposedPrice').val()) {
      input.attr('price', $('proposedPrice').val());
    }
    
    let option = $(`#productsList option:selected`);
    let suppId = option && option.attr('supplierId')?
      option.attr('supplierId') : null;
    
    const supplierNameInput = (!($('#span.multisupp').length)? $('#supplierName') : $(`span.multisupp[suppId=${suppId}]`).parent('div').find('span.supplierNameListed'));
    let val = supplierNameInput.is('input')? supplierNameInput.val() : supplierNameInput.text();
    
    if(!val || !val.length) {
      val = 'No supplier';
    }

    if(input.val() && input.val().length && isProposedPriceHandled) {
      input.removeClass('errorField');
      let prodVal = input.val();
      let isPresent = false;
      
      if(grid.find('tr').length > 1) {
        grid.find('tr span.product').each(function() {
          let rowId = $(this).closest('tr').attr('id');
          let row = grid.jqGrid("getRowData", rowId);
          
          if((prodVal == $(this).text()) && (row.supplierId? row.supplierId == suppId : 1==1)) {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: `You have already added ${prodVal} to the list` + (row.supplierId? `for the same supplier (${val})` : '') + '. Please refine your selection.'
            });

            isPresent = true;
            return false;
          }
        });

        if(isPresent) {
          return false;
        }
      }
      
      let productId = option && option.attr('productId')?
        option.attr('productId') : null;
      
      let amountVal = parseInt(amount.val());
      let currencyVal = $('select.buyerCurrency').find('option:selected').text();
      let priceVal = input.attr('price');
      let priceUnit = parseFloat(priceVal? priceVal : 1).toFixed(2);
      let addedPrice = parseInt(amountVal? amountVal : 1) * priceUnit;
      let buyerPriceUnit = $('#buyerPriceUnit'), buyerPriceCurr = $('#buyerPriceCurrency');
      let buyerCurrSpan = $('span.bidCurrency').first();
      buyerPriceUnit.text(parseFloat(addedPrice).toFixed(2));
      buyerPriceCurr.text(buyerCurrSpan.text());
      
      let suppCurr = option && option.attr('currency')? option.attr('currency') : $('#supplierCurrency').text();
      let price = parseFloat($('#price').val()? $('#price').val() : 0) + parseFloat(addedPrice);
      let bigPrice = parseFloat(price).toFixed(2);
      $('#price').val(bigPrice);
      $('#sprice').text(bigPrice);

      let imageInput = $('#productImage');
      let imagePath = input.attr('productImage')?
        '../' + input.attr('productImage').substring(7) 
        : imageInput.attr('filePath');

      imageInput
        .attr('filePath', null)
        .attr('value', '');

      let src = imagePath && imagePath.length? imagePath : null;
      let lis = 1 + grid.find('tr').length;

      let data = {
                id: lis,
                name: prodVal,
                price: priceVal + ' ' + currencyVal,
                productId: productId,
                supplierId: suppId,
                supplierCurrency: suppCurr,
                bigPrice: bigPrice,
                maxAmount: (input.attr('maxAmount')? input.attr('maxAmount') : input.attr('defaultMaxAmount')),
                hiddenAmount: parseInt(amountVal),
                hiddenPrice: priceVal,
                hiddenTotalPrice: addedPrice,
                hiddenCurrency: currencyVal,
                productImageSource: src? `<img src="${src}" style="height: 25px; width: 30px" onclick="window.open(this.src)">` : '',
                supplierName: val,
                totalPrice: addedPrice + ' ' + currencyVal
      };

      grid.jqGrid('addRowData', lis, data, 'last');
      let counter = grid.parent('div').next('div').find('span.productsCount');
      let newValue = 1 + parseInt(counter.text()? counter.text() : 0);
      let totalAmount = $('#totalAmount').val()? parseInt($('#totalAmount').val()) : 0;
      counter.text(newValue);
      $('#totalAmount').val(totalAmount + parseInt(amountVal));
      

      bindHandleProduct(grid.find('.rem').last(), input, true, false);
      bindHandleProduct(grid.find('.inc').last(), input, false, true);
      bindHandleProduct(grid.find('.dec').last(), input, false, false);                        
      delegateUpload(grid.find('.uploadImage').last());     

      if(!($('span.multiSupp').length)) {//Single supplier bid.
        let suppPriceUnit = fx.convert(parseFloat(priceVal), {from: buyerCurrSpan.text(), to: suppCurr});
        $('#supplierPriceUnit').text(parseFloat(suppPriceUnit).toFixed(2));
        let supp = fx.convert(parseFloat(bigPrice), {from: buyerCurrSpan.text(), to: suppCurr});
        $('#supplierPrice').text(parseFloat(supp).toFixed(2));
        $('#isupplierPrice').val(parseFloat(supp).toFixed(2));
      } else {//Place Bid MultiSupplier.
        let unitPrice = $(`span.unitPrice[suppId="${suppId}"]`);
        let totalPrice = $(`span.totalPrice[suppId="${suppId}"]`);
        let suppPriceUnit = fx.convert((priceVal), {from: buyerCurrSpan.text(), to: suppCurr});
        let supp = fx.convert((addedPrice), {from: buyerCurrSpan.text(), to: suppCurr});
        unitPrice.text(parseFloat(suppPriceUnit).toFixed(2));
        totalPrice.text(parseFloat(supp).toFixed(2));
      }

      input.val('').attr('productImage', null);
      amount.val(0);
      amount.val('');
    } else {
        Swal.fire({
          icon: 'warning',
          title: 'Attention!',
          text: 'Please enter valid product data (name, price (if required), amount).'
        });

        input.addClass('errorField');
        //$('#prodServiceInput,#price,#currency').addClass('errorField');
    }

    $(this).prop('disabled', true);
  });
}


function initBaseRates(fx, elem, url, token, defaultBidCurrency, cancelChange) {
  if (typeof fx == undefined) 
    return false;

  //EUR default.
  return $.getJSON("https://www.floatrates.com/daily/eur.json")    
    .then((currency) => {
      currency = '[' + JSON.stringify(currency).split('},').join('}},{') + ']';
      currency = JSON.parse(currency);
    
      let t, obj, str = 'fx.rates = {\n';
      fx.base = "EUR";
      obj = [];

      for(const i in currency) {
        t = JSON.stringify(currency[i]);
        obj.push(JSON.parse(t.substring(7, t.length-1)));
      }
 
      obj.sort(function(a, b) {
          return a.code.localeCompare(b.code);
        });

      for(const i in obj) {
        str += obj[i].code + ': ' + obj[i].rate + (i == obj.length-1? '' : ',\n');
      } 

      str += '\n}';
      eval(str);
      getCurrenciesList(elem, url, token, defaultBidCurrency, (typeof cancelChange != 'undefined')? true : false);
      return fx;
  });
}


function bindHandleProduct(obj, prodServiceInput, isRow, isAdd) {
  //Add/remove items, delete entire lines of products.
  const SwalCustom = Swal.mixin({
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: true
  });

  obj.off("click").on("click", function() {
    let tr = $(this)
        .closest('tr');
    
    let divId = $("#jqDiv");
    let gridId = $("#grid");
    let fromBid = !($("#hiddenTotalPrice").length);
    let rowId;
    let bidSuppCurr, bidBigPrice, bidAmount, bidUnitPrice, prodSuppId, bidMaxAmount;
    let index = gridId.find("tr").index(tr);
    let rowid = tr.attr('id');
    
    rowId = gridId.jqGrid("getRowData", rowid);
    bidSuppCurr = rowId.supplierCurrency;
    bidBigPrice = rowId.bigPrice;
    bidAmount = rowId.hiddenAmount;
    bidUnitPrice = rowId.hiddenPrice;
    prodSuppId = rowId.supplierId;
    bidMaxAmount = rowId.maxAmount;

    let counter = divId.prev("div").find("p.term span");
    let entireAmount = parseInt(tr.find(".amount").text());
    
    if (isAdd && entireAmount == bidMaxAmount) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          "The maximum stock of the Supplier for the Product " +
          tr.find(".product").text() +
          " is " +
          entireAmount +
          "."
      });

      return false;
    }

    let handledAmount = isRow? entireAmount : 1;
    let rowPrice = parseFloat(tr.find("span.totalPrice").text()).toFixed(2);
    let unitPrice = parseFloat(tr.find("span.price").text()).toFixed(2);
    let handledPrice = handledAmount * unitPrice;
    let theCurrency = fromBid? gridId.attr("buyerCurrency")
      : tr
          .find("span.currency")
          .first()
          .text();
    
    let supplierCurrency = fromBid? bidSuppCurr : theCurrency;
    let totalPagePrice = fromBid? parseFloat(bidBigPrice).toFixed(2) : parseFloat($("#hiddenTotalPrice").val()).toFixed(2);

    let canContinue = true;
    let localAmount = isAdd? entireAmount + handledAmount
      : entireAmount - handledAmount;
    let localPrice = isAdd? parseFloat(parseFloat(rowPrice) + parseFloat(handledPrice)).toFixed(2)
      : parseFloat(rowPrice - handledPrice).toFixed(2);
    let totalAmountInput = fromBid? $("#totalAmount")  : $("#totalSupplyAmount");
    let newAmount = isAdd? parseInt(totalAmountInput.val()) + handledAmount
      : parseInt(totalAmountInput.val()) - handledAmount;
    let newPrice = isAdd? parseFloat(parseFloat(totalPagePrice) + parseFloat(handledPrice) ).toFixed(2)
      : parseFloat(totalPagePrice - handledPrice).toFixed(2);
    let totalPrice = newPrice + " " + theCurrency,
      addedPrice = localPrice + " " + theCurrency;
 
    if (isRow || (entireAmount == 1 && !isAdd)) {//Row deletion.
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
      }).then((result) => {
        if (result.value) {
          tr.remove();
          let newValue = -1 + parseInt(counter.text());
          counter.text(newValue);          
          gridId.jqGrid("delRowData", rowId);
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          canContinue = false;
        }
      });
    } else {
      gridId.find("tr td:eq(10)").html(parseFloat(newPrice));
      totalAmountInput.val(parseInt(newAmount));
      tr.find("span.amount").text(parseInt(localAmount));
      tr.find("span.totalPrice").text(parseFloat(localPrice).toFixed(2));

      if (!isRow && (entireAmount > 1 || isAdd)) {//No row deletion.
        gridId.jqGrid("setRowData", rowid, {
          hiddenAmount: parseInt(localAmount),
          hiddenTotalPrice: parseFloat(localPrice).toFixed(2),
          bigPrice: parseFloat(newPrice).toFixed(2)
        });
      }
    }

    if (canContinue == false) {
      //Row deletion cancelled, nothing happens.
      return false;
    }

    if (!fromBid) {
      $("#hiddenTotalPrice").val(parseFloat(newPrice));
      $("#totalSupplyPrice").text(totalPrice);
      prodServiceInput.trigger("change");
    } else {
      let span = $('span.bidCurrency').first();
      $("#price").val(parseFloat(newPrice).toFixed(2));
      $("#sprice").text(parseFloat(newPrice).toFixed(2));
      
      if($('span.multiSupp').length) {
        let supplierId = prodSuppId;
        let unitSpan = $(`span.unitPrice[suppId="${supplierId}"]`);
        let totalSpan = $(`span.totalPrice[suppId="${supplierId}"]`);
        let suppUnitVal = parseFloat(fx.convert(unitPrice, {from: span.text(), to: supplierCurrency})).toFixed(2);
        unitSpan.text(suppUnitVal);
        let totalVal = parseFloat(fx.convert(newPrice, {from: span.text(), to: supplierCurrency})).toFixed(2);
        totalSpan.text(totalVal);
      } else {
        let suppUnitVal = fx.convert(unitPrice, {from: span.text(), to: supplierCurrency});
        $("#supplierPriceUnit").text(parseFloat(suppUnitVal).toFixed(2));
        let supp = (fx.convert(parseFloat(newPrice), { from: span.text(), to: supplierCurrency }) );
        $("#supplierPrice").text(parseFloat(supp).toFixed(2));
        $('#isupplierPrice').val(parseFloat(supp).toFixed(2));
      }
      
      gridId.trigger("reloadGrid");
    }
  });
}


function removeAllProducts() {
  //Supplier products.
   const SwalCustom = Swal.mixin({
    customClass: {
      confirmButton: "btn btn-warning",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: true
  });

  SwalCustom.fire({
    title: "Are you sure?",
    html: "<p style='color: teal'>You will not be able to revert the products deletion!<br>Instead, you will have to re-make your list.<br>Please be certain about the removal.</p>",
    icon: "warning",
    showCancelButton: true,
    //confirmButtonColor: "#86fd42",
    //cancelButtonColor: "#00ff00",
    confirmButtonText: "I understand!"
  }).then((result) => {
    if (result.value) {
       const dataIDs = $("#grid").getDataIDs();
  
      for(const ind of dataIDs) {
        $("#grid").jqGrid("delRowData", ind);
      }

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
      $('span.productsCount').text(0);
    }
  });
}


function removeAllItems(index) {
  //Bid items.
   const SwalCustom = Swal.mixin({
    customClass: {
      confirmButton: "btn btn-warning",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: true
  });

  SwalCustom.fire({
    title: "Are you sure?",
    html: "<p style='color: teal'>You will not be able to revert the products deletion!<br>You will need to re-build the list.<br>Please be certain about the removal.</p>",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#840440",
    cancelButtonColor: "#00ff00",
    confirmButtonText: "I understand!"
  }).then((result) => {
     const grid = $("#grid" + index);
     const dataIDs = grid.getDataIDs();

    for(const ind of dataIDs) {
      grid.jqGrid("delRowData", ind);
    }

    $("#hiddenProdServicesList" + index).val("");
    $("#amountList" + index).val("");
    $("#priceList" + index).val("");
    $("#productImagesList" + index).val("");
    $("#productIdsList" + index).val("");
    $("#totalAmount" + index).val("0");
    $('span.productsCount').text(0);

    $("span.hid").each(function() {
      let procSpan = $(this)
        .find("span")
        .first();
      procSpan.text(0);
    });
  });
}


function addition(
  prod,
  prodVal,
  priceVal,
  currencyVal,
  amountVal,
  supplierValExcel,
  imagePath,
  elem,  
  supplierId
) {
  let isPresent = false, isInCatalog = false;
    
  elem.find("span.product").each(function() {
    if ($(this).text() == prodVal) {
      isPresent = true;
      return false;
    }
  });
    
  if($('#catalog').length) {
    $('#catalog').find('span').each(function(ind, elem) {
      if($(elem).text() == prodVal) {
        isInCatalog = true;
        return !isInCatalog;
      }
    });
  }

  if(isPresent || isInCatalog) {
    Swal.fire({
      icon: "error",
      title: "Error!",
      text:
        isPresent? "You have already added " + prodVal + " to the list. Please refine your selection." : `${prodVal} is present in the UNITE Catalog of Products. You can only add new Products to the list.`
    });
  } else {
    let fromBid = !($("#hiddenTotalPrice").length);//Not from Supplier.
    let addedPrice = parseFloat(priceVal * amountVal).toFixed(2);
    let priceInput = fromBid ? $("#price") : $("#totalSupplyPrice");
    let pageCurrency = fromBid? $("#currency").val()
      : $('input[name="currency"]').val();    

    if (!fromBid) {
      $("#hiddenTotalPrice").val(
        parseFloat(
          parseFloat($("#hiddenTotalPrice").val()) + parseFloat(addedPrice)
        ).toFixed(2)
      );
    }

    let buyerPriceVal = fromBid
      ? (priceInput.val()
        ? parseFloat(priceInput.val())
        : 0)
      : null;
    let bigPrice = fromBid
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

    let totalAmountInput = fromBid
      ? $("#totalAmount")
      : $("#totalSupplyAmount");
    
    totalAmountInput.val(parseInt(totalAmountInput.val()) + parseInt(amountVal));
    
    let gridId = $("#grid");
    let divId = $("#jqDiv");
    let src = imagePath && imagePath.length ? imagePath : null;
    let lis = 1 + elem.find('tr').length;
    let sel = fromBid? $('#productsList') : null;
    let opt = sel? sel.find('option:selected') : null;
    let selCurr = $('#selectCurrencies');
    let optCurr = selCurr.find('option:selected');
    let supplierId = fromBid && opt.attr('supplierId')? opt.attr('supplierId') : elem.attr('supplierId')? elem.attr('supplierId') : null;
    let supplierNameInput = (fromBid? (!($('#span.multisupp').length)? $('#supplierName') : $(`span.multisupp[suppId=${supplierId}]`).parent('div').find('span.supplierNameListed')) : $('#supplierName'));
    
    let val = supplierValExcel? supplierValExcel : supplierNameInput.is('input')? supplierNameInput.val() : supplierNameInput.text();
    
    if(!val || !val.length) {
      val = 'No supplier';
    }
 
    let data = {      
      name: prodVal,
      supplierName: val,
      hiddenPrice: priceVal,      
      hiddenTotalPrice: addedPrice,
      hiddenCurrency: currencyVal,
      productImageSource: src? `<img src="${src}" style="height: 25px; width: 30px" onclick="window.open(this.src)">` : "",
      productId: fromBid && opt.attr('productId')? opt.attr('productId') : null,
      supplierId: supplierId,
      maxAmount: fromBid && opt.attr('maxAmount')? opt.attr('maxAmount') : elem.attr('MAX'),
      supplierCurrency: fromBid && opt.attr('supplierCurrency')? opt.attr('supplierCurrency') : elem.attr('supplierCurrency')? elem.attr('supplierCurrency') : (!fromBid && optCurr.text())? optCurr.text() : null,
      hiddenAmount: parseInt(amountVal),
      bigPrice: addedPrice
    };

    gridId.jqGrid("addRowData", lis, data, "last");

    if(!fromBid) {
      $("#totalSupplyPrice").text(bigPrice + " " + currencyVal);
    } else {
      $("#price").val(parseFloat(bigPrice).toFixed(2));
      $("#sprice").text(parseFloat(bigPrice).toFixed(2));
      
      const supp = fx.convert(parseFloat($("#price").val()), {
        from: $('span.bidCurrency')
          .first()
          .text(),
        to: elem.attr("supplierCurrency")
      });
      
      $("#supplierPrice").text(parseFloat(supp).toFixed(2));
      $("#isupplierPrice").val(parseFloat(supp).toFixed(2));
    }

    let counter = divId.prev("div").find("p.term span");
    const newValue = 1 + parseInt(counter.text());
    counter.text(newValue);

    bindHandleProduct(
      gridId.find(".rem").last(),
      prod,
      true,
      false
    );
    bindHandleProduct(
      gridId.find(".inc").last(),
      prod,
      false,
      true
    );
    bindHandleProduct(
      gridId.find(".dec").last(),
      prod,
      false,
      false
    );
    
    delegateUpload(gridId.find(".uploadImage").last());
  }
}

function addProduct(obj) {
  obj.on("click", function() {
    let elem = $("#grid");
    let MAX = $("#grid").attr("MAX");

    if (elem.find("tr").length > MAX) {
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "You have reached the limit of " + MAX + " products to add."
      });
      return false;
    }

    let input = $("#prodServiceInput");
    let req =
      input.val().length &&
      $("#price").val().length &&
      $("#amount").val().length &&
      $("#price").val() > 0 &&
      $("#amount").val() > 0 &&
      Number.isInteger(parseFloat($("#amount").val()));
    let imagePath = $("input.productimageupload").attr("filePath");

    if(req) {
      $("#prodServiceInput,#price,#currency").removeClass("errorField");
      addition(
        input,
        input.val(),
        $("#price").val(),
        $("#currency").val(),
        $("#amount").val(),
        null,
        imagePath,
        elem,
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
      
      $("#prodServiceInput,#price,#amount").addClass("errorField");
    }
  });
}

function userInputs(id, role, avatar, name, type, ul) {
  //Home, About, Terms, Antibribery - ensure link to user's profile if they are logged into session.
  let link = "";

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

    let str = "";
    str +=
      '<li class="nav-item logout">' +
      '<a class="btn btn-danger admin" marg="240" style="margin-top: -240px;" href="?exit=true&home=true" title="Clear user session/Logout">Logout</a>' +
      "</li>";

    ul.append(str);
    $(".signup").hide();
  }
}

function getCancelReasonTitles(obj, token, url, objectType, isAdmin, isSupervisor) {
  //For deleting user accounts and cancelling bids. Types (titles) of reasons, expressed as radio buttons, should be chosen.
  $.ajax({
    url: url,
    type: "POST",
    headers: { "X-CSRF-Token": token },
    datatype: "application/json",
    data: {
      objectType: objectType,
      isAdmin: isAdmin,
      isSupervisor: isSupervisor
    },
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

      let str = '<div class="form-group">';
      str += "<label>Please select an option below and explain it.</label><br>";
      for (let i in data) {
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

      let str = '<div class="form-group">';
      str +=
        "<label>Please select an option below and explain it*.</label><br>";
      str += '<select id="subjects"><option></option>';
      for (let i in data) {
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

      let str = "";
      for (let i in data) {
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
  let http = new XMLHttpRequest();
  http.open("HEAD", image_url, false);
  http.send();
  return http.status != 404;
}

function validCountry(obj) {
  let inputs = [];
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
  let nextLi = $("li.last").next("li");
  $("li.last").removeClass("last");
  nextLi.addClass("last");
  return 30;
}

function supplierValidateFields(fx) {
  if ($("#grid tr").length == 1) {
    let obj =
      '<p class="productRequired littleNote">You are required to include at least one product or service.</p>';
    $(obj).insertBefore($(this));
    return false;
  }

  if(!validCountry($(".country"))) {
    return false;
  }

  $("input.autocomp")
    .not(".country")
    .each(function() {
      let cls = !$(this).hasClass("present") && !$(this).hasClass("changed");
      $(this)
        .next("input")
        .val(cls ? "canSave" : "");
    });

  $("#hiddenTotalAmount").val(parseInt($("#totalSupplyAmount").val()));
  $("#hiddenTotalPrice").val($("#totalSupplyPrice").text());

  let arr = [],
    arr1 = [],
    arr2 = [],
    arr3 = [],
    arr4 = [];

  $("#grid tr")
    .not(":first")
    .each(function(index, el) {
      let product = $(this).find("span.product"),
        price = $(this).find("span.price"),
        currency = $(this).find("span.currency").first(),
        quantity = $(this).find("span.amount"),
        productImageSpan = $(this).find("span.productImage");
      let src = productImageSpan.find("img").length
        ? productImageSpan.find("img").attr("src")
        : null;

      arr.push(product.text());
      arr1.push(parseFloat(price.text()).toFixed(2));
      arr2.push(currency.text());
      arr3.push(quantity.text());
      arr4.push(src ? "public/" + src.substring(3) : "");
    });

  let preferred = $("select.currency")
    .find("option:selected")
    .text();
  
  let isChanged = false;
  $("span.currency").each(function(ind, elem) {
    let curr = $(this).text();

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
      
      if(!checkMatch()) {
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
    let uploadInput, index;
    let divId = $("#jqDiv");
    let tr = $(this).closest("tr");//parent('span').parent('td').parent('tr');
    let table = $("#grid"); //parent('tbody').parent('table');
    let div = divId.prev("div");
    index = table.find("tr").index(tr);
    uploadInput = $('#productImage');
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
    iconSet: "jqueryUI",
    idPrefix: "gb1_",
    datatype: "local",
    viewrecords: true,
    gridview: true,
    altRows: true,
    pager: pagerId,
    rowNum: 30,
    //scroll: 1,
    shrinkToFit: true,
    loadonce: true,
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
      let divId = $(`${gridId}`).parent("div");
      let table = divId.find("table").first();
      if (token) {
        table.find(".downloadFile,.deleteFile").attr("token", token);
        table
          .find(".downloadFile > a,.deleteFile")
          .css({ cursor: "pointer", color: "teal", "font-weight": "bold" });

        table
          .find(".deleteFile")
          .off("click")
          .on("click", function() {
            removeFile(this, Swal);
          });
      } else if(table.find(".rem").length) {
        let prod = $("#prodServiceInput");
        bindHandleProduct(table.find(".rem"), prod, true, false);
        bindHandleProduct(table.find(".inc"), prod, false, true);
        bindHandleProduct(table.find(".dec"), prod, false, false);
        delegateUpload(table.find(".uploadImage"));
      }
    },
    gridComplete: function() {
      
    },
    onSelectRow : function(id) { 
      let ids = $(`${gridId}`).jqGrid("getGridParam", "selarrrow");
      if($('#bidOnProds').length) {
        $('#bidOnProds').prop('disabled', ids.length? false : true);
      }
    },
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
        title: "Error - Not found!",
        timer: 1500,
        text: "Your file, " + absolutePath + ", was not found.",
        icon: "error"
      });
    },
    success: function(data) {
      if (!data || !data.exists) {
        Swal.fire({
          title: "Not found!",
          timer: 1500,
          text: "Your file, " + absolutePath + ", was not found. Please upload another valid file.",
          icon: "error"
        });
        return false;
      }

      let displayName = fileId.substring(fileId.lastIndexOf("/") + 1);
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
  val = "../" + response.path.substring(7);
  
  if(input.hasClass('multiparam')) {
    val = '../../../' + val;
  }
  
  input.attr("value", val);
  let file = response.path;// ? response.path : response.file.id;
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
  let sel = obj.parent("div").find("select");
  let val = obj.val();
  obj.removeClass("present");
  let isPresent = false;

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


function hasExtension(file, vec) {
  let ext = file.name.substring(file.name.lastIndexOf('.'));
  
  for(const i of vec) {
    
    if(ext === i) {
      return true;
    }  
  
  if(i > ext)
    return false;
  }
  
  return false;  
}


function verifyDocument(file, limit, vec) {
  if(file.size > limit) {
    Swal.fire({
      icon: 'error',
      title: 'Size Error!',
      html: `<p style='color: navy'>File too large!<br>Selected file ${file.name} is ${file.size} bytes large.<br>Please upload a file with a maximum size of ${limit} bytes.<p>`
    });
    
    return false;    
  }
  
  vec.sort();
  
  if(!hasExtension(file, vec)) {
    Swal.fire({
      icon: 'error',
      title: 'Extension Error!',
      html: `<p style='color: navy'>File name ${file.name} not suitable!<br>Please upload a file whose extension matches [${vec}].<p>`
    });
    
    return false;
  }
  
  return true;
}


$(document).ready(function() {
  let cnt = $("div.container").first();

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

  let nav = $("body").find("nav");
  if (nav.length && nav.next("div").hasClass("home")) {
    let $str =
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
    let ul = $("#navbarSupportedContent").find("ul");

    $(
      '<li class="nav-item"><a class="nav-link" href="/feedback" title="Feedback/Suggestions">User Feedback</a></li>'
    ).insertAfter("li.last");

    let isAdmin = nav.find('input[id="userData"]').attr("isAdmin");
    let bigScreen = window.matchMedia("(min-width: 900px)");
    let marg = bigScreen.matches ? 0 : 180;

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

    let ind = parseInt(nav.attr("pos"));

    if (
      ul
        .find("li")
        .first()
        .hasClass("user")
    ) {
      ind++;
    }

    let li = ul.find("li").eq(ind);
    li.addClass("active");
    let text = li.find("a").text();
  } else {
    if (nav.length && !nav.hasClass("noMenu")) {
      let user = nav.attr("user");
      let bigScreen = window.matchMedia("(min-width: 900px)");
      let offset = user == "supplier" ? 112 : user == "buyer" ? 80 : 40;
      let profilePx = parseInt(offset + 32),
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

      let str =
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
        let ind = parseInt(nav.attr("pos")),
          ul = $("#navbarSupportedContent").find("ul");
        let li = ul.find("li").eq(ind);
        li.addClass("active");
        let text = li.find("a").text();
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
    let val = $(this).val();
    let opt = $(this).find('option:selected');
    
    if(!val || !(val.length) || !opt || !(opt.length) 
      || !opt.text() || (opt.text().toLowerCase().includes('no results found'))
      ) {
      return false;
    }
    
    val = opt.text();
    $('input[name="currency"]').val(val);
    $("#currency").val(val);    
    $('#prodServices,#grid').attr('supplierCurrency', val);

    //Re-make the list of products accordingly, with the new currency.
    if (!$("#prodServices").length) 
      return false;
    
    const dataIDs = $("#grid").getDataIDs();
  
    for(const ind of dataIDs) {
      let row = $("#grid").jqGrid('getRowData', ind);
      let currentCurr = row.hiddenCurrency;      
      let newPrice = fx.convert(parseFloat(row.hiddenPrice), { from: currentCurr, to: val });
      const newTotalPrice = fx.convert(parseFloat(row.hiddenTotalPrice), { from: currentCurr, to: val });
      const newBigPrice = fx.convert(parseFloat(row.bigPrice), { from: currentCurr, to: val });
      let tr = $("#grid").find(`tr[id="${ind}"]`);
          
      tr.attr('price', parseFloat(newTotalPrice).toFixed(2));
      tr.attr('totalPrice', parseFloat(newBigPrice).toFixed(2));
      tr.find('span.price').text(parseFloat(newPrice).toFixed(2));
      tr.find('span.currency').text(val);
      
      $("#grid").jqGrid("setRowData", ind, {
       hiddenPrice: parseFloat(newPrice).toFixed(2),
       hiddenTotalPrice: parseFloat(newTotalPrice).toFixed(2),
       bigPrice: parseFloat(newBigPrice).toFixed(2),
       hiddenCurrency: val
      });
    }
    
    $("#grid").trigger('reloadGrid');
    
    if(!$(this).hasClass('initial')) {
          $(this).addClass('initial');
          $('#updateProfile').prop('disabled', true);
        };    
  });
  
  if($('.prefDate').length) {
    $('.prefDate:not([readonly="readonly"])').datepicker();
  }

  $("select.autocomp")
    .prepend('<option class="first" value=""></option>')
    .css({ width: "100%" })
    .find("option.first")
    .prop("selected", true);
  
  $("select.autocomp").each(function(index, element) {
    var div = $(element).parent('div').parent('div');
    if(div.hasClass('totals')) {
      $(element).css('width', '28%');
    }    
  });
  
  
  $('.otherSuppliers').on('change', function() {    
    let id = getIdClear($(this));
    let idsList = $('#bidSupplierList'+id);    
    let opt = $(this).find('option:selected');
    let div = $(this).parent('div').next('div');
    if(!(div.find('span').length)) {
      div.append('<p class="additional-suppliers">Additional suppliers chosen for bid:</p>');
    }
    
    div.append(`<span>${opt.text()}</span><br>`);
    
    if(opt.text().length) {
      idsList.val(idsList.val() + `,${opt.attr('id')}`);
      opt.prop('disabled', true);
    }
  });
  
  $('.openBid').on('click', function(e) {
    e.preventDefault();
    
    let id = getIdClear($(this));
    let idsList = $('#bidSupplierList'+id);    
    let values = idsList.val().split(',');
    idsList.val(values);
    $(this).parent('div').parent('form').submit();
    /*
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-warning'
      },
      buttonsStyling: false
    })
//if(1==2)
    swalWithBootstrapButtons.fire({
      title: 'Allow Multiple Suppliers',
      text: "Do you want your new Bid Request to be deliverable to multiple Suppliers?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No',
      reverseButtons: false
    }).then((result) => {
      let multiple = $(this).parent('div').find('input[name="allowMultiple"]');
     
      if (result.value) {        
        multiple.val(true);
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        multiple.val(false);
      }
      
      $(this).parent('div').parent('form').submit();
    });*/
  });

  $("select.autocomp").on("change", function() {
    let input = $(this)
      .parent("div")
      .find("input.form-control");
    
    input.val($(this).val());
    input.trigger('change');
    
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
  
  if($('button.cancel').length) {
    $('button.cancel').on('click', function(e) {
      e.preventDefault();
      
      Swal.fire({
        title: '<strong>Cancel Bid Request Creation</strong>',
        icon: 'warning',
        html:
          'Are you sure you want to cancel the Bid you are creating?',
        showCloseButton: true,
        showCancelButton: true,
        focusConfirm: false,
        confirmButtonText:
          '<i class="fa fa-thumbs-up"></i> Yes',
        confirmButtonAriaLabel: 'Thumbs up!',
        cancelButtonText:
          '<i class="fa fa-thumbs-down"></i> No',
        cancelButtonAriaLabel: 'Thumbs down'
      }).then((result) => {
        if(result.value) {
          if($('button.close').length) {//index.ejs
            $('#close_'+$(this).attr('index')).trigger('click');
          } else {//placeBid.ejs
            let str = '<a href="/buyer"><span id="cancelBid"></span></a>';
            $(str).insertAfter($(this));
            $('#cancelBid').trigger('click');
          }
        } else {
          return false;
        }
      });
    });
  }
  
  
  if($('button.placeBid').length) {//Placing a bid from Buyer Index or PlaceBid.    
      $('button.placeBid').on('click', function() {        
        let elem = $('#grid');
        
        if(!(elem) || !(elem.find('tr:not(:first)').length)) {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            //timer: 2000,
            text: 'You must choose at least one product from your Supplier\'s offer before placing the Order.'
          });
          
          return false;
        }
       
        let prodInput = $("#hiddenProdServicesList");
        let amountInput = $("#amountList");
        let priceInput = $("#priceList"), priceOrigInput = $("#priceOriginalList");
        let prodImageInput = $("#productImagesList");
        let prodIdInput = $("#productIdsList");
        
        let arr = [], arr1 = [], arr2 = [], arr3 = [], arr4 = [], arr5 = [], arr6 = [], arr7 = [], arr8 = [];;
        let totalPriceOriginal = 0, totalPriceConverted = 0;
        let origCurrency = $(elem).attr('buyerCurrency');  
        $('#currency').val(origCurrency);
        $('#scurrency').text(origCurrency);

        elem.find('tr').not(':first').each(function(ind, element) {          
          let trId =  $(element).attr('id');
          let row = elem.jqGrid('getRowData', trId);
          let suppCurrency = row.supplierCurrency;
          
          arr.push($(element).find('span.product').text());
          arr1.push(parseInt(row.hiddenAmount));
          let originalPrice = parseFloat($(element).find('span.totalPrice').text()).toFixed(2);
          let val = fx.convert(originalPrice, {from: origCurrency, to: suppCurrency});
          arr2.push(parseFloat(val).toFixed(2));
          arr4.push(originalPrice);
          
          totalPriceOriginal += parseFloat(originalPrice);
          totalPriceConverted += parseFloat(val).toFixed(2);
          let img = $(element).find('span.productImage img');
          let src = img && img.length? 'public/' + img.attr('src').substring(3) : '';
          arr3.push(src);
          arr8.push(row.productId? row.productId : '');
          
          if($('#supplierIdsList').length) {//PlaceBid Multi Supplier.
            arr5.push(row.supplierId);
            arr7.push(suppCurrency);            
          }
        });
        
        prodInput.val(arr);
        amountInput.val(arr1);
        priceInput.val(arr2);
        prodImageInput.val(arr3);
        priceOrigInput.val(arr4);
        prodIdInput.val(arr8);//To replace all the arrays with an object similar to the Product model, saved within the Bid Request model. These objects can later be used for future user suggestions in Bid Requests.
        
        if(arr5.length) {
          $('#supplierIdsList').val(arr5);
          $('#supplierCurrenciesListProd').val(arr7);
          
          elem.find('span.totalPrice').each(function(index, element) {
            arr6.push(parseFloat($(element).text()).toFixed(2));
          });
          
          $('#supplierTotalPricesList').val(arr6);
        }
        
        $('#price').val(parseFloat(totalPriceOriginal).toFixed(2));
        $('#sprice').text(parseFloat(totalPriceOriginal).toFixed(2));
        
        if($('#supplierPrice').length) 
          $('#supplierPrice').text(parseFloat(totalPriceConverted).toFixed(2));
          $('#isupplierPrice').val(parseFloat(totalPriceConverted).toFixed(2));
      });   
    
    
      $('#proposedPrice').on('change', function() {
        $('#prodServiceInput')
          .attr('price', $(this).val())
          .trigger('change');
      });
    
    
      $('#prodServiceInput').on('change', function() {
        if($(this).val()) {
          let amount = $('#amount').val();
          
          if(amount && amount > 0) {
            $("#addProdService").prop('disabled', false);
            let price = $(this).attr('price')? parseFloat($(this).attr('price')) : 1;
            price *= parseInt($('#amount').val());
            $('#buyerPriceUnit').text(parseFloat(price).toFixed(2));
            let supplierCurrency = $('#supplierCurrency').text();
            let suppPrice = fx.convert(price, { from: $('span.bidCurrency').first().text(), to: supplierCurrency });
            $('#supplierPriceUnit').text(parseFloat(suppPrice).toFixed(2));
          }
        }
      });
    
      
      $('input.amountInput').inputFilter(function(value) {
        return /^\d*$/.test(value);
      });
    

      $('input.amountInput').off('change').on('change', function() {
        let validValues = $(this).val() > 0 && ($('#prodServiceInput').val());
        $("#addProdService").prop('disabled', validValues? false : true);
        
        if(validValues) {
          let price = $("#prodServiceInput").attr('price')? parseFloat($("#prodServiceInput").attr('price')) : 1;
          price *= parseInt($(this).val());
          let maxAmount = parseInt($("#prodServiceInput").attr('maxAmount'));

          if(maxAmount && parseInt($(this).val()) > maxAmount) {
            Swal.fire({
              icon: 'error',
              title: 'Error!',
              text: 'You have reached the limit of ' + maxAmount + ' samples of this product. Supplier\'s stock is not enough.'
            });

            return false;
          }

          $('#buyerPriceUnit').text(parseFloat(price).toFixed(2)); 
          let supplierCurrency = $('#supplierCurrency').text();
          let suppPrice = fx.convert(price, {from: $('span.bidCurrency').first().text(), to: supplierCurrency});
          $('#supplierPriceUnit').text(parseFloat(suppPrice).toFixed(2));
        }
      });
    
      $('select.productsList').on('change', function() {
        let opt = $(this).find('option:selected');
        
        if(!opt || !opt.text() || !opt.text().length 
           || (opt.text().toLowerCase().includes('no results found'))
           || !$(this).val() || !$(this).val().length) {
          return false;
        }
        
        let name = $(this).val();        
        $('span.hid').first().parent('div').find('span.productName').text(opt.text());
        
        if($('.multiSupp').length) { 
          $(`span.unitPrice[suppId="${opt.attr('supplierId')}"]`).parent('div').find('.productName').text(opt.text());
        } else {
          $('span.hid').eq(2).parent('div').find('span.productName').text(opt.text());
        }
        
        let price = opt.attr('price');
        let isSingle = $("#prodServiceInput").length > 0;
        if(isSingle) {
          $("#prodServiceInput").attr('price', price);
        }
        
        let totalPrice = opt.attr('totalPrice');
        let currency = opt.attr('currency');
        
        if(isSingle) {
          $('#prodServices').attr('supplierCurrency', currency);          
        }
        
        let maxAmount = opt.attr('maxAmount');      
        let bidCurrency = $('select.buyerCurrency')
          .find('option:selected')
          .text();
     
        if(isSingle) {
          $('#prodServiceInput')
            .val(opt.text());
       
          $('#addProdService').removeAttr('disabled');
        }
        
         if(!($(this).hasClass('init'))) {
          if(bidCurrency != currency && !($(this).hasClass('multiplex'))) {
            Swal.fire({
              icon: 'warning',
              title: 'Warning',
              timer: 2000,
              html: "The currency of your order is different from the Supplier's.<br>Yours is " + bidCurrency + ', theirs is ' + currency  + '.<br>Please note that conversion rates will be applied.'
            });
          }
         } else {
           $(this).removeClass('init');           
         }
       
        let val = fx.convert(parseFloat(price), {from: currency, to: bidCurrency});
        let input = $(this).parent('div').next('div').find('.prodInput');       
        input.attr({'price': val, 'maxAmount': maxAmount});
        input.val(name);
        input.trigger('change');
      });
    

      $('select.buyerCurrency').on('change', function() {
        let curr = $(this).find('option:selected').text();
        
        if(!curr || !curr.length || (curr.toLowerCase().includes('no results found'))) {
          return false;  
        }
    
        let grid = $("#grid");
        grid.attr('buyerCurrency', curr);
        $('#currency').val(curr);
        $('#scurrency').text(curr);
        
        if(!$(this).hasClass('initial')) {
          $(this).addClass('initial');
          $('#updateProfile').prop('disabled', true);
        };
        
        let suppCurrency = grid.attr('supplierCurrency')? grid.attr('supplierCurrency') : null; 
        if(!($(this).hasClass('multiplex')) && suppCurrency && curr && curr != suppCurrency) {
          Swal.fire({
            icon: 'warning',
            title: 'Warning',
            timer: 2000,
            html: 'The currency of your order is different from the Supplier\'s.<br>Yours is ' + curr + ', theirs is ' + suppCurrency  + '.<br>Please note that conversion rates will be applied.'
          });
        }
        
        let priceInput = $('#price');
        let oldBidCurrencySpan = $('span.bidCurrency').first();
       
        if(curr && oldBidCurrencySpan.text() && oldBidCurrencySpan.text().length && priceInput.val().length) {
          let val = fx.convert(parseFloat(priceInput.val()).toFixed(2), {from: oldBidCurrencySpan.text(), to: curr});
          priceInput.val(parseFloat(val).toFixed(2));
          $('#sprice').text(parseFloat(val).toFixed(2));
        }
       
        $('span.bidCurrency').each(function(i, el) {
          $(el).text(curr);
        });
        
        let buyerPriceUnit = $('#buyerPriceUnit'), buyerPriceCurr = $('#buyerCurrencyUnit');
        
        if(buyerPriceUnit.text() != null && buyerPriceUnit.text().length && buyerPriceUnit.text() != '0') {
          let newPriceUnit = fx.convert(parseFloat(buyerPriceUnit.text()), {from: buyerPriceCurr.text(), to: curr});
          buyerPriceUnit.text(parseFloat(newPriceUnit).toFixed(2));
        }
      
        buyerPriceCurr.text(curr);
        const dataIDs = grid.getDataIDs();

        for(const ind of dataIDs) {
          let row = grid.jqGrid('getRowData', ind);
          let currentCurr = row.hiddenCurrency;
          let newPrice = fx.convert(parseFloat(row.hiddenPrice), { from: currentCurr, to: curr });
          let newTotalPrice = fx.convert(parseFloat(row.hiddenTotalPrice), { from: currentCurr, to: curr });
          let newBigPrice = fx.convert(parseFloat(row.bigPrice), { from: currentCurr, to: curr });
          let tr = grid.find(`tr[id="${ind}"]`);
          
          tr.attr('price', parseFloat(newTotalPrice).toFixed(2));
          tr.attr('totalPrice', parseFloat(newBigPrice).toFixed(2));
          tr.find('span.price').text(parseFloat(newPrice).toFixed(2));
          tr.find('span.currency').text(curr);

          grid.jqGrid("setRowData", ind, {
            hiddenPrice: parseFloat(newPrice).toFixed(2),
            hiddenTotalPrice: parseFloat(newTotalPrice).toFixed(2),
            bigPrice: parseFloat(newBigPrice).toFixed(2),
            hiddenCurrency: curr
          });
        }
        
        grid.trigger('reloadGrid');
      });
  }
    
  $('input[readonly].textarea[readonly]').css('background-color', 'lightgray');//No names on spans. Also, disabled inputs means no readability for back-end.  
  
  $('input.cb').on('change', function() {
        let len = $('.cb:checked').length;
        let button = $('#updateProfile').length? $('#updateProfile') : $('#register');
        button.prop('disabled', (len == 2? false : true));
  });
  

  if (!$("input.upload").length) 
    return false;

  let token = $("input[name='_csrf']:first").val();

  $("input.upload").on("change", function() {
    let nextInput = $(this).next("input");
    $(this).attr("fromOutside") != null
      ? nextInput.trigger("click")
      : nextInput.prop("disabled", $(this).val() ? false : true);
  });

  $(".single,.multiple").each(function(index, element) {
    let input = $(this).prev("input");
    let prevInput = input.prev("input");
    let val = input.attr("value"),
      fileId = prevInput && prevInput.length ? prevInput.val() : null;
    let theDiv = $(this).parent("div");
    input.attr("value", fileId);
    val = fileId;

    if (fileId && fileId.length) {
      let isMulti = false;

      if (val.charAt(val.length - 1) == ",") {
        let newVal = val.substring(0, val.length - 1);
        if (newVal.indexOf(",") != -1) {
          isMulti = true;
          val = newVal.split(",");
          newVal = fileId.substring(0, fileId.length - 1);
          fileId = newVal.split(",");
        }
      }

      if (isMulti) {
        let ob = '<div class="fileWrapper">';
        for (let i in val) {
          if(fileId[i] && fileId[i].length)
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
        let ob = "";
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
    const input = $(this).prev("input");
    const isExcel = input.hasClass("fileexcelupload") ? true : false;
    const isProduct = input.hasClass("productimageupload") ? true : false;
    const isAvatar = input.hasClass("avatarupload") ? true : false;
    const isMultiple = $(this).hasClass("multiple");
    const fileSizeLimit = parseInt($('#uploadSize').val());
    
    const extArray = isExcel? [".xls", ".xlsx"] 
      : (isProduct || isAvatar)? ['.png', '.jpg', '.jpeg', '.bmp', '.csv', '.gif'] 
      : [".png", ".jpg", ".jpeg", ".gif", ".bmp", '.csv', ".pdf", ".txt", ".doc", ".docx", ".rtf", '.xls', '.xlsx', '.ppt', '.pptx'];
    
    let isValidFile = true;
    
    if(isMultiple) {
      for(const i of input[0].files) {
        if(!verifyDocument(i, fileSizeLimit, extArray))
          return false;
      }
    } else {
      if(!verifyDocument(input[0].files[0], fileSizeLimit, extArray))
      return false;
    }
    
    let formData = new FormData();
    formData.append("_csrf", token);
    formData.append("upload_file", true);
    
    if (isMultiple == false) {
      formData.append("single", input[0].files[0]);
    } else {
      $.each(input[0].files, function(i, file) {
        formData.append("multiple", file);
      });
    }

    let theUrl = isAvatar
      ? "/avatarUpload"
      : isMultiple == true
      ? "/uploadMultiple"
      : isProduct == true
      ? "/uploadProductImage"
      : isExcel
      ? "/uploadExcel"
      : "/uploadFile"; //uploadmultiple versus uploadfile.

    let xhr = new XMLHttpRequest();
    xhr.open("POST", theUrl, true);
    xhr.setRequestHeader("X-CSRF-TOKEN", token);
    xhr.onload = function(e) {};

    xhr.send(formData);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        //Success!
        input.next("input").prop("disabled", true);
        let prevInput = input.prev("input");
        let ob,
          val,
          response = isAvatar ? xhr.responseText : JSON.parse(xhr.responseText);
        let theDiv = input.parent("div");

        if (isAvatar) {
          let src = "../" + response.substring(7);
          $('input[name="avatar"]').val(src); //'../../../'+response
          $(
            `<div><img src="${src}" alt="avatar" style="width: 60px; height: 60px"  onclick="window.open(this.src)"><br><span token="${token}" file="${response}" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ${src} file">Remove</span></div>`
          ).insertAfter(input);
          //let loc = window.location.pathname;
          //let dir = loc.substring(0, loc.lastIndexOf('/'));
        } else if (isProduct) {
          //Supplier Profile/Sign-up pages; Add Product page.
          let res = "../" + response.path.substring(7);
          if(input.hasClass('multiparam')) {
              res = '../../../' + res;
            }

          input.attr("filePath", res);
          if (input.hasClass("separated")) {
            //The separated Add Product Page.
            $("#productImage").attr('value', response.path);
          }

          if (input.attr("fromOutside") != null) {
            let index = input.attr("fromOutside");
            let div = input.parent("div");           
            let table = $('#grid');
            
            let tr = table.find("tbody tr").eq(index);
            let span = tr.find("span.productImage");
            let img = span.find("img");           
            
            table.jqGrid('setRowData', tr.attr('id'), {
              productImageSource : res
            });
            
            if(img != null && img.attr("src") != null) {
              img.attr("src", res);
            } else {
              let str = `<img src="${res}" style="height: 25px; width: 30px" onclick="window.open(this.src)">`;
              span.append(str);
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
        } else if(isExcel) {
          let div = input.parent('div').parent('div');
          let el = $('#grid');
          let productInput = $("#prodServiceInput");
          let MAX = el.attr("MAX");

          if (Array.isArray(response) && response.length == 4) {
            for (let i in response) {
              //Each Supplier product should come here.
              if (i < 1) continue;
              let elem = response[i];//Name, price, currency, amount, maybe Supplier Name.

              if (el.find("tr").length > MAX) {
                Swal.fire({
                  icon: "error",
                  title: "Error!",
                  text:
                    "You have reached the limit of " + MAX + " products to add."
                });
                return false;
              }// placeBid isMulti
              
              let prodList = div.find('select.productsList');
              let suppId = prodList.attr('supplierId')? prodList.attr('supplierId') : null;
              addition(productInput, elem[0], elem[1], elem[2], elem[3], elem[4]? elem[4] : null, null, el, suppId);
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
          let hasDiv = theDiv.next("div").hasClass("fileWrapper");
          ob = hasDiv ? "" : '<div class="fileWrapper">';
          
          for (let i in response) {
            let absolutePath = response[i].path
              ? "../" + response[i].path.substring(7)
              : response[i].file.originalname;
            
            val = !(input.attr("value") && input.attr("value").length)
              ? absolutePath + ""
              : input.attr("value") + absolutePath + "";
            
            input.attr("value", val);
            let file = response[i].path
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
              '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' + absolutePath + ' file">Remove</span></div>';
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
      } else if(xhr.responseText.length > 320) {
        Swal.fire({
          icon: 'error',
          title: 'Upload Error!',
          text: xhr.responseText
        });
      }
    };

    e.preventDefault();
  });
});