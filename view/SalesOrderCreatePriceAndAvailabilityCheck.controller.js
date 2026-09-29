/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Formatter");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ModelUtils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Utils");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("jquery.sap.history");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Validator");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ServiceHelper");

sap.ca.scfld.md.controller.BaseFullscreenController.extend("cus.sd.zsalesorder.create.view.SalesOrderCreatePriceAndAvailabilityCheck", {
	validator: null,
	_oBusyDialog : null,

	onInit : function() {
		
		var currentView = this.getView();
		debugger
		var serviceURL = cus.sd.zsalesorder.create.util.ServiceHelper.getServiceUrl(this);
		this.oSOCartModel = new sap.ui.model.odata.ODataModel(serviceURL, false);
		this._oBusyDialog = new sap.m.BusyDialog();
		//sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);
		currentView.addEventDelegate({
	         onBeforeShow : jQuery.proxy(function(evt) {  
	        	 this.onBeforeShow(evt);
	         },this)
	     });
		 this.byId("items").attachUpdateStarted({}, this.onTableUpdateStarted, this);
		this.oRouter.attachRouteMatched(function(oEvent) {
			if (oEvent.getParameter("name") === "quickCheckout") {
				debugger;
				this.getView().setModel(this.oApplicationFacade.getApplicationModel("soc_cart"),"soc_cart");
				
				this.validator = new cus.sd.zsalesorder.create.util.Validator();
				this.prepData(true);
			}
			var cartModel = this.getView().getModel("soc_cart");
			if (!cartModel) {
				return;
			}
			this.byId("SOC_SINGLE_SHIPMENT_CHECKBOX").setSelected(cartModel.getData().SingleShipment);
		}, this);

		
		
	},

	onTableUpdateStarted : function ()
	{
		var socModel = this.getView().getModel("soc_cart").getData().oShoppingCartItems;
		if(!socModel.length === 0)
	  {
			this._oBusyDialog.open();
	  }
		
	},
	
	onShipAndPay : function() {
		if (this.validator.getInvalidControlsNumber() === 0) {
			var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
			oCartModel.getData().SingleShipment = this.byId("SOC_SINGLE_SHIPMENT_CHECKBOX").getSelected();
			this.oRouter.navTo("soCartDetails", {});
		} else {
			sap.m.MessageBox.show(
					this.getView().getModel("i18n").getProperty("MISSING_INVALID"), 
					sap.m.MessageBox.Icon.ERROR, 
					this.getView().getModel("i18n").getProperty("MISSING_TITLE"), 
					[sap.m.MessageBox.Action.OK]
			);
		}
	},

	onBeforeShow : function(evt) {
		if (evt.firstTime !== true){
			this.getView().setModel(this.oApplicationFacade.getApplicationModel("soc_cart"),"soc_cart");
			this.getView().updateBindings();
			//this.prepData(true);
		}
		//removed to fix the Checkbox issue https://support.wdf.sap.corp/sap/support/message/1472000204
/*		if (evt.isBackToPage !== true)  {
            this.getView().byId("SOC_SINGLE_SHIPMENT_CHECKBOX").setSelected(false);
        }*/
	},

	prepData : function() {
		// clean up previous PNAC data
		var cartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
		if (!cartModel) {
			return;
		}
		var items = cartModel.getData().oShoppingCartItems;

		if (items.length <= 0){
			return;
		}
		this._oBusyDialog.open();
		this.removePnADataFromCartModel();

		var oSOJson = {};
		oSOJson.SalesOrderSimulation = true; //true as its similation call, should be false if its create Sales Order
		oSOJson.SingleShipment = this.byId("SOC_SINGLE_SHIPMENT_CHECKBOX").getSelected();

		var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
		oCartModel.getData().SingleShipment = this.byId("SOC_SINGLE_SHIPMENT_CHECKBOX").getSelected();

		oSOJson.PO = "";
		oSOJson.RequestedDate = this.getView().getModel("soc_cart").getData().singleRdd;
		oSOJson.CustomerID = this.getView().getModel("soc_cart").getData().CustomerNumber;
		oSOJson.SalesOrganization = this.getView().getModel("soc_cart").getData().SalesOrganization;
		oSOJson.DistributionChannel = this.getView().getModel("soc_cart").getData().DistributionChannel;
		oSOJson.Division = this.getView().getModel("soc_cart").getData().Division;
		oSOJson.Currency = this.getView().getModel("soc_cart").getData().Currency;
		oSOJson.Indicator= "",
		oSOJson.OrderItemSet = [];
		// TODO count how many line items first ==> nItemCount

		items = this.getView().getModel("soc_cart").getData().oShoppingCartItems;
		//var itemNumberFormat = sap.ui.core.format.NumberFormat.getIntegerInstance({minIntegerDigits: 6,	maxIntegerDigits: 6});
		var i;
		for (i = 0; i < items.length; i++) { // length of the oCartModel for
													// products
			var oChild = {};
			oChild.Quantity = items[i].qty;
			oChild.UnitofMeasure = items[i].UOM;
			oChild.RequestedDeliveryDate = items[i].RDD;
			oChild.Product = items[i].ProductID;
			oChild.Currency = items[i].Currency;

			// generate line item number when sending response so as to get the same item numbers in the response
			oChild.ItemNumber = cus.sd.zsalesorder.create.util.Formatter.formatItemNumber(i + 1);
			oChild.ProductName = items[i].ProductDesc;
			oSOJson.OrderItemSet[i] = oChild;
		}

		var that = this;
		var test = 0;
		that.oSOCartModel.create("/SalesOrders", oSOJson, {
				success:function(oData, response) {
					// Update the Json model again from the response
					
					cus.sd.zsalesorder.create.util.ModelUtils.updateCartModelFromSimulationResponse(response);
					that._oBusyDialog.close();
				},
				error:function fnError(oError) {
					that._oBusyDialog.close();
	            	var errorTitle = that.oApplicationFacade.getResourceBundle().getText("ERROR");
	            	//cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage(oError.response,errorTitle, true);
	            	var oCartDataModel = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("soc_cart");
	        		var oCartData = oCartDataModel.getData();
	        		var items = oCartData.oShoppingCartItems;
	        		var i;
	        		for (i = 0; i < items.length; i++) {
	        			items[i].isVisible = true;
	        			
	        		}
	        		oCartDataModel.updateBindings();
	            	test = -1;

	            },async: true
		});
		
		if (test === -1){
			return -1;
		}
	},


	removePnADataFromCartModel : function(){
		var oCartData = this.oApplicationFacade.getApplicationModel("soc_cart").getData();
		var items = oCartData.oShoppingCartItems;
		var i;
		for (i = items.length - 1; i > -1 ; i--) {
		    if(items[i].isVisible === false){
		    	items.splice(i, 1);
		        continue;
		    }
		    delete items[i].isVisible;
		    delete items[i].TotalAmount;
		    delete items[i].AvailableQuantity;
		    delete items[i].AvailQuantity;
		    delete items[i].QuantityStatusCode;
		    delete items[i].AvailableQuantityStatus;
		    delete items[i].EstimatedDeliveryDate;
		    delete items[i].EstimatedDelivery;
		    delete items[i].DeliveryStatusCode;
		    delete items[i].EstimatedDeliveryStatus;
		    delete items[i].FinalPrice;
		    delete items[i].NetAmount;
		    //delete items[i].Product;
		    delete items[i].ProductName;
		    delete items[i].Quantity;
		    delete items[i].UnitofMeasure;
		}

		this.oApplicationFacade.getApplicationModel("soc_cart").updateBindings();
		
		
	},

	removeItem : function(event){
		var button = event.getSource();
		var listItem = button.getParent();
		var path = listItem.getBindingContext("soc_cart").getPath();
		
		//Removed for fixing cart item count issue with UI5 1.32.*
		//var cartName = "oShoppingCartItems";
		//var extractPath = path.split("/");
		var itemIndex = path.substr(path.lastIndexOf("/") + 1);
	/*	var i;
		for(i = 0; i < extractPath.length; i++) {
			if(extractPath[i] === cartName) {
				itemIndex = extractPath[i + 1];
				break;
			}
		}*/
		
		var datePickerCellPosition = 3;
		var datePicker = listItem.getCells()[datePickerCellPosition];
		this.validator.unregisterInvalidControl(datePicker.getId());

		// the below is done to avoid the images being re-rendered everytime when list-items gets removed.
		// might not be the best way !
		//mark the to be removed item as null
		//Removed for fixing cart item count issue with UI5 1.32.*
		//listItem.setParent(null);

		//update the model
		cus.sd.zsalesorder.create.util.ModelUtils.deleteCartItemAtIndex(itemIndex);

		//Removed for fixing cart item count issue with UI5 1.32.*
		//this.getView().byId("items").removeItem(listItem);
	},

	onATPCheckUpdate: function(){
		this.prepData();
	},

	onNumberEnter : function(oEvent){
		var textValue = oEvent.getParameters().newValue;
		//		var objRegExp = new RegExp("/^(?!.{8,})\d{1,6}(\.\d{1,2})?$/");
		if(textValue.indexOf("-") !== -1){  // replace -ve values
			var restrictedValue = textValue.replace("-","");
			oEvent.getSource().setValue(restrictedValue);
		}
		if ( !this.isNumberFieldValid(textValue) ){
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
			this.validator.registerInvalidControl(oEvent.getSource().getId());
		}
		else{
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			this.validator.unregisterInvalidControl(oEvent.getSource().getId());
		}
		
	},

	//Commenting method - required for Datepicker control
	setUniformSingleRdd : function(event){
		var datePicker = event.getSource();
		var sDate = event.getParameter("newYyyymmdd");

		if (sDate === null) {
			datePicker.setValueState("Error");
			this.validator.registerInvalidControl(datePicker.getId());
		} else {
			this.getView().getModel("soc_cart").setProperty("/singleRdd", sDate);
			var isSingleShipment = this.getView().byId("SOC_SINGLE_SHIPMENT_CHECKBOX").getProperty("selected");
			if(isSingleShipment === true)
			{
				cus.sd.zsalesorder.create.util.ModelUtils.setUniformRddInCartModel();
			}
			datePicker.setValueState("None");
			this.validator.unregisterInvalidControl(datePicker.getId());
		}
	},

	setSingleShipmentDate: function(event){
		//this.getView().byId("SOC_PAC_RDD").setEditable(true);
		this.getView().getModel("soc_cart").setProperty("/SingleShipment",event.getParameter("selected"));
		if (event.getParameter("selected") === true){
			cus.sd.zsalesorder.create.util.ModelUtils.setUniformRddInCartModel();
			//var temp =this.getView().byId("SOC_PAC_RDD").getEditable();
			//this.getView().byId("SOC_PAC_RDD").setEditable(false);
		}
	},

	//Commenting Logic implemented with DatePicker control. Reverting back to DateInput to get it displayed inside table.
	setUniformRDD : function(event){
		var datePicker = event.getSource();
		var sDate = event.getParameter("newYyyymmdd");

		if (sDate === null) {
			datePicker.setValueState("Error");
			this.validator.registerInvalidControl(datePicker.getId());
		} else {
			event.getSource().getModel("soc_cart").setProperty("RDD",sDate,event.getSource().getBindingContext("soc_cart"));
			var isSingleShipment = this.getView().byId("SOC_SINGLE_SHIPMENT_CHECKBOX").getProperty("selected");
			if(isSingleShipment === true)
			{
				cus.sd.zsalesorder.create.util.ModelUtils.setUniformRddInCartModel();
				var sMessage = this.oApplicationFacade.getResourceBundle().getText("ALERT_SINGLE_SHIPMENT");
		    	sap.ca.ui.message.showMessageToast(sMessage);
			}
			datePicker.setValueState("None");
			this.validator.unregisterInvalidControl(datePicker.getId());
		}
	},

	_onNavigateBack : function() {
		window.history.go(-1);
	},
	
	getHeaderFooterOptions : function() {
	        var aButtonList = [];

	            aButtonList.push({
	                    sI18nBtnTxt : "UPDATE",
	                    onBtnPressed : jQuery.proxy(this.onATPCheckUpdate, this)
	                });
	            
	            aButtonList.push({
                    sI18nBtnTxt : "SHIPPING_AND_PAYMENT",
                    onBtnPressed : jQuery.proxy(this.onShipAndPay, this)
                });	            

	        return {
	        	sI18NFullscreenTitle  : "PRICE_AND_AVAILABILITY_CHECK",
	            buttonList : aButtonList,
	            onBack : this._onNavigateBack,
	            bSuppressBookmarkButton :true
	        };
	    },
		isNumberFieldValid : function(testNumber){
		      var noSpaces = testNumber.replace(/ +/, '');  //Remove leading spaces
		      var isNum = /^\d+$/.test(noSpaces); // test for numbers only and return true or false
		      return isNum; 
		}
	    
});