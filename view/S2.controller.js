/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseMasterController");
jQuery.sap.require("sap.ca.scfld.md.controller.ScfldMasterController");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ui.core.IconPool");
jQuery.sap.require("sap.ui.model.odata.Filter");
jQuery.sap.require("sap.ca.ui.CustomerContext");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ModelUtils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Utils");

sap.ca.scfld.md.controller.ScfldMasterController.extend("cus.sd.zsalesorder.create.view.S2",
{
	//initialization
	onInit : function() {
		sap.ca.scfld.md.controller.ScfldMasterController.prototype.onInit.call(this);
		this.isSalesOrder = true;
		this.setDefaultSelection = false;
        this.customerEvent = 0;
        this.sFilterPattern = "";
        this.lock = false;

		this.oModel = new sap.ui.model.json.JSONModel();
		this.initializeValues();

        this.getList().attachUpdateStarted({}, this.onListUpdateStarted, this);
        this.getList().attachUpdateFinished({}, this.onListUpdateFinished, this);
        //this.getView().getModel().bCountSupported=true;     // FIXME: Enable expensive calls for count to make SalesOrder growing list

        //fix for customer pop up... review if framework resolves the close dialog issue.
        this.getView().addEventDelegate({
            onAfterShow : jQuery.proxy(this.onShow, this)
        });

	},

	onShow:function() {
		var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
		if(! oCartModel   || !oCartModel.getData().CustomerName)
		{
			this._setCustomerControl();
		}
	},

	onListUpdateStarted : function() {
	        this.getView().byId("list").setNoDataText(this.oApplicationFacade.getResourceBundle().getText("LOADING"));
	},
	
	onListUpdateFinished : function(){
	        this.getView().byId("list").setNoDataText(this.oApplicationFacade.getResourceBundle().getText("NO_ITEMS_AVAILABLE"));
	},
	    
	    
	onRequestCompleted : function() {
//        this.getView().getModel().detachRequestCompleted(jQuery.proxy(this.onRequestCompleted, this));
		this.lock = false;
		
		if(sap.ui.Device.system.phone) {
			return;
		}
        if (this.setDefaultSelection ) {
            this.setDefaultSelection = false;

            if (this.getList().getItems().length > 0) {
                if(this.isSalesOrder){
                    this.setListItem(this.getList().getItems()[1]);
                }
                else{
                    this.setListItem(this.getList().getItems()[0]);
                }
            } else {
            	this.getView().byId("list").setNoDataText(this.oApplicationFacade.getResourceBundle().getText("NO_ITEMS_AVAILABLE"));
                this.navToEmpty();
            }
        }
    },

	onNavToSalesOrders : function() {
		if(this.lock){
			return;
		}
		
		this.lock = true;
			
		this.isSalesOrder = true;
		this.updateCustomer();
	},

	onNavToProducts : function() {
		if(this.lock){
			return;
		}
		
		this.lock = true;
		
		this.isSalesOrder = false;
		this.updateCustomer();
	},

	updateCustomer : function(){
		var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");

		if(oCartModel && oCartModel.getData()){
			this.oCustomerID = oCartModel.getData().CustomerNumber;
			this.oCustomerName = oCartModel.getData().CustomerName;
			this.oSalesOrganization = oCartModel.getData().SalesOrganization;
			this.oDivision = oCartModel.getData().Division;
			this.DistributionChannel = oCartModel.getData().DistributionChannel;
			this.CustName = oCartModel.getData().CustomerName;

			if(this.isSalesOrder){
				this.updateSalesOrdersList();
			}
			else{
				this.updateProductsList();
			}
		}
	},

	updateSalesOrdersList : function(){
		var filters = [];
		var sorter = new sap.ui.model.Sorter("PO", false, this.oGroupPO);

		filters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, this.oSalesOrganization));
		filters.push(new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, this.DistributionChannel));
		filters.push(new sap.ui.model.Filter("CustomerID", sap.ui.model.FilterOperator.EQ, this.oCustomerID));
		filters.push(new sap.ui.model.Filter("Division", sap.ui.model.FilterOperator.EQ, this.oDivision));
        filters.push(new sap.ui.model.Filter("SalesOrderNumber", sap.ui.model.FilterOperator.Contains, this.sFilterPattern));

		this.setDefaultSelection = true;
		/* eslint-disable new-cap */
		this.getList().bindItems("/SalesOrders", new sap.ui.xmlfragment("cus.sd.zsalesorder.create.view.ListItemTemplate",this), sorter,filters);
		/* eslint-enable new-cap */
		var sTitle = this.getView().byId("SOC_MasterListHeaderTitle");
		sTitle.setText(this.oApplicationFacade.getResourceBundle().getText("MASTER_TITLE", [this.CustName]));
		this.registerMasterListBind(this.getList());
	},

	updateProductsList : function(){
		var filters = [];
		filters.push(new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, this.oSalesOrganization));
		filters.push(new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, this.DistributionChannel));
		filters.push(new sap.ui.model.Filter("ProductID", sap.ui.model.FilterOperator.Contains, this.sFilterPattern));
		this.setDefaultSelection = true;
		/* eslint-disable new-cap */
		this.getList().bindItems("/Products", new sap.ui.xmlfragment("cus.sd.zsalesorder.create.view.ProductListItemTemplate",this), null,filters);
		/* eslint-enable new-cap */
		var sTitle = this.getView().byId("SOC_MasterListHeaderTitle");
		sTitle.setText(this.oApplicationFacade.getResourceBundle().getText("PRODUCTS_CUST", [this.CustName]));
		this.registerMasterListBind(this.getList());
	},

    oGroupPO : function(oContext) {
        return oContext.getProperty("PO"); // group by first letter of last
        // name
    },

	getHeaderFooterOptions : function() {
		if (sap.ui.Device.system.phone) {
    		return {};
    	}
		//return {onBack: null};
		  //use parent implementation back button to navigate to launchpad
          //https://support.wdf.sap.corp/sap/support/message/1580129827
		return {};
	},

	//taken from wave 1 code base. few variables not required. after review if not reqd we can remove this method.
	initializeValues : function() {
		this.top = 30;			//Initialize top and skip values to retrieve the first set of records from the back-end
		this.skip = 0;
		this.searchSkip = 0;	//Skip value for paging in search mode

		this.firstTime = true;
		this.serverSearch = false;		//True when searching back-end
		this.clientSearch = false;		//True when searching client

		this.latestFetch = 0;			//Number of records last fetched
		this.latestSearchFetch = 0;		//Number of records last fetched in server search
	},

	setListItem : function(oItem) {
		if (oItem && oItem.getBindingContext()) {
			this.setDefaultSelection = false;
			var oList = this.getList();
			oList.removeSelections();
			oItem.setSelected(true);
			oList.setSelectedItem(oItem, true);

			if(this.isSalesOrder){
				this.oRouter.navTo(
						"detail", 
						{contextPath : oItem.getBindingContext().sPath.substr(1)},
						!sap.ui.Device.system.phone
				);
			}
			else{
				this.oRouter.navTo(
						"productdetail", 
						{
							customerID : this.oCustomerID,
							productID :  encodeURIComponent(oItem.getBindingContext().getProperty("ProductID")),
							salesOrganization : this.oSalesOrganization,
							distributionChannel : this.DistributionChannel,
							division : this.oDivision
						}, 
						!sap.ui.Device.system.phone
				);
			}
		}
	},

	navToEmpty : function() {
	    if(this.isSalesOrder){
            this.oRouter.navTo(
            		"noData", 
            		{
            			viewTitle : "SALES_ORDER_DETAIL",
            			languageKey : "NO_ITEMS_AVAILABLE"
            		},
            		!sap.ui.Device.system.phone
            	);
	    } else {
            this.oRouter.navTo(
            		"noData", 
            		{
            			viewTitle : "PRODUCT_DETAIL",
            			languageKey : "NO_ITEMS_AVAILABLE"
            		},
            		!sap.ui.Device.system.phone
            	);
	    }
    },

	// Override onDataLoaded to prevent first item selection error
	onDataLoaded : function() {
	    this.onRequestCompleted();
	},

	applySearchPatternToListItem : function(oItem, sFilterPattern) {
		// if there is no filter
		if (sFilterPattern === "") {
			// then return all objects
			return true;
		}

		// else if this is a group header
		if (!oItem.getBindingContext()) {
			return false;
		}

		// else delegate to parent implementation
		return sap.ca.scfld.md.controller.BaseMasterController.prototype.applySearchPatternToListItem
				.call(null, oItem, sFilterPattern);
	},
	 isLiveSearch : function()
	 {
	 	return true;
	 },

	isBackendSearch : function() {
          return true;
	},

	applyBackendSearchPattern : function(sFilterPattern, oBinding) {

	    this.sFilterPattern = sFilterPattern;
	    var aFilters = [];

	    if(this.isSalesOrder) {
	        aFilters = [
	                	new sap.ui.model.Filter("CustomerID", sap.ui.model.FilterOperator.EQ, this.oCustomerID),
	                    new sap.ui.model.Filter("SalesOrderNumber", sap.ui.model.FilterOperator.Contains, sFilterPattern),
	                    new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, this.oSalesOrganization),
	                    new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, this.DistributionChannel),
	                    new sap.ui.model.Filter("Division", sap.ui.model.FilterOperator.EQ, this.oDivision)
	                ];
	    } else {
            aFilters = [
                        new sap.ui.model.Filter("ProductID", sap.ui.model.FilterOperator.Contains, sFilterPattern),
                        new sap.ui.model.Filter("SalesOrganization", sap.ui.model.FilterOperator.EQ, this.oSalesOrganization),
                        new sap.ui.model.Filter("DistributionChannel", sap.ui.model.FilterOperator.EQ, this.DistributionChannel)
                    ];
	    }


	    this.setDefaultSelection = true;

	    oBinding.filter(aFilters, sap.ui.model.FilterType.Application);
	},

