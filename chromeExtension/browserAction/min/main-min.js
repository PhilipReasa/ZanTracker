angular.module("tracker",["ngMaterial"]).controller("main",["$scope","AddPackage","AddUser",function(e,a,n){e.user={};var t=["usps","fedex","ups","dhl_express","canada_post","lasership","mondial_relay"];e.tracking={id:void 0,carrier:void 0},chrome.storage.local.get("username",function(a){e.$apply(function(){e.user.name=a.username})}),chrome.storage.local.get("trackingdata",function(a){e.$apply(function(){e.tracking.id=a.trackingdata,chrome.browserAction.setBadgeText({text:""}),chrome.storage.local.set({trackingdata:""})})}),chrome.extension.onRequest.addListener(function(a){var n=a.trackingInfo;console.log(n),e.tracking.id=n}),e.nameSubmit=function(){e.user.name=e.user.nameBeingInput,chrome.storage.local.set({username:e.user.name},function(){}),n.addUser(e.user.name)},e.loading={},e.loading.show=!1,e.addNewLink=function(){-1!=t.indexOf(e.tracking.carrier.toLowerCase())&&void 0!==e.tracking.id&&(e.loading.show=!0,setTimeout(function(){e.$apply(function(){e.loading.show=!1,e.tracking.carrier="",e.tracking.id=""})},1500),a.addPackage(e.user.name,e.tracking.carrier.toLowerCase(),e.tracking.id,function(e){console.log(e)}),chrome.browserAction.setBadgeText({text:""}))}}]).service("AddPackage",["$http",function(e){return{addPackage:function(a,n,t,r){e({method:"POST",url:"https://trackingzen-celsoendo.c9users.io/addPackage",data:{id:a,packageID:t,packageCarrier:n}}).then(r,function o(e){console.log("failure")})}}}]).service("AddUser",["$http",function(e){return{addUser:function(a,n){e({method:"POST",url:"https://trackingzen-celsoendo.c9users.io/user",data:{id:a,phoneNumber:"608.228.1234"}}).then(n,function t(e){console.log("Failure")})}}}]).config(function(e){e.definePalette("amazingPaletteName",{50:"ffebee",100:"ffcdd2",200:"ef9a9a",300:"e57373",400:"ef5350",500:"rgba(0, 0, 0, 0.5)",600:"e53935",700:"d32f2f",800:"c62828",900:"b71c1c",A100:"ff8a80",A200:"ff5252",A400:"ff1744",A700:"d50000",contrastDefaultColor:"light",contrastDarkColors:["50","100","200","300","400","A100"],contrastLightColors:void 0}),e.theme("default").primaryPalette("amazingPaletteName")});