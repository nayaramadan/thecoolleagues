// mineflayer bot for crystal pvp
// written by alex - dont judge my code lol
const mineflayer = require('mineflayer');
const config = require('./config');
const CrystalAura = require('./modules/combat/CrystalAura');
const Surround = require('./modules/combat/Surround');

// bot config
const bot = mineflayer.createBot({
  host: '92.222.100.10',
  port: 25565,
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
// bot.on('chat', ...)
// bot.on('death', ...)
