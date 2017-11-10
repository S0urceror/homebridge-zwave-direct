'use strict'

/// <reference path="./openzwave-shared.d.ts"/>
import * as OpenZwave from "openzwave-shared"
import * as zcc from "./zwave-command-classes"
import {ZWave} from "./index"
import {Service} from "./index"
import {Characteristic} from "./index"

export abstract class ZWaveDevice {
  protected accessory: any
  protected id: number
  protected zwave: ZWave

  constructor (accessory: any, zwave: ZWave) {
    this.accessory = accessory
    this.id = accessory.context.deviceId
    this.zwave = zwave
    this.configure()
  }
  abstract configure () : void
  abstract update (nodevalue: OZW.NodeValue) : void

  identify (paired: any, callback: any) {
    this.zwave.log.debug ("identify: %s",this.accessory.displayName)
    callback()
  }
}

export class ZWaveSwitch extends ZWaveDevice {

  constructor (accessory: any, zwave: ZWave) {
    super (accessory, zwave)
  }

  configure () {
    const switchService = this.accessory.getService(Service.Switch)
    if (!switchService)
      return

    switchService.getCharacteristic (Characteristic.On)
                    .on ('get',this.getSwitch.bind (this))
                    .on ('set',this.setSwitch.bind (this))
  }

  // zwave wants to update homekit
  update (nodevalue: OZW.NodeValue) {
    if (nodevalue.class_id==zcc.COMMAND_CLASS_BINARY_SWITCH)
      this.accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue (nodevalue.value,null)
  }
  // homekit asks for zwave value
  getSwitch (callback: any) {
    if (this.zwave.zwavenodes[this.id].ready) {
      if (this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SWITCH)) {
        let values: OZW.NodeValue[] = this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SWITCH)!
        for (let value of values) {
          if (!this.accessory.reachable)
            this.accessory.updateReachability (true)
          callback (null,value.value)
          return
        }
      }
    }
    this.accessory.updateReachability (false)
    callback (null,false)
  }
  // homekit sets zwave value
  setSwitch (newvalue: boolean, callback: any) {
    if (this.zwave.zwavenodes[this.id].ready) {
      if (this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SWITCH)) {
        let values: OZW.NodeValue[] = this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SWITCH)!
        for (let value of values) {
          this.zwave.openzwave.setValue (this.id,zcc.COMMAND_CLASS_BINARY_SWITCH,value.instance,value.index,newvalue)
          break
        }
        
      }
    }
    callback ()
  }
}

export class ZWaveMotionSensor extends ZWaveDevice {
  constructor (accessory: any, zwave: ZWave) {
    super (accessory, zwave)
  }

  configure () {
    const switchService = this.accessory.getService(Service.ZWaveMotionSensor)
    if (!switchService)
      return

    switchService.getCharacteristic (Characteristic.MotionDetected).on ('get',this.getSwitch.bind (this))
  }

  // zwave wants to update homekit
  update (nodevalue: OZW.NodeValue) {
    if (nodevalue.class_id==zcc.COMMAND_CLASS_BINARY_SENSOR)
      this.accessory.getService(Service.MotionSensor).getCharacteristic(Characteristic.MotionDetected).updateValue (nodevalue.value,null)
  }
  // homekit asks for zwave value
  getSwitch (callback: any) {
    if (this.zwave.zwavenodes[this.id].ready) {
      if (this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SENSOR)) {
        let values: OZW.NodeValue[] = this.zwave.zwavenodes[this.id].zwavevalues.get(zcc.COMMAND_CLASS_BINARY_SENSOR)!
        for (let value of values) {
          if (!this.accessory.reachable)
            this.accessory.updateReachability (true)
          callback (null,value.value)
          return
        }
      }
    }
    this.accessory.updateReachability (false)
    callback (null,false)
  }
}
