/* global Module */

/*
 * Magic Mirror
 * Module: MMM-ruuvi-api-sensors
 *
 *
 *  By Marko Kuosmanen http://github.com/kuosman
 *  MIT Licenced.
 */
Module.register('MMM-ruuvi-api-sensors', {
    // Default module config.
    defaults: {
        temperatureIcon: 'temperature-half', // See free icons: https://fontawesome.com/icons?d=gallery
        pressureIcon: 'wind', // See free icons: https://fontawesome.com/icons?d=gallery
        humidityIcon: 'droplet', // See free icons: https://fontawesome.com/icons?d=gallery
        batteryEmptyIcon: 'battery-half', // See free icons: https://fontawesome.com/icons?d=gallery
        updateInterval: 5 * 1000 * 60, // every 5 minutes
        apiUrl: 'https://network.ruuvi.com',
        token: '',
        negativeColor: '#4800FF',
        highlightNegative: true,
        uiStyle: 'col', // col or row style
        large: false,
    },

    sensorsData: null,
    updateTimer: null,
    batteryLimit: 2420, // if below this value, show battery empty warning,
    identifier: Date.now(),

    /**
     * Gets styles
     *
     * @function getStyles
     * @returns {Array} styles array
     */
    getStyles: function () {
        return [
            this.file('css/fontawesome/css/all.min.css'),
            this.file('css/styles.css'),
        ];
    },

    /**
     * Gets translations
     * @function getTranslations
     * @returns {Object} translation object
     */
    getTranslations: function () {
        return {
            en: 'translations/en.json',
            fi: 'translations/fi.json',
        };
    },

    /**
     * Gets measurement value HTML style
     * @private
     * @function _getMeasurementValueStyle
     * @param {number} value
     * @returns {string} style
     */
    _getMeasurementValueStyle: function (value) {
        const self = this;
        if (value < 0 && self.config.highlightNegative) {
            return 'style="color:' + self.config.negativeColor + ';"';
        } else return '';
    },

    /**
     * Format decimal number
     * @private
     * @function _formatDecimal
     * @param {number} data number to format
     * @param {number} decimals decimals
     * @returns locale formatted decimal
     */
    _formatDecimal: function (data, decimals = 2) {
        const locale = config.language || 'fi';
        if (!data) return '';
        return (
            Math.round((data + Number.EPSILON) * Math.pow(10, decimals)) /
            Math.pow(10, decimals)
        ).toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        });
    },

    /**
     * Gets column dom.
     * @returns {object} HTML wrapper
     */
    getColDom: function () {
        const self = this;
        var wrapper = document.createElement('div');

        if (!self.config.sensor === null) {
            wrapper.innerHTML = this.translate('configEmpty') + this.name + '.';
            wrapper.className = 'ruuvi-api-sensors col dimmed light small';
            return wrapper;
        }

        if (self.sensorsData === null) {
            wrapper.innerHTML = this.translate('loading');
            wrapper.className = 'ruuvi-api-sensors col dimmed light small';
            return wrapper;
        }
        wrapper.className = 'ruuvi-api-sensors col light small';

        var temperatureIcon =
            '<span class="icon"><i class="fas fa-' +
            self.config.temperatureIcon +
            '"></i></span>';
        var pressureIcon =
            '<span class="icon"><i class="fas fa-' +
            self.config.pressureIcon +
            '"></i></span>';
        var humidityIcon =
            '<span class="icon"><i class="fas fa-' +
            self.config.humidityIcon +
            '"></i></span>';

        var batteryEmptyIcon =
            '<span class="battery-empty-icon ' + (self.config.large ? 'large' : '') + '"><i class="fas fa-' +
            self.config.batteryEmptyIcon +
            '"></i></span>';

        const sensorHTMLs = [];
        const measurementClass =
            'measurement' + (self.config.large ? ' large' : '');
        self.sensorsData.forEach((sensor, index) => {
            const sensorName =
                '<div class="' +
                measurementClass +
                ' bright">' +
                (sensor.battery > self.batteryLimit
                    ? sensor.name
                    : sensor.name + batteryEmptyIcon) +
                '</div>';
            const time =
                '<div class="' +
                measurementClass +
                ' smallFont">' +
                sensor.time +
                '</div>';
            const temperature =
                '<div class="' +
                measurementClass +
                ' bright" ' +
                self._getMeasurementValueStyle(sensor.temperature) +
                '>' +
                temperatureIcon +
                self._formatDecimal(sensor.temperature, 1) +
                ' &#8451;</div>';
            const humitidy =
                '<div class="' +
                measurementClass +
                ' bright" ' +
                self._getMeasurementValueStyle(sensor.humidity) +
                '>' +
                humidityIcon +
                self._formatDecimal(sensor.humidity, 1) +
                ' %</div>';
            const pressure =
                '<div class="' +
                measurementClass +
                ' wide bright" ' +
                self._getMeasurementValueStyle(sensor.pressure) +
                '>' +
                pressureIcon +
                self._formatDecimal(sensor.pressure / 100, 1) +
                ' hPa</div>';
            var sensorHTML = document.createElement('div');
            const sensorClass = 'sensor' + (self.config.large ? ' large' : '');
            sensorHTML.className =
                sensorClass + ((index + 1) % 2 === 0 ? ' marginLeft' : '');

            sensorHTML.innerHTML =
                sensorName + time + temperature + humitidy + pressure;
            sensorHTMLs.push(sensorHTML);
        });

        for (var i = 0; i < sensorHTMLs.length; i += 2) {
            var sensorsContainer = document.createElement('div');
            sensorsContainer.className =
                'sensors-container' + (self.config.large ? ' large' : '');
            sensorsContainer.appendChild(sensorHTMLs[i]);
            if (sensorHTMLs.length - 1 >= i + 1) {
                sensorsContainer.appendChild(sensorHTMLs[i + 1]);
            } else {
                var sensorHTML = document.createElement('div');
                sensorHTML.className = 'sensor marginLeft noborder';
                sensorsContainer.appendChild(sensorHTML);
            }
            wrapper.appendChild(sensorsContainer);
        }

        return wrapper;
    },
    /**
     * Gets row dom.
     * @returns {object} HTML wrapper
     */
    getRowDom: function () {
        const self = this;
        var wrapper = document.createElement('div');

        if (!self.config.sensor === null) {
            wrapper.innerHTML = this.translate('configEmpty') + this.name + '.';
            wrapper.className = 'ruuvi-api-sensors row dimmed light small';
            return wrapper;
        }

        if (self.sensorsData === null) {
            wrapper.innerHTML = this.translate('loading');
            wrapper.className = 'ruuvi-api-sensors row dimmed light small';
            return wrapper;
        }
        wrapper.className = 'ruuvi-api-sensors row light small';

        var temperatureIcon =
            '<span class="icon"><i class="fas fa-' +
            self.config.temperatureIcon +
            '"></i></span>';
        var pressureIcon =
            '<span class="icon"><i class="fas fa-' +
            self.config.pressureIcon +
            '"></i></span>';
        var humidityIcon =
            '<span class="icon"><i class="fas fa-' +
            self.config.humidityIcon +
            '"></i></span>';

        var batteryEmptyIcon =
            '<span class="battery-empty-icon"><i class="fas fa-' +
            self.config.batteryEmptyIcon +
            '"></i></span>';

        self.sensorsData.forEach((sensor) => {
            const sensorName =
                '<div class="name ' +
                (self.config.large ? 'large' : '') +
                ' bright">' +
                (sensor.battery > self.batteryLimit
                    ? sensor.name
                    : sensor.name + batteryEmptyIcon) +
                '</div>';
            const time =
                '<div class="date ' +
                (self.config.large ? 'large' : '') +
                '">' +
                sensor.time +
                '</div>';
            const temperature =
                '<div class="measurement ' +
                (self.config.large ? 'large' : '') +
                ' bright" ' +
                self._getMeasurementValueStyle(sensor.temperature) +
                '>' +
                temperatureIcon +
                self._formatDecimal(sensor.temperature, 1) +
                ' &#8451;</div>';
            const humitidy =
                '<div class="measurement ' +
                (self.config.large ? 'large' : '') +
                ' bright" ' +
                self._getMeasurementValueStyle(sensor.humidity) +
                '>' +
                humidityIcon +
                self._formatDecimal(sensor.humidity, 1) +
                ' %</div>';
            const pressure =
                '<div class="measurement ' +
                (self.config.large ? 'large' : '') +
                ' wide bright" ' +
                self._getMeasurementValueStyle(sensor.pressure) +
                '>' +
                pressureIcon +
                self._formatDecimal(sensor.pressure / 100, 1) +
                ' hPa</div>';
            var sensorHTML = document.createElement('div');
            sensorHTML.className =
                'sensor' + (self.config.large ? ' large' : '');
            sensorHTML.innerHTML =
                sensorName + time + temperature + humitidy + pressure;
            wrapper.appendChild(sensorHTML);
        });

        return wrapper;
    },

    /**
     * Gets dom
     *
     * @function getDom
     * @returns {object} html wrapper
     */
    getDom: function () {
        const self = this;
        if (self.config.uiStyle === 'row') {
            return self.getRowDom();
        } else {
            return self.getColDom();
        }
    },

    /**
     * Schedule next fetch
     *
     * @function scheduleNextFetch
     */
    scheduleNextFetch: function () {
        var self = this;
        if (self.sensorsData === null) {
            self.sendSocketNotification(
                'MMM_RUUVI_API_SENSORS_GET_SENSORS_DATA',
                {
                    config: self.config,
                    identifier: self.identifier,
                }
            );
        } else {
            clearTimeout(self.updateTimer);
            const delay =
                self.config.updateInterval < 1000 * 60
                    ? 1000 * 60
                    : self.config.updateInterval;
            self.updateTimer = setTimeout(function () {
                self.sendSocketNotification(
                    'MMM_RUUVI_API_SENSORS_GET_SENSORS_DATA',
                    {
                        config: self.config,
                        identifier: self.identifier,
                    }
                );
            }, delay);
        }
    },

    /**
     * Notification received
     *
     * @function  notificationReceived
     * @param {string} notification notification
     */
    notificationReceived: function (notification) {
        if (notification === 'DOM_OBJECTS_CREATED') {
            this.scheduleNextFetch();
        }
    },

    /**
     * Socket notification received
     *
     * @function socketNotificationReceived
     * @param {string} notification notification message
     * @param {object} payload payload
     */
    socketNotificationReceived: function (notification, payload) {
        if (payload.identifier !== this.identifier) return;

        switch (notification) {
            case 'MMM_RUUVI_API_SENSORS_SENSORS_RESPONSE':
                this.scheduleNextFetch();
                this.sensorsData = payload.data;
                this.updateDom();
                break;
        }
    },
});
