import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import userModel from '../src/models/user.model.js';
import blogModel from '../src/models/blog.model.js';
import newsModel from '../src/models/news.model.js';
import testSeriesTopicModel from '../src/models/testSeriesTopic.model.js';
import testSeriesSubjectModel from '../src/models/testSeriesSubject.model.js';
import testSeriesChapterModel from '../src/models/testSeriesChapter.model.js';
import testModel from '../src/models/test.model.js';
import questionModel from '../src/models/question.model.js';
import siteContentModel from '../src/models/siteContent.model.js';
import { DEFAULT_SITE_CONTENT } from '../src/modules/admin/admin.service.js';
import { hashPassword } from '../src/shared/utils/bcrypt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_USERS = [
  {
    name: 'Super Admin',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
    isApproved: true,
    isProfileComplete: true,
  },
  {
    name: 'Default Student',
    email: 'student@example.com',
    password: 'Student@123',
    role: 'student',
    isApproved: true,
    isProfileComplete: true,
  },
];

const DEFAULT_BLOGS = [
  {
    title: "Top 10 GPAT Preparation Tips From Toppers",
    content:
      "<h2>Plan smart, not long</h2>" +
      "<p>The first lesson every GPAT topper learns is that <strong>quality beats quantity</strong>. Build a 90-day plan, alternate revision and practice, and reserve the last two weeks for full-length mocks.</p>" +
      "<h3>What to focus on</h3>" +
      "<ul>" +
      "<li>Pharmacology &amp; Medicinal Chemistry — highest weightage</li>" +
      "<li>Pharmaceutics &amp; Pharmaceutical Analysis — score multipliers</li>" +
      "<li>Pharmacognosy — easy points if revised consistently</li>" +
      "</ul>" +
      "<p>Pair every chapter with a topic-wise mock from your test series and track your accuracy weekly.</p>",
    published: true,
  },
  {
    title: "Choosing Your Career Path In Clinical Pharmacy",
    content:
      "<p>Clinical pharmacy is one of the fastest-growing specializations in India. Hospitals, research institutions, and digital-health startups all hire trained clinical pharmacists.</p>" +
      "<h3>Three roles worth knowing</h3>" +
      "<ol>" +
      "<li><strong>Hospital Clinical Pharmacist</strong> — direct patient care, drug-utilization review.</li>" +
      "<li><strong>Pharmacovigilance Officer</strong> — adverse-event monitoring for pharma companies.</li>" +
      "<li><strong>Medical Affairs Associate</strong> — bridge between R&amp;D and prescribers.</li>" +
      "</ol>" +
      "<p>Pick one direction early and tailor your electives, internships, and projects accordingly.</p>",
    published: true,
  },
  {
    title: "Understanding Drug-Drug Interactions In Practice",
    content:
      "<p>Drug-drug interactions (DDIs) are one of the most common reasons for adverse drug events. As a pharmacist, you are the last line of defence.</p>" +
      "<blockquote>Always cross-check CYP-inducer / CYP-inhibitor combinations before dispensing.</blockquote>" +
      "<h3>Quick checklist</h3>" +
      "<ul>" +
      "<li>Use a <em>standardised</em> interaction database — not just memory.</li>" +
      "<li>Flag any combination of more than 4 chronic medications.</li>" +
      "<li>Counsel the patient on timing — sometimes a 2-hour gap is enough.</li>" +
      "</ul>",
    published: true,
  },
  {
    title: "How To Crack NIPER JEE — A 12-Week Roadmap",
    content:
      "<p>NIPER JEE rewards depth in a few core subjects. This 12-week plan is the framework many of our students have used.</p>" +
      "<h3>Week-by-week</h3>" +
      "<ul>" +
      "<li><strong>Weeks 1–4:</strong> Pharmacology + Med Chem fundamentals.</li>" +
      "<li><strong>Weeks 5–8:</strong> Pharmaceutics, Analysis, and Biotech.</li>" +
      "<li><strong>Weeks 9–10:</strong> Topic-wise mocks; identify weakest 3 chapters.</li>" +
      "<li><strong>Weeks 11–12:</strong> Full-length mocks every alternate day.</li>" +
      "</ul>" +
      "<p>Use the test series analytics to track which chapter consumes the most of your time and the lowest accuracy — that&apos;s where you revise.</p>",
    published: true,
  },
  {
    title: "Pharmaceutical Jurisprudence — What Actually Gets Asked",
    content:
      "<p>Jurisprudence is often dismissed as &quot;boring memorisation&quot; — but exam papers consistently pull from a small core of acts and schedules.</p>" +
      "<h3>The high-yield list</h3>" +
      "<ul>" +
      "<li>Drugs &amp; Cosmetics Act, 1940 — schedules H, H1, X.</li>" +
      "<li>Pharmacy Act, 1948.</li>" +
      "<li>NDPS Act, 1985 — definitions &amp; punishments.</li>" +
      "<li>Drugs &amp; Magic Remedies Act.</li>" +
      "</ul>" +
      "<p>Memorise definitions verbatim — the examiner often tests exact wording.</p>",
    published: true,
  },
  {
    title: "Why Mock Test Analytics Matter More Than Mock Test Scores",
    content:
      "<p>Most students chase higher mock scores. Toppers chase <strong>better analytics</strong>.</p>" +
      "<p>What matters isn&apos;t whether you scored 120 or 130 today — it&apos;s whether your accuracy in your weakest subject went from 55% to 65% across the last three mocks. That&apos;s the trend that predicts your final result.</p>" +
      "<h3>Three numbers to watch</h3>" +
      "<ol>" +
      "<li>Per-subject accuracy trend (3-mock rolling average).</li>" +
      "<li>Average time per question on your weakest topic.</li>" +
      "<li>Negative-marking ratio — silly mistakes vs. genuine guesses.</li>" +
      "</ol>",
    published: true,
  },
  {
    title: "Five Mistakes Every GPAT Candidate Makes In Their First Mock",
    content:
      "<p>Almost every first-time GPAT mock-taker falls into the same five traps. Awareness of them turns a 60% score into an 80% score — without learning a single new topic.</p>" +
      "<h3>The five</h3>" +
      "<ol>" +
      "<li><strong>Spending 2× too long on calculations.</strong> Set a hard 90-second cap per question and move on.</li>" +
      "<li><strong>Reading the question once.</strong> NIPER and GPAT love double negatives — read every stem twice.</li>" +
      "<li><strong>Ignoring units.</strong> A wrong unit choice is the most common silly mistake in pharmacokinetic problems.</li>" +
      "<li><strong>Skipping easy questions.</strong> Always do an easy first pass before tackling harder items.</li>" +
      "<li><strong>Not reviewing the solution.</strong> Half your learning happens during the post-mock review.</li>" +
      "</ol>",
    published: true,
  },
  {
    title: "Pharmacokinetics In 10 Minutes — A Cheat-Sheet",
    content:
      "<p>You can memorise the entire core of pharmacokinetics on a single page. Here it is.</p>" +
      "<h3>Core equations</h3>" +
      "<ul>" +
      "<li><strong>Vd = Dose / Plasma concentration</strong></li>" +
      "<li><strong>Clearance = k · Vd</strong> (where k is the elimination rate constant)</li>" +
      "<li><strong>Half-life t½ = 0.693 / k</strong></li>" +
      "<li><strong>Steady state ≈ 5 × t½</strong></li>" +
      "</ul>" +
      "<p>Drill these four until you can recite them without thinking — every other PK problem reduces to a combination of these.</p>",
    published: true,
  },
  {
    title: "How We Designed Our Topic-Wise Sectional Tests",
    content:
      "<p>Our topic-wise sectionals aren't just &quot;mini mocks.&quot; They're built around three principles that we've validated against 50,000+ student attempts.</p>" +
      "<h3>Principles</h3>" +
      "<ol>" +
      "<li><strong>Difficulty mirrors recent papers.</strong> 30% easy, 50% medium, 20% hard — matching the most recent 3 GPAT papers.</li>" +
      "<li><strong>Distractors come from real student errors.</strong> Wrong-answer choices are based on real wrong picks from past attempts.</li>" +
      "<li><strong>Each test is 25 questions.</strong> Long enough to test mastery, short enough to fit before bed.</li>" +
      "</ol>",
    published: true,
  },
  {
    title: "Should You Take NIPER JEE And GPAT In The Same Year?",
    content:
      "<p>Short answer: yes — but only if you've read this guide.</p>" +
      "<p>The two exams test overlapping content with a different emphasis. NIPER goes deeper into a smaller set of topics; GPAT spreads across a wider syllabus. If you've prepared for GPAT, NIPER is roughly 2 weeks of additional focused study.</p>" +
      "<h3>What's different</h3>" +
      "<ul>" +
      "<li>NIPER weights pharmaceutics, biotech, and analytical chemistry more heavily.</li>" +
      "<li>GPAT spreads attention across all subjects more evenly.</li>" +
      "<li>NIPER has fewer questions (200 vs 125) but each carries higher individual weight.</li>" +
      "</ul>",
    published: true,
  },
];

