/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ModelUtils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Utils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ServiceHelper");
jQuery.sap.require("sap.ca.ui.model.type.Date");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ServiceHelper");

sap.ca.scfld.md.controller.BaseDetailController.extend("cus.sd.zsalesorder.create.view.S3", {
	_oBusyDialog : null,
	onInit: function() {
        //execute the onInit for the base class BaseDetailController
        sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);

        this.getView().setModel(this.oApplicationFacade.getODataModel(),"so_mainmodel");
        this._oBusyDialog = new sap.m.BusyDialog();
        var socCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
        if (socCartModel === null) {
        	cus.sd.zsalesorder.create.util.ModelUtils._setCartModel();
        	socCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
        }
        this.getView().setModel(socCartModel,"soc_cart");

        var imgModel = this.oApplicationFacade.getApplicationModel("img");
        if (!imgModel.oData.cartIcon) { 
        	imgModel.oData.cartIcon = "sap-icon://cart";
        }
        this.getView().setModel(imgModel, "img");

        var view = this.getView();

        this.getView().getModel().attachRequestFailed(jQuery.proxy(this.onRequestFailed, this));

        this.oRouter.attachRouteMatched(function(oEvent) {
        	if (oEvent.getParameter("name") === "detail") {
        		// In order to get address for object header - expand orderitemset
        		//view.bindElement("/" + oEvent.getParameter("arguments").contextPath, {expand : "OrderItemSet"});
				var context = new sap.ui.model.Context(view.getModel(), "/" + oEvent.getParameter("arguments").contextPath);
				view.setBindingContext(context);
				this.refresh(context);
        		this.updateCartIcon();
        	}
        }, this);
    },

    onRequestFailed : function() {
    	 this.oRouter.navTo("noData", {
             viewTitle : "SALES_ORDER_DETAIL",
             languageKey : "NO_ITEMS_AVAILABLE"
         });

		  this.getView().getModel().detachRequestFailed(jQuery.proxy(this.onRequestFailed, this));

		},

    updateCartIcon : function(){
    	this.getView().setModel(this.oApplicationFacade.getApplicationModel("soc_cart"),"soc_cart");
		var oCartModel = this.getView().getModel("soc_cart");
		if (oCartModel) {
			oCartModel.updateBindings();
		}
    },


    _quickCheckout : function(){
    	this._oBusyDialog.open();
    	var bindingContext = this.getView().getBindingContext();
    	var path = bindingContext.sPath;
    	path = path.substr(1);
    	
		//Access the bound data for this page using the path.
		var modelData = new sap.ui.model.json.JSONModel();
		modelData.setData(bindingContext.getModel().oData[path]);
		this.oApplicationFacade.setApplicationModel("soc_mainmodel", modelData);
		
    	this.oRouter.navTo("quickCheckout", {});
    	this._oBusyDialog.close();
    },

    _loadItemsModel : function() {
    	var oSOItemsModel = new sap.ui.model.json.JSONModel();
    	var newService = this.oApplicationFacade.getODataModel();
    	//var that = this;
    	var oParam = ["$expand=OrderItemSet"];
    	newService.read("/SalesOrders('" + this.getView().getBindingContext().getProperty("SalesOrderNumber") + "')", null, oParam, false,
    		function(oData) {
    			oSOItemsModel.setData(oData);
    			oSOItemsModel.updateBindings();
	     	},
	     	function fnError(oError) {
	     		cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage(oError.response);
	     	}
	     );

	     this.getView().setModel(oSOItemsModel,"soc_itemDetails");
    },

    _loadCustomers : function(){
    	var oCustModel = new sap.ui.model.json.JSONModel();
     	var newService = this.oApplicationFacade.getODataModel();
    	//var that = this;

     	newService.read("/Customers", null, null, false,
     		function(oData) {
     			oCustModel.setData(oData);
     			oCustModel.updateBindings();
 	    	},
 	    	function fnError(oError) {
 	    		cus.sd.zsalesorder.create.utils.Utilities.dialogErrorMessage(oError.response);
 	    	}
     	);

 	    this.getView().setModel(oCustModel,"soc_customers");
    },

    _goToCart : function ()
    {
    	this.oRouter.navTo("soCreateCart", {});
    },

    _addProductToCart : function(){
    	this._loadItemsModel();
    	// get the items from the json.
    	var oItemsModel = this.getView().getModel("soc_itemDetails");
    	var data = oItemsModel.getData();
    	var items = this.oApplicationFacade.getApplicationModel("soc_cart").getData().oShoppingCartItems;
//    	var defaultRDD = oItemsModel.getData().singleRdd;
    	var defaultRDD = cus.sd.zsalesorder.create.util.ModelUtils._getDateAsString();
    	var nMonth = parseInt(defaultRDD.slice(4,6), 10) - 1;
    	var dDate = new Date(defaultRDD.slice(0,4), nMonth, defaultRDD.slice(6,8));
    	var currency = null;
    	var i;
    	for(i = 0; i < data.OrderItemSet.results.length; i++){
    		var orderItem = data.OrderItemSet.results[i];
    		
    		if(!currency && orderItem.Currency){
    			currency = orderItem.Currency;
    		}
    		
    		var imageURL;

    		if(orderItem.ImageFlag)
    		{
    	        var urlParameters = cus.sd.zsalesorder.create.util.ServiceHelper.getUrlParameters(this);
    	        var urlWithoutParameters = cus.sd.zsalesorder.create.util.ServiceHelper.getUrlWithoutParameters(this);
    			imageURL = urlWithoutParameters + "/ProductImages('" + orderItem.MaterialNumber + "')/$value" + urlParameters;
    		}
    		else
    		{
    			imageURL = jQuery.sap.getModulePath("cus.sd.zsalesorder.create") + "/img/home/icon_product.png";
    		}

    		var item = {
    				ProductID : orderItem.MaterialNumber,
    	            ProductDesc: orderItem.ProductName,
    	            qty: parseFloat(orderItem.Quantity),
    	            UOM: orderItem.UnitofMeasure,
    	            UnitofMeasureTxt: orderItem.UnitofMeasureTxt,
    	            RDD: defaultRDD,
    	            formatRDD:dDate,
    	            NetPrice: orderItem.NetAmount,
    	            Currency: orderItem.Currency,
    	          //  ImgUrl : imageURL,
    	            isVisible : true
    		};

    		items.push(item);
    	}

    	var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
    	
    	if(!oCartModel.getData().Currency && currency){
			oCartModel.getData().Currency = currency;
	        oCartModel.updateBindings();
    	}

    	oCartModel.getData().itemCount = cus.sd.zsalesorder.create.util.ModelUtils.getCartCount();

    	oCartModel.updateBindings();

    	cus.sd.zsalesorder.create.util.ModelUtils.updateCartIcon();

    	var sMessage = this.oApplicationFacade.getResourceBundle().getText("ADDED_ITEM");

    	sap.ca.ui.message.showMessageToast(sMessage);
    	this.getView().setModel(this.oApplicationFacade.getApplicationModel("soc_cart"),"soc_cart");
    },

	_loadModel : function(){
		var oSOModel = new sap.ui.model.json.JSONModel();
		var soService = this.oApplicationFacade.getODataModel();
		//var that = this;

		soService.read("/SalesOrders", null, null, false,
			function(oData) {
				oSOModel.setData(oData);
				oSOModel.updateBindings();
			},
			function fnError(oError) {
				cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage(oError.response);
			}
		);

		this.getView().setModel(oSOModel,"so_models");
	},
	
    refresh : function() {

        var applicationFacade = this.oApplicationFacade;
		var oViewDetails = this.getView();
        var oModelPath = oViewDetails.getBindingContext().getPath();
        var oModel = oViewDetails.getModel();
        var detailIndex = 0;
        var itemsIndex = 1;
        oModel.addBatchReadOperations([
           oModel.createBatchOperation(oModelPath, "GET"),
           oModel.createBatchOperation(oModelPath + "/OrderItemSet", "GET")]);
        oModel.submitBatch(function (oData) {
			var detailsModel = new sap.ui.model.json.JSONModel();
			detailsModel.setData(oData.__batchResponses[detailIndex].data);
	        oViewDetails.setModel(detailsModel, "LocalDetails");
	        
	        var itemsInvoiceModel = new sap.ui.model.json.JSONModel();        
	        itemsInvoiceModel.setData(oData.__batchResponses[itemsIndex].data.results);
	        oViewDetails.setModel(itemsInvoiceModel, "LocalOrderItems");
	        var length = itemsInvoiceModel.getData() ? itemsInvoiceModel.getData().length : 0;
	        oViewDetails.byId("soItemDetail").byId("oOrderItems").setHeaderText(applicationFacade.getResourceBundle().getText("SO_ITM_ORD_ITMS", [length]));
        });
    }
});
