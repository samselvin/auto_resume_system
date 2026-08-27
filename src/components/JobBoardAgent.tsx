import React, { useEffect, useState } from 'react';
import { Bot, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ThemeMode } from '../types';
import { AgentReport } from '../lib/jobBoardAgent';

interface JobBoardAgentProps {
  mode: ThemeMode;
  onHealed?: (report: AgentReport) => void;
  autoRun?: boolean;
}

export const JobBoardAgent: React.FC<JobBoardAgentProps> = ({
  mode,
  onHealed,
  autoRun = true,
}) => {
  const isDark = mode === 'dark';
  const [report, setReport] = useState<AgentReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAgent = async (heal: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent could not inspect the board.');
      setReport(data as AgentReport);
      if (heal) onHealed?.(data as AgentReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent failed.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (autoRun) {
      void runAgent(true);
    }
  }, [autoRun]);

  return (
    <div className={`rounded-3xl p-6 border shadow-sm space-y-4 ${
      isDark ? 'bg-[#1e1f20] border-[#37393b]' : 'bg-white border-[#e3e3e3]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
            <Bot className="w-4 h-4 text-[#1a73e8]" />
            Job Board Agent
          </h3>
          <p className="text-xs text-[#747775] mt-1">
            Pulls new and important LinkedIn job posts onto Find Jobs, then keeps the board clean.
          </p>
        </div>
        <button
          type="button"
          onClick={() => runAgent(true)}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-white bg-[#1a73e8] disabled:opacity-60 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
          {busy ? 'Finding jobs…' : 'Find LinkedIn jobs'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-600 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </p>
      )}

      {report && (
        <div className="space-y-2">
          <p className={`text-xs font-semibold flex items-center gap-1.5 ${
            report.ok ? 'text-emerald-600' : 'text-amber-700'
          }`}>
            {report.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Checked {report.checked} listings · {report.livePosts} live posts
          </p>
          {report.actions.map((action, i) => (
            <p key={`${action.type}-${i}`} className="text-xs text-[#747775]">
              {action.message}
            </p>
          ))}
          {report.issues.slice(0, 6).map((issue) => (
            <p key={issue.id} className="text-xs text-rose-600">
              {issue.message}
            </p>
          ))}
          {report.ok && report.actions.length === 0 && report.issues.length === 0 && (
            <p className="text-xs text-[#747775]">No mistakes found. LinkedIn cards have apply links.</p>
          )}
        </div>
      )}
    </div>
  );
};
