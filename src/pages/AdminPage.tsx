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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Practices section state (simplified - async loop handles the logic)
  const [practiceCounts, setPracticeCounts] = useState<TechniquePracticeCountItem[]>([]);
  const [isPracticesLoading, setIsPracticesLoading] = useState(false);
  const [isGeneratingPractices, setIsGeneratingPractices] = useState(false);
  const [practicesProgress, setPracticesProgress] = useState<string>('');
  const generatePracticesAbortRef = useRef(false);

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

  // Generate practices handler - simple async loop
  const handleGeneratePractices = useCallback(async () => {
    if (!token || !networkClient) {
      setPracticesProgress('Error: Not authenticated');
      return;
    }

    generatePracticesAbortRef.current = false;
    setIsGeneratingPractices(true);

    const client = createSudojoClient(networkClient, baseUrl);
    const localCounts: Record<string, number> = {};

    // Initialize local counts from current state
    for (const item of practiceCounts) {
      localCounts[item.technique_uuid] = item.count;
    }

    const MAX_ITERATIONS_PER_EXAMPLE = 100;

    // Loop through techniques
    for (const techniqueItem of practiceCounts) {
      if (generatePracticesAbortRef.current) break;

      const currentCount = localCounts[techniqueItem.technique_uuid] || 0;
      if (currentCount >= TARGET_PER_TECHNIQUE) continue;

      const techniqueId = TECHNIQUE_TITLE_TO_ID[techniqueItem.technique_title];
      if (!techniqueId) continue;

      setPracticesProgress(`Fetching examples for ${techniqueItem.technique_title}...`);

      // Fetch examples for this technique
      const examples = await fetchExamplesForTechnique(techniqueId);
      if (examples.length === 0) {
        setPracticesProgress(`No examples for ${techniqueItem.technique_title}, skipping...`);
        continue;
      }

      // Loop through examples
      for (let exampleIdx = 0; exampleIdx < examples.length; exampleIdx++) {
        if (generatePracticesAbortRef.current) break;

        const count = localCounts[techniqueItem.technique_uuid] || 0;
        if (count >= TARGET_PER_TECHNIQUE) break;

        const example = examples[exampleIdx]!;
        setPracticesProgress(`${techniqueItem.technique_title}: Example ${exampleIdx + 1}/${examples.length} (${count}/${TARGET_PER_TECHNIQUE})`);

        // Current board state - start from the example
        const currentBoard = example.board;
        let currentUser = '0'.repeat(81);
        let currentPencilmarks = example.pencilmarks || ','.repeat(80);
        let autoPencilmarks = false;

        // Loop: call solver until we find the target technique or exhaust attempts
        for (let iteration = 0; iteration < MAX_ITERATIONS_PER_EXAMPLE; iteration++) {
          if (generatePracticesAbortRef.current) break;

          try {
            // First, try with technique filter to see if target is available
            const filteredResponse = await client.solverSolve(token, {
              original: currentBoard,
              user: currentUser,
              autoPencilmarks,
              pencilmarks: currentPencilmarks,
              techniques: techniqueId.toString(),
            });

            if (filteredResponse.success && filteredResponse.data?.hints?.steps?.length) {
              // Found the target technique! Save the practice
              const hintStep = filteredResponse.data.hints.steps[0]!;

              const saveResponse = await fetch(`${baseUrl}/api/v1/practices`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  technique_uuid: techniqueItem.technique_uuid,
                  board: currentBoard,
                  pencilmarks: currentPencilmarks || null,
                  solution: example.solution,
                  hint_data: JSON.stringify(hintStep),
                  source_example_uuid: example.uuid,
                }),
              });

              if (saveResponse.ok) {
                const newCount = (localCounts[techniqueItem.technique_uuid] || 0) + 1;
                localCounts[techniqueItem.technique_uuid] = newCount;

                // Update UI
                setPracticeCounts(prev => prev.map(p =>
                  p.technique_uuid === techniqueItem.technique_uuid
                    ? { ...p, count: newCount }
                    : p
                ));
                setPracticesProgress(`Saved ${techniqueItem.technique_title} (${newCount}/${TARGET_PER_TECHNIQUE})`);
              }
              break; // Move to next example
            }

            // Target technique not found, get next available hint to progress
            const unfilteredResponse = await client.solverSolve(token, {
              original: currentBoard,
              user: currentUser,
              autoPencilmarks,
              pencilmarks: currentPencilmarks,
            });

            if (!unfilteredResponse.success || !unfilteredResponse.data?.hints?.steps?.length) {
              // No more hints available, move to next example
              break;
            }

            // Apply the hint to progress the board
            const board = unfilteredResponse.data.board?.board;
            if (board) {
              currentUser = board.user || currentUser;
              currentPencilmarks = board.pencilmarks?.pencilmarks || currentPencilmarks;
              autoPencilmarks = board.pencilmarks?.auto ?? autoPencilmarks;
            }
          } catch (err) {
            console.error('Solver error:', err);
            break; // Move to next example on error
          }
        }
      }
    }

    setIsGeneratingPractices(false);
    if (generatePracticesAbortRef.current) {
      setPracticesProgress('Stopped');
    } else {
      setPracticesProgress('Done!');
    }
  }, [token, networkClient, baseUrl, practiceCounts, fetchExamplesForTechnique]);

  // Stop generating practices
  const handleStopGeneratingPractices = useCallback(() => {
    generatePracticesAbortRef.current = true;
    setPracticesProgress('Stopping...');
  }, []);

  // Generate more practices from random puzzles (not from examples)
  const handleGenerateMorePractices = useCallback(async () => {
    if (!token || !networkClient) {
      setPracticesProgress('Error: Not authenticated');
      return;
    }

    generatePracticesAbortRef.current = false;
    setIsGeneratingPractices(true);

    const client = createSudojoClient(networkClient, baseUrl);
    const localCounts: Record<string, number> = {};

    // Initialize local counts from current state
    for (const item of practiceCounts) {
      localCounts[item.technique_uuid] = item.count;
    }

    const MAX_ITERATIONS_PER_PUZZLE = 200;
    const MAX_PUZZLES = 500;

    try {
      // Step 1: Fetch all levels and find the one with highest index
      setPracticesProgress('Fetching levels...');
      const levelsResponse = await fetch(`${baseUrl}/api/v1/levels`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!levelsResponse.ok) {
        setPracticesProgress('Error: Failed to fetch levels');
        setIsGeneratingPractices(false);
        return;
      }
      const levelsData = await levelsResponse.json();
      const levels: Level[] = levelsData.data || [];
      if (levels.length === 0) {
        setPracticesProgress('Error: No levels found');
        setIsGeneratingPractices(false);
        return;
      }

      // Find level with highest index
      const highestLevel = levels.reduce((max, level) =>
        (level.index ?? 0) > (max.index ?? 0) ? level : max
      );

      // Step 2: Fetch puzzles for the highest level
      setPracticesProgress(`Fetching puzzles for level "${highestLevel.title}"...`);
      const boardsResponse = await fetch(
        `${baseUrl}/api/v1/boards?level_uuid=${highestLevel.uuid}&limit=${MAX_PUZZLES}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!boardsResponse.ok) {
        setPracticesProgress('Error: Failed to fetch boards');
        setIsGeneratingPractices(false);
        return;
      }
      const boardsData = await boardsResponse.json();
      const boards: Board[] = boardsData.data || [];
      if (boards.length === 0) {
        setPracticesProgress('Error: No boards found for highest level');
        setIsGeneratingPractices(false);
        return;
      }

      setPracticesProgress(`Found ${boards.length} puzzles. Starting generation...`);

      // Step 3: Loop through puzzles
      for (let puzzleIdx = 0; puzzleIdx < boards.length; puzzleIdx++) {
        if (generatePracticesAbortRef.current) break;

        // Get techniques that still need practices
        const techniquesNeeded: { techniqueId: number; techniqueUuid: string; title: string }[] = [];
        for (const item of practiceCounts) {
          const count = localCounts[item.technique_uuid] || 0;
          if (count < TARGET_PER_TECHNIQUE) {
            const techniqueId = TECHNIQUE_TITLE_TO_ID[item.technique_title];
            if (techniqueId) {
              techniquesNeeded.push({
                techniqueId,
                techniqueUuid: item.technique_uuid,
                title: item.technique_title,
              });
            }
          }
        }

        // If all techniques have enough practices, we're done
        if (techniquesNeeded.length === 0) {
          setPracticesProgress('All techniques have enough practices!');
          break;
        }

        const board = boards[puzzleIdx]!;

        setPracticesProgress(`Puzzle ${puzzleIdx + 1}/${boards.length}: Processing (${techniquesNeeded.length} techniques needed)`);

        // Current board state - Board type uses 'board' property for the puzzle string
        const currentOriginal = board.board;
        let currentUser = '0'.repeat(81);
        let currentPencilmarks = ','.repeat(80);
        let autoPencilmarks = false;

        // Loop: solve the puzzle step by step
        for (let iteration = 0; iteration < MAX_ITERATIONS_PER_PUZZLE; iteration++) {
          if (generatePracticesAbortRef.current) break;

          // Refresh techniques needed (might have changed after saving a practice)
          const currentTechniquesNeeded: { techniqueId: number; techniqueUuid: string; title: string }[] = [];
          for (const item of practiceCounts) {
            const count = localCounts[item.technique_uuid] || 0;
            if (count < TARGET_PER_TECHNIQUE) {
              const techniqueId = TECHNIQUE_TITLE_TO_ID[item.technique_title];
              if (techniqueId) {
                currentTechniquesNeeded.push({
                  techniqueId,
                  techniqueUuid: item.technique_uuid,
                  title: item.technique_title,
                });
              }
            }
          }

          if (currentTechniquesNeeded.length === 0) {
            // All techniques have enough practices
            break;
          }

          const currentTechniqueIds = currentTechniquesNeeded.map(t => t.techniqueId).join(',');

          // Step 4: Try with technique filter first
          try {
            const filteredResponse = await client.solverSolve(token, {
              original: currentOriginal,
              user: currentUser,
              autoPencilmarks,
              pencilmarks: currentPencilmarks,
              techniques: currentTechniqueIds,
            });

            if (filteredResponse.success && filteredResponse.data?.hints?.steps?.length) {
              // Found a hint for one of the needed techniques!
              const hintStep = filteredResponse.data.hints.steps[0]!;
              const hintTechniqueId = TECHNIQUE_TITLE_TO_ID[hintStep.title];

              // Find the matching technique info
              const matchedTechnique = currentTechniquesNeeded.find(t => t.techniqueId === hintTechniqueId);
              if (matchedTechnique) {
                // Merge original + user into a single board for the practice
                const mergedBoard = currentOriginal.split('').map((char: string, i: number) => {
                  const userChar = currentUser[i];
                  return userChar && userChar !== '0' ? userChar : char;
                }).join('');

                // Get solution by validating the merged board
                const validateResponse = await client.solverValidate(token, { original: mergedBoard });
                const solution = validateResponse.data?.board?.board?.solution || null;

                // Save the practice
                const saveResponse = await fetch(`${baseUrl}/api/v1/practices`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    technique_uuid: matchedTechnique.techniqueUuid,
                    board: mergedBoard,
                    pencilmarks: currentPencilmarks || null,
                    solution,
                    hint_data: JSON.stringify(hintStep),
                  }),
                });

                if (saveResponse.ok) {
                  const newCount = (localCounts[matchedTechnique.techniqueUuid] || 0) + 1;
                  localCounts[matchedTechnique.techniqueUuid] = newCount;

                  // Update UI
                  setPracticeCounts(prev => prev.map(p =>
                    p.technique_uuid === matchedTechnique.techniqueUuid
                      ? { ...p, count: newCount }
                      : p
                  ));
                  setPracticesProgress(`Puzzle ${puzzleIdx + 1}: Saved ${matchedTechnique.title} (${newCount}/${TARGET_PER_TECHNIQUE})`);
                }
              }

              // Apply the hint and continue solving (might find more techniques)
              const boardData = filteredResponse.data.board?.board;
              if (boardData) {
                currentUser = boardData.user || currentUser;
                currentPencilmarks = boardData.pencilmarks?.pencilmarks || currentPencilmarks;
                autoPencilmarks = boardData.pencilmarks?.auto ?? autoPencilmarks;
              }
              continue; // Continue solving the same puzzle
            }
          } catch (err) {
            // Filtered call failed - continue to try unfiltered
            console.log('Filtered solver call failed, trying unfiltered:', err);
          }

          // Step 5: No hint for filtered techniques, try without filter (same board state!)
          try {
            const unfilteredResponse = await client.solverSolve(token, {
              original: currentOriginal,
              user: currentUser,
              autoPencilmarks,
              pencilmarks: currentPencilmarks,
            });

            if (!unfilteredResponse.success || !unfilteredResponse.data?.hints?.steps?.length) {
              // No more hints available - puzzle is solved or stuck
              break;
            }

            // Apply the hint to progress the puzzle
            const boardData = unfilteredResponse.data.board?.board;
            if (boardData) {
              currentUser = boardData.user || currentUser;
              currentPencilmarks = boardData.pencilmarks?.pencilmarks || currentPencilmarks;
              autoPencilmarks = boardData.pencilmarks?.auto ?? autoPencilmarks;
            }
            // Loop back to try filtered techniques again
          } catch (err) {
            console.error('Unfiltered solver error:', err);
            break; // Move to next puzzle on error
          }
        }
      }
    } catch (err) {
      console.error('Generate more practices error:', err);
      setPracticesProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    setIsGeneratingPractices(false);
    if (generatePracticesAbortRef.current) {
      setPracticesProgress('Stopped');
    } else {
      setPracticesProgress('Done!');
    }
  }, [token, networkClient, baseUrl, practiceCounts]);

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
          <>
            <Button onClick={handleGeneratePractices} disabled={isPracticesLoading} className="w-full">
              Generate Practices
            </Button>
            <Button onClick={handleGenerateMorePractices} disabled={isPracticesLoading} variant="secondary" className="w-full">
              Generate More Practices
            </Button>
          </>
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
