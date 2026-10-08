export interface BubbleMessage {
  id: string;
  text: string;
  category:
    | 'funny'
    | 'flirty'
    | 'cute'
    | 'love'
    | 'compliment'
    | 'relatable'
    | 'motivation'
    | 'chaotic';
}

export const BUBBLE_POP_MESSAGES: BubbleMessage[] = [
  // ==================================================
  // FUNNY / INDIAN MEME ENERGY (001 - 030)
  // ==================================================
  {
    id: 'bubble-001',
    text: 'Life sorted nahi hai? Koi baat nahi, hum bhi nahi hain. 😂',
    category: 'funny',
  },
  {
    id: 'bubble-002',
    text: 'Tumhara brain 47 tabs khol ke baitha hai. Ek toh band kar do please.',
    category: 'funny',
  },
  {
    id: 'bubble-003',
    text: 'Overthink mat karo yaar, FBI bhi itna investigate nahi karti.',
    category: 'funny',
  },
  {
    id: 'bubble-004',
    text: 'Pehle kuch kha lo. Phir duniya ki problems solve karna.',
    category: 'funny',
  },
  {
    id: 'bubble-005',
    text: 'Productive hone ka plan tha. Phir bed ne emotional blackmail kar diya.',
    category: 'funny',
  },
  {
    id: 'bubble-006',
    text: 'Tum tension mat lo. Tension already tumse zyada invested hai.',
    category: 'funny',
  },
  {
    id: 'bubble-007',
    text: 'Ek kaam karo: phone rakho. Phir 5 second baad wapas utha lena. Progress.',
    category: 'funny',
  },
  {
    id: 'bubble-008',
    text: 'Life ka koi clear plan nahi hai? Same. Welcome to the club. 😂',
    category: 'funny',
  },
  {
    id: 'bubble-009',
    text: 'Tumhara ‘kal se pakka’ kitne kal purana hai?',
    category: 'funny',
  },
  {
    id: 'bubble-010',
    text: 'Stress lene se problem solve nahi hoti. Bas forehead busy ho jata hai.',
    category: 'funny',
  },
  {
    id: 'bubble-011',
    text: 'Aaj productive nahi ho paaye? Koi baat nahi, aesthetic toh lag rahe ho.',
    category: 'funny',
  },
  {
    id: 'bubble-012',
    text: 'Tum overthink nahi karte. Tum premium-level analysis karte ho.',
    category: 'funny',
  },
  {
    id: 'bubble-013',
    text: 'Brain ko bolo thoda chup rahe. Meeting khatam ho gayi hai.',
    category: 'funny',
  },
  {
    id: 'bubble-014',
    text: 'Tumhari problems ko bhi kabhi kabhi ‘seen’ karke chhod dena chahiye.',
    category: 'funny',
  },
  {
    id: 'bubble-015',
    text: 'Google Maps bhi itna reroute nahi karta jitna tumhara dimaag.',
    category: 'funny',
  },
  {
    id: 'bubble-016',
    text: 'Life ne plot diya, tumne overthinking add kar di. Full season ready.',
    category: 'funny',
  },
  {
    id: 'bubble-017',
    text: 'Tumhara sleep schedule aur tumhari life — dono ko thodi counselling chahiye.',
    category: 'funny',
  },
  {
    id: 'bubble-018',
    text: 'Bas ek reminder: sab kuch urgent nahi hota. Especially woh random thought.',
    category: 'funny',
  },
  {
    id: 'bubble-019',
    text: 'Tumhe rest chahiye aur tumhara brain bol raha hai ‘chalo ek aur scenario imagine karte hain.’',
    category: 'funny',
  },
  {
    id: 'bubble-020',
    text: 'Honestly, tum thode zyada hi funny ho jab tum serious hone ki koshish karte ho.',
    category: 'funny',
  },
  {
    id: 'bubble-021',
    text: 'Breaking news: tum abhi bhi alive, cute aur slightly confused ho.',
    category: 'funny',
  },
  {
    id: 'bubble-022',
    text: 'Congratulations, tumne ek aur din successfully figure-out-karne-ka-acting kiya.',
    category: 'funny',
  },
  {
    id: 'bubble-023',
    text: 'Problem solve nahi hui? At least outfit toh cute hai.',
    category: 'funny',
  },
  {
    id: 'bubble-024',
    text: 'Kal kya hoga pata nahi. Aaj kya khana hai, woh decide karo.',
    category: 'funny',
  },
  {
    id: 'bubble-025',
    text: 'Life ka password nahi mila? Koi baat nahi, ‘try again later’ pe chalte hain.',
    category: 'funny',
  },
  {
    id: 'bubble-026',
    text: 'Tumhara inner peace probably airplane mode pe hai.',
    category: 'funny',
  },
  {
    id: 'bubble-027',
    text: 'Ek random fact: tum abhi bhi unnecessarily cute ho.',
    category: 'funny',
  },
  {
    id: 'bubble-028',
    text: 'Duniya jaldi mein hai. Tum thoda dramatic slow motion mein chal sakte ho.',
    category: 'funny',
  },
  {
    id: 'bubble-029',
    text: 'Tumhe sab kuch samajhna zaroori nahi hai. Even Wi-Fi kabhi kabhi bina reason disconnect hota hai.',
    category: 'funny',
  },
  {
    id: 'bubble-030',
    text: 'Official announcement: aaj overthinking ka office early close hai.',
    category: 'funny',
  },

  // ==================================================
  // FLIRTY / CUTE (031 - 055)
  // ==================================================
  {
    id: 'bubble-031',
    text: 'Aaj ka reminder: tum cute ho. Debate closed.',
    category: 'cute',
  },
  {
    id: 'bubble-032',
    text: 'Waise tum kaafi attractive ho. Bas casually bata raha tha.',
    category: 'flirty',
  },
  {
    id: 'bubble-033',
    text: 'Tumhari smile thodi zyada powerful hai. Handle carefully.',
    category: 'flirty',
  },
  {
    id: 'bubble-034',
    text: 'Tumhari vibe? Thodi dangerous. Log crush kar sakte hain.',
    category: 'flirty',
  },
  {
    id: 'bubble-035',
    text: 'Tumhe dekh ke ‘oh, cute’ bolna automatic reaction hona chahiye.',
    category: 'cute',
  },
  {
    id: 'bubble-036',
    text: 'Honestly, tumhare upar compliments waste nahi jaate.',
    category: 'compliment',
  },
  {
    id: 'bubble-037',
    text: 'Tumhari aankhon mein definitely kuch toh scene hai.',
    category: 'flirty',
  },
  {
    id: 'bubble-038',
    text: 'Tum cute ho aur tumhe iska thoda zyada confidence hona chahiye.',
    category: 'cute',
  },
  {
    id: 'bubble-039',
    text: 'Tumhari personality kaafi ‘one more conversation’ wali hai.',
    category: 'flirty',
  },
  {
    id: 'bubble-040',
    text: 'Tumse baat karna probably kisi ka favourite part of the day ho sakta hai.',
    category: 'cute',
  },
  {
    id: 'bubble-041',
    text: 'Tumhari smile ko warning label ke saath aana chahiye.',
    category: 'flirty',
  },
  {
    id: 'bubble-042',
    text: 'Tum thode zyada hi likeable ho. Problematic.',
    category: 'flirty',
  },
  {
    id: 'bubble-043',
    text: 'Tumhari vibe bolti hai: ‘haan, mujhe dekh ke smile aa gayi na?’',
    category: 'flirty',
  },
  {
    id: 'bubble-044',
    text: 'Bas ek compliment: you’re kinda adorable. Carry on.',
    category: 'cute',
  },
  {
    id: 'bubble-045',
    text: 'Tumhare liye ek unnecessary but important reminder: you’re very cute.',
    category: 'cute',
  },
  {
    id: 'bubble-046',
    text: 'Tumhari energy mein kuch toh hai. Explain nahi kar sakta, notice zaroor hota hai.',
    category: 'flirty',
  },
  {
    id: 'bubble-047',
    text: 'Aaj mirror mein thoda extra time dena. Appreciation due hai.',
    category: 'cute',
  },
  {
    id: 'bubble-048',
    text: 'Tum woh ho jisko dekh ke mood accidentally better ho jata hai.',
    category: 'cute',
  },
  {
    id: 'bubble-049',
    text: 'Tumhari smile ka fan club shayad already exist karta hai.',
    category: 'flirty',
  },
  {
    id: 'bubble-050',
    text: 'Tum itne cute kyun ho? Koi reasonable explanation hai?',
    category: 'cute',
  },
  {
    id: 'bubble-051',
    text: 'Tumhari vibe genuinely crush-worthy hai. Bas keh raha hoon.',
    category: 'flirty',
  },
  {
    id: 'bubble-052',
    text: 'Someone is probably thinking you’re cute right now. Statistically possible. 😂',
    category: 'cute',
  },
  {
    id: 'bubble-053',
    text: 'Tumhari presence mein thoda sa ‘stay a little longer’ wala effect hai.',
    category: 'flirty',
  },
  {
    id: 'bubble-054',
    text: 'Tumko compliment karna easy hai. Tum material hi aisa ho.',
    category: 'compliment',
  },
  {
    id: 'bubble-055',
    text: 'Tum pretty ho. Ab please is message ko 17 baar reread mat karna.',
    category: 'cute',
  },

  // ==================================================
  // LOVE / ROMANTIC-WITH-LIFE (056 - 075)
  // ==================================================
  {
    id: 'bubble-056',
    text: 'Apne liye flowers khareed lo. Kisi ka wait kyun?',
    category: 'love',
  },
  {
    id: 'bubble-057',
    text: 'Aaj coffee thodi slow piyo. Life ko bhi thoda aesthetic hone do.',
    category: 'love',
  },
  {
    id: 'bubble-058',
    text: 'Favourite song lagao aur room mein thoda main-character walk kar lo.',
    category: 'love',
  },
  {
    id: 'bubble-059',
    text: 'Apna favourite outfit bina kisi occasion ke pehno.',
    category: 'love',
  },
  {
    id: 'bubble-060',
    text: 'Khud ke saath date pe jaana underrated hai.',
    category: 'love',
  },
  {
    id: 'bubble-061',
    text: 'Perfume kisi aur ke liye nahi. Khud ke liye lagao.',
    category: 'love',
  },
  {
    id: 'bubble-062',
    text: 'Sunset dekhne ke liye reason nahi chahiye.',
    category: 'love',
  },
  {
    id: 'bubble-063',
    text: 'Thodi sunlight, thoda music, thoda peace. Bas perfect.',
    category: 'love',
  },
  {
    id: 'bubble-064',
    text: 'Aaj apne room ko thoda pretty bana do. Mood ko invitation chahiye.',
    category: 'love',
  },
  {
    id: 'bubble-065',
    text: 'Life perfect nahi hai, par aaj ka sky cute ho sakta hai.',
    category: 'love',
  },
  {
    id: 'bubble-066',
    text: 'Apne liye dessert order karna completely valid hai.',
    category: 'love',
  },
  {
    id: 'bubble-067',
    text: 'Tumhari life mein bhi soft little moments deserve karte ho.',
    category: 'love',
  },
  {
    id: 'bubble-068',
    text: 'Sometimes romance is just clean sheets and your favourite song.',
    category: 'love',
  },
  {
    id: 'bubble-069',
    text: 'Window kholo. Hawa ko bhi thoda gossip karne do.',
    category: 'love',
  },
  {
    id: 'bubble-070',
    text: 'Aaj kisi special occasion ka wait mat karo. Aaj bhi occasion hai.',
    category: 'love',
  },
  {
    id: 'bubble-071',
    text: 'Khud ko flowers dena is actually a power move.',
    category: 'love',
  },
  {
    id: 'bubble-072',
    text: 'Thoda slow ho jao. Beautiful things usually rush nahi karti.',
    category: 'love',
  },
  {
    id: 'bubble-073',
    text: 'Apni favourite chai banao aur 10 minute duniya ko ignore karo.',
    category: 'love',
  },
  {
    id: 'bubble-074',
    text: 'Maybe life ko har din productive nahi, kabhi kabhi pretty bhi hona chahiye.',
    category: 'love',
  },
  {
    id: 'bubble-075',
    text: 'Tonight, choose peace. Aur maybe thoda dessert.',
    category: 'love',
  },

  // ==================================================
  // COMPLIMENTS / CONFIDENCE (076 - 090)
  // ==================================================
  {
    id: 'bubble-076',
    text: 'Aap bahut sahi ho. Bas kabhi kabhi khud ko bhi credit de diya karo.',
    category: 'compliment',
  },
  {
    id: 'bubble-077',
    text: 'Tumhari vibe genuinely achhi hai.',
    category: 'compliment',
  },
  {
    id: 'bubble-078',
    text: 'Tum boring bilkul nahi ho. Tum bas apne aap ko underestimate karte ho.',
    category: 'compliment',
  },
  {
    id: 'bubble-079',
    text: 'Tum mein woh wali baat hai jo explain nahi hoti, bas feel hoti hai.',
    category: 'compliment',
  },
  {
    id: 'bubble-080',
    text: 'Tum kisi se kam nahi ho. Comparison band, please.',
    category: 'compliment',
  },
  {
    id: 'bubble-081',
    text: 'Tumhari presence noticeable hai. In a good way.',
    category: 'compliment',
  },
  {
    id: 'bubble-082',
    text: 'Tum jitna sochte ho usse zyada capable ho.',
    category: 'compliment',
  },
  {
    id: 'bubble-083',
    text: 'Thoda confidence rakho yaar. Tum itna bhi complicated project nahi ho.',
    category: 'compliment',
  },
  {
    id: 'bubble-084',
    text: 'Tumhari opinion bhi important hai. Haan, tumhari wali.',
    category: 'compliment',
  },
  {
    id: 'bubble-085',
    text: 'Room mein enter karte waqt permission lene ki zarurat nahi hai.',
    category: 'compliment',
  },
  {
    id: 'bubble-086',
    text: 'Tum apni story ke side character nahi ho.',
    category: 'compliment',
  },
  {
    id: 'bubble-087',
    text: 'Khud ko thoda seriously lo. Duniya baad mein le legi.',
    category: 'compliment',
  },
  {
    id: 'bubble-088',
    text: 'Tumhari energy ko har kisi ki approval ki zarurat nahi.',
    category: 'compliment',
  },
  {
    id: 'bubble-089',
    text: 'Tum already enough ho. Haan, bina footnote ke.',
    category: 'compliment',
  },
  {
    id: 'bubble-090',
    text: 'Jo tum kar sakte ho na, uska half bhi tum khud nahi dekh paate.',
    category: 'compliment',
  },

  // ==================================================
  // RELATABLE / OVERTHINKING (091 - 105)
  // ==================================================
  {
    id: 'bubble-091',
    text: 'Jo message tum 14 baar reread kar rahe ho, usme probably kuch bhi nahi hai.',
    category: 'relatable',
  },
  {
    id: 'bubble-092',
    text: 'Har ‘hmm’ ka hidden meaning nahi hota. Relax.',
    category: 'relatable',
  },
  {
    id: 'bubble-093',
    text: 'Tumhara brain possibilities bana raha hai, facts nahi.',
    category: 'relatable',
  },
  {
    id: 'bubble-094',
    text: 'Har thought ko emergency meeting ki zarurat nahi hoti.',
    category: 'relatable',
  },
  {
    id: 'bubble-095',
    text: 'Overthinking ne phir overtime kar diya? Usko ghar bhejo.',
    category: 'relatable',
  },
  {
    id: 'bubble-096',
    text: 'Tumhe har situation ka perfect answer abhi nahi chahiye.',
    category: 'relatable',
  },
  {
    id: 'bubble-097',
    text: 'Sometimes ‘chalo dekhte hain’ is actually a valid plan.',
    category: 'relatable',
  },
  {
    id: 'bubble-098',
    text: 'Tumhara brain har cheez solve karne ke liye hired nahi hua hai.',
    category: 'relatable',
  },
  {
    id: 'bubble-099',
    text: 'Jo hona tha ho gaya. Ab thoda breathe bhi kar lo.',
    category: 'relatable',
  },
  {
    id: 'bubble-100',
    text: 'Ek deep breath. Phir jo karna hai woh karo.',
    category: 'relatable',
  },
  {
    id: 'bubble-101',
    text: 'Tumhara ‘what if’ department thoda overactive hai.',
    category: 'relatable',
  },
  {
    id: 'bubble-102',
    text: 'Har silence awkward nahi hota. Kabhi kabhi bas silence hota hai.',
    category: 'relatable',
  },
  {
    id: 'bubble-103',
    text: 'Reply late hai. Funeral announcement nahi.',
    category: 'relatable',
  },
  {
    id: 'bubble-104',
    text: 'Unhone online dekha aur reply nahi kiya. Okay Sherlock, case closed.',
    category: 'relatable',
  },
  {
    id: 'bubble-105',
    text: 'Tumhe har kisi ke behaviour ka reason discover karna zaroori nahi.',
    category: 'relatable',
  },

  // ==================================================
  // MOTIVATION / SOFT SUPPORT (106 - 120)
  // ==================================================
  {
    id: 'bubble-106',
    text: 'Slow chal rahe ho? Koi baat nahi. Ruk toh nahi gaye.',
    category: 'motivation',
  },
  {
    id: 'bubble-107',
    text: 'Thak gaye ho toh rest karo. Quit karna aur break lena same cheez nahi hoti.',
    category: 'motivation',
  },
  {
    id: 'bubble-108',
    text: 'Aaj ka 1% bhi kal se better hai.',
    category: 'motivation',
  },
  {
    id: 'bubble-109',
    text: 'Tumne pehle bhi tough days nikale hain. Ye wala bhi nikal jayega.',
    category: 'motivation',
  },
  {
    id: 'bubble-110',
    text: 'Perfect start ka wait karoge toh story kabhi start nahi hogi.',
    category: 'motivation',
  },
  {
    id: 'bubble-111',
    text: 'Bas next step pe focus karo. Puri staircase abhi nahi dekhni.',
    category: 'motivation',
  },
  {
    id: 'bubble-112',
    text: 'Tum late nahi ho. Tum apni timeline pe ho.',
    category: 'motivation',
  },
  {
    id: 'bubble-113',
    text: 'Tumhara future self tumhe secretly cheer kar raha hai.',
    category: 'motivation',
  },
  {
    id: 'bubble-114',
    text: 'Ek small task complete karo. Momentum khud aa jayega.',
    category: 'motivation',
  },
  {
    id: 'bubble-115',
    text: 'Fail hona data hai, personality trait nahi.',
    category: 'motivation',
  },
  {
    id: 'bubble-116',
    text: 'Tum dumb nahi ho. Tum tired ho. Difference hai.',
    category: 'motivation',
  },
  {
    id: 'bubble-117',
    text: 'Sab kuch aaj solve karna compulsory nahi hai.',
    category: 'motivation',
  },
  {
    id: 'bubble-118',
    text: 'Bad day hai. Bad life nahi.',
    category: 'motivation',
  },
  {
    id: 'bubble-119',
    text: 'Tumhe strong rehne ka performance dene ki zarurat nahi.',
    category: 'motivation',
  },
  {
    id: 'bubble-120',
    text: 'Keep going yaar. Quiet progress bhi progress hoti hai.',
    category: 'motivation',
  },

  // ==================================================
  // CHAOTIC / RANDOM / MEME (121 - 130)
  // ==================================================
  {
    id: 'bubble-121',
    text: 'Tumne ye bubble pop kiya. Ab officially ek tiny victory ho gayi.',
    category: 'chaotic',
  },
  {
    id: 'bubble-122',
    text: 'Bubble gaya. Compliment reh gaya. 😌',
    category: 'chaotic',
  },
  {
    id: 'bubble-123',
    text: 'Ye message kisi kaam ka nahi hai. Bas tumhe smile karwana tha.',
    category: 'chaotic',
  },
  {
    id: 'bubble-124',
    text: 'Tumhari current vibe: 20% confidence, 80% ‘dekhte hain kya hota hai.’',
    category: 'chaotic',
  },
  {
    id: 'bubble-125',
    text: 'Plot twist: tum actually kar loge.',
    category: 'chaotic',
  },
  {
    id: 'bubble-126',
    text: 'Breaking news: tum still cool ho. Sources: me.',
    category: 'chaotic',
  },
  {
    id: 'bubble-127',
    text: 'Bas itna kehna tha: apna khayal rakho, warna kaun rakhega? Netflix?',
    category: 'chaotic',
  },
  {
    id: 'bubble-128',
    text: 'Tumhari life ka trailer thoda chaotic hai, but honestly… interesting hai.',
    category: 'chaotic',
  },
  {
    id: 'bubble-129',
    text: 'Officially certified: tum aaj bhi slay kar rahe ho.',
    category: 'chaotic',
  },
  {
    id: 'bubble-130',
    text: 'Okay bye. Bas itna hi kehna tha ki you’re doing fine. 🫶',
    category: 'chaotic',
  },
];

/**
 * Random message selection with intelligent recent-history avoidance.
 * Avoids the last 12 messages.
 */
export function getRandomBubbleMessage(recentIds: string[] = []): BubbleMessage {
  const available = BUBBLE_POP_MESSAGES.filter((msg) => !recentIds.includes(msg.id));
  const pool = available.length > 0 ? available : BUBBLE_POP_MESSAGES;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
