'use strict'

/// <reference path="./openzwave-shared.d.ts"/>
import * as OpenZwave from "openzwave-shared"

/// <reference path="index.d.ts" />
import * as hap from "hap-nodejs"

import {MappedZWaveDevice} from "./mappedzwavedevice"
import { access } from "fs";
import * as zcc from "./zwave-command-classes"

const pluginName = 'homebridge-zwave-direct'
const platformName = 'zwave-direct'

export let PlatformAccessory,CommunityTypes

module.exports = function (homebridge) {
  PlatformAccessory = homebridge.platformAccessory
  CommunityTypes = require('hap-nodejs-community-types')(homebridge)
  homebridge.registerPlatform(pluginName, platformName, ZWave, true)
}

interface IHintedDevice {
  nodeid: number;
  type: string;
  name: string;    
  subtypes: string;
}
interface Config {
  serial: string;
  emptyhomebridgecache: boolean;
  hinteddevices: IHintedDevice[];
}
class zwaveNode {
  zwavenode: OZW.NodeInfo;
  zwavevalues: Map<number, OZW.NodeValue[]>
  ready: boolean
  lastnotification: OZW.NotificationType
}

export class NodeValueClass implements OZW.NodeValue {
  value_id: string
  node_id: number
  class_id: number
  type: "byte" | "decimal" | "bool" | "list" | "short" | "string"
  genre: string
  instance: number
  index: number
  label: string
  units: string
  help: string
  read_only: boolean
  write_only: boolean
  is_polled: boolean
  min: any
  max: any
  value: any
}

export class ZWave {
  log: any
  config: Config
  mappedzwavedevices: Map<number, MappedZWaveDevice>
  api: any
  openzwave: OZW.OpenZWave
  zwavenodes: zwaveNode[]

