'use strict'

angular.module('smaart.surveyCtrl', ['ngCordova'])
.directive('question', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.question, function(QuesHtml) {
        ele.html(QuesHtml);
        $compile(ele.contents())(scope);
      });
    }
  };
})
.directive('description', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.description, function(DescHtml) {
        ele.html(DescHtml);
        $compile(ele.contents())(scope);
      });
    }
  };
})
.directive('answers', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.answers, function(AnswerHtml) {
        ele.html(AnswerHtml);
        $compile(ele.contents())(scope);
      });
    }
  };
})
.directive('image', function ($compile) {
  return {
    restrict: 'A',
    replace: true,
    link: function (scope, ele, attrs) {
      scope.$watch(attrs.image, function(imageHtml) {
        ele.html(imageHtml);
        $compile(ele.contents())(scope);
      });
    }
  };
})
.controller('surveyLoad', function(dbservice, $q, $sce, $parse, $cordovaFile, $rootScope, $scope, $ionicLoading, localStorageService, $state, AppConfig, ionicDatePicker, $timeout, appData, $cordovaGeolocation, ionicTimePicker, $compile, $ionicHistory, $ionicPlatform){
	var dt = new Date;
	var startedTime = dt.getFullYear()+''+(dt.getMonth()+1)+''+dt.getDay()+''+dt.getHours()+''+dt.getMinutes()+''+dt.getSeconds()+''+dt.getMilliseconds();
	var SurveyData = '';
	$scope.readonlyText = {};
	setSurveyNameAndId($state, localStorageService, 0, dbservice);
	var getQuestions = 'SELECT * FROM survey_questions WHERE group_id = ? AND survey_id = ?';
    $scope.showHideQuestion = false;
    var discarded_groups = localStorageService.get('discarded_groups');
    if($.inArray(parseInt($state.params.groupId),discarded_groups) != -1){
        $scope.discardStatus = true;
    }else{
        $scope.discardStatus = false;
    }
	dbservice.runQuery(getQuestions, [$state.params.groupId,$state.params.surveyId], function(res){

		var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[i] = res.rows.item(i)
      	}
      	SurveyData = row;
      	localStorageService.set('startStamp', startedTime);
		var QuestionIndex = 0;
		
		window.lat = '';
		window.long = '';
		var sectionsList = localStorageService.get('sections_data');
		var sectionDetails = $.grep(sectionsList, function(elem,i){
			return (elem.group_id == $state.params.groupId);
		});

		$scope.section_name = sectionDetails[0].title;
		var surveyName = localStorageService.get('CurrentSurveyNameID');
		$scope.surveyName = surveyName.name;

		window.answerData = '';
		var totalQuest = Object.keys(SurveyData).length

		$scope.totalQst = totalQuest;  //Set Total Question Value in Survey.html

		if($state.params.QuestId.trim() != ''){

			QuestionIndex = $state.params.QuestId;
		}
		if(SurveyData[QuestionIndex] == undefined || SurveyData[QuestionIndex] == ''){
	    	finishSurvey($state, localStorageService, $ionicLoading, $cordovaGeolocation, dbservice, $scope);
	    	return false;
	    }
		var my_media = {};
		$scope.play = function(url, exact){
			angular.forEach(my_media, function(value, key){
				my_media[key].stop();
				$('.playMusic_'+key).show();
		    	$('.pauseMusic_'+key).hide();
			});
			var fname = "SmaartMedia/"+url;
			$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname).then(function(obj) {
					
				my_media[exact] = new Media(obj.nativeURL,
		        	// success callback
			        function () { console.log("playAudio():Audio Success"); },
			        // error callback
			        function (err) { console.log("playAudio():Audio Error: " + err); }
			    );
		    	my_media[exact].play();
		    	$('.playMusic_'+exact).hide();
		    	$('.pauseMusic_'+exact).show();
			});
		}

		$scope.questionId = '';
		$scope.setNextQuestion = function(nextQuestion,type){
			
			if(type == 'select'){
				nextQuestion = $('.app_select:last option:selected').attr('next');
			}
			
			if(nextQuestion != undefined && nextQuestion != ''){
				if(nextQuestion.trim() != ''){
					var surveyData = SurveyData;//getSurveyData($state, localStorageService);
					$.each(SurveyData, function(key, val){
						if(val.question_key == nextQuestion){
							$scope.questionId = key;
						}
					});
				}else{
					$scope.questionId = '';
				}
			}else{
				$scope.questionId = '';
			}
		}
		$scope.stop = function(url, exact){
			my_media[exact].stop();
			$('.playMusic_'+exact).show();
		    $('.pauseMusic_'+exact).hide();
		}

		$scope.currentQst = parseInt(QuestionIndex)+1; //Set Current Question number in Survey.html

		//if Survey According to Question Order
		if(AppConfig.QuestionOrder == 'true'){

			angular.forEach(SurveyData, function(value, key) {
		        if(value.question_order == QuestionIndex){

		            var paramQid = key;
		            var QuestionID = value.question_id;
		        }
		    });
		}
	    //end here
       var timer;
       if($scope.discardStatus){
            if(SurveyData[parseInt(QuestionIndex)+1] != undefined){
                timer = window.setTimeout(setReadonly, 600);
                function setReadonly(){
                    var type = $('input').attr('type');
                    console.log(type);
                    switch(type){
                        case'radio':      
                            console.log($('input:checked').val());                     
                            if($('input:checked').val() != undefined || $('input:checked').val() != null){
                                $scope.notDisable = false;
                                $('input,select,textarea').prop('disabled',true);
                            }else{
                                $scope.notDisable = true;
                                $('input,select,textarea').prop('disabled',false);
                            }
                        break;
                        case'text':
                            if($('input').val() == undefined || $('input').val() == '' || $('input').val() == null){
                                $scope.notDisable = true;
                                $('input,select,textarea').prop('disabled',false);
                            }else{
                                $scope.notDisable = false;
                                $('input,select,textarea').prop('disabled',true);
                            }
                        break;
                        case'checkbox':
                            if($('input:checked').val() != undefined){
                                $('input,select,textarea').prop('disabled',true);
                            }
                        break;
                        default:
                            if($('select,textarea,input:checked,input').val() == '' || $('select,textarea,input:checked,input').val() == undefined || $('select,textarea,input:checked,input').val() == null || $('select,textarea,input:checked,input').val() == '? string: ?'){
                                $scope.notDisable = true;
                                $('input,select,textarea').prop('disabled',false);
                            }else{
                                $scope.notDisable = false;
                                $('input,select,textarea').prop('disabled',true);
                            }
                    }
                };
            }else{
                $scope.notDisable = true;
                $('input,select,textarea').prop('disabled',false);
            }
        }

        // console.log(JSON.parse(SurveyData[QuestionIndex].field_conditions));
        //Question Conditions start here ###################################################
	    var conditionsArray = [];
        try{
            window.field_conditions = JSON.parse(SurveyData[QuestionIndex].field_conditions);
            var fieldCondIndex = 0;
            if(field_conditions.length != 0 && field_conditions[fieldCondIndex].condition_operator !== undefined && field_conditions[fieldCondIndex].condition_value !== undefined){
                checkFieldConditions(fieldCondIndex);
                function checkFieldConditions(fieldCondIndex){
                    if(field_conditions[fieldCondIndex] !== undefined){
                        
                        var condition_question_id = parseInt(field_conditions[fieldCondIndex].condition_column);
                        var conditioned_question_key = '';
                        $.each(SurveyData, function(datakey, datavalue){
                            if(datavalue.question_id == condition_question_id){
                                conditioned_question_key = datavalue.question_key;
                                return false;
                            }
                        });

                        var conditionQuery = 'SELECT '+conditioned_question_key+' FROM survey_result_'+$state.params.surveyId+' WHERE id = ?';
                        var rec_id = localStorageService.get('record_id');
                        dbservice.runQuery(conditionQuery,[rec_id],function(res){
                            var cond_operator = field_conditions[fieldCondIndex].condition_operator;
                            var cond_value = field_conditions[fieldCondIndex].condition_value;
                            
                            if($.inArray(cond_operator,['has','have']) !== -1){

                                var existingAnswerArray = JSON.parse(res.rows.item(0)[conditioned_question_key]);
                                if(existingAnswerArray != null && existingAnswerArray[cond_value] != undefined && existingAnswerArray[cond_value] == true){
                                    conditionsArray.push('true');
                                }else{
                                    
                                    $ionicHistory.nextViewOptions({
                                        disableAnimate: true
                                    });
                                    if((SurveyData[QuestionIndex]['question_key'] == 'SID2_GID8_QID84' || SurveyData[QuestionIndex]['question_key'] == 'SID1_GID1_QID281')){
                                        console.log(conditionsArray);
                                        conditionsArray.push('false');
                                       
                                    }else{
                                        window.clearTimeout(timer);
                                        $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{reload:true});
                                    }
                                }

                            }else{
                                if(eval('"'+res.rows.item(0)[conditioned_question_key]+'" '+cond_operator+' '+cond_value)){
                                    conditionsArray.push('true');
                                }else{
                                    $ionicHistory.nextViewOptions({
                                        disableAnimate: true
                                    });
                                    window.clearTimeout(timer);
                                    $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1},{reload:true});
                                }
                            }
                            fieldCondIndex++;
                            checkFieldConditions(fieldCondIndex);
                        }, function(error){
                            console.log(error);
                        });
                    }else{
                        if($.inArray('true',conditionsArray) == -1){
                            window.clearTimeout(timer);
                            $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(QuestionIndex)+1});
                        }
                    }
                }
            }

        }catch(e){
            console.log(e);
            // console.log('No conditions found');
        }
        //Question conditions ends here ############################################################

	    var QuestType  =  SurveyData[QuestionIndex].question_type;
	    var DrawHTML = {
	    				  'QuestionText': SurveyData[QuestionIndex].question_text, 
	    				  'QuestionDesc': SurveyData[QuestionIndex].question_desc,
	    				  'QuestAnswers': JSON.parse(SurveyData[QuestionIndex].answers)[0],
	    				  'scope'		: $scope,
	    				  'raw'			: SurveyData[QuestionIndex],
	    				  'ls'			: localStorageService
		    		   };
		// console.log(QuestType);
		$scope.numberAnswer = {};
		switch(QuestType){

			case'text':
				text(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse);
			break;

			case'message':
				message(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse);
			break;

			case'textarea': //textarea
				textarea(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse);
			break;

			case'number':
				number(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'email':
				email(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'radio':
				radio(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'checkbox':
				checkbox(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'select'://select
				select(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
			break;

			case'datepicker':
				date(DrawHTML, ionicDatePicker);
			break;

			case'timepicker':
				time(DrawHTML, ionicTimePicker);
			break;

			case'location':
				GpsLocation(DrawHTML,$ionicLoading, $cordovaGeolocation);
			break;

			case'repeater':
				repeater(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $compile, $ionicLoading);
			break;

			case'text_image':
				text_only(DrawHTML, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce);
		}

		/*############################## HARD CODED CONDITIONS ##############################*/
		
			if(	(QuestionIndex == 2 && $state.params.groupId == 5 && $state.params.surveyId == 2)||
				(QuestionIndex == 1 && $state.params.groupId == 19 && $state.params.surveyId == 5)){
				if(localStorageService.get('record_id') > 9){
					$scope.textAnswer = {
						value : '00'+localStorageService.get('record_id')
					};
				}else{
					$scope.textAnswer = {
						value : '000'+localStorageService.get('record_id')
					};
				}
				$scope.readonlyText.status = true;
			}
			if($state.params.surveyId == 2 && $state.params.groupId == 5 && QuestionIndex == 3){
				var datavalues = localStorageService.get('uniqueSerial');
				$scope.textAnswer.value = datavalues[0]+''+datavalues[1]+''+datavalues[2];
				$scope.readonlyText.status = true;
			}
			if($state.params.surveyId == 5 && $state.params.groupId == 19 && QuestionIndex == 2){
				var datavalues = localStorageService.get('uniqueSerial');
				$scope.textAnswer.value = datavalues[0]+''+datavalues[1];
				$scope.readonlyText.status = true;
			}
			if(	($state.params.surveyId == 2)){
				// console.log(localStorageService.get('uniqueSerial'));
				if(localStorageService.get('uniqueSerial') != undefined && localStorageService.get('uniqueSerial') != null){
					var datavalues = localStorageService.get('uniqueSerial');
					if(datavalues[1] != undefined && datavalues[2] != undefined){
						$scope.iris_id = 'IRISID: '+datavalues[0]+''+datavalues[1]+''+datavalues[2];
					}
				}
			}

			if(	($state.params.surveyId == 5)){
				if(localStorageService.get('uniqueSerial') != undefined && localStorageService.get('uniqueSerial') != null){
					var datavalues = localStorageService.get('uniqueSerial');
					if(datavalues[0] != undefined && datavalues[1] != undefined){
						$scope.iris_id = 'IRISID: '+datavalues[0]+''+datavalues[1];
					}
				}
			}

		/*####################################################################################*/
        //Pre fill answer
        var getAnswer = 'SELECT '+SurveyData[QuestionIndex].question_key+' FROM survey_result_'+SurveyData[QuestionIndex].survey_id+' WHERE id = ?';
        dbservice.runQuery(getAnswer,[localStorageService.get('record_id')],function(resp){
            var answ = '';
            switch(QuestType){
                case'text':
                    try{
                        var answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.textAnswer.value = answ;
                    }
                break;

                case'number':
                    try{
                        answ = parseInt(resp.rows.item(0)[SurveyData[QuestionIndex].question_key]);
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.numberAnswer.value = answ;
                    }
                break;

                case'select':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.selectAnswer.value = answ;
                    }
                break;

                case'checkbox':
                    try{
                        answ = JSON.parse(resp.rows.item(0)[SurveyData[QuestionIndex].question_key]);
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.checkboxAnswer = answ;
                    }
                break;

                case'radio':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.radioAnswer.value = answ;
                    }
                break;

                case'datepicker':
                case'timepicker':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.textAnswer = answ;
                    }
                break;

                case'email':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.emailAnswer = answ;
                    }
                break;

                case'textarea':
                    try{
                        answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    }catch(e){

                    }
                    if(answ != '' && answ != null){
                        $scope.$parent.textareaAnswer = answ;
                    }
                break;

                case'repeater':
                    answ = resp.rows.item(0)[SurveyData[QuestionIndex].question_key];
                    if(answ != '' && answ != null){
                        var answData = JSON.parse(answ);
                        // console.log(answData);
                        for(var clone = 1; clone < answData.length; clone++){
                            var divClone = $('.repeaterRow:last').clone();
                            $('.repeater').append(divClone);
                            $('.repeaterRow:last').find('.vehicle-count').html(clone+1);
                        }

                        var ind = 1;
                        $.each(answData, function(key,val){
                            $.each(val, function(cl,v){
                                var elem = $('.repeaterRow:nth-child('+ind+')');
                                if(elem.find('div[key='+cl+'] input').attr('type') != 'radio'){
                                    elem.find('div[key='+cl+'] select, div[key='+cl+'] input').val(v);
                                }else{
                                    elem.find('div[key='+cl+'] input[value='+v+']').attr('checked','checked');
                                }
                                if(cl == 'SID2_GID9_QID89'){
                                    if(v == '9'){
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID89').show();
                                            elem.find('.SID2_GID9_QID295').show();
                                            elem.find('.SID2_GID9_QID92').show();
                                        },1500);
                                    }else if($.inArray(v.toString(),['1','2','3a']) == -1){
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID295').show();
                                            elem.find('.SID2_GID9_QID92').show();
                                            elem.find('.SID2_GID9_QID89').hide();
                                        },1500);
                                        
                                    }else{
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID89').hide();
                                            elem.find('.SID2_GID9_QID295').hide();
                                            elem.find('.SID2_GID9_QID92').hide();
                                        },1500);
                                    }
                                }
                                if(cl == 'SID2_GID9_QID90'){
                                    if(v == '9'){
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID90').show();
                                        },1500);
                                    }else{
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID90').hide();
                                        },1500);
                                    }
                                }

                                if(cl == 'SID2_GID9_QID91'){
                                    if(v == '9'){
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID91').show();
                                        },1500);
                                    }else{
                                        setTimeout(function(){
                                            elem.find('.SID2_GID9_QID91').hide();
                                        },1500);
                                    }
                                }
                            });
                            ind++;
                        });
                        $('input[name=number_of_vehicle]').val(ind-1);
                    }
                break;
            }
        });
	});
    $scope.showHideQuestion = true;
    $scope.$parent.checkboxAnswer = {};
    $scope.checkUnkown = function(value){
        if(value == 98 || value == '98'){
            var checkBoxObjectArray = $scope.$parent.checkboxAnswer;
            if(checkBoxObjectArray[98] !== undefined && checkBoxObjectArray[98] != false){
                $scope.$parent.checkboxAnswer = {};
                $scope.$parent.checkboxAnswer[98] = true;
            }
        }else{
            try{
                $scope.$parent.checkboxAnswer[98] = false;
            }catch(e){

            }
        }
        console.log($scope.$parent.checkboxAnswer);
    }


})

