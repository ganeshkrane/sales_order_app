/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
(function(){
"use strict";

jQuery.sap.declare("cus.sd.zsalesorder.create.utils.Utils");

cus.sd.zsalesorder.create.util.Utils = {};


cus.sd.zsalesorder.create.util.Utils.resetFooterContentRightWidth = function(oController) {

       var oPage = oController.getView().getContent()[0];
       var rightBar = jQuery.sap.byId(oPage.getFooter().getId() + "-BarRight");
       var iRBWidth = rightBar.outerWidth(true);
       if (iRBWidth > 0){
              oController.iRBWidth  = iRBWidth;
       }
       if (rightBar.width() === 0 && oController.iRBWidth){
             jQuery.sap.log.info("Update footer contentRight Width=" + oController.iRBWidth);
              rightBar.width(oController.iRBWidth);
       }

};

cus.sd.zsalesorder.create.util.Utils.dialogErrorMessage = function(response, errorTitle, back) {
			 //extract error message from response
   			var errorbackend;

			if (response)
			{
    			var sBody = response.body;

                if(sBody) {
	    			var indexValue = sBody.indexOf("message");
	    			var indexValueEnd = sBody.substring(indexValue).indexOf("}");
	    			if (indexValueEnd > -1) {
	    				errorbackend = sBody.substring(indexValue + 8, indexValue + indexValueEnd - 1);
	    			} else {
    					var oBody = jQuery.parseXML(sBody);
        				errorbackend = oBody.getElementsByTagName("message")[0].childNodes[0].nodeValue;
    				}
    			} else { // Always fix it - some unexpected embarasing error happend
    				errorbackend = sap.ca.scfld.md.app.Application.getImpl().getResourceBundle().getText("ERROR");
    			}
                
                //var bIsMsgBoxClosed = false;
                var fnClose = function(){
                	if (back === true){
                		jQuery.sap.history.back();
                	}
                };

		        sap.ca.ui.message.showMessageBox({
		            type: sap.ca.ui.message.Type.ERROR,
		            message: errorbackend
		        }, fnClose);
			}

		  };

}());
