import {ZWave} from "./index"
import {PlatformAccessory} from "./index"
import {CommunityTypes} from "./index"
import {NodeValueClass} from "./index"

/// <reference path="index.d.ts" />
import * as hap from "hap-nodejs"
import * as zcc from "./zwave-command-classes"

export class MappedZWaveDevice {
    protected zwave: ZWave
    protected accessory: any
    protected id: number

    constructor (id: number, zwave: ZWave) {
        this.id = id
        this.zwave = zwave
    }

    newAccessory (accessory: any) {
        // copy in accessory created outside of this object
        if (accessory)
            this.accessory = accessory
    }
    newAccessorySwitch (name: string): any {
        if (this.accessory==null) {
            this.accessory = new PlatformAccessory(name,hap.uuid.generate(this.id.toString()),hap.Accessory.Categories.SWITCH)
            this.accessory.context.deviceId = this.id
        }
        return this.accessory
    }
    newAccessorySensor (name: string): any {
        if (this.accessory==null) {
            this.accessory = new PlatformAccessory(name,hap.uuid.generate(this.id.toString()),hap.Accessory.Categories.SENSOR)
            this.accessory.context.deviceId = this.id
        }
        return this.accessory
    }
    getAccessory () : any {
        return this.accessory
    }
    addHomeKitServices (zwave_node_type: string, name: string) {
        if (zwave_node_type=="Static PC Controller") {
            switch (name) {
                case "Inclusion":
                    this.addInclusionService ("Inclusion")
                    break
                case "Exclusion":
                    this.addExclusionService ("Exclusion")
                    break
                case "Heal":
                    //this.addHealService ("Heal")
                    break
            }
        }
        //loop through all the added values (command-classes)
        for (let [command_class, nodevalues] of this.zwave.zwavenodes[this.id].zwavevalues.entries()) {
            switch (command_class) {
            case zcc.COMMAND_CLASS_BINARY_SWITCH : 
                this.addSwitchService (name?name:"Binary Switch")
                break
            case zcc.COMMAND_CLASS_BINARY_SENSOR :
                this.addContactService (name?name:"Binary Sensor")
                break
            case zcc.COMMAND_CLASS_METER :
                break
            case zcc.COMMAND_CLASS_BATTERY :
                this.addBatteryService (name?name:"Battery")
                break
            case zcc.COMMAND_CLASS_SENSOR_MULTILEVEL :
                var nodevalue:any
                for (nodevalue of nodevalues){
                    if (nodevalue!=undefined) {
                        switch (nodevalue.index) {
                            case zcc.MTL_SENSOR_AIR_TEMPERATURE:
                                this.addTemperatureSensorService (name?name:"Temperature")
                                break
                            case zcc.MTL_SENSOR_CURRENT:
                                break
                            case zcc.MTL_SENSOR_LUMINANCE:
                                this.addLuminanceService (name?name:"Luminance")
                                break
                            case zcc.MTL_SENSOR_HUMIDITY:
                                this.addHumiditySensorService (name?name:"Humidity")
                                break
                            case zcc.MTL_SENSOR_POWER:
                                this.addPowerSensorService (name?name:"Power")
                                break
                        }
                    }
                }
                break
            }
        }
    }
    addHomeKitService (name:string,servicetype:any): any {
        var service
        service = this.accessory.getService(servicetype)
        if (!service)
            // only add services that did not exist already
            service = this.accessory.addService(servicetype, name)
        return service
    }
    addSwitchService(name: string) {
        const service = this.addHomeKitService (name,hap.Service.Switch)
        const characteristic = service.getCharacteristic (hap.Characteristic.On)
        if (characteristic.listenerCount ('get')==0 && 
            characteristic.listenerCount ('set')==0) {
            // only add listener once
            characteristic
                .on ('get',this.getSwitch.bind (this))
                .on ('set',this.setSwitch.bind (this))
        }
    }
    addInclusionService(name: string) {
        const service = this.addHomeKitService (name,hap.Service.Switch)
        const characteristic = service.getCharacteristic (hap.Characteristic.On)
        if (characteristic.listenerCount ('get')==0 && 
            characteristic.listenerCount ('set')==0) {
            // only add listener once
            characteristic
                .on ('get',this.getInclusion.bind (this))
                .on ('set',this.setInclusion.bind (this))
        }
    }
    addExclusionService(name: string) {
        const service = this.addHomeKitService (name,hap.Service.Switch)
        const characteristic = service.getCharacteristic (hap.Characteristic.On)
        if (characteristic.listenerCount ('get')==0 && 
            characteristic.listenerCount ('set')==0) {
            // only add listener once
            characteristic
                .on ('get',this.getExclusion.bind (this))
                .on ('set',this.setExclusion.bind (this))
        }
    }
    addTemperatureSensorService(name: string) {
        const service = this.addHomeKitService (name,hap.Service.TemperatureSensor)
        const characteristic = service.getCharacteristic (hap.Characteristic.CurrentTemperature)
        if (characteristic.listenerCount ('get')==0) {
            // only add listener once
            characteristic.on ('get',this.getTemperature.bind (this))    
        }
    }
    addBatteryService(name: string) {
        const service = this.addHomeKitService (name,hap.Service.BatteryService)
        const characteristic = service.getCharacteristic (hap.Characteristic.BatteryLevel)
        if (characteristic.listenerCount ('get')==0) {
            // only add listener once
            characteristic.on ('get', this.getBatteryLevel.bind (this))
        }
    }
    addHumiditySensorService(name: string) {
        const service = this.addHomeKitService (name,hap.Service.HumiditySensor)
        const characteristic = service.getCharacteristic (hap.Characteristic.CurrentRelativeHumidity)
        if (characteristic.listenerCount ('get')==0) {
            // only add listener once
            characteristic.on ('get', this.getHumidity.bind (this))
        }
    }
    addLuminanceService(name:string) {
        const service = this.addHomeKitService (name,hap.Service.LightSensor)
        const characteristic = service.getCharacteristic (hap.Characteristic.CurrentAmbientLightLevel)
        if (characteristic.listenerCount ('get')==0) {
            // only add listener once
            characteristic.on ('get', this.getLuminance.bind (this))
        }
    }
    addContactService (name: string) {
        const service = this.addHomeKitService (name,hap.Service.ContactSensor)
        const characteristic = service.getCharacteristic (hap.Characteristic.ContactSensorState)
        if (characteristic.listenerCount ('get')==0) {
            // only add listener once
            characteristic.on ('get', this.getContact.bind (this))
        }
    }
    addPowerSensorService (name: string) {
        const service = this.addHomeKitService (name,hap.Service.Outlet)
        let characteristic = service.getCharacteristic (hap.Characteristic.On)
        if (characteristic.listenerCount ('get')==0 &&
            characteristic.listenerCount ('set')==0) {
            // only add listener once
            characteristic
                .on ('get', this.getOutletOn.bind (this))
                .on ('set', this.setOutletOn.bind (this))
        }
        characteristic = service.getCharacteristic (CommunityTypes.Watts)
        if (characteristic.listenerCount ('get')==0) {
            // only add listener once
            characteristic.on ('get', this.getWatts.bind (this))
        }
    }

