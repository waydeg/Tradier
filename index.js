'use strict';

var APP_ID = "amzn1.echo-sdk-ams.app.d10ccffe-2f77-462f-ac5a-f70e72492dd2"; //tradier
//var APP_ID = "amzn1.echo-sdk-ams.app.685808ad-6122-402e-8d2f-2c0f624c1d29"; //carbon9

var AlexaSkill = require('./AlexaSkill');
var AWS = require("aws-sdk");

var CARD_TITLE = "Carbon09"; // Be sure to change this for your skill.
//var SANDBOX_TOKEN = "Nm17uzGdWsETsrGLzyAvS34xdryR";
//var SANDBOX_TOKEN = "clzqqZol0GuJpe4YIGzsAb7koqLA";
//var SANDBOX_TOKEN = "6m98Kh0OiVwY58mpyycdFuQOudvo"; // live account
var SANDBOX_TOKEN = "YfpEjA4SwQ1fOYCh3FVATjPvQTmk";
var MARKET_STATUS_OPEN = false;
var accountid = '';

var https = require('https');

var Tradier = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Tradier.prototype = Object.create(AlexaSkill.prototype);
Tradier.prototype.constructor = Tradier;

Tradier.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Tradier onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session init logic would go here
};

Tradier.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Tradier onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);

    getWelcomeResponse(response,session);
};

Tradier.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("Tradier onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // any session cleanup logic would go here
};

Tradier.prototype.intentHandlers = {
	    "MarketStatus": function (intent, session, response) {
	        getMarketStatus(intent, session, response);
	    },
	    "LookupCompany": function (intent, session, response) {
	        searchCompany(intent, session, response);
	    },
	    "GetCompanyQuote": function (intent, session, response) {
	        getCompanyQuote(intent, session, response);
	    },
	    "GetQuote": function (intent, session, response) {
	        getQuote(intent, session, response);
	    },	    
	    "GetMyStocks": function (intent, session, response) {
	        getMyStocks(intent, session, response);
	    },	    
	    "BuyStock": function (intent, session, response) {
	    	buyStock(intent, session, response);
	    },	
	    "SellStock": function (intent, session, response) {
	    	sellStock(intent, session, response);
	    },		    
	    "ExecuteTrade": function (intent, session, response) {
	    	executeTrade(intent, session, response);
	    },	
	    "CancelTrade": function (intent, session, response) {
	    	cancelTrade(intent, session, response);
	    },			    
	    "AddToWatchlist": function (intent, session, response) {
	        addStockToMyWatchlist(intent, session, response);
	    },	  	   
	    "RemoveFromWatchlist": function (intent, session, response) {
	        removeStockFromMyWatchlist(intent, session, response);
	    },		
	    "CreateWatchlist": function (intent, session, response) {
	        createWatchlist(intent, session, response);
	    },		  	
	    "DeleteWatchlist": function (intent, session, response) {
	        deleteWatchlist(intent, session, response);
	    },			    
	    "HearMore": function (intent, session, response) {
	        getNextPageOfItems(intent, session, response);
	    },

	    "DontHearMore": function (intent, session, response) {
//	        response.tell("");
	        getMarketStatus(intent, session, response);
	    },

	    "AMAZON.HelpIntent": function (intent, session, response) {
	        helpTheUser(intent, session, response);
	    },

	    "AMAZON.StopIntent": function (intent, session, response) {
	        var speechOutput = "Goodbye";
	        response.tell(speechOutput);
	    },

	    "AMAZON.CancelIntent": function (intent, session, response) {
	        var speechOutput = "Goodbye";
	        response.tell(speechOutput);
	    }
	};

function getWelcomeResponse(response,session) {
    // If we wanted to initialize the session to have some attributes we could add those here.
	getMarketStatusText(function (statusText){
	    var speechText = "Carbon9. " + statusText.clock.description  + " How can I help you? ";    
	    var repromptText = "I can get a stock price for you, lookup a company, or make a trade.";
        var cardTitle = "Hello";
        var cardOutput = "The " + statusText.clock.description;
        if(statusText.clock.state == 'open') { session.marketopen = true;} else { session.marketopen = false;}
	    var speechOutput = {
	        speech: speechText,
	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
	    };
	    var repromptOutput = {
	        speech: repromptText,
	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
	    };
        response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
	});

}

