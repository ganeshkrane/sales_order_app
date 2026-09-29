/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
(function(){
"use strict";

jQuery.sap.declare("cus.sd.zsalesorder.create.util.Validator");

cus.sd.zsalesorder.create.util.Validator = function() {
	var invalidControlsNumber = 0;
	var oInvalidControls = Object.create(null);
	
	this.getInvalidControlsNumber = function () {
		return invalidControlsNumber;
	};
	
	this.registerInvalidControl = function(key) {
		if (!(key in oInvalidControls)) {
			invalidControlsNumber++;
			oInvalidControls[key] = true;
		}
	};
	
	this.unregisterInvalidControl = function(key) {
		if (key in oInvalidControls) {
			invalidControlsNumber--;
			delete oInvalidControls[key];
		}
	};
};

}());