    // get/set ZWave Value
    ///////////////////////////////////////////////////////////////////////////////
    // find the right value belonging to main command class and sub command class
    // set or get the value
    getZWaveValue (main_command_class:number,sub_command_class?:number | undefined): NodeValueClass | undefined {
        if (this.zwave.zwavenodes[this.id].zwavevalues.get(main_command_class)) {
            let values: OZW.NodeValue[] = this.zwave.zwavenodes[this.id].zwavevalues.get(main_command_class)!
            if (values) {
                for (let value of values) {
                    if (value!=undefined) {
                        if (sub_command_class != undefined && value.index!=sub_command_class) 
                            continue

                        if (!this.accessory.reachable)
                            this.accessory.updateReachability (true)
                        return value
                    }
                }
            }
        }
        this.accessory.updateReachability (false)
        return
    }
    setZWaveValue (newvalue: any, main_command_class:number,sub_command_class?:number | undefined) {
        // do not set value until node is ready
        if (this.zwave.zwavenodes[this.id].ready) {
            if (this.zwave.zwavenodes[this.id].zwavevalues.get(main_command_class)) {
                let values: OZW.NodeValue[] = this.zwave.zwavenodes[this.id].zwavevalues.get(main_command_class)!
                if (values) {
                    for (let value of values) {
                        if (value!=undefined) {
                            if (sub_command_class != undefined && value.index!=sub_command_class) 
                                continue

                            this.zwave.openzwave.setValue (this.id,main_command_class,value.instance,value.index,newvalue)
                        }
                    }
                }
            }
        }
    }

    // Homekit callbacks
    //////////////////////////////////////////////////////////////////////////
    // get or set the ZWave value associated with a HomeKit characteristic
    
