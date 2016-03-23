angular.module('starter.controllers', ['firebase'])

        .controller('LoginCtrl', function ($scope, auth, $state, store, $firebase, $localstorage) {

            auth.signin({
                closable: false,
                // This asks for the refresh token
                // So that the user never has to log in again
                authParams: {
                    scope: 'openid offline_access'
                }
            }, function (profile, idToken, accessToken, state, refreshToken) {
                store.set('profile', profile);
                store.set('token', idToken);
                store.set('refreshToken', refreshToken);
                $scope.pro = store.get('profile');
                var a = 'https://marthree.firebaseio.com/users/' + $scope.pro['user_id'];
                var ref = new Firebase(a);
                var sync = $firebase(ref);
                sync.$update({
                    userdetails: {
                        email: $scope.pro['email'],
                        name: $scope.pro['nickname'],
                        ud_date: "none"
                    }
                });
                $state.go('tab.dash');
            }, function (error) {
                console.log("There was an error logging in", error);
            });
            //update username and name on dashboard visit

        })


        .controller('DashCtrl', function ($scope, link, $localstorage, locopoco, $window, $http, $filter, store, $firebase, $ionicModal, $interval, $ionicPlatform, $rootScope, $ionicPopup, $ionicLoading) {
            document.addEventListener('deviceready', function () {
                window.plugin.notification.local.onclick = function (id, state, json) {
                    if (id == 6) {
                        // alert("distance");
                    }
                    else if (id == 5) {
                        $scope.content = $scope.noticlick;
                        $scope.Update_LOG($scope.noticlick);
                    }
                };
                // $window.localStorage.removeItem('test');
                $scope.pro = store.get('profile');
                var a = 'https://marthree.firebaseio.com/users/' + $scope.pro['user_id'];
                var ref = new Firebase(a);
                var sync = $firebase(ref);
                var q = 1;
                //------------- home lat long ------------------
                $scope.lat = $localstorage.get('lat');
                $scope.long = $localstorage.get('long');
                //---------------------------------------
                $scope.curr_date = $filter('date')(new Date(), 'yyyy-MM-dd');
                $scope.curr_date_name = $filter('date')(new Date(), 'EEE');
                $scope.curr_time = $filter('date')(new Date(), 'HH:mm');
                $scope.curr_hour = $filter('date')(new Date(), 'HH');
                // get users medication list
                var userdet = $firebase(ref.child('meds')).$asArray();
                var a = $firebase(ref.child('daily_log')).$asArray();
                var maindata = $firebase(ref.child('userdetails')).$asObject();
                var nongps1 = $firebase(ref.child('DND')).$asObject();
                var ude = $firebase(ref.child('meds')).$asObject();
                var act_log = $firebase(ref.child("activity"));
                act_log.$push($scope.curr_date + " " + $scope.curr_time + " Opened Dashboard ");
                var udelength = 0;
                ude.$loaded().then(function () {
                    angular.forEach(ude, function (udd) {
                        udelength++;
                    });
                });
                var breaker = false;
                $scope.mymed = userdet;
                $scope.daily_log = a;
                $scope.nongps = nongps1;
                // Start the timer
                //$scope.counqt = $localstorage.get('non');

                var a1 = link.all();
//                scheduler();

                $ionicLoading.show({
                    content: 'Loading',
                    animation: 'fade-in',
                    showBackdrop: true,
                    maxWidth: 200,
                    showDelay: 0
                });
                //----------------deletes duplicate entries---------------------
                var b = $firebase(ref.child('daily_log'));
                a.$loaded().then(function () {
                    var i = 0;
                    var object = [];
                    var object2 = [];
                    var temp_id = null;
                    angular.forEach(a, function (x) {
                        if (x.date == $scope.curr_date)
                        {
                            object.push(x);
                        }
                    });

                    angular.forEach(object, function (y) {
                        var q = 0;
                        if (temp_id == null) {
                            angular.forEach(object, function (z) {
                                if (y.med_id == z.med_id && y.time == z.time && y.dl_id != z.dl_id) {
                                    temp_id = q;//object2.push(y.dl_id);
                                }
                                q++;
                            });
                        }
                    });
                    object2 = object.slice(0, temp_id);

                    angular.forEach(object2, function (z) {
                        b.$remove(z.dl_id);
                    });
                });
                //  gets todays medication list, finds the first duplicate entry having 
                //  same med id and time but duplicate dl_id and splices all entries uptill then 
                //--------------------------------------------------------------

                tick();
                function tick() {
                    var notifonce_counter = -1; // comment this line if u want multiple notifications
                    if (a1.link != 'nothing') {

                        $rootScope.badgeCount = 1;
                    } else {

                        $rootScope.badgeCount = 0;
                    }

                    $scope.curr_date = $filter('date')(new Date(), 'yyyy-MM-dd');
                    $scope.curr_date_name = $filter('date')(new Date(), 'EEE');
                    $scope.curr_time = $filter('date')(new Date(), 'HH:mm');
                    var aila = $scope.curr_time.split(':');
                    $scope.timetest = parseInt(aila) + 1;
                    $scope.secs = $filter('date')(new Date(), 'HH:mm');
                    $scope.notify = $localstorage.getObject('locally');
                    var local = $localstorage.getObject('locally');
                    var settin = $localstorage.getObject('settings');
                    $scope.loc_status = false;
                    var keepGoing = true;
                    if (settin.loc == true) {
                        angular.forEach($scope.nongps, function (i) {
                            if (keepGoing) {
                                $scope.curdist = i;
                                $scope.curdist1 = locopoco.getDistanceFromLatLonInKm(i.lat, i.long, $scope.currlat, $scope.currlong);
                                var curdist2 = $scope.curdist1;
                                if (curdist2 < 25) {
                                    $scope.loc_status = true;
                                    keepGoing = false;
                                }
                            }
                        });
                    }

                    angular.forEach(local, function (zz) {
                        notifonce_counter++;
//                        alert(zz.time + " "+  $scope.curr_time +" "+ settin.notifications);
                        if ((zz.time == $scope.curr_time) && (settin.notifications == true)) { //if med time is equal to current time then send notificaiton
//                            alert("if sucess");
                            if ($scope.loc_status == false) {
                                $scope.noticlick = zz;
                                window.plugin.notification.local.add({
                                    title: "Med time :" + zz.med_name,
                                    message: "update log after taking medicine",
                                    badge: 0,
                                    id: 5
                                });
                                //alert(notifonce_counter);
                                delete local[notifonce_counter];
                                $localstorage.setObject('locally', local);
                            }
                        }

                    });
                    var m = $firebase(ref.child('userdetails'));
                    var today = $scope.curr_date_name.toString();
                    maindata.$loaded().then(function () {
                        if (maindata.ud_date == today) {
                            // $scope.sleepdaychange = true;
                            $ionicLoading.hide();
                        } else {
                            $ionicLoading.show({
                                content: 'Loading',
                                animation: 'fade-in',
                                showBackdrop: true,
                                maxWidth: 200,
                                showDelay: 0
                            });
                            //$scope.sleepdaychange = false;
                            $window.localStorage.removeItem('locally');//delete locally stored notifs
                            var i = 0;
                            //  var ude = $firebase(ref.child('meds')).$asObject();
                            ude.$loaded().then(function () {
                                var day_log = $firebase(ref.child("daily_log"));
                                var zi = 0;
                                angular.forEach(ude, function (value) {
                                    zi++;
                                    if (zi <= udelength && breaker == false) {
                                        if (zi == udelength) {
                                            breaker = true;
                                        }
                                        var data = {
                                            med_id: value.med_id,
                                            med_name: value.med_name,
                                            date: $filter('date')(new Date(), 'yyyy-MM-dd'),
                                            time: $filter('date')(new Date(), 'HH:mm'),
                                            amount_taken: 0,
                                            status: "no_entry",
                                            day: $filter('date')(new Date(), 'EEE')
                                        };
                                        $scope.theObject = {};
                                        angular.forEach(value.schedule, function (sch) {// for each schedule
                                            var hours = 0;
                                            //var time2;
                                            angular.forEach(sch.days, function (a, b) {//for each day in shecdule
                                                if (a) {
                                                    var c = $filter('date')(new Date(), 'EEE');
                                                    if (b == c.toString()) {
                                                        day_log.$push(data).then(function (ref) {
                                                            ref.key(); // key for the newly created record
                                                            var adata = {
                                                                med_id: value.med_id,
                                                                med_name: value.med_name,
                                                                date: $filter('date')(new Date(), 'yyyy-MM-dd'),
                                                                status: "no_entry",
                                                                dl_id: ref.key(),
                                                                time: sch.sch_time
                                                            };
                                                            if ((settin.push == true) && ($scope.curr_time < adata['time'])) {
                                                                // testing schedule option with plugin update   
                                                                var schd_time = new Date($scope.curr_date + " " + sch.sch_time + ":00");
                                                                cordova.plugins.notification.local.schedule({
                                                                    id: i + 10,
                                                                    title: "Med time : " + adata['med_name'],
                                                                    message: "update log after taking medicine",
                                                                    at: schd_time
                                                                });
                                                                // test ends 
                                                            }
                                                            day_log.$update(ref.key(), adata);
                                                            $scope.theObject[i] = adata;
                                                            $localstorage.setObject('locally', $scope.theObject);
                                                            i = i + 1;
                                                            $localstorage.set('non', i);
                                                        });
                                                        // time2[0] = parseInt(time1[0]) + ":" + (time1[1]);
                                                        if (value.repeat == "yes") {
                                                            for (var j = 1; j < sch.stopafter; j++) {
                                                                hours = hours + parseInt(sch.every);
                                                                var time = sch.sch_time;
                                                                var time1 = time.split(":");
                                                                if (parseInt(time1[0]) + hours >= 24) {
                                                                    break;
                                                                } else {
                                                                    var time = sch.sch_time;
                                                                    if (parseInt(time1[0]) < 10) {
                                                                        var timeapend = "0" + (parseInt(time1[0]) + parseInt(hours)) + ":" + time1[1];
                                                                    } else {
                                                                        var timeapend = (parseInt(time1[0]) + parseInt(hours)) + ":" + time1[1];
                                                                    }
                                                                    //alert(parseInt(time1[0]) + parseInt(hours));
                                                                    var adata = {
                                                                        med_id: value.med_id,
                                                                        med_name: value.med_name,
                                                                        date: $filter('date')(new Date(), 'yyyy-MM-dd'),
                                                                        time: timeapend,
                                                                        amount_taken: 0,
                                                                        status: "no_entry",
                                                                        day: $filter('date')(new Date(), 'EEE')
                                                                    };
                                                                    repeatschrd(adata);
                                                                }
                                                            }
                                                        }
                                                    }
                                                }//if ends                                                
                                            }); //for loop - days
                                        }); //for loop - schedule
//                                        m.$update({
//                                            ud_date: $filter('date')(new Date(), 'EEE')
//                                        });
                                        $scope.daychange();
                                        function repeatschrd(adata) {
                                            day_log.$push(adata).then(function (ref) {
                                                ref.key(); // key for the newly created record
                                                //var time1 = time.split(":");
                                                var cdata = {
                                                    dl_id: ref.key()
                                                };
                                                day_log.$update(ref.key(), cdata);
                                                $scope.theObject[i] = adata;
                                                $localstorage.setObject('locally', $scope.theObject);
                                                i = i + 1;
                                                $localstorage.set('non', i);
                                            });
                                            if ((settin.push == true) && ($scope.curr_time < adata['time'])) {
//                                                alert(adata['time']);
                                                var schd_time = new Date($scope.curr_date + " " + adata['time'] + ":00");
                                                cordova.plugins.notification.local.schedule({
                                                    id: i + 10,
                                                    title: "Med time : " + adata['med_name'],
                                                    message: "update log after taking medicine",
                                                    at: schd_time
                                                });
                                            }
                                        }
                                    }
                                });
                            });
                            $ionicLoading.hide();
                        }//else
                    });
                    $scope.daychange = function () {
                        m.$update({
                            //ud_date: "tod"
                            ud_date: $filter('date')(new Date(), 'EEE')
                        });

                    };
                    //--------------------------------------LOCATION--------------------------------------------------------------------------
                    $scope.dist = $localstorage.get('distance');
                    if (settin.loc == true) {
                        locopoco.locateme();
                        $scope.currlat = $localstorage.get('currlat');
                        $scope.currlong = $localstorage.get('currlong');
                        //  $scope.dist2 = locopoco.getDistanceFromLatLonInKm($scope.lat, $scope.long, $scope.currlat, $scope.currlong);

                        if ($scope.dist > 30) {
                            if ($localstorage.get('notified') == "yes") {
                            } else {
                                distance_notif();
                            }
                        } else {
                            $localstorage.set('notified', "no");
                        }
                    } else {

                        $scope.currlat = null;
                        $scope.currlong = null;
                    }
                    $scope.notified = $localstorage.get('notified');
//----------------------------------------sleep tracking------------------------------------------------------------------------
                    if (settin.sleep == true) {
                        if ($localstorage.get('sleepnotified') == "yes") {
                            $scope.ass = $localstorage.get("sleeptime");  // just to see its value in the view
                            navigator.accelerometer.clearWatch($scope.watchID);
                            if ($scope.curr_time == $localstorage.get("sleeptime")) {    // resets accelerometer activation on the next day at the set sleep time
                                $localstorage.set('sleepnotified', "no");
                            }
                            else {
                                navigator.accelerometer.clearWatch($scope.watchID);
                            }
                        } else if ($localstorage.get('sleepnotified') == "no") {    //1. if set to no then 
                            if (typeof $scope.notify != 'undefined') {
                                var status = false;
                                angular.forEach($scope.notify, function (localnotifs) {
                                    if (localnotifs.time > $localstorage.get("sleeptime")) {    // 2.  and if notif scheduled for later today
                                        status = true;
                                    }
                                });
                                if (status == true) {
                                    $localstorage.set('sleepnotified', "no");
                                    if ($scope.curr_time > $localstorage.get("sleeptime")) {
                                        var accelerometerOptions = {frequency: 1000};   //3. only then start accelerometer
                                        $scope.watchID = navigator.accelerometer.watchAcceleration(accelerometerSuccess, accelerometerError, accelerometerOptions);
                                    }
                                }
                            }
                        }
                        else {
                            $localstorage.set('sleepnotified', "no");
                        }
                    }
                    $scope.sleepytime = $localstorage.get('sleepnotified'); // just to see its value in the view
                }//tick ends
                $interval(tick, 20000);
                // Update every 20 seconds

                var aiminus1;
                function accelerometerSuccess(acceleration) {

                    $scope.X = Math.abs((acceleration.x));
                    $scope.Y = Math.abs((acceleration.y));
                    $scope.Z = Math.abs((acceleration.z));
                    $scope.timestamp = acceleration.timestamp;
                    var qwertya = $scope.timestamp;
                    var ax, ay, az, ai, vi;
                    ax = $scope.X;
                    ay = $scope.Y;
                    az = $scope.Z;
                    ai = Math.sqrt((ax * ax) + (ay * ay) + (az * az));
                    vi = ai - aiminus1;
                    aiminus1 = ai;
                    $scope.VI = vi;
                    if ((vi >= 1))
                    {
                        $scope.move = "body moved";
                        //zx.$push("moved");
                        $scope.timegap = qwertya - $scope.tempo;
                        if ($scope.timegap > 10000 && $localstorage.get('sleepnotified') == "no") { //if not moved for 10 secs and vi > 1
                            // alert("if");
                            window.plugin.notification.local.add({
                                title: "Looks like you are falling asleep",
                                message: "Dont forget to take meds",
                                badge: 0,
                                id: 7
                            });
                            navigator.accelerometer.clearWatch($scope.watchID);
                            $localstorage.set('sleepnotified', "yes");
                        }
                        $scope.sleepytime = $localstorage.get('sleepnotified');
                        $scope.tempo = qwertya;
                    }
                    else {
                        $scope.sleepytime = $localstorage.get('sleepnotified');
                        $scope.move = "no";
                        $scope.milliseconds = (new Date).getTime();
                        $scope.nomoveforlong = $scope.milliseconds - $scope.tempo;
                        if ($scope.nomoveforlong > 120000) { //120000 2mins no movememnts at all - then notifies user
                            //alert("else ");
                            if ($localstorage.get('sleepnotified') == "no") {

                                window.plugin.notification.local.add({
                                    title: "Looks like you are falling asleep",
                                    message: "Dont forget to take meds",
                                    badge: 0,
                                    id: 7
                                });
                                $localstorage.set('sleepnotified', "yes");
                                navigator.accelerometer.clearWatch($scope.watchID);
                                $scope.tempo = (new Date).getTime();
                                $scope.nomoveforlong = 0;
                            }
                        }
                    }
                    $scope.$apply(); // force scope updates
                }

                function accelerometerError() {
                    // alert('onError!');
                }


                function distance_notif() {

                    if (typeof $scope.notify != 'undefined') {
                        var status = false;
                        angular.forEach($scope.notify, function (localnotifs) {
                            if (localnotifs.time > $scope.curr_time) {
                                status = true;
                            }
                        });
                        if (status == true) {

                            window.plugin.notification.local.add({
                                title: "Going out?",
                                message: "dont forget to take your medicine.",
                                badge: 0,
                                id: 6
                            });
                            $localstorage.set('notified', "yes");
                        }

                    }
                }



                // toggle button functions
                $scope.togglea = function () {
                    if ($localstorage.get('notified') == "yes") {
                        $localstorage.set('notified', "no");
                        $localstorage.set('sleepnotified', "no");
                        $scope.notified = $localstorage.get('notified');
                    } else
                    {
                        $localstorage.set('notified', "yes");
                        $localstorage.set('sleepnotified', "yes");
                        $scope.notified = $localstorage.get('notified');
                    }
                };
                $scope.haha = function (the_Med) { //the_Med is from users/med/log/
                    $scope.themed = the_Med;
                    var count;
                    //var sch = $firebase(ref.child("meds").child(the_Med.med_id).child("log"));
                    var da_log = $firebase(ref.child("daily_log"));
                    var up = $firebase(ref.child("meds").child(the_Med.med_id));
                    if (the_Med.log_count) {
                        count = the_Med.log_count;
                    }
                    else {
                        count = 0;
                    }

                    var minus = the_Med.med_left;
                    $scope.openModal();
                    $scope.log = {date: $scope.curr_date,
                        time: $scope.curr_time,
                        status: "missed",
                        points: 0
                    }; // to catch user medical log data

                    act_log.$push($scope.curr_date + " " + $scope.curr_time + " " + the_Med.med_name + " opened");
                    $scope.checkbox = {
                        stat: false,
                        later: false
                    };
                    $scope.remindlater = function remindlater(times) {

                        var schd_time = new Date($scope.curr_date + " " + times + ":00");
                        //alert(schd_time);
                        cordova.plugins.notification.local.schedule({
                            id: 1,
                            title: "Med time :" + the_Med.med_name,
                            message: "update log after taking medicine",
                            at: schd_time
                        });
//                         $scope.closeModal();
                    };
                    var dnd = $firebase(ref.child("DND"));
                    $scope.take_med = function (stat) {
                        if (stat === true) {
                            //  alert("whattt" + '|| ' + stat);
                            var coord = {
                                lat: $scope.currlat,
                                long: $scope.currlong
                            };
                            dnd.$push(coord);
                        } else {
                            // alert("whattt" + '|| ' + stat);
                        }
                        count = count + 1;
                        if ($scope.log['status'] == "missed" || $scope.log['status'] == "dont_know") {
                            $scope.log['amount_taken'] = 0;
                            $scope.log['points'] = 0;
                        } else if ($scope.log['status'] == "taken") {
                            minus = the_Med.med_left - $scope.log['amount_taken'];
                            $scope.log['points'] = 5;
                        }
                        var aila;
                        da_log.$push($scope.log).then(function (ref) {
                            aila = ref.key(); // key for the newly created record
                            var data = {
                                med_id: the_Med.med_id,
                                med_name: the_Med.med_name,
                                dl_id: aila,
                                points: $scope.log['points']
                            };
                            da_log.$update(ref.key(), data);
                        });
                        up.$update({
                            log_count: count,
                            med_left: minus
                        }); // update fields in firebase
                        $scope.closeModal();
                    }; //beammeup ends
                }
                ; //haha ends



                $scope.Update_LOG = function (the_Med) {
                    $scope.themed = the_Med;
                    $scope.closeModal1("");
                    $scope.openModal('due / log history');
                    //var sch = $firebase(ref.child("meds").child(the_Med.med_id).child("log"));
                    var da_log = $firebase(ref.child("daily_log"));
                    var dnd = $firebase(ref.child("DND"));
                    // var reward = $firebase(ref.child("rewards"));
                    var up = $firebase(ref.child("meds").child(the_Med.med_id));
                    $scope.med_l = $firebase(ref.child("meds").child(the_Med.med_id)).$asObject();
                    $scope.formodal = the_Med;
                    var count = the_Med.log_count;
                    var minus;
                    $scope.log = {
                        date: the_Med.date,
                        time: $scope.curr_time,
                        status: "missed",
                        points: 0
                    }; // to catch user medical log datazz

                    var t1 = $scope.curr_time.split(":");
                    var t2 = the_Med.time.split(":");
                    var t3 = parseInt(t1[0]) - parseInt(t2[0]);
                    t3 = Math.abs(t3);
                    act_log.$push($scope.curr_date + " " + $scope.curr_time + " " + the_Med.med_name + " opened");
                    $scope.checkbox = {
                        stat: false,
                        later: false
                    };
                    $scope.remindlater = function remindlater(times) {
                        //alert(times);
                        var schd_time = new Date($scope.curr_date + " " + times + ":00");
                        //alert(schd_time);
                        cordova.plugins.notification.local.schedule({
                            id: 1,
                            title: "Med time :" + the_Med.med_name,
                            message: "update log after taking medicine",
                            at: schd_time
                        });
                    };
                    $scope.take_med = function (stat) {
                        if (stat === true) {
                            //     alwa("whattt" + '|| ' + stat);
                            var coord = {
                                lat: $scope.currlat,
                                long: $scope.currlong
                            };
                            dnd.$push(coord);
                        } else {

                            //   alert("whattt" + '|| ' + stat);
                        }



                        if ($scope.log['status'] == "missed" || $scope.log['status'] == "dont_know") {
                            $scope.log['amount_taken'] = 0;
                            minus = $scope.med_l.med_left + the_Med.amount_taken; //no med left
                        } else {
                            minus = $scope.med_l.med_left - $scope.log['amount_taken'];
                            if (t3 == 1 || t3 == 0) {
                                $scope.log['points'] = 10;
                                da_log.$update(the_Med.dl_id, $scope.log);
                            }
                            else if (t3 > 1) {
                                $scope.log['points'] = 5;
                                da_log.$update(the_Med.dl_id, $scope.log);
                            }
                        }
                        // da_log.$update(the_Med.dl_id, $scope.log); // cant update without key value of daily_log
                        // sch.$update(x.count, $scope.log); // update new record to firebase
                        up.$update({med_left: minus}); // update fields in firebase
//                        if (t3 == 1) {
//                            // alert(t3);
//                            $scope.log['points'] = 5;
//                            da_log.$update(the_Med.dl_id, $scope.log);
//                            var maindata = $firebase(ref.child('rewards')).$asArray();
//                            angular.forEach(maindata, function (a) {
//                             var da_log = $firebase(ref.child("daily_log"));
//                                $scope.totalpointsearned = $scope.totalpointsearned + parseInt(a.pointsearned);
//                            });
//                            var foo = {};
//                            if  ($scope.totalpointsearned == 'undefined'){
//                                
//                                $scope.totalpointsearned = 0;
//                            }
//                            foo['points'] = parseInt($scope.totalpointsearned)+5;
//                            reward.$set(foo);
//
//
//                        }
//
//                        else if (t3 > 1) {
//                            // alert(t3);
//                            $scope.log['points'] = 2;
//                            da_log.$update(the_Med.dl_id, $scope.log);
//                            angular.forEach(maindata, function (a) {
//                                $scope.totalpointsearned = $scope.totalpointsearned + parseInt(a.pointsearned);
//                            });
//
//                            var foo = {};
//                            foo['points'] = $scope.totalpointsearned;
//                            reward.$set(foo);
//                        }



                        $scope.closeModal();
                    }
                    ; //beammeup ends
                }; //Update_LOG ends



                $ionicPlatform.registerBackButtonAction(function (e) {
                    if ($rootScope.$viewHistory.backView) {
                        $rootScope.$viewHistory.backView.go();
                    } else {
                        var confirmPopup = $ionicPopup.confirm({
                            title: 'Confirm Exit',
                            template: "Are you sure you want to close MAR?"
                        });
                        confirmPopup.then(function (close) {
                            if (close) {
                                act_log.$push($scope.curr_date + " " + $scope.curr_time + " APP CLOSED ");
                                // there is no back view, so close the app instead
                                ionic.Platform.exitApp();
                            } // otherwise do nothing
                            console.log("User canceled exit.");
                        });
                    }

                    e.preventDefault();
                    return false;
                }, 101); // 1 more priority than back button

                $ionicModal.fromTemplateUrl('templates/dash_med_log_detail.html', {
                    scope: $scope,
                    animation: 'slide-in-up'
                }).then(function (modal) {
                    $scope.modal = modal;
                });
                $scope.openModal = function (from) {
                    act_log.$push($scope.curr_date + " " + $scope.curr_time + " medicine log window clicked " + from);
                    $scope.modal.show();
                };
                $scope.closeModal = function () {
                    act_log.$push($scope.curr_date + " " + $scope.curr_time + " medicine log window closed");
                    $scope.modal.hide();
                };
                //Cleanup the modal when we're done with it!
                $scope.$on('$destroy', function () {
                    $scope.modal.remove();
                });
                // Execute action on hide modal
                $scope.$on('modal.hidden', function () {
                    // Execute action
                });
                // Execute action on remove modal
                $scope.$on('modal.removed', function () {
                    // Execute action
                });
                $ionicModal.fromTemplateUrl('templates/log_history.html', {
                    scope: $scope,
                    animation: 'slide-in-down'
                }).then(function (modal) {
                    $scope.modal1 = modal;
                });
                $scope.openModal1 = function () {
                    act_log.$push($scope.curr_date + " " + $scope.curr_time + " LOG HISTORY clicked ");
                    $scope.modal1.show();
                };
                $scope.closeModal1 = function (from) {
                    act_log.$push($scope.curr_date + " " + $scope.curr_time + " " + from + " closed ");
                    $scope.modal1.hide();
                };
                //Cleanup the modal when we're done with it!
                $scope.$on('$destroy', function () {
                    $scope.modal1.remove();
                });
                // Execute action on hide modal
                $scope.$on('modal.hidden', function () {
                    // Execute action
                });
                // Execute action on remove modal
                $scope.$on('modal.removed', function () {
                    // Execute action
                });
            }, false);


        })
