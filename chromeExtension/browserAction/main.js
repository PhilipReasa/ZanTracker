angular.module("tracker", ['ngMaterial'])

.controller("main", ["$scope", "AddPackage", "AddUser", function($scope, AddPackage, AddUser) {
    $scope.user = {};
    var carriers = ["usps", "fedex", "ups", "dhl_express", "canada_post", "lasership", "mondial_relay"];

    $scope.tracking = {
        id: undefined,
        carrier: undefined
    } ;

    chrome.storage.local.get("username", function(value) {
        $scope.$apply(function() {
            $scope.user.name = value.username;
        });
    })

    chrome.storage.local.get("trackingLink", function(value) {
        $scope.$apply(function() {
            $scope.tracking.id = value.trackingLink;

            //clear it out after we load it
            chrome.browserAction.setBadgeText({text: ""});
            chrome.storage.local.set({"trackingLink": ""});
        });
    })

    chrome.storage.local.get("trackingCarrier", function(value) {
        $scope.$apply(function() {
            $scope.tracking.carrier = value.trackingCarrier;

            //clear it out after we load it
            chrome.browserAction.setBadgeText({text: ""});
            chrome.storage.local.set({"trackingCarrier": ""});
        });
    })

    chrome.extension.onRequest.addListener(function(request) {                                                                                                                                                  
        var data = request.trackingInfo;
        console.log(data);
        $scope.tracking.id = data;
    });



    $scope.nameSubmit = function() {
        $scope.user.name = $scope.user.nameBeingInput;
        chrome.storage.local.set({"username": $scope.user.name},function (){
        });

        AddUser.addUser($scope.user.name);
    }

    $scope.loading = {};
    $scope.loading.show = false;
    $scope.addNewLink = function() {
        //validate
        if((carriers.indexOf($scope.tracking.carrier.toLowerCase()) != -1) && $scope.tracking.id !== undefined) {
            $scope.loading.show = true;

            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.loading.show = false;
                    $scope.tracking.carrier = "";
                    $scope.tracking.id = "";
                });
            }, 1500);   

            AddPackage.addPackage($scope.user.name, $scope.tracking.carrier.toLowerCase(), $scope.tracking.id, function(data){
                console.log(data);
            });    

            chrome.browserAction.setBadgeText({text: ""});
        }
    };
}])

.service('AddPackage', ['$http', function($http){
    return{
        "addPackage": function(username, packageCarrier, packageID, callback){
            $http({
                method: 'POST',
                url: 'https://trackingzen-celsoendo.c9users.io/addPackage',
                data: {"id":username, "packageID": packageID, "packageCarrier": packageCarrier}
            }).then(callback, function errorCallback(response){ console.log("failure");
            });
        }
    }
}])

.service('AddUser', ['$http', function($http){
    return{
        "addUser": function(username, callback){
            $http({
                method: 'POST',
                url: 'https://trackingzen-celsoendo.c9users.io/user',
                data: {"id":username, "phoneNumber": "608.228.1234"}
            }).then(callback, function errorCallback(response) { console.log('Failure');
            });
        }
    }
}])

.config(function($mdThemingProvider) {
  $mdThemingProvider.definePalette('amazingPaletteName', {
    '50': 'ffebee',
    '100': 'ffcdd2',
    '200': 'ef9a9a',
    '300': 'e57373',
    '400': 'ef5350',
    
    '500': 'rgba(0, 0, 0, 0.5)',
    
    '600': 'e53935',
    '700': 'd32f2f',
    '800': 'c62828',
    '900': 'b71c1c',
    'A100': 'ff8a80',
    'A200': 'ff5252',
    'A400': 'ff1744',
    'A700': 'd50000',
    'contrastDefaultColor': 'light',    // whether, by default, text (contrast)
                                        // on this palette should be dark or light
    'contrastDarkColors': ['50', '100', //hues which contrast should be 'dark' by default
     '200', '300', '400', 'A100'],
    'contrastLightColors': undefined    // could also specify this if default was 'dark'
  });
  $mdThemingProvider.theme('default')
    .primaryPalette('amazingPaletteName')
});