// mineflayer bot for crystal pvp
// rewritten by alex & helper - lets gooooo
const mineflayer = require('mineflayer');
const CrystalAura = require('./modules/combat/CrystalAura');
const Surround = require('./modules/combat/Surround');

// --- SECRET COMMAND PREFIX ---
const SECRET = '!hi'; 
// -----------------------------

// bot config
const bot = mineflayer.createBot({
  host: 'server.botfights.hackcraft.hackclub.com',
  username: 'CrystalBot',
  version: '1.21.1',
  auth: 'offline',
  checkTimeoutInterval: 60000
});

// load modules
const crystalAura = new CrystalAura(bot);
const surround = new Surround(bot);

bot.on('spawn', () => {
  console.log('Bot spawned! Sending register/login...');
  
  // Auto-auth for offline servers
  bot.chat('/register YourPassword123 YourPassword123');
  bot.chat('/login YourPassword123 YourPassword123');

  crystalAura.enable();
  surround.enable();
});

// --- COMMAND HANDLER (SECRET PREFIX MODE) ---
bot.on('messagestr', (message) => {
  const msg = message.toLowerCase();
  
  // Log everything so you can see what the bot hears in your terminal
  console.log(`[SERVER] ${message}`);

  // ONLY respond if the message starts with your secret code
  if (!msg.includes(SECRET)) return;

  // 1. Status Check (Usage: !99 status)
  if (msg.includes('status')) {
    bot.chat(`I am at ${bot.entity.position.floored()}. CA: ${crystalAura.enabled}`);
  }

  // 2. Teleport (Usage: !99 tp)
  // This extracts the name of whoever sent the secret code
  if (msg.includes('tp')) {
    const sender = message.split(/[:<> ]/)[1] || message.split(' ')[0];
    bot.chat(`/tp CrystalBot ${sender}`);
    bot.chat(`Teleporting to ${sender}...`);
  }

  // 3. Simple Follow (Usage: !99 come)
  if (msg.includes('come')) {
    const sender = message.split(/[:<> ]/)[1] || message.split(' ')[0];
    const target = bot.players[sender]?.entity;
    if (target) {
      bot.chat(`Walking to ${sender}!`);
      bot.lookAt(target.position);
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), 3000);
    } else {
      bot.chat("I can't see you! Get closer or use !99 tp.");
    }
  }

  // 4. Toggle Crystal Aura (Usage: !99 ca)
  if (msg.includes('ca')) {
    if (crystalAura.enabled) {
      crystalAura.disable();
      bot.chat("Crystal Aura: DISABLED");
    } else {
      crystalAura.enable();
      bot.chat("Crystal Aura: ENABLED");
    }
  }
});

bot.on('death', () => {
  console.log('Bot died! Respawning...');
  setTimeout(() => bot.respawn(), 1000);
});

bot.on('kicked', (reason) => {
  console.log('Kicked for:', reason);
});

bot.on('error', (err) => {
  console.log('Connection error:', err);
});
