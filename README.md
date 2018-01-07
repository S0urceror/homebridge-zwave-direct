# Homebridge ZWave Direct

Homebridge plugin that communicates directly with ZWave devices via OpenZWave librariesplugin that communicates directly with ZWave devices via OpenZWave libraries

## Features
Currently support the following devices:
- BINARY_SENSOR, like motion sensors
- BINARY_SWITCH, like mains switches
- MULTI_LEVEL_SENSORS, for temperature, humidity, luminosity, power meters
- SIRENs, shown as a switch

It also allow to start inclusion via a virtual Switch Accessory called Inclusion. This will instruct the ZWave stick to start inclusion of a new ZWave device. Typically such a device needs to be put in Inclusion mode (3 rapid clicks on a button)

## Installation

1. Install Homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g git+https://git@github.com/S0urceror/homebridge-zwave-direct.git`
3. Download and install OpenZWave binaries: ` `
4. Add the user running homebridge to the dialout group: `sudo usermod -a -G dialout $HOMEBRIDGE_USER`
5. Update your configuration file. See the sample below.

## Sample Configuration

Please specify to which serial device your USB stick is connected.

The config file allows to set emptyhomebridgecache to true, to flush all ZWave devices from Homekit, and redetect them. Helpful while debugging.

New in this version is the ability to specify hinted devices. In a ZWave network battery operated devices are most of time sleeping and not continuously advertising their presence and capabilities. This way they would never appear in HomeKit. This way we can specify what type of device it is and which capabilities it has. The Zwave bridge will then map the right HomeKit types to the ZWave command-classes. 

"platforms": [
    {
      "platform": "zwave-direct",
      "serial": "/dev/cu.usbmodem1421",
      "emptyhomebridgecache": false,
      "hinteddevices": [{
        "nodeid": 4,
        "type": "Binary Sensor",
        "subtypes" : "temperature,luminance,batterylevel",
        "name": "Kitchen Sensor"
      },{
        "nodeid": 10,
        "type": "Binary Sensor",
        "subtypes" : "temperature,luminance,batterylevel",
        "name": "Livingroom Sensor 1"
      }
    }
]

## Credits
The guys over at OpenZWave for creating the libs, nodejs client and typescript definitions.
Homespun and SphtKr for additional communitytypes, this enables me to emulate a ZWave metering outlet as an Elgato Eve Energy. 
The Z-Wave standard, now becoming more open, is still an easy and rock solid communication protocol.