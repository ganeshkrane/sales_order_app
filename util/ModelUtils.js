/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("cus.sd.zsalesorder.create.util.ModelUtils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Formatter");

cus.sd.zsalesorder.create.util.ModelUtils = {

// should be called when single shipment is checked
setUniformRddInCartModel : function()
		{
			var oCartModel = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("soc_cart");

			var newRDD = oCartModel.getData().singleRdd;
			var items = oCartModel.getData().oShoppingCartItems;
			var nMonth = parseInt(newRDD.slice(4,6), 10) - 1;
			var i;
			for ( i = 0; i < items.length; i++) {
				items[i].RDD = newRDD;
				items[i].formatRDD = new Date(newRDD.slice(0,4), nMonth, newRDD.slice(6,8));
			}

			oCartModel.updateBindings();
		},

_setCartModel : function() {

    		var oCartModel = new sap.ui.model.json.JSONModel();

    		var defaultRDD = this._getDateAsString();
    		var nMonth = parseInt(defaultRDD.slice(4,6), 10) - 1;
    		var dDate = new Date(defaultRDD.slice(0,4), nMonth, defaultRDD.slice(6,8));

    		oCartModel.setData({singleRdd : defaultRDD,
    							formatSingleRdd:dDate,
    							itemCount: 0,
    							oShippingInfo:[],
    							oShoppingCartItems : [],
    							CustomerNumber: "1000",
    							CustomerName: "TechCorp Solutions",
    							SalesOrganization: "1000",
    							DistributionChannel: "10",
    							Division: "00",
    							Currency: "ZAR"
    							});

    		//model size is set to display sales orders with more than 100 items correctly in table/list. 
    		//As per UI5 team recommendation we are setting limit for the model. 
    		oCartModel.setSizeLimit(1000);
			sap.ca.scfld.md.app.Application.getImpl().setApplicationModel("soc_cart", oCartModel);

    		this.updateCartIcon();

    },

    _getDateAsString : function(){
    		var d = new Date();
    		d.setDate(d.getDate() + 1);
    		return sap.ca.ui.model.format.DateFormat.getDateInstance({pattern : "yyyyMMdd"}).format(d);

    },

    resetCartKeepCustomers : function() {
    		var oCartModel = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("soc_cart");
    		var defaultRDD = this._getDateAsString();
    		var nMonth = parseInt(defaultRDD.slice(4,6), 10) - 1;
    		var dDate = new Date(defaultRDD.slice(0,4), nMonth, defaultRDD.slice(6,8));

    		oCartModel.setData({singleRdd : defaultRDD,
    							formatSingleRdd:dDate,
    							itemCount: 0,
    							oShippingInfo:[],
    							oShoppingCartItems : [],
    							CustomerNumber : oCartModel.getData().CustomerNumber,
    							CustomerName : oCartModel.getData().CustomerName,
    							DistributionChannel : oCartModel.getData().DistributionChannel,
    							Division : oCartModel.getData().Division,
    							SalesOrganization : oCartModel.getData().SalesOrganization
    							});

    		oCartModel.updateBindings();

    		this.updateCartIcon();

    },

    updateCartIcon : function()
    {
    	var model = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("soc_cart");
    	var data = model.getData();
    	var items = data.oShoppingCartItems;
    	var oImageModel = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("img");
    	oImageModel.getData().cartIcon = items.length > 0 ? "sap-icon://cart-full" : "sap-icon://cart";
    	oImageModel.updateBindings();
    },

    navToCustomers : function ()
    {
    	this.resetCart();
    },

    navToHome : function()
    {
    	this.resetCartKeepCustomer();
    },

   deleteCartItemAtIndex : function (indexNo)
    {
	   	var model = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("soc_cart");
    	var data = model.getData();

    	var items = data.oShoppingCartItems;
		items.splice(indexNo, 1);
		//Removed for fixing cart item count issue with UI5 1.32.*
/*    	if((items.length - 1) < indexNo) {
    		indexNo = 0;
    	}

    	var theItem = items[indexNo];


    	var itemKey = theItem.ItemNumber;

    	if (typeof itemKey === "undefined")
    	{
    		items.splice(indexNo, 1);
    	}
    	else
    	{
    		var currIndex = items.length;

    		while (currIndex--)
    		{
    			var currItemKey = items[currIndex].ItemNumber;

    			if (currItemKey === itemKey)
    			{
    				items.splice(currIndex, 1);
    			}
    		}
    	}*/

    	if(!items.length)
    	{
    		delete data.Freight;
    		delete data.GrandTotal;
    		delete data.Tax;
    		delete data.TotalAmount;
    	}
		//Added for fixing cart item count issue with UI5 1.32.*
		model.setData(data);
		
    	data.itemCount = cus.sd.zsalesorder.create.util.ModelUtils.getCartCount();
    	model.updateBindings();
    	this.updateCartIcon();

    },


    updateCartModelFromSimulationResponse : function(response) {
		var oCartDataModel = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("soc_cart");
		var oCartData = oCartDataModel.getData();

		var oldItemsMap = {};
		var oldItems = oCartData.oShoppingCartItems;
		var i;
		for (i = 0; i < oldItems.length; i++) {
			var iNo = cus.sd.zsalesorder.create.util.Formatter.formatItemNumber(i + 1);
			oldItemsMap[iNo] = oldItems[i];
		}

		oCartData.TotalAmount = response.data.TotalAmount;
		oCartData.GrandTotal = response.data.GrandTotal;
		oCartData.Tax = response.data.Tax;
		oCartData.Freight = response.data.Freight;
		oCartData.PaymentTerms = response.data.PaymentTerms;

		if ( response.data.OrderItemSet !== null ) {
			oCartData.oShoppingCartItems = response.data.OrderItemSet.results;
		} else {
			oCartData.oShoppingCartItems = [];
		}
		var items = oCartData.oShoppingCartItems;
		this.formatCartModel(items, oldItemsMap);

		oCartDataModel.updateBindings();

    },
    
    formatCartModel : function(items, oldItemsMap) {
		var sSuccessStatus = sap.ui.core.ValueState.Success;
		var sWarningStatus = sap.ui.core.ValueState.Warning;
		var sErrorStatus = sap.ui.core.ValueState.Error;
		var sNoneStatus = sap.ui.core.ValueState.None;
    	var i;
		for ( i = 0; i < items.length; i++) { // length of the oCartModel for products
			items[i].isVisible = i > 0 ? items[i].ItemNumber !== items[i - 1].ItemNumber : true;

			if(!(i > 0 && items[i].ItemNumber === (items[i - 1].ItemNumber))){
				var iNum = items[i].ItemNumber;
				items[i].ImgUrl = oldItemsMap[iNum].ImgUrl;
				items[i].qty = oldItemsMap[iNum].qty;
				items[i].RDD = oldItemsMap[iNum].RDD;
				items[i].UOM = oldItemsMap[iNum].UOM;
				items[i].UnitofMeasureTxt = oldItemsMap[iNum].UnitofMeasureTxt;

				items[i].ProductID = items[i].Product;
				items[i].ProductDesc = items[i].ProductName;
				if (items[i].RDD){
				var nMonth = parseInt(items[i].RDD.slice(4,6), 10) - 1;
				items[i].formatRDD = new Date(items[i].RDD.slice(0,4), nMonth,items[i].RDD.slice(6,8));
				}
				else {
					items[i].formatRDD = new Date();
				}

			}

			items[i].AvailableQuantity = parseFloat(items[i].AvailableQuantity);
			//var oResourceBundle = sap.ca.scfld.md.app.Application.getImpl().getResourceBundle();
			// set AvailableQuantity status
			var sFormattedAvailableQuantity =  cus.sd.zsalesorder.create.util.Formatter.convertFloatToLocaleNoDecimalHandling(items[i].AvailableQuantity);
			switch(items[i].QuantityStatusCode)
			{

			case "A":
				items[i].AvailableQuantityStatus = sSuccessStatus;
				items[i].AvailQuantity = cus.sd.zsalesorder.create.util.Formatter.formatQuantityStatusA();
			  break;
			case "B":
				items[i].AvailableQuantityStatus = sWarningStatus;
				items[i].AvailQuantity = sFormattedAvailableQuantity;
			  break;
			default:
				items[i].AvailableQuantityStatus = sNoneStatus;
				items[i].AvailQuantity = items[i].AvailableQuantity;
			}

			// set EstimatedDelivery status
			switch(items[i].DeliveryStatusCode)
			{

			case "A":
				items[i].EstimatedDeliveryStatus = sSuccessStatus;
				items[i].EstimatedDelivery = cus.sd.zsalesorder.create.util.Formatter.formatDeliveryStatusA();
			  break;
			case "B":
				items[i].EstimatedDeliveryStatus = sWarningStatus;
				items[i].EstimatedDelivery = cus.sd.zsalesorder.create.util.Formatter.convertDateToLocaleMedium(items[i].EstimatedDeliveryDate);
			  break;
			case "C":
				items[i].EstimatedDeliveryStatus = sErrorStatus;
				items[i].EstimatedDelivery = cus.sd.zsalesorder.create.util.Formatter.formatDeliveryStatusC();

				items[i].AvailableQuantityStatus = sErrorStatus;
				items[i].AvailQuantity = cus.sd.zsalesorder.create.util.Formatter.formatSignQuantity(sFormattedAvailableQuantity);
			  break;
			default:
				items[i].EstimatedDeliveryStatus = sNoneStatus;
				items[i].EstimatedDelivery = items[i].EstimatedDeliveryDate;

			}

		}
    },

      getCartCount : function() {
   	   		var oCartDataModel = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("soc_cart");

	  		var oCartData = oCartDataModel.getData();

	  		var items = oCartData.oShoppingCartItems;

	  		var count = 0;
	  		var i;
	  		for (i = 0; i < items.length; i++) {
	  			if(items[i].isVisible === true)
	  			{
	  				count++;
	  			}
	  		}
	  		return count;

 		}



};