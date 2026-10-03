export const appImages = {
  homeHero: require('../assets/images/backgrounds/home-v2.jpg'),
  mySpaceHero: require('../assets/images/backgrounds/myspace-v2.jpg'),
  listenHero: require('../assets/images/backgrounds/listen-v2.jpg'),
} as const;

export const images = {
  home: {
    hero: appImages.homeHero,
    mirror: require('../assets/images/home/mirror.jpg'),
    skincare: require('../assets/images/home/skincare.jpg'),
    write: require('../assets/images/home/write.jpg'),
    listen: require('../assets/images/home/listen.jpg'),
    softTalk: require('../assets/images/soft-talk/soft-talk.jpg'),
    games: require('../assets/images/home/games.jpg'),
  },
  mirror: {
    hero: require('../assets/images/mirror/hero.jpg'),
  },
  skincare: {
    hero: require('../assets/images/skincare/hero.jpg'),
  },
  write: {
    hero: require('../assets/images/write/hero.jpg'),
  },
  listen: {
    hero: appImages.listenHero,
    playlist: appImages.listenHero,
  },
  softTalk: {
    hero: require('../assets/images/soft-talk/soft-talk.jpg'),
  },
  games: {
    hero: require('../assets/images/games/hero.jpg'),
  },
  myspace: {
    hero: appImages.mySpaceHero,
    journal: require('../assets/images/myspace/journal.jpg'),
    mirror: require('../assets/images/myspace/mirror.jpg'),
    voice: require('../assets/images/myspace/voice.jpg'),
    memories: require('../assets/images/myspace/memories.jpg'),
    letters: require('../assets/images/myspace/letters.jpg'),
  },
  explore: {
    tinyGames: require('../assets/images/explore/tiny-games.jpg'),
    glow: require('../assets/images/explore/glow.jpg'),
    justBe: require('../assets/images/explore/just-be.jpg'),
    prompts: require('../assets/images/explore/prompts.jpg'),
  },
} as const;

