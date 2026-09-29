/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ca.scfld.md.controller.BaseFullscreenController");
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("cus.sd.zsalesorder.create.util.Utils");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ServiceHelper");
jQuery.sap.require("cus.sd.zsalesorder.create.util.ModelUtils");

sap.ca.scfld.md.controller.BaseFullscreenController.extend("cus.sd.zsalesorder.create.view.SalesOrderCartDetails", {

	_oBusyDialog : null,
    onInit : function() {
        this._view = this.getView();

        if (this.getOwnerComponent && this.getOwnerComponent()) {
            this.oRouter = this.getOwnerComponent().getRouter();
        }

        sap.ca.scfld.md.controller.BaseDetailController.prototype.onInit.call(this);

        this._oBusyDialog = new sap.m.BusyDialog();

        this._ensureCartModel();

        if (this.oRouter) {
            this.oRouter.attachRouteMatched(function(oEvent) {
                if (oEvent.getParameter("name") === "soCartDetails") {
                    this.reloadData();
                    this.readPayee(); 
                }
            }, this);
        }

        this.reloadData();
        this.readPayee();
    },

    _ensureCartModel: function () {
        var oComponent = this.getOwnerComponent ? this.getOwnerComponent() : null;
        var oCartModel = (oComponent && oComponent.getModel("soc_cart")) || this.getView().getModel("soc_cart");
        if (!oCartModel) {
            var oInitData = {
                CustomerNumber: "100029",
                CustomerName: "Doc Malan / 6 EASTERN SERVICE ROAD / SANDTON",
                SalesOrganization: "1000",
                DistributionChannel: "10",
                Division: "00",
                PurchaseOrder: "PO-2026-98104",
                singleRdd: "20260925",
                formatSingleRdd: new Date(),
                itemCount: 3,
                PhoneNumber: "+27 11 883 4500",
                ShipToCarrier: "DHL Supply Chain",
                ShipToIncoTerms: "FOB - Free on Board",
                ShippingInstructions: "Deliver during morning hours (08:00 - 12:00). Contact receiving manager upon arrival.",
                NotesToReceiver: "Check packaging integrity for fragile electronics before offloading.",
                CampaignCode: "CAMP-2026-Q3",
                PromotionID: "PROMO-SPRING",
                MarketingChannel: "DIRECT",
                CommissionRep: "REP-8842",
                oShoppingCartItems: [
                    {
                        itemLine: "10",
                        article: "1000234",
                        qty: 1,
                        UOM: "EA",
                        UnitofMeasureTxt: "EA",
                        Product: "HT-1000",
                        ProductID: "HT-1000",
                        ProductDesc: "Samsung 65\" Crystal UHD 4K Smart TV",
                        pricePerUnit: 7499.00,
                        itemPrice: 7499.00,
                        Currency: "ZAR",
                        currency: "ZAR",
                        salesPersonId: "SP-4092",
                        site: "S001",
                        itemCategory: "TAN",
                        extendedGuaranteeProduct: "EG-2YR",
                        rejReason: "",
                        addOnFlg: "N",
                        isVisible: true,
                        RDD: "20260925",
                        SalesOrderNumber: "0"
                    },
                    {
                        itemLine: "20",
                        article: "1000567",
                        qty: 2,
                        UOM: "EA",
                        UnitofMeasureTxt: "EA",
                        Product: "HT-1050",
                        ProductID: "HT-1050",
                        ProductDesc: "Wireless Noise-Canceling Bluetooth Headphones",
                        pricePerUnit: 500.47,
                        itemPrice: 1000.95,
                        Currency: "ZAR",
                        currency: "ZAR",
                        salesPersonId: "SP-4092",
                        site: "S001",
                        itemCategory: "TAN",
                        extendedGuaranteeProduct: "None",
                        rejReason: "",
                        addOnFlg: "N",
                        isVisible: true,
                        RDD: "20260925",
                        SalesOrderNumber: "0"
                    },
                    {
                        itemLine: "30",
                        article: "1000892",
                        qty: 1,
                        UOM: "PC",
                        UnitofMeasureTxt: "PC",
                        Product: "HT-1080",
                        ProductID: "HT-1080",
                        ProductDesc: "Ultra-Slim Wall Mount Bracket 55-75\"",
                        pricePerUnit: 499.00,
                        itemPrice: 499.00,
                        Currency: "ZAR",
                        currency: "ZAR",
                        salesPersonId: "SP-3118",
                        site: "S001",
                        itemCategory: "TAN",
                        extendedGuaranteeProduct: "None",
                        rejReason: "",
                        addOnFlg: "N",
                        isVisible: true,
                        RDD: "20260925",
                        SalesOrderNumber: "0"
                    }
                ],
                activeTab: "sales",
                isConditionEnabled: false,
                conditions: [
                    {
                        conditionType: "PR00 - Price",
                        amount: "7,499.00",
                        per: "1 EA",
                        value: "7,499.00 ZAR"
                    },
                    {
                        conditionType: "K004 - Material Discount",
                        amount: "150.00-",
                        per: "1 EA",
                        value: "150.00- ZAR"
                    }
                ],
                attachments: [
                    {
                        id: "att_1",
                        fileName: "DocMalan_Tax_Exemption.pdf",
                        fileSize: "142.5 KB",
                        fileType: "application/pdf",
                        uploadDate: "2026-09-28",
                        isPdf: true,
                        url: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA3Mwo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGROCihTYWxlcyBPcmRlciBQRC1Db25maXJtYXRpb24gQXR0YWNobWVudCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE5IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjQ5IDAwMDAwIG4gCjAwMDAwMDAzNzIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxNDU2CiUlRU9G"
                    },
                    {
                        id: "att_2",
                        fileName: "Special_Delivery_Specifications.txt",
                        fileSize: "18.2 KB",
                        fileType: "text/plain",
                        uploadDate: "2026-09-28",
                        isPdf: false,
                        url: "data:text/plain;charset=utf-8," + encodeURIComponent("Delivery Specifications for Doc Malan:\n- Loading Dock Gate 2\n- Pallet jack required for offloading\n- Contact: +27 11 883 4500")
                    }
                ]
            };
            oCartModel = new sap.ui.model.json.JSONModel(oInitData);
            if (oComponent) {
                oComponent.setModel(oCartModel, "soc_cart");
            }
            this.getView().setModel(oCartModel, "soc_cart");
        }
    },

    reloadData : function() {

        this.oCartModel = (this.oApplicationFacade && this.oApplicationFacade.getApplicationModel("soc_cart")) || this.getView().getModel("soc_cart");

        this._view = this.getView();

        this.oSOCartModel = (this.oApplicationFacade && this.oApplicationFacade.getODataModel()) || this.getView().getModel();

        this.getView().setModel(this.oCartModel, "soc_cart");

        var cartData = this.oCartModel ? this.oCartModel.getData() : {};
        var customerNumber = cartData.CustomerNumber || "100029";
        var salesOrganization = cartData.SalesOrganization || "1000";
        var distributionChannel = cartData.DistributionChannel || "10";
        var division = cartData.Division || "00";

    	var oParam = [ "$expand=PartnerAddressSet" ];

        function fnSuccess(response) {

            this.addresses = (response.PartnerAddressSet && response.PartnerAddressSet.results) ? response.PartnerAddressSet.results : [];
            var cartModelData = this.oCartModel.getData();

            cartModelData.ShipToIncoTerms = response.ShipToIncoTerms;
            cartModelData.ShipToCarrier = response.ShipToCarrier;
            cartModelData.PartnerAddressSet = this.addresses;
            cartModelData.ShippingInstructions = cartModelData.ShippingInstructions ? cartModelData.ShippingInstructions : response.ShipToInstructions;
            cartModelData.NotesToReceiver = cartModelData.NotesToReceiver ? cartModelData.NotesToReceiver : response.ShipToReceiverNotes;

            this.oCartModel.updateBindings();
            
            if (this.addresses && this.addresses.length > 0 && typeof cartModelData.PartnerID === "undefined") {
				var addressSelect = this.byId("AddressSelect");
                if (addressSelect && addressSelect.getItems().length > 0) {
            	    addressSelect.setSelectedItem(addressSelect.getItems()[0]);
                }
                this._updateAddress(0);
            }
        }

        function fnError(oError) {
        	cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage(oError.response);
        }

        if (this.oSOCartModel && typeof this.oSOCartModel.read === "function") {
            this.oSOCartModel.read("/Customers(CustomerID='" + customerNumber + "',SalesOrganization='" + salesOrganization + "',DistributionChannel='" +
                    distributionChannel + "',Division='" + division + "')/", null, oParam, true, jQuery.proxy(fnSuccess, this), jQuery.proxy(fnError, this));
        }
    },

    readPayee:function(){
        var oModel = (this.oApplicationFacade && this.oApplicationFacade.getODataModel()) || this.getView().getModel();

        if (oModel && typeof oModel.read === "function") {
            oModel.read("/PayeeSet", {
                success: (oData, oResponse) => {
                    if(oData.results && oData.results.length>0){
                        var oSalesOrderTypeModel = new sap.ui.model.json.JSONModel({
                            SalesOrderTypes: oData.results
                        });

                        this.getView().setModel(oSalesOrderTypeModel, "SalesOrderType");

                        var selectElem = this.byId('SOSelect');
                        var key = (selectElem && selectElem.getSelectedKey()) ? selectElem.getSelectedKey() : oData.results[0].Salesordertype;
                        
                        var Partners = oData.results.filter(function(e){if(e.Salesordertype === key){return e;}});

                        var oPartnerModel = new sap.ui.model.json.JSONModel({
                            Partners: Partners
                        });

                        this.getView().setModel(oPartnerModel, "Partners");
                    }
                },
                error: (oError) => {
                    sap.m.MessageToast.show("Error in reading ArticleList...");
                }
            });
        }
    },
    
    onSOSelect:function(oEvt){
    	var key = oEvt.getSource().getSelectedKey();
        var model = this.getView().getModel("SalesOrderType");
        if (model) {
            var data = model.getData().SalesOrderTypes.filter(function(e){if(e.Salesordertype === key){return e;}});
            var partnerModel = this.getView().getModel("Partners");
            if (partnerModel) {
                partnerModel.setData({"Partners":data});
                partnerModel.refresh();
            }
        }
    },

    onPayeeSelect: function (oEvt) {
        var key = oEvt.getSource().getSelectedKey();
        var item = oEvt.getSource().getSelectedItem();
        if (this.oCartModel) {
            this.oCartModel.getData().payee = key;
            this.oCartModel.getData().payeeDesc = item ? item.getText() : key;
        }
    },

    onNavigateHome : function() {
        cus.sd.zsalesorder.create.util.ModelUtils.navToCustomers();
    },

    onNavToCart: function () {
        if (this.oRouter) {
            this.oRouter.navTo("cart", {});
        }
    },

    onNavToDelivery: function () {
        if (this.oRouter) {
            this.oRouter.navTo("delivery", {});
        }
    },

    onNavToQueue: function () {
        if (this.oRouter) {
            this.oRouter.navTo("main", {});
        }
    },

    _onNavigateBack : function() {
    	window.history.go(-1);
    },

    onAddressSelect : function() {
        var selectElem = this.byId("AddressSelect");
        if (!selectElem || !selectElem.getSelectedItem()) {
            return;
        }
        var selectedPartnerID = selectElem.getSelectedItem().getKey();
        if (this.addresses) {
            for (var i = 0; i < this.addresses.length; i++) {
                var partnerID = this.addresses[i].PartnerID;
                if (partnerID === selectedPartnerID) {
                    this._updateAddress(i);
                    break;
                }
            }
        }
    },

    simulateSalesOrderCreate : function() {
        var oSOJson = {};
		var serviceURL = cus.sd.zsalesorder.create.util.ServiceHelper.getServiceUrl(this);
        
        var cartData = this.oCartModel ? this.oCartModel.getData() : {};
        var items = cartData.oShoppingCartItems || [];
    	var that = this;
        if (items.length > 0) {
            if (typeof cartData.PurchaseOrder === "undefined") {
                cartData.PurchaseOrder = "";
            }
            if (typeof cartData.NotesToReceiver === "undefined") {
                cartData.NotesToReceiver = "";
            }
            if (typeof cartData.ShippingInstructions === "undefined") {
                cartData.ShippingInstructions = "";
            }

            oSOJson.SalesOrderSimulation = true;
            oSOJson.SalesOrderNumber = "0";
            oSOJson.PO = cartData.PurchaseOrder;
            oSOJson.RequestedDate = parseInt(cartData.singleRdd || "20260925", 10);
            oSOJson.CustomerID = cartData.CustomerNumber;
            oSOJson.SalesOrganization = cartData.SalesOrganization;
            oSOJson.DistributionChannel = cartData.DistributionChannel;
            oSOJson.Division = cartData.Division;
            oSOJson.Payee = this.byId('PayeeSelect') ? this.byId('PayeeSelect').getSelectedKey() : "";
            oSOJson.SalesOrdType = this.byId('SOSelect') ? this.byId('SOSelect').getSelectedKey() : "";
            oSOJson.Indicator = "";
            oSOJson.OrderItemSet = [];

            var itemNumberFormat = sap.ui.core.format.NumberFormat.getIntegerInstance({
                minIntegerDigits : 6,
                maxIntegerDigits : 6
            });
            var j = 0;
            for (var i = 0; i < items.length; i++) {
                if (items[i].isVisible !== false) {
                    var oChild = {};
                    oChild.Quantity = items[i].qty;
                    oChild.UnitofMeasure = items[i].UOM || items[i].UnitofMeasureTxt;
                    oChild.RequestedDeliveryDate = parseInt(items[i].RDD || "20260925", 10);
                    oChild.Product = items[i].Product || items[i].ProductID;
                    oChild.SalesOrderNumber = items[i].SalesOrderNumber || "0";
                    oChild.ItemNumber = itemNumberFormat.format(10 * (i + 1));
                    oChild.Currency = items[i].Currency || items[i].currency;
                    oChild.ProductName = items[i].ProductName || items[i].ProductDesc;

                    oSOJson.OrderItemSet[j] = oChild;
                    j++;
                }
            }

            if (this._oBusyDialog) {
                this._oBusyDialog.open();
            }

            var oModel = (this.oApplicationFacade && this.oApplicationFacade.getODataModel()) || this.oSOCartModel;
            if (oModel && typeof oModel.create === "function") {
                oModel.create("/SalesOrders", oSOJson, {
                    success: function(oData, response) {
                        if (that._oBusyDialog) {
                            that._oBusyDialog.close();
                        }
                        cus.sd.zsalesorder.create.util.ModelUtils.updateCartModelFromSimulationResponse(response);
                    },
                    error: function fnError(oError) {
                        if (that._oBusyDialog) {
                            that._oBusyDialog.close();
                        }
                        var errorTitle = (that.oApplicationFacade && that.oApplicationFacade.getResourceBundle()) ? that.oApplicationFacade.getResourceBundle().getText("ERROR") : "Error";
                        cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage(oError ? oError.response : null, errorTitle);
                    },
                    async: true
                });
            } else {
                if (that._oBusyDialog) {
                    that._oBusyDialog.close();
                }
                cus.sd.zsalesorder.create.util.ModelUtils.updateCartModelFromSimulationResponse({ simulation: true });
            }
        }
    },

    onNavigateReview : function() {
        if (!this.oCartModel) {
            this._ensureCartModel();
        }
        var cartData = this.oCartModel.getData();

        if (this._view.byId("PUR_ORDER")) {
            cartData.PurchaseOrder = this._view.byId("PUR_ORDER").getValue();
        }
        if (this._view.byId("ship")) {
            cartData.ShippingInstructions = this._view.byId("ship").getValue();
        }
        if (this._view.byId("notes")) {
            cartData.NotesToReceiver = this._view.byId("notes").getValue();
        }
        if (this._view.byId("phoneNum")) {
            cartData.PhoneNumber = this._view.byId("phoneNum").getText();
        }
        var payeeSelect = this._view.byId("PayeeSelect");
        if (payeeSelect && payeeSelect.getSelectedItem()) {
            cartData.payee = payeeSelect.getSelectedKey();
            cartData.payeeDesc = payeeSelect.getSelectedItem().getText();
        }
        var soSelect = this.byId('SOSelect');
        if (soSelect && soSelect.getSelectedItem()) {
            cartData.SalesOrdType = soSelect.getSelectedKey();
            cartData.SalesOrdTypeDesc = soSelect.getSelectedItem().getText();
        }

        // Run the simulation first.
        this.simulateSalesOrderCreate();

        if (this.oRouter) {
            this.oRouter.navTo("soReviewCart", {});
        }
    },

    _updateAddress : function(indexNumber) {
        if (!this.addresses || !this.addresses[indexNumber]) {
            return;
        }
        var addr = this.addresses[indexNumber];
        if (this._view.byId("addresses1")) { this._view.byId("addresses1").setText(addr.ShipToAddress1 || ""); }
        if (this._view.byId("addresses2")) {
            var address2Text = addr.ShipToAddress2 || "";
            this._view.byId("addresses2").setText(address2Text);
            this._view.byId("addresses2").setVisible(!!address2Text.trim());
        }
        if (this._view.byId("city")) { this._view.byId("city").setText(addr.ShipToCity || ""); }
        if (this._view.byId("state")) { this._view.byId("state").setText(addr.ShipToRegionName || ""); }
        if (this._view.byId("country")) { this._view.byId("country").setText(addr.ShipToCountryName || ""); }
        if (this._view.byId("zip")) { this._view.byId("zip").setText(addr.ShipToPostalCode || ""); }
        if (this._view.byId("phoneNum")) { this._view.byId("phoneNum").setText(addr.ShipToTelephone || ""); }

        if (this.oCartModel) {
            var cartData = this.oCartModel.getData();
            cartData.PartnerName2 = addr.PartnerName2;
            cartData.PartnerID = addr.PartnerID;
            cartData.FormattedAddress1 = addr.FormattedAddress1;
            cartData.FormattedAddress2 = addr.FormattedAddress2;
            cartData.FormattedAddress3 = addr.FormattedAddress3;
            cartData.FormattedAddress4 = addr.FormattedAddress4;
            cartData.FormattedAddress5 = addr.FormattedAddress5;
            cartData.FormattedAddress6 = addr.FormattedAddress6;
            cartData.FormattedAddress7 = addr.FormattedAddress7;
            cartData.FormattedAddress8 = addr.FormattedAddress8;
            cartData.FormattedAddress9 = addr.FormattedAddress9;
            this.oCartModel.updateBindings();
        }
    },

    onFileSizeExceed: function (oEvent) {
        sap.m.MessageBox.error("File size cannot exceed 2 MB. Please choose a smaller file.", {
            title: "File Size Limit Exceeded"
        });
        var oUploader = oEvent.getSource();
        if (oUploader && typeof oUploader.clear === "function") {
            oUploader.clear();
        }
    },

    onFileSelected: function (oEvent) {
        var oUploader = oEvent.getSource();
        var aFiles = oEvent.getParameter("files");
        var oFile = (aFiles && aFiles.length > 0) ? aFiles[0] : (oUploader.getDomRef("fu") && oUploader.getDomRef("fu").files ? oUploader.getDomRef("fu").files[0] : null);

        if (!oFile) {
            return;
        }

        // 2MB size restriction (2 * 1024 * 1024 bytes)
        var MAX_SIZE = 2 * 1024 * 1024;
        if (oFile.size > MAX_SIZE) {
            var nSizeMb = (oFile.size / (1024 * 1024)).toFixed(2);
            sap.m.MessageBox.error("File size exceeds 2MB limit. The selected file is " + nSizeMb + " MB.", {
                title: "File Size Limit Exceeded"
            });
            if (oUploader && typeof oUploader.clear === "function") {
                oUploader.clear();
            }
            return;
        }

        var that = this;
        var oReader = new FileReader();
        oReader.onload = function (e) {
            var sDataUrl = e.target.result;
            var sFileName = oFile.name;
            var isPdf = sFileName.toLowerCase().endsWith(".pdf") || oFile.type === "application/pdf";
            var sSizeFormatted = oFile.size >= 1024 * 1024
                ? (oFile.size / (1024 * 1024)).toFixed(2) + " MB"
                : (oFile.size / 1024).toFixed(1) + " KB";

            var oNewAttachment = {
                id: "att_" + Date.now(),
                fileName: sFileName,
                fileSize: sSizeFormatted,
                fileType: oFile.type || "Document",
                uploadDate: new Date().toLocaleDateString(),
                isPdf: isPdf,
                url: sDataUrl
            };

            var oModel = that.oCartModel || that.getView().getModel("soc_cart");
            if (oModel) {
                var aAttachments = oModel.getProperty("/attachments") || [];
                aAttachments.push(oNewAttachment);
                oModel.setProperty("/attachments", aAttachments);
                oModel.refresh(true);
            }

            if (oUploader && typeof oUploader.clear === "function") {
                oUploader.clear();
            }

            sap.m.MessageToast.show("Attachment added: " + sFileName);
        };

        oReader.readAsDataURL(oFile);
    },

    onAttachmentPress: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext("soc_cart");
        var oAttachment = oContext ? oContext.getObject() : null;
        if (!oAttachment) {
            return;
        }

        var isPdf = oAttachment.isPdf || (oAttachment.fileName && oAttachment.fileName.toLowerCase().endsWith(".pdf")) || oAttachment.fileType === "application/pdf";

        if (isPdf) {
            // In case of PDF: View in browser
            if (oAttachment.url) {
                if (oAttachment.url.startsWith("data:")) {
                    try {
                        var parts = oAttachment.url.split(',');
                        var mimeMatch = parts[0].match(/:(.*?);/);
                        var mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
                        var byteCharacters = atob(parts[1]);
                        var byteNumbers = new Array(byteCharacters.length);
                        for (var i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        var byteArray = new Uint8Array(byteNumbers);
                        var blob = new Blob([byteArray], { type: mimeType });
                        var blobUrl = URL.createObjectURL(blob);
                        var win = window.open(blobUrl, "_blank");
                        if (!win) {
                            var a = document.createElement("a");
                            a.href = blobUrl;
                            a.target = "_blank";
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        }
                    } catch (err) {
                        window.open(oAttachment.url, "_blank");
                    }
                } else {
                    window.open(oAttachment.url, "_blank");
                }
            } else {
                sap.m.MessageToast.show("Attachment content is not available.");
            }
        } else {
            // For any other file type: Download
            if (oAttachment.url) {
                var downloadLink = document.createElement("a");
                downloadLink.href = oAttachment.url;
                downloadLink.download = oAttachment.fileName || "attachment";
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                sap.m.MessageToast.show("Downloading " + oAttachment.fileName);
            } else {
                sap.m.MessageToast.show("Attachment content is not available.");
            }
        }
    },

    onDeleteAttachment: function (oEvent) {
        var oContext = oEvent.getSource().getBindingContext("soc_cart");
        if (!oContext) {
            return;
        }
        var sPath = oContext.getPath();
        var iIndex = parseInt(sPath.split("/").pop(), 10);
        var oModel = this.oCartModel || this.getView().getModel("soc_cart");
        var oAttachment = oContext.getObject();
        var sName = oAttachment ? oAttachment.fileName : "attachment";

        sap.m.MessageBox.confirm("Are you sure you want to remove '" + sName + "'?", {
            title: "Remove Attachment",
            actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
            emphasizedAction: sap.m.MessageBox.Action.DELETE,
            onClose: function (sAction) {
                if (sAction === sap.m.MessageBox.Action.DELETE) {
                    var aAttachments = oModel.getProperty("/attachments") || [];
                    aAttachments.splice(iIndex, 1);
                    oModel.setProperty("/attachments", aAttachments);
                    oModel.refresh(true);
                    sap.m.MessageToast.show("Attachment removed");
                }
            }
        });
    },
    
    getHeaderFooterOptions : function() {
        var aButtonList = [];

        aButtonList.push({
            sI18nBtnTxt : "REVIEW_ORDER",
            onBtnPressed : jQuery.proxy(this.onNavigateReview, this)
        });

        return {
        	sI18NFullscreenTitle  : "CART_DETAILS_TITLE",
            buttonList : aButtonList,
            onBack : this._onNavigateBack,
            bSuppressBookmarkButton :true
        };
    }    

});