//	/*
//	 * End SO Search
//	 */

	/*
	 * Customer Control Integration
	 */
	_ensurePersonalizationService : function () {
		window.sap = window.sap || {};
		window.sap.ushell = window.sap.ushell || {};
		if (!window.sap.ushell.Container) {
			window.sap.ushell.Container = {
				getService: function (sServiceName) {
					if (sServiceName === "Personalization") {
						return {
							getPersonalizer: function (oConf) {
								var sContainer = (oConf && oConf.container) || "default";
								var sItem = (oConf && oConf.item) || "default";
								var sStorageKey = "sap.ushell.personalization." + sContainer + "." + sItem;
								return {
									getPersData: function () {
										var oDeferred = jQuery.Deferred();
										var sVal = "";
										try {
											if (window.localStorage) {
												sVal = window.localStorage.getItem(sStorageKey) || "";
											}
										} catch (e) {}
										oDeferred.resolve(sVal);
										return oDeferred.promise();
									},
									setPersData: function (sData) {
										var oDeferred = jQuery.Deferred();
										try {
											if (window.localStorage) {
												window.localStorage.setItem(sStorageKey, sData || "");
											}
										} catch (e) {}
										oDeferred.resolve();
										return oDeferred.promise();
									},
									delPersData: function () {
										var oDeferred = jQuery.Deferred();
										try {
											if (window.localStorage) {
												window.localStorage.removeItem(sStorageKey);
											}
										} catch (e) {}
										oDeferred.resolve();
										return oDeferred.promise();
									}
								};
							}
						};
					}
					return null;
				},
				getServiceAsync: function (sServiceName) {
					return Promise.resolve(this.getService(sServiceName));
				}
			};
		}
	},

	_setCustomerControl : function () {
		this._ensurePersonalizationService();

		try {
			this.customerContext = new sap.ca.ui.CustomerContext({
				personalizationPageName: "SRA017_SD_SO_CR",
				showSalesArea: true,
				customerSelected: jQuery.proxy(this.onCustomerSelected, this),
				path: "/Customers"
			});

			this.customerContext.setModel(this.oApplicationFacade.getODataModel());
			this.customerContext.select();
		} catch (err) {
			jQuery.sap.log.warning("CustomerContext initialization note: " + (err && err.message));
		}
	},

	//This is called when the customerContext button is clicked on the view
	//the change() method
	changeInCustomerContext: function () {
		if (!this.customerContext) {
			this._setCustomerControl();
		}
		this.setDefaultSelection = true;
		this.customerChanged = true;
		if (this.customerContext && typeof this.customerContext.change === "function") {
			this.customerContext.change();
		}
	},

	//This is called when a customer is selected in the customer context popup
	onCustomerSelected: function (oEvent) {
		this.setDefaultSelection = true;

		if(this.customerChanged)
		{
			this.customerChanged = false;
			this.customerNewParams = oEvent.getParameters();
			var that = this;
			// Launch the dialog

			sap.ca.ui.dialog.confirmation.open({
				question : 	this.oApplicationFacade.getResourceBundle().getText("CONFIRM_CLEAR_CART"),
				showNote : 	false,
				title : 	this.oApplicationFacade.getResourceBundle().getText("CONFIRMATION"),
				confirmButtonLabel : this.oApplicationFacade.getResourceBundle().getText("YES")
			}, function(oResult) {
				if (oResult.isConfirmed) {
					that.handleCustomerChange(that.customerNewParams);
				}
			});
		}
		else if (this.customerChanged === undefined && oEvent.getParameters().CustomerID === undefined) {	
// Do not read customer data in case no customer was selected			
		}
		else
		{
			this.handleCustomerChange(oEvent.getParameters());
		}
	},

	handleCustomerChange : function(customerParams){
		//THIS LINE CLEARS THE SHOPPING CART
		cus.sd.zsalesorder.create.util.ModelUtils._setCartModel();

		var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
		oCartModel.getData().CustomerName = customerParams.CustomerName;
		oCartModel.getData().CustomerNumber = customerParams.CustomerID;
		oCartModel.getData().SalesOrganization = customerParams.SalesOrganization;
		oCartModel.getData().Division = customerParams.Division;
		oCartModel.getData().DistributionChannel = customerParams.DistributionChannel;
		oCartModel.getData().itemCount = 0;
        oCartModel.getData().SingleShipment = false;
        oCartModel.getData().PurchaseOrder = "";
        oCartModel.getData().NotesToReceiver = "";
        oCartModel.getData().ShippingInstructions = "";

        this.updateCustomer();
        
        if (customerParams.CustomerID)

        //The rest of the code in this function is needed to get the currency.
		var sParameters = "(CustomerID='" + customerParams.CustomerID + "'," +
		"SalesOrganization='" + customerParams.SalesOrganization + "'," +
		"DistributionChannel='" + customerParams.DistributionChannel + "'," +
		"Division='" + customerParams.Division + "')";

		function fnSuccess(response) {
			var oCartMdl = sap.ca.scfld.md.app.Application.getImpl().getApplicationModel("soc_cart");
			oCartMdl.getData().Currency = response.Currency;
	        oCartMdl.updateBindings();
		}

		function fnError(oError) {
			cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage(oError.response);
		}

		this.oApplicationFacade.getODataModel().read("/Customers" + sParameters, null, null, true, fnSuccess, fnError);
	}

});