'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const zcc = require("./zwave-command-classes");
const index_1 = require("./index");
const index_2 = require("./index");
class ZWaveDevice {
    constructor(accessory, zwave) {
        this.accessory = accessory;
        this.id = accessory.context.deviceId;
        this.zwave = zwave;
        this.configure();
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
        const switchService = this.accessory.getService(index_1.Service.Switch);
        if (!switchService)
            return;
        switchService.getCharacteristic(index_2.Characteristic.On)
            .on('get', this.getSwitch.bind(this))
            .on('set', this.setSwitch.bind(this));
    }
    update(nodevalue) {
        if (nodevalue.class_id == zcc.COMMAND_CLASS_BINARY_SWITCH)
            this.accessory.getService(index_1.Service.Switch).getCharacteristic(index_2.Characteristic.On).updateValue(nodevalue.value, null);
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
class ZWaveMotionSensor extends ZWaveDevice {
    constructor(accessory, zwave) {
        super(accessory, zwave);
    }
    configure() {
        const switchService = this.accessory.getService(index_1.Service.ZWaveMotionSensor);
        if (!switchService)
            return;
        switchService.getCharacteristic(index_2.Characteristic.MotionDetected).on('get', this.getSwitch.bind(this));
    }
    update(nodevalue) {
        if (nodevalue.class_id == zcc.COMMAND_CLASS_BINARY_SENSOR)
            this.accessory.getService(index_1.Service.MotionSensor).getCharacteristic(index_2.Characteristic.MotionDetected).updateValue(nodevalue.value, null);
    }
    getSwitch(callback) {
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
exports.ZWaveMotionSensor = ZWaveMotionSensor;
//# sourceMappingURL=zwavedevice.js.map