.controller('nextQuest', function($scope, $rootScope, $ionicLoading, localStorageService, $state, AppConfig, ionicDatePicker, dbservice, $cordovaDevice, $ionicHistory){



	$scope.QuestNext = function(nextQuestion){
        if($scope.discardStatus){
            if($scope.notDisable){
                
            }
        }
		var locS = localStorageService;

		var QuestionIndex = 0;
		
		if($state.params.QuestId.trim() != ''){

			QuestionIndex = $state.params.QuestId;
			
		}

		var getQuestions = 'SELECT * FROM survey_questions WHERE group_id = ? AND survey_id = ?';
		dbservice.runQuery(getQuestions, [$state.params.groupId,$state.params.surveyId], function(res){
			var row = {};
	      	for(var i=0; i<res.rows.length; i++) {
	          	row[i] = res.rows.item(i)
	      	}
	      	var SurveyData = row;
			//to get question_type for store in answer
			
            var QuestType  =  SurveyData[QuestionIndex].question_type;

			var RequiredCheck = SurveyData[QuestionIndex].required;
			/*############################## HARD CODED ##################################*/
				if($state.params.surveyId == 2 && $state.params.groupId == 5){
					if($.inArray(parseInt(QuestionIndex),[0,1,2]) !== -1){
						RequiredCheck = 'yes';
					}
				}
				if($state.params.surveyId == 5 && $state.params.groupId == 19){
					if($.inArray(parseInt(QuestionIndex),[0,1]) !== -1){
						RequiredCheck = 'yes';
					}
				}
                if($.inArray(parseInt(SurveyData[QuestionIndex].question_id),[50,56,98,149,186,46,139]) != -1){
                    RequiredCheck = 'yes';
                }
			/*###########################################################################*/
            try{
                var fieldValidations = JSON.parse(SurveyData[QuestionIndex].field_validations);
                angular.forEach(fieldValidations, function(validation,k){
                    if(validation.validation == 'required'){
                        RequiredCheck = 'yes';
                    }
                });
            }catch(e){
                console.log(e);
            }
			if(RequiredCheck == 'yes'){
				var valResult = validation($scope, QuestType, $ionicLoading, SurveyData[QuestionIndex]);
				if(valResult == true){
					if(SurveyData[QuestionIndex].pattern != '' && SurveyData[QuestionIndex].pattern != null){
						var validationResult = validatePattern($scope, QuestType, $ionicLoading, SurveyData[QuestionIndex].pattern, SurveyData[QuestionIndex]);
						if(validationResult == false){
							return false;
						}
					}
                    locS.set('lastQuestionIndex',QuestionIndex);
					goToNext(QuestionIndex, $scope, QuestType, $state, SurveyData[QuestionIndex], locS, nextQuestion, dbservice, $cordovaDevice, $ionicHistory);
				}
			}else{
				if(SurveyData[QuestionIndex].pattern != '' && SurveyData[QuestionIndex].pattern != null){
					var validationResult = validatePattern($scope, QuestType, $ionicLoading, SurveyData[QuestionIndex].pattern, SurveyData[QuestionIndex]);
					if(validationResult == false){
						return false;
					}
				}
                locS.set('lastQuestionIndex',QuestionIndex);
				goToNext(QuestionIndex, $scope, QuestType, $state, SurveyData[QuestionIndex], locS, nextQuestion, dbservice, $cordovaDevice, $ionicHistory);
			}

			if(SurveyData == undefined){
				$state.go('app.dashboard');
			}
		});
	}

})


