/**
 * Extended member data for profile pages
 */
export interface MemberProfile {
  bio: string;
  publications: { title: string; journal: string; year: number }[];
  researchInterests: string[];
  availability: { day: string; hours: string }[];
  email: string;
  office: string;
  joinedDate: string;
}

export const MENTOR_PROFILES: Record<string, MemberProfile> = {
  m1: {
    bio: 'Dr. Julian Sterling is a renowned theoretical physicist specializing in quantum mechanics and quantum information theory. With over 15 years of academic experience, he has mentored dozens of PhD candidates and published extensively in top-tier journals.',
    publications: [
      { title: 'Quantum Entanglement in Multi-Particle Systems', journal: 'Physical Review Letters', year: 2024 },
      { title: 'Error Correction Protocols for Quantum Computing', journal: 'Nature Physics', year: 2023 },
      { title: 'Ethical Implications of Quantum Supremacy', journal: 'Science & Ethics Review', year: 2022 },
    ],
    researchInterests: ['Quantum Mechanics', 'Quantum Computing', 'Ethics in Physics', 'Particle Theory', 'String Theory'],
    availability: [
      { day: 'Monday', hours: '10:00 AM – 2:00 PM' },
      { day: 'Wednesday', hours: '1:00 PM – 4:00 PM' },
      { day: 'Friday', hours: '9:00 AM – 12:00 PM' },
    ],
    email: 'j.sterling@university.edu',
    office: 'Physics Building, Room 312',
    joinedDate: 'Sep 2019',
  },
  m2: {
    bio: 'Prof. Elena Vance leads the Molecular Biology Faculty with expertise in genomics and laboratory management. Her research focuses on gene expression patterns and their implications for personalized medicine.',
    publications: [
      { title: 'CRISPR Applications in Gene Therapy: A Comprehensive Review', journal: 'Nature Biotechnology', year: 2024 },
      { title: 'Genomic Markers for Early Cancer Detection', journal: 'Cell', year: 2023 },
      { title: 'Lab Management Best Practices for Research Teams', journal: 'Academic Leadership Journal', year: 2021 },
    ],
    researchInterests: ['Genomics', 'CRISPR Technology', 'Lab Management', 'Personalized Medicine', 'Bioinformatics'],
    availability: [
      { day: 'Tuesday', hours: '9:00 AM – 1:00 PM' },
      { day: 'Thursday', hours: '2:00 PM – 5:00 PM' },
    ],
    email: 'e.vance@university.edu',
    office: 'Life Sciences Center, Room 208',
    joinedDate: 'Jan 2020',
  },
  m3: {
    bio: 'Dr. Marcus Thorne chairs the Ancient History department with specializations in Latin epigraphy and archival sciences. He has led numerous archaeological expeditions and curated collections across Europe.',
    publications: [
      { title: 'Deciphering Late Roman Inscriptions in Gaul', journal: 'Journal of Roman Studies', year: 2024 },
      { title: 'Digital Archiving Methods for Ancient Manuscripts', journal: 'Digital Humanities Quarterly', year: 2023 },
      { title: 'Latin Pedagogy in the Modern University', journal: 'Classical World', year: 2022 },
    ],
    researchInterests: ['Latin', 'Archiving', 'Roman History', 'Epigraphy', 'Digital Humanities'],
    availability: [
      { day: 'Monday', hours: '2:00 PM – 5:00 PM' },
      { day: 'Wednesday', hours: '10:00 AM – 12:00 PM' },
      { day: 'Thursday', hours: '9:00 AM – 11:00 AM' },
    ],
    email: 'm.thorne@university.edu',
    office: 'Humanities Hall, Room 105',
    joinedDate: 'Mar 2018',
  },
};

export const MENTEE_PROFILES: Record<string, MemberProfile> = {
  s1: {
    bio: 'Liam Carter is a PhD candidate in Physics focusing on quantum state dynamics. He joined the program after completing his Masters at MIT with distinction.',
    publications: [
      { title: 'Simulation of Quantum Walk Algorithms', journal: 'Conference Proceedings — QIP 2024', year: 2024 },
    ],
    researchInterests: ['Quantum Mechanics', 'Algorithm Design', 'Computational Physics', 'Machine Learning'],
    availability: [
      { day: 'Monday', hours: '9:00 AM – 5:00 PM' },
      { day: 'Tuesday', hours: '9:00 AM – 5:00 PM' },
      { day: 'Wednesday', hours: '9:00 AM – 5:00 PM' },
    ],
    email: 'l.carter@university.edu',
    office: 'Graduate Research Lab, Desk 14',
    joinedDate: 'Aug 2024',
  },
  s2: {
    bio: 'Sarah Jenkins is a Masters student in Biology with a focus on molecular genetics. She is passionate about combining genomics with computational approaches to understand disease mechanisms.',
    publications: [],
    researchInterests: ['Molecular Biology', 'Genomics', 'Data Analysis', 'Computational Biology'],
    availability: [
      { day: 'Tuesday', hours: '10:00 AM – 4:00 PM' },
      { day: 'Thursday', hours: '10:00 AM – 4:00 PM' },
      { day: 'Friday', hours: '1:00 PM – 5:00 PM' },
    ],
    email: 's.jenkins@university.edu',
    office: 'Bio Lab Annex, Bench 7',
    joinedDate: 'Jan 2025',
  },
  s3: {
    bio: 'David Chen is a PhD candidate in History researching the cultural impact of Roman expansion in East Asia trade routes. He brings a unique cross-cultural perspective to ancient history studies.',
    publications: [
      { title: 'Silk Road Trade Networks: A Re-evaluation of Roman Sources', journal: 'Journal of World History', year: 2025 },
    ],
    researchInterests: ['Ancient History', 'Trade Networks', 'Cross-Cultural Studies', 'Latin', 'Archiving'],
    availability: [
      { day: 'Monday', hours: '1:00 PM – 4:00 PM' },
      { day: 'Wednesday', hours: '9:00 AM – 1:00 PM' },
      { day: 'Friday', hours: '10:00 AM – 3:00 PM' },
    ],
    email: 'd.chen@university.edu',
    office: 'Humanities Hall, Room 204B',
    joinedDate: 'Sep 2024',
  },
};
