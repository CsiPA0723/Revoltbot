const Discord = require('discord.js');
const fs = require('fs');

const Settings = require('../settings.json');

/** Relative to bot.js */
const MuteJsonPath = "./sec-sys/muted-users.json";
/**@type {Object<string, number>} */
const MutedUsers = require('./muted-users.json');
const EmbedTemplates = require('../utils/embed-templates');

module.exports = {

    MutedUsers: MutedUsers,
    /**
     * @param {Discord.GuildMember} member
     * @param {number} time
     */
    Add: (member, time) => {
        let muteRole = member.guild.roles.resolve(Settings.Roles.MuteRoleId);
        if(member.roles.highest.position < member.guild.member(member.client.user).roles.highest.position) {
            MutedUsers[`${member.id}`] = Date.now() + time;
            member.roles.add(muteRole).catch(console.error);
            setTimeout(() => this.Remove(member), time);
            fs.writeFile(MuteJsonPath, JSON.stringify(MutedUsers, null, 4), err => { if(err) throw err; });
        } else {
            /** @type {Discord.TextChannel} */
            let logChannel = member.client.channels.resolve(Settings.Channels.modLogId);
            logChannel.send(EmbedTemplates.Error(`Nem tudom hozzá adni a ${member} felhasználóhoz a ${muteRole} rangot!`));
        }

    },
    /** @param {Discord.GuildMember} member */
    Remove: (member) => {
        delete MutedUsers[`${member.id}`];
        if(member.roles.cache.has(Settings.Roles.MuteRoleId)) {
            member.roles.remove(Settings.Roles.MuteRoleId).catch(console.error);
        }
        fs.writeFile(MuteJsonPath, JSON.stringify(MutedUsers, null, 4), err => { if(err) throw err; });
    }
}