function getMarketStatus(intent, session, response) {
    var speechText = "",
        repromptText = "",
        speechOutput,
        repromptOutput;

	getMarketStatusText(function (statusText){
		if(statusText.clock.status == 'open') { session.marketopen == true; } else { session.marketopen == false;}
	     speechText = "The " + statusText.clock.description + " You can ask me to check on your portfolio, check on your watchlist, look up a company, buy shares of a stock, or sell shares of a stock. ";  
	    repromptText = "I can get a stock price for you, lookup a company, or make a trade.";
        var cardTitle = "Hello";
        var cardOutput = "The " + statusText.clock.description;
        if(statusText.clock.state == 'open') { session.marketopen = true;} else { session.marketopen = false;}        
	    speechOutput = {
	        speech: speechText,
	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
	    };
	    repromptOutput = {
	        speech: repromptText,
	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
	    };
        response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
	});   
    
}

function searchCompany(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "";
	var cardOutput = "";	
	var len = 1;

	var companySlot = intent.slots.Company;
    if (companySlot) {
    	getSearchCompanyResult(companySlot.value, function(resp) {
    		if(resp.securities != null) { 
    		speechText = "<speak>";

    		if(Array.isArray(resp.securities.security)){ 
        		len = resp.securities.security.length; 
    		for (var i = 0;  i < len; i ++) { 
    			var item = resp.securities.security[i];
    			console.log(item);
        		speechText = speechText + item.description.replace(/&/g, 'and') + ". <break time=\"0.5s\" /> Symbol <say-as interpret-as='spell-out'>" + item.symbol + "</say-as><break time=\"0.8s\" />";
  			
 //   		});
    		}
            cardTitle = resp.securities.security[0].description;
            cardOutput = resp.securities.security[0].symbol;
    		}else {
    			speechText = speechText + resp.securities.security.description.replace(/&/g, 'and') + ". <break time=\"0.5s\" />Symbol <say-as interpret-as=\"spell-out\">" + resp.securities.security.symbol + "</say-as>";
                cardTitle = resp.securities.security.description;
                cardOutput = resp.securities.security.symbol;
    		}
    		speechText = speechText + "</speak>";
    	     repromptText = "Would you like to lookup another company?";

    	    var speechOutput = {
    	        speech: speechText,
    	        type: AlexaSkill.speechOutputType.SSML
    	    };
    	    var repromptOutput = {
    	        speech: repromptText,
    	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    	    };
            response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
            
    		} else {
    	        speechText = "I don't recognize that company, please try again";
    	        repromptText = "<speak>I'm not sure what that company is, you can say, " +
    	            "Amazon <break time=\"0.2s\" /> " +
    	            "Google <break time=\"0.2s\" /> " +
    	            "Microsoft <break time=\"0.2s\" /> " +
    	            "for example.</speak>";
    	        speechOutput = {
    	            speech: speechText,
    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
    	        };
    	        repromptOutput = {
    	            speech: repromptText,
    	            type: AlexaSkill.speechOutputType.SSML
    	        };
    	        response.ask(speechOutput, repromptOutput);   			
    			
    		}
    		
    	});	
    } else {
        // The category didn't match one of our predefined categories. Reprompt the user.
        speechText = "I don't recognize that company, please try again";
        repromptText = "<speak>I'm not sure what that company is, you can say, " +
            "Amazon <break time=\"0.2s\" /> " +
            "Google <break time=\"0.2s\" /> " +
            "Microsoft <break time=\"0.2s\" /> " +
            "for example.</speak>";
        speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.SSML
        };
        response.ask(speechOutput, repromptOutput);
    }
	

}


