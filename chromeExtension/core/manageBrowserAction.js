function addNewTrackingLink(data) {
	chrome.browserAction.setBadgeText({text: "+"});
	chrome.storage.local.set({"trackingdata": data});
}