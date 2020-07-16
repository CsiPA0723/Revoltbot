const Discord = require('discord.js');

const Settings = require('../settings.json');
const EmbedTemplates = require('../utils/embed-templates');
const { MemberHasOneOfTheRoles } = require('../utils/tools');

module.exports = {
    /** @param {Discord.Message} message */

    CheckMsg: function(message) {
        if(message.channel.id != Settings.Channels.registId) return;
        if(message.member.roles.cache.size > 1) return; //Has roles
        
        if(message.channel.messages.cache.filter(m => m.author.id == message.author.id).size > 1) {
            message.author.send(`Nem lehet 1-nél több üzeneted a regisztráció szobában. Vagy töröld ki az előzőt vagy szerkezzd meg.`);
            if(message.deletable) message.delete();
            else message.guild.member("333324517730680842").send(`I could not delete this message: ${message.url}`);
            return;
        }

        message.react("🟩").then(msg => msg.message.react("🟥"));

        /** @type {Discord.TextChannel} */
        let logChannel = message.guild.channels.resolve(Settings.Channels.modLogId);

        const embed = EmbedTemplates.JoinRequest(message);

        logChannel.send({embed: embed});
    },

    /**
     * @param {Discord.MessageReaction} reaction
     * @param {Discord.User} user
     */

    CheckReaction: function(reaction, user) {
        if(user.bot) return;
        if(reaction.message.channel.id != Settings.Channels.registId) return;

        let guild = reaction.message.guild;
        let member = guild.member(user);

        let oMember = reaction.message.member; //Original message sender (GuildMember)

        let welcomeChannel = guild.channels.resolve(Settings.Channels.welcomeMsgId);

        if(MemberHasOneOfTheRoles(member, Settings.StaffIds) && !MemberHasOneOfTheRoles(oMember, [ Settings.Roles.AutoMemberId, ])) {
            if(reaction.emoji.name == "🟩") {
                if(reaction.message.deletable) reaction.message.delete();
                const embed = EmbedTemplates.Join(guild, oMember);
                welcomeChannel.send({embed: embed});
                oMember.roles.add(Settings.Roles.AutoMemberId);
            } else if(reaction.emoji.name == "🟥") {
                if(reaction.message.deletable) reaction.message.delete();
                if(oMember.kickable) oMember.kick("Nem volt meggyőzö az üzeneted ahhoz, hogy csatlakozz e-közösségbe!");
            } else return;
        }
    }
}