.controller('prevQuest', function($scope, $rootScope, $ionicLoading, localStorageService, $state, $ionicHistory, $ionicViewSwitcher){
	$scope.goToPrev = function(){
        $ionicViewSwitcher.nextDirection('back');
        var lastQuestInd = localStorageService.get('lastQuestionIndex');
        if(lastQuestInd != null & lastQuestInd != ''){
            localStorageService.set('lastQuestionIndex',null);
            $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId':lastQuestInd});
        }else{
            var preFilledQuestions = localStorageService.get('filled_questions');
            if($.inArray(parseInt($state.params.QuestId),preFilledQuestions) != -1){
                var questInd = preFilledQuestions.indexOf(parseInt($state.params.QuestId)) - 1;
                $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId':preFilledQuestions[questInd]});
            }else{
                $state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': parseInt(preFilledQuestions[preFilledQuestions.length - 1])});
            }
        }
        
	}
});


function goToNext(QuestionIndex, $scope, QuestType, $state, rawData, locS, nextQuestion, dbservice, $cordovaDevice, $ionicHistory){
	$scope.showHideQuestion = false;
	StoreAnswer(QuestionIndex,$scope, QuestType, rawData, locS, dbservice, $state, $cordovaDevice);
	if(nextQuestion != ''){
		QuestionIndex = nextQuestion;
		var $next = parseInt(QuestionIndex);
	}else{
		var $next = parseInt(QuestionIndex) + 1;
	}
    
    //Set localstorage data 
        var preFilledQuestions = locS.get('filled_questions');
        if(preFilledQuestions == null){
            preFilledQuestions = [];
        }
        if($.inArray(parseInt(QuestionIndex),preFilledQuestions) == -1){
            preFilledQuestions.push(parseInt(QuestionIndex));
        }
        locS.set('filled_questions',preFilledQuestions);
    /******************************/
    $ionicHistory.clearHistory();
    $ionicHistory.clearCache();
	$state.go('app.survey',{'surveyId':$state.params.surveyId, 'QuestId': $next},{replace: true});
}

