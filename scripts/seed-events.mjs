import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const events = [
  { id: 'event-1', day: '05', month: 'JAN', title: 'New Year Digital Conclave with Gillian', location: 'Virtual Event', time: '3:00 PM GMT', description: 'Kick off the new year with an intimate digital gathering. Gillian shares her reflections on the past year and her hopes for the coming season in a candid live conversation.' },
  { id: 'event-2', day: '12', month: 'JAN', title: 'Behind the Scenes: West End Revival Talk', location: 'London, UK', time: '6:30 PM GMT', description: 'An exclusive behind-the-scenes discussion about the creative process of bringing a classic play to the modern stage. Featuring never-before-seen rehearsal footage.' },
  { id: 'event-3', day: '19', month: 'JAN', title: 'Young Mentors Fundraiser Brunch', location: 'New York, USA', time: '11:00 AM EST', description: 'A private brunch gathering to support youth mentoring initiatives. All proceeds benefit mentorship programs for underserved communities.' },
  { id: 'event-4', day: '02', month: 'FEB', title: 'The Scully Effect: Women in STEM Panel', location: 'Washington DC, USA', time: '2:00 PM EST', description: 'A commemorative panel discussion celebrating the lasting impact of Dana Scully on women in science and technology fields worldwide.' },
  { id: 'event-5', day: '10', month: 'FEB', title: 'Signed Bookplate Event: Want', location: 'London, UK', time: '5:00 PM GMT', description: "A special book signing event for Gillian's groundbreaking collection Want. Each copy includes a personal inscription and exclusive bookmark." },
  { id: 'event-6', day: '18', month: 'FEB', title: 'Co-op Member Live Q&A Session', location: 'Virtual Event', time: '7:00 PM GMT', description: 'An open-floor digital question and answer session exclusively for registered Co-op community members. Submit your questions in advance.' },
  { id: 'event-7', day: '25', month: 'FEB', title: 'SAYes Mentorship Charity Gala', location: 'Cape Town, South Africa', time: '7:00 PM SAST', description: 'The annual flagship fundraising gala for SAYes, featuring live performances, guest speakers, and a silent auction benefitting youth mentorship.' },
  { id: 'event-8', day: '04', month: 'MAR', title: 'Women in Film: Exclusive Screening & Talk', location: 'Los Angeles, USA', time: '7:30 PM PST', description: "An intimate screening of a landmark film followed by a moderated discussion on women's evolving roles in cinema and production." },
  { id: 'event-9', day: '12', month: 'MAR', title: 'Literary Salon: Reading from Want', location: 'Paris, France', time: '6:00 PM CET', description: 'An evening of selected readings from Want, followed by a moderated audience Q&A in the historic setting of a Parisian literary salon.' },
  { id: 'event-10', day: '20', month: 'MAR', title: 'Neurofibromatosis Awareness Campaign', location: 'Virtual Event', time: '4:00 PM GMT', description: 'A charity livestream dedicated to raising awareness and funds for Neurofibromatosis research. Featuring special guest speakers and medical experts.' },
  { id: 'event-11', day: '28', month: 'MAR', title: 'X-Files 33rd Anniversary Celebration', location: 'Vancouver, Canada', time: '6:00 PM PST', description: 'Celebrate three decades of The X-Files with a special retrospective screening, behind-the-scenes stories, and a live conversation with Gillian.' },
  { id: 'event-12', day: '05', month: 'APR', title: 'Spring Digital Member Meetup', location: 'Virtual Event', time: '3:00 PM BST', description: 'A relaxed spring gathering for official community members to connect, share fan stories, and hear exclusive updates from Gillian.' },
  { id: 'event-13', day: '12', month: 'APR', title: 'Theatre Masterclass: Stage Craft Intensive', location: 'Stratford-upon-Avon, UK', time: '10:00 AM BST', description: "An intensive masterclass on classical stage performance techniques, hosted at one of the UK's most prestigious theatrical venues." },
  { id: 'event-14', day: '20', month: 'APR', title: 'Earth Day Charity Livestream', location: 'Virtual Event', time: '5:00 PM BST', description: 'Join Gillian for a special Earth Day broadcast discussing environmental advocacy, sustainable fashion, and how fans can make a difference.' },
  { id: 'event-15', day: '28', month: 'APR', title: 'G-Spot Wellness Popup Experience', location: 'London, UK', time: '12:00 PM BST', description: 'An immersive popup experience showcasing the full G-Spot functional drink range, with wellness workshops, tastings, and a live meet-and-greet.' },
  { id: 'event-16', day: '06', month: 'MAY', title: 'Mental Health Awareness Week Panel', location: 'Virtual Event', time: '6:00 PM BST', description: 'An important conversation about mental health, resilience, and the power of community support in partnership with leading mental health charities.' },
  { id: 'event-17', day: '14', month: 'MAY', title: 'Exclusive Film Premiere: TBA', location: 'Cannes, France', time: '8:00 PM CET', description: 'Gillian walks the red carpet at a highly anticipated film premiere. Limited VIP tickets include access to the after-party and reception.' },
  { id: 'event-18', day: '22', month: 'MAY', title: 'Co-op Creative Writing Workshop', location: 'Virtual Event', time: '4:00 PM BST', description: 'A guided creative writing workshop exploring themes of identity, belonging, and transformation. Open to all Co-op members.' },
  { id: 'event-19', day: '30', month: 'MAY', title: 'London Theatre Gala Night', location: 'London, UK', time: '7:00 PM BST', description: 'A glamorous evening of theatre, dinner, and conversation, celebrating the best of British stage performance and philanthropy.' },
  { id: 'event-20', day: '08', month: 'JUN', title: 'Pride Month Solidarity Broadcast', location: 'Virtual Event', time: '5:00 PM BST', description: 'A special Pride Month livestream celebrating LGBTQ+ voices in the arts, with readings, performances, and an open community dialogue.' },
  { id: 'event-21', day: '15', month: 'JUN', title: 'Book Club: Want Discussion Group', location: 'Virtual Event', time: '7:00 PM BST', description: 'An intimate virtual book club gathering for readers of Want to share interpretations, favorite passages, and personal reflections.' },
  { id: 'event-22', day: '22', month: 'JUN', title: 'Summer Solstice Meditation Session', location: 'Virtual Event', time: '6:00 AM BST', description: 'A guided morning meditation and mindfulness session led by Gillian to mark the summer solstice and embrace the new season.' },
  { id: 'event-23', day: '30', month: 'JUN', title: 'Young Filmmakers Showcase', location: 'Los Angeles, USA', time: '2:00 PM PST', description: 'A showcase of short films by emerging young directors, followed by a mentoring roundtable with industry professionals.' },
  { id: 'event-24', day: '10', month: 'JUL', title: 'Intimate Acoustic Evening with Guests', location: 'Dublin, Ireland', time: '7:30 PM IST', description: 'A rare evening of live music, spoken word, and conversation featuring Gillian and special guest artists in an intimate venue.' },
  { id: 'event-25', day: '18', month: 'JUL', title: 'Archive Deep Dive: Costume Exhibit', location: 'London, UK', time: '11:00 AM BST', description: "An exclusive curator-led tour of a private archive exhibition showcasing iconic costume pieces from Gillian's most memorable roles." },
  { id: 'event-26', day: '28', month: 'JUL', title: 'Live Q&A with Gillian', location: 'Virtual Event', time: '4:00 PM GMT', description: 'An exclusive digital gathering for official community members. Gillian will sit down to answer submitted questions directly in an intimate, live-streamed conversation.' },
  { id: 'event-27', day: '08', month: 'AUG', title: 'Summer Book Signing Tour: London', location: 'London, UK', time: '2:00 PM BST', description: "Part of the summer signing tour. Each ticket includes a signed copy of Want and a personal dedication from Gillian." },
  { id: 'event-28', day: '15', month: 'AUG', title: 'The X-Files 30th Anniversary Retrospective', location: 'London, UK', time: '7:00 PM GMT', description: 'A special commemorative panel and screening event, followed by a live discussion with Gillian Anderson, creators, and surprise guest stars.' },
  { id: 'event-29', day: '22', month: 'AUG', title: 'Co-op Community Picnic', location: 'Hyde Park, London', time: '12:00 PM BST', description: 'A casual outdoor gathering for official Co-op members and their families. Picnic blankets, games, and an opportunity to connect with fellow fans.' },
  { id: 'event-30', day: '05', month: 'SEP', title: 'Autumn Philanthropy Planning Summit', location: 'Virtual Event', time: '3:00 PM BST', description: "A strategic meeting to plan the upcoming season's charitable initiatives and community outreach programs with Co-op leadership." },
];

async function seed() {
  console.log('Clearing existing events...');
  const { error: delErr } = await supabase.from('upcoming_events').delete().neq('id', 'none');
  if (delErr) { console.error('Delete error:', delErr); process.exit(1); }

  console.log(`Inserting ${events.length} events...`);
  const { error } = await supabase.from('upcoming_events').insert(events);
  if (error) { console.error('Insert error:', error); process.exit(1); }

  console.log('Successfully seeded 30 events!');
  process.exit(0);
}

seed();
