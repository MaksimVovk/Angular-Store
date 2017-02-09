(function() { angular.module("googlechart", []).run(registerResizeEvent);
    registerResizeEvent.$inject = ["$rootScope", "$window"];

    function registerResizeEvent($rootScope, $window) { angular.element($window).bind("resize", function() { $rootScope.$emit("resizeMsg") }) } })();
(function() { angular.module("googlechart").factory("FormatManager", formatManagerFactory);

    function formatManagerFactory() {
        function FormatManager($google) { var self = this; var oldFormatTemplates = {};
            self.iFormats = {};
            self.applyFormats = applyFormats;

            function apply(tFormats, dataTable) { var i, formatType; for (formatType in tFormats) { if (tFormats.hasOwnProperty(formatType)) { for (i = 0; i < self.iFormats[formatType].length; i++) { if (tFormats[formatType][i].columnNum < dataTable.getNumberOfColumns()) { self.iFormats[formatType][i].format(dataTable, tFormats[formatType][i].columnNum) } } } } }

            function applyFormat(formatType, FormatClass, tFormats) { var i; if (angular.isArray(tFormats[formatType])) { if (!angular.equals(tFormats[formatType], oldFormatTemplates[formatType])) { oldFormatTemplates[formatType] = tFormats[formatType];
                        self.iFormats[formatType] = []; if (formatType === "color") { instantiateColorFormatters(tFormats) } else { for (i = 0; i < tFormats[formatType].length; i++) { self.iFormats[formatType].push(new FormatClass(tFormats[formatType][i])) } } } } }

            function applyFormats(dataTable, tFormats, customFormatters) { var formatType, FormatClass, requiresHtml = false; if (!angular.isDefined(tFormats) || !angular.isDefined(dataTable)) { return { requiresHtml: false } } for (formatType in tFormats) { if (tFormats.hasOwnProperty(formatType)) { FormatClass = getFormatClass(formatType, customFormatters); if (!angular.isFunction(FormatClass)) { continue }
                        applyFormat(formatType, FormatClass, tFormats); if (formatType === "arrow" || formatType === "bar" || formatType === "color") { requiresHtml = true } } }
                apply(tFormats, dataTable); return { requiresHtml: requiresHtml } }

            function instantiateColorFormatters(tFormats) { var t, colorFormat, i, data, formatType = "color"; for (t = 0; t < tFormats[formatType].length; t++) { colorFormat = new $google.visualization.ColorFormat; for (i = 0; i < tFormats[formatType][t].formats.length; i++) { data = tFormats[formatType][t].formats[i]; if (typeof data.fromBgColor !== "undefined" && typeof data.toBgColor !== "undefined") { colorFormat.addGradientRange(data.from, data.to, data.color, data.fromBgColor, data.toBgColor) } else { colorFormat.addRange(data.from, data.to, data.color, data.bgcolor) } }
                    self.iFormats[formatType].push(colorFormat) } }

            function getFormatClass(formatType, customFormatters) { var className = formatType.charAt(0).toUpperCase() + formatType.slice(1).toLowerCase() + "Format"; if ($google.visualization.hasOwnProperty(className)) { return google.visualization[className] } else if (angular.isDefined(customFormatters) && customFormatters.hasOwnProperty(formatType)) { return customFormatters[formatType] } return } } return FormatManager } })();
(function() { angular.module("googlechart").controller("GoogleChartController", GoogleChartController);
    GoogleChartController.$inject = ["$scope", "$element", "$attrs", "$injector", "$timeout", "$window", "$rootScope", "GoogleChartService"];

    function GoogleChartController($scope, $element, $attrs, $injector, $timeout, $window, $rootScope, GoogleChartService) { var self = this; var resizeHandler; var googleChartService;
        init();

        function cleanup() { resizeHandler() }

        function draw() { if (!draw.triggered && self.chart !== undefined) { draw.triggered = true;
                $timeout(setupAndDraw, 0, true) } else if (self.chart !== undefined) { $timeout.cancel(draw.recallTimeout);
                draw.recallTimeout = $timeout(draw, 10) } }

        function drawAsync() { googleChartService.getReadyPromise().then(draw) }

        function drawChartWrapper() { googleChartService.draw();
            draw.triggered = false }

        function init() { googleChartService = new GoogleChartService;
            self.registerChartListener = googleChartService.registerChartListener;
            self.registerWrapperListener = googleChartService.registerWrapperListener;
            self.registerServiceListener = googleChartService.registerServiceListener;
            $scope.$watch(watchValue, watchHandler, true);
            resizeHandler = $rootScope.$on("resizeMsg", drawAsync);
            $scope.$on("$destroy", cleanup) }

        function setupAndDraw() { googleChartService.setup($element, self.chart.type, self.chart.data, self.chart.view, self.chart.options, self.chart.formatters, self.chart.customFormatters);
            $timeout(drawChartWrapper) }

        function watchHandler() { self.chart = $scope.$eval($attrs.chart);
            drawAsync() }

        function watchValue() { var chartObject = $scope.$eval($attrs.chart); if (angular.isDefined(chartObject) && angular.isObject(chartObject)) { return { customFormatters: chartObject.customFormatters, data: chartObject.data, formatters: chartObject.formatters, options: chartObject.options, type: chartObject.type, view: chartObject.view } } } } })();
