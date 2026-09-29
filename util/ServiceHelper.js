/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
/*global URI: false */
jQuery.sap.declare("cus.sd.zsalesorder.create.util.ServiceHelper");

cus.sd.zsalesorder.create.util.ServiceHelper = {

/**
 * Extracts OData service configuration parameters from Configuration.js
 * 
 * @param {Controller} controller the controller calling the method
 * @return {String} URL parameter string
 */
getServiceUrl : function(controller) {
		
	var serviceParams = controller.oConnectionManager.getConfiguration().getServiceList()[0];
	/* eslint-disable new-cap */
	var serviceURL = URI(serviceParams.serviceUrl);
	/* eslint-enable new-cap */

	var sapServer = jQuery.sap.getUriParameters().get("sap-server");
    var sapHost = jQuery.sap.getUriParameters().get("sap-host");
    var sapHostHttp = jQuery.sap.getUriParameters().get("sap-host-http");
    var sapClient = jQuery.sap.getUriParameters().get("sap-client");

    if (sapServer !== null) {
		serviceURL.addSearch("sap-server", sapServer);
	}
    else if (sapHost !== null) {
		serviceURL.addSearch("sap-host", sapHost);
	}
    else if (sapHostHttp !== null) {
		serviceURL.addSearch("sap-host-http", sapHostHttp);
    }
    if (sapClient !== null) {
		serviceURL.addSearch("sap-client", sapClient);
    }
    return serviceURL.toString();
},

/**
 * Does a get entity on an OData service URL
 * 
 * @param {Controller} controller the controller calling the method
 * @param {Object} context the SAPUI5 binding + path
 * @param {String} urlParameter Optional. Extra URL parameter for the OData call.
 * 
 * @return {Object} the customer data fetched from the database.
 */
readODataService : function(controller, context, urlParameter) {

	//controller.resourceBundle = controller.oApplicationFacade.getResourceBundle();
	var urlParameters = [];
    var service = new sap.ui.model.odata.ODataModel(cus.sd.zsalesorder.create.util.ServiceHelper.getServiceUrl(controller), true);
    var customerModel = new sap.ui.model.json.JSONModel();

    if (typeof urlParameter !== "undefined") {
        urlParameters[0] = urlParameter;
    }

    service.read(context, null, urlParameters, false,
        function(oData) {
            customerModel.setData(oData);
        },
        null
    );

    return customerModel;
},

/**
 * This method is necessary for certain cases, as there appears to be a SAPUI5 bug where sap-server and sap-client URL
 * parameters get lost.
 * 
 * @param {sap.ui.core.mvc.Controller} controller the calling controller
 * @param {String} prependCharacter the character to prepend in front of the return value, or "?" by default
 * @return {String} the set of sap-server and sap-client URL parameters to append to the OData service URL, or an empty
 *                  String if there is nothing to append.
 */
getUrlParameters : function(controller, prependCharacter) {
	
	prependCharacter = prependCharacter || "?";
	
	var service = new sap.ui.model.odata.ODataModel(cus.sd.zsalesorder.create.util.ServiceHelper.getServiceUrl(controller), true);
	return (service.sUrlParams && service.sUrlParams.trim() !== "") ? prependCharacter + service.sUrlParams : "";
},

/**
 * This method is necessary for certain cases, as there appears to be a SAPUI5 bug where sap-server and sap-client URL
 * parameters get lost or service url overwritten by extensibility.
 * 
 * @param {sap.ui.core.mvc.Controller} controller the calling controller
 * @param {String} prependCharacter the character to prepend in front of the return value, or "?" by default
 * @return {String} the OData service URL without parameters.
 */
getUrlWithoutParameters : function(controller) {
	var service = new sap.ui.model.odata.ODataModel(cus.sd.zsalesorder.create.util.ServiceHelper.getServiceUrl(controller), true);
	return service.sServiceUrl;
}

};
