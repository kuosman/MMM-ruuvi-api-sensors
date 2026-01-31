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
        updateInterval: 5 * 1000 * 60, // every 5 minutes
        apiUrl: 'https://network.ruuvi.com',
        token: '',
        width: 800,
        cardBackground: '',
        showAqiColors: false
    },
    sensorsData: null,
    updateTimer: null,
    identifier: Date.now(),
    domCreated: false,

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
     * Is battery low
     * @param {number} voltage
     * @param {number} temperature
     * @returns  {boolean}
     */
    _isBatteryLow: function isBatteryLow(voltage, temperature) {
        if (temperature < -20) {
            return voltage < 2000
        } else if (temperature < 0) {
            return voltage < 2300
        } else {
            return voltage < 2500
        }
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
     * Get AQI corresponding color values
     * @private
     * @param {number} aqi
     * @param {string} aqiText
     * @returns {object} light and dark colors
     */
    _aqiToColor(aqi, aqiText) {
        const self = this;
        const colorMap = {
            excellent:  { light: "#7fe0d4", dark: "#4ac9b8" },
            good:       { light: "#b7e27a", dark: "#95cd48" },
            moderate:   { light: "#fff08a", dark: "#f7e13d" },
            poor:       { light: "#fbc27a", dark: "#f79c21" },
            very_poor:  { light: "#f58a6a", dark: "#ed5020" }
        };

        if (self.config.showAqiColors && aqiText && colorMap[aqiText]) {
            return colorMap[aqiText];
        }

        const lightL = Math.round(88 - (100 - aqi) * 0.7);
        const darkL  = Math.round(40 - (100 - aqi) * 0.22);
        const light  = Math.max(8, Math.min(95, lightL));
        const dark   = Math.max(8, Math.min(95, darkL));

        return {
            light: `hsl(0 0% ${light}%)`,
            dark:  `hsl(0 0% ${dark}%)`,
        };
    },

    /**
     * Returns temperature card
     * @private
     * @param {object} sensor
     * @returns {string} html
     */
    _temperatureCard: function(sensor){
        const self = this;

        const batteryEmpty = self._isBatteryLow(sensor.measurement.battery, sensor.measurement.temperature) ? `<div class="battery-icon balanced-blink">
                    <i class="fa-solid fa-battery-quarter"></i>
                </div>`: ``;

        return `${batteryEmpty}
                <div class="title">${sensor.name}</div>
                    <div class="big">
                        <div class="value">${self._formatDecimal(sensor.measurement.temperature, 0)}</div>
                        <div class="unit">
                            °C<br /><span class="label-small">${self.translate('temperature')}</span>
                        </div>
                    </div>
                    <div class="rows">
                        <div class="row">
                            <div class="val">${self._formatDecimal(sensor.measurement.humidity, 0)} %</div>
                            <div class="name">${self.translate('humidity')}</div>
                        </div>
                        <div class="row">
                            <div class="val">
                                ${self._formatDecimal(sensor.measurement.pressure/100, 0)} hPa
                            </div>
                            <div class="name">${self.translate('pressure')}</div>
                        </div>
                    </div>
                    <div class="timestamp">
                        ${sensor.measurement.timestampString}
                    </div>`;
    },

    _updateCards: function(){
        const self = this;

        self.sensorsData.forEach((sensor) => {
            const card = document.getElementById(self._getIdentifier(sensor));
            if (!card) return;

            if(sensor.measurement.aqi) {
                // TEST ONLY sensor.measurement.aqi = Math.floor(Math.random() * 101);
                const g = self._aqiToColor(sensor.measurement.aqi, sensor.measurement.aqiText);
                card.querySelector('.aq-score .score').textContent = self._formatDecimal(sensor.measurement.aqi, 0);

                card.className = self.config.showAqiColors ? 'card aqi_' + sensor.measurement.aqiText : 'card';

                // Progress bar
                const track = card.querySelector('.progress-track');
                const fill = track.querySelector('.progress-fill');
                const dot  = track.querySelector('.progress-dot');

                fill.style.background = `linear-gradient(90deg, ${g.light}, ${g.dark})`;

                requestAnimationFrame(() => {
                    fill.style.width = sensor.measurement.aqi + '%';
                    dot.style.left = sensor.measurement.aqi + '%';
                });

                const rows = card.querySelectorAll('.rows .row .val');

                rows[0].textContent = `${self._formatDecimal(sensor.measurement.co2, 0)} ppm`;
                rows[1].textContent = `${self._formatDecimal(sensor.measurement.pm25, 1)} µg/m³`;
                rows[2].textContent = self._formatDecimal(sensor.measurement.voc, 0);
                rows[3].textContent = self._formatDecimal(sensor.measurement.nox, 0);
                rows[4].textContent = `${self._formatDecimal(sensor.measurement.temperature, 1)} °C`;
                rows[5].textContent = `${self._formatDecimal(sensor.measurement.humidity, 0)} %`;
                rows[6].innerHTML   = `${self._formatDecimal(sensor.measurement.pressure/100)} hPa`;
                card.querySelector('.timestamp').textContent = sensor.measurement.timestampString;
            } else {
                card.querySelector('.big .value').textContent = `${self._formatDecimal(sensor.measurement.temperature, 1)} °C`;
                card.querySelector('.rows .row:nth-child(1) .val').textContent = `${self._formatDecimal(sensor.measurement.humidity, 0)} %`;
                card.querySelector('.rows .row:nth-child(2) .val').innerHTML = `${self._formatDecimal(sensor.measurement.pressure/100)} hPa`;
                card.querySelector('.timestamp').textContent = sensor.measurement.timestampString;
            }
        });
    },

    /**
     * Returns ari card
     * @private
     * @param {object} sensor
     * @returns {string} html
     */
    _airCard: function(sensor) {
        const self = this;
        const g = self._aqiToColor(sensor.measurement.aqi, sensor.measurement.aqiText);
        return `<div class="title">${sensor.name}</div>

                    <div class="aq-score">
                        <div class="score">${self._formatDecimal(sensor.measurement.aqi, 0)}</div>
                        <div class="max">
                            /100<br /><span class="label-small"
                                >${self.translate('aqi')}</span
                            >
                        </div>
                    </div>

                    <div class="aq-wrapper">
                        <div class="progress-track" aria-hidden="true">
                            <div class="progress-fill" style="width: ${sensor.measurement.aqi}%; background: linear-gradient(90deg, ${g.light}, ${g.dark})"></div>
                            <div class="progress-dot" style="left: ${sensor.measurement.aqi}%;"></div>
                        </div>
                    </div>

                    <div class="rows">
                        <div class="row">
                            <div class="val">${self._formatDecimal(sensor.measurement.co2, 0)} ppm</div>
                            <div class="name">${self.translate('co2')}</div>
                        </div>
                        <div class="row">
                            <div class="val">${self._formatDecimal(sensor.measurement.pm25, 1)} µg/m³</div>
                            <div class="name">${self.translate('pm25')}</div>
                        </div>
                        <div class="row">
                            <div class="val">${self._formatDecimal(sensor.measurement.voc, 0)}</div>
                            <div class="name">${self.translate('voc')}</div>
                        </div>
                        <div class="row">
                            <div class="val">${self._formatDecimal(sensor.measurement.nox, 0)}</div>
                            <div class="name">${self.translate('nox')}</div>
                        </div>

                        <div class="row">
                            <div class="val">${self._formatDecimal(sensor.measurement.temperature, 1)} °C</div>
                            <div class="name">${self.translate('temperature')}</div>
                        </div>
                        <div class="row">
                            <div class="val">${self._formatDecimal(sensor.measurement.humidity, 0)} %</div>
                            <div class="name">${self.translate('humidity')}</div>
                        </div>

                        <div class="row" style="width: 100%">
                            <div class="val">${self._formatDecimal(sensor.measurement.pressure/100, 0)} hPa</div>
                            <div class="name">${self.translate('pressure')}</div>
                        </div>
                    </div>

                    <div class="timestamp">${sensor.measurement.timestampString}</div>`;
    },

    _getIdentifier: function(sensor) {
        return 'sensor__' + sensor.sensor.replaceAll(":", "_");
    },

    _updateAqiBars: function () {
        const self = this;
        if (!self.sensorsData) return;

        self.sensorsData.forEach((sensor) => {
            if (sensor.measurement.aqi) {
                var card = document.getElementById(this._getIdentifier(sensor));

                if (!card) return;

                const track = card.querySelector('.progress-track');

                if (!track) return;
                const fill = track.querySelector('.progress-fill');
                const dot  = track.querySelector('.progress-dot');

                const g = self._aqiToColor(sensor.measurement.aqi, sensor.measurement.aqiText);
                fill.style.background = `linear-gradient(90deg, ${g.light}, ${g.dark})`;

                // pakotetaan animaatio
                requestAnimationFrame(() => {
                    fill.style.width = sensor.measurement.aqi + "%";
                    dot.style.left = sensor.measurement.aqi + "%";
                });
            }
        });

        const tracks = document.querySelectorAll(".progress-track");

        tracks.forEach(track => {
            const aqi = track.dataset.aqi;
            const fill = track.querySelector(".progress-fill");
            const dot = track.querySelector(".progress-dot");

            // pakotetaan repaint
            requestAnimationFrame(() => {
                fill.style.width = aqi + "%";
                dot.style.left = aqi + "%";
            });
        });
    },

    /**
     * Gets dom
     *
     * @function getDom
     * @returns {object} html wrapper
     */
    getDom: function () {
        const self = this;
        var wrapper = document.createElement('div');
        wrapper.className = 'wrapper';
        wrapper.style.width = self.config.width + 'px';
        if (!self.config === null) {
            wrapper.innerHTML = this.translate('configEmpty') + this.name + '.';
            wrapper.className = 'row dimmed light small';
            return wrapper;
        }

        if (self.sensorsData === null) {
            wrapper.innerHTML = this.translate('loading');
            wrapper.className = 'row dimmed light small';
            return wrapper;
        }
        var stage = document.createElement('div');
        stage.className = 'stage';

        self.sensorsData.forEach((sensor) => {
            var sensorCard = null;
            if(sensor.measurement.aqi) {
                sensorCard = document.createElement('div');
                sensorCard.id = self._getIdentifier(sensor);

                sensorCard.className = self.config.showAqiColors ? 'card aqi_' + sensor.measurement.aqiText : 'card';
                sensorCard.innerHTML = self._airCard(sensor);
                sensorCard.style.background = self.config.cardBackground;
            } else {
                sensorCard = document.createElement('div');
                sensorCard.id = self._getIdentifier(sensor);
                sensorCard.className = 'card';
                sensorCard.innerHTML = self._temperatureCard(sensor);
                sensorCard.style.background = self.config.cardBackground;
            }
            if (sensorCard) stage.appendChild(sensorCard);
        });

        wrapper.appendChild(stage);
        self.domCreated = true;
        return wrapper;
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
                self.config.updateInterval;
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
            this._updateAqiBars();
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
        const self = this;
        if (payload.identifier !== self.identifier) return;

        switch (notification) {
            case 'MMM_RUUVI_API_SENSORS_SENSORS_RESPONSE':
                self.scheduleNextFetch();
                self.sensorsData = payload.data;
                if (!self.domCreated) {
                    self.updateDom();
                } else {
                    self._updateCards();
                }
                setTimeout(() => self._updateAqiBars(), 50);
                break;
        }
    },
});
