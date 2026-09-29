/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ModelUtils");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Utils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Validator");

sap.ca.scfld.md.controller.BaseFullscreenController.extend("cus.sd.zsalesorder.create.view.SalesOrderCreateCart" , {
	validator: null,

	onInit : function() {
	  sap.ca.scfld.md.controller.BaseFullscreenController.prototype.onInit.call(this);
	  this.oRouter.attachRouteMatched(function(oEvent) {
			if (oEvent.getParameter("name") === "soCreateCart") {
				var oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
				if (!oCartModel) {
					cus.sd.zsalesorder.create.util.ModelUtils._setCartModel();
					oCartModel = this.oApplicationFacade.getApplicationModel("soc_cart");
				}
				this.getView().setModel(oCartModel, "soc_cart");

				this.validator = new cus.sd.zsalesorder.create.util.Validator();

				// Automatically apply item-level promotion ZP32 to 1st line item & calculate totals
				this._applyPromotionsAndRecalculate();
			}
		}, this);

        var oCartData = {
        formatSingleRdd: new Date(),
        itemCount: 0,
        
        activeTab: "sales",
        isConditionEnabled: true,
        selectedItemLines: [],
        customerStatus:[
          { ProductID:"1005803", Status : "F001", Article : "M" },
          { ProductID:"HT-1000", Status : "F001", Article : "M" },
          { ProductID:"HT-1001", Status : "F001", Article : "M" },
          { ProductID:"HT-1002", Status : "F001", Article : "M" },
          { ProductID:"HT-1003", Status : "F001", Article : "M" },
          { ProductID:"HT-1007", Status : "F001", Article : "M" },
          { ProductID:"HT-1010", Status : "F001", Article : "M" },
          { ProductID:"HT-1020", Status : "F001", Article : "M" },
		  { ProductID:"10000000", Status : "F001", Article : "not M" },
		  { ProductID:"10000001", Status : "F002", Article : "M" },
		  { ProductID:"10000002", Status : "F002", Article : "not M" }
        ],
        conditions: [],
        promotionsCatalog: [
          {
            code: "ZP32",
            name: "Financial Percentage Promo",
            description: "% discount on selected item (Bulktest88 50% off)",
            level: "Item Level",
            discount: "50% off",
            status: "Applied to Item 10",
            badgeState: "Success"
          },
          {
            code: "ZP33",
            name: "Financial Amount Promo",
            description: "Fixed value off selected item (e.g. R200 off replacement remote)",
            level: "Item Level",
            discount: "-R200.00",
            status: "Available",
            badgeState: "Information"
          },
          {
            code: "ZP34",
            name: "Financial Price Promo",
            description: "Special promotional selling price (e.g. Earphones R100)",
            level: "Item Level",
            discount: "Special R100 Price",
            status: "Available",
            badgeState: "Information"
          },
          {
            code: "ZP35",
            name: "Stacked Financial Percentage Promo",
            description: "Buy 2 or more articles and get 10% off purchase",
            level: "Item Level (Tiered)",
            discount: "10% off (qty >= 2)",
            status: "Available",
            badgeState: "None"
          },
          {
            code: "ZP36",
            name: "Stacked Financial Amount Promo",
            description: "Buy 3 or more articles and save R90.00",
            level: "Item Level (Tiered)",
            discount: "-R90.00 (qty >= 3)",
            status: "Available",
            badgeState: "None"
          },
          {
            code: "ZP37",
            name: "Stacked Financial Price Promo",
            description: "Buy 2 for R20.00 or 3 for R30.00",
            level: "Item Level (Bundle)",
            discount: "Bundle Price Scale",
            status: "Available",
            badgeState: "None"
          },
          {
            code: "ZP38",
            name: "Financial Transaction Percentage Promo",
            description: "Basket-wide % discount across whole transaction",
            level: "Header Level",
            discount: "Transaction % Off",
            status: "Available",
            badgeState: "None"
          },
          {
            code: "ZP39",
            name: "Financial Transaction Amount Promo",
            description: "Basket-wide fixed discount (e.g. R20 off order)",
            level: "Header Level",
            discount: "-R20.00 Order",
            status: "Available",
            badgeState: "None"
          },
          {
            code: "ZP40",
            name: "Free Article Promo",
            description: "Purchase main article and get free item automatically added",
            level: "Item Level (Free Good)",
            discount: "Free Article (-100%)",
            status: "Available",
            badgeState: "None"
          },
          {
            code: "ZP42",
            name: "Shipping Fee Percentage Promo",
            description: "Delivery fee discount percentage on Store Order",
            level: "Header / Service",
            discount: "Discounted Shipping",
            status: "Available",
            badgeState: "None"
          },
          {
            code: "ZP45",
            name: "+More Financial Percentage Promo",
            description: "Exclusive +More loyalty cardholder 20% discount",
            level: "Header / Loyalty",
            discount: "20% Loyalty Tier",
            status: "Available",
            badgeState: "None"
          }
        ]
      };

      var oCartModel = new sap.ui.model.json.JSONModel(oCartData);
      this.getView().setModel(oCartModel, "soc_cart1");

	},

  _applyPromotionsAndRecalculate: function() {
    var oCartModel = this.getView().getModel("soc_cart");
    var oCartModel1 = this.getView().getModel("soc_cart1");
    if (!oCartModel) return;

    var cartData = oCartModel.getData();
    var aItems = cartData.oShoppingCartItems || [];
    var sCurrency = "ZAR";
    cartData.Currency = "ZAR";

    var fnIsNotebook17 = function(itm) {
        if (!itm) return false;
        var pId = String(itm.ProductID || itm.article || "").trim().toUpperCase();
        var pDesc = String(itm.ProductDesc || itm.productDesc || "").trim().toLowerCase();
        return pId === "HT-1001" || pDesc.indexOf("notebook basic 17") !== -1;
    };

    var bHasNotebook17 = aItems.some(fnIsNotebook17);

    // Process all line items: Notebook Basic 17 receives special ZP32 promotion layout; others standard
    for (var i = 0; i < aItems.length; i++) {
        var itm = aItems[i];
        itm.currency = "ZAR";
        var isNb17 = fnIsNotebook17(itm);
        var q = parseFloat(itm.qty) || 1;
        var defaultPrice = isNb17 ? 1250.50 : 2250.00;
        var basePrice = parseFloat(itm.origUnitPrice || itm.grossUnitPrice || itm.NetPrice || defaultPrice) || defaultPrice;
        itm.origUnitPrice = basePrice;
        itm.grossUnitPrice = basePrice;

        if (isNb17) {
            // Notebook Basic 17: Financial Percentage Promo (ZP32) with unique strikethrough layout
            itm.isNotebookBasic17 = true;
            itm.hasPromo = true;
            itm.promoCode = "ZP32";
            itm.promoName = "Financial Percentage Promo";
            itm.promoDesc = "Notebook Basic 17 50% discount";
            itm.promoType = "% discount on selected item";
            itm.promoPercent = 50;
            itm.discountPercent = 50;
            itm.discountAmountPerUnit = (basePrice * 0.50);
            itm.pricePerUnit = basePrice - itm.discountAmountPerUnit; // New discounted unit price
            itm.grossPrice = basePrice * q; // Struck-through in special layout
            itm.itemDiscountAmount = itm.discountAmountPerUnit * q;
            itm.itemPrice = itm.pricePerUnit * q; // New discounted net price
            itm.nettprice = itm.itemPrice;
            itm.promotionApplied = "Financial Percentage Promo (ZP32)";
        } else if (!bHasNotebook17 && i === 0) {
            // If Notebook Basic 17 is not yet in cart, maintain 1st line item promotion with standard layout
            itm.isNotebookBasic17 = false;
            itm.hasPromo = true;
            itm.promoCode = "ZP32";
            itm.promoName = "Financial Percentage Promo";
            itm.promoDesc = "Bulktest88 50% off";
            itm.promoType = "% discount on selected item";
            itm.promoPercent = 50;
            itm.discountPercent = 50;
            itm.discountAmountPerUnit = (basePrice * 0.50);
            itm.pricePerUnit = basePrice - itm.discountAmountPerUnit;
            itm.grossPrice = basePrice * q;
            itm.itemDiscountAmount = itm.discountAmountPerUnit * q;
            itm.itemPrice = itm.pricePerUnit * q;
            itm.nettprice = itm.itemPrice;
            itm.promotionApplied = "Financial Percentage Promo (ZP32)";
        } else {
            // Standard line item with standard layout
            itm.isNotebookBasic17 = false;
            itm.hasPromo = false;
            itm.promoCode = "";
            itm.promoName = "";
            itm.promoDesc = "";
            itm.promoType = "";
            itm.promoPercent = 0;
            itm.discountPercent = 0;
            itm.discountAmountPerUnit = 0;
            itm.itemDiscountAmount = 0;
            itm.pricePerUnit = basePrice;
            itm.grossPrice = basePrice * q;
            itm.itemPrice = basePrice * q;
            itm.nettprice = itm.itemPrice;
            itm.promotionApplied = "-";
        }
    }

    // 3. Header Level Financial Totals calculation
    var nGrossTotal = 0;
    var nTotalDiscount = 0;
    var nNetPayable = 0;

    for (var k = 0; k < aItems.length; k++) {
        var itmK = aItems[k];
        var qK = parseFloat(itmK.qty) || 1;
        var gPrice = parseFloat(itmK.grossPrice) || (parseFloat(itmK.origUnitPrice || itmK.pricePerUnit || 0) * qK);
        var dPrice = parseFloat(itmK.itemDiscountAmount) || 0;
        var nPrice = parseFloat(itmK.itemPrice) || (gPrice - dPrice);

        nGrossTotal += gPrice;
        nTotalDiscount += dPrice;
        nNetPayable += nPrice;
    }

    var nVatAmount = nNetPayable * 0.15; // 15% VAT (Pepkor Tax Invoice standard)

    cartData.grossTotal = nGrossTotal;
    cartData.totalDiscount = nTotalDiscount;
    cartData.vatAmount = nVatAmount;
    cartData.payableTotal = nNetPayable;
    cartData.currency = sCurrency;
    cartData.itemCount = aItems.length;

    // 4. Header Level Overview Discounts (matching Document 1)
    var aOverviewDiscounts = [];
    var promoItem = aItems.find(function(it) { return it.hasPromo; });
    if (promoItem) {
        aOverviewDiscounts.push({
            code: promoItem.promoCode || "ZP32",
            name: promoItem.isNotebookBasic17 ? "Notebook Basic 17 50% discount" : (promoItem.promoName || "Financial Percentage Promo"),
            type: "Financial Percentage Promo",
            level: "Item Level",
            rate: "-50.00 %",
            appliesTo: promoItem.ProductDesc || ("Item " + promoItem.itemLine),
            amount: "-" + (promoItem.itemDiscountAmount || 0).toFixed(2),
            currency: sCurrency
        });
    }
    cartData.overviewDiscounts = aOverviewDiscounts;

    // 5. Conditions Table (Pricing Technique: PR00 Gross Price, ZP32 Promo, MWST Tax)
    if (oCartModel1) {
        var aConditions = [];
        for (var idx = 0; idx < aItems.length; idx++) {
            var curItem = aItems[idx];
            var itemLineNo = String(curItem.itemLine || ((idx + 1) * 10));
            aConditions.push({
                itemNumber: itemLineNo,
                conditionType: "PR00",
                conditionDesc: "Base Gross Price (" + (curItem.ProductDesc || "Item") + ")",
                rate: (curItem.origUnitPrice || curItem.pricePerUnit || 0).toFixed(2) + " " + sCurrency,
                per: "1 EA",
                amount: (curItem.grossPrice || 0).toFixed(2) + " " + sCurrency,
                value: (curItem.grossPrice || 0).toFixed(2) + " " + sCurrency,
                category: "Item Level",
                status: "Active"
            });
            if (curItem.hasPromo) {
                aConditions.push({
                    itemNumber: itemLineNo,
                    conditionType: curItem.promoCode || "ZP32",
                    conditionDesc: curItem.promoName + " (" + (curItem.promoDesc || "% discount on selected item") + ")",
                    rate: "50.00- %",
                    per: "1 EA",
                    amount: "-" + (curItem.itemDiscountAmount || 0).toFixed(2) + " " + sCurrency,
                    value: "-" + (curItem.itemDiscountAmount || 0).toFixed(2) + " " + sCurrency,
                    category: "Item Level (Promo)",
                    status: "Applied"
                });
            }
        }

        // Header Conditions
        aConditions.push({
            itemNumber: "Header",
            conditionType: "MWST",
            conditionDesc: "Output VAT (15.0%)",
            rate: "15.00 %",
            per: "Total Order",
            amount: nVatAmount.toFixed(2) + " " + sCurrency,
            value: nVatAmount.toFixed(2) + " " + sCurrency,
            category: "Header Level (Tax)",
            status: "Calculated"
        });

        oCartModel1.setProperty("/conditions", aConditions);
        oCartModel1.setProperty("/itemCount", aItems.length);
    }

    oCartModel.updateBindings(true);
    if (oCartModel1) oCartModel1.updateBindings(true);
  },

  formatCustomerName: function(name) {
    return name || "Riaan Germishuys";
  },

  formatcustomerNumber:function(ProductID){
    if(ProductID){
      var m1 = this.getView().getModel("soc_cart1");
      var list = (m1 && m1.getProperty('/customerStatus')) || [];
      var obj = list.filter(function(e){ return e.ProductID === ProductID; });
      if (obj && obj.length > 0) {
        return obj[0].Status + "-" + obj[0].Article;
      }
      return "F001-M";
    }
    return "F001-M";
  },

  formatoaaMessage:function(ProductID){
    if(ProductID){
      var m1 = this.getView().getModel("soc_cart1");
      var list = (m1 && m1.getProperty('/customerStatus')) || [];
      var obj = list.filter(function(e){ return e.ProductID === ProductID; });
      if (obj && obj.length > 0) {
        if(obj[0].Status === "F001" && obj[0].Article === "not M"){
          return "No Stock Available, Please Remove The Item From Cart";
        }
      }
      return "Available from primary Distribution Center";
    }
    return "Ready to order";
  },

  visibleMessage:function(ProductID){
    return true;
  },

  setType:function(ProductID){
    if(ProductID){
      var m1 = this.getView().getModel("soc_cart1");
      var list = (m1 && m1.getProperty('/customerStatus')) || [];
      var obj = list.filter(function(e){ return e.ProductID === ProductID; });
      if (obj && obj.length > 0) {
        if(obj[0].Status === "F001" && obj[0].Article === "not M"){
          return "Error";
        }
      }
      return "Information";
    }
    return "None";
  },

    onItemSelectionChange: function () {
      var oTable = this.byId("SOC_CART_LIST");
      var oModel = this.getView().getModel("soc_cart");
      var oModel2 = this.getView().getModel("soc_cart1");
      if (!oTable || !oModel) {
        return;
      }
      var aSelectedContexts = oTable.getSelectedContexts();
      var bHasSelection = aSelectedContexts && aSelectedContexts.length > 0;
      oModel2.setProperty("/isConditionEnabled", bHasSelection);

      if (bHasSelection) {
        var aLines = aSelectedContexts.map(function (oCtx) {
          return oCtx.getProperty("itemLine");
        });
        oModel.setProperty("/selectedItemLines", aLines);
      } else {
        oModel.setProperty("/selectedItemLines", []);
        if (oModel2.getProperty("/activeTab") === "conditions") {
          oModel2.setProperty("/activeTab", "sales");
        }
      }
    },

    onPressSalesTab: function () {
      var oModel = this.getView().getModel("soc_cart1");
      if (oModel) {
        oModel.setProperty("/activeTab", "sales");
      }
    },

    onPressConditionsTab: function () {
      var oModel = this.getView().getModel("soc_cart1");
      if (oModel) {
        oModel.setProperty("/activeTab", "conditions");
      }
    },

    onPressPromotionsTab: function () {
      var oModel = this.getView().getModel("soc_cart1");
      if (oModel) {
        oModel.setProperty("/activeTab", "promotions");
      }
    },

    onAddCondition: function () {
      var oModel = this.getView().getModel("soc_cart1");
      if (!oModel) {
        return;
      }
      var aConditions = oModel.getProperty("/conditions") || [];
      var aSelectedLines = oModel.getProperty("/selectedItemLines") || [];
      var sLine = aSelectedLines.length > 0 ? aSelectedLines[0] : "10";

      aConditions.push({
        itemNumber: sLine,
        conditionType: "ZP32",
        conditionDesc: "Financial Percentage Promo",
        rate: "10.00- %",
        per: "1 EA",
        amount: "-10.00 %",
        value: "-100.00 ZAR",
        category: "Item Level",
        status: "Manual"
      });
      oModel.setProperty("/conditions", aConditions);
      oModel.refresh(true);
      sap.m.MessageToast.show("Condition added for Item " + sLine);
    },

    onRemoveCondition: function (oEvent) {
      var oSource = oEvent.getSource();
      var oCtx = oSource.getBindingContext("soc_cart1");
      if (!oCtx) {
        return;
      }
      var sPath = oCtx.getPath();
      var iIndex = parseInt(sPath.split("/").pop(), 10);
      var oModel = this.getView().getModel("soc_cart1");
      var aConditions = oModel.getProperty("/conditions") || [];
      aConditions.splice(iIndex, 1);
      oModel.setProperty("/conditions", aConditions);
      sap.m.MessageToast.show("Condition removed");
    },

	removeItem : function(event) {
		var button = event.getSource();
		var listItem = button.getParent();
		var oCtx = listItem.getBindingContext("soc_cart");
		if (!oCtx) return;
		var path = oCtx.getPath();
		var itemIndex = parseInt(path.substring(path.lastIndexOf('/') + 1), 10);
		
		cus.sd.zsalesorder.create.util.ModelUtils.deleteCartItemAtIndex(itemIndex);
		
		this._applyPromotionsAndRecalculate();
		sap.m.MessageToast.show("Item removed from cart");
	},

	//commented to use Dateinput instead of datepicker.
	setUniformRDD : function(event) {
		var datePicker = event.getSource();
		var sDate = event.getParameter("newYyyymmdd");
		if (sDate === null) {
			datePicker.setValueState("Error");
			if (this.validator) this.validator.registerInvalidControl(datePicker.getId());
		} else {
			datePicker.getModel("soc_cart").setProperty("RDD", sDate, datePicker.getBindingContext("soc_cart"));
			datePicker.setValueState("None");
			if (this.validator) this.validator.unregisterInvalidControl(datePicker.getId());
		}
	},

	//Commenting to allow Dateinput usage
	setUniformSingleRdd : function(event) {
		var datePicker = event.getSource();
		var sDate = event.getParameter("newYyyymmdd");
		if (sDate === null) {
			datePicker.setValueState("Error");
			if (this.validator) this.validator.registerInvalidControl(datePicker.getId());
		} else {
			this.getView().getModel("soc_cart").setProperty("/singleRdd", sDate);
			datePicker.setValueState("None");
			if (this.validator) this.validator.unregisterInvalidControl(datePicker.getId());
		}
	},

	onATPCheck : function() {
    var status = this.byId('statustxtId') ? this.byId('statustxtId').getText() : "";
    if(status==="F001-not M"){
      sap.m.MessageToast.show("No stock available. Remove the item from cart");
      return;
    }
    var oCart = this.getView().getModel("soc_cart");
    var aItems = (oCart && oCart.getProperty('/oShoppingCartItems')) || [];
    if (aItems.length === 0) {
      sap.m.MessageToast.show("Cart is empty. Please add items to proceed.");
      return;
    }
    var arrQty = aItems.map(function(e){ return parseFloat(e.qty) || 1; });
    var totalQty = arrQty.reduce(function(a, b) { return a + b; }, 0);
    if(status==="F002-not M" && totalQty > 7){
      sap.m.MessageToast.show("The requested quantity exceeds the available stock. Only 7 units are available.");
      return;
    }
    this.oRouter.navTo("quickCheckout", {});
	},

    onNavigateHome : function() {
    	this._onNavigateHome();
    },

    _onNavigateHome : function() {
    	var oHistory = sap.ui.core.routing.History.getInstance();
    	var sPreviousHash = oHistory.getPreviousHash();
    	if (sPreviousHash !== undefined && window.history.length > 1) {
    		window.history.go(-1);
    	} else {
    		this.oRouter.navTo("master", {}, true);
    	}

    	var that = this;
    	setTimeout(function() {
    		var currentHash = sap.ui.core.routing.HashChanger.getInstance().getHash();
    		if (currentHash === "soCreateCart" || window.location.hash.indexOf("soCreateCart") !== -1) {
    			that.oRouter.navTo("master", {}, true);
    			sap.ui.core.routing.HashChanger.getInstance().setHash("");
    		}
    	}, 120);
    },

	onNumberEnter : function(oEvent){
		var textValue = oEvent.getParameters().newValue || oEvent.getSource().getValue();

		if(textValue.indexOf("-") !== -1){  // replace -ve values
			var restrictedValue = textValue.replace("-","");
			oEvent.getSource().setValue(restrictedValue);
		}
		if ( !this.isNumberFieldValid(textValue) ){
			oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
			if (this.validator) this.validator.registerInvalidControl(oEvent.getSource().getId());
		}
		else{
			oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
			if (this.validator) this.validator.unregisterInvalidControl(oEvent.getSource().getId());

			// Dynamically recalculate with active promotions
			var oBindingContext = oEvent.getSource().getBindingContext("soc_cart");
			if (oBindingContext) {
				var nQty = parseFloat(textValue) || 1;
				var oCartModel = oBindingContext.getModel();
				oCartModel.setProperty(oBindingContext.getPath() + "/qty", nQty);
				this._applyPromotionsAndRecalculate();
			}
		}
	},
	
	 getHeaderFooterOptions : function() {
	        var aButtonList = [];

	            aButtonList.push({
	                    sI18nBtnTxt : "CONTINUE",
	                    onBtnPressed : jQuery.proxy(this.onATPCheck, this)
	                });

	        return {
	        	sI18NFullscreenTitle  : "CART",
	            buttonList : aButtonList,
	            onBack : jQuery.proxy(this.onNavigateHome, this),
	            bSuppressBookmarkButton :true
	        };
	    },
		isNumberFieldValid : function(testNumber){
		      var noSpaces = testNumber.replace(/ +/,'');  //Remove leading spaces
		      var isNum = /^\d+$/.test(noSpaces); // test for numbers only and return true or false
		      return isNum; 
		},
		
		// Value-Add (Addons) dialog and handlers
		onAddLinkedProd: function (oEvent) {
            var oThis = this;
            var oView = oThis.getView();
            var oBindingContext = oEvent.getSource().getBindingContext('soc_cart');
            var obj = oBindingContext ? oBindingContext.getObject() : {};
            var articleNumber = obj.ProductID || "HT-1000";

            this.dlgAddOnAdd = sap.ui.getCore().byId("dlgAddOnAdd");
            if (!this.dlgAddOnAdd) {
                this.dlgAddOnAdd = sap.ui.xmlfragment("cus.sd.zsalesorder.create.view.AddOnsAdd", this);
                oView.addDependent(this.dlgAddOnAdd);
            }

            var defaultAddons = [
                { mainArtnr: articleNumber, artNr: "AD-1001", desc: "Extended Warranty - 1 Year", price: 49.99 },
                { mainArtnr: articleNumber, artNr: "AD-1002", desc: "Protective Carry Case", price: 24.50 },
                { mainArtnr: articleNumber, artNr: "AD-1003", desc: "Wireless Charging Station", price: 79.00 },
                { mainArtnr: articleNumber, artNr: "AD-1004", desc: "Premium Support Package", price: 99.99 },
                { mainArtnr: articleNumber, artNr: "AD-1005", desc: "Replacement Power Adapter", price: 19.95 }
            ];

            var addOnLines = new sap.ui.model.json.JSONModel();
            jQuery.ajax({
                url: "./localService/mockdata/Addonn.json",
                dataType: "json"
            }).done(function(data) {
                var list = [];
                if (Array.isArray(data) && data.length > 0) {
                    list = data.map(function(item) {
                        return {
                            mainArtnr: articleNumber,
                            artNr: item.artNr,
                            desc: item.desc,
                            price: item.price
                        };
                    });
                }
                addOnLines.setData({ aAddons: list.length > 0 ? list : defaultAddons });
            }).fail(function() {
                addOnLines.setData({ aAddons: defaultAddons });
            }).always(function() {
                oThis.dlgAddOnAdd.setMultiSelect(true);
                oThis.dlgAddOnAdd.setModel(addOnLines, "addon");
                jQuery.sap.syncStyleClass("sapUiSizeCompact", oView, oThis.dlgAddOnAdd);
                oThis.dlgAddOnAdd.open();
            });
        },

        handleSearchAddon: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oBinding = oEvent.getSource().getBinding("items");
            if (oBinding) {
                if (sValue) {
                    var oFilter = new sap.ui.model.Filter("desc", sap.ui.model.FilterOperator.Contains, sValue);
                    oBinding.filter([oFilter]);
                } else {
                    oBinding.filter([]);
                }
            }
        },

        handleCloseAddon: function (oEvent) {
            var aContexts = oEvent.getParameter("selectedContexts");
            if (!aContexts || !aContexts.length) {
                return;
            }

            var oCartModel = this.getView().getModel("soc_cart");
            if (!oCartModel) return;

            var lineItems = oCartModel.getProperty("/oShoppingCartItems") || [];
            var lastItemLine = 0;
            for (var i = 0; i < lineItems.length; i++) {
                var num = parseInt(lineItems[i].itemLine, 10);
                if (!isNaN(num) && num > lastItemLine) lastItemLine = num;
            }
            if (lastItemLine === 0) lastItemLine = lineItems.length * 10;

            var oAddArts = aContexts.map(function (oContext) {
                return oContext.getObject();
            });

            for (var j = 0; j < oAddArts.length; j++) {
                lastItemLine += 10;
                var addOn = oAddArts[j];
                var nPrice = parseFloat(addOn.price) || 0;

                lineItems.push({
                    itemLine: lastItemLine,
                    article: addOn.artNr,
                    ProductID: addOn.mainArtnr,
                    ProductDesc: addOn.desc,
                    description: addOn.desc,
                    addOnArt: addOn.artNr,
                    qty: 1,
                    UOM: "EA",
                    UnitofMeasureTxt: "Each",
                    pricePerUnit: nPrice,
                    itemPrice: nPrice,
                    NetPrice: nPrice.toFixed(2),
                    nettprice: nPrice,
                    salesPersonId: "100167",
                    site: "M001",
                    itemCategory: "TAS",
                    extendedGuaranteeProduct: "EGP-ADD",
                    rejReason: "",
                    addOnFlg: "Y",
                    currency: oCartModel.getData().Currency || "ZAR"
                });
            }

            oCartModel.setProperty("/oShoppingCartItems", lineItems);
            this._applyPromotionsAndRecalculate();
            cus.sd.zsalesorder.create.util.ModelUtils.updateCartIcon();
            sap.m.MessageToast.show(oAddArts.length + " Value-Add item(s) added to cart");
        },
		// custom code ends
	

});