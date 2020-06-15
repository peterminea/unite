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


function treatDiv(div, isMulti, val, input) {
    if(isMulti) {
      var newIndex = div.parent('div').find('div').index(div);
      //alert(div.parent('div').length + ' ' + newIndex + ' ' + div.parent('div').hasClass('fileWrapper'));
      var val2 = val.substring(0, val.length-1);
      val2 = val2.split(',');      
      val2.splice(newIndex, 1);      
      input.attr('value', (val2 && val2.length)? val2.toString() + ',' : '');
      //var text = (val2 && val2.length)? val2.length + ' files' : '';
      
      if(!val2 || !val2.length)
        input.val('');;
    } else {
      input.attr('value', '');
      input.val('');
    }
  
  div.remove();
}


function removeFile(obj) {
  var token = $(obj).attr('token');
  var file = $(obj).attr('file');  
  var div = $(obj).parent('div');
  var isMulti = div.parent('div').hasClass('fileWrapper');
  
  var input = isMulti? 
      div.parent('div').prev('div').find('.fileupload') : div.prev('div').find('.fileupload');
  //alert(file + ' ' + token + ' ' + div.length + ' ' + input.length);
  var val = input.attr('value');
  //var isMulti = val.charAt(val.length-1) == ','? true : false;
  
  $.ajax({
    url: '/deleteFile',
    type: 'POST',
    headers: { "X-CSRF-Token": token },
    data: {file: file},
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
        if(!data || !data.length) {//Recommended to disable it for a better user experience. We can add ours as well.
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


function addProduct(obj) {
  obj.click(function() {
     var elem = $("#prodServices");
     var MAX = $("#prodServices").attr('MAX');

     if(elem.find('li').length >= MAX) {
          alert('You have reached the limit of products to add.');
          return false;
      }

      var input = $("#prodServiceInput");
      var prodInput = $("#prodServicesList");
      var priceInput = $("#pricesList");
      var currencyInput = $("#currenciesList");
      var req = input.val().length && $('#price').val().length && $('#currency').val().length;

      if(req) {
        $('#prodServiceInput,#price,#currency').removeClass('errorField');

        var prodVal = input.val();          
        var arr = prodInput.val() && prodInput.val().length?
          (prodInput.val()).split(',') : [];          

        if(checkName(arr, prodVal)) {
          alert('You have already added ' + prodVal + ' to the list. Please refine your selection.');
          return false;
        } 

        elem.append("<li class='list-group-item'><span>" + prodVal + ' - ' + $('#price').val() + ' ' + $('#currency').val() + "</span><span class='rem'>&nbsp;(Remove)</span></li>");

        bindRemoveProduct($('.rem').last(), elem, prodInput, priceInput, currencyInput, input);

        arr.push(prodVal);
        prodInput.val((arr));

        arr = priceInput.val() && priceInput.val().length?
          (priceInput.val()).split(',') : [];
        arr.push($('#price').val());
        priceInput.val((arr));

        arr = currencyInput.val() && currencyInput.val().length?
          (currencyInput.val()).split(',') : [];
        arr.push($('#currency').val());
        currencyInput.val((arr));

        input.val('');
        $('#price').val('');
        $('#currency').val('');
        $('#addProdService').prop('disabled', true);
        $('.productRequired').remove();
      } else {
        alert('Please enter valid values for products, prices and currency.');
        $('#prodServiceInput,#price,#currency').addClass('errorField');
      }
    });
}


function userInputs(id, role, name, type, ul) {//Home, About, Terms, Antibribery - ensure link to user's profile if they are logged into session.
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
   
  if(id)
    ul.prepend('<li class="nav-item user">'
          +'<a class="nav-link" title="Hello" href="' + link + '">Hello, ' + name + ' (' + role + ')!</a>'
       + '</li>');
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
  if(nav.length && !(nav.find('div[id="navbarSupportedContent"]').length)) {
    var isHome = nav.next('div').hasClass('home');    
    
    var $str =
        ' <div class="collapse navbar-collapse" id="navbarSupportedContent">'
        + '<ul class="navbar-nav mr-auto">'
        + '<li class="nav-item">'
        + '<a class="nav-link" title="Home" href="/">Home</a>'
        + '</li>'
        + '<li class="nav-item">'
        + '<a class="nav-link" href="/memberList" title="List of UNITE Members">List of our members</a>'
        + '</li>'
        + '<li class="nav-item">'
        + '<a class="nav-link" title="About" href="/about">About</a>'
        + '</li>'
        + '<li class="nav-item">'
        + '<a class="nav-link" href="/termsConditions" title="Terms and Conditions">Terms</a>'
        + '</li>'
        + '<li class="nav-item">'
        + '<a class="nav-link" href="/antibriberyAgreement" title="Anti-Bribery Agreement">Anti-Bribery</a>'
        + '</li>'
        + '<li class="nav-item logout">'
        + '<a class="btn btn-danger" href="?exit=true&home=true" title="Clear user session/Logout">Logout</a>'
        + '</li>'
        + '</ul>'
        + '<br>'
        + '<button class="btn btn-primary" data-toggle="modal" data-target="#signUpModal">Sign up</button>'
        + '</div>';
    
    nav.append($str);
    
    if(nav.hasClass('home') || isHome) {
      var ul = $('#navbarSupportedContent')
        .find('ul');      
      
      $('<li class="nav-item"><a class="nav-link" href="/feedback" title="Feedback/Suggestions">User Feedback</a></li>')
        .insertBefore('li.logout');
      
      var isAdmin = nav.find('input[id="userData"]').attr('isAdmin');
      if(isAdmin == 'true') {
        $('<li class="nav-item"><a class="nav-link" href="/viewFeedbacks" title="Check Feedbacks">View Feedbacks</a></li>')
          .insertBefore('li.logout');
      }
      
      var ind = parseInt(nav.attr('pos'));      
      
      if(ul.find('li').first().hasClass('user')) {
        ind++;
      }
      
      var li = ul.find('li').eq(ind);
      li.addClass('active');
      var text = li.find('a').text();
      li.find('a').text(text + ' (current)');
    }
  }

  
  //$('div.container').not('.text-center')
    $("body").css({"background-image": "url(https://cdn.glitch.com/e38447e4-c245-416f-8ea1-35b246c6af5d%2FGD.png?v=1591857198052)", "background-repeat": "repeat"});//That yellow! 
  
  if(nav)
    nav.find('span').attr('title', 'Expand/collapse UNITE basic options');
  
  $('.cancelForm').submit(function() {
    return confirm('Are you sure you want to cancel this order?');
  });
  

  
  if(!($('.fileupload').length))
    return false;
  
  var token = $("input[name='_csrf']:first").val();
  
  $('input.fileupload,input.fileexcelupload').bind('change', function() {
    $(this).val()? $(this).next('input').prop('disabled', false) : $(this).next('input').prop('disabled', true);
  });

  $('.single,.multiple').each(function(index, element) {
    var isExcel = $(this).prev('input').hasClass('fileexcelupload')? true : false;
    var val = $(this).prev('input').attr('value');
    var theDiv = $(this).parent('div');

    if(val) {
      if(val.charAt(val.length-1) == ',') {//Multi
        var newVal = val.substring(0, val.length-1);
        newVal = newVal.split(',');
        var ob = '<div class="fileWrapper">';
        for(var i in newVal) {
          ob += '<div><a href="../../' + newVal[i] + '" title="Download ' + newVal[i] + '" download>Download file "' + i + '"</a>&nbsp;<span token="' + token + '" file="' + newVal[i] + '" class="remFile" onclick="removeFile(this)" title="Delete this file">Remove</span></div>';              
        }

        ob += '</div>';
        $(ob).insertAfter(theDiv);
      } else {
        var ob = '<div><a href="../../' + val + '" title="Download ' + newVal[i] + '" download>Download file</a>&nbsp;<span token="' + token + '" file="' + val + '" class="remFile" onclick="removeFile(this)" title="Delete this file">Remove</span></div>';            
        $(ob).insertAfter(theDiv);
      }
    }
  });

  $('.single,.multiple').click(function (e) {
    var isExcel = $(this).prev('input').hasClass('fileexcelupload')? true : false;
    var input = $(this).prev('input');
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

    var theUrl = isMultiple == true? "/uploadmultiple" : isExcel? "/uploadExcel" : "/uploadfile";
    var xhr = new XMLHttpRequest();
    xhr.open('POST', theUrl, true);
    xhr.setRequestHeader('X-CSRF-TOKEN', token);
    xhr.onload = function(e) {
    };

    xhr.send(formData);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {//Success!
          input.next('input').prop('disabled', true);
        
          var ob, val, response = JSON.parse(xhr.responseText);
          //alert(JSON.stringify(response));
          var theDiv = input.parent('div');
          if(isExcel) {
            var MAX = $("#prodServices").attr('MAX');//parseInt("<%= MAX_PROD %>");
            var input2 = $("#prodServiceInput");
            var prodInput = $("#prodServicesList");
            var priceInput = $("#pricesList");
            var currencyInput = $("#currenciesList");
            
            if(Array.isArray(response)) {
              for(var i in response) {//Each Supplier product should come here.
                var elem = response[i];//Assume that elem fields are called name, price, and currency.
                var elem2 = $("#prodServices");
                  if(elem2.find('li').length >= MAX) {
                     alert('You have reached the limit of products to add.');
                     return false;
                   }
                
                  elem2.append("<li class='list-group-item'><span>" + elem.name + ' - ' + elem2.price + ' ' + elem2.currency + "</span><span class='rem'>&nbsp;(Remove)</span></li>");
                  bindRemoveProduct($('.rem').last(), elem2, prodInput, priceInput, currencyInput, input2);
              }
            }            
          } else
          if(isMultiple) {
            var hasDiv = theDiv.next('div').hasClass('fileWrapper');

            ob = hasDiv? '' : '<div class="fileWrapper">';
            for(var i in response) {
              val = !(input.attr('value'))? response[i].path + ',' : input.attr('value') + response[i].path + ',';
              input.attr('value', val);
              ob += '<div><a href="../../' + response[i].path + '" title="Download ' + response[i].path + '" download>Download file "' + i + '"</a>&nbsp;<span token="' + token + '" file="' + response[i].path + '" class="remFile" onclick="removeFile(this)" title="Delete this file">Remove</span></div>';                  
            }

            if(hasDiv) {
              theDiv.next('div').append(ob);
            } else {
              ob += '</div>';
              $(ob).insertAfter(theDiv);
            }
          } else {
            val = response.path;
            input.attr('value', val);
            ob = '<div><a href="../../' + val + '" title="Download ' + val + '" download>Download file</a>&nbsp;<span token="' + token + '" file="' + val + '" class="remFile" onclick="removeFile(this)" title="Delete this file">Remove</span></div>';
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