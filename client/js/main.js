angular.module("tracker", ['ngMaterial'])

.controller("main", ["$scope", function($scope) {
    $scope.messages = {}; $scope.messages.test = "hi";
}]);