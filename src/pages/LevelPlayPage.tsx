import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heading } from '@sudobility/components';
import { SudokuGame } from '@/components/sudoku';

// TODO: Replace with actual API call using levelId
const LEVEL_PUZZLES: Record<string, { puzzle: string; solution: string }> = {
  '1': {
    puzzle: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
    solution: '483921657967345821251876493548132976729564138136798245372689514814253769695417382',
  },
  '2': {
    puzzle: '200080300060070084030500209000105408000000000402706000301007040720040060004010003',
    solution: '245981376169273584837564219976125438513498627482736951351897642728349165694512873',
  },
  '3': {
    puzzle: '000000907000420180000705026100904000050000040000507009920108000034059000507000000',
    solution: '462831957795426183318795426173984265859612743246537819921378564634259871587143692',
  },
  '4': {
    puzzle: '030050040008010500460000012070502080000603000040109030250000098001020600080060020',
    solution: '132958746978614523465327912679532184821643759344189237253741698791825364486396275',
  },
  '5': {
    puzzle: '020000000000600003074080000000003002080040010600500000000010780500009000000000040',
    solution: '126437958859621473374985621941873562285746319637592184493218765518369247762154348',
  },
};

const DEFAULT_PUZZLE = {
  puzzle: '530070000600195000098000060800060003400803001700020006060000280000419005000080079',
  solution: '534678912672195348198342567859761423426853791713924856961537284287419635345286179',
};

export default function LevelPlayPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();

  const puzzleData = levelId ? LEVEL_PUZZLES[levelId] || DEFAULT_PUZZLE : DEFAULT_PUZZLE;

  const handleComplete = () => {
    // TODO: Save completion to user progress and unlock next level
    console.log(`Level ${levelId} completed!`);
  };

  return (
    <div className="py-8">
      <header className="mb-8">
        <Heading level={1} size="2xl" className="mb-2">
          {t('levels.level', { number: levelId })}
        </Heading>
      </header>

      <SudokuGame
        puzzle={puzzleData.puzzle}
        solution={puzzleData.solution}
        showErrors={true}
        onComplete={handleComplete}
      />
    </div>
  );
}
