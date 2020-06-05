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
      + '<a class="nav-link" href="/termsConditions">Terms</a>'
      + '</li>'
      + '<li class="nav-item">'
      + '<a class="nav-link" href="/antibriberyAgreement">Anti-Bribery</a>'
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
  
  if(nav) nav.find('span').attr('title', 'Expand/collapse UNITE basic options');
});