import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MasterDetailLayout,
  MasterListItem,
  Text,
  Button,
} from '@sudobility/components';
import {
  TechniqueId,
  TECHNIQUE_TITLE_TO_ID,
  techniqueToBit,
  type Board,
} from '@sudobility/sudojo_types';
import { useSudoku } from '@sudobility/sudojo_lib';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { useSudojoClient } from '@/hooks/useSudojoClient';
import { useHint, type HintReceivedData } from '@/hooks/useHint';


const TARGET_PER_TECHNIQUE = 20;

// All technique IDs sorted by difficulty (higher ID = more difficult, descending order)
const TECHNIQUE_ORDER: TechniqueId[] = Object.values(TECHNIQUE_TITLE_TO_ID)
  .sort((a, b) => b - a); // Descending: hardest first

// Get technique name from ID
function getTechniqueName(techniqueId: number): string {
  for (const [name, id] of Object.entries(TECHNIQUE_TITLE_TO_ID)) {
    if (id === techniqueId) {
      return name;
    }
  }
  return `Technique ${techniqueId}`;
}

export default function AdminPage() {
  const { section } = useParams<{ section: string }>();
  const { t } = useTranslation();
  const { navigate } = useLocalizedNavigate();
  const { config, auth } = useSudojoClient();

  const [mobileViewOverride, setMobileViewOverride] = useState<'navigation' | 'content' | null>(null);
  const mobileView = mobileViewOverride ?? (section ? 'content' : 'navigation');

  // Example counts state
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const abortRef = useRef(false);

  // Processing state
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardIndex, setBoardIndex] = useState(0);
  const [targetTechnique, setTargetTechnique] = useState<TechniqueId | null>(null);
  const [savedForBoard, setSavedForBoard] = useState(false);
  const localCountsRef = useRef<Record<number, number>>({});
  const iterationCountRef = useRef(0);
  const [isProcessingHint, setIsProcessingHint] = useState(false); // Prevent concurrent hint requests
  const MAX_ITERATIONS = 200;

  // Use the game hooks
  const {
    play,
    isCompleted,
    loadBoard,
    getInputString,
    getPencilmarksString,
    applyHintData,
  } = useSudoku();

  // Get current board state for the hint hook
  const puzzle = play?.board
    ? play.board.cells.map(c => c.given !== null ? String(c.given) : '0').join('')
    : '';

  // Hint received callback - this intercepts hints before state updates
  const handleHintReceived = useCallback((data: HintReceivedData) => {
    const hintTechniqueId = TECHNIQUE_TITLE_TO_ID[data.hint.title];

    console.log('[AdminPage] onHintReceived:', {
      hintTitle: data.hint.title,
      hintTechniqueId,
      targetTechnique,
      targetTechniqueName: targetTechnique ? getTechniqueName(targetTechnique) : '',
      match: hintTechniqueId === targetTechnique,
      savedForBoard,
      currentBoard: currentBoard?.uuid?.slice(0, 8),
    });

    if (!targetTechnique || !currentBoard || savedForBoard) {
      console.log('[AdminPage] onHintReceived: skipping - no target/board or already saved');
      return;
    }

    if (hintTechniqueId !== targetTechnique) {
      console.log('[AdminPage] onHintReceived: technique does not match, continuing');
      return;
    }

    // Check if we still need examples for this technique
    const currentCount = localCountsRef.current[targetTechnique] || 0;
    if (currentCount >= TARGET_PER_TECHNIQUE) return;

    // Mark as saved immediately to stop processing this board
    setSavedForBoard(true);

    // Get current board state (pre-hint) to save
    const boardString = play?.board
      ? play.board.cells.map(c => {
          if (c.given !== null) return String(c.given);
          if (c.input !== null) return String(c.input);
          return '0';
        }).join('')
      : '';
    const pencilmarks = getPencilmarksString();

    setProgress(`Saving ${data.hint.title} example...`);

    // Save the example (async, but we've already stopped processing)
    fetch(`${config.baseUrl}/api/v1/examples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.accessToken}`,
      },
      body: JSON.stringify({
        board: boardString,
        pencilmarks: pencilmarks || null,
        solution: currentBoard.solution,
        techniques_bitfield: techniqueToBit(targetTechnique),
        primary_technique: targetTechnique,
        hint_data: JSON.stringify(data.hint),
        source_board_uuid: currentBoard.uuid,
      }),
    }).then(response => {
      if (response.ok) {
        const newCount = (localCountsRef.current[targetTechnique] || 0) + 1;
        localCountsRef.current[targetTechnique] = newCount;
        setCounts({ ...localCountsRef.current });
        setProgress(`Saved ${data.hint.title} (${newCount}/${TARGET_PER_TECHNIQUE})`);
      }
    }).catch(err => {
      console.error('Failed to save example:', err);
    });
  }, [targetTechnique, currentBoard, savedForBoard, play, getPencilmarksString, config.baseUrl, auth.accessToken]);

  const {
    hint,
    isLoading: isHintLoading,
    error: hintError,
    getHint,
    applyHint,
    clearHint,
  } = useHint({
    puzzle,
    userInput: getInputString(),
    pencilmarks: getPencilmarksString(),
    autoPencilmarks: play?.settings.autoPencilmarks ?? true,
    onHintReceived: handleHintReceived,
  });

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.baseUrl}/api/v1/examples/counts`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const countsMap: Record<number, number> = {};
          for (const [key, value] of Object.entries(data.data as Record<string, number>)) {
            countsMap[parseInt(key, 10)] = value;
          }
          setCounts(countsMap);
        }
      }
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [config.baseUrl]);

  useEffect(() => {
    if (section === 'examples') {
      fetchCounts();
    }
  }, [section, fetchCounts]);

  const handleSectionSelect = useCallback(
    (sectionId: string) => {
      setMobileViewOverride('content');
      navigate(`/admin/${sectionId}`);
    },
    [navigate]
  );

  const handleBackToNavigation = useCallback(() => {
    setMobileViewOverride('navigation');
    navigate('/admin');
  }, [navigate]);

  // Fetch boards with a specific technique
  const fetchBoardsWithTechnique = useCallback(
    async (techniqueId: TechniqueId, limit: number): Promise<Board[]> => {
      const bit = techniqueToBit(techniqueId);
      const techniqueName = getTechniqueName(techniqueId);
      console.log('[AdminPage] Fetching boards for:', { techniqueId, techniqueName, bit: bit.toString(16) });
      try {
        const response = await fetch(
          `${config.baseUrl}/api/v1/boards?technique_bit=${bit}&limit=${limit}`
        );
        if (!response.ok) return [];
        const result = await response.json();
        if (!result.success || !result.data) return [];
        console.log('[AdminPage] Fetched boards:', result.data.length);
        return result.data as Board[];
      } catch {
        return [];
      }
    },
    [config.baseUrl]
  );

  // Main processing effect - drives the state machine
  useEffect(() => {
    if (!isCreating || abortRef.current) return;
    if (!targetTechnique) return;

    // Check if we have enough examples for current technique
    const currentCount = localCountsRef.current[targetTechnique] || 0;
    if (currentCount >= TARGET_PER_TECHNIQUE) {
      // Move to next technique
      const currentIndex = TECHNIQUE_ORDER.indexOf(targetTechnique);
      let nextIndex = currentIndex + 1;
      while (nextIndex < TECHNIQUE_ORDER.length) {
        const nextTech = TECHNIQUE_ORDER[nextIndex]!;
        if ((localCountsRef.current[nextTech] || 0) < TARGET_PER_TECHNIQUE) {
          break;
        }
        nextIndex++;
      }

      if (nextIndex >= TECHNIQUE_ORDER.length) {
        setIsCreating(false);
        setProgress('Done!');
        return;
      }

      const nextTechnique = TECHNIQUE_ORDER[nextIndex]!;
      console.log('[AdminPage] Moving to next technique:', { nextTechnique, name: getTechniqueName(nextTechnique) });
      setTargetTechnique(nextTechnique);
      setBoards([]);
      setBoardIndex(0);
      setCurrentBoard(null);
      setSavedForBoard(false);
      clearHint();

      setProgress(`Fetching boards for ${getTechniqueName(nextTechnique)}...`);
      fetchBoardsWithTechnique(nextTechnique, 20).then(newBoards => {
        if (newBoards.length === 0) {
          setProgress(`No boards found for ${getTechniqueName(nextTechnique)}`);
        } else {
          setBoards(newBoards);
          setBoardIndex(0);
        }
      });
      return;
    }

    // Need to fetch boards if we don't have any
    if (boards.length === 0) {
      setProgress(`Fetching boards for ${getTechniqueName(targetTechnique)}...`);
      fetchBoardsWithTechnique(targetTechnique, 20).then(newBoards => {
        if (newBoards.length === 0) {
          setProgress(`No boards found for ${getTechniqueName(targetTechnique)}`);
          // Move to next technique
          const currentIndex = TECHNIQUE_ORDER.indexOf(targetTechnique);
          if (currentIndex + 1 < TECHNIQUE_ORDER.length) {
            setTargetTechnique(TECHNIQUE_ORDER[currentIndex + 1]!);
          } else {
            setIsCreating(false);
            setProgress('Done!');
          }
        } else {
          setBoards(newBoards);
        }
      });
      return;
    }

    // Need to load a board if we don't have one
    if (!currentBoard && boards.length > 0) {
      if (boardIndex >= boards.length) {
        // No more boards, move to next technique
        const currentIndex = TECHNIQUE_ORDER.indexOf(targetTechnique);
        if (currentIndex + 1 < TECHNIQUE_ORDER.length) {
          setTargetTechnique(TECHNIQUE_ORDER[currentIndex + 1]!);
          setBoards([]);
          setBoardIndex(0);
        } else {
          setIsCreating(false);
          setProgress('Done!');
        }
        return;
      }

      const board = boards[boardIndex]!;
      setCurrentBoard(board);
      setSavedForBoard(false);
      iterationCountRef.current = 0;
      setIsProcessingHint(false); // Reset for new board
      setProgress(`Loading board ${boardIndex + 1}/${boards.length}...`);
      loadBoard(board.board, board.solution, { scramble: false });
      clearHint();
      return;
    }
  }, [isCreating, targetTechnique, boards, boardIndex, currentBoard, fetchBoardsWithTechnique, loadBoard, clearHint]);

  // Effect to handle hint fetching and applying
  // isHintLoading prevents concurrent API calls
  // isProcessingHint prevents re-applying during the wait period after apply
  useEffect(() => {
    if (!isCreating || abortRef.current) return;
    if (!currentBoard || !play) return;
    if (isHintLoading) return; // Wait for API call to complete
    if (isProcessingHint) return; // Wait for apply+delay to complete

    // Check if we should move to next board
    if (savedForBoard || isCompleted || iterationCountRef.current > MAX_ITERATIONS || hintError) {
      // Move to next board
      setBoardIndex(prev => prev + 1);
      setCurrentBoard(null);
      setSavedForBoard(false);
      clearHint();
      return;
    }

    // If we have a hint, check technique and apply if not target
    if (hint) {
      // Compare strings directly - hint.title is a string like "ALS Chain"
      const targetTechniqueName = targetTechnique ? getTechniqueName(targetTechnique) : '';

      console.log('[AdminPage] Hint received:', {
        hintTitle: hint.title,
        targetTechnique,
        targetTechniqueName,
        match: hint.title === targetTechniqueName,
        savedForBoard,
        boardIndex,
        iterationCount: iterationCountRef.current,
      });

      // If this hint matches target technique, don't apply - move to next board
      // (onHintReceived should have already set savedForBoard, but double-check here)
      if (hint.title === targetTechniqueName) {
        console.log('[AdminPage] MATCH! Moving to next board');
        // Move to next board without applying
        setBoardIndex(prev => prev + 1);
        setCurrentBoard(null);
        setSavedForBoard(false);
        clearHint();
        return;
      }

      // Not the target technique - apply hint and continue
      setIsProcessingHint(true);
      const hintData = applyHint();
      if (hintData) {
        applyHintData(hintData.user, hintData.pencilmarks, hintData.autoPencilmarks);
      }
      // Wait for state to settle, then allow next hint request
      setTimeout(() => {
        if (!abortRef.current && isCreating) {
          iterationCountRef.current++;
          setIsProcessingHint(false); // This triggers effect re-run
        }
      }, 100);
      return;
    }

    // No hint yet, request one (isHintLoading will block concurrent calls)
    if (!hint && !hintError) {
      setProgress(`Getting hint for board ${currentBoard.uuid.slice(0, 8)}...`);
      getHint(); // This sets isHintLoading=true, then isHintLoading=false when done
    }
  }, [isCreating, currentBoard, play, hint, isHintLoading, hintError, savedForBoard, isCompleted, isProcessingHint, targetTechnique, applyHint, applyHintData, getHint, clearHint]);

  // Start processing
  const handleCreateExamples = useCallback(() => {
    if (!auth.accessToken) {
      setProgress('Error: Not authenticated');
      return;
    }

    abortRef.current = false;
    localCountsRef.current = { ...counts };

    // Find first technique that needs examples
    let startIndex = 0;
    while (startIndex < TECHNIQUE_ORDER.length) {
      const techniqueId = TECHNIQUE_ORDER[startIndex]!;
      const currentCount = localCountsRef.current[techniqueId] || 0;
      if (currentCount < TARGET_PER_TECHNIQUE) {
        break;
      }
      startIndex++;
    }

    if (startIndex >= TECHNIQUE_ORDER.length) {
      setProgress('All techniques have enough examples!');
      return;
    }

    const techniqueId = TECHNIQUE_ORDER[startIndex]!;
    console.log('[AdminPage] Starting with technique:', { techniqueId, name: getTechniqueName(techniqueId), startIndex });
    console.log('[AdminPage] TECHNIQUE_ORDER:', TECHNIQUE_ORDER.map(id => ({ id, name: getTechniqueName(id) })));
    setTargetTechnique(techniqueId);
    setBoards([]);
    setBoardIndex(0);
    setCurrentBoard(null);
    setSavedForBoard(false);
    setIsProcessingHint(false);
    setIsCreating(true);
  }, [counts, auth.accessToken]);

  const handleStopCreating = useCallback(() => {
    abortRef.current = true;
    setIsCreating(false);
    setProgress('Stopped');
  }, []);

  // Calculate totals
  const totalCaptured = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const totalNeeded = TECHNIQUE_ORDER.length * TARGET_PER_TECHNIQUE;

  // Admin sections
  const sections = [
    { id: 'examples', label: 'Examples', description: 'Technique example management' },
  ];

  const masterContent = (
    <div className="space-y-1">
      {sections.map(s => (
        <MasterListItem
          key={s.id}
          isSelected={section === s.id}
          onClick={() => handleSectionSelect(s.id)}
          label={s.label}
          description={s.description}
        />
      ))}
    </div>
  );

  const detailContent = section === 'examples' ? (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <Text weight="medium">
          Total: {totalCaptured} / {totalNeeded}
        </Text>
        {isLoading && <Text color="muted">Loading...</Text>}
      </div>

      {/* Progress message */}
      {progress && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Text size="sm">{progress}</Text>
        </div>
      )}

      {/* Technique list */}
      <div className="space-y-2">
        {TECHNIQUE_ORDER.map(techniqueId => {
          const count = counts[techniqueId] || 0;
          const isFull = count >= TARGET_PER_TECHNIQUE;
          return (
            <div
              key={techniqueId}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
            >
              <Text>{getTechniqueName(techniqueId)}</Text>
              <Text color={isFull ? 'success' : 'muted'}>
                {count} / {TARGET_PER_TECHNIQUE}
                {isFull && ' ✓'}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Create Examples CTA */}
      <div className="pt-4 border-t space-y-2">
        {isCreating ? (
          <Button onClick={handleStopCreating} variant="destructive" className="w-full">
            Stop
          </Button>
        ) : (
          <Button onClick={handleCreateExamples} disabled={isLoading} className="w-full">
            Create Examples
          </Button>
        )}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-center">
      <Text color="muted">Select a section</Text>
    </div>
  );

  return (
    <div className="py-8">
      <MasterDetailLayout
        masterTitle={t('nav.admin', 'Admin')}
        masterContent={masterContent}
        detailContent={detailContent}
        detailTitle={section === 'examples' ? 'Examples' : undefined}
        mobileView={mobileView}
        onBackToNavigation={handleBackToNavigation}
        masterWidth={280}
        stickyMaster
        stickyTopOffset={80}
      />
    </div>
  );
}
