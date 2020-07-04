//var oxr = require('open-exchange-rates'), fx = require('money');
module.exports = async (oxr, fx) => {console.log(1991);
  if(1==2) {
    oxr.set({ app_id: process.env.EXCH_RATES_APP_ID });
     await oxr.latest(function() {
      // Apply exchange rates and base rate to `fx` library object:
      fx.rates = oxr.rates;
      fx.base = oxr.base;

      // money.js is ready to use:
      //fx(100).from('HKD').to('GBP'); // ~8.0424
    });  
  }
  else {
      fx.base = process.env.BID_DEFAULT_CURR;
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
  }
}