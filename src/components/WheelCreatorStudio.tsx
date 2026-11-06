import React, { useState } from 'react';
import {
  Shuffle,
  ArrowUpDown,
  Plus,
  Trash2,
  Palette,
  Maximize2,
  FilePlus,
  Share2,
  SlidersHorizontal,
  ChevronDown,
  ArrowLeft,
  Volume2,
  VolumeX,
  PanelRightClose,
  PanelRightOpen,
  MoreHorizontal,
} from 'lucide-react';
import { WheelConfig, WheelSlice, WheelRole, SoundSettings } from '../types/presentation';
import { WheelCanvas } from './WheelCanvas';
import { MAX_SLICES, getRandomColor, createSlicesFromWords } from '../utils/defaultData';
import { audioManager } from '../utils/audio';

interface WheelCreatorStudioProps {
  wheels: WheelConfig[];
  activeWheelId: string;
  onSelectWheel: (wheelId: string) => void;
  onUpdateWheel: (updated: WheelConfig) => void;
  onCreateWheel: (role: WheelRole, name: string) => void;
  onDeleteWheel?: (wheelId: string) => void;
  onReturnToDeck: () => void;
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (slice: WheelSlice) => void;
  soundSettings: SoundSettings;
  onUpdateSoundSettings: (settings: SoundSettings) => void;
}

