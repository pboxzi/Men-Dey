import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env manually
const envFile = readFileSync(resolve(import.meta.dirname, '../.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)="?(.+?)"?\s*$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function seedFilms() {
  const films = [
    {
      title: 'The House of Mirth',
      role: 'Lily Bart',
      year: '2000',
      tagline: 'A woman destroyed by the very society she was born to conquer.',
      revenue: 'BAFTA Nominated Adaptation',
      trivia: 'Gillian delivered a devastating portrayal of Edith Wharton\'s tragic heroine Lily Bart, a beautiful socialite destroyed by the rigid class system of 1900s New York. Director Terence Davies hand-picked her for the role.',
      icon: '🏛️',
      stunt_detail: 'Mastered period-appropriate etiquette, restrained physicality, and the slow psychological deterioration of a woman losing her grip on high society.',
      sort_order: 6
    },
    {
      title: 'Hannibal',
      role: 'Clarice Starling',
      year: '2013 - 2015',
      tagline: 'Everyone is a monster to someone.',
      revenue: '39 Episodes, Critically Acclaimed',
      trivia: 'Gillian took on the iconic role of Clarice Starling in NBC\'s Hannibal, previously played by Jodie Foster and Julianne Moore. Her portrayal brought a fresh, darker vulnerability to the character across three seasons.',
      icon: '🩸',
      stunt_detail: 'Navigated complex psychological cat-and-mouse dialogue, FBI behavioral analysis jargon, and intense emotional scenes opposite Mads Mikkelsen.',
      sort_order: 7
    },
    {
      title: 'Crash',
      role: 'Elizabeth',
      year: '2004',
      tagline: 'We crash into each other and then we pretend we\'re invisible.',
      revenue: 'Academy Award for Best Picture',
      trivia: 'Gillian appeared alongside Sandra Bullock and Don Cheadle in David Cronenberg\'s exploration of racial and social tensions in Los Angeles. The film won Best Picture at the 78th Academy Awards.',
      icon: '💥',
      stunt_detail: 'Delivered restrained, emotionally raw performance dealing with themes of racial profiling and social fragmentation.',
      sort_order: 8
    },
    {
      title: 'The Great',
      role: 'Joanna',
      year: '2021',
      tagline: 'An occasionally true story about the rise of Catherine the Great.',
      revenue: 'Hulu Critical Darling',
      trivia: 'Gillian appeared in the critically acclaimed Hulu satirical drama as Joanna, adding her trademark gravitas to the show\'s irreverent take on Russian history.',
      icon: '👑',
      stunt_detail: 'Navigated the show\'s unique blend of anachronistic humor and period drama with deadpan precision.',
      sort_order: 9
    },
    {
      title: 'Robot Overlords',
      role: 'Kate Flynn',
      year: '2014',
      tagline: 'When the robots took over, humanity had to learn to hide.',
      revenue: 'British Sci-Fi Feature',
      trivia: 'Gillian starred in this British science fiction film about a world occupied by robot overlords, playing a mother fighting to protect her family in a post-invasion England.',
      icon: '🤖',
      stunt_detail: 'Balanced maternal fierce protective instincts with the physical demands of a sci-fi action setting.',
      sort_order: 10
    },
    {
      title: 'Johnny English Reborn',
      role: 'Agent Pamela Thornton',
      year: '2011',
      tagline: 'The only agent who can save the world... accidentally.',
      revenue: 'Global Box Office Hit',
      trivia: 'Gillian played the villainous Agent Pamela Thornton opposite Rowan Atkinson\'s bumbling spy, bringing genuine menace and glamour to the comedy franchise.',
      icon: '🕵️',
      stunt_detail: 'Maintained a perfectly straight face while opposite Rowan Atkinson\'s physical comedy. Mastered the art of looking dangerous while being hilarious by association.',
      sort_order: 11
    },
    {
      title: 'A Streetcar Named Desire',
      role: 'Blanche DuBois',
      year: '2014 - 2016',
      tagline: 'I don\'t want realism. I want magic!',
      revenue: 'Olivier Award Nominated',
      trivia: 'Gillian\'s devastating portrayal at the Young Vic and Brooklyn\'s St. Ann\'s Warehouse was called "the performance of the decade" by The Guardian. She performed three-hour shows on a revolving stage.',
      icon: '🎭',
      stunt_detail: 'Delivered emotionally shattering, physically exhausting 3-hour live performances on a revolving stage with raw vulnerability.',
      sort_order: 12
    }
  ];

  const { data, error } = await supabase.from('films_data').insert(films);
  if (error) {
    console.error('Error inserting films:', error.message);
  } else {
    console.log(`Inserted ${films.length} new films`);
  }
}

async function seedKindness() {
  const entries = [
    {
      title: 'Supporting Afghan Women\'s Education',
      category: 'charity',
      description: 'Gillian publicly advocated for Afghan women\'s right to education during the Taliban takeover in 2021, using her platform to raise awareness and funds for underground schools.',
      quote: 'Every girl deserves the right to learn. We cannot be silent while that right is being stripped away.',
      sort_order: 7
    },
    {
      title: 'Climate Revolution Campaigner',
      category: 'charity',
      description: 'Gillian has been an active supporter of Vivienne Westwood\'s Climate Revolution, attending rallies and using her public appearances to draw attention to climate justice.',
      quote: 'Climate change is the greatest injustice of our time. It affects the most vulnerable first and worst.',
      sort_order: 8
    },
    {
      title: 'Testified Before US Congress for NF Research',
      category: 'charity',
      description: 'Inspired by her late brother Aaron who lived with Neurofibromatosis, Gillian testified before the United States Congress to advocate for federal funding for NF research.',
      quote: 'My brother Aaron\'s courage inspired me to use my voice. We must find a cure for NF and support these brave families.',
      sort_order: 9
    },
    {
      title: 'UN Women HeForShe Champion',
      category: 'stunts',
      description: 'Gillian has been a vocal supporter of UN Women\'s HeForShe campaign, which invites men and boys to join the fight for gender equality.',
      quote: 'Gender equality is not a women\'s issue. It\'s a human issue. It affects us all.',
      sort_order: 10
    }
  ];

  const { data, error } = await supabase.from('kindness_log').insert(entries);
  if (error) {
    console.error('Error inserting kindness:', error.message);
  } else {
    console.log(`Inserted ${entries.length} new kindness entries`);
  }
}

async function seedQuiz() {
  const questions = [
    {
      question: 'In what year did Gillian Anderson first appear as Dana Scully on The X-Files?',
      options: ['1991', '1993', '1995', '1997'],
      correct: 1,
      explanation: 'The X-Files premiered on September 10, 1993, with Gillian Anderson as FBI Special Agent Dana Scully. She was just 24 years old when she was cast.'
    },
    {
      question: 'What prestigious theater role did Gillian Anderson play at the Young Vic in London?',
      options: ['Lady Macbeth', 'Blanche DuBois', 'Nora Helmer', 'Queen Elizabeth'],
      correct: 1,
      explanation: 'Gillian played Blanche DuBois in A Streetcar Named Desire at the Young Vic (2014), earning an Olivier Award nomination. The Guardian called it "the performance of the decade."'
    },
    {
      question: 'Which sci-fi trilogy did Gillian Anderson co-author with Jeff Rovin?',
      options: ['The Hunger Games', 'EarthEnd Saga', 'Divergent', 'Maze Runner'],
      correct: 1,
      explanation: 'The EarthEnd Saga consists of A Vision of Fire (2013), A Dream of Ice (2015), and The Sound of Seas (2016), co-authored with Jeff Rovin.'
    },
    {
      question: 'What award did Gillian Anderson win for her portrayal of Margaret Thatcher in The Crown?',
      options: ['BAFTA only', 'SAG Award only', 'Emmy and Golden Globe', 'Oscar and Golden Globe'],
      correct: 2,
      explanation: 'Gillian won both the Primetime Emmy Award and the Golden Globe Award for Best Actress in a Supporting Role for her portrayal of Margaret Thatcher in The Crown (2021).'
    },
    {
      question: 'What is the name of Gillian Anderson\'s curated book about female desire?',
      options: ['We: A Manifesto', 'Desire Letters', 'Want', 'Her Voice'],
      correct: 2,
      explanation: 'Want (2024) is a groundbreaking collection of anonymous letters from women around the world mapping out the intricate, unfiltered landscapes of modern female desire.'
    }
  ];

  const { data, error } = await supabase.from('quiz_questions').insert(questions);
  if (error) {
    console.error('Error inserting quiz:', error.message);
  } else {
    console.log(`Inserted ${questions.length} new quiz questions`);
  }
}

async function main() {
  console.log('Seeding About section data...\n');
  await seedFilms();
  await seedKindness();
  await seedQuiz();
  console.log('\nDone!');
}

main().catch(console.error);
