var contexts = ["selection"]; 

function addTrackingLink(info, tabs) {
	"use strict";
	var trackingInfo = info.selectionText;
	addNewTrackingLink(trackingInfo);
}

chrome.contextMenus.create({"title": "Add tracking link", "contexts": [contexts[0]], "onclick": addTrackingLink});