function getCompanyQuote(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Quote";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';
	var companySlot = intent.slots.Company;
    if (companySlot) {
    	getSearchCompanyResult(companySlot.value, function(resp) {
    		if(resp.securities != null) { 
    		speechText = "<speak>";
console.log(resp);
console.log(resp.securities.security);
    		if(Array.isArray(resp.securities.security)){ 
        		len = resp.securities.security.length; 
        		for (var i = 0;  i < len; i ++) { 
        			symbols = symbols + resp.securities.security[i].symbol;
        			if(i< len-1){ symbols = symbols + ',';}
        		}	
console.log(symbols);
        		getQuotesResult(symbols,function(q){
        			qlen = q.quotes.quote.length;
        			for(var j=0; j < qlen; j++) {
        				var qs = q.quotes.quote[j];
        				var ask = qs.ask;
        				var last = qs.last;
        				var change = qs.change;
        				var volume = qs.volume;
        				var txtChange = '';
        				if (change < 0 ) { txtChange = 'down ' + change;}
        				else if( change == 0 ) { txtChange = 'unchanged';}
        				else if(change > 0) { txtChange = 'up ' + change;}
        				if(ask > 0 ){ 
        				speechText = speechText + qs.description.replace(/&/g, 'and') + ". <break time=\"0.5s\" /> Symbol <say-as interpret-as='spell-out'>" + qs.symbol + "</say-as><break time=\"0.5s\" /> The last selling price was " + last + ". " +txtChange+ " on volume of " + volume + " shares.<break time=\"0.8s\" />";
        	            cardOutput = cardOutput + q.quotes.quote[j].description + ' (' + q.quotes.quote[j].symbol + ') ' + last + ' ' + txtChange + '. ';
        				}	
        			}
        	   		speechText = speechText + "</speak>";
           	     repromptText = "Would you like to lookup another company?";

           	    var speechOutput = {
           	        speech: speechText,
           	        type: AlexaSkill.speechOutputType.SSML
           	    };
           	    var repromptOutput = {
           	        speech: repromptText,
           	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
           	    };
                   response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
        		});	

    		}else {
    			
        		getQuotesResult(resp.securities.security.symbol,function(q){
        				var qs = q.quotes.quote;
        				var ask = qs.ask;
        				var last = qs.last;
        				var change = qs.change;
        				var volume = qs.volume;
        				var txtChange = '';
        				if (change < 0 ) { txtChange = 'down ' + change;}
        				else if( change == 0 ) { txtChange = 'unchanged';}
        				else if(change > 0) { txtChange = 'up ' + change;}
        				speechText = speechText + qs.description.replace(/&/g, 'and') + ". <break time=\"0.5s\" /> Symbol <say-as interpret-as='spell-out'>" + qs.symbol + "</say-as><break time=\"0.5s\" /> The last selling price was " + last + ". " +txtChange+ " on volume of " + volume + " shares.<break time=\"0.8s\" />";
        	            cardTitle = q.quotes.quote.symbol;
        	            cardOutput = q.quotes.quote.description + ' (' + q.quotes.quote.symbol + ') ' + last + ' ' + txtChange + '. ';
                   		speechText = speechText + "</speak>";
                  	     repromptText = "Would you like to lookup another company?";

                  	    var speechOutput = {
                  	        speech: speechText,
                  	        type: AlexaSkill.speechOutputType.SSML
                  	    };
                  	    var repromptOutput = {
                  	        speech: repromptText,
                  	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                  	    };
                          response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
        		});	

    		}
 
            
    		} else {
    	        speechText = "I don't recognize that company, please try again";
    	        repromptText = "<speak>I'm not sure what that company is, you can say, " +
    	            "Amazon <break time=\"0.2s\" /> " +
    	            "Google <break time=\"0.2s\" /> " +
    	            "Microsoft <break time=\"0.2s\" /> " +
    	            "for example.</speak>";
    	        var speechOutput = {
    	            speech: speechText,
    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
    	        };
    	        var repromptOutput = {
    	            speech: repromptText,
    	            type: AlexaSkill.speechOutputType.SSML
    	        };
    	        response.ask(speechOutput, repromptOutput);   			
    			
    		}
    		
    	});	
    } else {
        // The company didn't match one of our predefined companies. Reprompt the user.
        speechText = "I don't recognize that company, please try again";
        repromptText = "<speak>I'm not sure what that company is, you can say, " +
            "Amazon <break time=\"0.2s\" /> " +
            "Google <break time=\"0.2s\" /> " +
            "Microsoft <break time=\"0.2s\" /> " +
            "for example.</speak>";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.SSML
        };
        response.ask(speechOutput, repromptOutput);
    }
	

}

