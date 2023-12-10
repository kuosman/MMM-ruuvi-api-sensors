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
        updateInterval: 5 * 1000 * 60, // every 5 minutes
        apiUrl: 'https://network.ruuvi.com',
        token: '',
        negativeColor: '#4800FF',
        highlightNegative: true,
        uiStyle: 'col', // col or row style
    },

    sensorsData: null,
    updateTimer: null,

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

        const sensorHTMLs = [];
        self.sensorsData.forEach((sensor, index) => {
            const sensorName =
                '<div class="measurement bright">' + sensor.name + '</div>';
            const time =
                '<div class="measurement smallFont">' + sensor.time + '</div>';
            const temperature =
                '<div class="measurement bright" ' +
                self._getMeasurementValueStyle(sensor.temperature) +
                '>' +
                temperatureIcon +
                self._formatDecimal(sensor.temperature, 1) +
                ' &#8451;</div>';
            const humitidy =
                '<div class="measurement bright" ' +
                self._getMeasurementValueStyle(sensor.humidity) +
                '>' +
                humidityIcon +
                self._formatDecimal(sensor.humidity, 1) +
                ' %</div>';
            const pressure =
                '<div class="measurement wide bright" ' +
                self._getMeasurementValueStyle(sensor.pressure) +
                '>' +
                pressureIcon +
                self._formatDecimal(sensor.pressure / 100, 1) +
                ' hPa</div>';
            var sensorHTML = document.createElement('div');
            sensorHTML.className =
                (index + 1) % 2 === 0 ? 'sensor marginLeft' : 'sensor';
            sensorHTML.innerHTML =
                sensorName + time + temperature + humitidy + pressure;
            sensorHTMLs.push(sensorHTML);
        });

        for (var i = 0; i < sensorHTMLs.length; i += 2) {
            var sensorsContainer = document.createElement('div');
            sensorsContainer.className = 'sensors-container';
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

        self.sensorsData.forEach((sensor) => {
            const sensorName =
                '<div class="name bright">' + sensor.name + '</div>';
            const time = '<div class="date">' + sensor.time + '</div>';
            const temperature =
                '<div class="measurement bright" ' +
                self._getMeasurementValueStyle(sensor.temperature) +
                '>' +
                temperatureIcon +
                self._formatDecimal(sensor.temperature, 1) +
                ' &#8451;</div>';
            const humitidy =
                '<div class="measurement bright" ' +
                self._getMeasurementValueStyle(sensor.humidity) +
                '>' +
                humidityIcon +
                self._formatDecimal(sensor.humidity, 1) +
                ' %</div>';
            const pressure =
                '<div class="measurement wide bright" ' +
                self._getMeasurementValueStyle(sensor.pressure) +
                '>' +
                pressureIcon +
                self._formatDecimal(sensor.pressure / 100, 1) +
                ' hPa</div>';
            var sensorHTML = document.createElement('div');
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
            self.sendSocketNotification('GET_SENSORS_DATA', self.config);
        } else {
            clearTimeout(self.updateTimer);
            const delay =
                self.config.updateInterval < 1000 * 60
                    ? 1000 * 60
                    : self.config.updateInterval;
            self.updateTimer = setTimeout(function () {
                self.sendSocketNotification('GET_SENSORS_DATA', self.config);
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
        switch (notification) {
            case 'SENSORS_RESPONSE':
                this.scheduleNextFetch();
                this.sensorsData = payload.data;
                this.updateDom();
                break;
        }
    },
});