(function() { angular.module("googlechart").directive("agcBeforeDraw", onReadyDirective);

    function onReadyDirective() { return { restrict: "A", scope: false, require: "googleChart", link: function(scope, element, attrs, googleChartController) { callback.$inject = ["chartWrapper"];

                function callback(chartWrapper) { scope.$apply(function() { scope.$eval(attrs.agcBeforeDraw, { chartWrapper: chartWrapper }) }) }
                googleChartController.registerServiceListener("beforeDraw", callback, this) } } } })();
(function() { angular.module("googlechart").directive("agcOnClick", onClickDirective);

    function onClickDirective() { return { restrict: "A", scope: false, require: "googleChart", link: function(scope, element, attrs, googleChartController) { callback.$inject = ["args", "chart", "chartWrapper"];

                function callback(args, chart, chartWrapper) { scope.$apply(function() { scope.$eval(attrs.agcOnClick, { args: args, chart: chart, chartWrapper: chartWrapper }) }) }
                googleChartController.registerChartListener("click", callback, this) } } } })();
(function() { angular.module("googlechart").directive("agcOnError", onErrorDirective);

    function onErrorDirective() { return { restrict: "A", scope: false, require: "googleChart", link: function(scope, element, attrs, googleChartController) { callback.$inject = ["chartWrapper", "chart", "args"];

                function callback(chartWrapper, chart, args) { var returnValues = { chartWrapper: chartWrapper, chart: chart, args: args, error: args[0], err: args[0], id: args[0].id, message: args[0].message };
                    scope.$apply(function() { scope.$eval(attrs.agcOnError, returnValues) }) }
                googleChartController.registerWrapperListener("error", callback, this) } } } })();
(function() { angular.module("googlechart").directive("agcOnMouseout", agcOnMouseoutDirective);

    function agcOnMouseoutDirective() { return { restrict: "A", scope: false, require: "googleChart", link: function(scope, element, attrs, googleChartController) { callback.$inject = ["args", "chart", "chartWrapper"];

                function callback(args, chart, chartWrapper) { var returnParams = { chartWrapper: chartWrapper, chart: chart, args: args, column: args[0].column, row: args[0].row };
                    scope.$apply(function() { scope.$eval(attrs.agcOnMouseout, returnParams) }) }
                googleChartController.registerChartListener("onmouseout", callback, this) } } } })();
(function() { angular.module("googlechart").directive("agcOnMouseover", agcOnMouseoverDirective);

    function agcOnMouseoverDirective() { return { restrict: "A", scope: false, require: "googleChart", link: function(scope, element, attrs, googleChartController) { callback.$inject = ["args", "chart", "chartWrapper"];

                function callback(args, chart, chartWrapper) { var returnParams = { chartWrapper: chartWrapper, chart: chart, args: args, column: args[0].column, row: args[0].row };
                    scope.$apply(function() { scope.$eval(attrs.agcOnMouseover, returnParams) }) }
                googleChartController.registerChartListener("onmouseover", callback, this) } } } })();
(function() { angular.module("googlechart").directive("agcOnReady", onReadyDirective);

    function onReadyDirective() { return { restrict: "A", scope: false, require: "googleChart", link: function(scope, element, attrs, googleChartController) { callback.$inject = ["chartWrapper"];

                function callback(chartWrapper) { scope.$apply(function() { scope.$eval(attrs.agcOnReady, { chartWrapper: chartWrapper }) }) }
                googleChartController.registerWrapperListener("ready", callback, this) } } } })();
(function() { angular.module("googlechart").directive("agcOnSelect", onSelectDirective);

    function onSelectDirective() { return { restrict: "A", scope: false, require: "googleChart", link: function(scope, element, attrs, googleChartController) { callback.$inject = ["chartWrapper", "chart"];

                function callback(chartWrapper, chart) { var selectEventRetParams = { selectedItems: chart.getSelection() };
                    selectEventRetParams.selectedItem = selectEventRetParams.selectedItems[0];
                    selectEventRetParams.chartWrapper = chartWrapper;
                    selectEventRetParams.chart = chart;
                    scope.$apply(function() { scope.$eval(attrs.agcOnSelect, selectEventRetParams) }) }
                googleChartController.registerWrapperListener("select", callback, this) } } } })();
