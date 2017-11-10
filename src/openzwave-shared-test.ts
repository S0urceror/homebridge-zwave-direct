

import * as OpenZwave from "openzwave-shared";

var config: OZW.DriverConfig = {
    Logging: false,     // disable file logging (OZWLog.txt)
    ConsoleOutput: true // enable console logging
}


var zwave = new OpenZwave(config);
zwave.connect('/dev/cu.usbmodem1421');


//zwave.setValue({ node_id:5, class_id: 38, instance:1, index:0}, 50);
//zwave.setValue(8, 37, 1, 0, true); 

//zwave.setNodeOn(3); 
//zwave.setNodeOff(3);

//zwave.setNodeLevel(5, 50); 

zwave.on("node ready", (id,info) => {
    console.log(info.manufacturer);
    zwave.disconnect();
})
zwave.on("connect", () => {
    console.log("connected");
})
zwave.on("driver failed", () => {
    console.log("driver failed")
})

