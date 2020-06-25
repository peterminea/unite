var autocomp = function(obj, data, enter) {//Not suitable for modals.
  $('ul.ui-autocomplete').not('div.container *').each(function(i, e) {                
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
  });
}


function sortTable() {//Ascending or descending. Each <th> column tag is involved.
  var table, rows, switching, i, x, y, colIndex, shouldSwitch;
  table = $(this).closest('table');  
  colIndex = table.find('th').index($(this));  
  table = table[0];
  switching = true;
  /*Make a loop that will continue until no switching has been done:*/
  var asc = 0;
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
      if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
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
        
        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {          
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


function treatDiv(div, isMulti, val, input) {
    if(isMulti) {
      var newIndex = div.parent('div').find('div').index(div);
      //alert(div.parent('div').length + ' ' + newIndex + ' ' + div.parent('div').hasClass('fileWrapper'));
      var val2 = val.substring(0, val.length-1);
      val2 = val2.split(',');      
      val2.splice(newIndex, 1);      
      input.attr('value', (val2 && val2.length)? val2.toString() + ',' : '');
      
      if(!val2 || !val2.length)
        input.val('');;
    } else {
      input.attr('value', '');
      input.val('');
    }
  
  input.trigger('change');//Enable Profile button!
  div.remove();
}


function removeFile(obj, Swal) {//remove from Glitch 
  var token = $(obj).attr('token');
  var file = $(obj).attr('file');  
  var div = $(obj).parent('div');
  var isMulti = div.parent('div').hasClass('fileWrapper');
  
  var input = isMulti? 
      div.parent('div').prev('div').find('.fileupload') : div.prev('div').find('.fileupload');
  var val = input.attr('value');
  
  const SwalCustom = Swal.mixin({
    customClass: {
      confirmButton: 'btn btn-success',
      cancelButton: 'btn btn-danger'
    },
    buttonsStyling: true
  });
  
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
        data: {file: 'public/' + file.substring(3)},
        datatype: 'application/json',
        error: function() {
          //alert('Error on AJAX Request!');
          treatDiv(div, isMulti, val, input);
          SwalCustom.fire({
            title: 'Deleted!',
            text: 'The file has been deleted.',
            icon: 'success'
          });
        },
        success: function(data) {
          treatDiv(div, isMulti, val, input);
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


function deleteFile(obj) {//remove from Database
  var token = $(obj).attr('token');
  var file = $(obj).attr('file');  
  var div = $(obj).parent('div');
  var isMulti = div.parent('div').hasClass('fileWrapper');
  
  var input = isMulti? 
      div.parent('div').prev('div').find('.fileupload') : div.prev('div').find('.fileupload');
  var val = input.attr('value');
  //var isMulti = val.charAt(val.length-1) == ','? true : false;
  
  $.ajax({
    url: '/files/'+file,
    type: 'DELETE',
    headers: { "X-CSRF-Token": token },
    data: {_method: 'delete'},
    datatype: 'application/json',
    error: function() {
      //alert('Error on AJAX Request!');
      treatDiv(div, isMulti, val, input);
    },
    success: function(data) {
      treatDiv(div, isMulti, val, input);
      //alert('File removed!');
    }
  });
}


function downloadFile(obj) {//remove from Database
  var token = $(obj).attr('token');
  var file = $(obj).attr('file');
  var div = $(obj).parent('div');
  var isMulti = div.parent('div').hasClass('fileWrapper');
  
  var input = isMulti? 
      div.parent('div').prev('div').find('.fileupload') : div.prev('div').find('.fileupload');
  var val = input.attr('value');
  
  $.ajax({
    url: '/download/'+file,
    type: 'GET',
    headers: { "X-CSRF-Token": token },
    //data: {_method: 'delete'},
    datatype: 'application/json',
    error: function() {
      //alert('Error on AJAX Request!');
      //treatDiv(div, isMulti, val, input);
    },
    success: function(data) {
      //treatDiv(div, isMulti, val, input);
      //alert('File removed!');
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
  return val.substr(val.indexOf('_')+1);
}


function getAutocomplete(elem, url, token, isEnter) {
  $('' + elem + '').autocomplete({
    source: function(req, res) {
      var obj = $(this.element);

      $.ajax({
        url: url,
        headers: { "X-CSRF-Token": token },
        datatype: 'jsonp',
        type: "GET",
        data: req,
        success: function(data) {
        if(!data || !data.length) {//Recommended to disable it for a better user experience. We can add our items as well.
            //obj.val('');
            //return false;
          }
          res(data);
          autocomp(obj, data, isEnter);          
        },
        error: function(err) {
          alert(err);
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


function postAutocomplete(elem, url, token) {
  $('' + elem + '').autocomplete({
    source: function(req, res) {
      var obj = $(this.element);

      $.ajax({
        url: url,
        headers: { "X-CSRF-Token": token },
        datatype: 'jsonp',
        type: "POST",
        data: req,
        success: function(data) {
        if(!data || !data.length) {
            //obj.val('');
            //return false;
          }
          res(data);
          autocomp(obj, data);
        },
        error: function(err) {
          alert(err);
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


function getCurrenciesList(elem, url, token) {//For <select> drop-down currencies.
  var obj = $('' + elem + '');
  
  $.ajax({
    url: url,
    headers: { "X-CSRF-Token": token },
    datatype: 'jsonp',
    type: "GET",
    //data: req,
    success: function(data) {
    if(!data || !data.length) {
        //obj.val('');
        return false;
      }
      
      //obj.append('<option></option>');
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
    }
    
    $(''+elem+'').find('option[value="' + fx.base + '"]').attr('selected', 'selected');
    $(''+elem+'').trigger('change');
  }, 400);
}


  function bindRemoveProduct(obj, elem, prodInput, priceInput, currencyInput, prodServiceInput) {
    obj.bind('click', function() {
      var li = $(this).parent('li');
      var newIndex = elem.find('li').index(li);

      var arr = prodInput.val() && prodInput.val().length? 
          (prodInput.val()).split(',') : [];             
      if(arr.length) {
        arr.splice(newIndex, 1);
        prodInput.val(arr);
      } else {
        prodInput.val('');
      }

      arr = priceInput.val() && priceInput.val().length? 
          (priceInput.val()).split(',') : [];             
      if(arr.length) {
        arr.splice(newIndex, 1);
        priceInput.val(arr);
      } else {
        priceInput.val('');
      }

      arr = currencyInput.val() && currencyInput.val().length? 
          (currencyInput.val()).split(',') : [];             
      if(arr.length) {
        arr.splice(newIndex, 1);
        currencyInput.val(arr);
      } else {
        currencyInput.val('');
      }            

      prodServiceInput.trigger('change');
      li.remove();
    });
   }


function removeAllProducts() {
  $("#prodServices").find('li').remove();
  $("#prodServicesList").val('');
  $("#pricesList").val('');
  $("#currenciesList").val('');
}


function removeAllItems(index) {
  $("#prodServices_"+index).find('li').remove();
  $("#hiddenProdServicesList_"+index).val('');
  $("#amountList_"+index).val('');
  $("#priceList_"+index).val('');
}


function addition(prodInput, priceInput, currencyInput, prod, prodVal, priceVal, currencyVal, elem) {
  var arr = prodInput.val() && prodInput.val().length?
    (prodInput.val()).split(',') : [];          
  
  if(checkName(arr, prodVal)) {
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'You have already added ' + prodVal + ' to the list. Please refine your selection.'
    });
    //alert('You have already added ' + prodVal + ' to the list. Please refine your selection.');
    return false;
  }

  arr.push(prodVal);
  prodInput.val((arr));

  arr = priceInput.val() && priceInput.val().length?
    (priceInput.val()).split(',') : [];
  arr.push(priceVal);
  priceInput.val((arr));

  arr = currencyInput.val() && currencyInput.val().length?
    (currencyInput.val()).split(',') : [];
  arr.push(currencyVal);
  currencyInput.val((arr));
  
  elem.append("<li class='list-group-item'><span class='product'>" + prodVal + ' - ' + priceVal + ' ' + currencyVal + "</span><span class='rem'>&nbsp;(Remove)</span></li>");
  bindRemoveProduct($('.rem').last(), elem, prodInput, priceInput, currencyInput, prod);
}


function addProduct(obj) {
  obj.click(function() {
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
      var req = input.val().length && $('#price').val().length && $('#currency').val().length;

      if(req) {
        $('#prodServiceInput,#price,#currency').removeClass('errorField');
        addition($("#prodServicesList"), $("#pricesList"), $("#currenciesList"), input, input.val(), $('#price').val(), $('#currency').val(), elem);
        input.val('');
        $('#price').val('');
        //$('#currency').val('');
        $('#addProdService').prop('disabled', true);
        $('.productRequired').remove();
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Warning',
          text: 'Please enter valid values for products, prices and currency.'
          });
        //alert('Please enter valid values for products, prices and currency.');
        $('#prodServiceInput,#price,#currency').addClass('errorField');
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
          +'<a class="nav-link" title="Hello" href="' + link + '">Hello, ' + name + ' (' + role + ')!' 
               + (avatar? '<img src="'+ avatar +'" title="Profile image" style="height: 20px; width: 50px"' : '') + '</a>'
       + '</li>');
    
    var str = '';
    str += '<li class="nav-item logout">'
        + '<a class="btn btn-danger" style="margin-right: 10px" href="?exit=true&home=true" title="Clear user session/Logout">Logout</a>'
        + '</li>';
    ul.append(str);
    
    //navbarSupportedContent
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
      if(!data || !data.length) {
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


function getFeedbackSubjects(obj, token, url) {//For deleting user accounts and cancelling bids. Types (titles) of reasons, expressed as radio buttons, should be chosen.
  $.ajax({
    url: url,
    type: 'GET',
    headers: { "X-CSRF-Token": token },
    datatype: 'application/json',
    error: function() {
    },
    success: function(data) {//data = subjects.
      if(!data || !data.length) {
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


function getFeedbacks(obj, token, url) {//For deleting user accounts and cancelling bids. Types (titles) of reasons, expressed as radio buttons, should be chosen.
  $.ajax({
    url: url,
    type: 'GET',
    headers: { "X-CSRF-Token": token },
    datatype: 'application/json',
    error: function() {
    },
    success: function(data) {//data = feedbacks.
      if(!data || !data.length) {
        obj.prepend('<p class="term">There are currently no Feedbacks available. Please engage with your users first.</p>')
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


function treatLastLi() {
  var nextLi = $('li.last').next('li');
  $('li.last').removeClass('last');
  nextLi.addClass('last');
}


function takeAction(obj, token, tr) {//alert(tr.length);
  var fileId = tr.attr('id');
  var isDownload = obj.hasClass('download')? true : false;
  var url = isDownload? '/download/' : '/files/';
  var type = isDownload? 'GET' : 'DELETE';
  var data = isDownload? null : {_method: 'delete'};
  
  $.ajax({
    url: url+fileId,
    type: type,
    data: data,
    headers: { "X-CSRF-Token": token },
    datatype: 'application/json',
    error: function() {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Error on AJAX call!'
      });
    },
    success: function(data) {
      if(!isDownload)
        tr.remove();
      if(data && data.message) {
        Swal.fire({
          icon: 'info',
          title: 'Information',
          text: data.message
        });        
      }
    }
  });
}


function supplierValidateFields(prodList, priceList, currList, fx, defaultCurr, newCurr) {
  if($('#prodServices li').length == 0) {
    var obj = '<p class="productRequired littleNote">You are required to include at least one product or service.</p>';
    $(obj).insertBefore($(this));
    return false;
  }
  
  if(prodList && prodList.length) {
    var arr = prodList.split(','), arr1 = priceList.split(','), arr2 = currList.split(',');

    for(var i in arr1) {
      var price = fx.convert(arr1[i], {from: defaultCurr, to: newCurr});
      arr1[i] = parseFloat(price).toFixed(2);
      arr2[i] = newCurr;
    }
    
    $('#prodServicesList').val(arr);
    $('#pricesList').val(arr1);
    $('#currenciesList').val(arr2);
  }

  var preferred = $('.currency').first().val();
  var isChanged = false;
  $('span.product').each(function(ind, elem) {
    var text = $(this).text();
    var last = text.lastIndexOf(' ');
    var curr = text.substring(last+1);
  
    if(preferred != curr) {
      isChanged = true;
      return false;
    }
  });

  if(isChanged && !confirm('One or more of your products have a different currency from the default you entered ('+ preferred +'). Conversion rates may apply if you continue. Please confirm or cancel.')) {
    return false;
  }
  
  return true;
}


function registrationDialog(accountType) {
  $("#dialog").dialog({
    modal: true,
    width: 300,
    height: 450,
    open: function(event, ui) {
      $('#dialog').append('<p>Congratulations for choosing to register your ' + accountType + ' account on UNITE!<br>Your next step is to verify your e-mail address for the Account Confirmation link.<br>Please confirm your new Account in order to start using our Services.</p>');
    },
    close: function(event, ui) {
        $('#dialog').text('');
    },
    buttons: {
      OK: function() {
        setTimeout(function() {
          $('#registration').submit();
        }, 150);
        $(this).dialog("close");
      },              
      Cancel: function() {
        $('#dialog').text('');
        $(this).dialog("close");
      }
    }
  });
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
          ob += '<div><span class="fileName">' + displayName + '</span>&nbsp;<a href="' + fileId + '" file="' + fileId + '" title="Download ' + val[i] + '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;<span token="' + token + '" file="' + fileId + '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' + val[i] + ' file">Remove</span></div>';
          if(i == val.length-1) {
            ob += '</div>';
            if(ob.contains('href'))
              $(ob).insertAfter(theDiv);                
          }
        } else {
          ob += '<div><span class="fileName">' + displayName + '</span>&nbsp;<a href="' + fileId + '" file="' + fileId + '" title="Download ' + val + '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;<span token="' + token + '" file="' + fileId + '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the ' + val + ' file">Remove</span></div>';
          $(ob).insertAfter(theDiv);
        }
      }
    });
}


$(document).ready(function() {
  var cnt = $('div.container').first();
  
  cnt
    .prepend('<div><button class="back btn btn-primary" style="margin-right: 20px" ' 
                                    + ' title="Go back one page" onclick="history.go(-1)">Back</button>'
                + '<button class="forward btn btn-primary" style="margin-left: 20px"' 
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
    //var isHome = nav.next('div').hasClass('home');    
    
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
    
    //if(nav.hasClass('home') || isHome) {
      var ul = $('#navbarSupportedContent')
        .find('ul');
      
      $('<li class="nav-item"><a class="nav-link" href="/feedback" title="Feedback/Suggestions">User Feedback</a></li>')
        .insertAfter('li.last');
      
      var isAdmin = nav.find('input[id="userData"]').attr('isAdmin');
      
      if(isAdmin == 'true') {
        treatLastLi();
        $('<li class="nav-item"><a class="nav-link" href="/viewFeedbacks" title="Check Feedbacks">View Feedbacks</a></li>')
          .insertAfter('li.last');
        treatLastLi();
        $('<li class="nav-item"><a class="nav-link" href="/memberList" title="List of UNITE Members">List of our members</a></li>')
          .insertAfter('li.last');
        treatLastLi();
        $('<li class="nav-item"><a class="nav-link" href="/filesList" title="View DB File List">View Files from DB</a></li>')
          .insertAfter('li.last');
      }
      
      var ind = parseInt(nav.attr('pos'));
      
      if(ul.find('li').first().hasClass('user')) {
        ind++;
      }
      
      var li = ul.find('li').eq(ind);
      li.addClass('active');
      var text = li.find('a').text();
      li.find('a').text(text + ' (current)');
    //}
  } else {
    if(nav.length) {
      var user = nav.attr('user');
      
      var str = '<div class="collapse navbar-collapse" id="navbarSupportedContent">' 
        + '<ul class="navbar-nav mr-auto">'
        + '<li class="nav-item"><a class="nav-link" href="/">Home<span class="sr-only"></span></a> </li>'
        + '<li class="nav-item"><a class="nav-link" href="/'+user+'">Dashboard <span class="sr-only"></span></a></li>'
        + (user == 'supervisor'? '' : '<li class="nav-item"><a class="nav-link" href="/'+user+'/balance">Balance <span class="sr-only"></span></a></li>')
        + (user == 'supplier'? '<li class="nav-item"><a class="nav-link" href="/'+user+'/bid-requests">Bid Requests</a></li>' : '')
        + '<li class="nav-item active"><a class="btn btn-primary" style="margin-right: 10px" href="/'+user+'/profile">Profile</a></li><br>'
        + '<li class="nav-item"><a class="btn btn-danger" title="Logout" href="?exit=true">Logout</a></li></ul></div>';
     
      nav.append(str);
      
      if(nav.attr('pos')) {
        var ind = parseInt(nav.attr('pos')), ul = $('#navbarSupportedContent').find('ul');
        var li = ul.find('li').eq(ind);
        li.addClass('active');
        var text = li.find('a').text();
        li.find('a').text(text + ' (current)');
      }
    }
  }

  
  //$('div.container').not('.text-center')
    $("body").css({"background-image": "url(https://cdn.glitch.com/e38447e4-c245-416f-8ea1-35b246c6af5d%2FWH.png?v=1592308122673)", "background-repeat": "repeat"});//That white! 
  
  if(nav)
    nav.find('span').attr('title', 'Expand/collapse UNITE basic options');
  
  $('.cancelForm').submit(function() {
    return confirm('Are you sure you want to cancel this order?');
  });  

  
  if(!($('.fileupload').length))
    return false;
  
  var token = $("input[name='_csrf']:first").val();
  
  $('input.fileupload,input.avatarupload,input.fileexcelupload').bind('change', function() {
    $(this).val()? $(this).next('input').prop('disabled', false) : $(this).next('input').prop('disabled', true);
  });

  $('.single,.multiple').each(function(index, element) {
    var input = $(this).prev('input');
    var prevInput = input.prev('input');    
    var isExcel = input.hasClass('fileexcelupload')? true : false;    
    var val = input.attr('value'), fileId = prevInput.val();
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

      if(isMulti) {//Multi
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


  $('.single,.multiple').click(function (e) {
    var input = $(this).prev('input');
    var isExcel = input.hasClass('fileexcelupload')? true : false;
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

    var theUrl = isAvatar? '/avatarUpload' : isMultiple == true? "/uploadMultiple" : isExcel? "/uploadExcel" : "/uploadFile";//uploadmultiple versus uploadfile.
    var xhr = new XMLHttpRequest();
    xhr.open('POST', theUrl, true);
    xhr.setRequestHeader('X-CSRF-TOKEN', token);
    xhr.onload = function(e) {
    };

    xhr.send(formData);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {//Success!
          //alert(xhr.responseText);
          input.next('input').prop('disabled', true);
          var prevInput = input.prev('input');
          //alert(Array.isArray(xhr.responseText)?(xhr.responseText.file) : xhr.responseText);
          var ob, val, response = isAvatar? xhr.responseText : JSON.parse(xhr.responseText);
          var theDiv = input.parent('div');
        
          if(isAvatar) {
            var src = '../' + response.substring(7);         
            $('input[name="avatar"]').val(src);//'../../../'+response
            $('<div><img src="'+src+'" alt="avatar" style="width: 150px; height: 150px"></div>').insertAfter(input);
            //var loc = window.location.pathname;
            //var dir = loc.substring(0, loc.lastIndexOf('/'));
            //alert(loc + ' ' + dir);
            //alert(imageExists('../avatars/Avatar-3:15:pm-a.jpg'));
          } else if(isExcel) {
            var MAX = $("#prodServices").attr('MAX');//parseInt("<%= MAX_PROD %>");
            
            if(Array.isArray(response)) {
              for(var i in response) {//Each Supplier product should come here.                      
                if(i < 1) 
                  continue;
                var elem = response[i];//Assume that elem fields are called name, price, and currency.                
                var elem2 = $("#prodServices");
                if(elem2.find('li').length >= MAX) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'You have reached the limit of ' + MAX + ' products to add.'
                    });
                   return false;
                 }

                addition($("#prodServicesList"), $("#pricesList"), $("#currenciesList"), $("#prodServiceInput"), elem[0], elem[1], elem[2], elem2);
              }
            }
          } else if(isMultiple) {//response.file.filename, originalname, fieldname, 
            var hasDiv = theDiv.next('div').hasClass('fileWrapper');
            ob = hasDiv? '' : '<div class="fileWrapper">';
            for(var i in response) {
              var absolutePath = response[i].path? '../' + response[i].path.substring(7) : response[i].file.originalname;
              val = !(input.attr('value') && input.attr('value').length)? absolutePath + '' : input.attr('value') + absolutePath + '';
              input.attr('value', val);
              var file = response[i].path? response[i].path : response[i].file.id;
              prevInput.attr('value', !(prevInput.val() && prevInput.val().length)? val + '' : prevInput.val() + val + '');//file
              
              ob += '<div><a href="' + absolutePath + '" file="' + file + '" title="Download ' + absolutePath + '" style="color: blue; cursor: pointer" download>Download file "' + i + '"</a>&nbsp;<span token="' + token + '" file="' + file + '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the '+ absolutePath +' file">Remove</span></div>';
            }

            if(hasDiv) {
              theDiv.next('div').append(ob);
            } else {
              ob += '</div>';
              $(ob).insertAfter(theDiv);
            }
          } else {//Single file
            val = response.path? '../' + response.path.substring(7) : response.file.originalname;
            input.attr('value', val);
            var file = response.path? response.path : response.file.id;
            prevInput.attr('value', val);//file
            
            ob = '<div><a href="' + val + '" file="' + file + '" title="Download ' + val + '" style="color: blue; cursor: pointer" download>Download file</a>&nbsp;<span token="' + token + '" file="' + file + '" class="remFile" onclick="removeFile(this,Swal)" title="Delete the '+ val +' file">Remove</span></div>';
            $(ob).insertAfter(theDiv);
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