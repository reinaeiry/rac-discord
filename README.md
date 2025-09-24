# Raven Log Watcher Bot

Raven Log Watcher is a Discord bot that monitors Arma Reforger server log files and reports Raven Anti-Cheat detections to a Discord server. It can automatically watch for new detections and it supports manual searching by player name.
<img width="950" height="950" alt="813E0798-EF6B-46D8-AB6E-B188B6D00945" src="https://github.com/user-attachments/assets/bab7cd33-3586-4d90-9dcc-0642f8723557" />


# Prerequisites

- [Raven Anti-Cheat](https://reforger.armaplatform.com/workshop/66163589B9704AD9) running on your server.
- [Node.js 16](https://nodejs.org/en/download) or newer on the server.
- A Discord account with permission to create bots and manage servers.
- Access to the machine where the Reforger logs exist. The bot must run on the same machine as the logs.

# Create a Discord Bot

1. Open the Discord Developer Portal: https://discord.com/developers/applications
2. Click **New Application** and choose a name.
3. Go to the **Bot** section and click **Add Bot**, name this however you want, this is the name and picture that will appear in discord.
4. Under **Token**, click **Reset Token**, then copy the token. You will use this in `config.json`.
5. Turn on **Message Content Intent** in the **Bot** section.

## Invite the Bot to a Server using Client ID

You can invite the bot with Administrator permissions using your application Client ID.

1. In the Developer Portal, open your application.
2. On the **General Information** page, copy the **Application ID**. This is your Client ID.
3. Enable "Message Content Intent" On the Bot Page
4. Build the invite URL using this pattern and replace `CLIENT_ID_HERE` with your Client ID:

    https://discord.com/oauth2/authorize?client_id=CLIENT_ID_HERE&scope=bot&permissions=8

5. Open the URL in your browser and select your server to invite the bot.

# Configuration

Create a `config.json` file in the project root. Example:

    {
      "token": "YOUR_BOT_TOKEN",
      "logsDir": "C:/users/eiry/my games/armareforgerworkbench/logs",
      "staffRoleIds": ["STAFF ROLE ID HERE", "STAFF ROLE ID TWO HERE"],
      "scanIntervalSeconds": 30
    }

## Field descriptions

- `token`: Your bot token from the Developer Portal.
- `logsDir`: Absolute path to the Reforger logs directory that contains your servers logs directory, change this to your own servers directory.
- `staffRoleIds`: Array of Discord role IDs that are allowed to run the commands. Server administrators are always allowed, one or more, minimum of one.
- `scanIntervalSeconds`: Default scan interval in seconds. Allowed range is 15-300 seconds.

### How to get Role IDs

1. In Discord, open **User Settings**.
2. Go to **Advanced** and enable **Developer Mode**.
3. In your server, open **Server Settings** -> **Roles**.
4. Right click the role you want to use and click **Copy Role ID**.
5. Paste the ID into the `staffRoleIds` array in `config.json`.

# Installation

1. Install Node.js on the server.
2. Clone or download this repository.
3. Start the bot:

    `node index.js` OR double click start.bat

The bot must run on the same machine where the logs are located.

## Commands

All commands are plain chat commands typed in a channel where the bot can read and send messages. Only users with Admin permission or a role listed in `staffRoleIds` can use these commands.

### Enable automatic watching
    /raven on
Starts watching the logs and posting new detections to the current channel.

### Disable automatic watching
    /raven off
Stops watching the logs.

### Set the scan interval
    /raven interval <seconds>
Sets how often the logs are scanned. Valid range is 15-300 seconds. Example:

    /raven interval 60

### Search detections by player
    /raven search <username>
Searches existing detections for a username. If the username is omitted, all detections are returned.

## Behavior

- Lines containing `totalScore=18.75` are ignored as these are stated as false positives by the Anti-Cheat Creator.
- The bot deduplicates detections it has already sent.
- The bot reads directly from log files files under the path provided in `logsDir`.

## Security

- Never commit your bot token to version control if forking this repository.
- Treat `config.json` as a secret. Do not expose this to anyone.

# Credits

- [Raven Anti-Cheat](https://reforger.armaplatform.com/workshop/66163589B9704AD9) - [MyVapeBlewUp](https://x.com/MyVapeBlewUp)
- Discord Bot Code - [Eiry](https://x.com/highmonarch_)
