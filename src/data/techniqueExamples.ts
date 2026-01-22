/**
 * Example puzzle data for technique tutorials
 * Auto-generated from API examples
 */

import type { CellHighlight, CandidateHighlight, LineHighlight } from '@/utils/sudokuSvgGenerator';

export interface TechniqueExample {
  id: string;
  techniqueId: number;
  technique: string;
  difficulty: string;
  prerequisites: string[];
  puzzle: string;
  solution: string;
  pencilmarks: string;
  highlights: {
    cells?: CellHighlight[];
    candidates?: CandidateHighlight[];
    rows?: LineHighlight[];
    cols?: LineHighlight[];
  };
  hintData: {
    title: string;
    text: string;
    areas: Array<{ type: string; color: string; index: number }>;
    cells: Array<{
      row: number;
      column: number;
      color: string;
      fill: boolean;
      actions: {
        select: string;
        unselect: string;
        add: string;
        remove: string;
        highlight: string;
      };
    }>;
  };
  description: string;
}

// Full House Example (Technique ID: 1)
export const fullhouseExample: TechniqueExample = {
  id: 'full_house-1',
  techniqueId: 1,
  technique: 'Full House',
  difficulty: 'Beginner',
  prerequisites: [],
  puzzle: '960100070040000019013097206020000900370900800089001000450020100001850000090016030',
  solution: '062143508507682300813590040105478063074065021609230754006309187730004692298700405',
  pencilmarks: ',,258,,348,23458,345,,3458,2578,,2578,2356,368,2358,35,,,58,,,45,,,,458,,156,,456,3456,34678,3458,,456,13457,,,456,,46,245,,2456,1245,56,,,23456,3467,,34567,2456,23457,,,67,37,,39,,689,78,267,3,,,,349,467,269,247,278,,278,47,,,457,,2457',
  highlights: {
    cells: [{"row": 7, "col": 1, "fill": "blue"}],
  },
  hintData: {
  "title": "Full House",
  "text": "Examine the highlighted cell.",
  "areas": [],
  "cells": [
    {
      "row": 7,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Full House: Examine the highlighted cell. Highlighted: R8C2`,
};

// Hidden Single Example (Technique ID: 2)
export const hiddensingleExample: TechniqueExample = {
  id: 'hidden_single-1',
  techniqueId: 2,
  technique: 'Hidden Single',
  difficulty: 'Beginner',
  prerequisites: ["Full House"],
  puzzle: '000400060002000005040080100250300070690051400100000000000005008000010000030000029',
  solution: '915023807870196340306507092004068901007200083083749256429630710768902534501874600',
  pencilmarks: ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
  highlights: {
    cells: [{"row": 1, "col": 7, "fill": "blue"}],
  },
  hintData: {
  "title": "Hidden Single",
  "text": "Examine the highlighted cell.",
  "areas": [],
  "cells": [
    {
      "row": 1,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Hidden Single: Examine the highlighted cell. Highlighted: R2C8`,
};

// Naked Single Example (Technique ID: 3)
export const nakedsingleExample: TechniqueExample = {
  id: 'naked_single-1',
  techniqueId: 3,
  technique: 'Naked Single',
  difficulty: 'Beginner',
  prerequisites: ["Hidden Single"],
  puzzle: '960100070040000019003097206020000900300900800089001000450020100001850000090016030',
  solution: '062143508507682300813590040105478063074065021609230754006309187730004692298700405',
  pencilmarks: ',,258,,348,23458,345,,3458,2578,,2578,2356,368,2358,35,,,158,1,,45,,,,458,,1567,,456,3456,34678,3458,,456,13457,,17,456,,467,245,,2456,12457,567,,,23456,3467,,34567,2456,23457,,,67,37,,39,,689,78,267,37,,,,349,467,269,247,278,,278,47,,,457,,2457',
  highlights: {
    cells: [{"row": 2, "col": 1, "fill": "blue"}],
  },
  hintData: {
  "title": "Naked Single",
  "text": "Examine the highlighted cell.",
  "areas": [],
  "cells": [
    {
      "row": 2,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Naked Single: Examine the highlighted cell. Highlighted: R3C2`,
};

// Hidden Pair Example (Technique ID: 4)
export const hiddenpairExample: TechniqueExample = {
  id: 'hidden_pair-1',
  techniqueId: 4,
  technique: 'Hidden Pair',
  difficulty: 'Intermediate',
  prerequisites: ["Hidden Single"],
  puzzle: '000516700007300006506700314200900000075208600800100000630895027708601000000400860',
  solution: '342506089187049250090782300013064578400030091069157432604800107050020943921473065',
  pencilmarks: '349,2489,2349,,,,,89,289,149,12489,,,248,249,259,589,,,289,,,28,29,,,,,146,134,,34567,347,145,34578,1358,1349,,,,34,,,349,139,,469,349,,34567,347,2459,34579,2359,,,14,,,,14,,,,2459,,,23,,459,3459,359,19,1259,129,,237,237,,,1359',
  highlights: {
    cells: [{"row": 3, "col": 4, "fill": "blue"}, {"row": 5, "col": 4, "fill": "blue"}],
  },
  hintData: {
  "title": "Hidden Pair",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 3,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Hidden Pair: Examine the highlighted cells. Highlighted: R4C5, R6C5`,
};

// Naked Pair Example (Technique ID: 5)
export const nakedpairExample: TechniqueExample = {
  id: 'naked_pair-1',
  techniqueId: 5,
  technique: 'Naked Pair',
  difficulty: 'Beginner',
  prerequisites: ["Naked Single"],
  puzzle: '470003508182040700050780124200097840704800952098402017840070000007904081901308475',
  solution: '479120068180605039603089120216500843730816950500430607805201396367954200920060470',
  pencilmarks: ',,69,12,12,,,69,,,,,56,,569,,39,369,36,,369,,,69,,,,,13,56,156,,,,,36,,13,,,136,16,,,,356,,,,35,,36,,,,,356,125,,156,23,369,369,35,236,,,256,,236,,,,26,,,26,,,,',
  highlights: {
    cells: [{"row": 3, "col": 1, "fill": "blue"}, {"row": 4, "col": 1, "fill": "blue"}],
  },
  hintData: {
  "title": "Naked Pair",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 3,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 4,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Naked Pair: Examine the highlighted cells. Highlighted: R4C2, R5C2`,
};

// Locked Candidates Example (Technique ID: 6)
export const lockedcandidatesExample: TechniqueExample = {
  id: 'locked_candidates-1',
  techniqueId: 6,
  technique: 'Locked Candidates',
  difficulty: 'Beginner',
  prerequisites: ["Naked Pair"],
  puzzle: '039100050200005000005030260103000975020050040500017020004800512002041736001006000',
  solution: '400062857016780394875904001040628005607309108098410623760093010982501006350270489',
  pencilmarks: '4678,,,,2678,248,48,,478,,14678,678,4679,6789,,13,89,134789,478,1478,,479,,489,,,14789,,468,,246,268,248,,,,6789,,678,369,,389,136,,138,,4689,68,3469,,,36,,38,3679,679,,,79,39,,,,89,589,,59,,,,,,3789,5789,,23579,279,,48,89,489',
  highlights: {
    cells: [{"row": 0, "col": 0, "fill": "blue"}, {"row": 2, "col": 0, "fill": "blue"}],
  },
  hintData: {
  "title": "Locked Candidates",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 0,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 2,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Locked Candidates: Examine the highlighted cells. Highlighted: R1C1, R3C1`,
};

// Hidden Triple Example (Technique ID: 7)
export const hiddentripleExample: TechniqueExample = {
  id: 'hidden_triple-1',
  techniqueId: 7,
  technique: 'Hidden Triple',
  difficulty: 'Intermediate',
  prerequisites: ["Hidden Pair"],
  puzzle: '006003000000100426240060038050009360607300040000006800438602509000800000500000080',
  solution: '810420795375098006009507130104280067080051902923746051400610070792035614061974283',
  pencilmarks: '1789,1789,,24,24,,179,59,15,379,79,359,,5789,578,,,,,,159,579,,57,179,,,18,,124,247,12478,,,,127,,1289,,,1258,158,19,,125,139,129,12349,2457,12457,,,59,1257,,,,,17,,,17,,179,12679,129,,13579,1457,26,17,34,,12679,129,79,1379,147,26,,34',
  highlights: {
    cells: [{"row": 7, "col": 4, "fill": "blue"}, {"row": 7, "col": 5, "fill": "blue"}, {"row": 7, "col": 8, "fill": "blue"}],
  },
  hintData: {
  "title": "Hidden Triple",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 7,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 8,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Hidden Triple: Examine the highlighted cells. Highlighted: R8C5, R8C6, R8C9`,
};

// Naked Triple Example (Technique ID: 8)
export const nakedtripleExample: TechniqueExample = {
  id: 'naked_triple-1',
  techniqueId: 8,
  technique: 'Naked Triple',
  difficulty: 'Intermediate',
  prerequisites: ["Naked Pair"],
  puzzle: '700020400230400007048760205389271654524396000600548923003602040402037000860954302',
  solution: '095103486006085190140709230089270054524306871671540000953012708010837569007904012',
  pencilmarks: ',19,56,18,,359,,13689,16,,,56,,18,59,18,69,,19,,,,,39,,139,,,,,,,,,,,,,,,,,178,178,18,,17,17,,,,,,,19,57,,,18,,57,,189,,159,,18,,,15,168,1689,,,17,,,,,17,',
  highlights: {
    cells: [{"row": 6, "col": 6, "fill": "blue"}, {"row": 7, "col": 6, "fill": "blue"}, {"row": 8, "col": 7, "fill": "blue"}],
  },
  hintData: {
  "title": "Naked Triple",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 6,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Naked Triple: Examine the highlighted cells. Highlighted: R7C7, R8C7, R9C8`,
};

// Hidden Quad Example (Technique ID: 9)
export const hiddenquadExample: TechniqueExample = {
  id: 'hidden_quad-1',
  techniqueId: 9,
  technique: 'Hidden Quad',
  difficulty: 'Advanced',
  prerequisites: ["Hidden Triple"],
  puzzle: '396000570420000009058609024580410207000000000002795083200061940900000006865900002',
  solution: '096124008021578360700039120003006097679382451140700600037860005014257830800943710',
  pencilmarks: ',,,128,248,248,,,18,,,17,1358,3578,378,1368,136,,17,,,,37,,13,,,,,39,,,36,,69,,67,37,13479,238,238,2368,146,1569,15,16,14,,,,,146,,,,37,37,58,,,,,58,,14,14,2358,23578,2378,378,35,,,,,,347,347,137,13,',
  highlights: {
    cells: [{"row": 4, "col": 2, "fill": "blue"}, {"row": 4, "col": 6, "fill": "blue"}, {"row": 4, "col": 7, "fill": "blue"}, {"row": 4, "col": 8, "fill": "blue"}],
  },
  hintData: {
  "title": "Hidden Quad",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 4,
      "column": 2,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 4,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 4,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 4,
      "column": 8,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Hidden Quad: Examine the highlighted cells. Highlighted: R5C3, R5C7, R5C8, R5C9`,
};

// Naked Quad Example (Technique ID: 10)
export const nakedquadExample: TechniqueExample = {
  id: 'naked_quad-1',
  techniqueId: 10,
  technique: 'Naked Quad',
  difficulty: 'Intermediate',
  prerequisites: ["Naked Triple"],
  puzzle: '801000000000030008507680140003256789200000030760308021074000865902860300000700000',
  solution: '030524697496107258520089003143206000089471506705390420300912800010065374658043912',
  pencilmarks: ',239,,459,2479,2479,269,579,367,46,249,69,15,,17,29,57,,,239,,,,29,,,23,14,14,,,,,,,,,89,589,149,1479,1479,456,,46,,,59,,49,,45,,,13,,,19,129,239,,,,,15,,,,45,,17,47,36,158,68,,14,345,249,19,24',
  highlights: {
    cells: [{"row": 8, "col": 4, "fill": "blue"}, {"row": 8, "col": 6, "fill": "blue"}, {"row": 8, "col": 7, "fill": "blue"}, {"row": 8, "col": 8, "fill": "blue"}],
  },
  hintData: {
  "title": "Naked Quad",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 8,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 8,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Naked Quad: Examine the highlighted cells. Highlighted: R9C5, R9C7, R9C8, R9C9`,
};

// X-Wing Example (Technique ID: 11)
export const xwingExample: TechniqueExample = {
  id: 'x-wing-1',
  techniqueId: 11,
  technique: 'X-Wing',
  difficulty: 'Intermediate',
  prerequisites: ["Locked Candidates"],
  puzzle: '410000008000070060050090100004000600000207401080300200042700006560800090070005000',
  solution: '006523970928104305307608042230951687695080030781046059840739510003012704109460823',
  pencilmarks: ',,3679,56,2356,236,3579,2357,,2389,239,389,145,,12348,359,,2345,23678,,3678,46,,23468,,2347,2347,1237,23,,159,158,19,,3578,3579,369,39,3569,,568,,,358,,167,,1567,,1456,1469,,57,579,1389,,,,13,139,358,135,,,,13,,1234,1234,37,,2347,1389,,1389,1469,12346,,38,1234,234',
  highlights: {
    cells: [{"row": 1, "col": 3, "fill": "blue"}, {"row": 2, "col": 3, "fill": "blue"}, {"row": 8, "col": 3, "fill": "blue"}, {"row": 2, "col": 7, "fill": "blue"}, {"row": 8, "col": 7, "fill": "blue"}],
  },
  hintData: {
  "title": "X-Wing",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 1,
      "column": 3,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 2,
      "column": 3,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 3,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 2,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `X-Wing: Examine the highlighted cells. Highlighted: R2C4, R3C4, R9C4, R3C8 (+1 more)`,
};

// Swordfish Example (Technique ID: 12)
export const swordfishExample: TechniqueExample = {
  id: 'swordfish-1',
  techniqueId: 12,
  technique: 'Swordfish',
  difficulty: 'Intermediate',
  prerequisites: ["X-Wing"],
  puzzle: '780100000090050007060079020129763458640005003530001000216007300053002000074000002',
  solution: '002034695491206830365870104100703050607980210038420976210540089800690741970318560',
  pencilmarks: ',,25,,23,46,569,3469,4569,34,,12,2368,,468,168,13468,,34,,15,38,,,158,,145,,,,,,,,,,,,78,289,289,,1279,179,,,,78,2489,2489,,2679,679,69,,,,4589,489,,,489,459,89,,,4689,1489,,16789,146789,1469,89,,,35689,1389,68,1569,1689,',
  highlights: {
    cells: [{"row": 7, "col": 0, "fill": "blue"}, {"row": 8, "col": 0, "fill": "blue"}, {"row": 1, "col": 5, "fill": "blue"}, {"row": 8, "col": 5, "fill": "blue"}, {"row": 1, "col": 6, "fill": "blue"}, {"row": 2, "col": 6, "fill": "blue"}, {"row": 7, "col": 6, "fill": "blue"}],
  },
  hintData: {
  "title": "Swordfish",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 7,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 2,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Swordfish: Examine the highlighted cells. Highlighted: R8C1, R9C1, R2C6, R9C6 (+3 more)`,
};

// Jellyfish Example (Technique ID: 13)
export const jellyfishExample: TechniqueExample = {
  id: 'jellyfish-1',
  techniqueId: 13,
  technique: 'Jellyfish',
  difficulty: 'Advanced',
  prerequisites: ["Swordfish"],
  puzzle: '904000080800300490050498002008200900092050804007980201005800009213679548489510607',
  solution: '034125706821067095706000312560041973192703860340986050675034120010600548089502030',
  pencilmarks: ',237,,17,26,157,137,,356,,27,16,,26,157,,,56,37,,16,,,,137,136,,15,346,,,34,17,,57,36,136,,,17,,36,,367,,356,346,,,,346,,356,,67,67,,,34,234,13,123,,,,,,,,,,,,,,,,23,,23,',
  highlights: {
    cells: [{"row": 2, "col": 0, "fill": "blue"}, {"row": 4, "col": 0, "fill": "blue"}, {"row": 5, "col": 0, "fill": "blue"}, {"row": 3, "col": 4, "fill": "blue"}, {"row": 6, "col": 4, "fill": "blue"}, {"row": 0, "col": 6, "fill": "blue"}, {"row": 2, "col": 6, "fill": "blue"}, {"row": 6, "col": 6, "fill": "blue"}, {"row": 0, "col": 8, "fill": "blue"}, {"row": 3, "col": 8, "fill": "blue"}],
  },
  hintData: {
  "title": "Jellyfish",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 2,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 4,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 3,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 6,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 0,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 2,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 6,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 0,
      "column": 8,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 3,
      "column": 8,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Jellyfish: Examine the highlighted cells. Highlighted: R3C1, R5C1, R6C1, R4C5 (+6 more)`,
};

// XY-Wing Example (Technique ID: 14)
export const xywingExample: TechniqueExample = {
  id: 'xy-wing-1',
  techniqueId: 14,
  technique: 'XY-Wing',
  difficulty: 'Intermediate',
  prerequisites: ["Naked Pair"],
  puzzle: '842035009000400080137869425318674952296358147004090836000940008400080500080506004',
  solution: '800105760659427301007060405008674950206350140570291800725003618461702093983010270',
  pencilmarks: ',,,17,,,67,167,,569,56,59,,12,127,37,,13,,,,,,,,,,,,,,,,,,,,,,,,,,,,57,57,,12,,12,,,,567,2567,135,,,1237,2367,167,,,267,139,27,,237,,1679,13,79,,13,,12,,23,79,',
  highlights: {
    cells: [{"row": 0, "col": 3, "fill": "blue"}, {"row": 7, "col": 3, "fill": "blue"}, {"row": 8, "col": 4, "fill": "blue"}],
  },
  hintData: {
  "title": "XY-Wing",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 0,
      "column": 3,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 3,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `XY-Wing: Examine the highlighted cells. Highlighted: R1C4, R8C4, R9C5`,
};

// Finned X-Wing Example (Technique ID: 15) - NO EXAMPLE AVAILABLE

// Squirmbag Example (Technique ID: 16)
export const squirmbagExample: TechniqueExample = {
  id: 'squirmbag-1',
  techniqueId: 16,
  technique: 'Squirmbag',
  difficulty: 'Advanced',
  prerequisites: ["Jellyfish"],
  puzzle: '020316000100050368653870210210690080930187026006020000562938040300000095090000032',
  solution: '428010579079204060603809014004605703035080426780403951500930107341762800807541632',
  pencilmarks: '48,,489,,,,4579,57,479,,47,79,24,,249,,,,,,,,,49,,,49,,,457,,,345,457,,347,,,45,,,,45,,,478,478,,45,,345,14579,57,13479,,,,,,,17,,17,,478,1478,27,46,12,68,,,478,,1478,57,46,15,68,,',
  highlights: {
    cells: [{"row": 0, "col": 0, "fill": "blue"}, {"row": 5, "col": 0, "fill": "blue"}, {"row": 8, "col": 0, "fill": "blue"}, {"row": 1, "col": 1, "fill": "blue"}, {"row": 5, "col": 1, "fill": "blue"}, {"row": 7, "col": 1, "fill": "blue"}, {"row": 1, "col": 3, "fill": "blue"}, {"row": 5, "col": 3, "fill": "blue"}, {"row": 7, "col": 4, "fill": "blue"}, {"row": 8, "col": 4, "fill": "blue"}, {"row": 0, "col": 6, "fill": "blue"}, {"row": 3, "col": 6, "fill": "blue"}, {"row": 4, "col": 6, "fill": "blue"}, {"row": 5, "col": 6, "fill": "blue"}],
  },
  hintData: {
  "title": "Squirmbag",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 0,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 3,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 3,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 0,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 3,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 4,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Squirmbag: Examine the highlighted cells. Highlighted: R1C1, R6C1, R9C1, R2C2 (+10 more)`,
};

// Finned Swordfish Example (Technique ID: 17) - NO EXAMPLE AVAILABLE

// Finned Jellyfish Example (Technique ID: 18) - NO EXAMPLE AVAILABLE

// XYZ-Wing Example (Technique ID: 19)
export const xyzwingExample: TechniqueExample = {
  id: 'xyz-wing-1',
  techniqueId: 19,
  technique: 'XYZ-Wing',
  difficulty: 'Advanced',
  prerequisites: ["XY-Wing"],
  puzzle: '903010605720063000610009043007106008000807360060000004036900507001000406070600000',
  solution: '083402670704500891615780200240036950159040062308295710400021087590378020802654139',
  pencilmarks: ',48,,247,,28,,27,,,,45,45,,,189,189,19,,,58,257,2578,,27,,,234,459,,,23459,,29,259,,145,459,249,,2459,,,,129,1238,,289,235,2359,25,1279,12579,,248,,,,28,14,,128,,25,589,,2357,2357,258,,239,,2458,,2489,,2358,14,1289,12389,129',
  highlights: {
    cells: [{"row": 6, "col": 4, "fill": "blue"}, {"row": 7, "col": 0, "fill": "blue"}, {"row": 7, "col": 5, "fill": "blue"}],
  },
  hintData: {
  "title": "XYZ-Wing",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 6,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `XYZ-Wing: Examine the highlighted cells. Highlighted: R7C5, R8C1, R8C6`,
};

// WXYZ-Wing Example (Technique ID: 20)
export const wxyzwingExample: TechniqueExample = {
  id: 'wxyz-wing-1',
  techniqueId: 20,
  technique: 'WXYZ-Wing',
  difficulty: 'Advanced',
  prerequisites: ["XYZ-Wing"],
  puzzle: '002300008050020300603000120210930700300004000980007030030802097000703012020600853',
  solution: '790316540108409076043578029206035084075280961004160205501042607869050410427091003',
  pencilmarks: '147,49,,,1679,1569,59,467,,1478,,1789,14,,169,,467,469,,479,,45,789,589,,,459,,,456,,,568,,468,456,,67,567,125,168,,259,68,1569,,,456,125,16,,25,,1456,145,,16,,45,,46,,,458,469,689,,459,,46,,,47,,79,,149,19,,,',
  highlights: {
    cells: [{"row": 7, "col": 6, "fill": "blue"}, {"row": 7, "col": 1, "fill": "blue"}, {"row": 8, "col": 0, "fill": "blue"}, {"row": 8, "col": 2, "fill": "blue"}],
  },
  hintData: {
  "title": "WXYZ-Wing",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 7,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 2,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `WXYZ-Wing: Examine the highlighted cells. Highlighted: R8C7, R8C2, R9C1, R9C3`,
};

// Almost Locked Sets Example (Technique ID: 21)
export const almostlockedsetsExample: TechniqueExample = {
  id: 'almost_locked_sets-1',
  techniqueId: 21,
  technique: 'Almost Locked Sets',
  difficulty: 'Advanced',
  prerequisites: ["Naked Triple"],
  puzzle: '903010605720063000610009043007106008000807360060000004036900507001000406070600000',
  solution: '083402670704500891615780200240036950159040062308295710400021087590378020802654139',
  pencilmarks: ',48,,247,,28,,27,,,,45,45,,,189,189,19,,,58,257,2578,,27,,,234,459,,,23459,,29,259,,145,459,249,,2459,,,,129,1238,,289,235,2359,25,1279,12579,,248,,,,28,14,,128,,25,589,,357,357,258,,239,,2458,,2489,,2358,14,1289,12389,129',
  highlights: {
    cells: [{"row": 7, "col": 0, "fill": "blue"}, {"row": 7, "col": 5, "fill": "blue"}, {"row": 3, "col": 4, "fill": "blue"}, {"row": 4, "col": 4, "fill": "blue"}, {"row": 5, "col": 4, "fill": "blue"}, {"row": 6, "col": 4, "fill": "blue"}, {"row": 8, "col": 4, "fill": "blue"}],
  },
  hintData: {
  "title": "Almost Locked Sets",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 7,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 3,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 4,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 6,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 8,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `Almost Locked Sets: Examine the highlighted cells. Highlighted: R8C1, R8C6, R4C5, R5C5 (+3 more)`,
};

// Finned Squirmbag Example (Technique ID: 22) - NO EXAMPLE AVAILABLE

// ALS-Chain Example (Technique ID: 23)
export const alschainExample: TechniqueExample = {
  id: 'als-chain-1',
  techniqueId: 23,
  technique: 'ALS-Chain',
  difficulty: 'Advanced',
  prerequisites: ["Almost Locked Sets"],
  puzzle: '410000008000070060050090100004000600000207401080300200042700006560800090070005000',
  solution: '006523970928104305307608042230951687695080030781046059840739510003012704109460823',
  pencilmarks: ',,3679,56,2356,236,379,2357,,2389,239,389,145,,12348,359,,345,23678,,3678,46,,2368,,2347,2347,1237,23,,159,158,19,,3578,3579,369,39,3569,,568,,,358,,167,,1567,,456,1469,,57,579,1389,,,,13,139,358,135,,,,13,,1234,234,37,,2347,1389,,1389,1469,12346,,38,1234,234',
  highlights: {
    cells: [{"row": 0, "col": 5, "fill": "blue"}, {"row": 1, "col": 5, "fill": "blue"}, {"row": 3, "col": 5, "fill": "blue"}, {"row": 5, "col": 5, "fill": "blue"}, {"row": 6, "col": 5, "fill": "blue"}, {"row": 7, "col": 5, "fill": "blue"}, {"row": 1, "col": 0, "fill": "blue"}, {"row": 1, "col": 1, "fill": "blue"}, {"row": 1, "col": 2, "fill": "blue"}, {"row": 1, "col": 6, "fill": "blue"}, {"row": 6, "col": 0, "fill": "blue"}, {"row": 6, "col": 4, "fill": "blue"}, {"row": 6, "col": 6, "fill": "blue"}, {"row": 0, "col": 7, "fill": "blue"}, {"row": 2, "col": 7, "fill": "blue"}, {"row": 3, "col": 7, "fill": "blue"}, {"row": 4, "col": 7, "fill": "blue"}, {"row": 5, "col": 7, "fill": "blue"}, {"row": 6, "col": 7, "fill": "blue"}, {"row": 2, "col": 3, "fill": "blue"}],
  },
  hintData: {
  "title": "ALS Chain",
  "text": "Examine the highlighted cells.",
  "areas": [],
  "cells": [
    {
      "row": 0,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 3,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 6,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 7,
      "column": 5,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 1,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 2,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 1,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 6,
      "column": 0,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 6,
      "column": 4,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 6,
      "column": 6,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 0,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 2,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 3,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 4,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 5,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 6,
      "column": 7,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    },
    {
      "row": 2,
      "column": 3,
      "color": "blue",
      "fill": false,
      "actions": {
        "select": "0",
        "unselect": "0",
        "add": "",
        "remove": "",
        "highlight": ""
      }
    }
  ]
},
  description: `ALS Chain: Examine the highlighted cells. Highlighted: R1C6, R2C6, R4C6, R6C6 (+16 more)`,
};

// Collection of all examples (index = techniqueId - 1)
export const techniqueExamples: (TechniqueExample | null)[] = [
  fullhouseExample, hiddensingleExample, nakedsingleExample, hiddenpairExample, nakedpairExample, lockedcandidatesExample, hiddentripleExample, nakedtripleExample, hiddenquadExample, nakedquadExample, xwingExample, swordfishExample, jellyfishExample, xywingExample, null, squirmbagExample, null, null, xyzwingExample, wxyzwingExample, almostlockedsetsExample, null, alschainExample,
];

// Get example by technique ID (1-23)
export function getExampleByTechniqueId(techniqueId: number): TechniqueExample | null {
  if (techniqueId < 1 || techniqueId > 23) return null;
  return techniqueExamples[techniqueId - 1];
}

// Get example by technique name
export function getExampleByTechniqueName(technique: string): TechniqueExample | null {
  return techniqueExamples.find(
    (ex) => ex && ex.technique.toLowerCase() === technique.toLowerCase()
  ) ?? null;
}

// Get all available examples
export function getAllExamples(): TechniqueExample[] {
  return techniqueExamples.filter((ex): ex is TechniqueExample => ex !== null);
}

// Technique info map
export const TECHNIQUE_INFO: Record<number, { name: string; file: string; difficulty: string; prereqs: string[] }> = {
  "1": {
    "name": "Full House",
    "file": "Full_House",
    "difficulty": "Beginner",
    "prereqs": []
  },
  "2": {
    "name": "Hidden Single",
    "file": "Hidden_Single",
    "difficulty": "Beginner",
    "prereqs": [
      "Full House"
    ]
  },
  "3": {
    "name": "Naked Single",
    "file": "Naked_Single",
    "difficulty": "Beginner",
    "prereqs": [
      "Hidden Single"
    ]
  },
  "4": {
    "name": "Hidden Pair",
    "file": "Hidden_Pair",
    "difficulty": "Intermediate",
    "prereqs": [
      "Hidden Single"
    ]
  },
  "5": {
    "name": "Naked Pair",
    "file": "Naked_Pair",
    "difficulty": "Beginner",
    "prereqs": [
      "Naked Single"
    ]
  },
  "6": {
    "name": "Locked Candidates",
    "file": "Locked_Candidates",
    "difficulty": "Beginner",
    "prereqs": [
      "Naked Pair"
    ]
  },
  "7": {
    "name": "Hidden Triple",
    "file": "Hidden_Triple",
    "difficulty": "Intermediate",
    "prereqs": [
      "Hidden Pair"
    ]
  },
  "8": {
    "name": "Naked Triple",
    "file": "Naked_Triple",
    "difficulty": "Intermediate",
    "prereqs": [
      "Naked Pair"
    ]
  },
  "9": {
    "name": "Hidden Quad",
    "file": "Hidden_Quad",
    "difficulty": "Advanced",
    "prereqs": [
      "Hidden Triple"
    ]
  },
  "10": {
    "name": "Naked Quad",
    "file": "Naked_Quad",
    "difficulty": "Intermediate",
    "prereqs": [
      "Naked Triple"
    ]
  },
  "11": {
    "name": "X-Wing",
    "file": "X-Wing",
    "difficulty": "Intermediate",
    "prereqs": [
      "Locked Candidates"
    ]
  },
  "12": {
    "name": "Swordfish",
    "file": "Swordfish",
    "difficulty": "Intermediate",
    "prereqs": [
      "X-Wing"
    ]
  },
  "13": {
    "name": "Jellyfish",
    "file": "Jellyfish",
    "difficulty": "Advanced",
    "prereqs": [
      "Swordfish"
    ]
  },
  "14": {
    "name": "XY-Wing",
    "file": "XY-Wing",
    "difficulty": "Intermediate",
    "prereqs": [
      "Naked Pair"
    ]
  },
  "15": {
    "name": "Finned X-Wing",
    "file": "Finned_X-Wing",
    "difficulty": "Advanced",
    "prereqs": [
      "X-Wing"
    ]
  },
  "16": {
    "name": "Squirmbag",
    "file": "Squirmbag",
    "difficulty": "Advanced",
    "prereqs": [
      "Jellyfish"
    ]
  },
  "17": {
    "name": "Finned Swordfish",
    "file": "Finned_Swordfish",
    "difficulty": "Advanced",
    "prereqs": [
      "Swordfish",
      "Finned X-Wing"
    ]
  },
  "18": {
    "name": "Finned Jellyfish",
    "file": "Finned_Jellyfish",
    "difficulty": "Advanced",
    "prereqs": [
      "Jellyfish",
      "Finned Swordfish"
    ]
  },
  "19": {
    "name": "XYZ-Wing",
    "file": "XYZ-Wing",
    "difficulty": "Advanced",
    "prereqs": [
      "XY-Wing"
    ]
  },
  "20": {
    "name": "WXYZ-Wing",
    "file": "WXYZ-Wing",
    "difficulty": "Advanced",
    "prereqs": [
      "XYZ-Wing"
    ]
  },
  "21": {
    "name": "Almost Locked Sets",
    "file": "Almost_Locked_Sets",
    "difficulty": "Advanced",
    "prereqs": [
      "Naked Triple"
    ]
  },
  "22": {
    "name": "Finned Squirmbag",
    "file": "Finned_Squirmbag",
    "difficulty": "Advanced",
    "prereqs": [
      "Squirmbag",
      "Finned Jellyfish"
    ]
  },
  "23": {
    "name": "ALS-Chain",
    "file": "ALS-Chain",
    "difficulty": "Advanced",
    "prereqs": [
      "Almost Locked Sets"
    ]
  }
};

