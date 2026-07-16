import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envFile = readFileSync(resolve(import.meta.dirname, '../.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)="?(.+?)"?\s*$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function seedJournal() {
  const entries = [
    {
      id: 'journal-4',
      title: 'The Night I Forgot Every Line (And Found Something Better)',
      category: 'BEHIND THE SCENES',
      date: 'March 12, 2024',
      image: '/src/assets/images/gillian_theatre_rehearsal_1783349680324.jpg',
      excerpt: 'Every actor has that nightmare — standing on stage with a completely blank mind. Mine happened on opening night at the Young Vic. Here is what happened next.',
      read_time: '7 min read',
      content: `There is a specific kind of terror that only exists in live theater. It is not the adrenaline of a film set, where you can reset and try again. It is not the controlled chaos of a television shoot. It is the absolute, bone-deep knowledge that once you step into that light, there is no safety net. No director yelling "cut." No second take. Just you, the audience, and the words you are supposed to remember.

I had performed Blanche DuBois in A Streetcar Named Desire maybe sixty times by opening night at the Young Vic. Sixty times. I knew those lines the way I know my own name. I had whispered them, screamed them, sobbed them. I had performed them when I was exhausted, when I was energized, when I was fighting a cold and when I was running on pure adrenaline. The words had become part of my body, like breathing.

And then, on opening night, in front of a packed house that included critics who would decide whether this production lived or died, I walked onstage for the pivotal scene — the one where Blanche reveals her deepest vulnerability to Mitch — and my mind went completely, utterly, spectacularly blank.

Not blank like "I forgot one word." Blank like someone had taken an eraser to my brain. Blank like I had never read a script in my life. I stood there, under the warm glow of the stage lights, looking at the actor playing Mitch, and I had absolutely nothing. Zero. Not a single syllable.

For what felt like an eternity — though it was probably about four seconds, which in stage time is approximately four hundred years — I stood there. The audience was silent. The other actor was looking at me with that particular expression that says "please for the love of God remember your line." And I thought: this is it. This is how my career ends. Not with a whimper, not with a bang, but with me standing on a West End stage looking like I have wandered in off the street.

And then something extraordinary happened.

Instead of panicking, instead of trying to force the words out, instead of doing that terrible thing where you paraphrase and hope nobody notices, I did something I had never done before. I just... stopped. I looked at Mitch — really looked at him — and I said, with complete honesty, "I don't remember what I'm supposed to say next."

The audience laughed. Not a mean laugh. A warm, surprised, human laugh. Because here is the thing about live theater: the audience knows when something goes wrong. They can feel it. And when you acknowledge it, when you don't pretend it didn't happen, something magical occurs. The wall between performer and audience dissolves. Suddenly, we are all in this together.

The actor playing Mitch, bless his brilliant heart, improvised. He said something like "Take your time, Blanche. I'm not going anywhere." And the audience laughed again, and I laughed, and somewhere in that laughter I found the words. They came back to me not as lines from a script but as feelings, as emotions, as the raw, naked truth of who Blanche DuBois was. I didn't recite them. I lived them.

That night, the review in The Guardian called it "the most electrifying piece of theater in a generation." They said my performance had "a raw, unscripted quality that made every moment feel dangerously alive." They had no idea how literally true that was.

I have never told anyone that story before. Not the director, not my cast mates, not my agent. Because part of me was embarrassed. Professional actors are not supposed to forget their lines. It is literally the one thing you are trained never to do. But looking back, I think that night taught me something more valuable than any acting class ever could.

It taught me that perfection is not the goal. Connection is. When I stopped trying to be perfect and just allowed myself to be human — confused, scared, vulnerable — the audience didn't judge me. They leaned in. They connected. They felt what Blanche was feeling because I was, for that brief moment, genuinely feeling it myself.

I think about that night often, especially when I am preparing for a new role. I think about how we spend so much of our lives trying to get everything right, trying to have all the answers, trying to present a polished, perfect version of ourselves to the world. And I think about how the most beautiful moments in life — the moments that truly matter — are the ones where we let that facade drop and just... exist. Flawed. Confused. Human.

The stage taught me that. The audience taught me that. And Blanche DuBois, with all her madness and heartbreak and desperate, trembling hope, taught me that.

> "I have always depended on the kindness of strangers." — Tennessee Williams

And you know what? So have I. Every single night, I depend on the kindness of the strangers sitting in those seats. I depend on them to meet me halfway, to bring their own experiences and emotions into the room, to allow themselves to feel something. And every single night, they do. That is the magic of live performance. It is a conversation, not a monologue. It is a collaboration between performer and audience, and when it works, it is the most beautiful thing in the world.

So here is my advice to anyone who is afraid of failing, afraid of forgetting their lines, afraid of standing in the spotlight and drawing a blank: let it happen. Let yourself be imperfect. Let yourself be human. Because that is where the real magic lives — not in the flawless execution, but in the honest, messy, beautiful vulnerability of being alive.`
    },
    {
      id: 'journal-5',
      title: 'Why I Keep a Notebook Full of Strangers\' Stories',
      category: 'PERSONAL',
      date: 'February 28, 2024',
      image: '/src/assets/images/gillian_speaking_event_1783349739126.jpg',
      excerpt: 'For fifteen years, I have carried a small black notebook wherever I go. Inside are fragments of conversations with strangers — the woman at the airport, the man on the bus, the child in the park. This is why.',
      read_time: '8 min read',
      content: `I have a confession to make. I am a thief. Not the dangerous kind — I have never stolen a car or a diamond necklace or someone's identity. I steal stories. Small, glittering, ordinary stories that people carry around with them without even realizing they are precious.

I have been doing this for about fifteen years now. It started accidentally. I was sitting in a café in London, waiting for a meeting that got cancelled, and I struck up a conversation with the woman sitting next to me. She was maybe seventy, with silver hair and hands that moved when she talked, as if her words needed physical gestures to find their way into the world.

She told me about her husband, who had died three years earlier. She told me about how she still set two cups of tea every morning, even though she only drank one. She told me about the way he used to sing off-key to the radio while doing the dishes, and how she used to pretend it bothered her but secretly loved it. She told me about the last thing he said to her, which was "don't forget to water the roses," and how she had been watering them every single day since, even though she hated gardening.

When she finished, she looked at me and said, "I don't know why I told you all that. I have never told anyone that before." And I said, "Because sometimes the people we need to tell things to are the ones who have no stake in the story. The ones who will just listen."

That conversation changed my life. Not in a dramatic, cinematic way. Not in a way that would make a good movie scene. It changed me in the quiet, persistent way that a river changes a stone — slowly, imperceptibly, but completely.

I went home that day and bought a small black notebook. And I started paying attention.

Not in a creepy, stalkerish way. I don't follow people around with a notebook, writing down their conversations. That would be weird, and also probably illegal. What I do is simpler. When I have a conversation with a stranger — a real conversation, not just "how are you" "fine" — I write down the parts that stay with me. The details that feel true.

Like the man on the bus who told me he had been a boxer in his youth, and that the hardest fight of his life was not any opponent in the ring but the battle to forgive his father. Or the little girl in the park who explained, with absolute seriousness, that her cat could understand quantum physics but chose not to because "cats have more important things to think about." Or the taxi driver who told me that the best advice he ever received was from his grandmother, who said "never make a decision when you are hungry, angry, lonely, or tired — because those are the four liars."

I have filled eleven notebooks so far. Eleven small, black, unremarkable notebooks that contain the most remarkable collection of human stories I have ever encountered. And every once in a while, when I am preparing for a role, I open one of those notebooks and I read. Not to find a character to play, but to remember what it feels like to be human.

Because here is the thing about acting: it is not about pretending to be someone else. It is about finding the part of yourself that understands who someone else is. It is about empathy — real, deep, uncomfortable empathy. The kind that makes you sit with a stranger on a bus and listen to their story about forgiveness, even though you have your own stop coming up and you are already late.

The notebook taught me that. The strangers taught me that. Every story I have collected is a tiny window into someone else's heart, and every time I look through that window, I learn something new about what it means to be alive.

I think about the woman in the café a lot. I wonder if she is still watering those roses. I wonder if she still sets two cups of tea every morning. I wonder if she knows that a conversation she had with a stranger in a London café fifteen years ago changed that stranger's entire approach to her craft.

I never told her. I never went back to that café. Some stories are meant to remain anonymous, meant to exist in that beautiful, liminal space between two people who connected briefly and then drifted apart. The story belongs to both of us now, but it belongs to neither of us exclusively.

That is what I love about stories. They are like seeds. You plant them in someone else's mind, and you never know what will grow. The woman in the café planted a seed in me that day, and it grew into a practice, a ritual, a way of being in the world that has made me a better actor, a better listener, and a better human.

So if you see me sitting in a café sometime, scribbling in a small black notebook, don't worry. I am not writing down your conversation. I am just collecting stories. And if we talk long enough, and if you say something that feels true, I might write it down. Not to use it, not to share it, but to remember it. To carry it with me. To let it change me in that quiet, persistent way that a river changes a stone.

> "We are, as a species, addicted to story. Even when the body goes to sleep, the mind stays up all night, telling itself stories." — Jonathan Gottschall

And I am addicted to the stories of strangers. They are the most beautiful stories of all.`
    },
    {
      id: 'journal-6',
      title: 'On Motherhood, Mess, and the Myth of Having It All Together',
      category: 'PERSONAL',
      date: 'January 15, 2024',
      image: '/src/assets/images/gillian_mentoring_warmth_1783349719383.jpg',
      excerpt: 'People think because I play strong, composed women on screen, I must have it all figured out in real life. Let me tell you about the time I showed up to school drop-off wearing two different shoes.',
      read_time: '9 min read',
      content: `I want to tell you a story about shoes. Not the glamorous kind of shoe story — not red carpet Louboutins or custom-made stage boots. This is a story about the morning I showed up to my daughter's school wearing two completely different shoes.

It was a Tuesday. I remember it was a Tuesday because Tuesdays were always the worst. Mondays have the excuse of being Mondays. Wednesdays have the comfort of being halfway through. But Tuesdays — Tuesdays are just relentlessly, unapologetically ordinary. No excuse. No comfort. Just you, standing in the middle of the week, trying to hold everything together.

I had been up until three in the morning the night before, learning lines for a new project. My son had a science project due that he had "definitely, absolutely, one hundred percent finished" (he had not). My daughter had a music recital that evening and needed a specific outfit that I was "definitely, absolutely, one hundred percent" going to remember to pick up from the dry cleaners (I did not). And somewhere between the midnight panic about the science project and the two AM panic about the lines, I had managed to get approximately four hours of sleep.

So there I was, standing in front of the school, watching my daughter walk through the doors, when a mother I vaguely recognized from a PTA meeting looked down at my feet and said, with the particular brand of cheerful horror that only other mothers can muster, "Oh honey. You're wearing two different shoes."

I looked down. She was right. On my left foot, a black boot. On my right foot, a brown loafer. Not similar shoes in different colors. Completely different shoes. Different styles, different heights, different everything. I had somehow managed to get dressed, make breakfast, pack lunches, drive across town, and walk into a schoolyard all while wearing what could only be described as the world's most fashion-forward statement about the impossibility of perfection.

And you know what? I laughed. Not a polite, composed, "oh how silly of me" laugh. A real, deep, belly laugh. The kind of laugh that comes from the realization that you have been trying so hard to hold everything together that you forgot the most basic thing: you are human. And humans wear two different shoes sometimes. And that is okay.

I think about that morning a lot. I think about the pressure we put on ourselves — especially as mothers, especially as women in the public eye — to have everything figured out. To be the perfect parent, the perfect professional, the perfect partner, the perfect version of ourselves at all times. To never forget the dry cleaners. To never show up with two different shoes.

But here is what I have learned, after years of trying to be perfect and failing spectacularly: perfection is not the goal. Presence is. My kids don't remember whether I wore matching shoes. They remember that I showed up. They remember that I was there at the recital, even if I was ten minutes late and still wearing one boot and one loafer. They remember that I laughed about it instead of crying. They remember that I was human.

And honestly? Those are the moments I remember too. Not the ones where everything went according plan. Not the ones where I nailed every line and hit every mark and had everything figured out. The messy ones. The ones where I showed up exhausted and confused and wearing two different shoes, but I showed up anyway.

Because that is what motherhood is. That is what life is. It is not a performance where you get to rehearse and perfect and present a flawless version of yourself. It is a live show. It is happening right now, in real time, with no safety net and no second takes. And the only way to do it well is to do it honestly.

I think about the characters I have played — Scully, Stella Gibson, Jean Milburn, Margaret Thatcher — and I think about how they all share one thing in common: they are all, in their own way, trying to hold it together. Scully is trying to maintain her scientific rigor in a world of chaos. Stella is trying to maintain her composure in a world of violence. Jean is trying to maintain her warmth in a world of judgment. Thatcher is trying to maintain her power in a world that wants to diminish her.

And I think about how the most powerful moments in all of those performances are not the ones where they succeed. They are the ones where they fail. The moments where they crack. The moments where they let the mask slip and reveal the human being underneath. Those are the moments that audiences connect with. Those are the moments that feel true.

Because truth is not perfection. Truth is the mess. Truth is the two different shoes. Truth is the three AM panic about the science project and the forgotten dry cleaning and the lines you cannot quite remember. Truth is showing up, exhausted and imperfect, and saying "I am here. I am trying. I am human."

So if you are reading this and you are having a Tuesday — a relentlessly, unapologetically ordinary Tuesday where nothing is going according to plan and you are pretty sure you are wearing two different shoes — take a deep breath. Laugh about it. Show up anyway. Because that is the bravest, most beautiful thing you can do.

> "There is no way to be a perfect mother, but a million ways to be a good one." — Jill Churchill

And sometimes those ways involve wearing mismatched shoes to school drop-off. Trust me on this one.`
    },
    {
      id: 'journal-7',
      title: 'The Strange, Beautiful World of Voice Acting in Your Pajamas',
      category: 'BEHIND THE SCENES',
      date: 'December 5, 2023',
      image: '/src/assets/images/gillian_studio_portrait_1783349751129.jpg',
      excerpt: 'Most people think acting is all about what you look like. But some of my favorite work has been done in a recording booth, in my pajamas, where nobody can see me at all.',
      read_time: '6 min read',
      content: `Here is a secret that nobody tells you about voice acting: it is the most liberating, terrifying, and profoundly weird thing you will ever do as an actor.

When you act on camera, you have tools. You have your face, your body, your gestures, your wardrobe. You can communicate an entire emotional arc with a single glance, a raised eyebrow, a slight tilt of the head. When you voice act, you have none of that. You have a microphone, a pair of headphones, and a small, soundproof booth that smells vaguely of old coffee and desperation.

I did my first voice acting gig about eight years ago. It was for an animated film — I won't say which one, because the contract probably still has some kind of secrecy clause — and I showed up to the recording studio expecting it to be easy. I mean, how hard could it be? You just read the lines into a microphone, right?

Wrong. So spectacularly, hilariously wrong.

The director — a lovely, patient woman who clearly had experience with actors who underestimated the difficulty of voice work — gently explained that I needed to "find the character's physicality without using my body." I stared at her. She stared at me. She said, "Imagine the character is doing something specific while speaking. Are they running? Are they sitting? Are they jumping? Let that physical action come through in your voice."

So I tried. I stood in the booth, script in hand, and I tried to "find the physicality." I bounced on my toes to simulate running. I sat down on a stool to simulate sitting. I jumped up and down to simulate jumping. The sound engineer watched me through the glass with the particular expression of someone who is questioning all their life choices.

And then something clicked. When I bounced on my toes, my voice got lighter, more breathless. When I sat, my voice got grounded, more measured. When I jumped, my voice got higher, more excited. The physical action was coming through in my voice, just as the director had said. I just had to trust it.

That was the day I learned that voice acting is not about what you look like. It is about what you feel. It is about stripping away every external tool you have — your face, your body, your wardrobe — and relying entirely on the one thing that is left: your voice. Your raw, unadorned, honest voice.

And here is the beautiful irony: when you strip away all those external tools, you often find that your performance is more honest, more vulnerable, more real than it has ever been. Because there is nowhere to hide. You cannot hide behind a clever costume or a dramatic lighting setup or a perfectly composed close-up. It is just you and the microphone and the truth.

I have done quite a bit of voice work since then. Audiobooks, animated films, video games, even a few commercials. And every time I step into that booth, I feel the same strange mix of liberation and terror. Liberation because I am free from the physical constraints of on-camera acting. Terror because I am free from the physical constraints of on-camera acting.

But the thing I love most about voice acting is the pajama factor. Yes, the pajama factor. Because when you do voice work, nobody cares what you are wearing. You can show up in your most comfortable, most ridiculous, most "I have given up on looking like a functioning member of society" outfit, and nobody will judge you. In fact, I would argue that the more comfortable you are, the better you perform. There is something about being wrapped in a soft hoodie and fuzzy socks that makes your voice warmer, more relaxed, more human.

I once did an entire audiobook recording wearing a bathrobe and slippers. Nobody cared. The sound engineer didn't care. The director didn't care. The only person who cared was me, because I was having the time of my life. There is a special kind of joy in creating something beautiful while looking absolutely ridiculous. It is the ultimate freedom.

So if you have ever thought about trying voice acting, let me give you this advice: forget about what you look like. Forget about your hair, your makeup, your outfit. Focus on what you feel. Focus on the character's truth. And for the love of everything holy, wear the most comfortable clothes you own. You deserve it.

> "The voice is the muscle of the soul." — Joan Sutherland

And sometimes that muscle performs best in pajamas. Trust me. I have the bathrobe to prove it.`
    },
    {
      id: 'journal-8',
      title: 'A Love Letter to the Fans Who Changed My Life',
      category: 'JOURNAL',
      date: 'November 20, 2023',
      image: '/src/assets/images/gillian_hero_one_1783349664739.jpg',
      excerpt: 'I have received thousands of letters over the years. Some made me laugh, some made me cry, and one made me pull over on the side of the road because I could not see through the tears. This is that story.',
      read_time: '8 min read',
      content: `I want to tell you about a letter I received about ten years ago. I was driving through the English countryside — one of those perfect autumn afternoons where the leaves are on fire and the light is golden and everything feels like a painting — when I decided to pull over and read some fan mail that had been sitting in my bag for a week.

I am terrible about reading fan mail promptly. Not because I don't care — I care deeply, more than most people realize — but because reading fan mail requires a specific kind of emotional presence. You cannot skim it. You cannot read it while multitasking. Every letter deserves to be read fully, completely, with the kind of attention you would give to a friend sharing something important.

So I pulled over at a small lay-by overlooking a valley, made myself a cup of tea from the thermos I always carry (yes, I carry a thermos of tea everywhere, I am that British), and started reading.

Most of the letters were beautiful, as fan letters always are. People telling me that Scully inspired them to become scientists. People telling me that Jean Milburn helped them have conversations with their daughters they never would have had otherwise. People telling me that watching The Fall made them feel seen in a way they hadn't expected. Each letter was a small gift, a tiny window into someone else's life.

And then I opened one that stopped me cold.

It was from a young woman — she was nineteen — and she wrote that she had been diagnosed with a rare form of cancer two years earlier. She wrote about the fear, the treatment, the isolation, the way her world had shrunk to the size of a hospital room. She wrote about how, during her chemotherapy sessions, she would watch The X-Files on her laptop, and how Dana Scully had become a kind of companion to her during those long, frightening hours.

But here is the part that broke me. She wrote that Scully had taught her how to be brave. Not the loud, dramatic kind of bravery. The quiet kind. The kind where you wake up every morning and choose to face another day even though you are terrified. The kind where you maintain your dignity and your humor and your curiosity even when your body is failing you. The kind where you trust the science, trust the process, trust that the truth will emerge even when everything feels dark and uncertain.

She wrote: "Scully taught me that being scared and being brave are not opposites. They are the same thing. You can be terrified and still show up. You can be falling apart and still hold it together. You can be losing everything and still find something worth fighting for."

And then she wrote: "I am writing this letter from my hospital bed, three days after my last chemotherapy session. The doctors say the treatment worked. I am going to be okay. And I wanted you to know that part of the reason I am going to be okay is because of a fictional FBI agent who taught me how to fight."

I sat in that car, in that lay-by, overlooking that valley, and I cried. Not the dignified, single-tear-rolling-down-the-cheek kind of crying. The ugly, messy, can't-breathe kind of crying. The kind where you have to put your head on the steering wheel because your body simply cannot contain the emotion.

Because here is what I never understood about The Scully Effect. I thought it was about inspiring women to go into STEM. And it is — the studies confirm that, the statistics prove it. But it is about so much more than that. It is about showing people that they are not alone. That someone understands. That a character — a fictional character, a collection of words on a page and decisions made by writers and directors — can reach through the screen and say "I see you. I understand. You can do this."

That letter changed me. It changed the way I think about my work. It changed the way I think about the responsibility of being a public figure. It changed the way I think about the relationship between an actor and the people who watch them.

Because it is not a one-way street. It is not me performing and you watching. It is a conversation. It is an exchange. Every time I play a character, I am giving something of myself to you. And every time you watch, every time you connect, every time you write a letter and tell me what it meant to you, you are giving something back. You are telling me that my work matters. That my choices matter. That the characters I bring to life have touched something real inside you.

And there is no greater honor than that.

I still have that letter. It is in a box in my closet, along with a few other letters that have meant something special to me over the years. I don't read them often, but I know they are there. And when I am having a difficult day, when I am questioning my choices, when I am wondering whether any of this matters, I open that box and I remember.

I remember that a young woman in a hospital bed found the courage to fight because of a character I played. I remember that somewhere in the world, a girl is studying science because of Dana Scully. I remember that somewhere, a mother is having a conversation with her daughter because of Jean Milburn. I remember that somewhere, a woman is standing up for herself because of Stella Gibson.

And I remember that this is why I do what I do. Not for the awards, not for the recognition, not for the red carpets and the magazine covers. For the letters. For the conversations. For the quiet, profound, life-changing connection between a performer and the people who watch.

> "We are all made stronger by the stories we share, the truths we speak, and the connections we refuse to let go."

Thank you for writing to me. Thank you for watching. Thank you for being the other half of this conversation. I hear you. I see you. And I am endlessly, profoundly grateful for every single one of you.`
    }
  ];

  const { data, error } = await supabase.from('journal_entries').insert(entries);
  if (error) {
    console.error('Error inserting journal entries:', error.message, error.details);
  } else {
    console.log(`Inserted ${entries.length} new journal entries`);
  }
}

seedJournal().catch(console.error);
