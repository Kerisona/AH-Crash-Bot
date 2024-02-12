import {Builder, Browser, Key, IWebDriverOptionsCookie, until} from 'selenium-webdriver';
import robotjs from 'robotjs';
import axios, {AxiosRequestConfig, AxiosProxyConfig} from 'axios'
import eval from 'eval';
import ini from 'ini'
import {exec} from 'node:child_process';
import readlinepromise from 'readline/promises';
import {readFileSync} from 'node:fs';

const conf: any = JSON.parse(readFileSync("settings.json", "utf-8"));

const cmd: string = conf["cmd"];
const blacklist: string[] = conf["blacklist"].map((v: string | number) => v.toString().trim());
let proxies: string[][] = [];
const cookie: string = conf["COOKIE"];
const browser: string = conf["BROWSER"];

async function proxy_init() {
     let all: string[][] = ((await axios.get("https://raw.githubusercontent.com/TheSpeedX/PROXY-List/Master/http.txt", {responseType: 'text'})).data as String).split('\n').map((v, i) => all[i] = v.split(":"))
     for (let i: number = 0; i < 30; ++i) {
          proxies[i] = all[Math.floor(Math.random() * all.length)];
     }
     return all;
}

async function xsrf(): Promise<string> {
     return new Promise<string>((res, rej) => {
          try {
               new Builder().forBrowser(eval(`return Browser.${browser.toUpperCase()}`) as string).build().then(async (driver) => {
                    await driver.manage().window().minimize();
                    await driver.get("https://roblox.com");
                    await driver.manage().addCookie({domain: "https://roblox.com", name: "RBXSECURITY", value: cookie});
                    driver.findElement({xpath: "meta"}).getAttribute("xsrf").then((xs) => {
                         res(xs);
                    })
               })
          } catch (err) {
               rej(err);
          }
     })
}

async function getpfp(user: string | number): Promise<string> {
     const proxy = await proxy_init();
     const config: AxiosRequestConfig = {
          proxy: {
               host: proxy[Math.floor(Math.random() * proxy.length)][0] as string,
               port: proxy[Math.floor(Math.random() * proxy.length)][1] as unknown as number
          }
     }
     let uri: string = "";
     if (Number.isNaN(user as number)) {
          user = (await axios.post("https://users.roblox.com/v1/users", {userIds: [user], excludeBannedUsers: true}, config)).data["data"][0]["id"];
     } 
     return (await axios.get(`https://thumbnail.roblox.com/v1/users/avatar-headshot?users={user}`, config)).data[1]["image-url"];
}

function crash(user: string) {
     async function callback(k: number): Promise<string> {
               return new Promise<string>(async (re, rej) => {
                    let res = await axios.get(`https://www.roblox.com/games/getgameinstancesjson?placeId=333164326&startIndex=${k}`);
                    if (res.status != 200) {
                         rej();
                    }
                    for (let srv of res.data["collection"]) {
                         if ((typeof srv !== "object") || (typeof srv["CurrentPlayers"] !== "object"))
                              callback(k + 1);
                         

                         for (let plr of srv["CurrentPlayers"]) {
                              if (typeof plr["Thumbnail"] === "object" && plr["Thumbnail"]["Url"] == user)
                                   re(plr["Thumbnail"]["Url"])
                         }
                    }
                    callback(k + 1);
               })
     }

     callback(1).then((srv) => {
          try {
               new Builder().forBrowser(eval(`return Browser.${browser.toUpperCase()}`) as string).build().then((driver) => {
                    driver.manage().window().minimize();
                    driver.get(`roblox://experiences/start?placeId=333164326&gameInstanceId=${srv}`).then(() => {
                         setTimeout(() => {
                              robotjs.typeString("/");
                              setTimeout(() => robotjs.typeString(cmd.replace("&USER", user)), 100)
                              setTimeout(() => exec("taskkill /IM RobloxPlayerBeta.exe /F /T"), 5000);
                         }, 1000);
                    });
               })
          } catch (err) {
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
     `)
     readlinepromise.createInterface(process.stdin, process.stdout).question("\0").then(() => {
               setInterval(() => crash(blacklist[Math.floor(Math.random() * blacklist.length)]), 5000);
     });
}

main();