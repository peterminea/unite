module.exports = async (fx) => {
  const fetch = require('node-fetch');
  let url = "https://www.floatrates.com/daily/eur.json";
  let settings = { method: "Get" };
  let res = await fetch(url, settings)
  .then((res) => res.json())
  .then((json) => {
  let currency = JSON.stringify(json);
  currency = '[' + (currency).split('},').join('}},{') + ']';
  currency = JSON.parse(currency);

  for(let i of currency) {
    let t = JSON.stringify(i);
    let obj = JSON.parse(t.substring(7, t.length-1));
  }

  fx.base = process.env.APP_DEFAULT_CURR;//EUR
  let t, obj = [], str = 'fx.rates = {\n';

  for(let i in currency) {
    t = JSON.stringify(currency[i]);
    obj.push(JSON.parse(t.substring(7, t.length-1)));
  }

  obj.sort(function(a, b) {
      return a.code.localeCompare(b.code);
    });

  for(let i in obj) {
    str += obj[i].code + ': ' + obj[i].rate + (i == obj.length-1? '' : ',\n');
  } 

  str += '\n}';
  eval(str);
  return fx;    
  });
}