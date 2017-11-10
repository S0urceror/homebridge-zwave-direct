'use strict'

/// <reference path="./openzwave-shared.d.ts"/>
import * as OpenZwave from "openzwave-shared"
import {ZWaveSwitch} from "./zwavedevice"
import {ZWaveMotionSensor} from "./zwavedevice"
import {ZWaveDevice} from "./zwavedevice"
import * as zcc from "./zwave-command-classes"

const pluginName = 'homebridge-zwave-direct'
const platformName = 'zwave-direct'

export let Accessory, Service, Characteristic, UUIDGen

module.exports = function (homebridge) {
  Accessory = homebridge.platformAccessory
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  UUIDGen = homebridge.hap.uuid
  homebridge.registerPlatform(pluginName, platformName, ZWave, true)
}

interface Config {
  serial: string;
}

class zwaveNode {
  zwavenode: OZW.NodeInfo;
  zwavevalues: Map<number, OZW.NodeValue[]>
  ready: boolean
  lastnotification: OZW.NotificationType
}

export class ZWave {
  log: any
  config: Config
  accessories: Map<number, ZWaveDevice>
  api: any
  openzwave: OZW.OpenZWave
  zwavenodes: zwaveNode[]
  
  constructor (log, config, api) {
    this.log = log
    this.config = config || {}
    this.api = api
    this.accessories = new Map()

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
    this.log.debug("OpenZWave: scan complete")

    for (let nodeid in this.zwavenodes) {
      this.log.info ("id: %d, ready: %s, state: %d, name: %s",
                      nodeid,
                      this.zwavenodes[nodeid].ready,
                      this.zwavenodes[nodeid].lastnotification,
                      this.zwavenodes[nodeid].zwavenode.product
      )
    }
  }
  zwave_connect (homeid: any) {
    this.log.debug("OpenZWave: connected")
  }
  zwave_driverReady (homeid: any) {
    this.log.debug("OpenZWave: driver ready")
  }
  zwave_driverFailed () {
    this.log.error("OpenZWave: driver failed")
  }
  zwave_notification (nodeid: number, notif: OZW.NotificationType, help: string) {
    this.log.debug("OpenZWave: notification [nodeid: %d, notification: %d]",nodeid,notif)
    this.zwavenodes[nodeid].lastnotification = notif
  }
  zwave_addNode (nodeid: number) {
    this.log.debug("OpenZWave: node added [nodeid: %d]",nodeid)
    // setup
    this.zwavenodes[nodeid] = new zwaveNode()
    this.zwavenodes[nodeid].zwavenode = {name: "default", type: "default", loc: "default"}
    this.zwavenodes[nodeid].zwavevalues = new Map()
    this.zwavenodes[nodeid].ready = false
  }
  zwave_addValue (nodeid: number, comclass: number, nodevalue: OZW.NodeValue) {
    this.log.debug("OpenZWave: value added [nodeid: %d, comclass: %d, index: %d, ready: %s]",nodeid, comclass,nodevalue.index,this.zwavenodes[nodeid].ready)
    // add initial value
    this.zwavenodes[nodeid].zwavevalues.set(comclass,new Array())
    this.zwavenodes[nodeid].zwavevalues.get(comclass)![nodevalue.index]=nodevalue
    // was it ready?
    if (!this.zwavenodes[nodeid].ready) {
      this.log.debug("Got a value for a not ready node: %d", nodeid)
    } 
  }
  zwave_readyNode (nodeid: number, nodeinfo: OZW.NodeInfo) {
    this.log.debug("OpenZWave: node ready [nodeid: %d, nodetype: %s, manufacturer: %s]",nodeid,nodeinfo.type,nodeinfo.manufacturer)
    // update nodeinfo
    this.zwavenodes[nodeid].zwavenode = nodeinfo
    this.zwavenodes[nodeid].ready = true
    // check type of node and add corresponding Apple HomeKit accessory
    switch (nodeinfo.type) {
      case "Binary Switch" : 
        this.addBinarySwitchAccessory(nodeid,nodeinfo.product?nodeinfo.product:"Binary Switch")
        break
      case "Binary Sensor" : 
        this.addBinarySwitchAccessory(nodeid,nodeinfo.product?nodeinfo.product:"Binary Sensor")
        break
      case "Siren" :
        break
    }
  }
  zwave_changeValue (nodeid: number, comclass: number, nodevalue: OZW.NodeValue) {
    this.log.debug("OpenZWave: value changed [nodeid: %d, comclass: %d, index: %d, ready: %s]",nodeid, comclass,nodevalue.index,this.zwavenodes[nodeid].ready)
    //var newvalue: any = nodevalue.value
    //var oldvalue: any

    //if (this.zwavenodes[nodeid].ready) {
    //  if (this.zwavenodes[nodeid].zwavevalues.get(comclass)![nodevalue.index])
    //    oldvalue = this.zwavenodes[nodeid].zwavevalues.get(comclass)![nodevalue.index].value
    //}
    this.zwavenodes[nodeid].zwavevalues.get(comclass)![nodevalue.index]=nodevalue
    this.updateAccessory (nodeid,nodevalue)
  }
  zwave_removeValue (nodeid: number, comclass: number, index: number) {
    this.log.debug("OpenZWave: value deleted [nodeid: %d, comclass: %d, index: %d]",nodeid, comclass, index)
    delete this.zwavenodes[nodeid].zwavevalues.get(comclass)![index]
  }