    // homekit asks for zwave value
    getSwitch (callback: any) {
        let value = this.getZWaveValue (zcc.COMMAND_CLASS_BINARY_SWITCH)
        if (value!=undefined) {
            //this.zwave.log.debug ("getSwitch() -> %s",value.value)
            callback (null,value.value)
        }
        else
            callback (null,false)
    }
    // homekit sets zwave value
    setSwitch (newvalue: boolean, callback: any) {
        //this.zwave.log.debug ("setSwitch(%s)",newvalue)
        this.setZWaveValue (newvalue,zcc.COMMAND_CLASS_BINARY_SWITCH)
        callback ()
    }
    getOutletOn (callback: any) {
        this.getSwitch (callback)
    }
    setOutletOn (newvalue: boolean, callback: any) {
        this.setSwitch (newvalue,callback)
    }
    getInclusion (callback: any) {
        callback (null,false)
    }
    setInclusion (newvalue: boolean, callback: any) {
        this.zwave.openzwave.addNode (false)
        callback ()
    }
    getExclusion (callback: any) {
        callback (null,false)
    }
    setExclusion (newvalue: boolean, callback: any) {
        this.zwave.openzwave.removeNode ()
        callback ()
    }
    getTemperature (callback: any) {
        let value = this.getZWaveValue (zcc.COMMAND_CLASS_SENSOR_MULTILEVEL,zcc.MTL_SENSOR_AIR_TEMPERATURE)
        if (value!=undefined)
            callback (null,parseFloat (value.value))
        else
            callback (null,0.0)
    }
    getBatteryLevel (callback: any) {
        let value = this.getZWaveValue (zcc.COMMAND_CLASS_BATTERY)
        if (value!=undefined)
            callback (null,parseFloat (value.value))
        else
            callback (null,0.0)
    }
    getHumidity (callback: any) {
        let value = this.getZWaveValue (zcc.COMMAND_CLASS_SENSOR_MULTILEVEL,zcc.MTL_SENSOR_HUMIDITY)
        if (value!=undefined)
            callback (null,parseFloat (value.value))
        else
            callback (null,0.0)
    }
    getLuminance (callback: any) {
        let value = this.getZWaveValue (zcc.COMMAND_CLASS_SENSOR_MULTILEVEL,zcc.MTL_SENSOR_LUMINANCE)
        if (value!=undefined)
            callback (null,parseFloat (value.value))
        else
            callback (null,0.0)
    }
    getContact (callback: any) {
        let value = this.getZWaveValue (zcc.COMMAND_CLASS_BINARY_SENSOR)
        if (value!=undefined)
            callback (null,value.value)
        else
            callback (null,false)
    }
    getKilowattHour (callback: any) {
        let value = this.getZWaveValue (zcc.COMMAND_CLASS_SENSOR_MULTILEVEL,zcc.MTL_SENSOR_POWER)
        if (value!=undefined)
            callback (null,parseFloat (value.value))
        else
            callback (null,0.0)
    }
    getWatts (callback: any) {
        let value = this.getZWaveValue (zcc.COMMAND_CLASS_SENSOR_MULTILEVEL,zcc.MTL_SENSOR_POWER)
        if (value!=undefined)
            callback (null,parseFloat (value.value))
        else
            callback (null,0.0)
    }

    updateHomeKitValue (nodevalue: OZW.NodeValue,hap_service: any,hap_characteristic: any) {
        const service = this.accessory.getService(hap_service)
        if (service) {
            const characteristic = service.getCharacteristic (hap_characteristic)
            if (characteristic) {
                switch(characteristic.props.format) {
                    case 'bool':
                        if (nodevalue.type=="bool")
                            characteristic.updateValue (nodevalue.value,null)
                        else
                            characteristic.updateValue (parseInt (nodevalue.value)==1,null)
                        break
                    case 'uint8':
                    case 'uint16':
                    case 'uint32':
                    case 'uint64':
                    case 'int':
                        if (nodevalue.type=="bool")
                            characteristic.updateValue (nodevalue.value?1:0,null)
                        else
                            characteristic.updateValue (parseInt (nodevalue.value),null)
                        break
                    case 'float':
                        characteristic.updateValue (parseFloat (nodevalue.value),null)
                        break
                    default: 
                        characteristic.updateValue (nodevalue.value,null)
                        break
                }
            }
        }
    }
    // zwave wants to update homekit
    update (nodevalue: OZW.NodeValue) {
        switch (nodevalue.class_id) {
            case zcc.COMMAND_CLASS_BINARY_SWITCH : 
                //this.zwave.log.debug ("updateHomeKitValue(%s)",nodevalue.value)
                this.updateHomeKitValue (nodevalue,hap.Service.Switch,hap.Characteristic.On)
                // the below update will only pass when it is a metered Outlet
                this.updateHomeKitValue (nodevalue,hap.Service.Outlet,hap.Characteristic.On)
                break
            case zcc.COMMAND_CLASS_BINARY_SENSOR:
                this.updateHomeKitValue (nodevalue,hap.Service.ContactSensor,hap.Characteristic.ContactSensorState)
                break
            case zcc.COMMAND_CLASS_BATTERY:
                this.updateHomeKitValue (nodevalue,hap.Service.BatteryService,hap.Characteristic.BatteryLevel)
                break
            case zcc.COMMAND_CLASS_SENSOR_MULTILEVEL:
                switch (nodevalue.index) {
                    case zcc.MTL_SENSOR_AIR_TEMPERATURE:
                        this.updateHomeKitValue (nodevalue,hap.Service.TemperatureSensor,hap.Characteristic.CurrentTemperature)
                        break
                    case zcc.MTL_SENSOR_CURRENT:
                        break
                    case zcc.MTL_SENSOR_LUMINANCE:
                        this.updateHomeKitValue (nodevalue,hap.Service.LightSensor,hap.Characteristic.CurrentAmbientLightLevel)
                        break
                    case zcc.MTL_SENSOR_HUMIDITY:
                        this.updateHomeKitValue (nodevalue,hap.Service.HumiditySensor,hap.Characteristic.CurrentRelativeHumidity)
                        break
                    case zcc.MTL_SENSOR_POWER:
                        this.updateHomeKitValue (nodevalue,hap.Service.Outlet,CommunityTypes.Watts)
                        break
                }
                break
        }
    }
}