//--------------------------------------------------------------------------------------------------------------

        .controller('FriendsCtrl', function ($scope, $http, $filter, store, $firebase, $ionicModal, $timeout, link) {
            $scope.pro = store.get('profile');
            var a = 'https://marthree.firebaseio.com/users/' + $scope.pro['user_id'];
            var ref = new Firebase(a);
            var sync = $firebase(ref);
            var point_counter = 0;
            var firelog = $firebase(ref.child('daily_log')).$asObject();
            var rewards = 0;
            var act_log = $firebase(ref.child("activity"));
            act_log.$push($scope.curr_date + " " + $scope.curr_time + " Reward tab opened ");
            firelog.$loaded().then(function () {
                angular.forEach(firelog, function (x) {
                    if (!isNaN(parseInt(x.points))) {
                        rewards = rewards + parseInt(x.points);
                        $scope.rewards1 = rewards;
                    }
                    point_counter = point_counter + 1;
                    $scope.p_c = point_counter;
                });
                $scope.p_c1 = ((rewards / $scope.p_c) * 10).toFixed(2);
                updatepoints();
            });
            function updatepoints() {
                var pointlog = $firebase(ref.child("points"));
                $firebase(ref.child("points")).$update({
                    "point": $scope.rewards1,
                    "outof": $scope.p_c,
                    "reward": $scope.p_c1
                });
            }
            var a1 = link.all();
            $scope.asdf = a1.link;
            $scope.OpenLink = function () {
                act_log.$push($scope.curr_date + " " + $scope.curr_time + " Form window opened ");
                var haystack = a1.link;
                var index = haystack.indexOf("https://docs.google.com");
                if (index > -1) {
                    //  alert(index);
                    window.open(a1.link, "_system");
                }
                else
                {
                    //   alert("not a link");
                }

            };
            function isInt(value) {

                var er = /^-?[0-9]+$/;
                return er.test(value);
            }
        })







        .controller('FriendDetailCtrl', function ($scope, $stateParams) {
            $scope.friend = Friends.get($stateParams.friendId);
        })


        .controller('AccountCtrl', function ($scope, $localstorage, auth, $state, store, $firebase, meds, $ionicModal) {

            $scope.pro = store.get('profile');
            $scope.firevar = meds.all();
            var a = 'https://marthree.firebaseio.com/users/' + $scope.pro['user_id'] + '/meds/';
            var ref = new Firebase(a);
            var a1 = 'https://marthree.firebaseio.com/users/' + $scope.pro['user_id'];
            var ref1 = new Firebase(a1);
            var sync = $firebase(ref);
            //ref.$update({email: $scope.pro['email'], name: $scope.pro['nickname']});
            var userdet = sync.$asArray();
            $scope.selection1 = sync.$asArray();
            //medication selection modal
            var act_log = $firebase(ref1.child("activity"));
            act_log.$push($scope.curr_date + " " + $scope.curr_time + " Account tab opened ");
            $scope.toggleSelection = function toggleSelection(pill_id, pill_name, pill_checked) {
                var idx = $scope.selection1.indexOf(pill_name);
                // is currently selected
                if (idx > -1) {
                    //$scope.selection.splice(idx, 1);
                }
                // is newly selected
                else {

                    if (pill_checked) {
                        $firebase(ref.child(pill_id)).$update({
                            "med_id": pill_id,
                            "med_name": pill_name,
                            "total_med": 0,
                            "log_count": 0,
                            "med_left": 0
                        });
                    } else {
                        sync.$remove(pill_id);
                    }

                }


                //alert($scope.selection);
            };
            $scope.newmedhold = {};
            $scope.newmedhold = {
                name: ""
            };
            $scope.newmedicine = function () {
                var newmedurl = 'https://marthree.firebaseio.com/Medicines/';
                var qwee = new Firebase(newmedurl);
                var newmedref = $firebase(qwee);
                if ($scope.newmedhold.name != "") {
                    newmedref.$push($scope.newmedhold).then(function (loll) {
                        act_log.$push($scope.curr_date + " " + $scope.curr_time + " new med added :  " + $scope.newmedhold.name);
                        loll.key(); // key for the newly created record
                        var data = {
                            id: loll.key()
                        };
                        newmedref.$update(loll.key(), data);
                    });
                }
            };
            $scope.temp = [];
            //Medication delete button in settings page
            $scope.del = function del(pill_id) {
                act_log.$push($scope.curr_date + " " + $scope.curr_time + " med removed, Pill id: " + pill_id);
                sync.$remove(pill_id);
            };

            //Medication edit button in settings page
            $scope.edit = function edit(pill_id) {
                $scope.pillid = pill_id;
                $scope.openModal1();
                $scope.edit_refill = function edit_refill(refill) {

                    $scope.temp = angular.copy(refill);
                    //  alert(pill_id + ' :  ' + $scope.temp + ' :  ' + $scope.temp.refill_data);
                    $firebase(ref.child(pill_id)).$update({
                        "total_med": $scope.temp.refill_data,
                        "med_left": $scope.temp.refill_data
                    });
                    $scope.getDatetime = new Date;
                    $firebase(ref.child(pill_id + "/refill/" + $scope.getDatetime)).$update({
                        "refill_date": $scope.getDatetime,
                        "refill_quantitiy": $scope.temp.refill_data

                    });
                };
                var sch = $firebase(ref.child($scope.pillid).child("schedule"));
                var sch1 = $firebase(ref.child($scope.pillid));
                $scope.schedule = sch.$asArray();
                $scope.del_schedule = function (med) {
                    act_log.$push($scope.curr_date + " " + $scope.curr_time + " med schedule removed, Pill id: " + pill_id);
                    sch.$remove(med['sch_id']);
                };
                $scope.week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                $scope.selection = {
//                    days:{
//                        "Sun":false,
//                    "Mon":false,
//                    "Tue":false,
//                    "Wed":false,
//                    "Thurs":false,
//                    "Fri":false,
//                    "sat":false  }(

                };
                $scope.add = function () {
                    sch.$push($scope.selection).then(function (ref) {
                        ref.key();
                        sch.$update(ref.key(), {
                            "sch_id": ref.key()
                        });
                    });

                    if ($scope.selection['every'] != null) {
                        sch1.$update({"repeat": "yes"});
                    }
                    $scope.closeModal1();
                    $state.transitionTo($state.current, $state.$current.params, {
                        reload: true,
                        inherit: false,
                        notify: true
                    });
                };
            };
            // $scope.settings={};
            $scope.settings = $localstorage.getObject("settings");
            $scope.change = function () {   //disable other  checkboxes when forced notifs are activated
                if ($scope.settings['push'] == true) {
                    $scope.settings['notifications'] = false;
                    $scope.settings['loc'] = false;
                    $scope.settings['sleep'] = false;
                }
                $localstorage.setObject("settings", $scope.settings);
            };
            if ($localstorage.get("sleeptime") == "undefined") {
                $localstorage.set("sleeptime", "9:00:00 PM");
            } else {
                $scope.sleeptime = $localstorage.get("sleeptime");
            }

            //var tim = $localstorage.get("sleeptime");
            $scope.sleeptimefunc = function (x) {
                $localstorage.set("sleeptime", x);
            };
            $scope.address = function (addr) {  //gets locations from google
                // alert(addr);
                var zxc = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + addr;
                var xmlHttp = null;
                xmlHttp = new XMLHttpRequest();
                xmlHttp.open("GET", zxc, false);
                xmlHttp.send(null);
                var geocode = xmlHttp.responseText;
                $scope.res = JSON.parse(geocode);
            };
            $scope.savelocation = function (addr) {
                $scope.llat = addr.geometry.location.lat;
                $scope.llong = addr.geometry.location.lng;
                $localstorage.set('lat', $scope.llat);
                $localstorage.set('long', $scope.llong);
                $localstorage.set('readableaddr', addr.formatted_address);
                $scope.closeModal2();
            };
            if ($localstorage.get('lat') == null || $localstorage.get('lat') == 'undefined') {

                $scope.locstatus = "not set";
            } else
            {
                $scope.locstatus = $localstorage.get("readableaddr");
            }
//
//            if (($localstorage.get('lat') == null && $localstorage.get('long') == null) || ($localstorage.get('lat') == 'undefined' && $localstorage.get('long') == 'undefined')) {
//                alert('home location is not set');
//            } else {
//                alert('home location is set' + $localstorage.get('lat') + '||  ' + $localstorage.get('long'));
//            }

            $ionicModal.fromTemplateUrl('templates/add_med.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
            });
            $scope.openM = function () {
                act_log.$push($scope.curr_date + " " + $scope.curr_time + " Add medicine window opened ");
                $scope.modal.show();
            };
            $scope.closeM = function () {
                act_log.$push($scope.curr_date + " " + $scope.curr_time + " Add medicine window closed ");
                $scope.modal.hide();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.modal.remove();
            });
            // Execute action on hide modal
            $scope.$on('modal.hidden', function () {
                // Execute action
            });
            // Execute action on remove modal
            $scope.$on('modal.removed', function () {
                // Execute action
            });
            $ionicModal.fromTemplateUrl('templates/add_med_detail.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal1 = modal;
            });
            $scope.openModal1 = function () {
                act_log.$push($scope.curr_date + " " + $scope.curr_time + " med timings window opened ");
                $scope.modal1.show();
            };
            $scope.closeModal1 = function () {
                act_log.$push($scope.curr_date + " " + $scope.curr_time + " med timings window closed");
                $scope.modal1.hide();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.modal1.remove();
            });
            // Execute action on hide modal
            $scope.$on('modal.hidden', function () {
                // Execute action
            });
            // Execute action on remove modal
            $scope.$on('modal.removed', function () {
                // Execute action
            });
            $ionicModal.fromTemplateUrl('templates/homeloc.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal2 = modal;
            });
            $scope.openModal2 = function () {
                $scope.modal2.show();
            };
            $scope.closeModal2 = function () {
                $scope.modal2.hide();
            };
            //Cleanup the modal when we're done with it!
            $scope.$on('$destroy', function () {
                $scope.modal2.remove();
            });
            // Execute action on hide modal
            $scope.$on('modal.hidden', function () {
                // Execute action
            });
            // Execute action on remove modal
            $scope.$on('modal.removed', function () {
                // Execute action
            });
//            $scope.friends = Friends.all();
            $scope.logout = function () {
                act_log.$push($scope.curr_date + " " + $scope.curr_time + " Logged out");
                auth.signout();
                store.remove('token');
                store.remove('profile');
                store.remove('refreshToken');
                $state.go('login');
            };
        })








        ;