(function() { angular.module("googlechart").directive("googleChart", googleChartDirective);
    googleChartDirective.$inject = [];

    function googleChartDirective() { return { restrict: "A", scope: false, controller: "GoogleChartController" } } })();
(function() { angular.module("googlechart").value("googleChartApiConfig", { version: "1", optionalSettings: { packages: ["corechart"] } }) })();
(function() { angular.module("googlechart").factory("googleChartApiPromise", googleChartApiPromiseFactory);
    googleChartApiPromiseFactory.$inject = ["$rootScope", "$q", "googleChartApiConfig", "googleJsapiUrl"];

    function googleChartApiPromiseFactory($rootScope, $q, apiConfig, googleJsapiUrl) { apiConfig.optionalSettings = apiConfig.optionalSettings || {}; var apiReady = $q.defer(); var onLoad = function() { var settings = { callback: function() { var oldCb = apiConfig.optionalSettings.callback;
                    $rootScope.$apply(function() { apiReady.resolve(google) }); if (angular.isFunction(oldCb)) { oldCb.call(this) } } };
            settings = angular.extend({}, apiConfig.optionalSettings, settings);
            window.google.load("visualization", apiConfig.version, settings) }; var head = document.getElementsByTagName("head")[0]; var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.src = googleJsapiUrl; if (script.addEventListener) { script.addEventListener("load", onLoad, false) } else { script.onreadystatechange = function() { if (script.readyState === "loaded" || script.readyState === "complete") { script.onreadystatechange = null;
                    onLoad() } } }
        head.appendChild(script); return apiReady.promise } })();
