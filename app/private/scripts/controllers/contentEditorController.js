'use strict';

/**
 * @ngdoc function
 * @name playerApp.controller:ContentEditorController
 * @description
 * # CreatecontentCtrl
 * Controller of the playerApp
 */
angular.module('playerApp')
        .controller('ContentEditorController', function (config, $stateParams, $location, $sce, $state, contentService, $timeout, $rootScope) {

            var contentEditor = this;
            contentEditor.contentId = $stateParams.contentId;
            contentEditor.openContentEditor = function () {
                window.context = {
                    user: {
                        id: $rootScope.userId,
                        name: ""
                    },
                    sid: "rctrs9r0748iidtuhh79ust993",
                    contentId: contentEditor.contentId,
                    channel: "ntp.sunbird"
                };
                window.config = {
                    baseURL: '',
                    modalId: 'contentEditor',
                    apislug: 'api',
                    alertOnUnload: true,
                    plugins: [
                        {"id": "org.ekstep.sunbirdheader", "ver": "1.0", "type": "plugin"}
                    ],
                    dispatcher: 'local',
                    localDispatcherEndpoint: '/content-editor/telemetry'
                };
                $("#contentEditor").iziModal({
                    title: '',
                    iframe: true,
                    iframeURL: "/thirdparty/bower_components/content-editor-iframe/index.html",
                    navigateArrows: false,
                    fullscreen: false,
                    openFullscreen: true,
                    closeOnEscape: false,
                    overlayClose: false,
                    onClosed: function () {
                        $state.go('EditContent', {contentId: contentEditor.contentId});
                    }
                });

                var validateModal = {
                    state: ["WorkSpace.UpForReviewContent", "WorkSpace.ReviewContent"],
                    status: ["Review", "Draft", "Live"],
                    mimeType: config.CreateLessonMimeType
                };

                var req = {contentId: contentEditor.contentId};
                var qs = {fields: 'createdBy,status,mimeType'}

                contentService.getById(req, qs).then(function (response) {
                    if (response && response.responseCode === 'OK') {
                        var rspData = response.result.content;
                        rspData.state = $stateParams.state;
                        rspData.userId = $rootScope.userId;

                        if (contentEditor.validateRequest(rspData, validateModal)) {
                            contentEditor.updateModeAndStatus(response.result.content.status);
                            $timeout(function () {
                                $('#contentEditor').iziModal('open');
                            }, 100);
                        } else {
                            $rootScope.accessDenied = $rootScope.errorMessages.COMMON.UN_AUTHORIZED;
                            $state.go('Home');
                        }
                    } else {

                    }
                });
            };

            contentEditor.validateRequest = function (reqData, validateData) {
                var status = reqData.status;
                var createdBy = reqData.createdBy;
                var state = reqData.state;
                var userId = reqData.userId;
                var validateDataStatus = validateData.status;
                console.log("Log for validateRequest", reqData, validateData);
                if (reqData.mimeType === validateData.mimeType) {
                    var isStatus = _.indexOf(validateDataStatus, status) > -1 ? true : false;
                    var isState = _.indexOf(validateData.state, state) > -1 ? true : false;
                    if (isStatus && isState && createdBy !== userId) {
                        console.log("1");
                        return true;
                    } else if (isStatus && isState && createdBy === userId) {
                        console.log("2");
                        return true;
                    } else if (isStatus && createdBy === userId) {
                        console.log("3");
                        return true;
                    } else {
                        console.log("4");
                        return false;
                    }
                } else {
                    console.log("5");
                    return false;
                }
            };

            contentEditor.init = function () {
                org.sunbird.portal.eventManager.addEventListener("sunbird:portal:editor:editmeta", function () {
                    var params = {contentId: contentEditor.contentId}
                    $state.go("EditContent", params);
                });

                org.sunbird.portal.eventManager.addEventListener("sunbird:portal:editor:close", function () {
                    $state.go("WorkSpace.DraftContent");
                });

                org.sunbird.portal.eventManager.addEventListener("sunbird:portal:content:review", function (event, data) {
                    console.log("sunbird:portal:content:review event fired")
                    var params = {contentId: contentEditor.contentId, backState: $state.current.name}
                    $state.go("EditContent", params);
                });

                window.addEventListener('editor:metadata:edit', function (event, data) {
                    console.info('Sunbird edit metadata is calling');
                    org.sunbird.portal.eventManager.dispatchEvent('sunbird:portal:editor:editmeta');
                });

                window.addEventListener('editor:window:close', function (event, data) {
                    console.info('Sunbird editor is closing');
                    org.sunbird.portal.eventManager.dispatchEvent('sunbird:portal:editor:close');
                });

                window.addEventListener('editor:content:review', function (event, data) {
                    console.info('Sunbird edit metadata is calling', event.detail.contentId);
                    org.sunbird.portal.eventManager.dispatchEvent('sunbird:portal:content:review', event.detail.contentId);
                });
            };

            contentEditor.init();
            contentEditor.openContentEditor();
        });
