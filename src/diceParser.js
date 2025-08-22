// Dice Parser for V1 Dice Syntax (parcial, extensível)
// Suporta: XdY, dY, dF, fate, !, !Z, kZ, khZ, klZ, dZ, dlZ, dhZ, cZ, BX, GX, WX, BX!, +, -, *, /, ++, --, <<, >>, <, <=, >, >=, ns, X#A, parênteses

function rollSingleDie(sides) {
  if (sides === 'F') {
    // Fate die: -1, 0, 1
    const fate = [-1, 0, 1];
    return fate[Math.floor(Math.random() * 3)];
  }
  return Math.floor(Math.random() * sides) + 1;
}

function parseDiceExpr(expr) {
  // Simples: XdY, dY, dF, fate
  const diceRegex = /^(\d*)d(\d+|F)(!\d*|)(k\d+|kh\d+|kl\d+|d\d+|dl\d+|dh\d+|c\d+|ns)?$/i;
  const match = expr.match(diceRegex);
  if (!match) return null;
  let [_, count, sides, explode, mod] = match;
  count = count ? parseInt(count) : 1;
  sides = sides === 'F' ? 'F' : parseInt(sides);
  let rolls = [];
  let expl = false, explValue = null;
  if (explode) {
    expl = true;
    explValue = explode.length > 1 ? parseInt(explode.slice(1)) : sides;
  }
  // Roll dice
  for (let i = 0; i < count; i++) {
    let roll = rollSingleDie(sides);
    rolls.push(roll);
    // Exploding
    if (expl && roll >= explValue) {
      let extra;
      do {
        extra = rollSingleDie(sides);
        rolls.push(extra);
      } while (extra >= explValue);
    }
  }
  // Modificadores: keep/drop/crit/ns
  let sorted = true;
  if (mod) {
    if (mod.startsWith('k')) { // keep highest
      let k = parseInt(mod.replace(/\D/g, ''));
      rolls = rolls.sort((a,b)=>b-a).slice(0, k);
    } else if (mod.startsWith('kl')) { // keep lowest
      let k = parseInt(mod.replace(/\D/g, ''));
      rolls = rolls.sort((a,b)=>a-b).slice(0, k);
    } else if (mod.startsWith('d')) { // drop lowest
      let d = parseInt(mod.replace(/\D/g, ''));
      rolls = rolls.sort((a,b)=>a-b).slice(d);
    } else if (mod.startsWith('dh')) { // drop highest
      let d = parseInt(mod.replace(/\D/g, ''));
      rolls = rolls.sort((a,b)=>b-a).slice(d);
    } else if (mod.startsWith('c')) { // critrange
      let crit = parseInt(mod.replace(/\D/g, ''));
      rolls = rolls.map(r => r >= crit ? `**${r}**` : r);
    } else if (mod === 'ns') {
      sorted = false;
    }
  }
  if (sorted) rolls = rolls.sort((a,b)=>b-a);
  return { rolls, total: rolls.reduce((a,b)=>a+parseInt(b),0), expr };
}

export function rollDiceV1(expr) {
  expr = expr.replace(/\s+/g, '');

  // Fate/Burning Wheel aliases
  expr = expr.replace(/BX!/gi, 'd6!>>4');
  expr = expr.replace(/GX!/gi, 'd6!>>3');
  expr = expr.replace(/WX!/gi, 'd6!>>2');
  expr = expr.replace(/BX/gi, 'd6>>4');
  expr = expr.replace(/GX/gi, 'd6>>3');
  expr = expr.replace(/WX/gi, 'd6>>2');

  // Fate dice
  expr = expr.replace(/dF/gi, 'dF');

  // Suporte a X#A (bulk roll)
  if (expr.includes('#')) {
    const [times, subexpr] = expr.split('#');
    let results = [];
    for (let i = 0; i < parseInt(times); i++) {
      results.push(rollDiceV1(subexpr));
    }
    return results;
  }

  // ✅ Suporte a múltiplas operações aritméticas seguidas: 1d10+1d3+15
  let tokens = expr.split(/([+\-*/])/);
  if (tokens.length > 1) {
    let total = 0;
    let rolls = [];
    let currentOp = '+';

    for (let token of tokens) {
      token = token.trim();
      if (['+', '-', '*', '/'].includes(token)) {
        currentOp = token;
        continue;
      }

      const part = rollDiceV1(token);
      let val = (typeof part === 'object' && part !== null)
        ? (part.total !== undefined ? part.total : 0)
        : parseInt(part);
      if (isNaN(val)) val = 0;

      if (currentOp === '+') total += val;
      else if (currentOp === '-') total -= val;
      else if (currentOp === '*') total *= val;
      else if (currentOp === '/') total = Math.floor(total / val);

      if (part.rolls) rolls = rolls.concat(part.rolls);
      else rolls.push(val);
    }

    return {
      rolls,
      total,
      expr
    };
  }

  // Apenas um bloco de dados por vez
  const result = parseDiceExpr(expr);

  // ✅ Corrigir caso a expressão seja apenas um número fixo
  if (!result && !isNaN(expr)) {
    return {
      rolls: [parseInt(expr)],
      total: parseInt(expr),
      expr
    };
  }

  if (!result) return { error: 'Invalid dice expression', expr };
  return result;
}
