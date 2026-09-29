/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
// define a root UIComponent which exposes the main view
jQuery.sap.declare("cus.sd.zsalesorder.create.Component");
jQuery.sap.require("cus.sd.zsalesorder.create.Configuration");
jQuery.sap.require("sap.ca.scfld.md.ComponentBase");

// new Component
sap.ca.scfld.md.ComponentBase.extend("cus.sd.zsalesorder.create.Component", {
    metadata : sap.ca.scfld.md.ComponentBase.createMetaData("MD", {
        "name": "Master Detail Sample",
        "version" : "1.6.11",
        "library" : "cus.sd.zsalesorder.create",
        "includes" : ["css/salesorder.css"],
        "dependencies" : {
            "libs" : ["sap.m","sap.me"],
            "components" : []
        },

        "config" : {
            "resourceBundle" : "i18n/i18n.properties",
            "titleResource" : "DISPLAY_NAME",
            "icon" : "sap-icon://Fiori2/F0018"
            },

        viewPath : "cus.sd.zsalesorder.create.view",

        masterPageRoutes : {   
            // fill the routes to your master pages in here. The application will start with a navigation to route "master"
            // leading to master screen S2.
            // If this is not desired please define your own route "master" 
            "master":{
                "pattern" : "",
                "view": "S2"
            }
        },

        detailPageRoutes : {
            "detail" : {
                "pattern" : "detail/{contextPath}",
                "view" : "S3"
            },
            "productdetail" : {
                "pattern" : "productdetail/{customerID}/{productID}/{salesOrganization}/{distributionChannel}/{division}",
                "view" : "S3_Product"
            }
        },

        fullScreenPageRoutes : {

            "quickCheckout": {
                pattern : "quickCheckout",
                view : "SalesOrderCreatePriceAndAvailabilityCheck"
            },

            "soCartDetails": {
                pattern : "soCartDetails",
                view : "SalesOrderCartDetails"
            },

            "soReviewCart": {
                pattern : "soReviewCart",
                view : "SalesOrderReviewCart"
            },

            "soCreateCart" : {
                pattern : "soCreateCart",
                view : "SalesOrderCreateCart"
            }
        }
    }),

    /**
     * Initialize the application
     *
     * @returns {sap.ui.core.Control} the content
     */
    createContent : function() {
        var oViewData = {component: this};

        return sap.ui.view({
            viewName : "cus.sd.zsalesorder.create.Main",
            type : sap.ui.core.mvc.ViewType.XML,
            viewData : oViewData
        });
    }

});