function getQuote(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Quote";
	var cardOutput = "";	
	var speechText = "<speak>";
	var len = 1;
	var qlen = 1;
	var symbols = '';
	var symbolSlot = intent.slots.Symbol;
    if (symbolSlot) {
    		console.log('symbol to lookup '+ symbolSlot.value);
       		saveUserHistory(session,symbolSlot.value);    		
    		getQuotesResult(symbolSlot.value,function(q){
				var qs = q.quotes.quote;
				if(typeof qs != "undefined"){ 
				var ask = qs.ask;
				var last = qs.last;
				var change = qs.change;
				var volume = qs.volume;
				var txtChange = '';
				if (change < 0 ) { txtChange = 'down ' + change;}
				else if( change == 0 ) { txtChange = 'unchanged';}
				else if(change > 0) { txtChange = 'up ' + change;}
				speechText = speechText + qs.description.replace(/&/g, 'and') + ". <break time=\"0.5s\" /> Symbol <say-as interpret-as='spell-out'>" + qs.symbol + "</say-as><break time=\"0.5s\" /> The last selling price was " + last + ". " +txtChange+ " on volume of " + volume + " shares.<break time=\"0.8s\" />";
	            cardTitle = q.quotes.quote.symbol;
	            cardOutput = q.quotes.quote.description + ' (' + q.quotes.quote.symbol + ') ' + last + ' ' + txtChange + '. ';
           		speechText = speechText + "</speak>";

          	     repromptText = "Would you like to lookup another company?";

          	    var speechOutput = {
          	        speech: speechText,
          	        type: AlexaSkill.speechOutputType.SSML
          	    };
          	    var repromptOutput = {
          	        speech: repromptText,
          	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
          	    };
                response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
				} else {
	    	        speechText = "You have no stocks in your watchlist";
	    	        repromptText = "Would you like to add a stock to your watchlist?";
	    	        var speechOutput = {
	    	            speech: speechText,
	    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
	    	        };
	    	        var repromptOutput = {
	    	            speech: repromptText,
	    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
	    	        };
	    	        response.ask(speechOutput, repromptOutput);  		
				}

		});	
    } else {
        // The company didn't match one of our predefined companies. Reprompt the user.
        speechText = "I don't recognize that symbol, please try again";
        repromptText = "<speak>I'm not sure what that symbol is, you can say, " +
            "AMZN <break time=\"0.2s\" /> " +
            "GOOG <break time=\"0.2s\" /> " +
            "MSFT <break time=\"0.2s\" /> " +
            "for example.</speak>";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.SSML
        };
        response.ask(speechOutput, repromptOutput);
    }
	

}

function addStockToMyWatchlist(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Watchlist";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';
	var symbolSlot = intent.slots.Symbol;
    if (symbolSlot) {
    	console.log('symbol to add ' + symbolSlot);
    	addToWatchlistResult(symbolSlot.value, function(resp) {
    		if(resp.watchlist != null) { 
        		speechText = "<speak>";

        		if(Array.isArray(resp.watchlist.items.item)){ 
            		len = resp.watchlist.items.item.length; 
            		for (var i = 0;  i < len; i ++) { 
            			symbols = symbols + resp.watchlist.items.item[i].symbol;
            			if(i< len-1){ symbols = symbols + ',';}
            		}	
    					speechText = speechText +"Your watchlist now contains " + symbols;
            	   		speechText = speechText + "</speak>";
               	     repromptText = "Would you like to add another symbol?";
               	     	cardOutput = symbols;
               	    var speechOutput = {
               	        speech: speechText,
               	        type: AlexaSkill.speechOutputType.SSML
               	    };
               	    var repromptOutput = {
               	        speech: repromptText,
               	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
               	    };
                       response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
            		

        		}else if(resp.watchlist.items != 'null') {
        			speechText = speechText +"Your watchlist now contains " + resp.watchlist.items.item.symbol; 
                      		speechText = speechText + "</speak>";
                      	     repromptText = "Would you like to lookup another company?";
                      	   cardOutput = resp.watchlist.items.item.symbol;
                      	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                              response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
            		

        		}
    		}
    		});
    }
}

function executeTradeFake(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Stock Purchase";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';


        		speechText = "<speak>";
        		
        			if(session.attributes.trade == 'buy') { 
        			speechText = speechText +"Your purchase request of " +session.attributes.quantity + " shares of stock symbol " + session.attributes.symbol  +" has been successfully completed. "; 
        			} else {
            			speechText = speechText +"Your sell request of " +session.attributes.quantity + " shares of stock symbol " + session.attributes.symbol  +" has been successfully completed."; 
            			 	
        			}

        			speechText = speechText + "</speak>";
                      	     repromptText = "How may I help you?";
                	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                            response.ask(speechOutput, repromptOutput);

    
}

function cancelTradeFake(intent, session, response) {
	var speechText = "";
	var repromptText = "";


        		speechText = "<speak>";
        		

        			speechText = speechText +"Your purchase of has been canceled. "; 


        			speechText = speechText + "</speak>";
                      	     repromptText = "How may I help you?";
                      	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                            response.ask(speechOutput, repromptOutput);

    
}