  didFinishLaunching () {
    this.log.info ('Finished launching HomeBridge')
    this.openzwave.connect (this.config.serial)
  }

  updateAccessory (nodeid: number, nodevalue: OZW.NodeValue) {
    let accessory = this.accessories.get (nodeid)
    if (accessory) {
      accessory.update (nodevalue)
    } else {
      // accessory not yet ready/initialised, probably sleeping
      if (this.zwavenodes[nodeid]) {
        // we do know it exists, sleeping?
        if (this.zwavenodes[nodeid].lastnotification==4 /*OZW.NotificationType.NodeSleep*/) {
          // only sleeping command classes are listed here
          switch (nodevalue.class_id) {
            case zcc.COMMAND_CLASS_BINARY_SENSOR :
              this.addMotionSensorAccessory(nodeid,"Motion Sensor")
              break
          }
        }
      }
    }
  }
  configureAccessory (accessory) {
    this.log.info ('Configure accessory: ', accessory)
    if (accessory.getService(Service.Switch)) {
      const myswitch = new ZWaveSwitch(accessory,this)
      this.accessories.set(accessory.context.deviceId, myswitch)
    } if (accessory.getService(Service.MotionSensor)) {
      const mysensor = new ZWaveMotionSensor(accessory,this)
      this.accessories.set(accessory.context.deviceId, mysensor)
    } else {
      // not recognized, remove it
      this.removeAccessory(accessory)
    }
  }

  addBinarySwitchAccessory (id: number,name: string) {
    this.log.info ('Add binary switch: %s', name)
    if (this.accessories.get(id))
      return // return if we already exist
    
    const accessory = new Accessory(name,UUIDGen.generate(id.toString()))
    accessory.addService(Service.Switch, name)
    accessory.context.deviceId = id

    const myswitch = new ZWaveSwitch(accessory,this)
    this.accessories.set(id, myswitch)
    this.api.registerPlatformAccessories(pluginName,platformName, [accessory])
  }
  addMotionSensorAccessory (id: number,name: string) {
    this.log.info ('Add motion sensor: %s', name)
    if (this.accessories.get(id))
      return // return if we already exist
    
    const accessory = new Accessory(name,UUIDGen.generate(id.toString()))
    accessory.addService(Service.MotionSensor, name)
    accessory.context.deviceId = id

    const mysensor = new ZWaveMotionSensor(accessory,this)
    this.accessories.set(id, mysensor)
    this.api.registerPlatformAccessories(pluginName,platformName, [accessory])
  }

  removeAccessory (accessory) {
    this.log.info ('Removing: %s', accessory.displayName)
    this.accessories.delete(accessory.deviceId)
    this.api.unregisterPlatformAccessories(pluginName,platformName, [accessory])
  }
}

