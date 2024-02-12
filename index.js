"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const selenium_webdriver_1 = require("selenium-webdriver");
const robotjs_1 = __importDefault(require("robotjs"));
const axios_1 = __importDefault(require("axios"));
const eval_1 = __importDefault(require("eval"));
const ini_1 = __importDefault(require("ini"));
const node_child_process_1 = require("node:child_process");
const promises_1 = __importDefault(require("readline/promises"));
const pslist = require('ps-list');
const conf = require("./.conf");
const cmd = (ini_1.default.parse(conf))["CMD"];
const blacklist = ini_1.default.parse(conf)["BLACKLIST"].split(",").map((s) => s.trim());
let proxies = [];
const cookie = (ini_1.default.parse(conf))["COOKIE"];
const browser = (ini_1.default.parse(conf))["BROWSER"];
async function proxy_init() {
    let all = (await axios_1.default.get("https://raw.githubusercontent.com/TheSpeedX/PROXY-List/Master/http.txt", { responseType: 'text' })).data.split('\n').map((v, i) => all[i] = v.split(":"));
    for (let i = 0; i < 30; ++i) {
        proxies[i] = all[Math.floor(Math.random() * all.length)];
    }
    return all;
}
async function xsrf() {
    return new Promise((res, rej) => {
        try {
            new selenium_webdriver_1.Builder().forBrowser((0, eval_1.default)(`return Browser.${browser.toUpperCase()}`)).build().then(async (driver) => {
                await driver.manage().window().minimize();
                await driver.get("https://roblox.com");
                await driver.manage().addCookie({ domain: "https://roblox.com", name: "RBXSECURITY", value: cookie });
                driver.findElement({ xpath: "meta" }).getAttribute("xsrf").then((xs) => {
                    res(xs);
                });
            });
        }
        catch (err) {
            rej(err);
        }
    });
}
async function getpfp(user) {
    const proxy = await proxy_init();
    const config = {
        proxy: {
            host: proxy[Math.floor(Math.random() * proxy.length)][0],
            port: proxy[Math.floor(Math.random() * proxy.length)][1]
        }
    };
    let uri = "";
    if (Number.isNaN(user)) {
        user = (await axios_1.default.post("https://users.roblox.com/v1/users", { userIds: [user], excludeBannedUsers: true }, config)).data["data"][0]["id"];
    }
    return (await axios_1.default.get(`https://thumbnail.roblox.com/v1/users/avatar-headshot?users={user}`, config)).data[1]["image-url"];
}
function crash(user) {
    async function callback(k) {
        return new Promise(async (re, rej) => {
            let res = await axios_1.default.get(`https://www.roblox.com/games/getgameinstancesjson?placeId=333164326&startIndex=${k}`);
            if (res.status != 200) {
                rej();
            }
            for (let srv of res.data["collection"]) {
                if ((typeof srv !== "object") || (typeof srv["CurrentPlayers"] !== "object"))
                    callback(k + 1);
                for (let plr of srv["CurrentPlayers"]) {
                    if (typeof plr["Thumbnail"] === "object" && plr["Thumbnail"]["Url"] == user)
                        re(plr["Thumbnail"]["Url"]);
                }
            }
            callback(k + 1);
        });
    }
    callback(1).then((srv) => {
        try {
            new selenium_webdriver_1.Builder().forBrowser((0, eval_1.default)(`return Browser.${browser.toUpperCase()}`)).build().then((driver) => {
                driver.manage().window().minimize();
                driver.get(`roblox://experiences/start?placeId=333164326&gameInstanceId=${srv}`).then(() => {
                    setTimeout(() => {
                        robotjs_1.default.typeString("/");
                        setTimeout(() => robotjs_1.default.typeString(cmd.replace("&USER", user)), 100);
                        setTimeout(() => pslist().then((s) => {
                            for (const pr of s) {
                                if (pr["name"].match("Roblox")) {
                                    (0, node_child_process_1.exec)(`taskkill /PID ${pr["pid"]} /F`);
                                }
                            }
                        }), 5000);
                    }, 1000);
                });
            });
        }
        catch (err) {
            console.warn(err);
        }
    });
}
function main() {
    console.log(`
          ░█████╗░██╗░░██╗  ██████╗░░█████╗░███╗░░██╗  ██████╗░░█████╗░████████╗
          ██╔══██╗██║░░██║  ██╔══██╗██╔══██╗████╗░██║  ██╔══██╗██╔══██╗╚══██╔══╝
          ███████║███████║  ██████╦╝███████║██╔██╗██║  ██████╦╝██║░░██║░░░██║░░░
          ██╔══██║██╔══██║  ██╔══██╗██╔══██║██║╚████║  ██╔══██╗██║░░██║░░░██║░░░
          ██║░░██║██║░░██║  ██████╦╝██║░░██║██║░╚███║  ██████╦╝╚█████╔╝░░░██║░░░
          ╚═╝░░╚═╝╚═╝░░╚═╝  ╚═════╝░╚═╝░░╚═╝╚═╝░░╚══╝  ╚═════╝░░╚════╝░░░░╚═╝░░░
     -------------------------------------------------------------------------------------------------------------------------------------------------------------------     
          A simple 'ban' bot made by Vyn to practically ban users you do not like from AH, with a customizable ban command and built in variables this is good for a free one
          Made by Vyn
          For support contact @nekovada on discord
     -------------------------------------------------------------------------------------------------------------------------------------------------------------------
          Press any key to start
          Press ^C to quit
     `);
    promises_1.default.createInterface(process.stdin, process.stdout).question("\0").then(() => {
        setInterval(() => crash(blacklist[Math.floor(Math.random() * blacklist.length)]), 5000);
    });
}
