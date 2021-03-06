import { Message, MessageEmbed } from "discord.js";
import axios from "axios";
import { Command } from "../../command-handler";

class Dog extends Command {
  public name = "Dog";
  public aliases = ["dogy", "kutyi"];
  public desc = "Véletlenszerű kutyi gifek.";
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

      const response = await axios.get<DogAPIResponse[]>("https://api.thedogapi.com/v1/images/search?mime_types=gif", {
        responseType: "json",
      });

      const embed = new MessageEmbed()
        .setAuthor(message.author.tag, message.author.displayAvatarURL({ size: 4096, format: "png", dynamic: true }))
        .setDescription(`[LINK](${response.data[0].url})`)
        .setFooter("thedogapi.com")
        .setColor(message.guild.member(message.client.user).displayHexColor)
        .setImage(response.data[0].url);

      message.channel.send({ embed: embed }).then(() => msg.delete());
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

export default new Dog();
