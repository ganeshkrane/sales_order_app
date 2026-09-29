/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ui.thirdparty.datajs");
jQuery.sap.require("sap.ca.ui.model.type.Date");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Utils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ModelUtils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ServiceHelper");

sap.ca.scfld.md.controller.BaseFullscreenController.extend("cus.sd.zsalesorder.create.view.SalesOrderReviewCart", {
	_oBusyDialog : null,
	onInit : function() {

		this.loadData();

		  sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);
		  this._oBusyDialog = new sap.m.BusyDialog();
		  this.oRouter.attachRouteMatched(function(oEvent) {
				if (oEvent.getParameter("name") === "soReviewCart") {
					this.loadData();
//				var context = new sap.ui.model.Context(view.getModel(), '/' + oEvent.getParameter("arguments").contextPath);
//				view.setBindingContext(context);
				// Make sure the master is here
				}
			}, this);
	  },


loadData : function() {


	var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
	var serviceURL = cus.sd.zsalesorder.create.util.ServiceHelper.getServiceUrl(this);
	//if flag is set to true = json format, false = xml format - this change is done to support empty order creation. 
	var jsonXMLflag = false;
	if(oCartModel.oData.oShoppingCartItems.length === 0)
	{
		jsonXMLflag = true;
	}
	this.oSOCartModel = new sap.ui.model.odata.ODataModel(serviceURL, jsonXMLflag);
	this.getView().setModel(oCartModel,"soc_cart");
	this.getView().getModel("soc_cart").updateBindings();

	//Get the address and concatenate the various address lines
	var oModelData = oCartModel.getData();
	var formattedAddress2 = oModelData.FormattedAddress2;
	var formattedAddress3 = oModelData.FormattedAddress3;
	var formattedAddress4 = oModelData.FormattedAddress4;
	var formattedAddress5 = oModelData.FormattedAddress5;
	var formattedAddress6 = oModelData.FormattedAddress6;
	var formattedAddress7 = oModelData.FormattedAddress7;
	var formattedAddress8 = oModelData.FormattedAddress8;
	var formattedAddress9 = oModelData.FormattedAddress9;

	this.getView().byId("address").setText(cus.sd.zsalesorder.create.util.Formatter.formatAddress(formattedAddress2, formattedAddress3, formattedAddress4,
			formattedAddress5, formattedAddress6, formattedAddress7, formattedAddress8, formattedAddress9));
},

onNavigateSubmit : function() {
	// Launch the dialog
	this._oBusyDialog.open();
	this.salesOrderCreate();
},

onNavigateHome : function() {
	// Go back to customers page
	 this.oRouter.navTo("master", {

	});

},

_onNavigateBack : function() {
	window.history.go(-1);
},


salesOrderCreate : function()
{
	var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
	var oSOJson = {};
	var that = this;

	if(typeof oCartModel.getData().PurchaseOrder === "undefined")
	{
		oCartModel.getData().PurchaseOrder = "";
	}
	if(typeof oCartModel.getData().NotesToReceiver === "undefined")
	{
		oCartModel.getData().NotesToReceiver = "";
	}
	if(typeof oCartModel.getData().ShippingInstructions === "undefined")
	{
		oCartModel.getData().ShippingInstructions = "";
	}

	// Add items to model, not required by the call

	oSOJson.SingleShipment = oCartModel.getData().SingleShipment;
	oSOJson.SalesOrderSimulation = false;
	oSOJson.SalesOrderNumber = "0";
	oSOJson.PO = oCartModel.getData().PurchaseOrder;
	oSOJson.RequestedDate =  oCartModel.getData().singleRdd;
	oSOJson.CustomerID =  oCartModel.getData().CustomerNumber;
	oSOJson.SalesOrganization = oCartModel.getData().SalesOrganization;
	oSOJson.DistributionChannel = oCartModel.getData().DistributionChannel;
	oSOJson.Division = oCartModel.getData().Division;
	oSOJson.ShipmentInstruction = oCartModel.getData().ShippingInstructions;
	oSOJson.NotesToReceiver = oCartModel.getData().NotesToReceiver;
	oSOJson.ShipToPartnerID = oCartModel.getData().PartnerID;
	oSOJson.Payee = oCartModel.getData().payee;
	oSOJson.SalesOrdType = oCartModel.getData().SalesOrdType;
	oSOJson.Indicator= "X",

	oSOJson.OrderItemSet = [];

	var items = oCartModel.getData().oShoppingCartItems;

	var itemNumberFormat = sap.ui.core.format.NumberFormat.getIntegerInstance({minIntegerDigits: 6,	maxIntegerDigits: 6});
	var j = 0;
	var i;
	for (i = 0; i < items.length; i++) { //length of the oCartModel for products
		if(items[i].isVisible === true){
			var oChild = {};
			oChild.Quantity = items[i].qty;
			oChild.UnitofMeasure = items[i].UOM;
			//oChild.NetAmount = items[i].NetAmount;
			oChild.RequestedDeliveryDate = items[i].RDD;


			//oChild.FinalPrice = items[i].FinalPrice;
			oChild.Product =  items[i].Product;
			oChild.SalesOrderNumber = items[i].SalesOrderNumber;
			// TODO generate line item number
			oChild.ItemNumber = itemNumberFormat.format(10 * (i + 1));
			oChild.Currency =  items[i].Currency;

			oSOJson.OrderItemSet[j] = oChild;
			j++;
		}
	}

	that.oSOCartModel.create("/SalesOrders", oSOJson,  {
		success:function(oData, response) {
			that._oBusyDialog.close();
				that.salesOrderCreated(response.data.SalesOrderNumber);

			},

			error:function fnError(oError) {
				that._oBusyDialog.close();
	        	var errorTitle = that.oApplicationFacade.getResourceBundle().getText("ERROR");
	        	cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage(oError.response,errorTitle);
	        }, async: true}
			);
},


salesOrderCreated : function(salesOrderNumber)
{
	var that = this;
	sap.ca.ui.message.showMessageBox({
		type: sap.ca.ui.message.Type.SUCCESS,
		message: cus.sd.zsalesorder.create.util.Formatter.formatSuccessMessage(salesOrderNumber)
	}, function(){
		cus.sd.zsalesorder.create.util.ModelUtils.resetCartKeepCustomers();
		that.onNavigateHome();
	});

},

onCancel :function() {
	var that = this;
	// Launch the dialog
	sap.ca.ui.dialog.confirmation.open({
		question : 	this.oApplicationFacade.getResourceBundle().getText("CONFIRM_CLEAR_CART"),
		showNote : 	false,
		title : 	this.oApplicationFacade.getResourceBundle().getText("CONFIRMATION"),
		confirmButtonLabel : this.oApplicationFacade.getResourceBundle().getText("YES")
	}, function(oResult) {
		if (oResult.isConfirmed) {
			//this.fnClose;
			cus.sd.zsalesorder.create.util.ModelUtils.resetCartKeepCustomers();
			that.onNavigateHome();
		}
	});
},

booleanFormatter : function(bValue)
{
	return this.oApplicationFacade.getResourceBundle().getText(bValue ? "SINGLE_SHIPMENT_YES" : "SINGLE_SHIPMENT_NO");
},

getHeaderFooterOptions : function() {
    var aButtonList = [];

        aButtonList.push({
                sI18nBtnTxt : "PLACE_ORDER",
                onBtnPressed : jQuery.proxy(this.onNavigateSubmit, this)
            });
        
        aButtonList.push({
            sI18nBtnTxt : "CANCEL",
            onBtnPressed : jQuery.proxy(this.onCancel, this)
        });	            

    return {
    	sI18NFullscreenTitle  : "REVIEW_TITLE",
        buttonList : aButtonList,
        onBack : this._onNavigateBack,
        bSuppressBookmarkButton :true
    };
}	


});
