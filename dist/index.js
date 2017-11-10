'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const OpenZwave = require("openzwave-shared");
const zwavedevice_1 = require("./zwavedevice");
const zwavedevice_2 = require("./zwavedevice");
const zcc = require("./zwave-command-classes");
const pluginName = 'homebridge-zwave-direct';
const platformName = 'zwave-direct';
module.exports = function (homebridge) {
    exports.Accessory = homebridge.platformAccessory;
    exports.Service = homebridge.hap.Service;
    exports.Characteristic = homebridge.hap.Characteristic;
    exports.UUIDGen = homebridge.hap.uuid;
    homebridge.registerPlatform(pluginName, platformName, ZWave, true);
};
class zwaveNode {
}
class ZWave {
    constructor(log, config, api) {
        this.log = log;
        this.config = config || {};
        this.api = api;
        this.accessories = new Map();
        this.zwavenodes = new Array();
        var openzwaveconfig = {
            Logging: false,
            ConsoleOutput: true
        };
        this.openzwave = new OpenZwave(openzwaveconfig);
        this.openzwave.on('connect', this.zwave_connect.bind(this));
        this.openzwave.on('driver ready', this.zwave_driverReady.bind(this));
        this.openzwave.on('driver failed', this.zwave_driverFailed.bind(this));
        this.openzwave.on('scan complete', this.zwave_scanComplete.bind(this));
        this.openzwave.on('notification', this.zwave_notification.bind(this));
        this.openzwave.on('node ready', this.zwave_readyNode.bind(this));
        this.openzwave.on('node added', this.zwave_addNode.bind(this));
        this.openzwave.on('node removed', this.zwave_addNode.bind(this));
        this.openzwave.on('value added', this.zwave_addValue.bind(this));
        this.openzwave.on('value changed', this.zwave_changeValue.bind(this));
        this.openzwave.on('value removed', this.zwave_removeValue.bind(this));
        this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
    }
    zwave_scanComplete() {
        this.log.debug("OpenZWave: scan complete");
        for (let nodeid in this.zwavenodes) {
            this.log.info("id: %d, ready: %s, state: %d, name: %s", nodeid, this.zwavenodes[nodeid].ready, this.zwavenodes[nodeid].lastnotification, this.zwavenodes[nodeid].zwavenode.product);
        }
    }
    zwave_connect(homeid) {
        this.log.debug("OpenZWave: connected");
    }
    zwave_driverReady(homeid) {
        this.log.debug("OpenZWave: driver ready");
    }
    zwave_driverFailed() {
        this.log.error("OpenZWave: driver failed");
    }
    zwave_notification(nodeid, notif, help) {
        this.log.debug("OpenZWave: notification [nodeid: %d, notification: %d]", nodeid, notif);
        this.zwavenodes[nodeid].lastnotification = notif;
    }
    zwave_addNode(nodeid) {
        this.log.debug("OpenZWave: node added [nodeid: %d]", nodeid);
        this.zwavenodes[nodeid] = new zwaveNode();
        this.zwavenodes[nodeid].zwavenode = { name: "default", type: "default", loc: "default" };
        this.zwavenodes[nodeid].zwavevalues = new Map();
        this.zwavenodes[nodeid].ready = false;
    }
    zwave_addValue(nodeid, comclass, nodevalue) {
        this.log.debug("OpenZWave: value added [nodeid: %d, comclass: %d, index: %d, ready: %s]", nodeid, comclass, nodevalue.index, this.zwavenodes[nodeid].ready);
        this.zwavenodes[nodeid].zwavevalues.set(comclass, new Array());
        this.zwavenodes[nodeid].zwavevalues.get(comclass)[nodevalue.index] = nodevalue;
        if (!this.zwavenodes[nodeid].ready) {
            this.log.debug("Got a value for a not ready node: %d", nodeid);
        }
    }
    zwave_readyNode(nodeid, nodeinfo) {
        this.log.debug("OpenZWave: node ready [nodeid: %d, nodetype: %s, manufacturer: %s]", nodeid, nodeinfo.type, nodeinfo.manufacturer);
        this.zwavenodes[nodeid].zwavenode = nodeinfo;
        this.zwavenodes[nodeid].ready = true;
        switch (nodeinfo.type) {
            case "Binary Switch":
                this.addBinarySwitchAccessory(nodeid, nodeinfo.product ? nodeinfo.product : "Binary Switch");
                break;
            case "Binary Sensor":
                this.addBinarySwitchAccessory(nodeid, nodeinfo.product ? nodeinfo.product : "Binary Sensor");
                break;
            case "Siren":
                break;
        }
    }
    zwave_changeValue(nodeid, comclass, nodevalue) {
        this.log.debug("OpenZWave: value changed [nodeid: %d, comclass: %d, index: %d, ready: %s]", nodeid, comclass, nodevalue.index, this.zwavenodes[nodeid].ready);
        this.zwavenodes[nodeid].zwavevalues.get(comclass)[nodevalue.index] = nodevalue;
        this.updateAccessory(nodeid, nodevalue);
    }
    zwave_removeValue(nodeid, comclass, index) {
        this.log.debug("OpenZWave: value deleted [nodeid: %d, comclass: %d, index: %d]", nodeid, comclass, index);
        delete this.zwavenodes[nodeid].zwavevalues.get(comclass)[index];
    }
    didFinishLaunching() {
        this.log.info('Finished launching HomeBridge');
        this.openzwave.connect(this.config.serial);
    }
    updateAccessory(nodeid, nodevalue) {
        let accessory = this.accessories.get(nodeid);
        if (accessory) {
            accessory.update(nodevalue);
        }
        else {
            if (this.zwavenodes[nodeid]) {
                if (this.zwavenodes[nodeid].lastnotification == 4) {
                    switch (nodevalue.class_id) {
                        case zcc.COMMAND_CLASS_BINARY_SENSOR:
                            this.addMotionSensorAccessory(nodeid, "Motion Sensor");
                            break;
                    }
                }
            }
        }
    }
    configureAccessory(accessory) {
        this.log.info('Configure accessory: ', accessory);
        if (accessory.getService(exports.Service.Switch)) {
            const myswitch = new zwavedevice_1.ZWaveSwitch(accessory, this);
            this.accessories.set(accessory.context.deviceId, myswitch);
        }
        if (accessory.getService(exports.Service.MotionSensor)) {
            const mysensor = new zwavedevice_2.ZWaveMotionSensor(accessory, this);
            this.accessories.set(accessory.context.deviceId, mysensor);
        }
        else {
            this.removeAccessory(accessory);
        }
    }
    addBinarySwitchAccessory(id, name) {
        this.log.info('Add binary switch: %s', name);
        if (this.accessories.get(id))
            return;
        const accessory = new exports.Accessory(name, exports.UUIDGen.generate(id.toString()));
        accessory.addService(exports.Service.Switch, name);
        accessory.context.deviceId = id;
        const myswitch = new zwavedevice_1.ZWaveSwitch(accessory, this);
        this.accessories.set(id, myswitch);
        this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
    }
    addMotionSensorAccessory(id, name) {
        this.log.info('Add motion sensor: %s', name);
        if (this.accessories.get(id))
            return;
        const accessory = new exports.Accessory(name, exports.UUIDGen.generate(id.toString()));
        accessory.addService(exports.Service.MotionSensor, name);
        accessory.context.deviceId = id;
        const mysensor = new zwavedevice_2.ZWaveMotionSensor(accessory, this);
        this.accessories.set(id, mysensor);
        this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
    }
    removeAccessory(accessory) {
        this.log.info('Removing: %s', accessory.displayName);
        this.accessories.delete(accessory.deviceId);
        this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]);
    }
}
exports.ZWave = ZWave;
//# sourceMappingURL=index.js.map