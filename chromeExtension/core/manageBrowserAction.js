function addNewTrackingLink(data) {
	chrome.browserAction.setBadgeText({text: "+"});
	chrome.storage.local.set({"trackingLink": data});
}

function addNewTrackingCarrier(data) {
	chrome.browserAction.setBadgeText({text: "+"});
	chrome.storage.local.set({"trackingCarrier": data});
}