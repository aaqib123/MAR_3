// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic',
    'starter.controllers',
    'starter.services',
    'auth0',
    'angular-storage',
    'angular-jwt',
    'firebase',
    'elif'
])

        .run(function ($ionicPlatform) {
            $ionicPlatform.ready(function () {
                cordova.plugins.backgroundMode.setDefaults({
                    title: 'MARThree is running',
                    ticker: 'click to open app',
                    text: 'click to open app'
                });
                cordova.plugins.backgroundMode.enable();

                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                if (window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                }
                if (window.StatusBar) {
                    // org.apache.cordova.statusbar required
                    StatusBar.styleDefault();
                }
            });
        })

        .config(function ($stateProvider, $urlRouterProvider, authProvider, $httpProvider,
                jwtInterceptorProvider) {

            // Ionic uses AngularUI Router which uses the concept of states
            // Learn more here: https://github.com/angular-ui/ui-router
            // Set up the various states which the app can be in.
            // Each state's controller can be found in controllers.js
            $stateProvider

                    // This is the Login state
                    .state('login', {
                        url: "/login",
                        templateUrl: "templates/login.html",
                        controller: "LoginCtrl"
                    })

                    // setup an abstract state for the tabs directive
                    .state('tab', {
                        url: "/tab",
                        abstract: true,
                        templateUrl: "templates/tabs.html",
                          controller: 'DashCtrl',
                        // The tab requires user login
                        data: {
                            requiresLogin: true
                        }
                    })

                    // Each tab has its own nav history stack:

                    .state('tab.dash', {
                        url: '/dash',
                        views: {
                            'tab-dash': {
                                templateUrl: 'templates/tab-dash.html',
                                controller: 'DashCtrl'
                            }
                        }
                    })

                    .state('tab.friends', {
                        url: '/friends',
                        views: {
                            'tab-friends': {
                                templateUrl: 'templates/tab-friends.html',
                                controller: 'FriendsCtrl'
                            }
                        }
                    })
                    .state('tab.friend-detail', {
                        url: '/friend/:friendId',
                        views: {
                            'tab-friends': {
                                templateUrl: 'templates/friend-detail.html',
                                controller: 'FriendDetailCtrl'
                            }
                        }
                    })

                    .state('tab.account', {
                        url: '/account',
                        views: {
                            'tab-account': {
                                templateUrl: 'templates/tab-account.html',
                                controller: 'AccountCtrl'
                            }
                        }
                    });


            // Configure Auth0
            authProvider.init({
                domain: AUTH0_DOMAIN,
                clientID: AUTH0_CLIENT_ID,
                loginState: 'login'
            });

            // if none of the above states are matched, use this as the fallback
            $urlRouterProvider.otherwise('/tab/dash');

            jwtInterceptorProvider.tokenGetter = function (store, jwtHelper, auth) {
                var idToken = store.get('token');
                var refreshToken = store.get('refreshToken');
                if (!idToken || !refreshToken) {
                    return null;
                }
                if (jwtHelper.isTokenExpired(idToken)) {
                    return auth.refreshIdToken(refreshToken).then(function (idToken) {
                        store.set('token', idToken);
                        return idToken;
                    });
                } else {
                    return idToken;
                }
            }

            $httpProvider.interceptors.push('jwtInterceptor');
        }).run(function ($rootScope, auth, store) {
    $rootScope.$on('$locationChangeStart', function () {
        if (!auth.isAuthenticated) {
            var token = store.get('token');
            if (token) {
                auth.authenticate(store.get('profile'), token);
            }
        }

    });
})
        .filter('object2Array', function () {
            return function (input) {
                var out = [];
                for (i in input) {
                    out.push(input[i]);
                }
                return out;
            };
        })

        .factory('meds', function ($firebase) {
            var url = 'https://marthree.firebaseio.com/';
            var sync = new Firebase(url);

            var medarray = $firebase(sync.child('Medicines')).$asArray();
            return {
                all: function () {
                    return medarray;
                }
            };


        })


        .factory('link', function ($firebase) {
            var url = 'https://marthree.firebaseio.com/';
            var ref = new Firebase(url);
            var sync = $firebase(ref.child('link'));
            var medarray = $firebase(ref.child('link')).$asObject();
            return {
                all: function () {
                    return medarray;
                },
                add: function (coord) {
                    sync.$push(coord);
                }
            };


        })


        ;