export const WheelCreatorStudio: React.FC<WheelCreatorStudioProps> = ({
  wheels,
  activeWheelId,
  onSelectWheel,
  onUpdateWheel,
  onCreateWheel,
  onReturnToDeck,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  soundSettings,
  onUpdateSoundSettings,
}) => {
  const currentWheel = wheels.find((w) => w.id === activeWheelId) || wheels[0];
  const [activeTab, setActiveTab] = useState<'entries' | 'results'>('entries');
  const [isEditingBulk, setIsEditingBulk] = useState(false);
  const [bulkText, setBulkText] = useState(
    currentWheel.slices.map((s) => s.text).join('\n')
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showAddWheelMenu, setShowAddWheelMenu] = useState(false);
  const [spinResults, setSpinResults] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Update bulk text when current wheel changes
  React.useEffect(() => {
    setBulkText(currentWheel.slices.map((s) => s.text).join('\n'));
  }, [currentWheel]);

  // Update wheel title
  const handleTitleChange = (newName: string) => {
    onUpdateWheel({
      ...currentWheel,
      name: newName,
    });
  };

  // Update wheel role
  const handleRoleChange = (newRole: WheelRole) => {
    onUpdateWheel({
      ...currentWheel,
      role: newRole,
    });
  };

  // Add a single word
  const handleAddWord = () => {
    if (currentWheel.slices.length >= MAX_SLICES) return;
    const newSlice: WheelSlice = {
      id: `slice-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: `WORD ${currentWheel.slices.length + 1}`,
      color: getRandomColor(currentWheel.slices.length),
    };
    onUpdateWheel({
      ...currentWheel,
      slices: [...currentWheel.slices, newSlice],
    });
  };

  // Delete a slice
  const handleDeleteSlice = (id: string) => {
    if (currentWheel.slices.length <= 2) return;
    onUpdateWheel({
      ...currentWheel,
      slices: currentWheel.slices.filter((s) => s.id !== id),
    });
  };

  // Update slice text
  const handleUpdateSliceText = (id: string, text: string) => {
    onUpdateWheel({
      ...currentWheel,
      slices: currentWheel.slices.map((s) =>
        s.id === id ? { ...s, text: text.toUpperCase() } : s
      ),
    });
  };

  // Update slice color
  const handleUpdateSliceColor = (id: string, color: string) => {
    onUpdateWheel({
      ...currentWheel,
      slices: currentWheel.slices.map((s) =>
        s.id === id ? { ...s, color } : s
      ),
    });
  };

  // Shuffle slices
  const handleShuffle = () => {
    const shuffled = [...currentWheel.slices].sort(() => Math.random() - 0.5);
    onUpdateWheel({
      ...currentWheel,
      slices: shuffled,
    });
  };

  // Sort slices alphabetically
  const handleSort = () => {
    const sorted = [...currentWheel.slices].sort((a, b) =>
      a.text.localeCompare(b.text)
    );
    onUpdateWheel({
      ...currentWheel,
      slices: sorted,
    });
  };

  // Randomize all slice colors
  const handleRandomizeColors = () => {
    const recolored = currentWheel.slices.map((s, idx) => ({
      ...s,
      color: getRandomColor(idx),
    }));
    onUpdateWheel({
      ...currentWheel,
      slices: recolored,
    });
  };

  // Save bulk text
  const handleApplyBulkText = () => {
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim().toUpperCase())
      .filter((l) => l.length > 0)
      .slice(0, MAX_SLICES);

    if (lines.length > 0) {
      const newSlices = createSlicesFromWords(lines);
      onUpdateWheel({
        ...currentWheel,
        slices: newSlices,
      });
    }
    setIsEditingBulk(false);
  };

  const handleStudioSpinEnd = (slice: WheelSlice) => {
    setSpinResults((prev) => [slice.text, ...prev]);
    onSpinEnd(slice);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F0F2F5] text-slate-800 font-sans select-none overflow-hidden">
      {/* 1. Wheel of Names Header Bar (Authentic Image 1 Clone) */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-xs z-30">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToDeck}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Return to Presentation Slides"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Slides</span>
          </button>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            {/* Colorful Wheel Icon */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-sky-500 p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <span className="text-[10px] font-black text-slate-800">W</span>
              </div>
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-800 hidden sm:inline">
              Wheel of Names
            </span>
          </div>
        </div>

        {/* Right Action Icons from Screenshot */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setIsCustomizing(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Customize</span>
          </button>

          <button
            onClick={() => onCreateWheel('custom', 'NEW WHEEL')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <FilePlus className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">New</span>
          </button>

          <button
            onClick={() => {
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentWheel, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute('href', dataStr);
              downloadAnchor.setAttribute('download', `${currentWheel.name.toLowerCase().replace(/\s+/g, '_')}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              const next = !soundSettings.enabled;
              onUpdateSoundSettings({ ...soundSettings, enabled: next });
              audioManager.setMuted(!next);
            }}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title={soundSettings.enabled ? 'Mute Sounds' : 'Unmute Sounds'}
          >
            {soundSettings.enabled ? (
              <Volume2 className="w-4 h-4 text-blue-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Panel Toggle Button for Small Laptops */}
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer text-slate-600 border border-slate-200"
            title={isPanelOpen ? "Hide Entries Panel (Give more room to wheel)" : "Show Entries Panel"}
          >
            {isPanelOpen ? (
              <PanelRightClose className="w-4 h-4 text-blue-600" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline text-xs font-semibold">
              {isPanelOpen ? "Hide Panel" : "Entries"}
            </span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </header>

      {/* 2. Main Studio Content Area - Always Side-by-Side with Collapsible Panel */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        {/* Left / Center Area: Title & Big Wheel */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-between p-2 sm:p-4 bg-gradient-to-b from-[#EBF2F7] to-[#E2E8F0] overflow-y-auto">
          {/* Wheel Selector Tabs at top of canvas area */}
          <div className="w-full max-w-xl flex flex-wrap items-center justify-between gap-2 mb-1 shrink-0">
            {/* Wheel Title & Role Selector */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentWheel.name}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight bg-transparent hover:bg-white/60 focus:bg-white border-b border-transparent focus:border-blue-500 rounded px-1.5 py-0.5 outline-none transition-all uppercase"
                title="Click to rename wheel"
              />
              <select
                value={currentWheel.role}
                onChange={(e) => handleRoleChange(e.target.value as WheelRole)}
                className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-700 shadow-xs cursor-pointer outline-none"
                title="Select role for this wheel"
              >
                <option value="1st">1st Place</option>
                <option value="2nd">2nd Place</option>
                <option value="3rd">3rd Place</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Quick Wheel Switcher Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-white/80 backdrop-blur-xs rounded-lg border border-slate-200 shadow-xs">
              {wheels.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onSelectWheel(w.id)}
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                    w.id === activeWheelId
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {w.role.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Wheel Canvas - Scales cleanly to never overflow or get hidden */}
          <div className="flex-1 min-h-0 w-full py-1 flex items-center justify-center">
            <WheelCanvas
              slices={currentWheel.slices}
              isSpinning={isSpinning}
              onSpinStart={onSpinStart}
              onSpinEnd={handleStudioSpinEnd}
              pointerPosition="right" // Image 1 has needle on right
              size={420}
            />
          </div>

          {/* Bottom helper info */}
          <div className="text-center text-[11px] font-medium text-slate-500 mt-1 shrink-0">
            Press <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono text-[10px]">Enter</kbd> or click the wheel to spin
          </div>
        </div>

        {/* Right Side Panel: Entries & Results (Matches Image 1, Collapsible for Small Laptops) */}
        <aside
          className={`bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-sm transition-all duration-300 z-10 ${
            isPanelOpen ? 'w-72 sm:w-80 md:w-84' : 'w-0 overflow-hidden border-none'
          }`}
        >
          {/* Tabs: Entries vs Results */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50 shrink-0">
            <button
              onClick={() => setActiveTab('entries')}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'entries'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Entries</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {currentWheel.slices.length}
              </span>
            </button>
            {/* CSS Selector 4 */}
            <button
              onClick={() => setActiveTab('results')}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'results'
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Results</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {spinResults.length}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'entries' ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* CSS Selector 3: Toolbar with Shuffle, Sort, and responsive Actions dropdown */}
              <div className="p-2 sm:p-2.5 border-b border-slate-100 flex items-center justify-between gap-1 bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleShuffle}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
                    title="Shuffle words"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={handleSort}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
                    title="Sort words alphabetically"
                  >
                    <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sort</span>
                  </button>

                  {/* Dropdown Menu for More Options */}
                  <div className="relative">
                    <button
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                      className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 shadow-2xs transition-colors cursor-pointer flex items-center gap-0.5"
                      title="More tools (palette, list mode)"
                    >
                      <Palette className="w-3.5 h-3.5 text-amber-500" />
                      <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                    </button>

                    {showActionsMenu && (
                      <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                        <button
                          onClick={() => {
                            handleRandomizeColors();
                            setShowActionsMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Palette className="w-3.5 h-3.5 text-amber-500" />
                          <span>Re-roll Colors</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingBulk(!isEditingBulk);
                            setShowActionsMenu(false);
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-blue-600 font-semibold"
                        >
                          {isEditingBulk ? 'Switch to List' : 'Switch to Bulk'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingBulk(!isEditingBulk)}
                  className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer shrink-0"
                >
                  {isEditingBulk ? 'List Mode' : 'Bulk Edit'}
                </button>
              </div>

              {/* CSS Selector 2: Slices Limits Info */}
              <div className="px-3 py-1 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-[10px] sm:text-[11px] text-blue-900 font-medium shrink-0">
                <span>Maximum: {MAX_SLICES} words</span>
                <span className="font-bold">
                  {currentWheel.slices.length}/{MAX_SLICES}
                </span>
              </div>

              {/* CSS Selector 1: Word List / Bulk Edit Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-2.5">
                {isEditingBulk ? (
                  <div className="h-full flex flex-col">
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="Enter one word per line (up to 50)..."
                      className="flex-1 w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg outline-none focus:border-blue-500 resize-none"
                    />
                    <div className="flex justify-end gap-2 mt-2 shrink-0">
                      <button
                        onClick={() => setIsEditingBulk(false)}
                        className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleApplyBulkText}
                        className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-xs"
                      >
                        Apply Words
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {currentWheel.slices.map((slice, index) => (
                      <div
                        key={slice.id}
                        className="flex items-center gap-1.5 py-1 px-1.5 bg-white border border-slate-200 rounded-md hover:border-blue-300 transition-colors shadow-2xs group"
                      >
                        {/* Slice Color Picker */}
                        <div className="relative shrink-0 w-5 h-5 rounded overflow-hidden border border-slate-300 shadow-2xs">
                          <input
                            type="color"
                            value={slice.color}
                            onChange={(e) => handleUpdateSliceColor(slice.id, e.target.value)}
                            className="absolute -inset-2 w-9 h-9 cursor-pointer"
                            title="Pick color for this slice"
                          />
                        </div>

                        {/* Slice Word Input */}
                        <input
                          type="text"
                          value={slice.text}
                          onChange={(e) => handleUpdateSliceText(slice.id, e.target.value)}
                          className="flex-1 text-[11px] sm:text-xs font-bold text-slate-800 bg-transparent outline-none focus:text-blue-600 uppercase"
                          placeholder={`Word ${index + 1}`}
                        />

                        {/* Delete Word Button */}
                        <button
                          onClick={() => handleDeleteSlice(slice.id)}
                          disabled={currentWheel.slices.length <= 2}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-20 p-0.5 rounded transition-colors cursor-pointer"
                          title="Delete word"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Word Button */}
              {!isEditingBulk && (
                <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                  <button
                    onClick={handleAddWord}
                    disabled={currentWheel.slices.length >= MAX_SLICES}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Word ({MAX_SLICES - currentWheel.slices.length} left)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 overflow-y-auto">
              {spinResults.length === 0 ? (
                <div className="my-auto text-center text-slate-400 text-xs">
                  No spin results yet. Spin the wheel to record winning words!
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Recent Winning Slices</span>
                    <button
                      onClick={() => setSpinResults([])}
                      className="text-rose-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  {spinResults.map((res, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between"
                    >
                      <span>{res}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Result #{spinResults.length - i}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Wheel Management (+ Add wheel dropdown matching Image 1) */}
          <div className="p-3 border-t border-slate-200 bg-white relative">
            <div className="relative">
              <button
                onClick={() => setShowAddWheelMenu(!showAddWheelMenu)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>Add or Switch Wheel</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {showAddWheelMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-40 py-1 text-xs">
                  <button
                    onClick={() => {
                      onCreateWheel('1st', '1ST GRADE TIE');
                      setShowAddWheelMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold">Create 1st Place Wheel</span>
                    <span className="text-[10px] text-slate-400">1st Grade</span>
                  </button>
                  <button
                    onClick={() => {
                      onCreateWheel('2nd', '2ND GRADE TIE');
                      setShowAddWheelMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold">Create 2nd Place Wheel</span>
                    <span className="text-[10px] text-slate-400">2nd Grade</span>
                  </button>
                  <button
                    onClick={() => {
                      onCreateWheel('3rd', '3RD GRADE TIE');
                      setShowAddWheelMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold">Create 3rd Place Wheel</span>
                    <span className="text-[10px] text-slate-400">3rd Grade</span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      onCreateWheel('custom', 'CUSTOM WHEEL');
                      setShowAddWheelMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 font-semibold text-blue-600"
                  >
                    + Blank Custom Wheel
                  </button>
                </div>
              )}
            </div>

            {/* Footer version indicator from Image 1 */}
            <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 px-1">
              <span>Version 440</span>
              <span className="hover:underline cursor-pointer">Salto Ángel 2026</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Customize Settings Modal */}
      {isCustomizing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-4">
              Wheel & Sound Customization
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block mb-1 text-slate-500">Tick Sound Effect</label>
                <select
                  value={soundSettings.tickSound}
                  onChange={(e) => {
                    const next = { ...soundSettings, tickSound: e.target.value as any };
                    onUpdateSoundSettings(next);
                    audioManager.setTickType(e.target.value as any);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="click">Mechanical Click (Default)</option>
                  <option value="wooden">Wooden Peg Click</option>
                  <option value="electronic">Electronic Beep</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-500">Fanfare Celebration</label>
                <select
                  value={soundSettings.fanfare}
                  onChange={(e) => {
                    const next = { ...soundSettings, fanfare: e.target.value as any };
                    onUpdateSoundSettings(next);
                    audioManager.setFanfareType(e.target.value as any);
                  }}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="trumpet">Trumpet Fanfare (Default)</option>
                  <option value="synth">Synth Chime</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span>Speak Winning Word Aloud</span>
                <input
                  type="checkbox"
                  checked={soundSettings.announceWinnerVoice}
                  onChange={(e) => {
                    const next = { ...soundSettings, announceWinnerVoice: e.target.checked };
                    onUpdateSoundSettings(next);
                    audioManager.setSpeechEnabled(e.target.checked);
                  }}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsCustomizing(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
