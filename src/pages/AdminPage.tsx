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
  type SolverHintStep,
} from '@sudobility/sudojo_types';
import { useSudoku } from '@sudobility/sudojo_lib';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { useSudojoClient } from '@/hooks/useSudojoClient';
import { useHint } from '@/hooks/useHint';


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

// Processing state machine
type ProcessingState =
  | { type: 'IDLE' }
  | { type: 'FETCHING_BOARDS'; techniqueId: TechniqueId }
  | { type: 'LOADING_BOARD'; board: Board; techniqueId: TechniqueId; boardIndex: number; boards: Board[] }
  | { type: 'GETTING_HINT'; board: Board; techniqueId: TechniqueId; boardIndex: number; boards: Board[]; savedForThisBoard: boolean }
  | { type: 'APPLYING_HINT'; board: Board; techniqueId: TechniqueId; boardIndex: number; boards: Board[]; savedForThisBoard: boolean }
  | { type: 'NEXT_BOARD'; techniqueId: TechniqueId; boardIndex: number; boards: Board[] }
  | { type: 'NEXT_TECHNIQUE' }
  | { type: 'DONE' };

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
  const [progress, setProgress] = useState<string>('');
  const abortRef = useRef(false);

  // Processing state machine
  const [processingState, setProcessingState] = useState<ProcessingState>({ type: 'IDLE' });
  const localCountsRef = useRef<Record<number, number>>({});
  const techniqueIndexRef = useRef(0);
  const iterationCountRef = useRef(0);
  const MAX_ITERATIONS = 200;

  // Use the game hooks - this is what the game uses!
  const {
    play,
    isCompleted,
    loadBoard,
    getInputString,
    getPencilmarksString,
    applyHintData,
  } = useSudoku();

  // Get current board state for the hint hook
  const puzzle = play?.board ?
    play.board.cells.map(c => c.given !== null ? String(c.given) : '0').join('') : '';

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

  // Save example to API
  const saveExample = useCallback(
    async (
      board: string,
      pencilmarks: string | null,
      solution: string,
      techniqueId: TechniqueId,
      hintStep: SolverHintStep,
      sourceBoardUuid: string
    ): Promise<boolean> => {
      if (!auth.accessToken) return false;

      try {
        const response = await fetch(`${config.baseUrl}/api/v1/examples`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.accessToken}`,
          },
          body: JSON.stringify({
            board,
            pencilmarks,
            solution,
            techniques_bitfield: techniqueToBit(techniqueId),
            primary_technique: techniqueId,
            hint_data: JSON.stringify(hintStep),
            source_board_uuid: sourceBoardUuid,
          }),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    [config.baseUrl, auth.accessToken]
  );

  // Fetch boards with a specific technique
  const fetchBoardsWithTechnique = useCallback(
    async (techniqueId: TechniqueId, limit: number): Promise<Board[]> => {
      const bit = techniqueToBit(techniqueId);
      try {
        const response = await fetch(
          `${config.baseUrl}/api/v1/boards?technique_bit=${bit}&limit=${limit}`
        );
        if (!response.ok) return [];
        const result = await response.json();
        if (!result.success || !result.data) return [];
        return result.data as Board[];
      } catch {
        return [];
      }
    },
    [config.baseUrl]
  );

  // State machine: Handle FETCHING_BOARDS
  useEffect(() => {
    if (processingState.type !== 'FETCHING_BOARDS') return;
    if (abortRef.current) {
      setProcessingState({ type: 'DONE' });
      return;
    }

    const { techniqueId } = processingState;
    const techniqueName = getTechniqueName(techniqueId);
    setProgress(`Fetching boards for ${techniqueName}...`);

    fetchBoardsWithTechnique(techniqueId, 20).then(boards => {
      if (boards.length === 0) {
        setProgress(`No boards found for ${techniqueName}`);
        setProcessingState({ type: 'NEXT_TECHNIQUE' });
      } else {
        setProgress(`Found ${boards.length} boards for ${techniqueName}`);
        setProcessingState({
          type: 'LOADING_BOARD',
          board: boards[0]!,
          techniqueId,
          boardIndex: 0,
          boards,
        });
      }
    });
  }, [processingState, fetchBoardsWithTechnique]);

  // State machine: Handle LOADING_BOARD
  useEffect(() => {
    if (processingState.type !== 'LOADING_BOARD') return;
    if (abortRef.current) {
      setProcessingState({ type: 'DONE' });
      return;
    }

    const { board, techniqueId, boardIndex, boards } = processingState;
    setProgress(`Loading board ${boardIndex + 1}/${boards.length}...`);
    iterationCountRef.current = 0;

    // Load the board into useSudoku - this sets up the game state
    loadBoard(board.board, board.solution, { scramble: false });
    clearHint();

    // Move to getting hint state
    setProcessingState({
      type: 'GETTING_HINT',
      board,
      techniqueId,
      boardIndex,
      boards,
      savedForThisBoard: false,
    });
  }, [processingState, loadBoard, clearHint]);

  // State machine: Handle GETTING_HINT
  useEffect(() => {
    if (processingState.type !== 'GETTING_HINT') return;
    if (abortRef.current) {
      setProcessingState({ type: 'DONE' });
      return;
    }
    if (isHintLoading) return; // Wait for hint to load
    if (!play) return; // Wait for board to be loaded

    const { board, techniqueId, boardIndex, boards, savedForThisBoard } = processingState;
    iterationCountRef.current++;

    // Check if puzzle is completed
    if (isCompleted) {
      setProgress(`Board ${boardIndex + 1}/${boards.length} completed`);
      setProcessingState({
        type: 'NEXT_BOARD',
        techniqueId,
        boardIndex,
        boards,
      });
      return;
    }

    // Check iteration limit
    if (iterationCountRef.current > MAX_ITERATIONS) {
      setProgress(`Max iterations reached for board ${boardIndex + 1}`);
      setProcessingState({
        type: 'NEXT_BOARD',
        techniqueId,
        boardIndex,
        boards,
      });
      return;
    }

    // If we already saved an example for this board, move to next
    if (savedForThisBoard) {
      setProcessingState({
        type: 'NEXT_BOARD',
        techniqueId,
        boardIndex,
        boards,
      });
      return;
    }

    // If we already have enough examples, move to next technique
    const currentCount = localCountsRef.current[techniqueId] || 0;
    if (currentCount >= TARGET_PER_TECHNIQUE) {
      setProcessingState({ type: 'NEXT_TECHNIQUE' });
      return;
    }

    // Request a hint if we don't have one
    if (!hint && !isHintLoading && !hintError) {
      setProgress(`Getting hint for board ${board.uuid.slice(0, 8)}...`);
      getHint();
      return;
    }

    // Handle hint error
    if (hintError) {
      console.warn('Hint error:', hintError);
      setProcessingState({
        type: 'NEXT_BOARD',
        techniqueId,
        boardIndex,
        boards,
      });
      return;
    }

    // Process the hint if we have one
    if (hint) {
      const hintTechniqueId = TECHNIQUE_TITLE_TO_ID[hint.title];

      // Check if this hint matches our target technique
      if (hintTechniqueId === techniqueId) {
        // Save the example with current board state (pre-hint)
        const currentBoard = play.board.cells.map(c => {
          if (c.given !== null) return String(c.given);
          if (c.input !== null) return String(c.input);
          return '0';
        }).join('');

        const pencilmarks = getPencilmarksString();

        setProgress(`Saving ${hint.title} example...`);
        saveExample(
          currentBoard,
          pencilmarks || null,
          board.solution,
          techniqueId,
          hint,
          board.uuid
        ).then(saved => {
          if (saved) {
            const newCount = (localCountsRef.current[techniqueId] || 0) + 1;
            localCountsRef.current[techniqueId] = newCount;
            setCounts({ ...localCountsRef.current });
            setProgress(`Saved ${hint.title} (${newCount}/${TARGET_PER_TECHNIQUE})`);
          }

          // Apply the hint and continue
          setProcessingState({
            type: 'APPLYING_HINT',
            board,
            techniqueId,
            boardIndex,
            boards,
            savedForThisBoard: saved,
          });
        });
        return;
      }

      // Hint doesn't match target - apply it and continue looking
      setProcessingState({
        type: 'APPLYING_HINT',
        board,
        techniqueId,
        boardIndex,
        boards,
        savedForThisBoard: false,
      });
    }
  }, [processingState, play, isCompleted, hint, isHintLoading, hintError, getHint, getPencilmarksString, saveExample]);

  // State machine: Handle APPLYING_HINT
  useEffect(() => {
    if (processingState.type !== 'APPLYING_HINT') return;
    if (abortRef.current) {
      setProcessingState({ type: 'DONE' });
      return;
    }
    if (!hint) return; // Wait for hint

    const { board, techniqueId, boardIndex, boards, savedForThisBoard } = processingState;

    // Apply the hint - this is exactly what SudokuGame does!
    const hintData = applyHint();
    if (hintData) {
      applyHintData(hintData.user, hintData.pencilmarks, hintData.autoPencilmarks);
    }

    // Small delay then continue getting hints
    setTimeout(() => {
      setProcessingState({
        type: 'GETTING_HINT',
        board,
        techniqueId,
        boardIndex,
        boards,
        savedForThisBoard,
      });
    }, 50);
  }, [processingState, hint, applyHint, applyHintData]);

  // State machine: Handle NEXT_BOARD
  useEffect(() => {
    if (processingState.type !== 'NEXT_BOARD') return;
    if (abortRef.current) {
      setProcessingState({ type: 'DONE' });
      return;
    }

    const { techniqueId, boardIndex, boards } = processingState;
    const nextIndex = boardIndex + 1;

    // Check if we have enough examples
    const currentCount = localCountsRef.current[techniqueId] || 0;
    if (currentCount >= TARGET_PER_TECHNIQUE) {
      setProcessingState({ type: 'NEXT_TECHNIQUE' });
      return;
    }

    // Check if there are more boards
    if (nextIndex >= boards.length) {
      setProcessingState({ type: 'NEXT_TECHNIQUE' });
      return;
    }

    // Load next board
    clearHint();
    setProcessingState({
      type: 'LOADING_BOARD',
      board: boards[nextIndex]!,
      techniqueId,
      boardIndex: nextIndex,
      boards,
    });
  }, [processingState, clearHint]);

  // State machine: Handle NEXT_TECHNIQUE
  useEffect(() => {
    if (processingState.type !== 'NEXT_TECHNIQUE') return;
    if (abortRef.current) {
      setProcessingState({ type: 'DONE' });
      return;
    }

    // Find next technique that needs examples
    let nextTechIndex = techniqueIndexRef.current + 1;
    while (nextTechIndex < TECHNIQUE_ORDER.length) {
      const techniqueId = TECHNIQUE_ORDER[nextTechIndex]!;
      const currentCount = localCountsRef.current[techniqueId] || 0;
      if (currentCount < TARGET_PER_TECHNIQUE) {
        break;
      }
      nextTechIndex++;
    }

    if (nextTechIndex >= TECHNIQUE_ORDER.length) {
      setProcessingState({ type: 'DONE' });
      return;
    }

    techniqueIndexRef.current = nextTechIndex;
    const techniqueId = TECHNIQUE_ORDER[nextTechIndex]!;
    clearHint();
    setProcessingState({
      type: 'FETCHING_BOARDS',
      techniqueId,
    });
  }, [processingState, clearHint]);

  // State machine: Handle DONE
  useEffect(() => {
    if (processingState.type !== 'DONE') return;
    setProgress(abortRef.current ? 'Stopped' : 'Done!');
    setCounts({ ...localCountsRef.current });
  }, [processingState]);

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

    techniqueIndexRef.current = startIndex;
    const techniqueId = TECHNIQUE_ORDER[startIndex]!;
    setProcessingState({
      type: 'FETCHING_BOARDS',
      techniqueId,
    });
  }, [counts, auth.accessToken]);

  const handleStopCreating = useCallback(() => {
    abortRef.current = true;
    setProgress('Stopping...');
  }, []);

  const isCreating = processingState.type !== 'IDLE' && processingState.type !== 'DONE';

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