function buyStockFake(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Stock Purchase Quote";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';
	var symbolSlot = intent.slots.Symbol;
	var quantitySlot = intent.slots.Quantity;
	var quantity= quantitySlot.value;
    if (symbolSlot && quantitySlot) {

        		speechText = "<speak>";
    			session.attributes.quantity = quantity;
    			session.attributes.symbol = symbolSlot.value;
    			session.attributes.trade = 'buy';
        			var cost = "1913";
        			speechText = speechText +"Your purchase of " +quantity + " shares of stock symbol " + symbolSlot.value  +" will cost <say-as interpret-as='ordinal'>" + cost + "</say-as> dollars. "; 
        			speechText = speechText +"Please say Execute Trade to confirm and make this purchase."; 

        			speechText = speechText + "</speak>";
                      	     repromptText = "Please say Execute Trade or Cancel Trade.";
                      	   cardOutput = "Your purchase of " + quantity + " shares of " + symbolSlot.value + " will cost "+ cost+ " dollars.";
                      	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                              response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);

    }
}

function sellStockFake(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Stock Sale Quote";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';
	var symbolSlot = intent.slots.Symbol;
	var quantitySlot = intent.slots.Quantity;
	var quantity= quantitySlot.value;
    if (symbolSlot && quantitySlot) {

        		speechText = "<speak>";
    			session.attributes.quantity = quantity;
    			session.attributes.symbol = symbolSlot.value;
    			session.attributes.trade = 'buy';
        			var cost = "3.95";
        			speechText = speechText +"Your sale of " +quantity + " shares of stock symbol " + symbolSlot.value  +" will cost <say-as interpret-as='ordinal'>" + cost + "</say-as> dollars. "; 
        			speechText = speechText +"Please say Execute Trade to confirm and make this purchase."; 

        			speechText = speechText + "</speak>";
                      	     repromptText = "Please say Execute Trade or Cancel Trade.";
                      	   cardOutput = "Your sale of " + quantity + " shares of " + symbolSlot.value + " will cost "+ cost+ " dollars.";
                      	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                              response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);

    }
}


function buyStock(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Stock Purchase Quote";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';
	var symbolSlot = intent.slots.Symbol;
	var quantitySlot = intent.slots.Quantity;
	var quantity= quantitySlot.value;
    console.log(session);
    if (symbolSlot) {
    	var accountid = getAccountID(session)
    	buyStockResult(symbolSlot.value,quantity,accountid,function(resp) {
    		if(resp.order != null) { 
        		speechText = "<speak>";
        			session.attributes.quantity = quantity;
        			session.attributes.symbol = symbolSlot.value;
        			session.attributes.trade = 'buy';
        			var cost = resp.order.cost;
        			speechText = speechText +"Your purchase of " +quantity + " shares of stock symbol " + symbolSlot.value  +" will cost " + cost + "dollars. "; 
        			speechText = speechText +"Please say Execute Trade to confirm and make this purchase."; 

        			speechText = speechText + "</speak>";
                      	     repromptText = "Please say Execute Trade or Cancel Trade.";
                      	   cardOutput = "Your purchase of" + quantity + " shares of " + symbolSlot.value + " will cost "+ cost+ " dollars.";
                      	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                              response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
            		

        		
    		}
    		});
    }
}

function createWatchlist(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Watchlist";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';

    	createWatchlistResult(function(resp) {
    		if(resp.watchlist != null) { 
        		speechText = "<speak>";

if(resp.watchlist.id != 'null') {
        			speechText = speechText +"Your new watchlist id is  " + resp.watchlist.id; 
                      		speechText = speechText + "</speak>";
                      	     repromptText = "Would you like to add a symbol?";

                      	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                            response.ask(speechOutput, repromptOutput);
            		

        		}
    		}
    		});
    
}

function deleteWatchlist(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Watchlist";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';

    	deleteWatchlistResult(function(resp) {
    		console.log("here");console.log(resp);
    		if(resp.watchlists != null) { 
        		speechText = "<speak>";


        			speechText = speechText +"Your new watchlist is  empty"; 
                      		speechText = speechText + "</speak>";
                      	     repromptText = "Would you like to add a symbol?";

                      	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                            response.ask(speechOutput, repromptOutput);
            		

        		}
    		
    		});
    
}

