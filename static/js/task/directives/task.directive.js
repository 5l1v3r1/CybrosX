/**
 * timerDirective
 * @namespace crowdsource.task.directives
 */
(function () {
    'use strict';
    angular
        .module('crowdsource.task.directives')
        .directive('timerCounter', timerCounter);

    function timerCounter($timeout) {
        return {
            restrict: "A",
            scope: {
                secondsLeft: "="
            },
            link: function (scope, element, attributes) {
                if (angular.isUndefined(attributes.secondsLeft)) {
                    throw "seconds-left value is not passed";
                }

                scope.$watch("secondsLeft", function (val) {
                    if (val != null) {
                        var secondsLeft = parseInt(val);

                        if (!isNaN(secondsLeft)) {
                            countdown(0, secondsLeft);
                        } else {
                            throw "seconds-left value must be integer";
                        }
                    }
                });

                function countdown(minutes, seconds) {
                    var endTime, hours, mins, msLeft, time;

                    function twoDigits(n) {
                        return (n <= 9 ? "0" + n : n);
                    }

                    function updateTimer() {
                        msLeft = endTime - (+new Date);
                        if (msLeft < 1) {
                            scope.timer = "Expired";
                            $timeout.cancel();
                        } else {
                            time = new Date(msLeft);
                            hours = time.getUTCHours();
                            mins = time.getUTCMinutes();
                            scope.timer = (hours ? hours + ':' + twoDigits(mins) : mins) + ':' + twoDigits(time.getUTCSeconds());
                            $timeout(updateTimer, time.getUTCMilliseconds() + 500);
                        }
                    }

                    endTime = (+new Date) + 1000 * (60 * minutes + seconds) + 500;
                    updateTimer();
                }
            },
            template: '{{ timer }}'
        };
    }
})();


/**
 * responseDirective
 * @namespace crowdsource.task.directives
 */
(function () {
    'use strict';
    angular
        .module('crowdsource.task.directives')
        .directive('taskResponse', taskResponse);

    function taskResponse($compile, Task, TaskWorker, Template) {
        return {
            restrict: "EA",
            scope: {
                workers: '=',
                id: '='
            },
            link: function (scope, element, attributes) {
                scope.first_worker_username = scope.workers[0].value;
                scope.second_worker_username = scope.workers[1].value;
                Task.getTaskWithData(scope.id).then(function (task) {
                    var taskworker_one_id = task[0].taskworker_one;
                    var taskworker_two_id = task[0].taskworker_two;
                    var project_id = task[0].project;
                    TaskWorker.getTaskWorker(taskworker_one_id).then(function (task_worker_one) {
                        TaskWorker.getTaskWorker(taskworker_two_id).then(function (task_worker_two) {
                            Task.retrieve(task_worker_one[0].task).then(function (task_one) {
                                if (task_worker_one[0].task === task_worker_two[0].task) {
                                    scope.is_same_task = true;
                                    var questions = task_one[0].template.items;
                                    scope.items = retrieveItemsSameTask(questions, task_worker_one, task_worker_two);
                                    Template.getTemplate("peer-review").then(function (template) {
                                        var el = angular.element(template);
                                        element.html(el);
                                        $compile(el)(scope);
                                    });
                                } else {
                                    Task.retrieve(task_worker_two[0].task).then(function (task_two) {
                                        scope.is_same_task = false;
                                        var questions_one = task_one[0].template.items;
                                        var questions_two = task_two[0].template.items;
                                        scope.worker_one_items = retrieveItems(questions_one, task_worker_one);
                                        scope.worker_two_items = retrieveItems(questions_two, task_worker_two);
                                        Template.getTemplate("peer-review").then(function (template) {
                                            var el = angular.element(template);
                                            element.html(el);
                                            $compile(el)(scope);
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            }
        }
    }

    function retrieveItemsSameTask(questions, task_worker_one, task_worker_two) {
        var index = 0;
        var items = [];
        for (var i = 0; i < questions.length; i++) {
            var question = questions[i];
            if (question.type === 'instructions' || question.type === 'image' ||
                question.type === 'audio' || question.type === 'iframe') {
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type
                });
                index++;
            } else if (question.type === 'radio' || question.type === 'select_list') {
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type,
                    options: question.aux_attributes.options,
                    task_worker_one_answer: task_worker_one[0].results[index].result,
                    task_worker_two_answer: task_worker_two[0].results[index].result
                });
            } else if (question.type === 'checkbox') {
                var task_worker_one_answers = task_worker_one[0].results[index].result;
                var task_worker_two_answers = task_worker_two[0].results[index].result;
                var answer_one = "";
                var answer_two = "";
                for (var i = 0; i < task_worker_one_answers.length; i++) {
                    if (task_worker_one_answers[i].answer === true) {
                        if (i === 0) {
                            answer_one = answer_one.concat(task_worker_one_answers[i].value)
                        } else {
                            answer_one = answer_one.concat
                            (", " + task_worker_one_answers[i].value);
                        }
                    }
                    if (task_worker_two_answers[i].answer === true) {
                        if (i === 0) {
                            answer_two = answer_two.concat(task_worker_two_answers[i].value)
                        } else {
                            answer_two = answer_two.concat
                            (", " + task_worker_one_answers[i].value);
                        }
                    }
                }
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type,
                    options: question.aux_attributes.options,
                    task_worker_one_answer: answer_one,
                    task_worker_two_answer: answer_two
                });
            } else if (question.type === 'text') {
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type,
                    task_worker_one_answer: task_worker_one[0].results[index].result,
                    task_worker_two_answer: task_worker_two[0].results[index].result
                });
            } else if (question.type === 'slider') {
                var range = question.aux_attributes.min.toString().concat(" - ")
                    .concat(question.aux_attributes.max.toString());
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type,
                    range: range,
                    task_worker_one_answer: task_worker_one[0].results[index].result,
                    task_worker_two_answer: task_worker_two[0].results[index].result
                })
            }
        }
        return items;
    }

    function retrieveItems(questions, task_worker) {
        var index = 0;
        var items = [];
        for (var i = 0; i < questions.length; i++) {
            var question = questions[i];
            if (question.type === 'instructions' || question.type === 'image' ||
                question.type === 'audio' || question.type === 'iframe') {
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type
                });
                index++;
            } else if (question.type === 'radio' || question.type === 'select_list') {
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type,
                    options: question.aux_attributes.options,
                    task_worker_answer: task_worker[0].results[index].result
                });
            } else if (question.type === 'checkbox') {
                var task_worker_answers = task_worker[0].results[index].result;
                var answer = "";
                for (var i = 0; i < task_worker_answers.length; i++) {
                    if (task_worker_answers[i].answer === true) {
                        if (i === 0) {
                            answer = answer.concat(task_worker_answers[i].value)
                        } else {
                            answer = answer.concat
                            (", " + task_worker_answers[i].value);
                        }
                    }
                }
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type,
                    options: question.aux_attributes.options,
                    task_worker_answer: answer
                });
            } else if (question.type === 'text') {
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type,
                    task_worker_answer: task_worker[0].results[index].result
                });
            } else if (question.type === 'slider') {
                var range = question.aux_attributes.min.toString().concat(" - ")
                    .concat(question.aux_attributes.max.toString());
                items.push({
                    question: question.aux_attributes.question.value,
                    type: question.type,
                    range: range,
                    task_worker_answer: task_worker[0].results[index].result
                })
            }
        }
        return items;
    }
})();
