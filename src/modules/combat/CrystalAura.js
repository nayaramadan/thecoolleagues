// crystal aura module
// based on meteor client but ported to js
// lots of TODOs cuz not fully done

const Targeting = require('../../services/Targeting')
const DamageCalc = require('../../services/DamageCalc');
const Rotation = require('../services/Rotation');
const Inventory = require('../../services/Inventory');
const config = require('../../config');
const Vec3 = require('vec3');

class CrystalAura {
  constructor(bot) {
    this.bot = bot;
    this.enabled = false;
    
    // services
    this.targeting = new Targeting(bot);
    this.damageCalc = new DamageCalc();
    this.rotation = new Rotation(bot);
    this.inventory = new Inventory(bot);
    
    // timers - from meteor
    this.placeTimer = 0;
    this.breakTimer = 0;
    this.ticks = 0;
    this.placingTimer = 0; // 4 ticks in meteor
    
    // target tracking
    this.bestTarget = null;
    this.bestTargetTimer = 0;
    
    // stats for debug
    this.placedCount = 0;
    this.brokenCount = 0;
    
    console.log('crystal aura loaded');
  }
  
  enable() {
    this.enabled = true;
    this.tick();
    console.log('crystal aura enabled lol');
  }
  
  disable() {
    this.enabled = false;
    console.log('crystal aura disabled');
  }
  
  // main tick loop - runs every 50ms
  tick() {
    if(!this.enabled) {
      return;
    }
    
    this.ticks++;
    this.placingTimer = Math.max(0, this.placingTimer - 1);
    
    try {
      // update our target
      this.updateBestTarget();
      
      if(!this.bestTarget) {
        // no target, wait and try again
        setTimeout(() => this.tick(), 50);
        return;
      }
      
      // look at target
      this.rotation.lookAtEntity(this.bestTarget);
      
      // meteor does break first, then place
      // only one action per tick usually
      
      // break crystals first
      if(this.breakTimer <= 0) {
        if(this.doBreak()) {
          this.breakTimer = 2; // 2 tick cooldown
          console.log('broke crystal');
        }
      }
      
      // then place
      if(this.placeTimer <= 0 && this.placingTimer <= 0) {
        if(this.doPlace()) {
          this.placeTimer = 2;
          this.placingTimer = 4; // prevent placing too many
          console.log('placed crystal #' + this.placedCount);
        }
      }
      
      // decrement timers
      if(this.breakTimer > 0) this.breakTimer--;
      if(this.placeTimer > 0) this.placeTimer--;
      
    } catch(err) {
      console.log('crystal aura error:', err);
      // dont crash lol
    }
    
    // schedule next tick
    setTimeout(() => this.tick(), 50);
  }
  
  // update best target with hysteresis
  // so we dont flicker between targets
  updateBestTarget() {
    var target = this.targeting.getBestTarget();
    
    if(target !== this.bestTarget) {
      this.bestTargetTimer++;
      // only switch after 10 ticks or if no target
      if(this.bestTargetTimer > 10 || !this.bestTarget) {
        this.bestTarget = target;
        this.bestTargetTimer = 0;
      }
    } else {
      this.bestTargetTimer = 0;
    }
  }
  
  // break logic
  // TODO: this is messy, clean up later
  doBreak() {
    var bestCrystal = null;
    var bestScore = -999;
    
    // find all crystals in range
    var entities = Object.values(this.bot.entities);
    
    for(var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      
      // skip non-crystals
      if(entity.name !== 'end_crystal') {
        continue;
      }
      
      // check range
      var dist = entity.position.distanceTo(this.bot.entity.position);
      if(dist > config.crystal.breakRange) {
        continue;
      }
      
      // calc damage to target
      var targetDmg = this.damageCalc.crystalDamage(
        this.bestTarget, 
        entity.position, 
        this.bot
      );
      var selfDmg = this.damageCalc.crystalDamage(
        this.bot.entity, 
        entity.position, 
        this.bot
      );
      
      // check min damage
      if(targetDmg < config.crystal.minDamage && !this.shouldFaceplace()) {
        continue;
      }
      
      // check self damage limit
      if(selfDmg > config.crystal.maxSelfDamage) {
        continue;
      }
      
      // anti-suicide
      if(selfDmg >= this.bot.health - 1) {
        continue;
      }
      
      // score this crystal
      var score = targetDmg - selfDmg * 2;
      if(score > bestScore) {
        bestScore = score;
        bestCrystal = entity;
      }
    }
    
    // attack best crystal
    if(bestCrystal) {
      this.bot.attack(bestCrystal);
      this.brokenCount++;
      return true;
    }
    
    return false;
  }
  