const DEFAULT_NEWS = [
  {
    title: "GPAT 2026 Application Window Now Open",
    content:
      "The National Testing Agency has opened the GPAT 2026 application window. Eligible candidates can apply online until 31 March. The exam will be conducted in 154 cities across India in computer-based mode.",
    published: true,
  },
  {
    title: "New State Board Pharmacist Test Series Launched",
    content:
      "We&apos;ve added a brand-new test series tailored to state-board pharmacist exams across Maharashtra, Karnataka, Tamil Nadu, and UP. 25+ full-length mocks plus chapter-wise sectional tests are live now.",
    published: true,
  },
  {
    title: "Free Live Doubt-Solving Sessions Every Sunday",
    content:
      "Premium subscribers can now join weekly live doubt-solving sessions every Sunday at 7 PM IST. Bring your toughest pharmacology and med-chem questions — our faculty will solve them on the spot.",
    published: true,
  },
  {
    title: "Mobile App Update: Offline Mode For Practice Tests",
    content:
      "The latest mobile app release lets you download any practice test for offline use. Submit when you&apos;re back online — your answers sync automatically and you still get full analytics.",
    published: true,
  },
  {
    title: "All-India Rank Improvements On Topic-Wise Tests",
    content:
      "We&apos;ve rolled out subject- and chapter-level All-India Ranks for every topic-wise test. See exactly where you stand among everyone who&apos;s attempted the same chapter — and identify your strongest and weakest topics at a glance.",
    published: true,
  },
  {
    title: "NIPER JEE Date Announced For 2026",
    content:
      "NIPER JEE 2026 will be conducted on 12 June 2026 in 38 cities across India. Online application opens 1 February. Last year's cutoff for general category was 87/200 — keep your prep on track.",
    published: true,
  },
  {
    title: "Annual Subscription Discount — 30% Off Until Sunday",
    content:
      "Our annual premium plan is 30% off through Sunday midnight. Get every test series, full analytics, and live doubt sessions for the full year at the lowest price of 2026.",
    published: true,
  },
  {
    title: "100 New Questions Added To GPAT Pharmacology Bank",
    content:
      "Our content team just added 100 new high-quality questions across the GPAT pharmacology pool. Every existing student gets free access — log in and they appear automatically in your topic-wise tests.",
    published: true,
  },
];

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const dbName = mongoose.connection.name;
  console.log(`Connected to MongoDB Atlas database: ${dbName}`);

  console.log('Flushing all collections...');
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    await mongoose.connection.db.collection(name).deleteMany({});
    console.log(`  cleared: ${name}`);
  }
  console.log(`Flushed ${collections.length} collection(s).`);

  console.log('Seeding default users...');
  let adminId = null;
  for (const u of DEFAULT_USERS) {
    const hashed = await hashPassword(u.password);
    const created = await userModel.create({ ...u, password: hashed });
    if (created.role === 'admin') adminId = created._id;
    console.log(`  seeded ${created.role}: ${created.email}`);
  }

  console.log('\nSeeding blogs (articles)...');
  for (const b of DEFAULT_BLOGS) {
    const created = await blogModel.create(b);
    console.log(`  blog: ${created.title}`);
  }

  console.log('\nSeeding news...');
  for (const n of DEFAULT_NEWS) {
    const created = await newsModel.create({ ...n, author: adminId });
    console.log(`  news: ${created.title}`);
  }

  console.log('\nSeeding test series (topics → subjects → chapters → tests → questions)...');
  await seedTestSeries(adminId);

  console.log('\nSeeding site content (landing-page CMS)...');
  await siteContentModel.findOneAndUpdate(
    { key: 'singleton' },
    { key: 'singleton', data: DEFAULT_SITE_CONTENT },
    { upsert: true, new: true }
  );
  console.log('  site content: hero/about/features/testimonials/highlights/faq/footer initialized');

  console.log('\nVerifying seeded data:');
  const users = await userModel.find({}, 'name email role isApproved').lean();
  console.table(users);
  console.log(
    `Blogs: ${await blogModel.countDocuments()}    News: ${await newsModel.countDocuments()}    ` +
    `Topics: ${await testSeriesTopicModel.countDocuments()}    Subjects: ${await testSeriesSubjectModel.countDocuments()}    ` +
    `Chapters: ${await testSeriesChapterModel.countDocuments()}    Tests: ${await testModel.countDocuments()}    Questions: ${await questionModel.countDocuments()}`
  );

  await mongoose.disconnect();
  console.log('\nDone.');
};