  constructor (log, config, api) {
    this.log = log
    this.config = config || {}
    this.api = api
    this.mappedzwavedevices = new Map()
    this.zwavenodes = new Array()
    var openzwaveconfig: OZW.DriverConfig = {
      Logging: false,     // disable file logging (OZWLog.txt)
      ConsoleOutput: true // enable console logging
    }
    this.openzwave = new OpenZwave (openzwaveconfig)
    this.openzwave.on ('connect', this.zwave_connect.bind(this))
    this.openzwave.on ('driver ready', this.zwave_driverReady.bind (this))
    this.openzwave.on ('driver failed', this.zwave_driverFailed.bind (this))
    this.openzwave.on ('scan complete', this.zwave_scanComplete.bind(this))
    this.openzwave.on ('notification', this.zwave_notification.bind(this))
    this.openzwave.on ('node ready', this.zwave_readyNode.bind(this))
    this.openzwave.on ('node added', this.zwave_addNode.bind(this))
    this.openzwave.on ('node removed', this.zwave_addNode.bind(this))
    this.openzwave.on ('value added',this.zwave_addValue.bind(this))
    this.openzwave.on ('value changed',this.zwave_changeValue.bind(this))
    this.openzwave.on ('value removed',this.zwave_removeValue.bind(this))

    this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this))
  }

  zwave_scanComplete () {
    this.log.debug("scan complete")

    // check if we have a hint in the config
    for (let hinteddevice of this.config.hinteddevices) {
      let nodeid: number = hinteddevice.nodeid
      if (this.zwavenodes[nodeid]) {
        // found it
        if (hinteddevice.subtypes) {
          var subtypearr = hinteddevice.subtypes.split(",")
          for (let subtype of subtypearr) {
            var nodevalue : NodeValueClass = new NodeValueClass()
            nodevalue.index=-1 // invalid

            switch (subtype) {
              case "temperature" : 
                nodevalue.index=zcc.MTL_SENSOR_AIR_TEMPERATURE
                break
              case "luminance" : 
                nodevalue.index=zcc.MTL_SENSOR_LUMINANCE
                break
              case "humidity" : 
                nodevalue.index=zcc.MTL_SENSOR_HUMIDITY
                break
              case "power" : 
                nodevalue.index=zcc.MTL_SENSOR_POWER
                break
            }

            if (nodevalue.index>=0) {
              // process only valid indexes
              nodevalue.class_id = zcc.COMMAND_CLASS_SENSOR_MULTILEVEL
              nodevalue.node_id = nodeid
              nodevalue.value = 0
              this.zwave_addValue (nodeid,zcc.COMMAND_CLASS_SENSOR_MULTILEVEL,nodevalue)
            }
          }
        }

        this.zwave_addHomeKitAccessory (hinteddevice.nodeid, hinteddevice.type, hinteddevice.name)
      }
    }

    // now list all configured nodes
    for (let nodeid in this.zwavenodes) {
      this.log.info ("id: %d, bridged: %s, ready: %s, state: %d, name: %s",
                      nodeid,
                      this.mappedzwavedevices.has(parseInt(nodeid)),
                      this.zwavenodes[nodeid].ready,
                      this.zwavenodes[nodeid].lastnotification,
                      this.zwavenodes[nodeid].zwavenode.product
      )
    }
  }
  zwave_connect (homeid: any) {
    this.log.debug("connected")
  }
  zwave_driverReady (homeid: any) {
    this.log.debug("driver ready")
  }
  zwave_driverFailed () {
    this.log.error("driver failed")
  }
  zwave_addNode (nodeid: number) {
    this.log.debug("node added [nodeid: %d]",nodeid)
    // setup
    this.zwavenodes[nodeid] = new zwaveNode()
    this.zwavenodes[nodeid].zwavenode = {name: "default", type: "default", loc: "default"}
    this.zwavenodes[nodeid].zwavevalues = new Map()
    this.zwavenodes[nodeid].ready = false
  }
  zwave_notification (nodeid: number, notif: OZW.NotificationType, help: string) {
    this.log.debug("notification [nodeid: %d, notification: %d]",nodeid,notif)
    if (!this.zwavenodes[nodeid])
      return
    this.zwavenodes[nodeid].lastnotification = notif
  }
  zwave_addValue (nodeid: number, comclass: number, nodevalue: OZW.NodeValue) {
    this.log.debug("value added [nodeid: %d, comclass: %d, index: %d, ready: %s]",nodeid, comclass,nodevalue.index,this.zwavenodes[nodeid].ready)
    if (!this.zwavenodes[nodeid])
      return

    // add initial value
    if (!this.zwavenodes[nodeid].zwavevalues.get(comclass))
      this.zwavenodes[nodeid].zwavevalues.set(comclass,new Array())

    this.zwavenodes[nodeid].zwavevalues.get(comclass)![nodevalue.index]=nodevalue
  }
  zwave_readyNode (nodeid: number, nodeinfo: OZW.NodeInfo) {
    this.log.debug("node ready [nodeid: %d, nodetype: %s, manufacturer: %s]",nodeid,nodeinfo.type,nodeinfo.manufacturer)
    if (!this.zwavenodes[nodeid])
      return
    // update nodeinfo
    this.zwavenodes[nodeid].zwavenode = nodeinfo
    this.zwavenodes[nodeid].ready = true
    this.zwave_addHomeKitAccessory (nodeid, nodeinfo.type, nodeinfo.product) 
  }
  zwave_changeValue (nodeid: number, comclass: number, nodevalue: OZW.NodeValue) {
    this.log.debug("value changed [nodeid: %d, comclass: %d, index: %d, ready: %s]",nodeid, comclass,nodevalue.index,this.zwavenodes[nodeid].ready)
    if (!this.zwavenodes[nodeid])
      return
      
    this.zwavenodes[nodeid].zwavevalues.get(comclass)![nodevalue.index]=nodevalue

    let mydevice: MappedZWaveDevice
    if (this.mappedzwavedevices.get(nodeid))
      this.mappedzwavedevices.get(nodeid)!.update (nodevalue)
  }
  zwave_removeValue (nodeid: number, comclass: number, index: number) {
    this.log.debug("value deleted [nodeid: %d, comclass: %d, index: %d]",nodeid, comclass, index)
    if (!this.zwavenodes[nodeid])
      return
    
    delete this.zwavenodes[nodeid].zwavevalues.get(comclass)![index]
  }
  
  zwave_addHomeKitAccessory (nodeid: number, zwave_node_type: string, name?: string) {
    let accessory
    let mydevice: MappedZWaveDevice = this.mappedzwavedevices.get(nodeid)!
    
    // check type of node and add corresponding Apple HomeKit accessory
    if (mydevice)
      // already mapped, add added services
      mydevice.addHomeKitServices (zwave_node_type,name?name:"Next")
    else {
      mydevice = new MappedZWaveDevice(nodeid,this)
      switch (zwave_node_type) {
        case "Static PC Controller" :
          this.mappedzwavedevices.set(nodeid, mydevice)  
          accessory = mydevice.newAccessorySwitch ("Inclusion")
          mydevice.addHomeKitServices (zwave_node_type,"Inclusion")
          this.api.registerPlatformAccessories(pluginName,platformName, [accessory])
          break
        case "Binary Switch" : 
        case "Binary Power Switch" :
          this.mappedzwavedevices.set(nodeid, mydevice)  
          accessory = mydevice.newAccessorySwitch (name?name:"Binary Switch")
          mydevice.addHomeKitServices (zwave_node_type,name?name:"Binary Switch")
          this.api.registerPlatformAccessories(pluginName,platformName, [accessory])
          break
        case "Binary Sensor" : 
        case "Routing Binary Sensor" : 
          this.mappedzwavedevices.set(nodeid, mydevice)  
          accessory = mydevice.newAccessorySensor (name?name:"Binary Sensor")
          mydevice.addHomeKitServices (zwave_node_type,name?name:"Binary Sensor")
          this.api.registerPlatformAccessories(pluginName,platformName, [accessory])
          break
        case "Siren" :
          this.mappedzwavedevices.set(nodeid, mydevice)  
          accessory = mydevice.newAccessorySwitch (name?name:"Siren")
          mydevice.addHomeKitServices (zwave_node_type,name?name:"Siren")
          this.api.registerPlatformAccessories(pluginName,platformName, [accessory])
          break
      }
    }
  }
  didFinishLaunching () {
    this.log.info ('Finished launching HomeBridge')

    // empty homebridge cache when requested in config
    if (this.config.emptyhomebridgecache) {
      // remove all configured accessories
      this.mappedzwavedevices.forEach ((value: MappedZWaveDevice, key: number) => {
        this.removeAccessory (key)
      });
    }
    this.openzwave.connect (this.config.serial)
  }
  // restore a cached homekit accessory
  configureAccessory (accessory) { 
    this.log.info ('Configure accessory: ', accessory.displayName)
    let mydevice:MappedZWaveDevice = new MappedZWaveDevice(accessory.context.deviceId,this)
    mydevice.newAccessory (accessory)
    // add to mapped device list
    this.mappedzwavedevices.set (accessory.context.deviceId, mydevice) 
    // add to zwave nodelist as !ready
    this.zwave_addNode (accessory.context.deviceId)
  }
  removeAccessory (nodeid: number) {
    let accessory = this.mappedzwavedevices.get(nodeid)!.getAccessory()
    this.log.info ('Removing: %s', accessory.displayName)
    this.mappedzwavedevices.delete(nodeid)
    this.api.unregisterPlatformAccessories(pluginName,platformName, [accessory])
  }
}

