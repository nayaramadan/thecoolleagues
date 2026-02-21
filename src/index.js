// mineflayer bot for crystal pvp
// written by alex & helper - lets gooooo
const mineflayer = require('mineflayer');
const CrystalAura = require('./modules/combat/CrystalAura');
const Surround = require('./modules/combat/Surround');

// --- SET YOUR OWNER NAME HERE ---
const OWNER_NAME = 'naya'; 
// --------------------------------

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
  
  // Replace 'YourPassword123' with your chosen bot password
  bot.chat('/register YourPassword123 YourPassword123');
  bot.chat('/login YourPassword123 YourPassword123');

  crystalAura.enable();
  surround.enable();
});

// --- COMMAND HANDLER (STRICTER LISTENER) ---
bot.on('messagestr', (message, messagePosition, jsonMsg) => {
  const msg = message.toLowerCase();
  
  // This logs everything to your terminal
  console.log(`[SERVER] ${message}`);

  // SECURITY: Only respond to commands if the OWNER_NAME is in the chat message
  if (!message.includes(OWNER_NAME)) return;

  // 1. Status Check
  if (msg.includes('.status')) {
    bot.chat(`I am at ${bot.entity.position.floored()}. CA: ${crystalAura.enabled}`);
  }

  // 2. Teleport (Force TP to the Owner)
  if (msg.includes('.tp')) {
    bot.chat(`/tp CrystalBot ${OWNER_NAME}`);
  }

  // 3. Simple Follow (Fix: specifically looks for the Owner's body)
  if (msg.includes('.come')) {
    const target = bot.players[OWNER_NAME]?.entity;
    if (target) {
      bot.chat("Walking to you, Master!");
      bot.lookAt(target.position);
      bot.setControlState('forward', true);
      // Walks for 3 seconds to ensure it gets close
      setTimeout(() => bot.setControlState('forward', false), 3000);
    } else {
      bot.chat("I can't see you! Use .tp to bring me closer first.");
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
