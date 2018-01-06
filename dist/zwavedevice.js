'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const zcc = require("./zwave-command-classes");
const hap = require("hap-nodejs");
class ZWaveDevice {
    constructor(homekitaccessory, zwave) {
        this.accessory = homekitaccessory;
        this.id = homekitaccessory.context.deviceId;
        this.zwave = zwave;
        this.configure();
    }
    getHomekitAccessory() {
        return this.accessory;
    }
    identify(paired, callback) {
        this.zwave.log.debug("identify: %s", this.accessory.displayName);
        callback();
    }
}
exports.ZWaveDevice = ZWaveDevice;
class ZWaveSwitch extends ZWaveDevice {
    constructor(accessory, zwave) {
        super(accessory, zwave);
    }
    configure() {
        const switchService = this.accessory.getService(hap.Service.Switch);
        if (!switchService)
            return;
        switchService.getCharacteristic(hap.Characteristic.On)
            .on('get', this.getSwitch.bind(this))
            .on('set', this.setSwitch.bind(this));
    }
    update(nodevalue) {
        if (nodevalue.class_id == zcc.COMMAND_CLASS_BINARY_SWITCH)
            this.accessory.getService(hap.Service.Switch).getCharacteristic(hap.Characteristic.On).updateValue(nodevalue.value, null);
    }
    getSwitch(callback) {
        if (this.zwave.zwavenodes[this.id].ready) {
            if (this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SWITCH)) {
                let values = this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SWITCH);
                for (let value of values) {
                    if (!this.accessory.reachable)
                        this.accessory.updateReachability(true);
                    callback(null, value.value);
                    return;
                }
            }
        }
        this.accessory.updateReachability(false);
        callback(null, false);
    }
    setSwitch(newvalue, callback) {
        if (this.zwave.zwavenodes[this.id].ready) {
            if (this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SWITCH)) {
                let values = this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SWITCH);
                for (let value of values) {
                    this.zwave.openzwave.setValue(this.id, zcc.COMMAND_CLASS_BINARY_SWITCH, value.instance, value.index, newvalue);
                    break;
                }
            }
        }
        callback();
    }
}
exports.ZWaveSwitch = ZWaveSwitch;
class ZWaveContactSensor extends ZWaveDevice {
    constructor(accessory, zwave) {
        super(accessory, zwave);
    }
    configure() {
        const switchService = this.accessory.getService(hap.Service.ContactSensor);
        if (!switchService)
            return;
        switchService.getCharacteristic(hap.Characteristic.ContactSensorState).on('get', this.getState.bind(this));
    }
    update(nodevalue) {
        if (nodevalue.class_id == zcc.COMMAND_CLASS_BINARY_SENSOR)
            this.accessory.getService(hap.Service.ContactSensor).getCharacteristic(hap.Characteristic.ContactSensorState).updateValue(nodevalue.value, null);
    }
    getState(callback) {
        if (this.zwave.zwavenodes[this.id].ready) {
            if (this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SENSOR)) {
                let values = this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SENSOR);
                for (let value of values) {
                    if (!this.accessory.reachable)
                        this.accessory.updateReachability(true);
                    callback(null, value.value);
                    return;
                }
            }
        }
        this.accessory.updateReachability(false);
        callback(null, false);
    }
}
exports.ZWaveContactSensor = ZWaveContactSensor;
class ZWaveMultilevelSensor extends ZWaveDevice {
    constructor(accessory, zwave) {
        super(accessory, zwave);
    }
    configure() {
        const service = this.accessory.getService(hap.Service.TemperatureSensor);
        if (!service)
            return;
        service.getCharacteristic(hap.Characteristic.CurrentTemperature).on('get', this.getState.bind(this));
    }
    update(nodevalue) {
        if (nodevalue.class_id == zcc.COMMAND_CLASS_SENSOR_MULTILEVEL)
            this.accessory.getService(hap.Service.TemperatureSensor).getCharacteristic(hap.Characteristic.CurrentTemperature).updateValue(nodevalue.value, null);
    }
    getState(callback) {
        if (this.zwave.zwavenodes[this.id].ready) {
            if (this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_SENSOR_MULTILEVEL)) {
                let values = this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_SENSOR_MULTILEVEL);
                for (let value of values) {
                    if (!this.accessory.reachable)
                        this.accessory.updateReachability(true);
                    callback(null, value.value);
                    return;
                }
            }
        }
        this.accessory.updateReachability(false);
        callback(null, false);
    }
}
exports.ZWaveMultilevelSensor = ZWaveMultilevelSensor;
//# sourceMappingURL=zwavedevice.js.map