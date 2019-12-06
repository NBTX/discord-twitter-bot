# Twitter Bot
A bot to simulate Twitter from a Discord text channel.

## Instructions
- Use `t.toggle` to enable the bot in a given channel.
- Use `t.invite` to get an invite link for the bot.

## Setting up for yourself
1. Obtain a Discord bot token.
2. Setup and host the Image Upload Script (see below).
2. Clone the repository and rename `config.dist.json` to `config.json`.
3. Add your token to `config.json` (`twitter.token`).
4. Add the URL of your image host script to `config.json` - with the token in the GET parameter. (`twitter.postURL`)
5. Add the directory where the tweet images are stored, **with the trailing slash (/)** (`twitter.postHostURL`).
6. Start the bot with `npm start`.

## Image Upload Script
See [/server](server).