function checkbox(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);

	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}

	$scope.checkboxOptions = params.QuestAnswers;
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/checkbox.html'\"></div>";
}


function text(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse){

	var $scope = params.scope;
	$scope.textAnswer = {};
	$scope.textAnswer.value = '';
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);

	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}

	if(params.raw.media != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){
				
				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];
				
			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			$scope[key] = obj.nativeURL;
			          	break;
			          	case'audio':
			          		$scope[key] = obj.nativeURL;
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	
	if(params.raw.pattern == 'number'){
		$scope.onlyNumbers = /^\d+$/;
		$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/number.html'\"></div>";
	}else{
		$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/text.html'\"></div>";
	}
	$scope.readonlyText.status = false;

}

function repeater(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $compile, $ionicLoading){
	var $scope = params.scope;
	$scope.quest_type = 'repeater';
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.fieldsList = JSON.parse(params.raw.fields);
	if(params.raw.media != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){
				
				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];
				
			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			$scope[key] = obj.nativeURL;
			          	break;
			          	case'audio':
			          		$scope[key] = obj.nativeURL;
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/repeater.html'\"></div>";
    setTimeout(function(){
        $('input[type=radio],input[type=number]').removeAttr('ng-model').removeClass('ng*');
        $('.SID2_GID9_QID89, .SID2_GID9_QID90, .SID2_GID9_QID91, .SID2_GID9_QID92, .SID2_GID9_QID295').hide();
    },1000);
    $('body').on('change','.SID2_GID9_QID93 select', function(){
        var elem = $(this).parents('.repeaterRow');
        if($(this).val() == '9'){
            elem.find('.SID2_GID9_QID89').show();
            elem.find('.SID2_GID9_QID295').show();
            elem.find('.SID2_GID9_QID92').show();
        }else if($.inArray($(this).val().toString(),['1','2','3a']) == -1){
            elem.find('.SID2_GID9_QID295').show();
            elem.find('.SID2_GID9_QID92').show();
            elem.find('.SID2_GID9_QID89').hide();
        }else{
            elem.find('.SID2_GID9_QID89').hide();
            elem.find('.SID2_GID9_QID295').hide();
            elem.find('.SID2_GID9_QID92').hide();
        }
    });
    $('body').on('change','.SID2_GID9_QID222 select', function(){
        var elem = $(this).parents('.repeaterRow');
         if($(this).val() == '9'){
            elem.find('.SID2_GID9_QID90').show();
         }else{
            elem.find('.SID2_GID9_QID90').hide();
         }
    });
    $('body').on('change','.SID2_GID9_QID226 select', function(){
        var elem = $(this).parents('.repeaterRow');
        if($(this).val() == '9'){
            elem.find('.SID2_GID9_QID91').show();
         }else{
            elem.find('.SID2_GID9_QID91').hide();
         }
    });
    $scope.repeater = true;
    // console.log($scope.fieldsList);
	$scope.templateUrl = function(type,answers,field){
        
        $scope.selectOptions = answers;
        $scope.radioOptions = '';
		$scope.radioOptions = answers;
        $scope.questId = field.question_id;
        $scope.questionkey = field.question_key;
		return "surveyTemplate/"+type+".html";
	}
    

	
	$scope.createClone = function(){
        if($('input[name=number_of_vehicle]').val().trim() != '' && $('input[name=number_of_vehicle]').val().trim() != null){
            if($('.repeaterRow').length < parseInt($('input[name=number_of_vehicle]').val())){
                var cloneRow = $('.repeaterRow:last').clone();
                $('.repeater').append(cloneRow);
                $('.repeaterRow:last').find('select,input[type=text]').val('');
                $('.repeaterRow:last').find('.SID2_GID9_QID89, .SID2_GID9_QID90, .SID2_GID9_QID91').hide();
                var test = Math.random();
                test = test.toString().split('.');
                $('.repeaterRow:last').find('input[type=radio]').attr('name',test[1]);
                $('.repeaterRow:last').find('.vehicle-count').html($('.repeaterRow').length);
            }else{
                $ionicLoading.show({
                  template: 'You entered maximum vehicles!',
                  noBackdrop: false,
                  duration: 1500
                });
            }
        }else{
            $ionicLoading.show({
              template: 'Please enter number of vehicles',
              noBackdrop: false,
              duration: 1500
            });
        }
	}
}

function message(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse){

	var $scope = params.scope;
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);

	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	if(params.raw.media != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){
				
				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];
				
			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			$scope[key] = obj.nativeURL;
			          	break;
			          	case'audio':
			          		$scope[key] = obj.nativeURL;
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	
	
	//$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/message.html'\"></div>";

}

function date(params, ionicDatePicker){

	var $scope = params.scope;
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/datepicker.html'\"></div>";
	var ipObj1 = {
				      callback: function (val) {  
				        var SelectedDate = new Date(val);
				        $scope.textAnswer = SelectedDate.getFullYear()+'-'+(SelectedDate.getMonth()+1)+'-'+SelectedDate.getDate();
				      },
				      from: new Date(1990, 1, 1), 
				      to: new Date(),
				      inputDate: new Date(),
				      mondayFirst: true,
				      closeOnSelect: false,
				      templateType: 'modal'
			    };

	$scope.DatePicker = function(){
		ionicDatePicker.openDatePicker(ipObj1);
		
	}
}

function time(params, ionicTimePicker){

	var $scope = params.scope;
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/timepicker.html'\"></div>";
	var ipObj1 = {
	    callback: function (val) {      //Mandatory
	      if (typeof (val) === 'undefined') {
	        console.log('Time not selected');
	      } else {
	        var selectedTime = new Date(val * 1000);
	        $scope.textAnswer = selectedTime.getUTCHours()+':'+selectedTime.getUTCMinutes();
	        // console.log('Selected epoch is : ', val, 'and the time is ', selectedTime.getUTCHours(), 'H :', selectedTime.getUTCMinutes(), 'M');
	      }
	    },
	    inputTime: 50400,   //Optional
	    format: 12,         //Optional
	    step: 1,           //Optional
	    setLabel: 'Set'    //Optional
	  };
  
	$scope.timePicker = function(){
		
		ionicTimePicker.openTimePicker(ipObj1);
	}
}

