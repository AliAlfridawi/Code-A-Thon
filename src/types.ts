/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Mentor {
  id: string;
  name: string;
  dept: string;
  avatar: string;
  tags: string[];
}

export interface Mentee {
  id: string;
  name: string;
  program: string;
  major: string;
  avatar: string;
}

export const MENTORS: Mentor[] = [
  {
    id: 'm1',
    name: 'Dr. Julian Sterling',
    dept: 'Dept. of Theoretical Physics',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150',
    tags: ['Quantum Mechanics', 'Ethics'],
  },
  {
    id: 'm2',
    name: 'Prof. Elena Vance',
    dept: 'Molecular Biology Faculty',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150',
    tags: ['Genomics', 'Lab Mgmt'],
  },
  {
    id: 'm3',
    name: 'Dr. Marcus Thorne',
    dept: 'Ancient History Chair',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150',
    tags: ['Latin', 'Archiving'],
  },
];

export const MENTEES: Mentee[] = [
  {
    id: 's1',
    name: 'Liam Carter',
    program: 'PhD Candidate',
    major: 'Physics',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 's2',
    name: 'Sarah Jenkins',
    program: 'Masters',
    major: 'Biology',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
  },
  {
    id: 's3',
    name: 'David Chen',
    program: 'PhD Candidate',
    major: 'History',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
  },
];
