// Original Code by Kodii, heavily modified by Eiru
const fs = require("fs");
const path = require("path");
const { Client, Events, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const config = require("./config.json");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const ravenWatchers = new Map();
const seenDetections = new Set();
let defaultInterval = Math.min(300, Math.max(15, Number(config.scanIntervalSeconds) || 30));

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const isAdmin = message.member?.permissions?.has(PermissionsBitField.Flags.Administrator);
  const hasStaffRole = (message.member?.roles?.cache ?? new Map()).some((r) =>
    (config.staffRoleIds || []).includes(r.id)
  );
  const allowed = isAdmin || hasStaffRole;
  if (!allowed) return;

  const args = message.content.trim().split(/\s+/);
  if (args[0].toLowerCase() !== "/raven") return;

  const sub = (args[1] || "").toLowerCase();
  const guildId = message.guild?.id;
  if (!guildId) return;

  if (sub === "on") {
    const existing = ravenWatchers.get(guildId);
    if (existing?.enabled) {
      ravenWatchers.set(guildId, { ...existing, enabled: true, channelId: message.channel.id });
      await message.reply("Raven watcher is already ON. Updated target channel.");
      return;
    }
    const intervalMs = (existing?.intervalSeconds ?? defaultInterval) * 1000;
    const timer = setInterval(() => tickRavenScan(guildId).catch(() => {}), intervalMs);
    ravenWatchers.set(guildId, {
      enabled: true,
      channelId: message.channel.id,
      timer,
      intervalSeconds: existing?.intervalSeconds ?? defaultInterval,
    });
    await message.reply(`Raven watcher ON. Interval ${existing?.intervalSeconds ?? defaultInterval}s.`);
    tickRavenScan(guildId).catch(() => {});
    return;
  }

  if (sub === "off") {
    const existing = ravenWatchers.get(guildId);
    if (existing?.timer) clearInterval(existing.timer);
    ravenWatchers.set(guildId, {
      enabled: false,
      channelId: existing?.channelId || message.channel.id,
      timer: null,
      intervalSeconds: existing?.intervalSeconds ?? defaultInterval,
    });
    await message.reply("Raven watcher OFF.");
    return;
  }

  if (sub === "interval") {
    let secs = parseInt(args[2], 10);
    if (isNaN(secs)) {
      await message.reply("Usage: /raven interval <seconds>");
      return;
    }
    if (secs < 15) secs = 15;
    if (secs > 300) secs = 300;
    const existing = ravenWatchers.get(guildId);
    if (existing?.timer) clearInterval(existing.timer);
    const enabled = existing?.enabled ?? false;
    const channelId = existing?.channelId ?? message.channel.id;
    let timer = null;
    if (enabled) {
      timer = setInterval(() => tickRavenScan(guildId).catch(() => {}), secs * 1000);
    }
    ravenWatchers.set(guildId, { enabled, channelId, timer, intervalSeconds: secs });
    defaultInterval = secs;
    await message.reply(`Interval set to ${secs}s.${enabled ? " Restarted watcher." : ""}`);
    return;
  }

  if (sub === "search") {
    const player = args.slice(2).join(" ") || "";
    const lines = collectDetections({ filterPlayer: player });
    if (lines.length === 0) {
      await message.reply(player ? `No Raven entries found for "${player}".` : "No Raven entries found.");
      return;
    }
    const joined = lines.join("\n\n");
    const chunks = joined.match(/[\s\S]{1,1950}/g) || [];
    for (const chunk of chunks) {
      await message.channel.send(chunk);
    }
    await message.channel.send("Done!");
    return;
  }

  await message.reply("Usage: /raven on | off | search <user> | interval <seconds>");
});

async function tickRavenScan(guildId) {
  const watcher = ravenWatchers.get(guildId);
  if (!watcher?.enabled) return;
  const channel = await client.channels.fetch(watcher.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;
  const newLines = collectDetections({ onlyNew: true });
  if (newLines.length === 0) return;
  const joined = newLines.join("\n\n");
  const chunks = joined.match(/[\s\S]{1,1950}/g) || [];
  for (const chunk of chunks) await channel.send(chunk);
  await channel.send("Done!");
}

function collectDetections({ onlyNew = false, filterPlayer = "" } = {}) {
  const logDir = config.logsDir;
  if (!logDir || !fs.existsSync(logDir)) return [];
  let files = getAllFiles(logDir).filter((f) => path.basename(f) === "script.log");
  if (files.length === 0) return [];
  const results = [];
  for (const filePath of files) {
    const content = safeRead(filePath);
    if (content == null) continue;
    let lines = content
      .split("\n")
      .filter((line) => line.includes("[RVN AC DETECTION]") && !line.includes("totalScore=18.75"));
    if (filterPlayer) {
      const p = filterPlayer.toLowerCase();
      lines = lines.filter((line) => line.toLowerCase().includes(p));
    }
    for (const line of lines) {
      const key = filePath + "|" + line;
      if (onlyNew) {
        if (seenDetections.has(key)) continue;
        seenDetections.add(key);
      }
      results.push(line);
    }
  }
  return results;
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  }
  return arrayOfFiles;
}

function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

client.login(config.token);