function GpsLocation(params, $ionicLoading, $cordovaGeolocation){

	var $scope = params.scope;
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/location.html'\"></div>";
	$scope.getLoaction = function(){
		$ionicLoading.show({
          template: '<ion-spinner class="spinner-energized"></ion-spinner>',
          noBackdrop: false,
          duration: 10000
        });
        var posOptions = {timeout: 10000, enableHighAccuracy: true};
        $cordovaGeolocation
		   .getCurrentPosition(posOptions)
			
		   .then(function (position) {
		      window.lat  = position.coords.latitude
		      window.long = position.coords.longitude
		      console.log(lat + '   ' + long);
		      $scope.locAnswer = lat+','+long;
		      $ionicLoading.hide();
		});
		/*navigator.geolocation.watchPosition(function(position){
			var location = position.coords.latitude.toFixed(8)+','+position.coords.longitude.toFixed(8);
			$scope.locAnswer = location;
			$ionicLoading.hide();
		});*/
	}
}

function textarea(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/textarea.html'\"></div>";
}

function text_only(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          		//$scope[key] = obj.nativeURL;
			          		/*var model = $parse(key);
			          		model.assign($scope,obj.nativeURL);*/
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "";
}


function number(params){

	var $scope = params.scope;
	$scope.numberAnswer = {};
	$scope.numberAnswer.value = '';
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
    $scope.repeater = false;
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/number.html'\"></div>";
}

function email(params){

	var $scope = params.scope;
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/email.html'\"></div>";
}

function radio(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	$scope.radioAnswer = {};
	$scope.radioAnswer.value = '';
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.radioOptions = params.QuestAnswers;
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          		//$scope[key] = obj.nativeURL;
			          		/*var model = $parse(key);
			          		model.assign($scope,obj.nativeURL);*/
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/radio.html'\"></div>";
}


function select(params, ionicDatePicker, $q, $rootScope, $cordovaFile, $parse, $sce){

	var $scope = params.scope;
	$scope.selectAnswer = {};
	$scope.selectAnswer.value = '';
	params.QuestionDesc = checkForMedia(params, $q, $rootScope, $cordovaFile);
	$scope.QuesHtml = "<p>"+params.QuestionText+"</p>";
	if(params.QuestionDesc != null){
		$scope.DescHtml = "<p>"+params.QuestionDesc+"</p>";
	}
	$scope.$parent.selectAnswer = {};
	$scope.selectOptions = params.QuestAnswers;
	console.log(params.QuestAnswers);
	
	if(params.ls.get('SurveyMedia') != 'null'){
		document.addEventListener("deviceready", function() {
			var num = 1;
			angular.forEach(params.ls.get('SurveyMedia'), function(value, key){

				var splitObjKey = key.split('_');
				var splited = value.split('/');
				var splitedLength = splited.length;
				var fname = "SmaartMedia/"+splited[splitedLength-1];

			  	$cordovaFile.checkFile(cordova.file.externalRootDirectory, fname)
			      .then(function(obj) {
			      	switch(splitObjKey[0]){
			      		case'image':
			      			// var model = $parse(key);
			      			$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			      			// model.assign($scope,obj.nativeURL);
			          	break;
			          	case'audio':

			          		$scope[key] = $sce.trustAsResourceUrl(obj.nativeURL);
			          		//$scope[key] = obj.nativeURL;
			          		/*var model = $parse(key);
			          		model.assign($scope,obj.nativeURL);*/
			          	break;
			      	}
			      }, function(error) {
			          console.log(error);
			      });

			      num++;
			});
			
		});
	}
	$scope.AnswerHtml = "<div ng-include src=\"'surveyTemplate/select.html'\"></div>";
}



function StoreAnswer(QuestionIndex, $scope, type, rawData, locS, dbservice, $state, $cordovaDevice){
	/*console.log($scope.numberAnswer);
	return false;*/
	var answer_of_current_question = '';
	switch(type){

		case'text':
			if(rawData.pattern == 'number'){
				answer_of_current_question = ($scope.numberAnswer.value === undefined)?null:$scope.numberAnswer.value;
			}else{
				answer_of_current_question = ($scope.$parent.textAnswer === undefined)?null:$scope.textAnswer.value;
			}			
		break;

		case'textarea'://text_only
			answer_of_current_question = $scope.textareaAnswer;
		break;

		case'number':
			answer_of_current_question = $scope.numberAnswer.value;
		break;

		case'email':
			answer_of_current_question = $scope.emailAnswer;
		break;

		case'radio':
			answer_of_current_question = $scope.radioAnswer.value;
            locS.set('submit_section',$scope.radioAnswer.value);
		break;

		case'checkbox':
			var checkBoxObject = {};
			angular.forEach($scope.$parent.checkboxOptions, function(val, key){
				if(val.option_value != ''){
                    
                    checkBoxObject[val.option_value] = false
                   
				}
			});
			angular.forEach($scope.$parent.checkboxAnswer, function(val,key){
                if(key != 98 || key != '98'){
                    checkBoxObject[key] = (val == false)?val:true;
                }else{
                    checkBoxObject[key] = val;
                }
			});
			answer_of_current_question = JSON.stringify(checkBoxObject);
		break;

		case'select'://dropdown
			answer_of_current_question = $scope.selectAnswer.value;
		break;

		case'datepicker':
			answer_of_current_question = ($scope.textAnswer === undefined)?null:$scope.textAnswer;
		break;

		case'timepicker':
			answer_of_current_question = ($scope.textAnswer === undefined)?null:$scope.textAnswer;
		break;

		case'location':
			answer_of_current_question = ($scope.locAnswer === undefined)?null:$scope.locAnswer;
		break;

		case'repeater':
            locS.set('submit_section',$('input[name=submit_section]:checked').val());
			var answerObject = [];
			$('.repeaterRow').each(function(i){
				var questionsObjectArray = {};
				$(this).find('.repeater_field').each(function(j){
                    if($(this).find('input').attr('type') == 'radio'){
                        questionsObjectArray[$(this).find('.textBoxSurvey').attr('key')] = $(this).find('input[type=radio]:checked').val();
                    }else{
                        questionsObjectArray[$(this).find('.textBoxSurvey').attr('key')] = $(this).find('select,input,input[type=radio]:checked').val();
                    }
				});
				answerObject.push(questionsObjectArray);
			});
            console.log(answerObject);
			answer_of_current_question = JSON.stringify(answerObject);
		break;
	}
	/*######################################## HARD CODED ########################################*/
	if(	($state.params.groupId == 5 && $state.params.surveyId == 2)||
				($state.params.groupId == 19 && $state.params.surveyId == 5)){
		if(locS.get('uniqueSerial') != null && locS.get('uniqueSerial') != undefined){
			var oldData = locS.get('uniqueSerial');
			oldData[QuestionIndex] = answer_of_current_question;
			locS.set('uniqueSerial',oldData);
		}else{
			var oldData = {};
			oldData[QuestionIndex] = answer_of_current_question;
			locS.set('uniqueSerial',oldData);
		}
	}
	/*###########################################################################################*/
	saveResult(rawData, locS, dbservice, $state, answer_of_current_question, $cordovaDevice, QuestionIndex);
	return true;
}


