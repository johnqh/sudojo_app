import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MasterDetailLayout,
  MasterListItem,
  Text,
  Button,
  Switch,
} from '@sudobility/components';
import { Section } from '@/components/layout/Section';
import {
  TechniqueId,
  TECHNIQUE_TITLE_TO_ID,
  techniqueToBit,
  type Board,
  type Level,
  type TechniquePracticeCountItem,
  type TechniqueExample,
} from '@sudobility/sudojo_types';
import { useSudoku, useHint, type HintReceivedData } from '@sudobility/sudojo_lib';
import { useLocalizedNavigate } from '@/hooks/useLocalizedNavigate';
import { useApi } from '@/context/apiContextDef';
import { createSudojoClient } from '@sudobility/sudojo_client';


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
  const { networkClient, baseUrl, token } = useApi();

  // Log once on mount to verify latest code is running
  useEffect(() => {
    console.log('[AdminPage] Component mounted - DEBUG VERSION 2');
    console.log('[AdminPage] networkClient:', !!networkClient);
    console.log('[AdminPage] baseUrl:', baseUrl);
    console.log('[AdminPage] token present:', !!token);
  }, []);

  const [mobileViewOverride, setMobileViewOverride] = useState<'navigation' | 'content' | null>(null);
  const mobileView = mobileViewOverride ?? (section ? 'content' : 'navigation');

  // Example counts state
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const abortRef = useRef(false);

  // Boards section state
  const [totalBoards, setTotalBoards] = useState<number>(0);
  const [boardsWithoutTechniques, setBoardsWithoutTechniques] = useState<number>(0);
  const [isBoardsLoading, setIsBoardsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState<string>('');
  const [symmetrical, setSymmetrical] = useState(true);
  const [levels, setLevels] = useState<Level[]>([]);
  const generateAbortRef = useRef(false);

  // Techniques section state
  const [isTechniquesLoading, setIsTechniquesLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState<string>('');
  const [extractBoard, setExtractBoard] = useState<Board | null>(null);
  const [extractTechniquesBitfield, setExtractTechniquesBitfield] = useState<number>(0);
  const [isExtractProcessingHint, setIsExtractProcessingHint] = useState(false);
  const extractAbortRef = useRef(false);
  const extractIterationRef = useRef(0);
  const extractedCountRef = useRef(0);

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
  const MAX_PRACTICE_ATTEMPTS = 100; // Max solver attempts per example before skipping

  // Practices section state
  const [practiceCounts, setPracticeCounts] = useState<TechniquePracticeCountItem[]>([]);
  const [isPracticesLoading, setIsPracticesLoading] = useState(false);
  const [isGeneratingPractices, setIsGeneratingPractices] = useState(false);
  const [practicesProgress, setPracticesProgress] = useState<string>('');
  const generatePracticesAbortRef = useRef(false);
  const practiceIterationRef = useRef(0);
  const [practiceTargetTechnique, setPracticeTargetTechnique] = useState<TechniqueId | null>(null);
  const [practiceExamples, setPracticeExamples] = useState<TechniqueExample[]>([]);
  const [practiceExampleIndex, setPracticeExampleIndex] = useState(0);
  const [currentPracticeExample, setCurrentPracticeExample] = useState<TechniqueExample | null>(null);
  const [isPracticeProcessingHint, setIsPracticeProcessingHint] = useState(false);
  const practiceLocalCountsRef = useRef<Record<string, number>>({});

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
    console.log('[Practice] ===== HINT RECEIVED (onHintReceived callback) =====');
    console.log('[Practice] Hint title:', data.hint.title);
    console.log('[Practice] Hint technique ID:', TECHNIQUE_TITLE_TO_ID[data.hint.title]);
    console.log('[Practice] All hints count:', data.hints.length);
    console.log('[Practice] Board data user:', data.boardData.user?.substring(0, 30) + '...');
    console.log('[Practice] Board data pencilmarks:', data.boardData.pencilmarks?.substring(0, 50) || 'NONE');
    console.log('[Practice] ================================================');

    const hintTechniqueId = TECHNIQUE_TITLE_TO_ID[data.hint.title];

    // Handle extraction mode - accumulate techniques bitfield
    if (isExtracting && extractBoard && hintTechniqueId) {
      const bit = 1 << hintTechniqueId;
      setExtractTechniquesBitfield(prev => prev | bit);
      return;
    }

    // Handle examples mode
    if (!targetTechnique || !currentBoard || savedForBoard) {
      return;
    }

    if (hintTechniqueId !== targetTechnique) {
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
    fetch(`${baseUrl}/api/v1/examples`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
  }, [targetTechnique, currentBoard, savedForBoard, play, getPencilmarksString, baseUrl, token, isExtracting, extractBoard]);

  const {
    hint,
    hints,
    isLoading: isHintLoading,
    error: hintError,
    getHint,
    applyHint,
    clearHint,
  } = useHint({
    networkClient,
    baseUrl,
    token: token ?? '',
    puzzle,
    userInput: getInputString(),
    pencilmarks: getPencilmarksString(),
    autoPencilmarks: play?.settings.autoPencilmarks ?? true,
    onHintReceived: handleHintReceived,
  });

  // Debug effect: log whenever hint state changes
  useEffect(() => {
    console.log('[Practice] useHint state changed:', {
      hintTitle: hint?.title || 'NO HINT',
      hintsCount: hints?.length || 0,
      isHintLoading,
      hintError: hintError || 'NO ERROR',
      puzzleLength: puzzle.length,
      puzzlePreview: puzzle.substring(0, 20) + '...',
    });
  }, [hint, hints, isHintLoading, hintError, puzzle]);

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/v1/examples/counts`);
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
  }, [baseUrl]);

  useEffect(() => {
    if (section === 'examples') {
      fetchCounts();
    }
  }, [section, fetchCounts]);

  // Fetch practice counts
  const fetchPracticeCounts = useCallback(async () => {
    setIsPracticesLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/v1/practices/counts`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setPracticeCounts(data.data);
          // Initialize local counts ref
          const countsMap: Record<string, number> = {};
          for (const item of data.data) {
            countsMap[item.technique_uuid] = item.count;
          }
          practiceLocalCountsRef.current = countsMap;
        }
      }
    } catch (error) {
      console.error('Failed to fetch practice counts:', error);
    } finally {
      setIsPracticesLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (section === 'practices') {
      fetchPracticeCounts();
    }
  }, [section, fetchPracticeCounts]);

  // Fetch board counts for boards/techniques section
  const fetchBoardCounts = useCallback(async () => {
    setIsBoardsLoading(true);
    setIsTechniquesLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/v1/boards/counts`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setTotalBoards(data.data.total);
          setBoardsWithoutTechniques(data.data.withoutTechniques);
        }
      }
    } catch (error) {
      console.error('Failed to fetch board counts:', error);
    } finally {
      setIsBoardsLoading(false);
      setIsTechniquesLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    if (section === 'boards' || section === 'techniques') {
      fetchBoardCounts();
    }
  }, [section, fetchBoardCounts]);

  // Generate boards handler
  const handleGenerateBoards = useCallback(async () => {
    if (!token) {
      setGenerateProgress('Error: Not authenticated');
      return;
    }

    generateAbortRef.current = false;
    setGenerateProgress('Fetching levels...');
    setIsGenerating(true);

    const client = createSudojoClient(networkClient, baseUrl);

    // Fetch levels first
    let levelsList = levels;
    if (levelsList.length === 0) {
      try {
        const levelsResponse = await client.getLevels(token);
        if (levelsResponse.success && levelsResponse.data) {
          levelsList = levelsResponse.data;
          setLevels(levelsList);
        }
      } catch (err) {
        setGenerateProgress(`Error fetching levels: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsGenerating(false);
        return;
      }
    }

    if (levelsList.length === 0) {
      setGenerateProgress('Error: No levels found');
      setIsGenerating(false);
      return;
    }

    setGenerateProgress('Starting generation...');
    let count = 0;

    while (!generateAbortRef.current) {
      try {
        // Generate a new board
        setGenerateProgress(`Generating board ${count + 1}...`);
        const generateResponse = await client.solverGenerate(token, { symmetrical });

        if (!generateResponse.success || !generateResponse.data) {
          setGenerateProgress(`Error generating board: ${generateResponse.error || 'Unknown error'}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Response structure: data.board contains { level, techniques, board: { original, solution } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const boardData = generateResponse.data.board as any;
        const level = boardData.level as number;
        const techniquesBitfield = boardData.techniques as number;
        const original = boardData.board.original as string;
        const solution = (boardData.board.solution || '') as string;

        // Find level with matching index to get level_uuid
        const matchingLevel = levelsList.find(l => l.index === level);
        const levelUuid = matchingLevel?.uuid || null;

        // Save the board to the database
        setGenerateProgress(`Saving board ${count + 1}...`);
        const createResponse = await client.createBoard(token, {
          board: original,
          solution: solution,
          level_uuid: levelUuid,
          symmetrical: symmetrical,
          techniques: techniquesBitfield,
        });

        if (createResponse.success) {
          count++;
          setTotalBoards(prev => prev + 1);
          setGenerateProgress(`Generated ${count} boards (level ${level}, techniques: 0x${techniquesBitfield.toString(16)})`);
        } else {
          setGenerateProgress(`Error saving board: ${createResponse.error || 'Unknown error'}`);
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        setGenerateProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsGenerating(false);
    setGenerateProgress(`Stopped. Generated ${count} boards.`);
  }, [token, networkClient, baseUrl, symmetrical, levels]);

  // Stop generating handler
  const handleStopGenerating = useCallback(() => {
    generateAbortRef.current = true;
  }, []);

  // Fetch a board without techniques
  const fetchBoardWithoutTechniques = useCallback(async (): Promise<Board | null> => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/boards?techniques=0&limit=1`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.success && data.data && data.data.length > 0) {
        return data.data[0] as Board;
      }
      return null;
    } catch {
      return null;
    }
  }, [baseUrl]);

  // Update board's techniques field
  const updateBoardTechniques = useCallback(async (boardUuid: string, techniques: number) => {
    try {
      const response = await fetch(`${baseUrl}/api/v1/boards/${boardUuid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ techniques }),
      });
      await response.json();
      return response.ok;
    } catch {
      return false;
    }
  }, [baseUrl, token]);

  // Extract techniques handler - start the extraction process
  const handleExtractTechniques = useCallback(async () => {
    if (!token) {
      setExtractProgress('Error: Not authenticated');
      return;
    }

    extractAbortRef.current = false;
    extractedCountRef.current = 0;
    setExtractProgress('Starting extraction...');
    setIsExtracting(true);

    // Fetch first board
    const board = await fetchBoardWithoutTechniques();
    if (!board) {
      setExtractProgress('No boards without techniques found');
      setIsExtracting(false);
      return;
    }

    setExtractBoard(board);
    setExtractTechniquesBitfield(0);
    extractIterationRef.current = 0;
    setIsExtractProcessingHint(false);
    setExtractProgress(`Loading board ${board.uuid.slice(0, 8)}...`);
    loadBoard(board.board, board.solution, { scramble: false });
    clearHint();
  }, [token, fetchBoardWithoutTechniques, loadBoard, clearHint]);

  // Stop extraction handler
  const handleStopExtracting = useCallback(() => {
    extractAbortRef.current = true;
    setIsExtracting(false);
    setExtractBoard(null);
    setExtractProgress('Stopped');
  }, []);

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

  // Fetch boards with a specific technique (paginating until we find enough)
  const fetchBoardsWithTechnique = useCallback(
    async (techniqueId: TechniqueId, targetCount: number): Promise<Board[]> => {
      // Bit position IS the technique ID (bit 0 is unused)
      const bit = 1 << techniqueId;

      const matchingBoards: Board[] = [];
      let offset = 0;
      const batchSize = 100;
      const maxOffset = 10000; // Safety limit

      try {
        while (matchingBoards.length < targetCount && offset < maxOffset) {
          const response = await fetch(
            `${baseUrl}/api/v1/boards?limit=${batchSize}&offset=${offset}`
          );
          if (!response.ok) break;
          const result = await response.json();
          if (!result.success || !result.data || result.data.length === 0) break;

          const boards = result.data as Board[];

          // Filter client-side for boards with the target technique bit set
          for (const board of boards) {
            if (board.techniques && (board.techniques & bit) !== 0) {
              matchingBoards.push(board);
              if (matchingBoards.length >= targetCount) break;
            }
          }

          offset += batchSize;
        }

        return matchingBoards;
      } catch {
        return matchingBoards;
      }
    },
    [baseUrl]
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

      // If this hint matches target technique, don't apply - move to next board
      // (onHintReceived should have already set savedForBoard, but double-check here)
      if (hint.title === targetTechniqueName) {
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

  // Effect to handle extraction hint processing
  useEffect(() => {
    if (!isExtracting || extractAbortRef.current) return;
    if (!extractBoard || !play) return;
    if (isHintLoading) return;
    if (isExtractProcessingHint) return;

    // Check if board is completed - save techniques and move to next board
    if (isCompleted) {
      const finalBitfield = extractTechniquesBitfield;

      // Update the board's techniques field
      setExtractProgress(`Updating board ${extractBoard.uuid.slice(0, 8)} with techniques 0x${finalBitfield.toString(16)}...`);
      updateBoardTechniques(extractBoard.uuid, finalBitfield).then(async (success) => {
        if (success) {
          extractedCountRef.current++;
          setBoardsWithoutTechniques(prev => Math.max(0, prev - 1));
          setExtractProgress(`Extracted ${extractedCountRef.current} boards. Finding next board...`);
        } else {
          setExtractProgress(`Failed to update board ${extractBoard.uuid.slice(0, 8)}`);
        }

        // Fetch next board
        const nextBoard = await fetchBoardWithoutTechniques();
        if (!nextBoard || extractAbortRef.current) {
          setIsExtracting(false);
          setExtractBoard(null);
          setExtractProgress(`Done! Extracted techniques for ${extractedCountRef.current} boards.`);
          fetchBoardCounts(); // Refresh counts
          return;
        }

        // Load next board
        setExtractBoard(nextBoard);
        setExtractTechniquesBitfield(0);
        extractIterationRef.current = 0;
        setIsExtractProcessingHint(false);
        setExtractProgress(`Loading board ${nextBoard.uuid.slice(0, 8)}...`);
        loadBoard(nextBoard.board, nextBoard.solution, { scramble: false });
        clearHint();
      });
      return;
    }

    // Check iteration limit
    if (extractIterationRef.current > MAX_ITERATIONS || hintError) {
      setExtractProgress(`Skipping board ${extractBoard.uuid.slice(0, 8)} (error or max iterations)`);

      // Fetch next board
      fetchBoardWithoutTechniques().then(async (nextBoard) => {
        if (!nextBoard || extractAbortRef.current) {
          setIsExtracting(false);
          setExtractBoard(null);
          setExtractProgress(`Done! Extracted techniques for ${extractedCountRef.current} boards.`);
          fetchBoardCounts();
          return;
        }

        setExtractBoard(nextBoard);
        setExtractTechniquesBitfield(0);
        extractIterationRef.current = 0;
        setIsExtractProcessingHint(false);
        loadBoard(nextBoard.board, nextBoard.solution, { scramble: false });
        clearHint();
      });
      return;
    }

    // If we have a hint, apply it
    if (hint) {
      setIsExtractProcessingHint(true);
      const hintData = applyHint();
      if (hintData) {
        applyHintData(hintData.user, hintData.pencilmarks, hintData.autoPencilmarks);
      }
      setTimeout(() => {
        if (!extractAbortRef.current && isExtracting) {
          extractIterationRef.current++;
          setIsExtractProcessingHint(false);
        }
      }, 50);
      return;
    }

    // No hint yet, request one
    if (!hint && !hintError) {
      setExtractProgress(`Getting hint for board ${extractBoard.uuid.slice(0, 8)} (${extractIterationRef.current})...`);
      getHint();
    }
  }, [isExtracting, extractBoard, play, hint, isHintLoading, hintError, isCompleted, isExtractProcessingHint, extractTechniquesBitfield, updateBoardTechniques, fetchBoardWithoutTechniques, fetchBoardCounts, loadBoard, clearHint, applyHint, applyHintData, getHint]);

  // Start processing
  const handleCreateExamples = useCallback(() => {
    if (!token) {
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
    setTargetTechnique(techniqueId);
    setBoards([]);
    setBoardIndex(0);
    setCurrentBoard(null);
    setSavedForBoard(false);
    setIsProcessingHint(false);
    setIsCreating(true);
  }, [counts, token]);

  const handleStopCreating = useCallback(() => {
    abortRef.current = true;
    setIsCreating(false);
    setProgress('Stopped');
  }, []);

  // Fetch examples for a specific technique by primary_technique
  const fetchExamplesForTechnique = useCallback(
    async (techniqueId: TechniqueId): Promise<TechniqueExample[]> => {
      try {
        const response = await fetch(
          `${baseUrl}/api/v1/examples?technique=${techniqueId}`
        );
        if (!response.ok) return [];
        const result = await response.json();
        if (result.success && result.data) {
          return result.data as TechniqueExample[];
        }
        return [];
      } catch {
        return [];
      }
    },
    [baseUrl]
  );

  // Generate practices handler
  const handleGeneratePractices = useCallback(async () => {
    if (!token) {
      setPracticesProgress('Error: Not authenticated');
      return;
    }

    generatePracticesAbortRef.current = false;
    setPracticesProgress('Starting practice generation...');
    setIsGeneratingPractices(true);

    // Find first technique that needs practices
    let startTechnique: TechniquePracticeCountItem | null = null;
    for (const item of practiceCounts) {
      if (item.count < TARGET_PER_TECHNIQUE) {
        startTechnique = item;
        break;
      }
    }

    if (!startTechnique) {
      setPracticesProgress('All techniques have enough practices!');
      setIsGeneratingPractices(false);
      return;
    }

    // Find the TechniqueId for this technique by matching title
    const techniqueId = TECHNIQUE_TITLE_TO_ID[startTechnique.technique_title];
    if (!techniqueId) {
      setPracticesProgress(`Error: Unknown technique title "${startTechnique.technique_title}"`);
      setIsGeneratingPractices(false);
      return;
    }

    setPracticeTargetTechnique(techniqueId);
    setPracticeExamples([]);
    setPracticeExampleIndex(0);
    setCurrentPracticeExample(null);
    setIsPracticeProcessingHint(false);
    practiceIterationRef.current = 0;

    setPracticesProgress(`Fetching examples for ${startTechnique.technique_title}...`);
    const examples = await fetchExamplesForTechnique(techniqueId);
    if (examples.length === 0) {
      setPracticesProgress(`No examples found for ${startTechnique.technique_title}`);
      setIsGeneratingPractices(false);
      return;
    }

    setPracticeExamples(examples);
  }, [token, practiceCounts, fetchExamplesForTechnique]);

  // Stop generating practices
  const handleStopGeneratingPractices = useCallback(() => {
    generatePracticesAbortRef.current = true;
    setIsGeneratingPractices(false);
    setPracticeTargetTechnique(null);
    setPracticeExamples([]);
    setCurrentPracticeExample(null);
    setPracticesProgress('Stopped');
  }, []);

  // Delete all practices handler
  const handleDeleteAllPractices = useCallback(async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete ALL practices?')) return;

    setPracticesProgress('Deleting all practices...');
    try {
      const response = await fetch(`${baseUrl}/api/v1/practices?confirm=true`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPracticesProgress(`Deleted ${data.data?.deleted || 0} practices`);
        fetchPracticeCounts();
      } else {
        setPracticesProgress('Error deleting practices');
      }
    } catch (error) {
      setPracticesProgress(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [token, baseUrl, fetchPracticeCounts]);

  // Effect to handle practice generation - load example and process hints
  useEffect(() => {
    console.log('[Practice] First effect running:', {
      isGeneratingPractices,
      practiceTargetTechnique,
      practiceTargetTechniqueName: practiceTargetTechnique ? getTechniqueName(practiceTargetTechnique) : 'NONE',
      hasCurrentExample: !!currentPracticeExample,
      practiceExampleIndex,
      practiceExamplesLength: practiceExamples.length,
      currentPuzzleLength: puzzle.length,
      currentPuzzlePreview: puzzle.substring(0, 20) + '...',
    });
    if (!isGeneratingPractices || generatePracticesAbortRef.current) return;
    if (!practiceTargetTechnique) return;

    // Check if current technique has enough practices
    const currentTechniqueItem = practiceCounts.find(
      p => TECHNIQUE_TITLE_TO_ID[p.technique_title] === practiceTargetTechnique
    );
    const currentCount = currentTechniqueItem
      ? practiceLocalCountsRef.current[currentTechniqueItem.technique_uuid] || 0
      : 0;

    if (currentCount >= TARGET_PER_TECHNIQUE) {
      // Move to next technique
      const currentIndex = practiceCounts.findIndex(
        p => TECHNIQUE_TITLE_TO_ID[p.technique_title] === practiceTargetTechnique
      );
      let nextIndex = currentIndex + 1;
      while (nextIndex < practiceCounts.length) {
        const nextItem = practiceCounts[nextIndex];
        if (nextItem && (practiceLocalCountsRef.current[nextItem.technique_uuid] || 0) < TARGET_PER_TECHNIQUE) {
          break;
        }
        nextIndex++;
      }

      if (nextIndex >= practiceCounts.length) {
        setIsGeneratingPractices(false);
        setPracticesProgress('Done!');
        return;
      }

      const nextItem = practiceCounts[nextIndex]!;
      const nextTechniqueId = TECHNIQUE_TITLE_TO_ID[nextItem.technique_title];
      if (!nextTechniqueId) {
        setIsGeneratingPractices(false);
        setPracticesProgress('Error: Unknown technique');
        return;
      }

      setPracticeTargetTechnique(nextTechniqueId);
      setPracticeExamples([]);
      setPracticeExampleIndex(0);
      setCurrentPracticeExample(null);
      practiceIterationRef.current = 0;

      setPracticesProgress(`Fetching examples for ${nextItem.technique_title}...`);
      fetchExamplesForTechnique(nextTechniqueId).then(examples => {
        if (examples.length === 0) {
          setPracticesProgress(`No examples found for ${nextItem.technique_title}`);
        } else {
          setPracticeExamples(examples);
        }
      });
      return;
    }

    // Need to load an example if we don't have one
    if (!currentPracticeExample && practiceExamples.length > 0) {
      console.log('[Practice] Loading example - index:', practiceExampleIndex, 'total:', practiceExamples.length);
      if (practiceExampleIndex >= practiceExamples.length) {
        // No more examples, move to next technique
        const currentIndex = practiceCounts.findIndex(
          p => TECHNIQUE_TITLE_TO_ID[p.technique_title] === practiceTargetTechnique
        );
        if (currentIndex + 1 < practiceCounts.length) {
          const nextItem = practiceCounts[currentIndex + 1]!;
          const nextTechniqueId = TECHNIQUE_TITLE_TO_ID[nextItem.technique_title];
          if (nextTechniqueId) {
            setPracticeTargetTechnique(nextTechniqueId);
            setPracticeExamples([]);
            setPracticeExampleIndex(0);
          }
        } else {
          setIsGeneratingPractices(false);
          setPracticesProgress('Done!');
        }
        return;
      }

      const example = practiceExamples[practiceExampleIndex]!;
      console.log('[Practice] Loading example:', {
        exampleIndex: practiceExampleIndex,
        exampleUuid: example.uuid,
        exampleBoard: example.board.substring(0, 30) + '...',
        exampleBoardLength: example.board.length,
        exampleHasPencilmarks: !!example.pencilmarks,
        examplePencilmarksPreview: example.pencilmarks?.substring(0, 50) + '...',
        exampleSolution: example.solution?.substring(0, 30) + '...',
        targetTechnique: practiceTargetTechnique,
        targetTechniqueName: practiceTargetTechnique ? getTechniqueName(practiceTargetTechnique) : 'NONE',
      });
      setCurrentPracticeExample(example);
      practiceIterationRef.current = 0;
      setIsPracticeProcessingHint(false);
      setPracticesProgress(`Loading example ${practiceExampleIndex + 1}/${practiceExamples.length}...`);

      // Load the example's board state (all filled cells become "givens")
      console.log('[Practice] Calling loadBoard with:', {
        board: example.board.substring(0, 30) + '...',
        solution: example.solution?.substring(0, 30) + '...',
      });
      loadBoard(example.board, example.solution, { scramble: false });
      // Apply pencilmarks without modifying user input
      // Pass empty user string ('0'.repeat(81)) since the board is already loaded as the puzzle
      // This ensures the solver receives: original=example.board, user=all zeros
      if (example.pencilmarks) {
        console.log('[Practice] Calling applyHintData with pencilmarks:', example.pencilmarks.substring(0, 50) + '...');
        applyHintData('0'.repeat(81), example.pencilmarks, false);
      }
      console.log('[Practice] Calling clearHint');
      clearHint();
    }
  }, [isGeneratingPractices, practiceTargetTechnique, practiceCounts, practiceExamples, practiceExampleIndex, currentPracticeExample, fetchExamplesForTechnique, loadBoard, applyHintData, clearHint]);

  // Effect to handle practice hint processing
  useEffect(() => {
    // Compute current board state for logging
    const currentPuzzleForLog = puzzle;
    const currentUserInputForLog = getInputString();
    const currentPencilmarksForLog = getPencilmarksString();

    console.log('[Practice] Hint effect running:', {
      isGeneratingPractices,
      hasCurrentExample: !!currentPracticeExample,
      currentExampleUuid: currentPracticeExample?.uuid?.substring(0, 8) || 'NONE',
      hasPlay: !!play,
      practiceTargetTechnique,
      practiceTargetTechniqueName: practiceTargetTechnique ? getTechniqueName(practiceTargetTechnique) : 'NONE',
      isHintLoading,
      isPracticeProcessingHint,
      hintTitle: hint?.title || 'NO HINT',
      hintError: hintError || 'NO ERROR',
      iteration: practiceIterationRef.current,
      // Current board state being used for hint
      puzzleLength: currentPuzzleForLog.length,
      puzzlePreview: currentPuzzleForLog.substring(0, 30) + '...',
      userInputLength: currentUserInputForLog.length,
      userInputPreview: currentUserInputForLog.substring(0, 30) + '...',
      hasPencilmarks: !!currentPencilmarksForLog,
      pencilmarksPreview: currentPencilmarksForLog?.substring(0, 30) + '...',
      hasToken: !!token,
      tokenLength: token?.length || 0,
      baseUrl,
    });

    if (!isGeneratingPractices || generatePracticesAbortRef.current) {
      console.log('[Practice] Returning: not generating or aborted');
      return;
    }
    if (!currentPracticeExample || !play || !practiceTargetTechnique) {
      console.log('[Practice] Returning: missing example/play/technique', {
        hasExample: !!currentPracticeExample,
        hasPlay: !!play,
        hasTechnique: !!practiceTargetTechnique,
      });
      return;
    }
    if (isHintLoading) {
      console.log('[Practice] Returning: hint loading (API call in progress)');
      return;
    }
    if (isPracticeProcessingHint) {
      console.log('[Practice] Returning: processing hint (applying hint data)');
      return;
    }

    // Check iteration limit
    if (practiceIterationRef.current >= MAX_PRACTICE_ATTEMPTS || hintError) {
      console.log('[Practice] Skipping to next example due to error or max iterations:', {
        iteration: practiceIterationRef.current,
        maxAttempts: MAX_PRACTICE_ATTEMPTS,
        hintError: hintError,
        hintErrorType: typeof hintError,
      });
      // Skip to next example
      setPracticeExampleIndex(prev => prev + 1);
      setCurrentPracticeExample(null);
      clearHint();
      return;
    }

    // If we have a hint, check if it matches target technique
    if (hint) {
      const hintTechniqueId = TECHNIQUE_TITLE_TO_ID[hint.title];

      if (hintTechniqueId === practiceTargetTechnique) {
        // Found matching technique! Save the current board state as a practice
        const boardString = play.board
          ? play.board.cells.map(c => {
              if (c.given !== null) return String(c.given);
              if (c.input !== null) return String(c.input);
              return '0';
            }).join('')
          : '';
        const pencilmarks = getPencilmarksString();

        // Find the technique_uuid for this technique
        const techniqueItem = practiceCounts.find(
          p => TECHNIQUE_TITLE_TO_ID[p.technique_title] === practiceTargetTechnique
        );
        if (!techniqueItem) {
          setPracticeExampleIndex(prev => prev + 1);
          setCurrentPracticeExample(null);
          clearHint();
          return;
        }

        setPracticesProgress(`Saving practice for ${hint.title}...`);
        setIsPracticeProcessingHint(true);

        // Save the practice
        fetch(`${baseUrl}/api/v1/practices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            technique_uuid: techniqueItem.technique_uuid,
            board: boardString,
            pencilmarks: pencilmarks || null,
            solution: currentPracticeExample.solution,
            hint_data: JSON.stringify(hint),
            source_example_uuid: currentPracticeExample.uuid,
          }),
        }).then(response => {
          if (response.ok) {
            const newCount = (practiceLocalCountsRef.current[techniqueItem.technique_uuid] || 0) + 1;
            practiceLocalCountsRef.current[techniqueItem.technique_uuid] = newCount;

            // Update UI counts
            setPracticeCounts(prev => prev.map(p =>
              p.technique_uuid === techniqueItem.technique_uuid
                ? { ...p, count: newCount }
                : p
            ));

            setPracticesProgress(`Saved practice for ${hint.title} (${newCount}/${TARGET_PER_TECHNIQUE})`);
          }

          // Move to next example
          console.log('[Practice] Practice saved, moving to next example');
          setPracticeExampleIndex(prev => prev + 1);
          setCurrentPracticeExample(null);
          setIsPracticeProcessingHint(false);
          clearHint();
        }).catch(err => {
          console.error('Failed to save practice:', err);
          setPracticeExampleIndex(prev => prev + 1);
          setCurrentPracticeExample(null);
          setIsPracticeProcessingHint(false);
          clearHint();
        });
        return;
      }

      // Not the target technique - apply hint and continue
      setIsPracticeProcessingHint(true);
      const hintData = applyHint();
      if (hintData) {
        applyHintData(hintData.user, hintData.pencilmarks, hintData.autoPencilmarks);
      }
      setTimeout(() => {
        if (!generatePracticesAbortRef.current && isGeneratingPractices) {
          practiceIterationRef.current++;
          setIsPracticeProcessingHint(false);
        }
      }, 50);
      return;
    }

    // No hint yet, request one
    // Note: At this point, hint is falsy (if truthy, we would have returned above)
    // and hintError is falsy (if truthy, we would have returned at line 1042)
    const currentPuzzle = puzzle;
    const currentUserInput = getInputString();
    const currentPencilmarks = getPencilmarksString();
    console.log('[Practice] ===== REQUESTING HINT =====');
    console.log('[Practice] Target technique:', practiceTargetTechnique, '-', getTechniqueName(practiceTargetTechnique));
    console.log('[Practice] Example:', practiceExampleIndex + 1, '/', practiceExamples.length);
    console.log('[Practice] Iteration:', practiceIterationRef.current + 1);
    console.log('[Practice] Puzzle (original):', currentPuzzle);
    console.log('[Practice] UserInput:', currentUserInput);
    console.log('[Practice] Pencilmarks:', currentPencilmarks?.substring(0, 100) || 'NONE');
    console.log('[Practice] Token present:', !!token, 'length:', token?.length || 0);
    console.log('[Practice] BaseUrl:', baseUrl);
    console.log('[Practice] Example board matches puzzle?', currentPracticeExample?.board === currentPuzzle);
    console.log('[Practice] ===========================');
    setPracticesProgress(`Getting hint for example ${practiceExampleIndex + 1} (attempt ${practiceIterationRef.current + 1})...`);
    getHint();
  }, [isGeneratingPractices, currentPracticeExample, play, hint, isHintLoading, hintError, isPracticeProcessingHint, practiceTargetTechnique, practiceCounts, practiceExampleIndex, practiceExamples, baseUrl, token, puzzle, getInputString, getPencilmarksString, applyHint, applyHintData, getHint, clearHint]);

  // Calculate totals
  const totalCaptured = Object.values(counts).reduce((sum, c) => sum + c, 0);
  const totalNeeded = TECHNIQUE_ORDER.length * TARGET_PER_TECHNIQUE;

  // Admin sections
  const sections = [
    { id: 'boards', label: 'Boards', description: 'Board management' },
    { id: 'techniques', label: 'Techniques', description: 'Technique management' },
    { id: 'examples', label: 'Examples', description: 'Technique example management' },
    { id: 'practices', label: 'Practices', description: 'Technique practice management' },
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

  const detailContent = section === 'boards' ? (
    <div className="space-y-6">
      {/* Board counts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <Text>Total Boards</Text>
          <Text weight="medium">
            {isBoardsLoading ? '...' : totalBoards.toLocaleString()}
          </Text>
        </div>
      </div>

      {/* Symmetrical toggle */}
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
        <Text>Symmetrical</Text>
        <Switch
          checked={symmetrical}
          onCheckedChange={setSymmetrical}
          disabled={isGenerating}
        />
      </div>

      {/* Progress message */}
      {generateProgress && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Text size="sm">{generateProgress}</Text>
        </div>
      )}

      {/* Generate CTA */}
      <div className="pt-4 border-t">
        {isGenerating ? (
          <Button variant="destructive" className="w-full" onClick={handleStopGenerating}>
            Stop
          </Button>
        ) : (
          <Button className="w-full" onClick={handleGenerateBoards}>
            Generate
          </Button>
        )}
      </div>
    </div>
  ) : section === 'techniques' ? (
    <div className="space-y-6">
      {/* Board counts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <Text>Total Boards</Text>
          <Text weight="medium">
            {isTechniquesLoading ? '...' : totalBoards.toLocaleString()}
          </Text>
        </div>
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
          <Text>Boards without Techniques</Text>
          <Text weight="medium" color={boardsWithoutTechniques > 0 ? 'warning' : 'success'}>
            {isTechniquesLoading ? '...' : boardsWithoutTechniques.toLocaleString()}
          </Text>
        </div>
      </div>

      {/* Progress message */}
      {extractProgress && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Text size="sm">{extractProgress}</Text>
        </div>
      )}

      {/* Extract Techniques CTA */}
      <div className="pt-4 border-t">
        {isExtracting ? (
          <Button variant="destructive" className="w-full" onClick={handleStopExtracting}>
            Stop
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={isTechniquesLoading || boardsWithoutTechniques === 0}
            onClick={handleExtractTechniques}
          >
            Extract Techniques
          </Button>
        )}
      </div>
    </div>
  ) : section === 'examples' ? (
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
  ) : section === 'practices' ? (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <Text weight="medium">
          Total: {practiceCounts.reduce((sum, p) => sum + p.count, 0)} / {practiceCounts.length * TARGET_PER_TECHNIQUE}
        </Text>
        {isPracticesLoading && <Text color="muted">Loading...</Text>}
      </div>

      {/* Progress message */}
      {practicesProgress && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Text size="sm">{practicesProgress}</Text>
        </div>
      )}

      {/* Technique list with practice counts */}
      <div className="space-y-2">
        {practiceCounts.map(item => {
          const isFull = item.count >= TARGET_PER_TECHNIQUE;
          return (
            <div
              key={item.technique_uuid}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
            >
              <Text>{item.technique_title}</Text>
              <Text color={isFull ? 'success' : 'muted'}>
                {item.count} / {TARGET_PER_TECHNIQUE}
                {isFull && ' ✓'}
              </Text>
            </div>
          );
        })}
      </div>

      {/* Generate Practices CTA */}
      <div className="pt-4 border-t space-y-2">
        {isGeneratingPractices ? (
          <Button onClick={handleStopGeneratingPractices} variant="destructive" className="w-full">
            Stop
          </Button>
        ) : (
          <Button onClick={handleGeneratePractices} disabled={isPracticesLoading} className="w-full">
            Generate Practices
          </Button>
        )}
        <Button onClick={handleDeleteAllPractices} variant="outline" className="w-full" disabled={isGeneratingPractices}>
          Delete All
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-full text-center">
      <Text color="muted">Select a section</Text>
    </div>
  );

  return (
    <Section spacing="xl">
      <MasterDetailLayout
        masterTitle={t('nav.admin', 'Admin')}
        masterContent={masterContent}
        detailContent={detailContent}
        detailTitle={section === 'boards' ? 'Boards' : section === 'techniques' ? 'Techniques' : section === 'examples' ? 'Examples' : section === 'practices' ? 'Practices' : undefined}
        mobileView={mobileView}
        onBackToNavigation={handleBackToNavigation}
        masterWidth={280}
        stickyMaster
        stickyTopOffset={80}
      />
    </Section>
  );
}
