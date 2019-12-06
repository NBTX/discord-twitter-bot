import DataStorage from "./utils/DataStorage";

const config = require('./config.json');

import axios from 'axios';
import {Client, Guild, Message, RichEmbed, TextChannel} from 'discord.js';
import { createCanvas, loadImage } from 'canvas';
import CanvasUtils from "./utils/CanvasUtils";

const data: DataStorage = new DataStorage("./data/twitter.json");
const client: Client = new Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (message) => {
    if(message.author.id === '652244995641704463') return;
    
    if(message.content === "t.invite"){
        await message.author.send("Hey! :wave:\n\n**You can invite me with the following link:** https://discordapp.com/oauth2/authorize?client_id=652244995641704463&scope=bot&permissions=8");
        if(message.channel.type === "text"){
            await message.reply("I've sent a link in a DM!");
            await message.delete();
        }
        return;
    }
    
    if(message.content === "t.toggle"){
        if(!message.member.hasPermission("ADMINISTRATOR")){
            await message.reply("You must have the `Administrator` permission in this server to configure me!");
            await message.delete();
            return;
        }
        
        let channel: string = message.channel.id;
        let guild: string = message.guild.id;
        let newStatus: boolean;
        
        let matchingChannels: number = data.get().channels.filter(($channel) => {
            return $channel.channel == channel && $channel.guild == guild;
        }).length;
        
        if(matchingChannels > 0){
            await data.modify(async (previousData) => {
                let $channel = previousData.channels.find(($channel) => {
                    return $channel.channel == channel && $channel.guild == guild;
                });
                
                $channel.active = !$channel.active;
                newStatus = $channel.active;
                
                return previousData;
            });
        }else{
            await data.modify(async (previousData) => {
                previousData.channels.push({
                    channel,
                    guild,
                    active: true
                });
                newStatus = true;
                return previousData;
            });
        }
        
        let status: string = newStatus ? "now a twitter channel." : "no longer a twitter channel.";
        await message.reply(`\`#${(message.channel as TextChannel).name}\` is ${status}`);
        await message.delete();
        return;
    }
    
    if(message.content.startsWith("t.help")) {
        await message.reply("The help information is not yet completed. Please contact @SamJakob#1079 (<@162203541006450688>) for information on the bot.");
        return;
    }
    
    if(message.content.startsWith("t.")) return;
    
    if(!data.get().channels.find((channel) => {
        return channel.active && message.channel.id == channel.channel && message.guild.id == channel.guild;
    })) return;
    
    if(message.cleanContent.length > 0 && !message.cleanContent.trim().startsWith("//")) await convertToTweet(message);

    return;
});

const convertToTweet = async (message: Message) => {
    const canvas = createCanvas(752, 285);
    const ctx = canvas.getContext('2d');
    
    let template = await loadImage('./assets/tweet.png');
    ctx.drawImage(template, 0, 0, 752, 285);
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(30.87 + 32.285, 22 + 32.285, 32.285, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    let avatar = message.member.user.displayAvatarURL;
    let image = await loadImage(avatar.replace('size=2048', 'size=256'));
    ctx.drawImage(image, 30.87, 22, 64.57, 64.57);
    
    ctx.restore();
    
    ctx.textBaseline = "top";
    
    ctx.font = "bold 18px Arial";
    ctx.fillText(message.member.displayName, 105.14, 34.96);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#7A7A7A";
    ctx.fillText(`@${message.member.user.username}`, 105.14, 56.48);
    ctx.fillStyle = "#000000";
    ctx.font = "18px Arial";
    CanvasUtils.drawWrappingText(ctx, message.cleanContent.length > 256 ? `${message.cleanContent.slice(0, 256)}...` : message.cleanContent, 32.98, 103.75, canvas.width - (32.98 * 2));
    
    ctx.save();
    ctx.font = "bold 18px Arial";
    ctx.textBaseline = "top";
    ctx.textAlign = "right";
    ctx.fillStyle = "#7A7A7A";
    ctx.fillText(CanvasUtils.getDateTimeString(), 712.87, 231.78);
    ctx.restore();
    
    let file = (await axios.post(
        config.twitter.postURL,
        canvas.toBuffer().toString('base64')
    )).data;

    let tweet: Message = await message.channel.send("", new RichEmbed({
        image: {
            url: `${config.twitter.postHostURL}${file}`,
            width: 752,
            height: 285
        }
    })) as Message;
    await message.delete();
    
    await tweet.react( '🔁');
    await tweet.react('❤️');
};

client.on('raw', async (event: any) => {
    if(!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(event.t)) return;
    if(event.d.user_id === '652244995641704463') return;
    
    let guild: Guild = client.guilds.find((guild) => guild.id == event.d.guild_id);
    let channel: TextChannel = guild.channels.find((channel) => channel.id == event.d.channel_id) as TextChannel;
    let message: Message = await channel.fetchMessage(event.d.message_id);
    
    if(!data.get().channels.find((channel) => {
        return channel.active && message.channel.id == channel.channel && message.guild.id == channel.guild;
    })) return;
    
    let action: string;
    if(event.d.emoji.name === "❤️") action = "like";
    else if(event.d.emoji.name === "🔁") action = "retweet";
    else return;
    
    let value: number = !!message.reactions.get(event.d.emoji.name) ? message.reactions.get(event.d.emoji.name).count - 1 : 0;
    
    if(message.embeds.length < 1 || !message.embeds[0] || !message.embeds[0].image) return;
    let oldImage: string = message.embeds[0].image.url;
    let oldImagePath: string[] = oldImage.split("/");
    
    const canvas = createCanvas(752, 285);
    const ctx = canvas.getContext('2d');
    
    let oldTweet = await loadImage(oldImage);
    let fileName = oldImagePath[oldImagePath.length - 1].split("?")[0];
    ctx.drawImage(oldTweet, 0, 0, 752, 285);
    
    ctx.font = "bold 14px Arial";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "center";
    if(action === "retweet") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(35.84, 231.78, 18.89, 22.45);
        ctx.fillStyle = "#000000";
        ctx.fillText(value.toString(), 43.74, 250.36);
    } else if(action === "like") {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(155.86, 231.78, 18.89, 22.45);
        ctx.fillStyle = "#000000";
        ctx.fillText(value.toString(), 164.81, 250.36);
    }
    
    let file = (await axios.post(
        `${config.twitter.postURL}&file=${fileName}`,
        canvas.toBuffer().toString('base64')
    )).data;
    
    await message.edit("", new RichEmbed({
        image: {
            url: `${config.twitter.postHostURL}${file}?v=${new Date().getTime()}`,
            width: 752,
            height: 285
        }
    }));
});

(async () => {
    await data.load();
    await client.login(config.twitter.token);
})();
