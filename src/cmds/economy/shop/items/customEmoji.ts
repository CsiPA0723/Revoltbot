import { Message } from "discord.js";
import { ShopItem } from "..";
import Database, { Wumpus } from "../../../../systems/database";
import Economy from "../../../../systems/economy";

const shopItem = new ShopItem(
    "Saját emoji",
    "A szerveren tudsz bérelni egy saját emoji helyet. (Wumpus+ rang szükséges)",
    Economy.CUSTOM_EMOJI_COST,
    true
);

shopItem.limit = 10;
shopItem.runMethod = async (message: Message, args: string[]) => {
    try {
        const customEmojiWumpus: Wumpus[] = await Database.Connection.query("SELECT * FROM Wumpus WHERE hasCustomEmoji = TRUE;");
        if(customEmojiWumpus.length + 1 > shopItem.limit) return message.channel.send("Ez az árú már elérte a limitét.");

        const wumpusData = await Database.GetData("Wumpus", message.member.id);
        const currencyData = await Economy.GetInfo(message.member);

        if(!wumpusData || !wumpusData.hasRole ) return message.channel.send("Ehhez az engedélyhez szükséges a Wumpus+ rang.");
        if(wumpusData && wumpusData.hasCustomEmoji) return message.channel.send("Már van ilyen engedélyed.");
        if(currencyData.bits >= Economy.CUSTOM_EMOJI_COST) {
            wumpusData.hasCustomEmoji = true;
            Economy.Remove(message.member, Economy.CUSTOM_EMOJI_COST, "Saját emoji slot vásárlás.")
            await Database.SetData("Wumpus", wumpusData);
            return message.channel.send("Sikeresen megvetted a Wumpus+ rangot.");
        } else return message.channel.send("Nincs elég bited.");

    } catch (error) {
        return Promise.reject(error);
    }
}

export default shopItem;