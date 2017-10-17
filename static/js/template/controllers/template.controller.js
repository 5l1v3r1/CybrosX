/**
 * TaskFeedController
 * @namespace crowdsource.template.controllers
 * @author dmorina
 */
(function () {
    'use strict';

    angular
        .module('crowdsource.template.controllers')
        .controller('TemplateController', TemplateController);

    TemplateController.$inject = ['$window', '$state', '$scope',
        'Template', '$filter', '$sce', '$mdDialog', '$timeout'];

    /**
     * @namespace TemplateController
     */
    function TemplateController($window, $state, $scope, Template, $filter, $sce, $mdDialog, $timeout) {
        var self = this;

        self.buildHtml = buildHtml;
        self.select = select;
        self.deselect = deselect;
        self.copy = copy;
        self.removeItem = removeItem;
        self.addComponent = addComponent;
        self.showTaskDesign = showTaskDesign;
        self.getIcon = getIcon;
        self.addOption = addOption;
        self.removeOption = removeOption;
        self.items_with_data = [];
        self.headers = [];
        self.getTrustedUrl = getTrustedUrl;
        self.setDataSource = setDataSource;
        self.onSort = onSort;
        self.getImageURL = getImageURL;
        self.showDisplayOnly = showDisplayOnly;
        self.sortConfig = {
            group: 'template_items',
            animation: 150,
            handle: '.handle',
            // scroll: true,
            // scrollSensitivity: 100,
            onSort: onSort
        };

        var idGenIndex = 0;

        self.items = _.map(self.items, function (item) {
            if (item.hasOwnProperty('isSelected')) {
                delete item.isSelected;
            }
            return item;
        });

        self.selectedItem = null;

        self.templateComponents = Template.getTemplateComponents($scope);

        function buildHtml(item) {
            var html = Template.buildHtml(item);
            return $sce.trustAsHtml(html);
        }


        function deselect(item) {
            $scope.project.selectedItem = null;
            if (self.selectedItem && self.selectedItem === item) {
                self.selectedItem.isSelected = false;
                self.selectedItem = null;
            }
        }

        function select(item) {
            // deselect earlier item and select this one
            if (self.selectedItem && self.selectedItem.hasOwnProperty('isSelected')) {
                self.selectedItem.isSelected = false;
            }

            self.selectedItem = item;
            item.isSelected = true;
        }

        function copy(item) {
            deselect(item);
            var component = _.find(self.templateComponents, function (component) {
                return component.type == item.type
            });

            var field = angular.copy(component);
            var curId = generateId();

            field.name = ''; //'item' + curId;
            field.aux_attributes = item.aux_attributes;
            field.required = item.required;
            var index = self.items.indexOf(item);
            addComponent(field, true, index);
            return false;
        }

        function removeItem(item) {
            var index = self.items.indexOf(item);
            self.items.splice(index, 1);
            self.selectedItem = null;
            resetItemPosition();
            Template.deleteItem(item.id).then(
                function success(response) {

                },
                function error(response) {
                    $mdToast.showSimple('Could not delete template item.');
                }
            ).finally(function () {
            });
        }

        function resetItemPosition() {
            var i = 0;
            for (i = 0; i < self.items.length; i++) {
                self.items[i].position = i + 1;
            }
        }

      $scope.$watch('task.progressPercentage', function(newValue, oldValue) {
        if(!angular.equals(newValue, oldValue)) {
          self.progressPercentage = newValue;
        }
      });

        $scope.$watch('project.project', function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue) && newValue.hasOwnProperty('template')
                && self.items && self.items.length == 0) {
                self.items = newValue.template.items;
                self.saveMessage = $scope.project.saveMessage;
            }
            if (!angular.equals(newValue, oldValue) && newValue.hasOwnProperty('batch_files')) {
                if (newValue.batch_files.length == 1) {
                    self.headers = newValue.batch_files[0].column_headers;
                }
                else {
                    self.headers = [];
                }
            }
        }, true);

        $scope.$watch('project.selectedItem', function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                self.selectedItem = newValue;
            }
        }, true);
        function addComponent(component, copy, index) {

            if (self.selectedItem && self.selectedItem.hasOwnProperty('isSelected')) {
                self.selectedItem.isSelected = false;
            }

            var field = angular.copy(component);
            var curId = generateId();
            field.name = ''; //'item' + curId;
            field.isNew = true;

            angular.extend(field, {template: $scope.project.project.template.id});
            if (!copy) {
                angular.extend(field, {position: self.items.length + 1});
            }
            else {
                // field.required = true;
                angular.extend(field, {position: index + 1});
            }

            Template.addItem(field).then(
                function success(response) {
                    angular.extend(field, {id: response[0].id});
                    if (!copy) {
                        self.items.push(field);
                    }
                    else {
                        self.items.splice(index + 1, 0, field);
                        resetItemPosition();
                    }
                    $scope.project.selectedItem = field;

                },
                function error(response) {
                    $mdToast.showSimple('Could not update project name.');
                }
            ).finally(function () {
            });

            //sync();
        }


        function generateId() {
            return '' + ++idGenIndex;
        }

        function generateRandomTemplateName() {
            var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var random = _.sample(possible, 8).join('');
            return 'template_' + random;
        }

        function sync() {
            $scope.project.template = {
                name: self.templateName,
                items: self.items
            }
        }

        //Show Modal Pop-up of the Task Design Output
        function showTaskDesign(previewButton) {
            update_item_data();

            $mdDialog.show({
                template: '<md-dialog class="centered-dialog" aria-label="preview">' +
                '<md-dialog-content md-scroll-y>' +
                '<div layout-margin>' +
                '<h3><span ng-bind="project.project.name"></span></h3>' +
                '<md-divider></md-divider>' +
                '<p ng-bind="project.taskDescription"></p>' +
                '</div>' +
                '<md-list class="no-decoration-list">' +
                '   <md-list-item class="template-item" ng-repeat="item in template.items_with_data">' +
                '       <div layout="row" flex="100">' +
                '           <div flex="85" style="outline:none">' +
                '               <div md-template-compiler="item" style="cursor: default" editor="false"></div>' +
                '           </div>' +
                '       </div>' +
                '   </md-list-item>' +
                '</md-list>' +
                '</md-dialog-content>' +
                '</md-dialog>',
                parent: angular.element(document.body),
                scope: $scope,
                targetEvent: previewButton,
                preserveScope: true,
                clickOutsideToClose: true
            });
        }

        function replaceAll(find, replace, str) {
            return str.replace(new RegExp(find, 'g'), replace);
        }

        function update_item_data() {
            angular.copy(self.items, self.items_with_data);
            self.items_with_data = _.map(self.items_with_data, function (obj) {

                if ($scope.project.project.metadata && $scope.project.project.batch_files[0].hasOwnProperty("column_headers")) {
                    angular.forEach($scope.project.project.batch_files[0].column_headers, function (header) {
                        var search = header.slice(1, header.length - 1);

                        obj.label = replaceAll(header, $scope.project.project.batch_files[0].firs_row[search], obj.label);
                        obj.values = replaceAll(header, $scope.project.project.batch_files[0].firs_row[search], obj.values);
                    });
                }

                // this will trigger recompiling of template
                delete obj.isSelected;

                return obj;
            });
        }


        function getIcon(item_type, index) {
            if (item_type == 'checkbox') return 'check_box_outline_blank';
            else if (item_type == 'radio') return 'radio_button_unchecked';
            else if (item_type == 'select') return index + '.';
        }

        function addOption($event, item) {
            var option = {
                value: 'Option ' + (item.aux_attributes.options.length + 1)
            };
            item.aux_attributes.options.push(option);

            setTimeout(function () {
                var lastAdded = $('#option_' + item.position + '-' + (item.aux_attributes.options.length - 1));

                if (lastAdded) {
                    lastAdded.focus();
                    lastAdded.select();
                }
            }, 0);
        }

        function removeOption(item, index) {
            item.aux_attributes.options.splice(index, 1);
        }

        function getTrustedUrl(url) {
            return $sce.trustAsResourceUrl(url);
        }

        function getImageURL(item) {
            var url = item.aux_attributes.src;

            var finalURL = "";
            if (url && url.trim() !== "") {
                if (url.indexOf("{{") > -1) {
                    finalURL = "http://placehold.it/600x150?text=" + url;
                } else {
                    finalURL = url;
                }

            } else {
                finalURL = "http://placehold.it/600x150?text=Provide a image URL below";
            }

            return getTrustedUrl(finalURL);
        }

        function indexOfDataSource(item, data_source) {
            return item.map(function (e) {
                return e.value;
            }).indexOf(data_source);
        }

        function setDataSource(item, data_source) {
            //For options in image,audio and iframe components
            if ((!item.options || item.src) && item.question) {
                item.src = item.src || "";
                var parsed_item_src = item.src.replace(/\s+/g, ' ').trim();

                //See if the data_source has already been linked
                if (parsed_item_src.search(new RegExp("{{\\s*" + data_source + "\\s*}}")) > -1) {
                    if (item.hasOwnProperty('src'))
                        item.src = parsed_item_src.replace(new RegExp("{\\s*" + data_source + "\\s*}", "g"), " ");
                }
                else {
                    if (item.hasOwnProperty('src'))
                        item.src += '{{' + data_source + '}}';
                }
            }
            else {
                var parsed_item_value = item.value.replace(/\s+/g, ' ').trim();

                //See if the data_source has already been linked
                if (parsed_item_value.search(new RegExp("{\\s*" + data_source + "\\s*}")) > -1) {
                    if (item.hasOwnProperty('value'))
                        item.value = parsed_item_value.replace(new RegExp("{{\\s*" + data_source + "\\s*}}", "g"), " ");
                }
                else {
                    if (item.hasOwnProperty('value'))
                        item.value += '{{' + data_source + '}}';
                }
            }

        }

        function onSort() {
            resetItemPosition();
        }

        function showDisplayOnly(isReview, isStatic) {
            return !(isReview && isStatic);
        }
    }

})();
