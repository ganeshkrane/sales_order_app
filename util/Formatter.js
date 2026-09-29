/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("cus.sd.zsalesorder.create.util.Formatter");
jQuery.sap.require("sap.ui.thirdparty.datajs");
jQuery.sap.require("sap.ca.ui.model.format.DateFormat");
jQuery.sap.require("sap.ca.ui.model.format.NumberFormat");
jQuery.sap.require("sap.ca.ui.model.format.AmountFormat");
jQuery.sap.require("sap.ca.ui.model.format.QuantityFormat");

cus.sd.zsalesorder.create.util.Formatter = {

//convert date display format according user's browser setting
convertDateToLocaleMedium : function(sValue){
	var oDateFormat = sap.ca.ui.model.format.DateFormat.getDateInstance({style:"medium"});
	var oDate = oDateFormat.parse(sValue);
	return oDateFormat.format(oDate);
},

convertFloatToLocaleNoDecimalHandling : function(sValue){

	var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();

	var oNnumberFormat = sap.ca.ui.model.format.NumberFormat.getInstance({ decimals :"0"
		},
		oLocale
	);
	return oNnumberFormat.format(sValue);
},

formatItemNumber : function(itemNumber){
	var itemNumberFormat = sap.ui.core.format.NumberFormat.getIntegerInstance({minIntegerDigits: 6,	maxIntegerDigits: 6});
	return itemNumberFormat.format(10 * itemNumber);
},

formatOrderDate:function (sDate) {
    return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("ORDERED", [sDate]);
},

formatRequestDate:function (sDate) {
    return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("REQUESTED", [sDate]);
},

// combine SHIP_TO with Customer name
formatSOTo: function (sCustomer) {
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("SHIP_TO", [sCustomer]);
},

formatCurrencyPerUnit: function(sCurrency, sUOM){
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("CURRENCY_PER_UOM_EX", [sCurrency, sUOM]);
},

formatAddress : function() {
	if (arguments.length === 0) {// zero arguments returns empty string
		return "";
	}
	if (arguments.length === 1) {// one argument returns the same argument
		return arguments[arguments.length - 1];
	}
	var i = 0;
	var address = arguments[i];
	for (i = 1; i < arguments.length; i++) {// multiple arguments return comma separated string
		if (arguments[i]) { // don't handle empty arguments
			address = sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("ADDRESS_ELEMENT", [address, arguments[i]]);
		}
	}
	return address;
},

formatProductNoId: function(sId){
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("PRODUCT_NO_EX", [sId]);
},

formatPrice : function(fPrice, sCurrency){
	return sap.ca.ui.model.format.AmountFormat.getInstance(sCurrency).format(fPrice);
},

formatProductIDDesc : function(productID, productDesc) {
	if(typeof productID === "undefined" || typeof productDesc === "undefined") {
		return "";
	}
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("PRODUCT_ID_DESCRIPTION", [productID, productDesc]);
},

//strips leading zeros from a number string
stripLeadingZeros : function(sValue) {
    if (typeof sValue === "string") {
        return parseInt(sValue, 10);
    }
    return sValue;
},

getTextPar : function(key, parameter) {
    if(!parameter) {
        parameter = "";
    }

    return jQuery.sap.formatMessage(key, [parameter]);
},

formatItemNumberProductName : function(itemNumber, productName) {
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("ITEMNO_PRODUCTNAME", [cus.sd.zsalesorder.create.util.Formatter.stripLeadingZeros(itemNumber) , productName]);
},

formatSignQuantity : function(sSignQuantity){
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("SIGNQUANTITY", [sSignQuantity]);
},

formatQuantityStatusA : function(){
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("QUANTITY_STATUS_A");
},

formatDeliveryStatusA : function(){
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("DELIVERY_STATUS_A");
},

formatDeliveryStatusC : function(){
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("DELIVERY_STATUS_C");
},

formatQuantityUnitofMeasure : function(quantity, unitofMeasure) {
	/* eslint-disable new-cap */
	return sap.ca.scfld.md.app.Application.getImpl()
		.getResourceBundle().getText("QUANTITY_UOM", [sap.ca.ui.model.format.QuantityFormat.FormatQuantityStandard(quantity,unitofMeasure,0) , unitofMeasure]);
	/* eslint-enable new-cap */
},

formatSuccessMessage : function(salesOrderNumber) {
	return sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("SUCCESS", [salesOrderNumber]);
}


};