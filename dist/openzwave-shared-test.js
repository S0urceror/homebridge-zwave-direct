"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OpenZwave = require("openzwave-shared");
var config = {
    Logging: false,
    ConsoleOutput: true
};
var zwave = new OpenZwave(config);
zwave.connect('/dev/cu.usbmodem1421');
zwave.on("node ready", (id, info) => {
    console.log(info.manufacturer);
    zwave.disconnect();
});
zwave.on("connect", () => {
    console.log("connected");
});
zwave.on("driver failed", () => {
    console.log("driver failed");
});
//# sourceMappingURL=openzwave-shared-test.js.map