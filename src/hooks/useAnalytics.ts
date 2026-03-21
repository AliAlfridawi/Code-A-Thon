import { useEffect, useState } from 'react';
import { useSupabase } from './useSupabase';

export interface DepartmentStat {
  name: string;
  mentors: number;
  mentees: number;
}

export function useAnalytics() {
  const supabase = useSupabase();
  const [stats, setStats] = useState({
    totalMentors: 0,
    totalMentees: 0,
    totalPairings: 0,
    activePairings: 0,
  });
  const [deptStats, setDeptStats] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        
        // Fetch raw counts
        const [mentorsRes, menteesRes, pairingsRes, activePairingsRes] = await Promise.all([
          supabase.from('mentors').select('*', { count: 'exact', head: true }),
          supabase.from('mentees').select('*', { count: 'exact', head: true }),
          supabase.from('pairings').select('*', { count: 'exact', head: true }),
          supabase.from('pairings').select('*', { count: 'exact', head: true }).eq('status', 'active')
        ]);

        setStats({
          totalMentors: mentorsRes.count || 0,
          totalMentees: menteesRes.count || 0,
          totalPairings: pairingsRes.count || 0,
          activePairings: activePairingsRes.count || 0,
        });

        // Calculate department distribution (grouping by mentor.dept logic)
        // For simplicity in the free tier, we fetch the depts and aggregate client-side
        const { data: mentors } = await supabase.from('mentors').select('dept');
        const deptMap = new Map<string, DepartmentStat>();
        
        mentors?.forEach(m => {
          if (!deptMap.has(m.dept)) deptMap.set(m.dept, { name: m.dept, mentors: 0, mentees: 0 });
          deptMap.get(m.dept)!.mentors++;
        });

        const sortedDepts = Array.from(deptMap.values()).sort((a, b) => b.mentors - a.mentors).slice(0, 5);
        setDeptStats(sortedDepts);

      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [supabase]);

  return { stats, deptStats, loading };
}