function saveResult(questionData, localStorage, dbservice, $state, answer, $cordovaDevice, QuestionIndex){
	var record_id = localStorage.get('record_id');
	QuestionIndex = $state.params.QuestId;
	if(record_id != null){
		//update with where clause
		var Query = 'UPDATE survey_result_'+$state.params.surveyId+' set '+questionData.question_key+' = ?, last_field_id = ?, last_group_id = ? WHERE id = ?';
		dbservice.runQuery(Query,[answer,QuestionIndex,$state.params.groupId,record_id],function(res) {
	          console.log("record updated ");
        }, function (err) {
          console.log(err);
        });
	}else{

		//insert new record
		var NameAndID = localStorage.get('CurrentSurveyNameID');
		var dateForUnique = new Date(Date.now());
        var app_mode = localStorage.get('app_mode');
        if(app_mode == null || app_mode == undefined || app_mode == ''){
            app_mode = 'live';
        }
		var uniqueKey = NameAndID.id+''+dateForUnique.getFullYear()+''+(dateForUnique.getMonth()+1)+''+dateForUnique.getDay()+''+dateForUnique.getHours()+''+dateForUnique.getMinutes()+''+dateForUnique.getSeconds()+''+dateForUnique.getMilliseconds()+''+Math.floor(Math.random() * 10000000);
		var Query = 'INSERT INTO survey_result_'+$state.params.surveyId+'('+questionData.question_key+', survey_started_on, survey_submitted_by, survey_submitted_from, imei, unique_id, device_detail, created_by, created_at, last_field_id, survey_status, last_group_id, record_type) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)';
		dbservice.runQuery(Query,
									[
										answer, localStorage.get('startStamp'), 
										localStorage.get('userId'),'app','NULL',uniqueKey, 
										JSON.stringify($cordovaDevice.getDevice()),
										// 'device_details',
										localStorage.get('userId'), 
										timeStamp(), QuestionIndex,
										'incomplete',
										$state.params.groupId,
                                        app_mode
									],
		function(res) {
          console.log("record created ");
          localStorage.set('record_id',res.insertId);
        }, function (err) {
          console.log(err);
        });
	}
	
}

function replaceImageShortCodes(rawData, $q, $rootScope, $cordovaFile){
	
	var img='';
	var QuestDesc = rawData.QuestionDesc;
	angular.forEach(rawData.ls.get('SurveyMedia'), function(value, key) {
		var split = key.split('_');
		if(split[0] == 'image'){
			var reg = new RegExp('\\[' + key +'\\]');
			QuestDesc = QuestDesc.replace(reg, '<img ng-src="{{'+key+'}}" style="max-width:100%;" />');
		}

	});
	return QuestDesc;
}

function getDeferdData($scope, $q){
	var splited = value.split('/');
	var splitedLength = splited.length;
	var imagePath = '';
	var deferred = $q.defer();
	document.addEventListener("deviceready", function() {
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
			imagePath = fileSystem.root.toURL() + 'SmaartMedia/' + splited[splitedLength-1];
			deferred.resolve(imagePath);
			$rootScope.$apply();
		});
	}, false);
	return deferred.promise;
}

function replaceAudioShortCode(rawData){

	var QuestDesc = rawData.QuestionDesc;
	angular.forEach(rawData.ls.get('SurveyMedia'), function(value, key) {
		var split = key.split('_');
		if(split[0] == 'audio'){
			var nameSplit = value.split('/');
			nameSplit = nameSplit[nameSplit.length-1];
			var rand_class = Math.floor(Math.random() * 1000);
			var reg = new RegExp('\\[' + key +'\\]');
        	QuestDesc = QuestDesc.replace(reg, '<img src="img/375.png" width="50" ng-click="play(\''+nameSplit+'\','+rand_class+')" class="playMusic_'+rand_class+'" ><img src="img/pause-512.png" width="50" ng-click="stop(\''+nameSplit+'\','+rand_class+')" class="pauseMusic_'+rand_class+'" style="display:none;" >');
		}

	});
	//console.log(QuestText);
	return QuestDesc;
}

function checkForMedia(rawData, $q, $rootScope, $cordovaFile){

	var splitedKey;
	var QuestDesc = '';
	rawData.QuestionDesc = replaceAudioShortCode(rawData);
	rawData.QuestionDesc = replaceImageShortCodes(rawData, $q, $rootScope, $cordovaFile);
	return rawData.QuestionDesc;
}