// ─── Test-series sample data ────────────────────────────────────────────────

const SERIES_BLUEPRINT = [
  {
    topic: {
      title: 'GPAT 2026 Full Series',
      description: 'Real-exam pattern mocks + chapter-wise sectional tests for GPAT 2026.',
      isPaid: false,
      price: 0,
    },
    subjects: [
      {
        title: 'Pharmacology',
        description: 'Drug mechanisms, classes, side-effects, and therapeutic applications.',
        chapters: [
          {
            title: 'Autonomic Nervous System',
            description: 'Cholinergic, anticholinergic, adrenergic, and antiadrenergic drugs.',
            tests: [
              {
                title: 'ANS — Quick Recall (Free Practice)',
                description: '15 high-yield questions on the autonomic nervous system.',
                duration: 20,
                passingMarks: 8,
                isProctored: false,
                questions: [
                  {
                    questionText: 'Which receptor subtype mediates smooth-muscle contraction in vascular tissue?',
                    options: ['α1', 'β1', 'M2', 'Nicotinic'],
                    correctOptionIndex: 0,
                    explanation: 'α1 receptors on vascular smooth muscle drive vasoconstriction.',
                    marks: 2,
                  },
                  {
                    questionText: 'Atropine acts primarily by blocking which type of receptor?',
                    options: ['Nicotinic', 'Muscarinic', 'α-adrenergic', 'β-adrenergic'],
                    correctOptionIndex: 1,
                    explanation: 'Atropine is a competitive muscarinic antagonist.',
                    marks: 2,
                  },
                  {
                    questionText: 'Propranolol is classified as a:',
                    options: ['Selective β1 blocker', 'Non-selective β blocker', 'α1 agonist', 'M1 antagonist'],
                    correctOptionIndex: 1,
                    explanation: 'Propranolol blocks both β1 and β2 receptors.',
                    marks: 2,
                  },
                  {
                    questionText: 'Which drug is most likely to cause orthostatic hypotension via α1 blockade?',
                    options: ['Prazosin', 'Atenolol', 'Pilocarpine', 'Neostigmine'],
                    correctOptionIndex: 0,
                    explanation: 'Prazosin is a selective α1 blocker that drops vascular tone.',
                    marks: 2,
                  },
                  {
                    questionText: 'Pilocarpine is used in the treatment of:',
                    options: ['Asthma', 'Glaucoma', 'Hypertension', 'Heart failure'],
                    correctOptionIndex: 1,
                    explanation: 'Pilocarpine activates muscarinic receptors and reduces intra-ocular pressure.',
                    marks: 2,
                  },
                  {
                    questionText: 'Neostigmine is classified as a:',
                    options: ['Reversible AChE inhibitor', 'Irreversible AChE inhibitor', 'Muscarinic agonist', 'Nicotinic antagonist'],
                    correctOptionIndex: 0,
                    explanation: 'Neostigmine reversibly inhibits acetylcholinesterase.',
                    marks: 2,
                  },
                  {
                    questionText: 'Which agent is used as the first-line antidote for organophosphate poisoning?',
                    options: ['Atropine', 'Pralidoxime', 'Both atropine and pralidoxime', 'Naloxone'],
                    correctOptionIndex: 2,
                    explanation: 'Atropine blocks muscarinic effects; pralidoxime regenerates AChE — together they cover both arms.',
                    marks: 2,
                  },
                  {
                    questionText: 'Bethanechol selectively activates:',
                    options: ['Nicotinic receptors', 'Muscarinic receptors', 'α1 receptors', 'β2 receptors'],
                    correctOptionIndex: 1,
                    explanation: 'Bethanechol is a selective muscarinic agonist used for urinary retention.',
                    marks: 2,
                  },
                ],
              },
            ],
          },
          {
            title: 'CNS Pharmacology',
            description: 'CNS depressants, stimulants, antidepressants, and antiepileptics.',
            tests: [
              {
                title: 'CNS Drugs — Sectional Mock',
                description: 'Antidepressants, antipsychotics, anxiolytics, and antiepileptics.',
                duration: 25,
                passingMarks: 10,
                isProctored: false,
                questions: [
                  {
                    questionText: 'SSRIs primarily inhibit reuptake of which neurotransmitter?',
                    options: ['Dopamine', 'Norepinephrine', 'Serotonin', 'GABA'],
                    correctOptionIndex: 2,
                    explanation: 'SSRIs selectively block serotonin reuptake at the presynaptic terminal.',
                    marks: 2,
                  },
                  {
                    questionText: 'Which antiepileptic is first-line for absence seizures?',
                    options: ['Carbamazepine', 'Phenytoin', 'Ethosuximide', 'Valproate'],
                    correctOptionIndex: 2,
                    explanation: 'Ethosuximide is first-line for absence (petit-mal) seizures.',
                    marks: 2,
                  },
                  {
                    questionText: 'Benzodiazepines exert their effect by enhancing the action of:',
                    options: ['Dopamine', 'GABA', 'Glutamate', 'Acetylcholine'],
                    correctOptionIndex: 1,
                    explanation: 'BZDs allosterically enhance GABA-A receptor activity.',
                    marks: 2,
                  },
                  {
                    questionText: 'Tardive dyskinesia is a long-term side effect most associated with:',
                    options: ['SSRIs', 'Typical antipsychotics', 'Benzodiazepines', 'Lithium'],
                    correctOptionIndex: 1,
                    explanation: 'Long-term D2 blockade causes tardive dyskinesia.',
                    marks: 2,
                  },
                  {
                    questionText: 'Lithium is the drug of choice for:',
                    options: ['Major depression', 'Bipolar disorder', 'Schizophrenia', 'Generalised anxiety'],
                    correctOptionIndex: 1,
                    explanation: 'Lithium remains gold-standard for bipolar mood stabilisation.',
                    marks: 2,
                  },
                  {
                    questionText: 'Atypical antipsychotics differ from typical ones primarily by:',
                    options: ['Stronger D2 blockade', 'Additional 5-HT2A antagonism', 'NMDA agonism', 'GABA-A enhancement'],
                    correctOptionIndex: 1,
                    explanation: 'Atypicals add 5-HT2A antagonism, reducing extrapyramidal effects.',
                    marks: 2,
                  },
                  {
                    questionText: 'Phenytoin works mainly by blocking which channel?',
                    options: ['Voltage-gated sodium channels', 'L-type calcium channels', 'Potassium channels', 'GABA channels'],
                    correctOptionIndex: 0,
                    explanation: 'Phenytoin stabilises neurons by blocking voltage-gated Na⁺ channels.',
                    marks: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Pharmaceutical Chemistry',
        description: 'Structure-activity relationships and synthesis of key drug classes.',
        chapters: [
          {
            title: 'Heterocyclic Chemistry',
            description: 'Pyridines, pyrroles, imidazoles, and their pharmacological relevance.',
            tests: [
              {
                title: 'Heterocycles — Rapid Round',
                description: 'Identify heterocyclic scaffolds and their drug examples.',
                duration: 15,
                passingMarks: 6,
                isProctored: false,
                questions: [
                  {
                    questionText: 'Which heterocycle is the core scaffold of histamine?',
                    options: ['Pyrrole', 'Imidazole', 'Pyridine', 'Furan'],
                    correctOptionIndex: 1,
                    explanation: 'Histamine contains an imidazole ring.',
                    marks: 2,
                  },
                  {
                    questionText: 'Isoniazid is a derivative of:',
                    options: ['Pyridine', 'Pyrimidine', 'Pyrazole', 'Indole'],
                    correctOptionIndex: 0,
                    explanation: 'Isoniazid is the hydrazide of isonicotinic acid (a pyridine derivative).',
                    marks: 2,
                  },
                  {
                    questionText: 'Furosemide contains which heterocyclic ring?',
                    options: ['Furan', 'Pyridine', 'Thiophene', 'Imidazole'],
                    correctOptionIndex: 0,
                    explanation: 'Furosemide is named for its furan ring.',
                    marks: 2,
                  },
                  {
                    questionText: 'Indole is the core scaffold of which neurotransmitter?',
                    options: ['Serotonin', 'Dopamine', 'GABA', 'Glycine'],
                    correctOptionIndex: 0,
                    explanation: 'Serotonin (5-hydroxytryptamine) is built on an indole ring.',
                    marks: 2,
                  },
                  {
                    questionText: 'Which drug class is built around a benzodiazepine ring?',
                    options: ['Sedative-hypnotics', 'Antibiotics', 'Antifungals', 'NSAIDs'],
                    correctOptionIndex: 0,
                    explanation: 'Diazepam, alprazolam, and other anxiolytics share the benzodiazepine core.',
                    marks: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    topic: {
      title: 'NIPER JEE — Premium Mocks',
      description: 'Full-length NIPER JEE mocks with advanced analytics and AIR.',
      isPaid: true,
      price: 1499,
    },
    subjects: [
      {
        title: 'Pharmaceutics',
        description: 'Dosage forms, biopharmaceutics, and pharmacokinetics.',
        chapters: [
          {
            title: 'Pharmacokinetics',
            description: 'ADME, half-life, clearance, and drug interactions.',
            tests: [
              {
                title: 'PK — Full Mock',
                description: 'Quantitative pharmacokinetic problems and concept questions.',
                duration: 45,
                passingMarks: 18,
                isProctored: true,
                questions: [
                  {
                    questionText: 'Volume of distribution is best described as:',
                    options: [
                      'The actual volume of plasma',
                      'A theoretical volume relating drug amount to concentration',
                      'Total body water',
                      'Blood volume',
                    ],
                    correctOptionIndex: 1,
                    explanation: 'Vd = Dose / Plasma concentration — a theoretical, not anatomical, volume.',
                    marks: 2,
                  },
                  {
                    questionText: 'A drug with a half-life of 4 hours will reach steady state after approximately:',
                    options: ['4 hours', '8 hours', '12 hours', '20 hours'],
                    correctOptionIndex: 3,
                    explanation: 'Steady state is reached in ~5 half-lives → 20 hours.',
                    marks: 2,
                  },
                  {
                    questionText: 'First-pass metabolism reduces the bioavailability of which route most significantly?',
                    options: ['IV', 'Oral', 'Sublingual', 'IM'],
                    correctOptionIndex: 1,
                    explanation: 'Oral drugs pass through the liver before reaching systemic circulation.',
                    marks: 2,
                  },
                  {
                    questionText: 'Renal clearance is dependent on all EXCEPT:',
                    options: [
                      'Glomerular filtration rate',
                      'Tubular secretion',
                      'Plasma protein binding',
                      'Hepatic CYP3A4 activity',
                    ],
                    correctOptionIndex: 3,
                    explanation: 'Hepatic CYP enzymes do not affect renal clearance.',
                    marks: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    topic: {
      title: 'State Pharmacist Exam — Practice Series',
      description: 'State-board pattern mocks for government pharmacist exams.',
      isPaid: true,
      price: 599,
    },
    subjects: [
      {
        title: 'Pharmacy Practice',
        description: 'Hospital pharmacy, prescription handling, and clinical workflows.',
        chapters: [
          {
            title: 'Prescription & Dispensing',
            description: 'Prescription rules, refills, and dispensing best-practice.',
            tests: [
              {
                title: 'Prescription Handling — Sectional',
                description: 'Real-world prescription scenarios and dispensing rules.',
                duration: 30,
                passingMarks: 12,
                isProctored: false,
                questions: [
                  {
                    questionText: 'Which schedule covers most prescription-only allopathic drugs in India?',
                    options: ['Schedule G', 'Schedule H', 'Schedule X', 'Schedule M'],
                    correctOptionIndex: 1,
                    explanation: 'Schedule H lists prescription-only drugs.',
                    marks: 2,
                  },
                  {
                    questionText: 'Schedule X drugs additionally require:',
                    options: [
                      'Two copies of the prescription, retained for 2 years',
                      'A single oral request',
                      'No prescription',
                      'Pharmacist consent only',
                    ],
                    correctOptionIndex: 0,
                    explanation: 'Schedule X requires a duplicate prescription, retained 2 years.',
                    marks: 2,
                  },
                  {
                    questionText: 'A prescription for a Schedule H drug must be:',
                    options: ['Verbal', 'Written and signed by an RMP', 'Faxed only', 'Anonymous'],
                    correctOptionIndex: 1,
                    explanation: 'Written, signed prescription from a registered medical practitioner.',
                    marks: 2,
                  },
                  {
                    questionText: 'Which Indian act regulates the manufacture and sale of cosmetics?',
                    options: ['Pharmacy Act, 1948', 'Drugs and Cosmetics Act, 1940', 'NDPS Act, 1985', 'Food Safety Act'],
                    correctOptionIndex: 1,
                    explanation: 'The Drugs and Cosmetics Act, 1940 covers cosmetics regulation as well.',
                    marks: 2,
                  },
                  {
                    questionText: 'A Schedule H1 drug requires the pharmacist to retain the prescription for:',
                    options: ['1 year', '2 years', '3 years', '5 years'],
                    correctOptionIndex: 2,
                    explanation: 'Schedule H1 prescriptions must be retained for 3 years.',
                    marks: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    topic: {
      title: 'Quick Concept Refreshers (Free)',
      description: 'Bite-size 10-question topic refreshers — perfect for revision.',
      isPaid: false,
      price: 0,
    },
    subjects: [
      {
        title: 'Anatomy & Physiology',
        description: 'Foundational A&P concepts every pharmacist should retain.',
        chapters: [
          {
            title: 'Cardiovascular System',
            description: 'Heart anatomy, cardiac cycle, and circulatory physiology.',
            tests: [
              {
                title: 'CVS Refresher',
                description: 'Quick-recall questions on the cardiovascular system.',
                duration: 15,
                passingMarks: 6,
                isProctored: false,
                questions: [
                  {
                    questionText: 'The pacemaker of the heart is the:',
                    options: ['AV node', 'SA node', 'Purkinje fibers', 'Bundle of His'],
                    correctOptionIndex: 1,
                    explanation: 'The sinoatrial (SA) node initiates each heartbeat.',
                    marks: 2,
                  },
                  {
                    questionText: 'Which valve separates the left atrium and left ventricle?',
                    options: ['Tricuspid', 'Mitral', 'Pulmonary', 'Aortic'],
                    correctOptionIndex: 1,
                    explanation: 'The mitral (bicuspid) valve sits between the left atrium and ventricle.',
                    marks: 2,
                  },
                  {
                    questionText: 'Stroke volume × heart rate equals:',
                    options: ['Cardiac output', 'Ejection fraction', 'Mean arterial pressure', 'Pulse pressure'],
                    correctOptionIndex: 0,
                    explanation: 'Cardiac output = SV × HR.',
                    marks: 2,
                  },
                ],
              },
            ],
          },
          {
            title: 'Renal System',
            description: 'Kidney function, nephron anatomy, and acid-base balance.',
            tests: [
              {
                title: 'Renal Refresher',
                description: 'Quick-recall questions on renal physiology.',
                duration: 15,
                passingMarks: 6,
                isProctored: false,
                questions: [
                  {
                    questionText: 'The functional unit of the kidney is the:',
                    options: ['Glomerulus', 'Nephron', 'Bowman capsule', 'Loop of Henle'],
                    correctOptionIndex: 1,
                    explanation: 'The nephron is the kidney\'s functional unit.',
                    marks: 2,
                  },
                  {
                    questionText: 'Which hormone increases water reabsorption in the collecting ducts?',
                    options: ['ADH (vasopressin)', 'Aldosterone', 'Renin', 'ANP'],
                    correctOptionIndex: 0,
                    explanation: 'ADH (vasopressin) increases water permeability of the collecting ducts.',
                    marks: 2,
                  },
                  {
                    questionText: 'Normal blood pH range is:',
                    options: ['6.8–7.0', '7.35–7.45', '7.5–7.7', '8.0–8.2'],
                    correctOptionIndex: 1,
                    explanation: 'Physiological blood pH sits between 7.35 and 7.45.',
                    marks: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        title: 'Microbiology',
        description: 'Bacteria, antibiotics, and basic immunology.',
        chapters: [
          {
            title: 'Antibiotics',
            description: 'Mechanisms, classes, and resistance.',
            tests: [
              {
                title: 'Antibiotics — Quick Round',
                description: 'High-yield questions on antibiotic classes and mechanisms.',
                duration: 15,
                passingMarks: 6,
                isProctored: false,
                questions: [
                  {
                    questionText: 'Penicillins inhibit bacterial:',
                    options: ['DNA gyrase', 'Cell-wall synthesis', 'Protein synthesis', 'Folate synthesis'],
                    correctOptionIndex: 1,
                    explanation: 'Penicillins inhibit transpeptidase, blocking peptidoglycan cross-linking.',
                    marks: 2,
                  },
                  {
                    questionText: 'Aminoglycosides are bactericidal because they target:',
                    options: ['30S ribosomal subunit', '50S ribosomal subunit', 'DNA polymerase', 'RNA polymerase'],
                    correctOptionIndex: 0,
                    explanation: 'Aminoglycosides bind irreversibly to the 30S subunit, causing mistranslation.',
                    marks: 2,
                  },
                  {
                    questionText: 'Vancomycin resistance most commonly involves:',
                    options: [
                      'D-ala-D-ala → D-ala-D-lac substitution',
                      'β-lactamase production',
                      'Efflux pumps',
                      'Porin loss',
                    ],
                    correctOptionIndex: 0,
                    explanation: 'VRE alter the peptidoglycan terminus to D-Ala-D-Lac, lowering vancomycin affinity.',
                    marks: 2,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const buildOptions = (textsArr, correctIdx) =>
  textsArr.map((text, i) => ({ text, isCorrect: i === correctIdx }));

const seedTestSeries = async (adminId) => {
  for (const seriesBlueprint of SERIES_BLUEPRINT) {
    const topic = await testSeriesTopicModel.create({
      ...seriesBlueprint.topic,
      teacherId: adminId,
    });
    console.log(`  topic: ${topic.title}${topic.isPaid ? ` (₹${topic.price})` : ' (free)'}`);

    for (const subjectBlueprint of seriesBlueprint.subjects) {
      const subject = await testSeriesSubjectModel.create({
        title: subjectBlueprint.title,
        description: subjectBlueprint.description,
        topicId: topic._id,
        teacherId: adminId,
      });
      console.log(`    subject: ${subject.title}`);

      for (const chapterBlueprint of subjectBlueprint.chapters) {
        const chapter = await testSeriesChapterModel.create({
          title: chapterBlueprint.title,
          description: chapterBlueprint.description,
          subjectId: subject._id,
          teacherId: adminId,
        });
        console.log(`      chapter: ${chapter.title}`);

        for (const testBlueprint of chapterBlueprint.tests) {
          const totalMarks = testBlueprint.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
          const test = await testModel.create({
            title: testBlueprint.title,
            description: testBlueprint.description,
            duration: testBlueprint.duration,
            passingMarks: testBlueprint.passingMarks,
            totalMarks,
            isProctored: Boolean(testBlueprint.isProctored),
            isPaid: false, // legacy field; pricing now lives on topic
            attemptLimit: 0,
            teacherId: adminId,
            topicId: topic._id,
            subjectId: subject._id,
            chapterId: chapter._id,
            status: 'published',
          });

          const createdQuestions = await questionModel.insertMany(
            testBlueprint.questions.map((q) => ({
              testId: test._id,
              questionText: q.questionText,
              questionType: 'MCQ',
              options: buildOptions(q.options, q.correctOptionIndex),
              correctOptionIndex: q.correctOptionIndex,
              marks: q.marks || 1,
              negativeMarks: 0,
              explanation: q.explanation || '',
              difficulty: 'medium',
              tags: [],
              createdBy: adminId,
            }))
          );

          test.questions = createdQuestions.map((q) => q._id);
          await test.save();
          console.log(`        test: ${test.title} (${createdQuestions.length} questions, published)`);
        }
      }
    }
  }
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
