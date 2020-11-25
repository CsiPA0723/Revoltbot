import Database from "../database";
import { MessageAttachment, Collection, Message, GuildMember } from "discord.js";
import { createCanvas, loadImage } from "canvas";

const maxExpPerMsg = 5;
const minExpPerMsg = 1;

/** 2 minutes */
const cooldownTime = 120000;

const cooldowns = new Collection<string, { timeout: NodeJS.Timeout; }>();

const randomExp = () => { return Math.floor(Math.random() * maxExpPerMsg) + minExpPerMsg; };


class LevelSystem {
    public static async GiveExp(message: Message, isCommandTrue: boolean): Promise<"ON_COOLDOWN"|void> {
        try {
            const userData = await Database.GetData("Users", message.author.id);
            const cooldownData = cooldowns.get(message.author.id);

            let messages = 1;
            let commandUses = 0;
            let userLevel = 1;
            let exp = randomExp();

            if(userData) {
                messages += userData.messages || 0 ;
                commandUses = userData.commandUses || 0;
                userLevel = userData.level || 1;
                exp += userData.exp || 0;
            }

            if(isCommandTrue) commandUses++;

            if(cooldownData) {
                Database.SetData("Users", {
                    id: message.author.id,
                    tag: message.author.tag,
                    messages: messages,
                    commandUses: commandUses
                });
                return Promise.resolve("ON_COOLDOWN");
            }

            const { level } = this.GetLevel(userData.exp);
            if(level > userLevel) {
                userLevel = level;
                const attach = new MessageAttachment(await this.GetImageBuffer(message.member), "exp.png");
                message.channel.send(`Gratulálok ${message.member}, szintet léptél!`, attach);
            } else if(level < userLevel) {
                userLevel = level;
                const attach = new MessageAttachment(await this.GetImageBuffer(message.member), "exp.png");
                message.channel.send(`Jaj nee ${message.member}, szintet veszítettél!`, attach);
            }

            return Database.SetData("Users", {
                id: message.author.id,
                tag: message.author.tag,
                messages: messages,
                commandUses: commandUses,
                level: userLevel,
                exp: exp
            }).then(() => {
                cooldowns.set(message.author.id, {
                    timeout: setTimeout(() => cooldowns.delete(message.author.id), cooldownTime)
                });
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    public static async GetImageBuffer(targetMember: GuildMember) {
        try {
            let userData = await Database.GetData("Users", targetMember.id);
            if(!userData) {
                userData = {
                    id: targetMember.id,
                    exp: 0,
                    level: 1,
                    messages: 0,
                    commandUses: 0,
                    tag: targetMember.user.tag,
                }
                Database.SetData("Users", userData).catch(err => console.error(new Error(err)));
            }

            const width = 800;
            const height = 300;
        
            const canvas = createCanvas(width, height);
            const context = canvas.getContext("2d");
        
            // Backgound img
            const bgImg = await loadImage("./assets/systems/level/bg_img.jpg");
            context.drawImage(bgImg, 0, 0, width, height);
        
            const avatarURL = targetMember.user.displayAvatarURL({ format: "png", size: 4096 });
            const profileImage = await loadImage(avatarURL);
        
            // Background of the card
            context.fillStyle = "#e6e6e6";
            context.fillRect(100, 20, 680, 260);
        
            // Image border and image
            context.fillStyle = "#6e6e6e";
            context.fillRect(44, 44, 212, 212);
            context.fillStyle = "#fff";
            context.fillRect(46, 46, 208, 208);
            context.drawImage(profileImage, 50, 50, 200, 200);
        
            // Profile name
            context.font = "bold 28pt Menlo";
            context.textAlign = "left";
            context.textBaseline = "middle";
            context.fillStyle = "#6e6e6e";
            const profileName = targetMember.displayName;
            context.fillText(profileName, 300, 60);
        
            // Exp bar border
            context.fillRect(298, 98, 454, 44); // #6e6e6e
        
            // Exp bar margin
            context.fillStyle = "#fff";
            context.fillRect(300, 100, 450, 40);
        
            // Exmaple Level 4: 450 - 700 (d: 250)
        
            const { level, d, currExp, nextExp } = this.GetLevel(userData.exp);
        
            // Exp bar
            const expBarMaxWidth = 442;
            const expBarXPos = 304;
            const percent = (userData.exp - currExp) / d * 100;
            const expBarWidth = (expBarMaxWidth / 100) * percent;
            context.fillStyle = "#b3b3b3";
            context.font = "bold 24pt Menlo";
            context.fillRect(expBarXPos, 104, expBarWidth, 32);
        
            // Exp text
            context.textAlign = "center";
            context.textBaseline = "top";
            context.fillStyle = "#6e6e6e";
            const expText = `EXP: ${userData.exp}/${nextExp}`;
            context.fillText(expText, expBarXPos + (expBarMaxWidth / 2), 100);
        
            // Level title text
            context.font = "580 30pt Menlo";
            context.fillStyle = "#6e6e6e";
            const levelTitleText = "LEVEL";
            context.fillText(levelTitleText, 350, 146);
        
            // Level text
            context.font = "bold 44pt Menlo";
            context.fillText(`${level}`, 350, 190);
        
            // Vertical bar
            context.lineWidth = 4;
            context.strokeStyle = "#b3b3b3";
            context.beginPath();
            context.moveTo(440, 150);
            context.lineTo(440, 270);
            context.closePath();
            context.stroke();
        
            // Server rank text
        
            let userRanks: Array<{ id: string; }> = await Database.Connection.query("SELECT id FROM Users ORDER BY exp DESC");
            if(!userRanks) userRanks = [];
            context.textAlign = "left";
            context.font = "normal 18pt Menlo";
            context.fillStyle = "#6e6e6e";
            const serverRankText = `Szerver rang: #${userRanks.findIndex(row => row.id == targetMember.id) + 1}`;
            context.fillText(serverRankText, 480, 170);
        
            // Bits text
            let userCurrency = await Database.GetData("Currency", targetMember.id);
            if(!userCurrency) {
                userCurrency = { id: targetMember.id, bits: 0 };
                Database.SetData("Currency", userCurrency).catch(err => console.error(new Error(err)));
            }
            const bitsText = `Bitek: ${userCurrency.bits}`;
            context.fillText(bitsText, 480, 210);
        
            return Promise.resolve(canvas.toBuffer("image/png"));
        } catch (error) {
            return Promise.reject(error);
        }
    }

    public static GetLevel(exp: number) {
        if(!exp) exp = 0;
        let d = 100;
        let nextExp = d;
        let currExp = 0;
        let level = 1;
        while(nextExp <= exp) {
            currExp += d;
            d += (level % 5 === 0 ? 100 : 50);
            nextExp += d;
            level++;
        }
        return { level, currExp, nextExp, d };
    }
}

export default LevelSystem;