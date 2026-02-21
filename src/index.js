// mineflayer bot for crystal pvp
// written by alex & helper - lets gooooo
const mineflayer = require('mineflayer');
const CrystalAura = require('./modules/combat/CrystalAura');
const Surround = require('./modules/combat/Surround');

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
  console.log('Bot spawned! Sending register command...');
  
  // Replace 'YourPassword123' with the actual password you want to use
  bot.chat('/register YourPassword123 YourPassword123');
  
  // You might also need to login if you've already registered
  // bot.chat('/login YourPassword123');

  crystalAura.enable();
  surround.enable();
});

// --- COMMAND HANDLER (STRICTER LISTENER) ---
bot.on('messagestr', (message, messagePosition, jsonMsg) => {
  const msg = message.toLowerCase();
  
  // This logs everything to your terminal so you can see if the bot "hears" you
  console.log(`[SERVER] ${message}`);

  // 1. Status Check
  if (msg.includes('.status')) {
    bot.chat(`I am at ${bot.entity.position.floored()}. CA: ${crystalAura.enabled}`);
  }

  // 2. Teleport (Tries to TP to the person who typed the command)
  if (msg.includes('.tp')) {
    // This finds your name in a chat like "<Name> .tp"
    const sender = message.split(' ')[0].replace(/[<>]/g, '');
    bot.chat(`/tp CrystalBot ${sender}`);
  }

  // 3. Simple Follow
  if (msg.includes('.come')) {
    const sender = message.split(' ')[0].replace(/[<>]/g, '');
    const target = bot.players[sender]?.entity;
    if (target) {
      bot.lookAt(target.position);
      bot.setControlState('forward', true);
      setTimeout(() => bot.setControlState('forward', false), 2000);
      bot.chat("Walking to you!");
    } else {
      bot.chat("I can't see you!");
    }
  }

  // 4. Toggle Crystal Aura
  if (msg.includes('.ca')) {
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
  console.log('Bot died! Respawning in 1 second...');
  setTimeout(() => bot.respawn(), 1000);
});

bot.on('kicked', (reason) => {
  console.log('Kicked for:', reason);
});

bot.on('error', (err) => {
  console.log('Connection error:', err);
});
