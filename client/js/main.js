angular.module("tracker", ['ngMaterial'])

.controller("main", ["$scope", "$mdDialog", "$mdMedia", "AddUser", "AddPackage", "GetHippoPackages", function($scope, $mdDialog, $mdMedia, AddUser, AddPackage, GetHippoPackages) {
    $scope.carriers = [
        {id: "usps",
         name: "USPS"}, 
        {id:"ups",
        name: "UPS"},
        {id: "dhl_express",
        name: "DHL Express"},
        {id:"fedex",
        name: "FEDEX"},
        {id:"canada_post",
        name: "Canada Post"},
        {id: "lasership",
        name: "Lasership"},
        {id: "mondial_relay",
        name: "Mondial Relay"}
    ];
    $scope.user = {};
    $scope.user.username = "";
    $scope.packagesData = [];
    $scope.package = {};
    $scope.package.carrier = "";
    $scope.package.id = "";
    $scope.setUsername  = function () {
        // AddUser.addUser($scope.user.username, function(data){
        //     console.log(data);
        // });
        GetHippoPackages.hippoPackages($scope.user.username, function(response){
            if(response.data === "empty"){
                console.log("empty");
            } else {
                for(var i = 0; i < response.data.length; i++){
                    response.data[i] = JSON.parse(response.data[i])
                }
                $scope.packagesData =  response.data;
                console.log(response);
            }
        });
        $scope.hideForm = 1;
    };
    
    $scope.addPackage = function () {
        AddPackage.addPackage($scope.user.username, $scope.package.carrier, $scope.package.id, function(data){
            console.log(data);
        });
    };
    
    $scope.showPackageDetials = function (packageData, ev) {
        console.log(packageData);
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  && $scope.customFullscreen;
            $mdDialog.show({
              controller: DialogController,
              templateUrl: 'tabdialog.tmpl.html',
              parent: angular.element(document.body),
              targetEvent: ev,
              clickOutsideToClose:true,
              fullscreen: useFullScreen,
              locals: {packageData:packageData}
            })
            .then(function(answer) {
              $scope.status = 'You said the information was "' + answer + '".';
            }, function() {
              $scope.status = 'You cancelled the dialog.';
            });
            $scope.$watch(function() {
              return $mdMedia('xs') || $mdMedia('sm');
            }, function(wantsFullScreen) {
              $scope.customFullscreen = (wantsFullScreen === true);
            });
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

.service('GetHippoPackages', ['$http', function($http){
    return{
        "hippoPackages": function(username, callback){
            $http({
                method: 'GET',
                url: 'https://trackingzen-celsoendo.c9users.io/getHippoPackages?id=' + username
            }).then(callback, function errorCallback(response){
                console.log("failure");
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
})

function DialogController($scope, $mdDialog, packageData) {
    $scope.packageData = packageData;
  $scope.hide = function() {
    $mdDialog.hide();
  };
  $scope.cancel = function() {
    $mdDialog.cancel();
  };
  $scope.answer = function(answer) {
    $mdDialog.hide(answer);
  };
} 