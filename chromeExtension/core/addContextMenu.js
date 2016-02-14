var contexts = ["selection"]; 

function addTrackingLink(info, tabs) {
	"use strict";
	var trackingInfo = info.selectionText;
	addNewTrackingLink(trackingInfo);
}

function addTrackingCarrier(info) {
	"use strict";
	var trackingInfo = info.selectionText;
	addNewTrackingCarrier(trackingInfo);
}

chrome.contextMenus.create({"title": "Add tracking link", "contexts": [contexts[0]], "onclick": addTrackingLink});
chrome.contextMenus.create({"title": "Add carrier", "contexts": [contexts[0]], "onclick": addTrackingCarrier});