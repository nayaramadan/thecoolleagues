// mineflayer bot for crystal pvp
// written by alex - dont judge my code lol
const mineflayer = require('mineflayer');
const config = require('./config');
const CrystalAura = require('./modules/combat/CrystalAura');
const Surround = require('./modules/combat/Surround');

// bot config
const bot = mineflayer.createBot({
  host: 'server.botfights.hackcraft.hackclub.com',
  username: 'CrystalBot',
  version: '1.21.1',
  auth: 'offline' 
});

// load modules
const crystalAura = new CrystalAura(bot);
const surround = new Surround(bot);

bot.on('spawn', () => {
  console.log('bot spawned! lets gooooo');
  console.log('loading modules...'); // debug
  crystalAura.enable();
  surround.enable();
});

bot.on('kicked', (reason) => {
  console.log('kicked:', reason);
  console.log('wtf why did we get kicked'); // TODO: handle this better
});

bot.on('error', (err) => {
  console.log('error:', err);
  // idk what to do here lol
});

// FIXME: add more event handlers
// --- COMMAND HANDLER ---
bot.on('chat', (username, message) => {
  if (username === bot.username) return; // Don't talk to yourself
  
  const msg = message.toLowerCase();

  // 1. Teleport Command (If you have OP/Permissions on the server)
  if (msg === '.tp') {
    bot.chat(`/tp ${bot.username} ${username}`);
    bot.chat(`On my way to ${username}!`);
  }

  // 2. Simple Follow (Basic version)
  if (msg === '.come') {
    const target = bot.players[username]?.entity;
    if (!target) {
      bot.chat("I can't see you! Get closer so I can load your player model.");
      return;
    }
    const pos = target.position;
    bot.chat("Walking to you...");
    // This uses the built-in physics to look and walk
    bot.lookAt(pos);
    bot.setControlState('forward', true);
    setTimeout(() => bot.setControlState('forward', false), 2000); // Walk for 2 seconds
  }

  // 3. Toggle Crystal Aura
  if (msg === '.ca') {
    if (crystalAura.enabled) {
      crystalAura.disable();
      bot.chat("Crystal Aura: DISABLED");
    } else {
      crystalAura.enable();
      bot.chat("Crystal Aura: ENABLED");
    }
  }

  // 4. Status Check
  if (msg === '.status') {
    bot.chat(`I'm at ${bot.entity.position.floored()}. CA: ${crystalAura.enabled}`);
  }
});

// Handle death so it doesn't just sit at the respawn screen
bot.on('death', () => {
  console.log('rip');
  setTimeout(() => bot.respawn(), 1000);
});
