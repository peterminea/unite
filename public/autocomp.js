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
      //alert(text);
      if(!val2 || !val2.length)
        input.val('');;
    } else {
      //alert(isMulti + ' ' + val + ' ' + input.attr('value'));
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

function getId(val) {//alert(val);
  //alert(val.indexOf('_'));
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
        if(!data || !data.length) {
            obj.val('');
            return false;
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
            obj.val('');
            return false;
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

$(document).ready(function() {
  $('input,textarea,span,label,li,button,h2,h3,h4,h5')
    .each(function(index, el) {
    if(!$(el).attr('title')) {
      $(el).attr('title', $(el).val()? $(el).val() : $(el).text());
    }
  });
  
  var nav = $('body').find('nav');
  if(nav.length && !(nav.find('div[id="navbarSupportedContent"]').length)) {
    
    var $str = ' <div class="collapse navbar-collapse" id="navbarSupportedContent">'
      + '<ul class="navbar-nav mr-auto">'
      + '<li class="nav-item">'
      + '<a class="nav-link" href="/">Home<span class="sr-only">(current)</span></a>'
      + '</li>'
      + '<li class="nav-item">'
      + '<a class="nav-link" href="/about">About</a>'
      + '</li>'
      + '<li class="nav-item">'
      + '<a class="nav-link" href="/termsConditions" title="Terms and Conditions">Terms</a>'
      + '</li>'
      + '<li class="nav-item">'
      + '<a class="nav-link" href="/antibriberyAgreement" title="Anti-Bribery Agreement">Anti-Bribery</a>'
      + '</li>'
      + '<li class="nav-item">'
      + '<a class="btn btn-danger" href="?exit=true&home=true" title="Clear user session">Clear Session</a>'
      + '</li>'
      + '</ul>'
      + '<br>'
      + '<button class="btn btn-primary" data-toggle="modal" data-target="#signUpModal">Sign up</button>'
      + '</div>';
    
    nav.append($str);
  }
  
  if(nav) 
    nav.find('span').attr('title', 'Expand/collapse UNITE basic options');
  
  if(!($('.fileupload').length))
    return false;
  
  var token = $("input[name='_csrf']:first").val();
  
  $('input.fileupload').bind('change', function() {
    $(this).val()? $(this).next('input').removeAttr('disabled') : $(this).next('input').attr('disabled', 'disabled');
    });

  $('.single,.multiple').each(function(index, element) {
    var val = $(this).prev('.fileupload').attr('value');
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
    var input = $(this).prev('.fileupload');        
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

    var theUrl = isMultiple == true? "/uploadmultiple" : "/uploadfile";
    var xhr = new XMLHttpRequest();
    xhr.open('POST', theUrl, true);
    xhr.setRequestHeader('X-CSRF-TOKEN', token);
    xhr.onload = function(e) {
    };

    xhr.send(formData);
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {//Success!
          input.next('input').attr('disabled', 'disabled');
        
          var ob, val, response = JSON.parse(xhr.responseText);
          var theDiv = input.parent('div');
          if(isMultiple) {
            var hasDiv = theDiv.next('div').hasClass('fileWrapper');

            ob = hasDiv? '' : '<div class="fileWrapper">';
            for(var i in response) {
              val = !(input.attr('value'))? response[i].path + ',' : input.attr('value') + response[i].path + ',';
              //input.val(val);
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
            //input.val(val);
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