function removeStockFromMyWatchlist(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Watchlist";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';
	var symbolSlot = intent.slots.Symbol;
    if (symbolSlot) {
    	removeStockFromMyWatchlistResult(symbolSlot.value, function(resp) {
    		if(resp.watchlist != null) { 
        		speechText = "<speak>";

        		if(Array.isArray(resp.watchlist.items.item)){ 
            		len = resp.watchlist.items.item.length; 
            		for (var i = 0;  i < len; i ++) { 
            			symbols = symbols + resp.watchlist.items.item[i].symbol;
            			if(i< len-1){ symbols = symbols + ',';}
            		}	
    					speechText = speechText +"Your watchlist now contains " + symbols;
            	   		speechText = speechText + "</speak>";
               	     repromptText = "Would you like to add another symbol?";
               	     	cardOutput = symbols;
               	    var speechOutput = {
               	        speech: speechText,
               	        type: AlexaSkill.speechOutputType.SSML
               	    };
               	    var repromptOutput = {
               	        speech: repromptText,
               	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
               	    };
                       response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
            		

        		}else if(resp.watchlist.items != 'null') {
        			speechText = speechText +"Your watchlist now contains " + resp.watchlist.items.item.symbol; 
                      		speechText = speechText + "</speak>";
                      	     repromptText = "Would you like to lookup another company?";
                      	   cardOutput = resp.watchlist.items.item.symbol;
                      	    var speechOutput = {
                      	        speech: speechText,
                      	        type: AlexaSkill.speechOutputType.SSML
                      	    };
                      	    var repromptOutput = {
                      	        speech: repromptText,
                      	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                      	    };
                              response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
            		

        		}
    		}
    		});
    }
}


function getMyStocks(intent, session, response) {
	var speechText = "";
	var repromptText = "";
	var cardTitle = "Quote";
	var cardOutput = "";	
	var len = 1;
	var qlen = 1;
	var symbols = '';

    	getWatchlistResult(function(resp) {
    		if(resp.watchlist != null) { 
    		speechText = "<speak>";

    		if(Array.isArray(resp.watchlist.items.item)){ 
        		len = resp.watchlist.items.item.length; 
        		for (var i = 0;  i < len; i ++) { 
        			symbols = symbols + resp.watchlist.items.item[i].symbol;
        			if(i< len-1){ symbols = symbols + ',';}
        		}	
console.log(symbols);
        		getQuotesResult(symbols,function(q){
        			qlen = q.quotes.quote.length;
        			for(var j=0; j < qlen; j++) {
        				var qs = q.quotes.quote[j];
        				var ask = qs.ask;
        				var last = qs.last;
        				var change = qs.change;
        				var volume = qs.volume;
        				var txtChange = '';
        				if (change < 0 ) { txtChange = 'down ' + change;}
        				else if( change == 0 ) { txtChange = 'unchanged';}
        				else if(change > 0) { txtChange = 'up ' + change;}
        				if(ask > 0 ){ 
        				speechText = speechText + qs.description.replace(/&/g, 'and') + ". <break time=\"0.5s\" /> Symbol <say-as interpret-as='spell-out'>" + qs.symbol + "</say-as><break time=\"0.5s\" /> The last selling price was " + last + ". " +txtChange+ " on volume of " + volume + " shares.<break time=\"0.8s\" />";
        	            cardOutput = cardOutput + q.quotes.quote[j].description + ' (' + q.quotes.quote[j].symbol + ') ' + last + ' ' + txtChange + '. ';
        				}	
        			}
        	   		speechText = speechText + "</speak>";
           	     repromptText = "Would you like to lookup another company?";

           	    var speechOutput = {
           	        speech: speechText,
           	        type: AlexaSkill.speechOutputType.SSML
           	    };
           	    var repromptOutput = {
           	        speech: repromptText,
           	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
           	    };
                   response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
        		});	

    		}else if(resp.watchlist.items != 'null') {
    			
    			getQuotesResult(resp.watchlist.items.item.symbol,function(q){
        				var qs = q.quotes.quote;
        				if(typeof qs != "undefined"){ 
        				var ask = qs.ask;
        				var last = qs.last;
        				var change = qs.change;
        				var volume = qs.volume;
        				var txtChange = '';
        				if (change < 0 ) { txtChange = 'down ' + change;}
        				else if( change == 0 ) { txtChange = 'unchanged';}
        				else if(change > 0) { txtChange = 'up ' + change;}
        				speechText = speechText + qs.description.replace(/&/g, 'and') + ". <break time=\"0.5s\" /> Symbol <say-as interpret-as='spell-out'>" + qs.symbol + "</say-as><break time=\"0.5s\" /> The last selling price was " + last + ". " +txtChange+ " on volume of " + volume + " shares.<break time=\"0.8s\" />";
        	            cardTitle = q.quotes.quote.symbol;
        	            cardOutput = q.quotes.quote.description + ' (' + q.quotes.quote.symbol + ') ' + last + ' ' + txtChange + '. ';
                   		speechText = speechText + "</speak>";
                  	     repromptText = "Would you like to lookup another company?";

                  	    var speechOutput = {
                  	        speech: speechText,
                  	        type: AlexaSkill.speechOutputType.SSML
                  	    };
                  	    var repromptOutput = {
                  	        speech: repromptText,
                  	        type: AlexaSkill.speechOutputType.PLAIN_TEXT
                  	    };
                        response.askWithCard(speechOutput, repromptOutput, cardTitle, cardOutput);
        				} else {
        	    	        speechText = "You have no stocks in your watchlist";
        	    	        repromptText = "Would you like to add a stock to your watchlist?";
        	    	        var speechOutput = {
        	    	            speech: speechText,
        	    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        	    	        };
        	    	        var repromptOutput = {
        	    	            speech: repromptText,
        	    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        	    	        };
        	    	        response.ask(speechOutput, repromptOutput);  		
        				}

        		});	

    		}else {
    	        speechText = "You have no stocks in your watchlist";
    	        repromptText = "Would you like to add a stock to your watchlist?";
    	        var speechOutput = {
    	            speech: speechText,
    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
    	        };
    	        var repromptOutput = {
    	            speech: repromptText,
    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
    	        };
    	        response.ask(speechOutput, repromptOutput);   			
    			
    		}
 
            
    		} else {
    	        speechText = "You have no stocks in your watchlist";
    	        repromptText = "Would you like to add a stock to your watchlist?";
    	        var speechOutput = {
    	            speech: speechText,
    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
    	        };
    	        var repromptOutput = {
    	            speech: repromptText,
    	            type: AlexaSkill.speechOutputType.PLAIN_TEXT
    	        };
    	        response.ask(speechOutput, repromptOutput);   			
    			
    		}
    		
    	});	

	

}

