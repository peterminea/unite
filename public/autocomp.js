var autocomp = function(obj, data, enter) {//Not for modals.
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
          //alert(enter);
          //obj.trigger(e);
          obj.parent('form').submit();
        }
        });
      });
    //$(this).clone().appendTo(obj);
    }
  });
};