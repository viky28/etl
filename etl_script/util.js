var util=[];

var config = require('./config.json');
var lookups = require("./datalookup.json");
var catdetail = require("./catdatadetail.json");
// var assembler = require('../common/alerts_assembly');
// var winston = require("../common/logger");
var datalookup = require("./datalookup.json");
var _ = require('underscore');




util.listingAddAdditional=function (listing){
    if(!listing.msisdn && !listing.email){
       // winston.log.error("LISTING:reject: msisdn or email not present")
       console.log("LISTING:reject: msisdn or email not present");
        return false;
    }
    if(!listing.category){
       // winston.log.error("LISTING:reject: category not found")
       console.log("LISTING:reject: category not found");
        return false;
    }
    if((!listing.transactiontype)||(!listing.transactiontype.match(/(post|seek)/g))){
        console.log("LISTING:reject: invalid transaction type");
        //winston.log.error("LISTING:reject: invalid transaction type")
        return false;
    }
    if(!listing.userid){
        listing.userid = (listing.msisdn)?listing.msisdn:listing.email;
    }

    if(typeof listing.thumbnail === "object"){
        listing.thumbnail = listing.thumbnail[0];
    }

    // in case thumbnail is empty then make this
    if(listing.images){
        if((!listing.thumbnail)||(listing.thumbnail==="")){
            listing.thumbnail=listing.images[0];
        }
    }

    listing.vetting = "not-vetted";
    if(!listing.postdate)
        listing.postdate=new Date();
    if(!listing.startdate)
        listing.startdate=new Date();
    if(!listing.views){
        listing.views=0;
        listing.views_last_hour=0;
    }
   // util.translateNumericToRange(listing);
    // Now we create all the titles
    //assembler.addTitlesAllLang(listing);
    // Set the Expiry date
    if(!listing.expiryDate){
        var dt = new Date();
        if((config.apiconfig.incontroller.listingvalidity)&&(config.apiconfig.incontroller.listingvalidity[listing.category])){
            dt.setDate(dt.getDate() + config.apiconfig.incontroller.listingvalidity[listing.category]);
        } else {
            dt.setDate(dt.getDate() + config.apiconfig.incontroller.expiryPeriod);
        }
        listing.expiryDate = dt;
        var optinoutdate=new Date();
        optinoutdate.setDate(listing.expiryDate.getDate() - config.apiconfig.incontroller.max_optin_days_prior_to_expiry);
        listing.optinoutdate=optinoutdate;
    }
    var channel=(listing.channel)?listing.channel.toLowerCase():"ussd";
    listing.markers={};
    return true;
}

util.validateListing = function(listing){
    var p = catdetail[listing.category];

    // Hack for Property save alert for wap... we need to get a generic solution
    if(listing.category==="property"){
        if((listing.transactiontype==="seek")&&(listing.propertytransaction==="sell")) listing.propertytransaction = "buy";
        if((listing.transactiontype==="seek")&&(listing.propertytransaction==="lease")) listing.propertytransaction = "rent";
        if((listing.transactiontype==="post")&&(listing.propertytransaction==="buy")) listing.propertytransaction = "sell";
        if((listing.transactiontype==="post")&&(listing.propertytransaction==="rent")) listing.propertytransaction = "lease";
    }
    var ret={
        error:false,
        errormessage:""
    }
    // check the essentials like msisdn transactiontype and category
    if(!p){
        ret.error=true;
        ret.errormessage = ret.errormessage + "invalid category\n";
        return ret;
    }

    if(!listing.msisdn){
        ret.error=true;
        ret.errormessage = ret.errormessage + "msisdn missing\n";
        return ret;
    }


    if(!listing.channel){
        ret.error=true;
        ret.errormessage = ret.errormessage + "invalid channel\n";
        return ret;
    }

    if((!listing.transactiontype)||((listing.transactiontype!=="seek")&&(listing.transactiontype!=="post"))){
        ret.error=true;
        ret.errormessage = ret.errormessage +  "transactiontype needs to be seek or post\n";
        return ret;
    }



    // check the category bits now
    var skip=[];
    _.each(p, function(item){
        if(_.indexOf(skip, item.field)!==-1){
            return;
        }
        if(item.modes){
            if(item.modes.toLowerCase().indexOf(listing.channel.toLowerCase())===-1){
                return;
            }
        }
        if((item.showfor)&&(item.showfor.indexOf(listing.transactiontype)===-1)){
            return;
        }

        // Cecking if any of the fields are complex objects rather than strings.
        if(listing[item.field]){
            if((typeof listing[item.field] !== "string")&&(typeof listing[item.field] !== "number")){
                ret.error=true;
                ret.errormessage = ret.errormessage + item.field + " needs to be a simple string and not an array or object\n";
            }
        }

        // check for mandatory
        if((item.mandatory)&&(item.mandatory==="true")){
            // shows
            if(!listing[item.field]){
                ret.error=true;
                ret.errormessage = ret.errormessage + item.field + " missing\n";
            } else if((""+listing[item.field]).length < 1){
                ret.error=true;
                ret.errormessage = ret.errormessage + item.field + " is empty\n";
            }

        }
        if((item.validation)&&(listing[item.field])){
            if(item.validation==="numeric"){
                if(!isNumeric(listing[item.field])){
                    ret.error=true;
                    ret.errormessage = ret.errormessage + item.field + " is not numeric\n";
                }
            } else if(item.validation==="alphanumeric"){
                if(!isAlphaNumeric(listing[item.field])){
                    ret.error=true;
                    ret.errormessage = ret.errormessage + item.field + " is not alphanumeric (can contain alphabet, numbers, hyphen, comma, period and underscore)\n";
                }
            }
        }


        if((listing[item.field])&&(item.type.substring(0,1) === "#")){
            var reff = lookups[item.type.substring(1)];
            var lookup = _.findWhere(reff, {id:listing[item.field]});
            if(!lookup){
                ret.error=true;
                ret.errormessage = ret.errormessage + item.field + " is not valid\n";
            } else {
                if(lookup.skip){
                    try {
                        skip=skip.concat(lookup.skip);
                    } catch (e) {
                    }
                }
            }
        }
        if((item.mandatory==="true")&&(item.depends)&&(item.depends!=="none")&&(item.depends!=="false")){
            var reff = lookups[item.type.substring(1)];
            var dep = listing[item.depends];
            var lookup = _.findWhere(reff, {id:listing[item.field], parent:dep});
            if(!lookup){
                ret.error=true;
                ret.errormessage = ret.errormessage + item.field + " dependency not met\n";
            }
        }

    });
    return ret;
}
module.exports = util;