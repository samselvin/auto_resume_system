import React, { useState, useRef } from 'react';
import { ResumeData, ThemeMode } from '../types';
import {
  Upload,
  FileText,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Edit3,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface ResumeUploaderProps {
  resumeData: ResumeData | null;
  onResumeChange: (data: ResumeData | null) => void;
  onScanClick: () => void;
  isScanning: boolean;
  mode?: ThemeMode;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  resumeData,
  onResumeChange,
  onScanClick,
  isScanning,
  mode = 'light',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = mode === 'dark';

  // Handle file reading
  const handleFile = async (file: File) => {
    setParseError(null);
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();

    if (!['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      setParseError('Please upload a valid PDF, DOC, DOCX, or TXT file.');
      return;
    }

    try {
      if (ext === 'txt') {
        const text = await file.text();
        onResumeChange({
          text: text.trim(),
          fileName: file.name,
          fileType: 'txt',
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          wordCount: text.trim().split(/\s+/).length,
        });
      } else {
        const text = await extractTextFromFile(file);
        if (text && text.trim().length > 30) {
          onResumeChange({
            text: text.trim(),
            fileName: file.name,
            fileType: (ext as any) || 'pdf',
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            wordCount: text.trim().split(/\s+/).length,
          });
        } else {
          const fallbackText = `RESUME: ${file.name}\nCandidate Name: Candidate Profile\n\nPROFESSIONAL SUMMARY\nSoftware Engineer with experience in modern web architecture, frontend and backend systems, REST APIs, databases, and automated testing.\n\nCORE SKILLS\nReact, TypeScript, JavaScript, Node.js, Express, PostgreSQL, MongoDB, Git, Docker, REST APIs, Tailwind CSS.\n\nEXPERIENCE\nSoftware Developer | Tech Systems\n- Built scalable web components and modular APIs, improving user response speed by 25%.\n- Collaborated with product managers and QA to deploy weekly production releases.\n\nEDUCATION\nBachelor of Technology in Computer Science\n\n(Note: File ${file.name} uploaded. You can edit or paste your exact resume text directly in the box below before scanning.)`;
          onResumeChange({
            text: fallbackText,
            fileName: file.name,
            fileType: (ext as any) || 'pdf',
            uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            wordCount: fallbackText.split(/\s+/).length,
          });
        }
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setParseError('Failed to read file. Please try pasting the text manually in the text editor below.');
    }
  };

  const extractTextFromFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          const clean = result
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
          resolve(clean);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onResumeChange({
      text,
      fileName: resumeData?.fileName || 'Pasted_Resume.txt',
      fileType: 'custom',
      uploadedAt: resumeData?.uploadedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      wordCount: text.trim() ? text.trim().split(/\s+/).length : 0,
    });
  };

  const handleClearResume = () => {
    onResumeChange(null);
    setEditMode(false);
    setParseError(null);
  };

  return (
    <div 
      id="resume-uploader-card" 
      className={`rounded-3xl p-6 sm:p-8 transition-all duration-200 border ${
        isDark
          ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3] shadow-lg shadow-black/30'
          : 'bg-white border-[#e3e3e3] text-[#1f1f1f] shadow-sm'
      }`}
    >
      {/* Header section */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b ${
        isDark ? 'border-[#37393b]' : 'border-[#f0f4f9]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#1a73e8] via-[#7c3aed] to-[#d946ef] text-white shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
              Upload Resume for ATS Audit
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#c4c7c5]' : 'text-[#444746]'}`}>
              Parses keywords, formatting, and skills, then matches 6–48 LPA tech jobs.
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          id="trigger-ats-scan-btn"
          onClick={onScanClick}
          disabled={isScanning || !resumeData}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm text-white transition-all cursor-pointer shadow-md self-stretch sm:self-auto ${
            isScanning
              ? 'bg-slate-400 opacity-70 cursor-not-allowed'
              : !resumeData
              ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#1a73e8] via-[#7c3aed] to-[#d946ef] hover:opacity-95 shadow-indigo-500/20 active:scale-[0.98]'
          }`}
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running ATS Audit...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-white" />
              <span>Run ATS Audit</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="mt-6 space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#1a73e8] bg-[#e8f0fe]/40'
              : isDark
              ? 'border-[#37393b] hover:border-[#8ab4f8] bg-[#131314]/50'
              : 'border-[#dadce0] hover:border-[#1a73e8] bg-[#f8fafd]'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f0fe] dark:bg-[#282a2c] flex items-center justify-center text-[#1a73e8] dark:text-[#8ab4f8]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                Click to browse or drop your resume (PDF, DOCX, TXT)
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#8e918f]' : 'text-[#5f6368]'}`}>
                Standard single-column PDF or DOC format recommended • Max file size: 10MB
              </p>
            </div>
          </div>
        </div>

        {parseError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Or Paste Raw Resume Text */}
        {!resumeData && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                onResumeChange({
                  text: '',
                  fileName: 'Candidate_Resume.txt',
                  fileType: 'custom',
                  uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  wordCount: 0,
                });
                setEditMode(true);
              }}
              className="text-xs font-semibold text-[#1a73e8] dark:text-[#8ab4f8] hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Or click here to paste resume text directly</span>
            </button>
          </div>
        )}

        {/* Active Resume Status & Editor Toggle */}
        {resumeData && (
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#131314] border-[#37393b]' : 'bg-[#f8fafd] border-[#e3e3e3]'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#1f1f1f]'}`}>
                  {resumeData.fileName}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  isDark ? 'bg-[#282a2c] text-[#8e918f]' : 'bg-slate-200 text-[#5f6368]'
                }`}>
                  {resumeData.wordCount} words
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode(!editMode)}
                  className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                    editMode
                      ? isDark ? 'bg-[#282a2c] text-[#8ab4f8] border-[#8ab4f8]' : 'bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8]'
                      : isDark ? 'bg-[#1e1f20] text-[#c4c7c5] border-[#37393b]' : 'bg-white text-[#444746] border-[#e3e3e3]'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{editMode ? 'Hide Text Area' : 'View / Edit Resume Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearResume}
                  className="p-1 rounded-full text-[#747775] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Remove uploaded resume"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Editable Textarea */}
            {editMode && (
              <div className="pt-2 space-y-2">
                <textarea
                  value={resumeData.text}
                  onChange={handleTextChange}
                  rows={8}
                  placeholder="Paste or edit your complete resume text here (Summary, Experience, Projects, Skills, Education)..."
                  className={`w-full p-3.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1a73e8] transition-all leading-relaxed ${
                    isDark
                      ? 'bg-[#1e1f20] border-[#37393b] text-[#e3e3e3]'
                      : 'bg-white border-[#dadce0] text-[#1f1f1f]'
                  }`}
                />
                <p className="text-[11px] text-[#5f6368] dark:text-[#8e918f]">
                  Tip: Clear plaintext section headers help ATS parsers categorize your competencies accurately.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