(function() { angular.module("googlechart").factory("GoogleChartService", GoogleChartServiceFactory);
    GoogleChartServiceFactory.$inject = ["googleChartApiPromise", "$injector", "$q", "FormatManager"];

    function GoogleChartServiceFactory(googleChartApiPromise, $injector, $q, FormatManager) {
        function GoogleChartService() { var self = this;
            self.draw = draw;
            self.getChartWrapper = getChartWrapper;
            self.getData = getData;
            self.getElement = getElement;
            self.getOption = getOption;
            self.getOptions = getOptions;
            self.getView = getView;
            self.getReadyPromise = getReadyPromise;
            self.isApiReady = isApiReady;
            self.registerChartListener = registerChartListener;
            self.registerServiceListener = registerServiceListener;
            self.registerWrapperListener = registerWrapperListener;
            self.setData = setData;
            self.setElement = setElement;
            self.setOption = setOption;
            self.setOptions = setOptions;
            self.setup = setup;
            self.setView = setView; var $google, _apiPromise, _apiReady, _chartWrapper, _element, _chartType, _data, _view, _options, _formatters, _innerVisualization, _formatManager, _needsUpdate = true,
                _customFormatters, _serviceDeferred, serviceListeners = {},
                wrapperListeners = {},
                chartListeners = {};
            _init();

            function _activateServiceEvent(eventName) { var i; if (angular.isArray(serviceListeners[eventName])) { for (i = 0; i < serviceListeners[eventName].length; i++) { serviceListeners[eventName][i]() } } }

            function _apiLoadFail(reason) { return reason }

            function _apiLoadSuccess(g) { $google = g;
                _apiReady = true;
                _serviceDeferred.resolve(); return g }

            function _continueSetup() { if (!angular.isDefined(_chartWrapper)) { _chartWrapper = new $google.visualization.ChartWrapper({ chartType: _chartType, dataTable: _data, view: _view, options: _options, containerId: _element[0] });
                    _registerListenersWithGoogle(_chartWrapper, wrapperListeners) } else { _chartWrapper.setChartType(_chartType);
                    _chartWrapper.setDataTable(_data);
                    _chartWrapper.setView(_view);
                    _chartWrapper.setOptions(_options) } if (!_formatManager) { _formatManager = new FormatManager($google) } if (_formatManager.applyFormats(_chartWrapper.getDataTable(), _formatters, _customFormatters).requiresHtml) { _chartWrapper.setOption("allowHtml", true) }
                _needsUpdate = false }

            function _getSetDescendantProp(obj, desc, value) { var arr = desc ? desc.split(".") : []; while (arr.length && obj) { var comp = arr.shift(); var match = new RegExp("(.+)\\[([0-9]*)\\]").exec(comp); if (value) { if (obj[comp] === undefined) { obj[comp] = {} } if (arr.length === 0) { obj[comp] = value } }
                    obj = obj[comp] } return obj }

            function _handleReady() { if (_innerVisualization !== _chartWrapper.getChart()) { _innerVisualization = _chartWrapper.getChart();
                    _registerListenersWithGoogle(_innerVisualization, chartListeners) } }

            function _init() { _apiReady = false;
                _serviceDeferred = $q.defer();
                _apiPromise = googleChartApiPromise.then(_apiLoadSuccess).catch(_apiLoadFail);
                registerWrapperListener("ready", _handleReady, self) }

            function _registerListener(listenerCollection, eventName, listenerFn, listenerObject) { var listenerWrapper = function() { var locals = { chartWrapper: _chartWrapper, chart: _chartWrapper.getChart(), args: arguments };
                    $injector.invoke(listenerFn, listenerObject || this, locals) }; if (angular.isDefined(listenerCollection) && angular.isObject(listenerCollection)) { if (!angular.isArray(listenerCollection[eventName])) { listenerCollection[eventName] = [] }
                    listenerCollection[eventName].push(listenerWrapper); return function() { if (angular.isDefined(listenerWrapper.googleListenerHandle)) { $google.visualization.events.removeListener(listenerWrapper.googleListenerHandle) } var fnIndex = listenerCollection[eventName].indexOf(listenerWrapper);
                        listenerCollection[eventName].splice(fnIndex, 1); if (listenerCollection[eventName].length === 0) { listenerCollection[eventName] = undefined } } } }

            function _registerListenersWithGoogle(eventSource, listenerCollection) { for (var eventName in listenerCollection) { if (listenerCollection.hasOwnProperty(eventName) && angular.isArray(listenerCollection[eventName])) { for (var fnIterator = 0; fnIterator < listenerCollection[eventName].length; fnIterator++) { if (angular.isFunction(listenerCollection[eventName][fnIterator])) { listenerCollection[eventName][fnIterator].googleListenerHandle = $google.visualization.events.addListener(eventSource, eventName, listenerCollection[eventName][fnIterator]) } } } } }

            function _runDrawCycle() { _activateServiceEvent("beforeDraw");
                _chartWrapper.draw() }

            function draw() { if (_needsUpdate) { _apiPromise = _apiPromise.then(_continueSetup) }
                _apiPromise = _apiPromise.then(_runDrawCycle()) }

            function getChartWrapper() { return _chartWrapper }

            function getData() { var data = _data || {}; return angular.copy(data) }

            function getElement() { return _element }

            function getOption(name) { var options = _options || {}; return _getSetDescendantProp(options, name) }

            function getOptions() { var options = _options || {}; return angular.copy(options) }

            function getReadyPromise() { return _serviceDeferred.promise }

            function getView() { var view = _view || {}; return angular.copy(view) }

            function isApiReady() { return _apiReady }

            function registerChartListener(eventName, listenerFn, listenerObject) { return _registerListener(chartListeners, eventName, listenerFn, listenerObject) }

            function registerServiceListener(eventName, listenerFn, listenerObject) { return _registerListener(serviceListeners, eventName, listenerFn, listenerObject) }

            function registerWrapperListener(eventName, listenerFn, listenerObject) { return _registerListener(wrapperListeners, eventName, listenerFn, listenerObject) }

            function setData(data) { if (angular.isDefined(data)) { _data = angular.copy(data);
                    _needsUpdate = true } }

            function setElement(element) { if (angular.isElement(element) && _element !== element) { _element = element;
                    _chartWrapper = null;
                    _needsUpdate = true } }

            function setOption(name, value) { _options = _options || {};
                _getSetDescendantProp(_options, name, angular.copy(value));
                _needsUpdate = true }

            function setOptions(options) { if (angular.isDefined(options)) { _options = angular.copy(options);
                    _needsUpdate = true } }

            function setup(element, chartType, data, view, options, formatters, customFormatters) { _element = element || _element;
                _chartType = chartType || _chartType;
                _data = data || _data;
                _view = view || _view;
                _options = options || _options;
                _formatters = formatters || _formatters;
                _customFormatters = customFormatters || _customFormatters;
                _apiPromise = _apiPromise.then(_continueSetup) }

            function setView(view) { _view = angular.copy(view) } } return GoogleChartService } })();
(function() { angular.module("googlechart").provider("googleJsapiUrl", googleJsapiUrlProvider);

    function googleJsapiUrlProvider() { var protocol = "https:"; var url = "//www.google.com/jsapi";
        this.setProtocol = function(newProtocol) { protocol = newProtocol };
        this.setUrl = function(newUrl) { url = newUrl };
        this.$get = function() { return (protocol ? protocol : "") + url } } })();