function getAccountID(session) {
	console.log("accountid:");
	console.log (typeof session.attributes.accountid);
	if(typeof session.attributes.accountid == "undefined"){ 
		console.log("getting account id");
	getUserProfileResult(function(prof){
		console.log(prof);
		session.attributes.accountid = prof.profile.account.account_number;
	});
	} 
	return session.attributes.accountid;
}

function getMarketStatusText(callback) {
	getTradierAPI('/v1/markets/clock',callback);
}

function getSearchCompanyResult(search,callback){
	getTradierAPI('/v1/markets/search?q='+encodeURIComponent(search),callback);
}

function getLookupSymbolResult(search,callback){
	getTradierAPI('/v1/markets/lookup?q='+encodeURIComponent(search),callback);
}

function getCompanyResult(search,callback){
	getTradierAPI('/beta/markets/fundamentals/company?symbols='+encodeURIComponent(search),callback);
}

function getQuotesResult(search,callback){
	getTradierAPI('/v1/markets/quotes?symbols='+encodeURIComponent(search),callback);
}

function getUserProfileResult(callback){
	getTradierAPI('/v1/user/profile',callback);
}

function getWatchlistsResult(callback) {
	getTradierAPI('/v1/watchlists',callback);
}

function getWatchlistResult(callback){
	getTradierAPI('/v1/watchlists/default',callback);
}

function addToWatchlistResult(symbols,callback){
	var postData = 'symbols='+ symbols;
	postTradierAPI('/v1/watchlists/default/symbols',postData,callback);
}

function removeStockFromMyWatchlistResult(symbols,callback){
	//var postData = 'symbols='+ symbols;
	deleteTradierAPI('/v1/watchlists/default/symbols/'+encodeURIComponent(symbols),callback);
}

function buyStockResult(symbols,quantity,accountid, callback){
	var postData = 'symbol='+symbols+'&duration=day&side=buy&quantity='+quantity+'&type=market&preview=true';
	postTradierAPI('/v1/accounts/'+accountid+'/orders',postData,callback);
}

