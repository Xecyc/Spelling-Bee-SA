import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Loader2,
  Table,
} from 'lucide-react';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { WheelConfig, WheelSlice } from '../types/presentation';

interface DocumentAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppendWheels: (newWheels: WheelConfig[]) => void;
}

interface ParsedWheelCandidate {
  name: string;
  group: 'elementary' | 'high_school';
  grade?: string;
  place?: '1st' | '2nd_3rd';
  timerDuration: number;
  words: string[];
}

const VIBRANT_SLICE_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6',
  '#84cc16', '#eab308', '#d946ef', '#0ea5e9', '#f43f5e',
];

export const DocumentAnalyzerModal: React.FC<DocumentAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onAppendWheels,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [parsedCandidates, setParsedCandidates] = useState<ParsedWheelCandidate[]>([]);
  const [parseMethod, setParseMethod] = useState<'fast' | 'ai' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Reset state
  const handleReset = () => {
    setFile(null);
    setExtractedText('');
    setParsedCandidates([]);
    setParseMethod(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  // Convert raw text into candidates using rule-based heuristics
  const runRuleBasedParser = (text: string, defaultFileName: string): ParsedWheelCandidate[] => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const candidates: ParsedWheelCandidate[] = [];
    let currentWheelName = defaultFileName.replace(/\.[^/.]+$/, '');
    let currentWords: string[] = [];
    let currentGroup: 'elementary' | 'high_school' = 'elementary';
    let currentGrade = '1st';
    let currentPlace: '1st' | '2nd_3rd' = '1st';

    const gradeRegex = /(?:grade|grado|year|año|1st|2nd|3rd|4th|5th|6th|high\s*school|bachillerato)/i;
    const placeRegex = /(?:1st\s*place|primer\s*lugar|2nd|3rd|segundo|tercer|tiebreaker|desempate)/i;

    const finalizeCurrent = () => {
      if (currentWords.length > 0) {
        const timerDuration = currentPlace === '1st' ? 40 : 20;
        candidates.push({
          name: currentWheelName,
          group: currentGroup,
          grade: currentGrade,
          place: currentPlace,
          timerDuration,
          words: Array.from(new Set(currentWords)),
        });
        currentWords = [];
      }
    };

    for (const rawLine of lines) {
      // Check if line looks like a heading
      const isHeaderLike =
        rawLine.length < 50 &&
        (gradeRegex.test(rawLine) || placeRegex.test(rawLine) || rawLine.endsWith(':'));

      if (isHeaderLike) {
        finalizeCurrent();

        const lower = rawLine.toLowerCase();
        if (lower.includes('high school') || lower.includes('bachillerato') || lower.includes('secondary')) {
          currentGroup = 'high_school';
          currentGrade = 'High School';
        } else if (lower.includes('1st') || lower.includes('first') || lower.includes('primer')) {
          currentGroup = 'elementary';
          currentGrade = '1st';
        } else if (lower.includes('2nd') || lower.includes('second') || lower.includes('segundo')) {
          currentGroup = 'elementary';
          currentGrade = '2nd';
        } else if (lower.includes('3rd') || lower.includes('third') || lower.includes('tercer')) {
          currentGroup = 'elementary';
          currentGrade = '3rd';
        } else if (lower.includes('4th') || lower.includes('fourth') || lower.includes('cuarto')) {
          currentGroup = 'elementary';
          currentGrade = '4th';
        } else if (lower.includes('5th') || lower.includes('fifth') || lower.includes('quinto')) {
          currentGroup = 'elementary';
          currentGrade = '5th';
        } else if (lower.includes('6th') || lower.includes('sixth') || lower.includes('sexto')) {
          currentGroup = 'elementary';
          currentGrade = '6th';
        }

        if (lower.includes('2nd') || lower.includes('3rd') || lower.includes('tiebreaker') || lower.includes('desempate')) {
          currentPlace = '2nd_3rd';
        } else {
          currentPlace = '1st';
        }

        currentWheelName = rawLine.replace(/[:#]/g, '').trim();
      } else {
        // Line may contain one or multiple words separated by commas or tabs
        const tokens = rawLine
          .split(/[,;\t]/)
          .map((t) => t.replace(/^[0-9]+[.)\-]\s*/, '').trim())
          .filter((t) => t.length >= 2 && !t.includes('http') && !t.includes('@'));

        for (const token of tokens) {
          // Extract word token (single word or hyphenated compound)
          const cleanWord = token.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑÜ\s-]/g, '').trim();
          if (cleanWord.length >= 2) {
            currentWords.push(cleanWord);
          }
        }
      }
    }

    finalizeCurrent();
    return candidates;
  };

  // Process file upload
  const handleFileProcess = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const fileName = selectedFile.name;
      const lowerName = fileName.toLowerCase();
      let rawText = '';

      if (lowerName.endsWith('.docx')) {
        // Word document extraction
        const arrayBuffer = await selectedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        rawText = result.value;
      } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
        // Excel document extraction
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetsText: string[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          sheetsText.push(`\n=== SHEET: ${sheetName} ===\n`);
          const csv = XLSX.utils.sheet_to_csv(sheet);
          sheetsText.push(csv);
        });

        rawText = sheetsText.join('\n');
      } else {
        // Plain text document
        rawText = await selectedFile.text();
      }

      setExtractedText(rawText);

      // Attempt fast rule-based extraction first
      const fastResults = runRuleBasedParser(rawText, fileName);
      if (fastResults.length > 0 && fastResults.some((w) => w.words.length >= 2)) {
        setParsedCandidates(fastResults);
        setParseMethod('fast');
      } else {
        // Trigger AI analysis if rule-based returns sparse data
        await handleAiAnalyze(rawText, fileName);
      }
    } catch (err: any) {
      console.error('File extraction failed:', err);
      setErrorMessage(err.message || 'Could not parse the selected file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Call Gemini AI server API
  const handleAiAnalyze = async (textToAnalyze?: string, name?: string) => {
    const text = textToAnalyze || extractedText;
    const filename = name || file?.name || 'Spelling Words';
    if (!text || text.trim().length === 0) {
      setErrorMessage('No text available to analyze.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, filename }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data.wheels) && data.wheels.length > 0) {
        const validWheels: ParsedWheelCandidate[] = data.wheels.map((w: any) => ({
          name: w.name || 'Spelling Bee Wheel',
          group: w.group === 'high_school' ? 'high_school' : 'elementary',
          grade: w.grade || '1st',
          place: w.place === '2nd_3rd' ? '2nd_3rd' : '1st',
          timerDuration: Number(w.timerDuration) || (w.place === '2nd_3rd' ? 20 : 40),
          words: Array.isArray(w.words)
            ? w.words.map((s: string) => String(s).toUpperCase().trim()).filter(Boolean)
            : [],
        }));

        setParsedCandidates(validWheels);
        setParseMethod('ai');
      } else {
        throw new Error('Gemini could not identify classified wheels in this text.');
      }
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      setErrorMessage(
        `AI Analysis notice: ${err.message}. If Gemini API key is not configured, the rule-based parser can still be used.`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm appending wheels to app
  const handleConfirmAppend = () => {
    if (parsedCandidates.length === 0) return;

    const newWheels: WheelConfig[] = parsedCandidates.map((cand, idx) => {
      const slices: WheelSlice[] = cand.words.map((w, wIdx) => ({
        id: `slice-${Date.now()}-${idx}-${wIdx}`,
        text: w,
        color: VIBRANT_SLICE_COLORS[wIdx % VIBRANT_SLICE_COLORS.length],
        weight: 1,
        enabled: true,
      }));

      return {
        id: `wheel-imported-${Date.now()}-${idx}`,
        name: cand.name,
        group: cand.group,
        grade: cand.grade,
        place: cand.place || '1st',
        role: cand.place === '1st' ? '1st' : '2nd',
        timerDuration: cand.timerDuration,
        spinDuration: 7,
        slices: slices.length > 0 ? slices : [{ id: `s-ph-${idx}`, text: 'SAMPLE', color: '#FBBF24' }],
      };
    });

    onAppendWheels(newWheels);
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#061a3e] border border-blue-400/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/60 bg-[#071f4c]/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-[#061a3e] flex items-center justify-center shadow-md shadow-amber-400/20 font-black">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm sm:text-base text-white tracking-wide uppercase">
                Document Word Analyzer
              </h2>
              <p className="text-[11px] text-blue-200/80">
                Auto-classify Word (.docx) & Excel (.xlsx/.csv) files into wheels
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-xl text-blue-300 hover:text-white hover:bg-blue-900/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* File Upload Drop Zone */}
          {!file && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileProcess(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-blue-400/30 hover:border-amber-400/70 bg-[#0a2354]/40 hover:bg-[#0a2354]/70'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center shadow-inner">
                <Upload className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">
                  Drop your Word or Excel file here, or click to browse
                </p>
                <p className="text-xs text-blue-200/70">
                  Supports .docx, .xlsx, .xls, .csv, and .txt word lists
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.xlsx,.xls,.csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-bold text-white">
                Analyzing document & classifying words by grade...
              </p>
              <p className="text-xs text-blue-300/70">
                Detecting grades, places, and spelling bee word groups
              </p>
            </div>
          )}

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Parsed Results Preview */}
          {parsedCandidates.length > 0 && !isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Wheels Ready to Create ({parsedCandidates.length})
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-900/60 text-blue-200 border border-blue-400/20">
                    {parseMethod === 'ai' ? 'Gemini AI Classified' : 'Fast Structural Parse'}
                  </span>
                </div>

                {parseMethod === 'fast' && (
                  <button
                    onClick={() => handleAiAnalyze()}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold transition cursor-pointer"
                    title="Run Gemini AI for enhanced classification"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enhance with Gemini AI</span>
                  </button>
                )}
              </div>

              {/* Cards List */}
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {parsedCandidates.map((cand, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#092250] border border-blue-400/25 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {cand.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-[#061a3e]">
                          {cand.group === 'high_school' ? 'High School' : `${cand.grade || 'Grade'}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-200/70 truncate">
                        {cand.words.length} words · Timer: {cand.timerDuration}s · Sample:{' '}
                        {cand.words.slice(0, 4).join(', ')}
                        {cand.words.length > 4 ? '...' : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setParsedCandidates((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      className="p-1.5 text-blue-400 hover:text-rose-400 transition cursor-pointer"
                      title="Remove this wheel from import"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-blue-900/60 bg-[#071f4c]/80 flex items-center justify-between gap-3 shrink-0">
          {file && (
            <button
              onClick={handleReset}
              className="text-xs font-bold text-blue-300 hover:text-white transition cursor-pointer"
            >
              Choose another file
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-blue-200 hover:text-white bg-blue-950/50 hover:bg-blue-900/50 border border-blue-400/20 transition cursor-pointer"
            >
              Cancel
            </button>

            {parsedCandidates.length > 0 && (
              <button
                onClick={handleConfirmAppend}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-[#061a3e] shadow-lg shadow-amber-400/20 transition hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Append {parsedCandidates.length} Wheels</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
