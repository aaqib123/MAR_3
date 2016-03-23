angular.module('starter.services', [])


        .factory('$localstorage', ['$window', function ($window) {
                return {
                    set: function (key, value) {
                        $window.localStorage[key] = value;
                    },
                    get: function (key, defaultValue) {
                        return $window.localStorage[key] || defaultValue;
                    },
                    setObject: function (key, value) {
                        $window.localStorage[key] = JSON.stringify(value);
                    },
                    getObject: function (key) {
                        return JSON.parse($window.localStorage[key] || '{}');
                    }
                };
            }])



        .service('locopoco', ['$localstorage', function ($localstorage) {

                this.locateme = function () {
                    var watchID = navigator.geolocation.getCurrentPosition(onSuccess1, onError1, {maximumAge: 3000, timeout: 5000, enableHighAccuracy: true});
                };

                // function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
                this.getDistanceFromLatLonInKm = function (lat1, lon1, lat2, lon2) {

                    var R = 6371; // Radius of the earth in km
                    var dLat = deg2rad(lat2 - lat1); // deg2rad below
                    var dLon = deg2rad(lon2 - lon1);
                    var a =
                            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                            Math.sin(dLon / 2) * Math.sin(dLon / 2)
                            ;
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    var d = R * c; // Distance in km
                    d = d * 1000;
                    d = d.toFixed(5);
                    return d;
                };
                function getDistanceFromLatLonInKms(lat1, lon1, lat2, lon2) {

                    var R = 6371; // Radius of the earth in km
                    var dLat = deg2rad(lat2 - lat1); // deg2rad below
                    var dLon = deg2rad(lon2 - lon1);
                    var a =
                            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                            Math.sin(dLon / 2) * Math.sin(dLon / 2)
                            ;
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    var d = R * c; // Distance in km
                    d = d * 1000;
                    d = d.toFixed(5);
                    return d;
                }
                function deg2rad(deg) {
                    return deg * (Math.PI / 180);
                }

                function onSuccess1(position) {
                    var a = position.coords.latitude;
                    var b = position.coords.longitude;
                    $localstorage.set('currlat', a);
                    $localstorage.set('currlong', b);
                    var lat = $localstorage.get('lat');
                    var long = $localstorage.get('long');
                    var dist = getDistanceFromLatLonInKms(lat, long, a, b);
                    $localstorage.set('distance', dist);
                }
                function onError1(error) {
                    return false;
                }


            }])

        .filter('abs', function () {
            return function (input) {
                return Math.abs(input);
            };
        });