function createWatchlistResult(callback){
	var postData = 'symbols=&name=main';
	postTradierAPI('/v1/watchlists',postData,callback);
}

function deleteWatchlistResult(callback){

	deleteTradierAPI('/v1/watchlists/default',callback);
}

function saveUserHistory(session,symbol) {
	var d = new Date();
	var dynamodb = new AWS.DynamoDB.DocumentClient();
	
	var params = {
		    TableName:'UserLookupHistory',
		    Key:{
		        "UserId": session.user.userId,
		        "Symbol": symbol
		    }
	};
    dynamodb.get(params
    	    , function (err, data) {
        if (err) {
            console.error("Unable to get item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("get succeeded:", JSON.stringify(data, null, 2));
            if(data.Item == null ){ 
 
            
            }	
    	
    });
	var params = {
		    TableName:'UserLookupHistory',
		    Item:{
		        "UserId": session.user.userId,
		        "Symbol": symbol,
		        "lookupcount": 0,
		        "lastlookup": d.toString()
		    }
	//	    Key:{
//		        "UserId": session.user.userId,
//		        "Symbol": symbol
//		    },
//		    UpdateExpression: "set lookupcount = lookupcount + :val, lastlookup = :d",
//		    ExpressionAttributeValues:{
//		        ":val":1,
//		        ":d":{"S":d.toString()}
//		    },
//		    ReturnValues:"UPDATED_NEW"
		};
console.log(params);
    dynamodb.put(params
    , function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        }
    });
}

function getTradierAPI(path,callback) {


	   var options = {
	     hostname: 'api.tradier.com',
	     port: 443,
	     path: path,
	     method: 'GET',
	     headers: {
	     'Authorization': 'Bearer ' + SANDBOX_TOKEN,
	     'Accept': 'application/json'
	     }
	   };
	   console.log(options);	   
	   var response = '';
	   https.get(options, function(res) {
	     console.log('statusCode: ', res.statusCode);
	       console.log('headers: ', res.headers) ;

	       res.on('data', function(chunk){
	           response += chunk;
	       });
	       res.on('end', function(){
	    	   console.log(response);
	    	   var resp = JSON.parse(response);
	    	   console.log(resp);
	    	   callback(resp);
	       });

	   }).on('error', function(e) {
	    console.error(e);
	   });
	   
	}

function postTradierAPI(path,postData,callback) {


	   var options = {
	     hostname: 'api.tradier.com',
	     port: 443,
	     path: path,
	     method: 'POST',
	     headers: {
	     'Authorization': 'Bearer ' + SANDBOX_TOKEN,
	     'Accept': 'application/json',
	    	    'Content-Type': 'application/x-www-form-urlencoded',
	    	    'Content-Length': postData.length
	     }
	   };
//	   console.log(options);	   
	   var response = '';
	   var req = https.request(options, function(res) {
//	     console.log('statusCode: ', res.statusCode);
//	       console.log('headers: ', res.headers) ;
	       res.setEncoding('utf8');
	       res.on('data', function(chunk){
	           response += chunk;
	       });
	       res.on('end', function(){
	    	   console.log(response);
	    	   var resp = JSON.parse(response);
//	    	   console.log(resp);
	    	   callback(resp);
	       });

	   }).on('error', function(e) {
	    console.error(e);
	   });
	   req.write(postData);
	   req.end();
	}

function deleteTradierAPI(path,callback) {

	   var options = {
	     hostname: 'api.tradier.com',
	     port: 443,
	     path: path,
	     method: 'DELETE',
	     headers: {
	     'Authorization': 'Bearer ' + SANDBOX_TOKEN,
	     'Accept': 'application/json'
	     }
	   };

	   console.log(options);	   
	   var response = '';

	   https.request(options, function(res) {
	     console.log('statusCode: ', res.statusCode);
	       console.log('headers: ', res.headers) ;

	       res.on('data', function(chunk){
	           response += chunk;
	       });
	       res.on('end', function(){
	    	   console.log(response);
	    	   var resp = JSON.parse(response);
//	    	   console.log(resp);
	    	   callback(resp);
	       });

	   }).on('error', function(e) {
	    console.error(e);
	   }).end();
	}

function getAccessToken(session) {
	return session.user.accessToken;
	
}

//Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var skill = new Tradier();
    skill.execute(event, context);
};
