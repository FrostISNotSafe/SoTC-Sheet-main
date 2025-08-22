// Módulo de Arquetipos para SoTC Sheet
// Cada arquetipo possui: nome, descrição, tragicFlaw, storyAbilities (array), battleAbility

export const arquetipos = [
  {
    nome: "The Hopeful",
    descricao: `You’re new to this. Maybe you were taken in by the idealistic portrayals of Fixers. Maybe you just wanted to become strong. Life hasn’t quite hit you yet, and everyone around you is placing bets on what happens when it does.`,
    tragicFlaw: {
      nome: "Innocence",
      descricao: "When someone dies under your watch, you gain 2 Anxieties."
    },
    storyAbilities: [
      {
        nome: "Bombastic",
        descricao: `When you Attempt to rally others to a cause which can be seen as noble or heroic, you gain an extra Die, and are guaranteed some small degree of success, regardless of what the Dice say.\n\nIf your new allies suffer great tragedy, they will turn on you with the same fervor they first joined you. They will lash out, perhaps with violence, perhaps by taking back the fruits of their labors.`
      },
      {
        nome: "Idolize",
        descricao: `Once per session, when you see an ally succeed an Attempt that you deem impressive, you may designate them as your Idol for the rest of the session.\n\nWhen your Idol makes an Attempt, you may Help them regardless of the difference in your stats.`
      }
    ],
    battleAbility: {
      nome: "Latent Potential",
      descricao: `Once per Scene, when an ally gains a Buff (Such as Strength, Haste, Protection, Ect.) or a Boon (Such as Safeguard or Poise) you may gain 1 of that buff/boon as well.`
    }
  },
  {
    nome: "sexo",
    descricao: `You’re new to this. Maybe you were taken in by the idealistic portrayals of Fixers. Maybe you just wanted to become strong. Life hasn’t quite hit you yet, and everyone around you is placing bets on what happens when it does.`,
    tragicFlaw: {
      nome: "Innocence",
      descricao: "When someone dies under your watch, you gain 2 Anxieties."
    },
    storyAbilities: [
      {
        nome: "Bombastic",
        descricao: `When you Attempt to rally others to a cause which can be seen as noble or heroic, you gain an extra Die, and are guaranteed some small degree of success, regardless of what the Dice say.\n\nIf your new allies suffer great tragedy, they will turn on you with the same fervor they first joined you. They will lash out, perhaps with violence, perhaps by taking back the fruits of their labors.`
      },
      {
        nome: "Idolize",
        descricao: `Once per session, when you see an ally succeed an Attempt that you deem impressive, you may designate them as your Idol for the rest of the session.\n\nWhen your Idol makes an Attempt, you may Help them regardless of the difference in your stats.`
      }
    ],
    battleAbility: {
      nome: "Latent Potential",
      descricao: `Once per Scene, when an ally gains a Buff (Such as Strength, Haste, Protection, Ect.) or a Boon (Such as Safeguard or Poise) you may gain 1 of that buff/boon as well.`
    }
  }
  // Adicione outros arquetipos aqui
];