function validatePattern($scope, type, $ionicLoading, pattern, rawData){
	switch(type){
		case'text':
			if(pattern != 'others'){
				/*var reg = eval(pattern);
				if(reg.test($scope.textAnswer)){
					return true;
				}else{
					var message = '';
					if(pattern == /\S+@\S+\.\S+/){
						message = 'Please enter correct email'
					}else if(pattern == /^\d+$/){
						message = 'Enter numbers only!';
					}else if(pattern == /^[a-zA-Z]+$/){
						message = 'Enter alphabets only!';
					}else{
						message = 'Enter correct value!';
					}
					$ionicLoading.show({
				      template: message,
				      noBackdrop: false,
				      duration: 1000
				    });
				    return false;
				}*/
				if(pattern == 'email'){
					var reg = /\S+@\S+\.\S+/;
					if(reg.test($scope.textAnswer)){
						return true;
					}else{
						$ionicLoading.show({
					      template: 'Please enter correct email!',
					      noBackdrop: false,
					      duration: 1000
					    });
					    return false;
					}
				}
				if(pattern == 'number'){
					var reg = /^\d+$/;
					if(reg.test($scope.$parent.numberAnswer)){
						return true;
					}else{
						$ionicLoading.show({
					      template: 'Enter numbers only!',
					      noBackdrop: false,
					      duration: 1000
					    });
					    return false;
					}
				}
				if(pattern == 'text'){
					var reg = /^[a-zA-Z0-9 ]+$/;
					if(reg.test($scope.textAnswer)){
						return true;
					}else{
						$ionicLoading.show({
					      template: 'Enter alphabets only!',
					      noBackdrop: false,
					      duration: 1000
					    });
					    return false;
					}
				}
				if(pattern == 'url'){
					var reg = /^(ftp|http|https):\/\/[^ "]+$/;
					if(reg.test($scope.textAnswer)){
						return true;
					}else{
						$ionicLoading.show({
					      template: 'Enter correct url!',
					      noBackdrop: false,
					      duration: 1000
					    });
					    return false;
					}
				}
			}else{
				console.log(rawData.otherPattern);
				var reg = eval(rawData.otherPattern);
				if(reg.test($scope.textAnswer)){
					return true;
				}else{
					$ionicLoading.show({
				      template: 'Enter correct data!',
				      noBackdrop: false,
				      duration: 1000
				    });
				    return false;
				}
			}
		break;
	}
}

function validation($scope, type, $ionicLoading, rawData){

	switch(type){

		case'text':
			if(rawData.pattern == 'number'){
				if($scope.numberAnswer === undefined || $scope.numberAnswer == null){
					$ionicLoading.show({
				      template: 'Please fill answer!',
				      noBackdrop: false,
				      duration: 1000
				    });
				    return false;
				}
			}else{
				if($scope.textAnswer.value === undefined || $scope.textAnswer.value == ''){
					$ionicLoading.show({
				      template: 'Please fill answer!',
				      noBackdrop: false,
				      duration: 1000
				    });
				    return false;
				}
			}
		break;

		case'text_only'://textarea
			if($scope.textareaAnswer === undefined){
				$ionicLoading.show({
			      template: 'Please fill answer!',
			      noBackdrop: false,
			      duration: 1000
			    });
			    return false;
			}
		break;

		case'number':
            // ############################################ HARD CODED #############################################
            if($.inArray(parseInt(rawData.question_id),[50,56,98,149,186]) != -1){
                console.log($scope.$parent.numberAnswer);
                if($scope.$parent.numberAnswer === undefined || $scope.$parent.numberAnswer.value == null || $scope.$parent.numberAnswer.value == ''){
                    return true;
                }else{
                    if($scope.$parent.numberAnswer.value.toString().length < 10 || $scope.$parent.numberAnswer.value.toString().length > 10){
                        $ionicLoading.show({
                          template: 'Please fill mobile in proper format!',
                          noBackdrop: false,
                          duration: 1000
                        });
                        return false;
                    }
                }
            }
            if($.inArray(parseInt(rawData.question_id),[276,275]) != -1){
                if($scope.$parent.numberAnswer.value == null || $scope.$parent.numberAnswer.value == ''){
                    $ionicLoading.show({
                      template: 'Please mention age with min one and max two digits!',
                      noBackdrop: false,
                      duration: 4000
                    });
                    return false;
                }
                if($scope.$parent.numberAnswer.value.toString().length > 2 || $scope.$parent.numberAnswer.value.toString().length == 0){
                    $ionicLoading.show({
                      template: 'Please mention age with min one and max two digits!',
                      noBackdrop: false,
                      duration: 4000
                    });
                    return false;
                }
            }
            // ############################################ HARD CODED #############################################
			if($scope.$parent.numberAnswer === undefined){
				$ionicLoading.show({
			      template: 'Please fill answer!',
			      noBackdrop: false,
			      duration: 1000
			    });
			    return false;
			}
		break;

		case'email':
			if($scope.emailAnswer === undefined || $scope.emailAnswer == ''){
				$ionicLoading.show({
			      template: 'Enter correct email',
			      noBackdrop: false,
			      duration: 1000
			    });

			    return false;
			}
		break;

		case'radio':
			console.log($scope.radioAnswer.value);
			if($scope.radioAnswer.value === undefined || $scope.radioAnswer.value == ''){
				$ionicLoading.show({
			      template: 'Please select answer',
			      noBackdrop: false,
			      duration: 1000
			    });

			    return false;
			}
		break;

		case'checkbox':			
			//var CheckBoxVal = $scope.$parent.checkboxAnswer;
			if($scope.$parent.checkboxAnswer === undefined){// || validateCheckBoxSelection(CheckBoxVal) == false){
				$ionicLoading.show({
			      template: 'Please select answer',
			      noBackdrop: false,
			      duration: 1000
			    });

			    return false;
			}else{
				var validateStatus = true;
				angular.forEach($scope.$parent.checkboxAnswer, function(value, key){
					if(value == false){
						validateStatus = false;
					}
				});
				if(validateStatus == true){
					return true;
				}else{
					$ionicLoading.show({
				      template: 'Please select answer',
				      noBackdrop: false,
				      duration: 1000
				    });
					return false;
				}
			}
		break;

        case'datepicker':
            if($scope.$parent.textAnswer == undefined || $scope.$parent.textAnswer == '' || $scope.$parent.textAnswer == null){
                $ionicLoading.show({
                  template: 'Please select answer',
                  noBackdrop: false,
                  duration: 1000
                });
                return false;
            }
        break;

		case'dropdown'://select
			/*console.log(typeof $scope.$parent.selectAnswer);
			if(typeof $scope.$parent.selectAnswer != 'object'){
				console.log('Not object')
			}
			return false;*/
			if(typeof $scope.$parent.selectAnswer == 'object'){
				$ionicLoading.show({
			      template: 'Please select answer',
			      noBackdrop: false,
			      duration: 1000
			    });

			    return false;
			}
		break;

	}
	return true;
}

function validateCheckBoxSelection(checkBoxObj){
	
	var status = false;
	angular.forEach(checkBoxObj, function(value, key){
		
		if(value == true){

			status = true;
		}
	});

	return status;
}

function setSurveyNameAndId($state, localStorageService, index, dbservice){

	
	var SurveyNameID = {};
	var surveyData = '';
	var getSurveyData = 'SELECT * FROM survey_data WHERE survey_id = ?';
	dbservice.runQuery(getSurveyData,[$state.params.surveyId], function(res){
		var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[i] = res.rows.item(i)
      	}
      	surveyData = row;
      	SurveyNameID['id'] = surveyData[0].id;
		SurveyNameID['name'] = surveyData[0].name;
		localStorageService.set('CurrentSurveyNameID',SurveyNameID);
	});
}

function findQuestionIndex(rawData, questionId){

	var QuestKey = '';
	angular.forEach(rawData, function(value, key){

		if(value.question_id == questionId){

			QuestKey = key;
		}
	});

	return QuestKey;
}

function checkConditions(conditions, rawData, localStorageService){

	
	var splitedCond = conditions.split('|');
	var compareWithval = '';
	var RepQuestIDs = splitedCond[0].match(/[\w]+(?=])/g);
	var NexQuestID = splitedCond[1].match(/[\w]+(?=])/g);
	
	var AllAnswers = localStorageService.get('allAnswers');
	var NextQuestInd = findQuestionIndex(rawData, NexQuestID[0]);
	var ansByIds = [];
	angular.forEach(RepQuestIDs, function(vals, keys){
		angular.forEach(AllAnswers, function(value, key){

			if(value.questid == vals){
				ansByIds.push(value.answer);
			}
		});
	})
	var index = 0;
	angular.forEach(RepQuestIDs, function(value, key){

		var reg = new RegExp('\\[\\[' + value +'\\]\\]');
		splitedCond[0] = splitedCond[0].replace(reg, '"'+ansByIds[index]+'"');
		index++;
	});
	
	
	var returnObj = {};
	returnObj['next'] = NextQuestInd;
	
	if(eval(splitedCond[0])){

		returnObj['status'] = 'false';
		return returnObj;
	}else{
		returnObj['status'] = 'true';
		return returnObj;
	}

}

