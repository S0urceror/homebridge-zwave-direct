"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const index_2 = require("./index");
const hap = require("hap-nodejs");
const zcc = require("./zwave-command-classes");
class MappedZWaveDevice {
    constructor(id, zwave) {
        this.id = id;
        this.zwave = zwave;
    }
    newAccessory(accessory) {
        if (accessory)
            this.accessory = accessory;
    }
    newAccessorySwitch(name) {
        if (this.accessory == null) {
            this.accessory = new index_1.PlatformAccessory(name, hap.uuid.generate(this.id.toString()), hap.Accessory.Categories.SWITCH);
            this.accessory.context.deviceId = this.id;
        }
        return this.accessory;
    }
    newAccessorySensor(name) {
        if (this.accessory == null) {
            this.accessory = new index_1.PlatformAccessory(name, hap.uuid.generate(this.id.toString()), hap.Accessory.Categories.SENSOR);
            this.accessory.context.deviceId = this.id;
        }
        return this.accessory;
    }
    getAccessory() {
        return this.accessory;
    }
    addHomeKitServices(zwave_node_type, name) {
        if (zwave_node_type == "Static PC Controller") {
            switch (name) {
                case "Inclusion":
                    this.addInclusionService("Inclusion");
                    break;
                case "Exclusion":
                    this.addExclusionService("Exclusion");
                    break;
                case "Heal":
                    break;
            }
        }
        for (let [command_class, nodevalues] of this.zwave.zwavenodes[this.id].zwavevalues.entries()) {
            switch (command_class) {
                case zcc.COMMAND_CLASS_BINARY_SWITCH:
                    this.addSwitchService(name ? name : "Binary Switch");
                    break;
                case zcc.COMMAND_CLASS_BINARY_SENSOR:
                    this.addContactService(name ? name : "Binary Sensor");
                    break;
                case zcc.COMMAND_CLASS_METER:
                    break;
                case zcc.COMMAND_CLASS_BATTERY:
                    this.addBatteryService(name ? name : "Battery");
                    break;
                case zcc.COMMAND_CLASS_SENSOR_MULTILEVEL:
                    var nodevalue;
                    for (nodevalue of nodevalues) {
                        if (nodevalue != undefined) {
                            switch (nodevalue.index) {
                                case zcc.MTL_SENSOR_AIR_TEMPERATURE:
                                    this.addTemperatureSensorService(name ? name : "Temperature");
                                    break;
                                case zcc.MTL_SENSOR_CURRENT:
                                    break;
                                case zcc.MTL_SENSOR_LUMINANCE:
                                    this.addLuminanceService(name ? name : "Luminance");
                                    break;
                                case zcc.MTL_SENSOR_HUMIDITY:
                                    this.addHumiditySensorService(name ? name : "Humidity");
                                    break;
                                case zcc.MTL_SENSOR_POWER:
                                    this.addPowerSensorService(name ? name : "Power");
                                    break;
                            }
                        }
                    }
                    break;
            }
        }
    }
    addHomeKitService(name, servicetype) {
        var service;
        service = this.accessory.getService(servicetype);
        if (!service)
            service = this.accessory.addService(servicetype, name);
        return service;
    }
    addSwitchService(name) {
        const service = this.addHomeKitService(name, hap.Service.Switch);
        const characteristic = service.getCharacteristic(hap.Characteristic.On);
        if (characteristic.listenerCount('get') == 0 &&
            characteristic.listenerCount('set') == 0) {
            characteristic
                .on('get', this.getSwitch.bind(this))
                .on('set', this.setSwitch.bind(this));
        }
    }
    addInclusionService(name) {
        const service = this.addHomeKitService(name, hap.Service.Switch);
        const characteristic = service.getCharacteristic(hap.Characteristic.On);
        if (characteristic.listenerCount('get') == 0 &&
            characteristic.listenerCount('set') == 0) {
            characteristic
                .on('get', this.getInclusion.bind(this))
                .on('set', this.setInclusion.bind(this));
        }
    }
    addExclusionService(name) {
        const service = this.addHomeKitService(name, hap.Service.Switch);
        const characteristic = service.getCharacteristic(hap.Characteristic.On);
        if (characteristic.listenerCount('get') == 0 &&
            characteristic.listenerCount('set') == 0) {
            characteristic
                .on('get', this.getExclusion.bind(this))
                .on('set', this.setExclusion.bind(this));
        }
    }
    addTemperatureSensorService(name) {
        const service = this.addHomeKitService(name, hap.Service.TemperatureSensor);
        const characteristic = service.getCharacteristic(hap.Characteristic.CurrentTemperature);
        if (characteristic.listenerCount('get') == 0) {
            characteristic.on('get', this.getTemperature.bind(this));
        }
    }
    addBatteryService(name) {
        const service = this.addHomeKitService(name, hap.Service.BatteryService);
        const characteristic = service.getCharacteristic(hap.Characteristic.BatteryLevel);
        if (characteristic.listenerCount('get') == 0) {
            characteristic.on('get', this.getBatteryLevel.bind(this));
        }
    }
    addHumiditySensorService(name) {
        const service = this.addHomeKitService(name, hap.Service.HumiditySensor);
        const characteristic = service.getCharacteristic(hap.Characteristic.CurrentRelativeHumidity);
        if (characteristic.listenerCount('get') == 0) {
            characteristic.on('get', this.getHumidity.bind(this));
        }
    }
    addLuminanceService(name) {
        const service = this.addHomeKitService(name, hap.Service.LightSensor);
        const characteristic = service.getCharacteristic(hap.Characteristic.CurrentAmbientLightLevel);
        if (characteristic.listenerCount('get') == 0) {
            characteristic.on('get', this.getLuminance.bind(this));
        }
    }
    addContactService(name) {
        const service = this.addHomeKitService(name, hap.Service.ContactSensor);
        const characteristic = service.getCharacteristic(hap.Characteristic.ContactSensorState);
        if (characteristic.listenerCount('get') == 0) {
            characteristic.on('get', this.getContact.bind(this));
        }
    }
    addPowerSensorService(name) {
        const service = this.addHomeKitService(name, hap.Service.Outlet);
        let characteristic = service.getCharacteristic(hap.Characteristic.On);
        if (characteristic.listenerCount('get') == 0 &&
            characteristic.listenerCount('set') == 0) {
            characteristic
                .on('get', this.getOutletOn.bind(this))
                .on('set', this.setOutletOn.bind(this));
        }
        characteristic = service.getCharacteristic(index_2.CommunityTypes.Watts);
        if (characteristic.listenerCount('get') == 0) {
            characteristic.on('get', this.getWatts.bind(this));
        }
    }
    getZWaveValue(main_command_class, sub_command_class) {
        if (this.zwave.zwavenodes[this.id].zwavevalues.get(main_command_class)) {
            let values = this.zwave.zwavenodes[this.id].zwavevalues.get(main_command_class);
            if (values) {
                for (let value of values) {
                    if (value != undefined) {
                        if (sub_command_class != undefined && value.index != sub_command_class)
                            continue;
                        if (!this.accessory.reachable)
                            this.accessory.updateReachability(true);
                        return value;
                    }
                }
            }
        }
        this.accessory.updateReachability(false);
        return;
    }
    setZWaveValue(newvalue, main_command_class, sub_command_class) {
        if (this.zwave.zwavenodes[this.id].ready) {
            if (this.zwave.zwavenodes[this.id].zwavevalues.get(main_command_class)) {
                let values = this.zwave.zwavenodes[this.id].zwavevalues.get(main_command_class);
                if (values) {
                    for (let value of values) {
                        if (value != undefined) {
                            if (sub_command_class != undefined && value.index != sub_command_class)
                                continue;
                            this.zwave.openzwave.setValue(this.id, main_command_class, value.instance, value.index, newvalue);
                        }
                    }
                }
            }
        }
    }
    getSwitch(callback) {
        let value = this.getZWaveValue(zcc.COMMAND_CLASS_BINARY_SWITCH);
        if (value != undefined) {
            callback(null, value.value);
        }
        else
            callback(null, false);
    }
    setSwitch(newvalue, callback) {
        this.setZWaveValue(newvalue, zcc.COMMAND_CLASS_BINARY_SWITCH);
        callback();
    }
    getOutletOn(callback) {
        this.getSwitch(callback);
    }
    setOutletOn(newvalue, callback) {
        this.setSwitch(newvalue, callback);
    }
    getInclusion(callback) {
        callback(null, false);
    }
    setInclusion(newvalue, callback) {
        this.zwave.openzwave.addNode(false);
        callback();
    }
    getExclusion(callback) {
        callback(null, false);
    }
    setExclusion(newvalue, callback) {
        this.zwave.openzwave.removeNode();
        callback();
    }
    getTemperature(callback) {
        let value = this.getZWaveValue(zcc.COMMAND_CLASS_SENSOR_MULTILEVEL, zcc.MTL_SENSOR_AIR_TEMPERATURE);
        if (value != undefined)
            callback(null, parseFloat(value.value));
        else
            callback(null, 0.0);
    }
    getBatteryLevel(callback) {
        let value = this.getZWaveValue(zcc.COMMAND_CLASS_BATTERY);
        if (value != undefined)
            callback(null, parseFloat(value.value));
        else
            callback(null, 0.0);
    }
    getHumidity(callback) {
        let value = this.getZWaveValue(zcc.COMMAND_CLASS_SENSOR_MULTILEVEL, zcc.MTL_SENSOR_HUMIDITY);
        if (value != undefined)
            callback(null, parseFloat(value.value));
        else
            callback(null, 0.0);
    }
    getLuminance(callback) {
        let value = this.getZWaveValue(zcc.COMMAND_CLASS_SENSOR_MULTILEVEL, zcc.MTL_SENSOR_LUMINANCE);
        if (value != undefined)
            callback(null, parseFloat(value.value));
        else
            callback(null, 0.0);
    }
    getContact(callback) {
        let value = this.getZWaveValue(zcc.COMMAND_CLASS_BINARY_SENSOR);
        if (value != undefined)
            callback(null, value.value);
        else
            callback(null, false);
    }
    getKilowattHour(callback) {
        let value = this.getZWaveValue(zcc.COMMAND_CLASS_SENSOR_MULTILEVEL, zcc.MTL_SENSOR_POWER);
        if (value != undefined)
            callback(null, parseFloat(value.value));
        else
            callback(null, 0.0);
    }
    getWatts(callback) {
        let value = this.getZWaveValue(zcc.COMMAND_CLASS_SENSOR_MULTILEVEL, zcc.MTL_SENSOR_POWER);
        if (value != undefined)
            callback(null, parseFloat(value.value));
        else
            callback(null, 0.0);
    }
    updateHomeKitValue(nodevalue, hap_service, hap_characteristic) {
        const service = this.accessory.getService(hap_service);
        if (service) {
            const characteristic = service.getCharacteristic(hap_characteristic);
            if (characteristic) {
                switch (characteristic.props.format) {
                    case 'bool':
                        if (nodevalue.type == "bool")
                            characteristic.updateValue(nodevalue.value, null);
                        else
                            characteristic.updateValue(parseInt(nodevalue.value) == 1, null);
                        break;
                    case 'uint8':
                    case 'uint16':
                    case 'uint32':
                    case 'uint64':
                    case 'int':
                        if (nodevalue.type == "bool")
                            characteristic.updateValue(nodevalue.value ? 1 : 0, null);
                        else
                            characteristic.updateValue(parseInt(nodevalue.value), null);
                        break;
                    case 'float':
                        characteristic.updateValue(parseFloat(nodevalue.value), null);
                        break;
                    default:
                        characteristic.updateValue(nodevalue.value, null);
                        break;
                }
            }
        }
    }
    update(nodevalue) {
        switch (nodevalue.class_id) {
            case zcc.COMMAND_CLASS_BINARY_SWITCH:
                this.updateHomeKitValue(nodevalue, hap.Service.Switch, hap.Characteristic.On);
                this.updateHomeKitValue(nodevalue, hap.Service.Outlet, hap.Characteristic.On);
                break;
            case zcc.COMMAND_CLASS_BINARY_SENSOR:
                this.updateHomeKitValue(nodevalue, hap.Service.ContactSensor, hap.Characteristic.ContactSensorState);
                break;
            case zcc.COMMAND_CLASS_BATTERY:
                this.updateHomeKitValue(nodevalue, hap.Service.BatteryService, hap.Characteristic.BatteryLevel);
                break;
            case zcc.COMMAND_CLASS_SENSOR_MULTILEVEL:
                switch (nodevalue.index) {
                    case zcc.MTL_SENSOR_AIR_TEMPERATURE:
                        this.updateHomeKitValue(nodevalue, hap.Service.TemperatureSensor, hap.Characteristic.CurrentTemperature);
                        break;
                    case zcc.MTL_SENSOR_CURRENT:
                        break;
                    case zcc.MTL_SENSOR_LUMINANCE:
                        this.updateHomeKitValue(nodevalue, hap.Service.LightSensor, hap.Characteristic.CurrentAmbientLightLevel);
                        break;
                    case zcc.MTL_SENSOR_HUMIDITY:
                        this.updateHomeKitValue(nodevalue, hap.Service.HumiditySensor, hap.Characteristic.CurrentRelativeHumidity);
                        break;
                    case zcc.MTL_SENSOR_POWER:
                        this.updateHomeKitValue(nodevalue, hap.Service.Outlet, index_2.CommunityTypes.Watts);
                        break;
                }
                break;
        }
    }
}
exports.MappedZWaveDevice = MappedZWaveDevice;
//# sourceMappingURL=mappedzwavedevice.js.map