/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseDetailController");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ModelUtils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Utils");
jQuery.sap.require("sap.ca.ui.message.message");
jQuery.sap.require("jquery.sap.history");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ServiceHelper");

sap.ca.scfld.md.controller.BaseDetailController.extend("cus.sd.zsalesorder.create.view.S3_Product", {


onInit : function () {

	sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);

	var view = this.getView();

	view.setModel(this.oApplicationFacade.getApplicationModel("soc_cart"), "soc_cart");

    view.setModel(this.oApplicationFacade.getApplicationModel("img"),"img");

	this.getView().setModel(new sap.ui.model.json.JSONModel(this._getInitialData()), "view");// added by ganesh

	this.oRouter.attachRouteMatched(function(oEvent) {

		if (oEvent.getParameter("name") === "productdetail") {

		    var data = oEvent.getParameter("arguments");

			this.updateModel(data);

			this.updateCartIcon();
			
			//jQuery.sap.history.addVirtualHistory();
		}
	}, this);

},

        _getInitialData: function () {
            return {
                status: "Completed/Fully delivered",
 
                // Delivery Information
                deliveryTypeIndex: 0,                       // 0 = Pick Up At, 1 = Deliver To
                collectionAddress: "M001 , BRADLOWS PHUTHADITJHABA , PHUTHADITJHABA",
                deliveryBlock: "",
                applicationId: "",
 
                // License & Transaction
                tvLicenseSale: "EXISTING",
                tvF4: "",
                posTransaction: "00052105",
 
                // Customer
                customerNumber: "103940007",
                customerName: "Doc Malan / 6 EASTERN SERVICE ROAD / SANDTON",
                orderReason: "",
                orderReasonF4: "",
 
                // Financial Details
                lastDeliveryDate: "2026-09-18",             // yyyy-MM-dd, shown as dd.MM.yyyy
                currency: "ZAR",
                totalPrice: 8499.95,
                requestedDownpayment: 8499.95,
                receivedDownpayment: 8499.95,
 
                // Dropdown lists (replace with OData entity sets / value helps)
                deliveryBlocks: [
                    { key: "",   text: "-- Select --" },
                    { key: "01", text: "01 - Credit check" },
                    { key: "02", text: "02 - Awaiting payment" },
                    { key: "03", text: "03 - Customer request" }
                ],
                tvLicenseSales: [
                    { key: "EXISTING", text: "Existing TV License" },
                    { key: "NEW",      text: "New TV License" },
                    { key: "NONE",     text: "No TV License" }
                ],
                orderReasons: [
                    { key: "",    text: "-- Select --" },
                    { key: "100", text: "100 - Standard order" },
                    { key: "200", text: "200 - Replacement" },
                    { key: "300", text: "300 - Warranty" }
                ],
 
                // History dialog (replace with real change-log data)
                history: [
                    { date: "18.09.2026 10:42", user: "JD", action: "Delivery completed" },
                    { date: "18.09.2026 09:15", user: "JD", action: "Downpayment received" },
                    { date: "17.09.2026 16:03", user: "SYSTEM", action: "Order created" }
                ]
            };
        },

updateCartIcon : function(){
	var oCartModel = this.getView().getModel("soc_cart");
	this.getView().setModel(this.oApplicationFacade.getApplicationModel("soc_cart"),"soc_cart");
	if (oCartModel) {
		oCartModel.updateBindings();
	}
},

updateModel : function(data) {
	if(typeof data.productID === "undefined")
	{
		this.byId("header").setVisible(false);
		this.byId("oInformationListLeft").setVisible(false);
		this.byId("add").setVisible(false);
		return;
	}

	// show the information list if it has been hidden
	this.byId("oInformationListLeft").setVisible(true);
	this.getView().invalidate();

	// Construct the parameters
	this.productID = data.productID;
	this.salesOrganization = data.salesOrganization;
	this.distributionChannel = data.distributionChannel;
	this.division = data.division;
	this.customer = data.customerID;

	this.oProductModel = new sap.ui.model.json.JSONModel();

	var sParameters = "(ProductID='" + this.productID + "',SalesOrganization='" +
		this.salesOrganization + "',Division='" + this.division + "',CustomerNo='" + 
		this.customer + "',DistributionChannel='" + this.distributionChannel + "')";

	sap.ca.ui.utils.busydialog.requireBusyDialog();

    var that = this;

    var fnSuccess = function(response) {
        var oView = that.getView();
        var aAttributes = [];
        if (response.ProductAttributes && response.ProductAttributes.results) {
            aAttributes = response.ProductAttributes.results;
        } else if (Array.isArray(response.ProductAttributes)) {
            aAttributes = response.ProductAttributes;
        }

        var oProductData =
        {
            productID :  decodeURIComponent(that.productID),
            productDesc : response.ProductDesc || decodeURIComponent(that.productID),
            productListPrice : response.NetPrice || "0.00",
            currency: response.Currency || "ZAR",
            uom : response.UOM || "EA",
            UnitofMeasureTxt: response.UOMDesc || response.UOM || "EA",
            salesOrganization : that.salesOrganization,
            distributionChannel : that.distributionChannel,
            productAttributes : aAttributes,
            imageFlag: !!response.ImageFlag
        };
        that.oProductModel.setData(oProductData);
        oView.setModel(that.oProductModel, "product");
        that.byId("header").setVisible(true);
        that.byId("oInformationListLeft").setVisible(true);
        that.byId("add").setVisible(true);
        // Get the product image
        if(response.ImageFlag)
        {
            var urlParameters = cus.sd.zsalesorder.create.util.ServiceHelper.getUrlParameters(that);
            var urlWithoutParameters = cus.sd.zsalesorder.create.util.ServiceHelper.getUrlWithoutParameters(that);
            this.metadataUrl = urlWithoutParameters + "/ProductImages('" + that.productID + "')/$value" + urlParameters;
            that.byId("header").setIcon(this.metadataUrl);
        }
        else
        {
            that.byId("header").setIcon(jQuery.sap.getModulePath("cus.sd.zsalesorder.create") + "/img/home/icon_product.png");
        }
        sap.ca.ui.utils.busydialog.releaseBusyDialog();

    };

    var fnError = function(oError) {
        cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage(oError.response);
        sap.ca.ui.utils.busydialog.releaseBusyDialog();
   };

    // Get the product details
	this.oApplicationFacade.getODataModel().read("/Products" + sParameters, null, ["$expand=ProductAttributes"],
			true, fnSuccess, fnError);

},

_goToCart : function(){
	// Navigate to cart view
	this.oRouter.navTo("soCreateCart", {});
},

_addProductToCart : function(){
	if (this._bAddingToCart) {
		return;
	}
	this._bAddingToCart = true;
	var that = this;
	setTimeout(function() {
		that._bAddingToCart = false;
	}, 400);

	var oProductData = this.getView().getModel("product") ? this.getView().getModel("product").getData() : null;
	if (!oProductData || !oProductData.productID) {
		sap.m.MessageToast.show("Product not loaded yet");
		return;
	}

	var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
	if (!oCartModel) {
		cus.sd.zsalesorder.create.util.ModelUtils._setCartModel();
		oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
	}

	var ImageUrlVar;
	if(oProductData.imageFlag)
	{
        var urlParameters = cus.sd.zsalesorder.create.util.ServiceHelper.getUrlParameters(this);
        var urlWithoutParameters = cus.sd.zsalesorder.create.util.ServiceHelper.getUrlWithoutParameters(this);
		ImageUrlVar = urlWithoutParameters + "/ProductImages('" + oProductData.productID + "')/$value" + urlParameters;
	}
	else
	{
		ImageUrlVar = jQuery.sap.getModulePath("cus.sd.zsalesorder.create") + "/img/home/icon_product.png";
	}

	var cartData = oCartModel.getData();
	var singleRdd = cartData.singleRdd || "20260930";
	var nMonth = parseInt(singleRdd.slice(4,6), 10) - 1;
	var dDate = new Date(singleRdd.slice(0,4), nMonth, singleRdd.slice(6,8));

	var numPrice = parseFloat(oProductData.productListPrice || oProductData.NetPrice || "0") || 0;
	var items = (cartData.oShoppingCartItems = cartData.oShoppingCartItems || []);
	var nextItemLine = (items.length + 1) * 10;

	var productItem = {
			itemLine: nextItemLine,
			article: oProductData.productID,
			ProductID : oProductData.productID,
			ProductDesc: oProductData.productDesc,
			qty: 1,
			UOM: oProductData.uom || "EA",
			UnitofMeasureTxt: oProductData.UnitofMeasureTxt || oProductData.uom || "EA",
			pricePerUnit: numPrice,
			itemPrice: numPrice,
			NetPrice: numPrice.toFixed(2),
			nettprice: numPrice,
			salesPersonId: "100167",
			site: "M001",
			itemCategory: "TAN",
			extendedGuaranteeProduct: "EGP-STD",
			rejReason: "",
			addOnFlg: "N",
			currency: oProductData.currency || cartData.Currency || "ZAR",
			RDD: singleRdd,
			ImgUrl : ImageUrlVar,
			isVisible : true,
			formatRDD: dDate
	};

	items.push(productItem);

	cartData.itemCount = items.length;

	oCartModel.updateBindings(true);

	cus.sd.zsalesorder.create.util.ModelUtils.updateCartIcon();

	// create toast message
	var sMessage = this.oApplicationFacade.getResourceBundle().getText("ADDED_ITEM");
   	sap.ca.ui.message.showMessageToast(sMessage || "Product added to cart");
},

_resetProductToCart:function(){
	var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
	if (oCartModel) {
		oCartModel.getData().oShoppingCartItems = [];
		oCartModel.getData().itemCount = 0;
		oCartModel.updateBindings(true);
		cus.sd.zsalesorder.create.util.ModelUtils.updateCartIcon();
		sap.m.MessageToast.show("Cart has been reset");
	}
},

getLength : function(results){
    var length = results ? results.length : 0;
    return this.oApplicationFacade.getResourceBundle().getText("DETAILS_INFORMATION", [length]);
},

_onNavigateBack : function() {
   this.oRouter.navTo("master", {

	});
}

});