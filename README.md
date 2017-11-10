#Homebridge ZWave Direct
Homebridge plugin that communicates directly with ZWave devices via OpenZWave librariesplugin that communicates directly with ZWave devices via OpenZWave libraries

## Features
Currently support the following devices:


## Installation

1. Install Homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-tradfri`
3. Update your configuration file. See the sample below.

## Sample Configuration

"platforms": [
    {
      "platform": "zwave-direct",
      "serial": "/dev/cu.usbmodem1421"
    }
]

## Credits
The guys over at OpenZWave for creating the libs, nodejs client and typescript definitions.
The Z-Wave standard, now becoming more open, is still an easy and rock solid communication protocol.