function finishSurvey($state, localStorageService, $ionicLoading, $cordovaGeolocation, dbservice, $scope){
	window.surveyId = $state.params.surveyId;
	window.groupId = $state.params.groupId;
	var getGroupsData = 'SELECT * FROM survey_sections WHERE survey_id = ?';
	var currentSurveyGroups = '';
	dbservice.runQuery(getGroupsData, [$state.params.surveyId], function(res){
		var row = {};
      	for(var i=0; i<res.rows.length; i++) {
          	row[i] = res.rows.item(i)
      	}
      	currentSurveyGroups = row;
	})
	//var groupsData = localStorageService.get('GroupsData');
    var record_id = localStorageService.get('record_id');
	/*var currentSurveyGroups = $.grep(groupsData, function(value){
		return value.survey_id == $state.params.surveyId;
	});*/

	
	var Query = 'SELECT completed_groups from survey_result_'+$state.params.surveyId+' WHERE id = ?';
	var surveyStatus = [];
	dbservice.runQuery(Query,[record_id],function(res) {
		
		if(res.rows.length != 0 && res.rows.item(0).completed_groups != null){

			var completedGroup = JSON.parse(res.rows.item(0).completed_groups);
			completedGroup.push(parseInt(window.groupId));
            var submit_section = localStorageService.get('submit_section');
			var Query = 'UPDATE survey_result_'+window.surveyId+' SET completed_groups = ?, last_group_id = ? WHERE id = ?';
            if(submit_section == 'yes' || submit_section != 'no'){
                var discarded_groups = localStorageService.get('discarded_groups');
                try{
                    var indexToRemove = discarded_groups.indexOf(parseInt(window.groupId));
                    delete discarded_groups[indexToRemove];
                }catch(e){}
                localStorageService.set('discarded_groups',discarded_groups);
                dbservice.runQuery(Query,[JSON.stringify(completedGroup),'',record_id],function(res) {
                    localStorageService.set('completedGroups',completedGroup);
                    angular.forEach(currentSurveyGroups, function(group, key){
                        if($.inArray(group.group_id, completedGroup) != -1){
                            surveyStatus.push('completed');
                        }else{
                            surveyStatus.push('incomplete');
                        }
                    });
                    if($.inArray('incomplete', surveyStatus) != -1){
                        surveyStatus = 'incomplete';
                    }else{
                        surveyStatus = 'completed';
                    }
                    if(surveyStatus == 'completed'){
                        var Query = 'UPDATE survey_result_'+window.surveyId+' SET survey_status = ?, last_group_id = ? WHERE id = ?';
                        dbservice.runQuery(Query,[surveyStatus,'',record_id],function(res) {
                            $state.go('app.surveyGroup',{id: window.surveyId});
                            console.log("survey completed ");
                        }, function (err) {
                          console.log(err);
                        });
                        console.log(surveyStatus);
                        $state.go('app.success',{},{location:'replace'});
                    }else{
                        $ionicLoading.show({
                          template: $scope.section_submitted_text,
                          noBackdrop: false,
                          duration: 2000
                        });
                        $state.go('app.surveyGroup',{id: $state.params.surveyId});
                    }
                  console.log("group updated");
                }, function (err) {
                  console.log(err);
                });
            }else{
                $ionicLoading.show({
                  template: $scope.section_discarded_text,
                  noBackdrop: false,
                  duration: 2000
                });
                
                var discaredGroups = localStorageService.get('discarded_groups');
                if(discaredGroups == null || discaredGroups == ''){
                    discaredGroups = [];
                }
                if($.inArray(parseInt(window.groupId),discaredGroups) == -1){
                    discaredGroups.push(parseInt(window.groupId));
                    localStorageService.set('discarded_groups',discaredGroups);
                }
                $state.go('app.surveyGroup',{id: $state.params.surveyId});
            }

		}else{
            var submit_section = localStorageService.get('submit_section');
            if(submit_section == 'yes' || submit_section != 'no'){
    			var completedGroup = [];
    			completedGroup.push(parseInt(window.groupId));
    			localStorageService.set('completedGroups',completedGroup);
                var discarded_groups = localStorageService.get('discarded_groups');
                try{
                    var indexToRemove = discarded_groups.indexOf(parseInt(window.groupId));
                    delete discarded_groups[indexToRemove];

                }catch(e){}
                localStorageService.set('discarded_groups',discarded_groups);
            }else{
                var discaredGroups = localStorageService.get('discarded_groups');
                if(discaredGroups == null || discaredGroups == ''){
                    discaredGroups = [];
                }
                if($.inArray(parseInt(window.groupId),discaredGroups) == -1){
                    discaredGroups.push(parseInt(window.groupId));
                    localStorageService.set('discarded_groups',discaredGroups);
                }
            }
			angular.forEach(currentSurveyGroups, function(group, key){
				if($.inArray(group.group_id, completedGroup) != -1){
	    			surveyStatus.push('completed');
	    		}else{
	    			surveyStatus.push('incomplete');
	    		}
			});
			if($.inArray('incomplete', surveyStatus) != -1){
				surveyStatus = 'incomplete';
			}else{
				surveyStatus = 'completed';
			}
            if(submit_section == 'yes' || submit_section != 'no'){
    			var Query = 'UPDATE survey_result_'+ window.surveyId +' SET completed_groups = ?, last_group_id = ?, survey_status = ? WHERE id = ?';
    			dbservice.runQuery(Query,[JSON.stringify(completedGroup),'',surveyStatus,record_id],function(res) {
    				localStorageService.set('completedGroups',completedGroup);
                    $ionicLoading.show({
                      template: $scope.section_submitted_text,
                      noBackdrop: false,
                      duration: 2000
                    });
    				$state.go('app.surveyGroup',{id: $state.params.surveyId});
                  	console.log("group updated");
                  	console.log(surveyStatus);
                  	if(surveyStatus == 'completed'){
                  		$state.go('app.success',{},{location:'replace'});
                  	}
                }, function (err) {
                  console.log(err);
                });

            }else{
                $ionicLoading.show({
                  template: $scope.section_discarded_text,
                  noBackdrop: false,
                  duration: 2000
                });
                $state.go('app.surveyGroup',{id: $state.params.surveyId});
            }
		}
    }, function (err) {
      console.log(err);
    });
}

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    var returnArray = {};
    returnArray['h'] = hours;
    returnArray['m'] = minutes;
    returnArray['s'] = seconds;
    returnArray['ms'] = milliseconds;
    return returnArray;
}

function countdown($scope){
	if($scope.min == "00" && $scope.hour == "00" && $scope.sec == "00"){

		return true;
	}
	var hr 	= parseInt($scope.hour);
	var min = parseInt($scope.min);
	var sec = parseInt($scope.sec);
	
	if((sec - 1) < 10){
		$scope.sec = "0"+(sec - 1);
	}else{
		$scope.sec = sec - 1;
	}
	
	if(sec <= 0){
		$scope.sec = 59;
	}
	if(parseInt($scope.sec) == 0){
		var checkMin = min - 1;
		if(checkMin < 0){
			if(hr == 0){
				console.log('Finish');
			}else{
				if(($scope.hour - 1)<10){
					$scope.hour = "0"+($scope.hour - 1);
				}else{
					$scope.hour = $scope.hour - 1;
				}
				$scope.min = 59;
			}
		}else{
			if((min-1)<10){

				$scope.min = "0"+(min - 1);
			}else{

				$scope.min = min - 1;
			}
			$scope.sec = "00";
		}
	}
}