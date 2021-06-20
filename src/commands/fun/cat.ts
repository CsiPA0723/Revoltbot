import { Message, MessageEmbed } from "discord.js";
import got from "got";
import { Command } from "../../command-handler";

class Cat extends Command {
    public name = "Cat";
    public aliases = ["cica", "kitty"];
    public desc = "Véletlenszerű cica gifek.";
    public category = "Fun";
    public args = [];
    public isDev = false;

    constructor() {
        super();
        this.init();
    }

    public async run(message: Message) {
        try {
            const msg = await message.channel.send("Lekérés...");

            const data = await got("https://api.thecatapi.com/v1/images/search?mime_types=gif").json();

            const embed = new MessageEmbed()
                .setAuthor(message.author.tag, message.author.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
                .setDescription(`[LINK](${data[0].url})`)
                .setFooter("thecatapi.com")
                .setColor(message.guild.member(message.client.user).displayHexColor)
                .setImage(data[0].url);

            message.channel.send({ embed: embed }).then(() => msg.delete());
        } catch(error) {
            return Promise.reject(error);
        }
    }

}

export default new Cat();