  // place logic - find best spot
  doPlace() {
    var bestPos = null;
    var bestScore = -999;
    var target = this.bestTarget;
    
    // scan positions around target
    var targetPos = target.position.floored();
    var range = Math.ceil(config.crystal.placeRange);
    
    // 3D loop - probably slow but whatever
    for(var dx = -range; dx <= range; dx++) {
      for(var dy = -range; dy <= range; dy++) {
        for(var dz = -range; dz <= range; dz++) {
          var pos = targetPos.offset(dx, dy, dz);
          
          // check if valid placement
          if(!this.isValidPlacePos(pos)) {
            continue;
          }
          
          // calc damage at this pos
          var crystalPos = pos.offset(0.5, 0, 0.5); // center
          var targetDmg = this.damageCalc.crystalDamage(
            target, 
            crystalPos, 
            this.bot
          );
          var selfDmg = this.damageCalc.crystalDamage(
            this.bot.entity, 
            crystalPos, 
            this.bot
          );
          
          // check thresholds
          if(targetDmg < config.crystal.minDamage && !this.shouldFaceplace()) {
            continue;
          }
          if(selfDmg > config.crystal.maxSelfDamage) {
            continue;
          }
          if(selfDmg >= this.bot.health - 1) {
            continue;
          }
          
          // score it
          var score = targetDmg - selfDmg * 2;
          if(score > bestScore) {
            bestScore = score;
            bestPos = pos;
          }
        }
      }
    }
    
    // place if we found a spot
    if(bestPos) {
      return this.placeCrystal(bestPos);
    }
    
    return false;
  }
  
  // check if position valid for crystal
  isValidPlacePos(pos) {
    // check distance
    var dist = this.bot.entity.position.distanceTo(
      pos.offset(0.5, 0.5, 0.5)
    );
    if(dist > config.crystal.placeRange) {
      return false;
    }
    
    // need obsidian or bedrock base
    var baseBlock = this.bot.blockAt(pos.offset(0, -1, 0));
    if(!baseBlock) {
      return false;
    }
    if(baseBlock.name !== 'obsidian' && baseBlock.name !== 'bedrock') {
      return false;
    }
    
    // space above must be air
    var block = this.bot.blockAt(pos);
    if(block && block.name !== 'air') {
      return false;
    }
    
    // check for entity collision
    if(this.wouldCollideWithEntities(pos)) {
      return false;
    }
    
    return true;
  }
  
  // check if crystal would hit entities
  wouldCollideWithEntities(pos) {
    var entities = Object.values(this.bot.entities);
    
    for(var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      
      // skip ourselves
      if(entity === this.bot.entity) {
        continue;
      }
      
      // crystals can overlap with each other
      if(entity.name === 'end_crystal') {
        continue;
      }
      
      var dist = entity.position.distanceTo(
        pos.offset(0.5, 0.5, 0.5)
      );
      
      // 1.5 is kinda arbitrary but works
      if(dist < 1.5) {
        return true;
      }
    }
    
    return false;
  }
  
  // place crystal at position
  placeCrystal(pos) {
    var basePos = pos.offset(0, -1, 0);
    var faceVector = new Vec3(0, 1, 0);
    
    return this.botPlaceBlock(basePos, faceVector);
  }
  
  // faceplace when target low health
  // ignore min damage in this case
  shouldFaceplace() {
    if(this.bestTarget && this.bestTarget.health <= 8) {
      return true;
    }
    return false;
  }
  
  // actually place the block
  // async cuz mineflayer
  async botPlaceBlock(blockPos, faceVector) {
    // find crystal in inventory
    var crystal = this.inventory.findItem('end_crystal');
    if(!crystal) {
      console.log('no crystals lol');
      return false;
    }
    
    try {
      // equip crystal
      await this.inventory.equip(crystal);
      
      // get block reference
      var block = this.bot.blockAt(blockPos);
      if(!block) {
        return false;
      }
      
      // place it
      await this.bot.placeBlock(block, faceVector);
      this.placedCount++;
      
      return true;
    } catch(e) {
      console.log('place failed:', e.message);
      return false;
    }
  }
}

module.exports = CrystalAura;
