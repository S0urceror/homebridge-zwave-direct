'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const OpenZwave = require("openzwave-shared");
const mappedzwavedevice_1 = require("./mappedzwavedevice");
const zcc = require("./zwave-command-classes");
const pluginName = 'homebridge-zwave-direct';
const platformName = 'zwave-direct';
module.exports = function (homebridge) {
    exports.PlatformAccessory = homebridge.platformAccessory;
    exports.CommunityTypes = require('hap-nodejs-community-types')(homebridge);
    homebridge.registerPlatform(pluginName, platformName, ZWave, true);
};
class zwaveNode {
}
class NodeValueClass {
}
exports.NodeValueClass = NodeValueClass;
class ZWave {
    constructor(log, config, api) {
        this.log = log;
        this.config = config || {};
        this.api = api;
        this.mappedzwavedevices = new Map();
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
        this.log.debug("scan complete");
        for (let hinteddevice of this.config.hinteddevices) {
            let nodeid = hinteddevice.nodeid;
            if (this.zwavenodes[nodeid]) {
                if (hinteddevice.subtypes) {
                    var subtypearr = hinteddevice.subtypes.split(",");
                    for (let subtype of subtypearr) {
                        var nodevalue = new NodeValueClass();
                        nodevalue.index = -1;
                        switch (subtype) {
                            case "temperature":
                                nodevalue.index = zcc.MTL_SENSOR_AIR_TEMPERATURE;
                                break;
                            case "luminance":
                                nodevalue.index = zcc.MTL_SENSOR_LUMINANCE;
                                break;
                            case "humidity":
                                nodevalue.index = zcc.MTL_SENSOR_HUMIDITY;
                                break;
                            case "power":
                                nodevalue.index = zcc.MTL_SENSOR_POWER;
                                break;
                        }
                        if (nodevalue.index >= 0) {
                            nodevalue.class_id = zcc.COMMAND_CLASS_SENSOR_MULTILEVEL;
                            nodevalue.node_id = nodeid;
                            nodevalue.value = 0;
                            this.zwave_addValue(nodeid, zcc.COMMAND_CLASS_SENSOR_MULTILEVEL, nodevalue);
                        }
                    }
                }
                this.zwave_addHomeKitAccessory(hinteddevice.nodeid, hinteddevice.type, hinteddevice.name);
            }
        }
        for (let nodeid in this.zwavenodes) {
            this.log.info("id: %d, bridged: %s, ready: %s, state: %d, name: %s", nodeid, this.mappedzwavedevices.has(parseInt(nodeid)), this.zwavenodes[nodeid].ready, this.zwavenodes[nodeid].lastnotification, this.zwavenodes[nodeid].zwavenode.product);
        }
    }
    zwave_connect(homeid) {
        this.log.debug("connected");
    }
    zwave_driverReady(homeid) {
        this.log.debug("driver ready");
    }
    zwave_driverFailed() {
        this.log.error("driver failed");
    }
    zwave_notification(nodeid, notif, help) {
        this.log.debug("notification [nodeid: %d, notification: %d]", nodeid, notif);
        this.zwavenodes[nodeid].lastnotification = notif;
    }
    zwave_addNode(nodeid) {
        this.log.debug("node added [nodeid: %d]", nodeid);
        this.zwavenodes[nodeid] = new zwaveNode();
        this.zwavenodes[nodeid].zwavenode = { name: "default", type: "default", loc: "default" };
        this.zwavenodes[nodeid].zwavevalues = new Map();
        this.zwavenodes[nodeid].ready = false;
    }
    zwave_addValue(nodeid, comclass, nodevalue) {
        this.log.debug("value added [nodeid: %d, comclass: %d, index: %d, ready: %s]", nodeid, comclass, nodevalue.index, this.zwavenodes[nodeid].ready);
        if (!this.zwavenodes[nodeid].zwavevalues.get(comclass))
            this.zwavenodes[nodeid].zwavevalues.set(comclass, new Array());
        this.zwavenodes[nodeid].zwavevalues.get(comclass)[nodevalue.index] = nodevalue;
    }
    zwave_readyNode(nodeid, nodeinfo) {
        this.log.debug("node ready [nodeid: %d, nodetype: %s, manufacturer: %s]", nodeid, nodeinfo.type, nodeinfo.manufacturer);
        this.zwavenodes[nodeid].zwavenode = nodeinfo;
        this.zwavenodes[nodeid].ready = true;
        this.zwave_addHomeKitAccessory(nodeid, nodeinfo.type, nodeinfo.product);
    }
    zwave_changeValue(nodeid, comclass, nodevalue) {
        this.log.debug("value changed [nodeid: %d, comclass: %d, index: %d, ready: %s]", nodeid, comclass, nodevalue.index, this.zwavenodes[nodeid].ready);
        this.zwavenodes[nodeid].zwavevalues.get(comclass)[nodevalue.index] = nodevalue;
        let mydevice;
        if (this.mappedzwavedevices.get(nodeid))
            this.mappedzwavedevices.get(nodeid).update(nodevalue);
    }
    zwave_removeValue(nodeid, comclass, index) {
        this.log.debug("value deleted [nodeid: %d, comclass: %d, index: %d]", nodeid, comclass, index);
        delete this.zwavenodes[nodeid].zwavevalues.get(comclass)[index];
    }
    zwave_addHomeKitAccessory(nodeid, zwave_node_type, name) {
        let accessory;
        let mydevice = this.mappedzwavedevices.get(nodeid);
        if (mydevice)
            mydevice.addHomeKitServices(zwave_node_type, name ? name : "Next");
        else {
            mydevice = new mappedzwavedevice_1.MappedZWaveDevice(nodeid, this);
            switch (zwave_node_type) {
                case "Static PC Controller":
                    this.mappedzwavedevices.set(nodeid, mydevice);
                    accessory = mydevice.newAccessorySwitch("Inclusion");
                    mydevice.addHomeKitServices(zwave_node_type, "Inclusion");
                    this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
                    break;
                case "Binary Switch":
                case "Binary Power Switch":
                    this.mappedzwavedevices.set(nodeid, mydevice);
                    accessory = mydevice.newAccessorySwitch(name ? name : "Binary Switch");
                    mydevice.addHomeKitServices(zwave_node_type, name ? name : "Binary Switch");
                    this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
                    break;
                case "Binary Sensor":
                case "Routing Binary Sensor":
                    this.mappedzwavedevices.set(nodeid, mydevice);
                    accessory = mydevice.newAccessorySensor(name ? name : "Binary Sensor");
                    mydevice.addHomeKitServices(zwave_node_type, name ? name : "Binary Sensor");
                    this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
                    break;
                case "Siren":
                    this.mappedzwavedevices.set(nodeid, mydevice);
                    accessory = mydevice.newAccessorySwitch(name ? name : "Siren");
                    mydevice.addHomeKitServices(zwave_node_type, name ? name : "Siren");
                    this.api.registerPlatformAccessories(pluginName, platformName, [accessory]);
                    break;
            }
        }
    }
    didFinishLaunching() {
        this.log.info('Finished launching HomeBridge');
        if (this.config.emptyhomebridgecache) {
            this.mappedzwavedevices.forEach((value, key) => {
                this.removeAccessory(key);
            });
        }
        this.openzwave.connect(this.config.serial);
    }
    configureAccessory(accessory) {
        this.log.info('Configure accessory: ', accessory.displayName);
        let mydevice = new mappedzwavedevice_1.MappedZWaveDevice(accessory.context.deviceId, this);
        mydevice.newAccessory(accessory);
        this.mappedzwavedevices.set(accessory.context.deviceId, mydevice);
        this.zwave_addNode(accessory.context.deviceId);
    }
    removeAccessory(nodeid) {
        let accessory = this.mappedzwavedevices.get(nodeid).getAccessory();
        this.log.info('Removing: %s', accessory.displayName);
        this.mappedzwavedevices.delete(nodeid);
        this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]);
    }
}
exports.ZWave = ZWave;
//# sourceMappingURL=index.js.map