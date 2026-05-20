import { supabase, supabaseEnabled } from '@/lib/supabase';
import type { AuditResult } from './types';

function generateShareId(): string {
  // 10-char hex ID from UUID - e.g. "a3b2c1d4e5"
  // 16^10 = ~1 trillion possibilities, more than enough at this scale
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
}

export async function saveAuditResult(result: AuditResult): Promise<string> {
  if (!supabaseEnabled || !supabase) throw new Error('Supabase not configured');

  const id = generateShareId();

  const { error } = await supabase
    .from('audit_reports')
    .insert({ id, url: result.url, result });

  if (error) throw new Error(error.message);

  return id;
}

export async function getAuditResult(id: string): Promise<AuditResult | null> {
  if (!supabaseEnabled || !supabase) return null;

  const { data, error } = await supabase
    .from('audit_reports')
    .select('result')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return data.result as AuditResult;
}
