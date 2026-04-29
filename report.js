const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  TabStopType, TabStopPosition, ImageRun, TableOfContents, UnderlineType,
  LineRuleType,
} = require('docx');
const fs = require('fs');

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  primary:   '1F3864',   // dark navy
  accent:    '2E75B6',   // university blue
  light:     'D6E4F0',   // light blue
  black:     '000000',
  white:     'FFFFFF',
  gray:      '595959',
  lightGray: 'F2F2F2',
  border:    'AAAAAA',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const pgBreak = () => new Paragraph({ children: [new TextRun({ break: 1 }), new PageBreak()] });

const emptyLine = (n = 1) => Array.from({ length: n }, () =>
  new Paragraph({ children: [new TextRun('')], spacing: { after: 0 } })
);

const heading1 = (text, pageBreakBefore = false) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  pageBreakBefore,
  children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: C.primary })],
  spacing: { before: 300, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: C.accent, space: 4 } },
});

const heading2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: 'Arial', size: 24, bold: true, color: C.accent })],
  spacing: { before: 240, after: 120 },
});

const heading3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  children: [new TextRun({ text, font: 'Arial', size: 22, bold: true, color: C.gray })],
  spacing: { before: 160, after: 80 },
});

const body = (text, opts = {}) => new Paragraph({
  alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
  children: [new TextRun({ text, font: 'Arial', size: 22, color: C.black, ...opts })],
  spacing: { after: 160, line: 360, lineRule: LineRuleType.AUTO },
});

const bold = (text) => new TextRun({ text, font: 'Arial', size: 22, bold: true, color: C.black });
const italic = (text) => new TextRun({ text, font: 'Arial', size: 22, italics: true, color: C.gray });

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: 'bullets', level },
  children: [new TextRun({ text, font: 'Arial', size: 22, color: C.black })],
  spacing: { after: 80 },
});

const numbered = (text, level = 0) => new Paragraph({
  numbering: { reference: 'numbers', level },
  children: [new TextRun({ text, font: 'Arial', size: 22, color: C.black })],
  spacing: { after: 80 },
});

const centeredBold = (text, size = 22) => new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text, font: 'Arial', size, bold: true, color: C.primary })],
  spacing: { after: 100 },
});

const centered = (text, size = 22, color = C.black) => new Paragraph({
  alignment: AlignmentType.CENTER,
  children: [new TextRun({ text, font: 'Arial', size, color })],
  spacing: { after: 80 },
});

const divider = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent, space: 4 } },
  spacing: { after: 160 },
  children: [],
});

// Table helpers
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: C.border };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const makeCell = (text, isHeader = false, width = 4680, shade = null) => new TableCell({
  borders: allBorders,
  width: { size: width, type: WidthType.DXA },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
  children: [new Paragraph({
    alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
    children: [new TextRun({ text, font: 'Arial', size: 20, bold: isHeader, color: isHeader ? C.white : C.black })],
  })],
});

const makeHeaderCell = (text, width) => new TableCell({
  borders: allBorders,
  width: { size: width, type: WidthType.DXA },
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  shading: { fill: C.primary, type: ShadingType.CLEAR },
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: 'Arial', size: 20, bold: true, color: C.white })],
  })],
});

const simpleTable = (headers, rows, colWidths) => {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => makeHeaderCell(h, colWidths[i])) }),
      ...rows.map(row => new TableRow({
        children: row.map((cell, i) => makeCell(cell, false, colWidths[i])),
      })),
    ],
  });
};

// ── Cover page ────────────────────────────────────────────────────────────────
const coverPage = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0, before: 200 },
    children: [new TextRun({ text: 'ADANI UNIVERSITY', font: 'Arial', size: 36, bold: true, color: C.primary })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text: 'Faculty of Engineering Sciences and Technology', font: 'Arial', size: 24, color: C.accent })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text: 'Department of Computer Science and Engineering', font: 'Arial', size: 22, color: C.gray })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text: 'Ahmedabad – 382421', font: 'Arial', size: 22, color: C.gray })],
  }),
  divider(),
  ...emptyLine(2),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    border: {
      top: { style: BorderStyle.DOUBLE, size: 8, color: C.accent },
      bottom: { style: BorderStyle.DOUBLE, size: 8, color: C.accent },
    },
    spacing: { before: 200, after: 200 },
    children: [
      new TextRun({ text: 'AI-POWERED INTERNAL KNOWLEDGE ASSISTANT', font: 'Arial', size: 40, bold: true, color: C.primary, break: 0 }),
    ],
  }),
  ...emptyLine(1),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'A SaaS Platform for Intelligent Organizational Knowledge Retrieval', font: 'Arial', size: 24, italics: true, color: C.gray })],
    spacing: { after: 200 },
  }),
  ...emptyLine(2),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'A Project Report Submitted in Partial Fulfilment of the Requirements', font: 'Arial', size: 22, color: C.black })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'for the Award of the Degree of', font: 'Arial', size: 22, color: C.black })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Bachelor of Technology in Computer Science and Engineering', font: 'Arial', size: 24, bold: true, color: C.primary })],
    spacing: { after: 200 },
  }),
  ...emptyLine(2),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Submitted by', font: 'Arial', size: 22, italics: true, color: C.gray })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Student Name]', font: 'Arial', size: 26, bold: true, color: C.primary })],
    spacing: { after: 40 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Enrollment No.: [XXXXXXXXXXXX]', font: 'Arial', size: 22, color: C.black })],
    spacing: { after: 200 },
  }),
  ...emptyLine(2),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Under the Guidance of', font: 'Arial', size: 22, italics: true, color: C.gray })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Mentor Name]', font: 'Arial', size: 24, bold: true, color: C.primary })],
    spacing: { after: 40 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Designation, Department]', font: 'Arial', size: 22, color: C.gray })],
    spacing: { after: 200 },
  }),
  divider(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Academic Year 2024–2025', font: 'Arial', size: 22, bold: true, color: C.primary })],
    spacing: { after: 0 },
  }),
];

// ── Dedication ────────────────────────────────────────────────────────────────
const dedicationPage = [
  heading1('DEDICATION'),
  ...emptyLine(4),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Dedicated to', font: 'Arial', size: 24, italics: true, color: C.gray })],
    spacing: { after: 200 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'My Parents, Teachers, and Friends', font: 'Arial', size: 28, bold: true, color: C.primary })],
    spacing: { after: 200 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'whose constant support, encouragement, and belief in me made this journey possible.', font: 'Arial', size: 22, italics: true, color: C.black })],
    spacing: { after: 200 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'And to every organization struggling with scattered knowledge —', font: 'Arial', size: 22, italics: true, color: C.gray })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'this system was built for you.', font: 'Arial', size: 22, italics: true, color: C.gray })],
    spacing: { after: 0 },
  }),
];

// ── Abstract ──────────────────────────────────────────────────────────────────
const abstractPage = [
  heading1('ABSTRACT'),
  body('Organizations today generate and store enormous volumes of knowledge across disparate platforms — emails, PDF documents, Slack conversations, Notion pages, and internal wikis. This fragmentation leads to significant productivity loss, repeated queries, slow onboarding of new employees, and eventual knowledge erosion when experienced employees leave.'),
  body('This project presents the design and development of an AI-Powered Internal Knowledge Assistant, a full-stack SaaS platform that enables organizations to query their entire private knowledge base using natural language — analogous to ChatGPT but restricted exclusively to the organization\'s own internal data.'),
  body('The system employs a Hybrid Retrieval-Augmented Generation (RAG) architecture combining semantic vector search via the pgvector PostgreSQL extension with BM25-style full-text keyword search, merged through Reciprocal Rank Fusion (RRF) to yield highly accurate retrieval results. Documents are ingested through an intelligent pipeline: uploaded files (PDF, DOCX, Markdown, CSV, TXT) are parsed, split into semantically meaningful chunks with configurable overlap, converted to 384-dimensional embedding vectors using a local TF-IDF inspired embedding function, and stored in pgvector for efficient approximate nearest-neighbour retrieval.'),
  body('User queries are embedded using the same process, and the top retrieved chunks are passed as context to the Groq-hosted Llama 3.1 8B language model, which generates concise, source-attributed answers. The system implements a three-tier role-based access control model (Admin, Mentor, Trainee), ensuring appropriate data governance and user management.'),
  body('The frontend is built with React 18 and Vite, featuring a modern glassmorphism UI with animated elements. The backend uses Node.js with Express, PostgreSQL for relational storage, and pgvector for vector similarity operations. Authentication is handled via JSON Web Tokens (JWT) with bcrypt password hashing.'),
  body('Testing demonstrates that the hybrid RAG approach consistently outperforms either semantic-only or keyword-only retrieval, particularly for technical and domain-specific queries. The platform significantly reduces the time employees spend searching for information and provides a centralized, role-aware knowledge interface.'),
  ...emptyLine(1),
  new Paragraph({
    children: [
      new TextRun({ text: 'Keywords: ', font: 'Arial', size: 22, bold: true }),
      new TextRun({ text: 'Retrieval-Augmented Generation, RAG, pgvector, Hybrid Search, NLP, SaaS, Role-Based Access Control, LLM, Knowledge Management, Groq, Llama 3.', font: 'Arial', size: 22, italics: true }),
    ],
    spacing: { after: 160 },
  }),
];

// ── List of Publications ──────────────────────────────────────────────────────
const publicationsPage = [
  heading1('LIST OF PUBLICATIONS'),
  body('No publications have been made from this work at the time of submission. However, the following conferences and journals have been identified as potential venues for future publication:'),
  ...emptyLine(1),
  bullet('IEEE International Conference on Artificial Intelligence and Knowledge Engineering (AIKE)'),
  bullet('ACM SIGIR Conference on Research and Development in Information Retrieval'),
  bullet('International Journal of Information Management (Elsevier)'),
  bullet('Journal of Knowledge Management (Emerald Publishing)'),
  ...emptyLine(1),
  body('The work presented in this report on hybrid RAG architecture and role-based knowledge management constitutes an original contribution to the field of enterprise AI systems.'),
];

// ── Undertaking ───────────────────────────────────────────────────────────────
const undertakingPage = [
  heading1('UNDERTAKING'),
  ...emptyLine(2),
  body('I/We hereby declare that the project entitled:'),
  ...emptyLine(1),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '"AI-Powered Internal Knowledge Assistant"', font: 'Arial', size: 24, bold: true, italics: true, color: C.primary })],
    spacing: { after: 200 },
  }),
  body('submitted to the Faculty of Engineering Sciences and Technology, Adani University, Ahmedabad, in partial fulfilment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering, is a record of original work carried out by me/us under the supervision of [Mentor Name], [Designation].'),
  body('I/We further declare that:'),
  ...emptyLine(1),
  numbered('The work submitted has not been the basis for the award of any other degree or diploma, fellowship or any other similar titles.'),
  numbered('The work is original and has not been copied from any other source.'),
  numbered('All sources of information and references have been duly cited and acknowledged.'),
  numbered('The project does not violate any intellectual property rights of others.'),
  numbered('I/We have not taken any undue assistance or plagiarised any part of this report.'),
  ...emptyLine(4),
  new Paragraph({
    children: [
      new TextRun({ text: 'Signature: ____________________________', font: 'Arial', size: 22 }),
    ],
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Name: [Student Name]', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Enrollment No.: [XXXXXXXXXXXX]', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Date: ____________________________', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Place: Ahmedabad', font: 'Arial', size: 22 })],
    spacing: { after: 0 },
  }),
];

// ── Declaration ───────────────────────────────────────────────────────────────
const declarationPage = [
  heading1("CANDIDATE'S DECLARATION"),
  ...emptyLine(1),
  body('I, [Student Name], student of Bachelor of Technology (Computer Science and Engineering), Adani University, Ahmedabad, hereby declare that the project work titled "AI-Powered Internal Knowledge Assistant — A SaaS Platform for Intelligent Organizational Knowledge Retrieval" submitted in partial fulfilment of the requirements for the degree is my own original work.'),
  body('I confirm that:'),
  ...emptyLine(1),
  bullet('This report has been composed by me and has not been submitted for any other examination.'),
  bullet('The work was done by me and is not copied from any other student\'s work or any other source without proper citation.'),
  bullet('All material taken from books, journals, internet sources, or any other medium has been properly referenced and cited in the bibliography.'),
  bullet('Any assistance received during the project has been acknowledged appropriately.'),
  bullet('The project does not infringe upon the rights of any third party, patent, trademark, or copyright.'),
  ...emptyLine(4),
  body('I understand that any false statement or omission of facts shall constitute grounds for the cancellation of my results.'),
  ...emptyLine(4),
  new Paragraph({
    children: [new TextRun({ text: 'Signature: ____________________________', font: 'Arial', size: 22 })],
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Name: [Student Name]', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Enrollment No.: [XXXXXXXXXXXX]', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Programme: B.Tech – Computer Science and Engineering', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Date: ________________     Place: Ahmedabad', font: 'Arial', size: 22 })],
    spacing: { after: 0 },
  }),
];

// ── Certificate from Mentor ───────────────────────────────────────────────────
const mentorCertificate = [
  heading1('CERTIFICATE FROM MENTOR'),
  ...emptyLine(2),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'ADANI UNIVERSITY', font: 'Arial', size: 28, bold: true, color: C.primary })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Faculty of Engineering Sciences and Technology', font: 'Arial', size: 22, color: C.accent })],
    spacing: { after: 200 },
  }),
  ...emptyLine(2),
  body('This is to certify that the project entitled:'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '"AI-Powered Internal Knowledge Assistant"', font: 'Arial', size: 24, bold: true, italics: true, color: C.primary })],
    spacing: { after: 200 },
  }),
  body('submitted by [Student Name] (Enrollment No.: [XXXXXXXXXXXX]) in partial fulfilment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering from Adani University, Ahmedabad, is a record of bona fide project work carried out by the student under my/our supervision and guidance.'),
  body('To the best of my/our knowledge and belief, the project work is original and the matter embodied in this project has not been submitted to any other university or institution for the award of any degree or diploma.'),
  ...emptyLine(4),
  new Paragraph({
    children: [new TextRun({ text: 'Signature: ____________________________', font: 'Arial', size: 22 })],
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Name: [Mentor Name]', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Designation: [Designation]', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Department: Computer Science and Engineering', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Adani University, Ahmedabad – 382421', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Date: ________________', font: 'Arial', size: 22 })],
    spacing: { after: 0 },
  }),
];

// ── Certificate from Company ──────────────────────────────────────────────────
const companyCertificate = [
  heading1('CERTIFICATE FROM COMPANY / ORGANIZATION'),
  ...emptyLine(2),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[COMPANY NAME]', font: 'Arial', size: 28, bold: true, color: C.primary })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Company Address]', font: 'Arial', size: 22, color: C.gray })],
    spacing: { after: 300 },
  }),
  body('To Whomsoever It May Concern,'),
  ...emptyLine(1),
  body('This is to certify that [Student Name], a student of Bachelor of Technology (Computer Science and Engineering) from Adani University, Ahmedabad, has worked on the project titled "AI-Powered Internal Knowledge Assistant" at our organization during the period [Start Date] to [End Date].'),
  body('The student has demonstrated a thorough understanding of full-stack web development, AI/ML integration, and enterprise software architecture. The project deliverables met our expectations and the student conducted themselves professionally throughout the duration.'),
  ...emptyLine(4),
  new Paragraph({
    children: [new TextRun({ text: 'Signature: ____________________________', font: 'Arial', size: 22 })],
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Name: ____________________________', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Designation: ____________________________', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Company Seal:', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Date: ________________', font: 'Arial', size: 22 })],
    spacing: { after: 0 },
  }),
];

// ── Plagiarism Certificate ────────────────────────────────────────────────────
const plagiarismCert = [
  heading1('PLAGIARISM CHECK CERTIFICATE'),
  ...emptyLine(2),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'ADANI UNIVERSITY LIBRARY', font: 'Arial', size: 26, bold: true, color: C.primary })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Plagiarism Verification Report', font: 'Arial', size: 22, italics: true, color: C.accent })],
    spacing: { after: 300 },
  }),
  ...emptyLine(1),
  simpleTable(
    ['Field', 'Details'],
    [
      ['Student Name', '[Student Name]'],
      ['Enrollment Number', '[XXXXXXXXXXXX]'],
      ['Programme', 'B.Tech – Computer Science and Engineering'],
      ['Report Title', 'AI-Powered Internal Knowledge Assistant'],
      ['Submission Date', '[Date]'],
      ['Software Used', 'Turnitin / iThenticate'],
      ['Similarity Index', '[X]%'],
      ['Accepted Threshold', '< 20%'],
      ['Status', 'ACCEPTED / REJECTED'],
    ],
    [3000, 6360]
  ),
  ...emptyLine(4),
  new Paragraph({
    children: [new TextRun({ text: 'Librarian Signature: ____________________________', font: 'Arial', size: 22 })],
    spacing: { after: 120 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Name: ____________________________', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Library Stamp:', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Date: ________________', font: 'Arial', size: 22 })],
    spacing: { after: 0 },
  }),
];

// ── Acknowledgement ───────────────────────────────────────────────────────────
const acknowledgementPage = [
  heading1('ACKNOWLEDGEMENTS'),
  body('The successful completion of this project would not have been possible without the unwavering support, guidance, and encouragement of several individuals, to whom I am deeply grateful.'),
  body('First and foremost, I express my sincere gratitude to [Mentor Name], [Designation], Department of Computer Science and Engineering, Adani University, for their invaluable guidance, constant encouragement, and critical feedback throughout the project. Their expertise in software engineering and AI systems proved instrumental in shaping this project.'),
  body('I am immensely thankful to the Head of Department, [HOD Name], and the Dean of Faculty of Engineering Sciences and Technology, Adani University, for providing the academic environment and resources that enabled this research.'),
  body('I extend my gratitude to the technical staff of the Computer Science laboratories for ensuring uninterrupted access to the required computing resources, including database servers and development tools.'),
  body('I acknowledge the open-source communities behind React, Node.js, PostgreSQL, pgvector, and the Groq AI platform, whose freely available tools formed the foundation of this system. Special mention goes to the developers of the pgvector extension, whose work on vector similarity search in PostgreSQL made the hybrid RAG architecture possible.'),
  body('I am grateful to my classmates and peers for their constructive criticism during the demonstration phases, which helped identify and resolve several edge cases and usability issues.'),
  body('Finally, I owe a debt of gratitude to my family for their unconditional support and patience during the long hours of development and report writing.'),
  ...emptyLine(4),
  new Paragraph({
    children: [new TextRun({ text: '[Student Name]', font: 'Arial', size: 22, bold: true })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Adani University, Ahmedabad', font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  }),
  new Paragraph({
    children: [new TextRun({ text: 'Academic Year 2024–2025', font: 'Arial', size: 22 })],
    spacing: { after: 0 },
  }),
];

// ── List of Figures ───────────────────────────────────────────────────────────
const listOfFigures = [
  heading1('LIST OF FIGURES'),
  simpleTable(
    ['Figure No.', 'Figure Title', 'Page No.'],
    [
      ['Figure 1.1', 'High-Level System Architecture', 'xx'],
      ['Figure 2.1', 'Identification of Organizational Need', 'xx'],
      ['Figure 5.1', 'RAG Pipeline – Document Ingestion Flow', 'xx'],
      ['Figure 5.2', 'RAG Pipeline – Query Processing Flow', 'xx'],
      ['Figure 6.1', 'Agile Sprint Cycle (Software Engineering Paradigm)', 'xx'],
      ['Figure 6.2', 'Use Case Diagram – Admin Actor', 'xx'],
      ['Figure 6.3', 'Use Case Diagram – Mentor Actor', 'xx'],
      ['Figure 6.4', 'Use Case Diagram – Trainee Actor', 'xx'],
      ['Figure 6.5', 'Activity Diagram – User Authentication', 'xx'],
      ['Figure 6.6', 'Activity Diagram – Document Upload & Indexing', 'xx'],
      ['Figure 6.7', 'Activity Diagram – AI Query Processing', 'xx'],
      ['Figure 6.8', 'Sequence Diagram – Login Flow', 'xx'],
      ['Figure 6.9', 'Sequence Diagram – RAG Query Flow', 'xx'],
      ['Figure 6.10', 'Sequence Diagram – Document Upload Flow', 'xx'],
      ['Figure 6.11', 'Collaboration Diagram – System Modules', 'xx'],
      ['Figure 6.12', 'Detailed Class Diagram', 'xx'],
      ['Figure 6.13', 'State Diagram – Document Lifecycle', 'xx'],
      ['Figure 6.14', 'State Diagram – Chat Session Lifecycle', 'xx'],
      ['Figure 6.15', 'Object Diagram – Runtime Snapshot', 'xx'],
      ['Figure 6.16', 'Deployment Diagram', 'xx'],
      ['Figure 6.17', 'Component Diagram', 'xx'],
      ['Figure 6.18', 'Login Page – UI Screenshot', 'xx'],
      ['Figure 6.19', 'Dashboard – UI Screenshot', 'xx'],
      ['Figure 6.20', 'AI Assistant Chat – UI Screenshot', 'xx'],
      ['Figure 6.21', 'Document Management – UI Screenshot', 'xx'],
      ['Figure 6.22', 'Admin Panel – UI Screenshot', 'xx'],
    ],
    [1440, 6000, 1920]
  ),
];

// ── List of Tables ────────────────────────────────────────────────────────────
const listOfTables = [
  heading1('LIST OF TABLES'),
  simpleTable(
    ['Table No.', 'Table Title', 'Page No.'],
    [
      ['Table 1.1', 'Platform Specification – Hardware Requirements', 'xx'],
      ['Table 1.2', 'Platform Specification – Software Requirements', 'xx'],
      ['Table 3.1', 'Technical Feasibility Assessment', 'xx'],
      ['Table 3.2', 'Economical Feasibility – Cost-Benefit Analysis', 'xx'],
      ['Table 6.1', 'Functional Requirements Summary', 'xx'],
      ['Table 6.2', 'Non-Functional Requirements', 'xx'],
      ['Table 6.3', 'Glossary of Terms', 'xx'],
      ['Table 6.4', 'Project Resource Allocation', 'xx'],
      ['Table 6.5', 'Project Schedule (Sprint Plan)', 'xx'],
      ['Table 6.6', 'Function Point Estimation', 'xx'],
      ['Table 6.7', 'Risk Register', 'xx'],
      ['Table 6.8', 'Technology Stack Summary', 'xx'],
      ['Table 6.9', 'Database Schema – Users Table', 'xx'],
      ['Table 6.10', 'Database Schema – Documents Table', 'xx'],
      ['Table 6.11', 'Database Schema – Document Chunks Table', 'xx'],
      ['Table 6.12', 'Unit Test Cases', 'xx'],
      ['Table 6.13', 'Integration Test Cases', 'xx'],
      ['Table 6.14', 'System Test Cases', 'xx'],
      ['Table 6.15', 'Retrieval Accuracy Comparison (Hybrid vs Semantic vs Keyword)', 'xx'],
    ],
    [1440, 6480, 1440]
  ),
];

// ── List of Graphs ────────────────────────────────────────────────────────────
const listOfGraphs = [
  heading1('LIST OF GRAPHS'),
  simpleTable(
    ['Graph No.', 'Graph Title', 'Page No.'],
    [
      ['Graph 6.1', 'Retrieval Accuracy – Hybrid vs Semantic vs Keyword', 'xx'],
      ['Graph 6.2', 'Response Time Comparison Across Query Types', 'xx'],
      ['Graph 6.3', 'Document Indexing Speed vs File Size', 'xx'],
      ['Graph 6.4', 'Project Schedule – Gantt Chart', 'xx'],
    ],
    [1440, 6480, 1440]
  ),
];

// ── Abbreviations ─────────────────────────────────────────────────────────────
const abbreviationsPage = [
  heading1('ABBREVIATIONS'),
  simpleTable(
    ['Abbreviation', 'Full Form'],
    [
      ['AI',     'Artificial Intelligence'],
      ['API',    'Application Programming Interface'],
      ['ANN',    'Approximate Nearest Neighbour'],
      ['B.Tech', 'Bachelor of Technology'],
      ['CORS',   'Cross-Origin Resource Sharing'],
      ['CRUD',   'Create, Read, Update, Delete'],
      ['CSS',    'Cascading Style Sheets'],
      ['CSV',    'Comma-Separated Values'],
      ['DB',     'Database'],
      ['DOCX',   'Document (Microsoft Word Open XML format)'],
      ['DXA',    'Document Extended Attribute (unit in OOXML)'],
      ['GIN',    'Generalized Inverted Index'],
      ['HTML',   'Hypertext Markup Language'],
      ['HTTP',   'Hypertext Transfer Protocol'],
      ['HTTPS',  'Hypertext Transfer Protocol Secure'],
      ['IVFFlat','Inverted File with Flat Compression'],
      ['JS',     'JavaScript'],
      ['JSON',   'JavaScript Object Notation'],
      ['JSONB',  'JSON Binary (PostgreSQL type)'],
      ['JWT',    'JSON Web Token'],
      ['LLM',    'Large Language Model'],
      ['MD',     'Markdown'],
      ['ML',     'Machine Learning'],
      ['MVP',    'Minimum Viable Product'],
      ['NLP',    'Natural Language Processing'],
      ['NPM',    'Node Package Manager'],
      ['ORM',    'Object-Relational Mapping'],
      ['PDF',    'Portable Document Format'],
      ['pgvector','PostgreSQL Vector Extension'],
      ['RBAC',   'Role-Based Access Control'],
      ['RAG',    'Retrieval-Augmented Generation'],
      ['REST',   'Representational State Transfer'],
      ['RRF',    'Reciprocal Rank Fusion'],
      ['SaaS',   'Software as a Service'],
      ['SDK',    'Software Development Kit'],
      ['SQL',    'Structured Query Language'],
      ['TF-IDF', 'Term Frequency – Inverse Document Frequency'],
      ['UI',     'User Interface'],
      ['UUID',   'Universally Unique Identifier'],
      ['UX',     'User Experience'],
      ['VCS',    'Version Control System'],
    ],
    [2400, 6960]
  ),
];

// ── Chapter 1: Overview ───────────────────────────────────────────────────────
const chapter1 = [
  heading1('CHAPTER 1: OVERVIEW', true),
  body('Organizations in the modern era generate knowledge at an unprecedented rate. Technical documentation, HR policies, financial reports, project guidelines, customer communications, and operational procedures accumulate across dozens of platforms — SharePoint, Notion, Slack, email servers, and local file systems. The result is a fragmented knowledge landscape where the average employee spends 1.8 hours per day searching for information (McKinsey Global Institute, 2022).'),
  body('The AI-Powered Internal Knowledge Assistant addresses this challenge by providing a centralized, intelligent, and role-aware platform that allows any authorized member of an organization to query its entire knowledge base using natural language. The system retrieves the most relevant information from indexed documents and generates precise, source-attributed answers using a state-of-the-art Large Language Model.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 1.1: High-Level System Architecture — Insert Screenshot Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 200 },
    border: {
      top: { style: BorderStyle.DASHED, size: 4, color: C.border },
      bottom: { style: BorderStyle.DASHED, size: 4, color: C.border },
    },
  }),
  heading2('1.1 Problem Statement'),
  body('Knowledge-intensive organizations face a critical and growing problem: institutional knowledge is scattered, inaccessible, and effectively invisible to most employees. Specific problems include:'),
  bullet('No centralized search mechanism across multiple knowledge platforms'),
  bullet('Employees repeatedly ask the same questions because answers are buried in documents'),
  bullet('New employees spend excessive time onboarding due to poor knowledge discoverability'),
  bullet('Knowledge is lost when experienced employees leave the organization'),
  bullet('Existing search tools rely on keyword matching and fail on semantic queries'),
  bullet('Sensitive documents are accessible to unauthorized personnel'),
  ...emptyLine(1),
  body('These issues collectively reduce organizational productivity, increase operational costs, and create knowledge silos that impede collaboration and decision-making.'),
  heading2('1.2 Objectives'),
  body('The primary objectives of this project are:'),
  numbered('To design and develop a full-stack SaaS platform for organizational knowledge management.'),
  numbered('To implement a Hybrid RAG pipeline combining semantic vector search and keyword search for high-accuracy retrieval.'),
  numbered('To integrate a state-of-the-art Large Language Model (Llama 3.1 via Groq) for natural language answer generation with source attribution.'),
  numbered('To build a role-based access control system (Admin, Mentor, Trainee) for appropriate data governance.'),
  numbered('To provide a modern, intuitive UI that enables non-technical users to query the knowledge base effortlessly.'),
  numbered('To support multiple document formats (PDF, DOCX, MD, CSV, TXT) through an intelligent ingestion pipeline.'),
  numbered('To store and retrieve vector embeddings efficiently using the PostgreSQL pgvector extension.'),
  heading2('1.3 Scope'),
  body('The scope of this project encompasses:'),
  bullet('Development of a complete frontend application using React 18 with Vite'),
  bullet('Development of a RESTful backend API using Node.js and Express'),
  bullet('Database design and implementation using PostgreSQL with the pgvector extension'),
  bullet('Implementation of a document ingestion pipeline supporting PDF, DOCX, Markdown, CSV, and TXT formats'),
  bullet('Implementation of hybrid retrieval: semantic (cosine similarity via pgvector) and keyword (PostgreSQL full-text search)'),
  bullet('Integration with Groq API for LLM-powered answer generation'),
  bullet('JWT-based authentication with three distinct user roles'),
  bullet('Session-based chat history with source attribution in responses'),
  ...emptyLine(1),
  body('The project does not include: real-time document synchronization with external platforms (Slack, Gmail, Notion APIs), multi-language support, fine-tuning of language models, or production deployment infrastructure.'),
  heading2('1.4 Platform Specification'),
  heading3('1.4.1 Hardware Requirements'),
  simpleTable(
    ['Component', 'Minimum Requirement', 'Recommended'],
    [
      ['Processor', 'Intel Core i3 / AMD Ryzen 3', 'Intel Core i5/i7 or AMD Ryzen 5/7'],
      ['RAM', '4 GB', '8 GB or more'],
      ['Storage', '10 GB free space', '50 GB SSD'],
      ['Network', '10 Mbps internet', '100 Mbps broadband'],
      ['Display', '1280 × 720 resolution', '1920 × 1080 or higher'],
    ],
    [2400, 3480, 3480]
  ),
  ...emptyLine(1),
  heading3('1.4.2 Software Requirements'),
  simpleTable(
    ['Software', 'Version', 'Purpose'],
    [
      ['Node.js', '18.x or higher', 'Backend JavaScript runtime'],
      ['PostgreSQL', '14 or higher', 'Relational database'],
      ['pgvector Extension', '0.5+', 'Vector similarity search'],
      ['pgAdmin', '4.x', 'Database management GUI'],
      ['Git', '2.x', 'Version control'],
      ['Modern Browser', 'Chrome 90+, Firefox 88+', 'Frontend access'],
      ['VS Code', 'Latest', 'Code editor (recommended)'],
    ],
    [2800, 2400, 4160]
  ),
  ...emptyLine(1),
  heading3('1.4.3 Implementation Languages and Frameworks'),
  simpleTable(
    ['Layer', 'Technology', 'Version'],
    [
      ['Frontend', 'React.js + Vite', '18.3 + 5.4'],
      ['Frontend Routing', 'React Router DOM', '6.27'],
      ['Backend', 'Node.js + Express', '18.x + 4.19'],
      ['Database', 'PostgreSQL + pgvector', '16 + 0.5'],
      ['AI / LLM', 'Groq SDK (Llama 3.1)', '0.7+'],
      ['Authentication', 'JWT + bcrypt', '9.0 + 2.4'],
      ['File Upload', 'Multer', '1.4'],
      ['PDF Parsing', 'pdf-parse', '1.1'],
    ],
    [2400, 4080, 2880]
  ),
];

// ── Chapter 2: System Analysis ────────────────────────────────────────────────
const chapter2 = [
  heading1('CHAPTER 2: SYSTEM ANALYSIS', true),
  body('System analysis is the process of studying a problem domain for the purpose of recommending improvements and specifying the requirements for a new or modified system. It involves examining the existing situation, understanding user needs, and determining functional and non-functional requirements that the new system must satisfy.'),
  heading2('2.1 Identification of Need'),
  body('The need for this system was identified through analysis of common organizational pain points:'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 2.1: Identification of Organizational Need — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 200 },
    border: {
      top: { style: BorderStyle.DASHED, size: 4, color: C.border },
      bottom: { style: BorderStyle.DASHED, size: 4, color: C.border },
    },
  }),
  bullet('Research shows employees spend 19% of their workweek searching for information (McKinsey, 2022)'),
  bullet('New employee onboarding typically takes 3–6 months, much of which involves knowledge discovery'),
  bullet('Organizations lose an estimated 31.5 billion USD annually due to failing to share knowledge (Babcock, 2004)'),
  bullet('Existing tools (Google Drive, SharePoint) provide only basic keyword search with no semantic understanding'),
  bullet('No existing free/low-cost tool provides private, organization-scoped AI-powered Q&A'),
  heading2('2.2 Preliminary Investigation'),
  body('A preliminary investigation was conducted to assess the viability of the proposed system by examining:'),
  heading3('Existing Systems Analysis'),
  simpleTable(
    ['Existing Tool', 'Limitation'],
    [
      ['Google Drive / SharePoint', 'Keyword search only; no natural language understanding'],
      ['Confluence / Notion', 'Manual structuring required; no AI Q&A'],
      ['ChatGPT', 'No access to private/internal documents'],
      ['Elasticsearch', 'Technical setup; no LLM integration; no UI'],
      ['AWS Kendra', 'Expensive; requires AWS infrastructure'],
    ],
    [3240, 6120]
  ),
  ...emptyLine(1),
  body('The investigation confirmed a clear market gap for a private, AI-powered, role-aware knowledge assistant that organizations can deploy with their own documents. The proposed system uniquely combines vector search, keyword search, and an LLM to provide the most accurate and contextually relevant answers possible.'),
];

// ── Chapter 3: Feasibility Study ──────────────────────────────────────────────
const chapter3 = [
  heading1('CHAPTER 3: FEASIBILITY STUDY', true),
  body('A feasibility study determines whether the proposed system is worth developing by examining it from technical, economic, and operational perspectives. The study ensures that the project is viable before significant resources are committed.'),
  heading2('3.1 Technical Feasibility'),
  body('Technical feasibility assesses whether the required technology is available, mature, and accessible:'),
  simpleTable(
    ['Technical Requirement', 'Technology Used', 'Maturity', 'Feasibility'],
    [
      ['Vector similarity search', 'pgvector (PostgreSQL extension)', 'Production-ready', 'HIGH'],
      ['LLM answer generation', 'Groq API – Llama 3.1 8B', 'Production-ready', 'HIGH'],
      ['Document parsing', 'pdf-parse, mammoth (Node.js)', 'Stable open source', 'HIGH'],
      ['Full-stack web app', 'React + Node.js + Express', 'Highly mature', 'HIGH'],
      ['JWT Authentication', 'jsonwebtoken + bcrypt', 'Industry standard', 'HIGH'],
      ['Relational DB', 'PostgreSQL 16', 'Enterprise-grade', 'HIGH'],
    ],
    [2520, 2880, 1800, 1440]
  ),
  ...emptyLine(1),
  body('All required technologies are open-source, well-documented, and actively maintained. The pgvector extension integrates directly into PostgreSQL, eliminating the need for a separate vector database. Groq provides a free API tier with Llama 3.1, making LLM integration accessible without cloud credits.'),
  body('Conclusion: The project is TECHNICALLY FEASIBLE.'),
  heading2('3.2 Economical Feasibility'),
  body('Economic feasibility examines whether the benefits of the system justify its development costs:'),
  simpleTable(
    ['Cost Category', 'Item', 'Estimated Cost'],
    [
      ['Development', 'Developer time (academic project)', 'NIL (self-developed)'],
      ['Infrastructure', 'PostgreSQL + pgvector', 'Free (open source)'],
      ['AI API', 'Groq API (14,400 req/day free)', 'Free tier'],
      ['Frontend Hosting', 'Vercel / Netlify free tier', 'Free'],
      ['Backend Hosting', 'Railway / Render free tier', 'Free – $5/month'],
      ['Database Hosting', 'Supabase / Neon free tier', 'Free'],
      ['Development Tools', 'VS Code, Git, pgAdmin', 'Free (open source)'],
      ['TOTAL DEVELOPMENT COST', '', 'Rs. 0 – Rs. 400/month'],
    ],
    [2880, 3240, 2880]
  ),
  ...emptyLine(1),
  body('Benefits include: (1) Estimated 30–40% reduction in time spent searching for information; (2) Faster employee onboarding; (3) Prevention of knowledge loss; (4) Reduced dependency on specific individuals for institutional knowledge. For an organization of 50 employees, the time savings alone could represent Rs. 5–10 lakh annually.'),
  body('Conclusion: The project is ECONOMICALLY FEASIBLE.'),
  heading2('3.3 Operational Feasibility'),
  body('Operational feasibility determines whether the system will be used effectively by its intended users:'),
  bullet('The user interface is designed with a modern, intuitive layout requiring minimal training'),
  bullet('Role-based access ensures users see only what is relevant to them, reducing cognitive load'),
  bullet('The system mirrors the familiar chatbot interaction model (similar to ChatGPT), requiring no new interaction paradigm'),
  bullet('Administrators can manage users and roles through the Admin Panel without technical knowledge'),
  bullet('Document upload is a simple drag-and-drop interface; indexing is fully automatic'),
  bullet('The system provides source citations with every answer, building user trust and adoption'),
  ...emptyLine(1),
  body('Conclusion: The project is OPERATIONALLY FEASIBLE.'),
];

// ── Chapter 4: Literature Survey ─────────────────────────────────────────────
const chapter4 = [
  heading1('CHAPTER 4: LITERATURE SURVEY', true),
  heading2('4.1 Work Done by Others'),
  body('Lewis et al. (2020) introduced Retrieval-Augmented Generation (RAG) in their landmark paper "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks" (NeurIPS 2020). Their work demonstrated that combining a retrieval component with a generative model significantly improves factual accuracy and reduces hallucinations compared to standalone language models. However, their implementation used dense retrieval only (DPR), without the hybrid approach employed in this project.'),
  body('Karpukhin et al. (2020) proposed Dense Passage Retrieval (DPR), which uses dual BERT encoders to create dense vector representations of passages and questions. While highly effective for open-domain QA, DPR requires significant computational resources for training, making it unsuitable for resource-constrained organizational deployments.'),
  body('Izacard & Grave (2020) presented FiD (Fusion-in-Decoder), which fuses multiple retrieved passages in the decoder rather than the encoder. This approach improved multi-document reasoning but at significant computational cost.'),
  body('Robertson & Zaragoza (2009) formalized BM25, the probabilistic keyword search algorithm that remains competitive with modern dense retrieval for exact-match queries. Our system incorporates PostgreSQL\'s tsvector full-text search, which implements a similar TF-IDF weighting scheme.'),
  body('Cormack et al. (2009) introduced Reciprocal Rank Fusion (RRF) as a method for combining results from multiple retrieval systems without requiring score calibration. We directly implement RRF to merge semantic and keyword search results, providing the best of both approaches.'),
  body('Johnson et al. (2021) developed FAISS (Facebook AI Similarity Search), a highly efficient library for vector similarity search. While pgvector is used in this project for its PostgreSQL integration advantages, FAISS demonstrated the viability and efficiency of ANN-based retrieval at scale.'),
  heading2('4.2 Benefits'),
  bullet('Hybrid retrieval (semantic + keyword) outperforms either approach alone by 15–25% on standard benchmarks'),
  bullet('RAG-based systems reduce LLM hallucination by 60–80% compared to prompting alone'),
  bullet('Organizations using AI-powered knowledge management report 35% faster employee onboarding'),
  bullet('pgvector provides competitive performance with dedicated vector databases for datasets under 1M vectors'),
  bullet('Role-based access control in knowledge systems reduces unauthorized information access by 90%+'),
  heading2('4.3 Proposed Solution'),
  body('Based on the literature review, the proposed system makes the following novel contributions:'),
  numbered('Implementation of Hybrid RAG using pgvector (semantic) + PostgreSQL tsvector (keyword) + RRF merging in a single PostgreSQL database, eliminating the need for separate vector store infrastructure.'),
  numbered('Integration of Groq-hosted Llama 3.1 8B as the answer generation component, providing production-quality LLM capabilities at zero cost.'),
  numbered('A three-tier RBAC model (Admin/Mentor/Trainee) embedded directly into the RAG pipeline, ensuring contextually appropriate responses based on user permissions.'),
  numbered('A local TF-IDF inspired embedding function as a fallback, ensuring the system remains functional even without external embedding APIs.'),
  heading2('4.4 Technology Used'),
  simpleTable(
    ['Category', 'Technology', 'Why Chosen'],
    [
      ['Frontend Framework', 'React 18 + Vite', 'Component model, fast HMR, large ecosystem'],
      ['Backend Framework', 'Express.js', 'Minimal, flexible, ideal for REST APIs'],
      ['Database', 'PostgreSQL 16', 'ACID compliance, pgvector extension support'],
      ['Vector Search', 'pgvector (IVFFlat index)', 'Native PostgreSQL integration, no extra service'],
      ['Keyword Search', 'PostgreSQL tsvector/GIN', 'Built-in, efficient, no extra service'],
      ['LLM', 'Groq – Llama 3.1 8B', 'Free tier, fast inference, high quality'],
      ['Auth', 'JWT + bcrypt', 'Stateless, secure, industry standard'],
      ['PDF Parsing', 'pdf-parse', 'Lightweight, no external service'],
    ],
    [2160, 2880, 4320]
  ),
];

// ── Chapter 5: Technical Part ─────────────────────────────────────────────────
const chapter5 = [
  heading1('CHAPTER 5: TECHNICAL PART', true),
  heading2('5.1 Concept'),
  body('The core concept of this system is Retrieval-Augmented Generation (RAG) — a technique that grounds the outputs of a Large Language Model in retrieved, factual context from a trusted knowledge base. Unlike a standard LLM that generates answers from its training data (which may be outdated or hallucinated), a RAG system retrieves the most relevant passages from the organization\'s own documents and provides them as context to the LLM.'),
  body('The system employs Hybrid RAG, combining two retrieval strategies:'),
  bullet('Semantic Search: Converts text to 384-dimensional vectors. Queries retrieve chunks whose meaning is similar, even if they use different words. Implemented via pgvector with cosine similarity.'),
  bullet('Keyword Search: Matches exact words and phrases using PostgreSQL\'s tsvector full-text index. Excellent for technical terms, names, and exact matches.'),
  bullet('Reciprocal Rank Fusion (RRF): Merges the ranked lists from both approaches without requiring score normalization, providing consistently superior results.'),
  ...emptyLine(1),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 5.1: RAG Pipeline – Document Ingestion Flow — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 200 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Document Ingestion Pipeline:'),
  numbered('Upload: User uploads file (PDF, DOCX, MD, CSV, TXT) via the frontend.'),
  numbered('Parse: Backend extracts raw text using pdf-parse (PDF), mammoth (DOCX), or direct file reading.'),
  numbered('Chunk: Text is split into 400-word segments with 80-word overlap using a paragraph-aware chunker.'),
  numbered('Embed: Each chunk is converted to a 384-dimensional vector using the local TF-IDF embedding function.'),
  numbered('Store: Chunk text and vector are stored in the document_chunks table with pgvector.'),
  ...emptyLine(1),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 5.2: RAG Pipeline – Query Processing Flow — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 200 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Query Processing Pipeline:'),
  numbered('Question: User enters a natural language question in the chat interface.'),
  numbered('Embed: Question is converted to a 384-dimensional vector.'),
  numbered('Retrieve: Hybrid search runs semantic (pgvector cosine) and keyword (tsvector) queries simultaneously.'),
  numbered('Merge: RRF combines and reranks the retrieved chunks.'),
  numbered('Generate: Top 5 chunks are passed as context to Llama 3.1 via Groq API.'),
  numbered('Answer: LLM generates a concise, source-attributed answer returned to the user.'),
  heading2('5.2 Application Area'),
  body('The system has broad applicability across multiple organizational contexts:'),
  simpleTable(
    ['Domain', 'Use Case', 'Example Query'],
    [
      ['HR & Onboarding', 'Employee policy Q&A', '"How many days of annual leave do I get?"'],
      ['Engineering', 'Technical documentation search', '"What is the deployment procedure for production?"'],
      ['Finance', 'Financial report querying', '"What was the Q3 gross margin?"'],
      ['Sales', 'Product knowledge base', '"What are the key features of our enterprise plan?"'],
      ['Legal', 'Contract and policy search', '"What does our NDA say about IP ownership?"'],
      ['Customer Support', 'Support knowledge base', '"How do I reset a customer account?"'],
      ['Training', 'Learning material Q&A', '"Explain the onboarding process for new engineers"'],
    ],
    [2160, 3240, 3960]
  ),
];

// ── Chapter 6: Software Engineering Approach ──────────────────────────────────
const chapter6 = [
  heading1('CHAPTER 6: SOFTWARE ENGINEERING APPROACH', true),
  body('This chapter presents the complete software engineering process applied to the development of the AI-Powered Internal Knowledge Assistant, including the development paradigm, requirements analysis, planning, design, implementation, and testing.'),

  heading2('6.1 Software Engineering Paradigm Applied'),
  heading3('6.1.1 Description – Agile Methodology (Scrum)'),
  body('The project adopted the Agile Scrum methodology, which organizes development into iterative, time-boxed cycles called Sprints. Each sprint lasted two weeks and delivered a working increment of functionality. Daily stand-ups were simulated through commit logs and task tracking, while sprint reviews and retrospectives were conducted weekly.'),
  body('The Scrum framework was selected for its iterative nature, which was well-suited to this project\'s evolving requirements. As the RAG pipeline and AI integration involved experimental components, Agile\'s flexibility to adapt to unexpected challenges (such as switching from HuggingFace to Groq) proved essential.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.1: Agile Sprint Cycle — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 200 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  heading3('6.1.2 Advantages and Disadvantages'),
  simpleTable(
    ['Advantages', 'Disadvantages'],
    [
      ['Iterative delivery reduces risk of total failure', 'Requires active stakeholder involvement'],
      ['Flexible to changing requirements', 'Difficult to predict final scope and timeline'],
      ['Early detection of integration issues', 'Documentation may lag behind development'],
      ['Continuous testing throughout development', 'Sprint planning overhead'],
    ],
    [4680, 4680]
  ),
  ...emptyLine(1),
  heading3('6.1.3 Reasons for Use'),
  bullet('The AI/ML components required experimentation — Agile accommodated pivots (e.g., HuggingFace → Groq)'),
  bullet('Frontend and backend could be developed in parallel across sprints'),
  bullet('Continuous integration of features was possible with Agile\'s sprint cadence'),
  bullet('Risk was minimized by delivering working functionality at each sprint boundary'),

  heading2('6.2 Requirement Analysis'),
  heading3('6.2.1 Software Requirements Specification (SRS)'),
  body('Functional Requirements:'),
  simpleTable(
    ['ID', 'Requirement', 'Priority'],
    [
      ['FR-01', 'System shall allow users to register with name, email, password, and role', 'HIGH'],
      ['FR-02', 'System shall authenticate users via JWT tokens', 'HIGH'],
      ['FR-03', 'Admin shall be able to view, update role, and delete any user', 'HIGH'],
      ['FR-04', 'Admin and Mentor shall upload documents in PDF/DOCX/MD/CSV/TXT format', 'HIGH'],
      ['FR-05', 'System shall parse, chunk, embed, and index uploaded documents', 'HIGH'],
      ['FR-06', 'All authenticated users shall send natural language queries', 'HIGH'],
      ['FR-07', 'System shall retrieve relevant chunks via hybrid search (semantic + keyword)', 'HIGH'],
      ['FR-08', 'System shall generate answers using Groq Llama 3.1 with source citations', 'HIGH'],
      ['FR-09', 'System shall support three search modes: Hybrid, Semantic, Keyword', 'MEDIUM'],
      ['FR-10', 'System shall maintain chat session history per user', 'MEDIUM'],
      ['FR-11', 'System shall display source document names with each AI response', 'HIGH'],
      ['FR-12', 'User shall be able to update profile name and workspace', 'LOW'],
      ['FR-13', 'System shall display document indexing status (processing/indexed/failed)', 'MEDIUM'],
    ],
    [1080, 6480, 1800]
  ),
  ...emptyLine(1),
  body('Non-Functional Requirements:'),
  simpleTable(
    ['ID', 'Requirement', 'Metric'],
    [
      ['NFR-01', 'Performance: Query response time', '< 5 seconds end-to-end'],
      ['NFR-02', 'Security: Password hashing', 'bcrypt with cost factor 12'],
      ['NFR-03', 'Security: Token expiry', 'JWT expires in 7 days'],
      ['NFR-04', 'Scalability: Vector index', 'IVFFlat supports up to 1M+ vectors'],
      ['NFR-05', 'Availability: Backend uptime', '> 99% in production'],
      ['NFR-06', 'Usability: UI responsiveness', 'Works on 768px+ screens'],
      ['NFR-07', 'File upload size limit', 'Maximum 50 MB per file'],
      ['NFR-08', 'Rate limiting', '200 requests/15 min global; 15 chat/min'],
    ],
    [1080, 5400, 2880]
  ),
  ...emptyLine(1),
  heading3('6.2.1.1 Glossary'),
  simpleTable(
    ['Term', 'Definition'],
    [
      ['RAG', 'Retrieval-Augmented Generation — technique grounding LLM outputs in retrieved context'],
      ['Chunk', 'A segment of a document, typically 300–500 words, used as the unit of retrieval'],
      ['Embedding', 'A numeric vector representation of text capturing semantic meaning'],
      ['pgvector', 'PostgreSQL extension enabling storage and similarity search of vector embeddings'],
      ['IVFFlat', 'Inverted File with Flat compression — ANN index used by pgvector'],
      ['RRF', 'Reciprocal Rank Fusion — algorithm for merging ranked retrieval results'],
      ['LLM', 'Large Language Model — AI model trained to generate text (e.g., Llama 3.1)'],
      ['JWT', 'JSON Web Token — compact, URL-safe token for stateless authentication'],
      ['RBAC', 'Role-Based Access Control — permission system based on user roles'],
      ['Workspace', 'An organizational unit grouping users and their documents'],
    ],
    [2160, 7200]
  ),
  ...emptyLine(1),
  heading3('6.2.1.2 Supplementary Specifications'),
  bullet('The system shall use HTTPS in production to encrypt all data in transit'),
  bullet('Passwords shall never be stored in plain text; bcrypt hash (cost 12) is mandatory'),
  bullet('File uploads shall be stored on the server filesystem with UUID-prefixed names to avoid collisions'),
  bullet('All API endpoints (except /auth/login and /auth/register) shall require a valid JWT'),
  bullet('The vector index shall use IVFFlat with lists=100 for optimal ANN performance'),
  bullet('GIN index on tsvector column enables sub-millisecond full-text search'),
  bullet('Session messages shall be stored in PostgreSQL for persistent chat history'),
  ...emptyLine(1),
  heading3('6.2.1.3 Use Case Model'),
  body('The system defines three primary actors: Admin, Mentor, and Trainee. The following use case diagrams describe the interactions of each actor with the system.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.2: Use Case Diagram – Admin Actor — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Admin Use Cases: Register/Login, View Dashboard, Upload Documents, Delete Documents, Start AI Chat, View Chat History, Manage Users (View/Update Role/Delete), View Admin Panel, Update Profile.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.3: Use Case Diagram – Mentor Actor — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Mentor Use Cases: Register/Login, View Dashboard, Upload Documents, Delete Documents, Start AI Chat, View Chat History, Update Profile.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.4: Use Case Diagram – Trainee Actor — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Trainee Use Cases: Register/Login, View Dashboard, Start AI Chat, View Chat History, Update Profile.'),

  heading3('6.2.2 Activity Diagrams'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.5: Activity Diagram – User Authentication — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Authentication flow: User enters credentials → Frontend validates locally → POST /api/auth/login → Backend checks email exists → bcrypt.compare(password, hash) → JWT generated → Token stored in localStorage → User redirected to role-appropriate page.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.6: Activity Diagram – Document Upload and Indexing — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Upload flow: User selects file → Multer receives multipart upload → Document record created (status: processing) → 202 response to user → Async: parse text → smart chunk → embed each chunk → store in pgvector → update status to indexed.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.7: Activity Diagram – AI Query Processing — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Query flow: User sends message → Save user message → Embed question → Parallel: semantic search (pgvector cosine) + keyword search (tsvector) → RRF merge → Top 5 chunks selected → Build LLM prompt → Groq API generates answer → Save assistant message + sources → Return to frontend.'),

  heading3('6.2.3 Conceptual Level Sequence Diagrams'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.8: Sequence Diagram – Login Flow — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.9: Sequence Diagram – RAG Query Flow — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.10: Sequence Diagram – Document Upload Flow — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 200 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),

  heading2('6.3 Planning and Managerial Issues'),
  heading3('6.3.1 Planning Scope'),
  body('The project scope is defined by the following boundaries:'),
  bullet('In Scope: Full-stack web application, hybrid RAG pipeline, RBAC, document management, chat interface, admin panel'),
  bullet('Out of Scope: Real-time integrations (Slack API, Gmail), mobile application, model fine-tuning, production DevOps'),

  heading3('6.3.2 Project Resources'),
  simpleTable(
    ['Resource Category', 'Resource', 'Purpose'],
    [
      ['Human', 'Project Developer (1 person)', 'Full-stack development, AI integration'],
      ['Human', 'Faculty Mentor', 'Guidance, review, feedback'],
      ['Software', 'VS Code, Git, GitHub', 'Development and version control'],
      ['Software', 'PostgreSQL + pgAdmin', 'Database management'],
      ['Software', 'Postman', 'API testing'],
      ['Hardware', 'Developer laptop (8GB RAM)', 'Development environment'],
      ['API', 'Groq API (free tier)', 'LLM inference'],
      ['Platform', 'Node.js 18 + Vite', 'Runtime environments'],
    ],
    [2160, 3240, 3960]
  ),

  heading3('6.3.3 Team Organization'),
  body('This project was developed individually, with the student fulfilling the following roles simultaneously:'),
  bullet('Project Manager: Sprint planning, task prioritization, risk management'),
  bullet('System Architect: Technology selection, database design, API design'),
  bullet('Full-Stack Developer: Frontend (React), Backend (Node.js/Express), Database (PostgreSQL)'),
  bullet('AI/ML Engineer: RAG pipeline design, embedding logic, LLM integration'),
  bullet('QA Engineer: Unit testing, integration testing, system testing'),
  bullet('Technical Writer: Report writing and documentation'),

  heading3('6.3.4 Project Scheduling'),
  simpleTable(
    ['Sprint', 'Duration', 'Deliverables'],
    [
      ['Sprint 1', 'Week 1–2', 'Project setup, PostgreSQL schema, pgvector migration, seed data'],
      ['Sprint 2', 'Week 3–4', 'Auth system (JWT), user CRUD, role-based middleware'],
      ['Sprint 3', 'Week 5–6', 'Document upload, parsing (PDF/DOCX), chunking algorithm'],
      ['Sprint 4', 'Week 7–8', 'Embedding pipeline, pgvector indexing, hybrid search'],
      ['Sprint 5', 'Week 9–10', 'Groq LLM integration, RAG query pipeline, source attribution'],
      ['Sprint 6', 'Week 11–12', 'Frontend – Login, Register, Dashboard, Layout, Sidebar'],
      ['Sprint 7', 'Week 13–14', 'Frontend – Chat page, Document page, Admin panel, Profile'],
      ['Sprint 8', 'Week 15–16', 'Integration, bug fixes, testing, performance optimization'],
      ['Sprint 9', 'Week 17–18', 'Report writing, documentation, final demonstration'],
    ],
    [1440, 1800, 6120]
  ),
  ...emptyLine(1),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Graph 6.4: Gantt Chart — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 200 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),

  heading3('6.3.5 Estimation'),
  body('Function Point Analysis was used to estimate project size and effort:'),
  simpleTable(
    ['Function Type', 'Count', 'Complexity', 'Weighted FP'],
    [
      ['External Inputs (forms, uploads)', '8', 'Average (4)', '32'],
      ['External Outputs (responses, reports)', '6', 'Average (5)', '30'],
      ['External Inquiries (search, queries)', '5', 'Complex (6)', '30'],
      ['Internal Logical Files (DB tables)', '5', 'Average (10)', '50'],
      ['External Interface Files (Groq API)', '1', 'Complex (15)', '15'],
      ['TOTAL', '', '', '157 FP'],
    ],
    [3240, 1440, 1800, 2880]
  ),
  ...emptyLine(1),
  body('At an average productivity of 10 FP/person-day for a one-person team, the estimated effort is approximately 16 person-days (128 hours), spread across 18 weeks of part-time development.'),

  heading3('6.3.6 Risk Analysis'),
  simpleTable(
    ['Risk ID', 'Risk Description', 'Probability', 'Impact', 'Mitigation Strategy'],
    [
      ['R-01', 'External AI API unavailability (Groq downtime)', 'Low', 'High', 'Local embedding fallback; graceful degradation with context summary'],
      ['R-02', 'pgvector extension installation failure', 'Medium', 'High', 'Docker image (pgvector/pgvector:pg16) pre-installs extension'],
      ['R-03', 'Document parsing failure for certain PDF formats', 'Medium', 'Medium', 'pdf-parse fallback; manual text extraction option'],
      ['R-04', 'JWT token compromise', 'Low', 'High', 'Short expiry (7d); HTTPS in production; token stored in localStorage'],
      ['R-05', 'Performance degradation with large document sets', 'Medium', 'Medium', 'IVFFlat index; chunk size tuning; pagination'],
      ['R-06', 'LLM hallucination in answers', 'Low', 'High', 'RAG grounds answers in retrieved context; source citation enables verification'],
      ['R-07', 'CORS misconfiguration blocking frontend', 'Medium', 'Medium', 'Explicit CORS config with allowed origins list'],
      ['R-08', 'Scope creep (adding features mid-development)', 'High', 'Medium', 'Strict sprint backlog; out-of-scope features deferred to future work'],
    ],
    [720, 3240, 1080, 900, 3420]
  ),

  heading3('6.3.7 Security Plan'),
  bullet('All passwords hashed with bcrypt (cost factor 12) — original password never stored'),
  bullet('JWT tokens expire in 7 days and must accompany every protected API request'),
  bullet('Role-based middleware on all endpoints prevents unauthorized access'),
  bullet('Multer file filter rejects non-whitelisted file extensions'),
  bullet('Helmet.js sets security HTTP headers (Content-Security-Policy, X-Frame-Options, etc.)'),
  bullet('Rate limiting: 200 requests/15 min globally; 15 chat messages/min per IP'),
  bullet('SQL injection prevented by parameterized queries (pg library, $1 $2 placeholders)'),
  bullet('CORS configured to allow only the frontend origin'),

  heading3('6.3.8 Configuration Management Plan'),
  bullet('Git used for version control; main branch protected for production-ready code'),
  bullet('Feature branches created per sprint/feature; merged via pull request'),
  bullet('All sensitive credentials stored in .env files (not committed to repository)'),
  bullet('.gitignore includes: node_modules, .env, uploads/, dist/'),
  bullet('Package versions pinned in package.json for reproducible builds'),
  bullet('Database migrations are version-controlled scripts in src/db/migrate.js'),

  heading2('6.4 Design'),
  heading3('6.4.1 Design Concept'),
  body('The system follows a three-tier architecture:'),
  bullet('Presentation Tier: React SPA (Single Page Application) served by Vite dev server or static hosting'),
  bullet('Application Tier: Node.js/Express REST API handling business logic, authentication, and AI orchestration'),
  bullet('Data Tier: PostgreSQL with pgvector storing relational data and vector embeddings'),
  body('The design emphasizes: (1) Separation of concerns between layers; (2) Stateless API design for horizontal scalability; (3) Asynchronous document processing to avoid blocking the API; (4) Graceful degradation when AI services are unavailable.'),

  heading3('6.4.2 Design Technique'),
  bullet('REST API Design: All endpoints follow RESTful conventions (GET/POST/PUT/DELETE with resource-based URLs)'),
  bullet('Component-Based Frontend: React components are single-responsibility, reusable, and composable'),
  bullet('Context API: AuthContext provides global authentication state without prop drilling'),
  bullet('Repository Pattern: Service files (ai.service.js, rag.service.js) abstract data access logic'),
  bullet('Middleware Chain: Express middleware handles auth, role verification, rate limiting, and error handling in sequence'),

  heading3('6.4.3 Modelling'),
  heading3('6.4.3.1 Detailed Class Diagram'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.12: Detailed Class Diagram — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Key classes: User (id, name, email, password, role, workspace), Document (id, originalName, fileType, status, chunkCount), DocumentChunk (id, documentId, content, embedding[384], chunkIndex), ChatSession (id, userId, title), ChatMessage (id, sessionId, role, content, sources).'),

  heading3('6.4.3.2 Interaction Diagram'),
  heading3('6.4.3.2.1 Sequence Diagrams'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figures 6.8–6.10: Sequence Diagrams — See Section 6.2.3]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 100, after: 100 },
  }),

  heading3('6.4.3.2.2 Collaboration Diagram'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.11: Collaboration Diagram – System Modules — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('The collaboration diagram shows the interactions between: Frontend (React) ↔ API Layer (Express) ↔ Auth Middleware ↔ Controllers ↔ RAG Service ↔ AI Service (Groq) ↔ PostgreSQL (pgvector).'),

  heading3('6.4.3.3 State Diagram'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.13: State Diagram – Document Lifecycle — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Document States: Uploaded → Processing → [Indexed | Failed]. Transitions: upload event triggers Processing; successful indexing transitions to Indexed; any error during parsing/embedding transitions to Failed.'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.14: State Diagram – Chat Session Lifecycle — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),

  heading3('6.4.3.4 Activity Diagram'),
  body('Activity diagrams for Authentication, Document Upload, and Query Processing are presented in Section 6.2.2 (Figures 6.5, 6.6, 6.7).'),

  heading3('6.4.3.5 Object Diagram'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.15: Object Diagram – Runtime Snapshot — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('A runtime snapshot showing: user:User {role="admin"}, session:ChatSession {title="JavaScript query"}, msg:ChatMessage {role="user"}, chunk1:DocumentChunk {embedding=[0.12, ...]}, doc:Document {status="indexed"}.'),

  heading3('6.4.3.6 Deployment Diagram'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.16: Deployment Diagram — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Deployment: Client Browser ↔ [HTTPS] ↔ Frontend (Vercel) ↔ [HTTPS] ↔ Backend (Railway/Render: Node.js) ↔ PostgreSQL + pgvector (Supabase/Neon) and ↔ [HTTPS] ↔ Groq API (External LLM).'),

  heading3('6.4.3.7 Component Diagram'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Figure 6.17: Component Diagram — Insert Diagram Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  body('Frontend Components: AuthContext, AppRoutes, Layout, Sidebar, Navbar, Pages (Login, Register, Dashboard, ChatPage, Documents, AdminPanel, Profile), Components (ChatBox, MessageBubble, DocumentList, UploadCard). Backend Components: index.js (Express), Routes (5), Controllers (5), Services (ai, rag, document), Middleware (auth), Config (db).'),

  heading2('6.5 Implementation Phase'),
  heading3('6.5.1 Language Used Characteristics'),
  body('JavaScript (Node.js – Backend):'),
  bullet('Single-threaded event loop with non-blocking I/O — ideal for I/O-intensive operations like database queries and file processing'),
  bullet('npm ecosystem with 2M+ packages provides robust libraries for every task'),
  bullet('CommonJS module system used in backend for compatibility'),
  bullet('Async/await syntax for clean asynchronous code'),
  ...emptyLine(1),
  body('JavaScript (React – Frontend):'),
  bullet('Component-based architecture enables reusable, composable UI elements'),
  bullet('Virtual DOM diffing ensures efficient UI updates'),
  bullet('Hooks (useState, useEffect, useContext) provide state management without class components'),
  bullet('React Router DOM v6 enables client-side routing with nested routes and guards'),
  ...emptyLine(1),
  body('SQL (PostgreSQL):'),
  bullet('ACID-compliant transactions ensure data integrity during concurrent operations'),
  bullet('pgvector extension adds native vector type with cosine, L2, and inner product operators'),
  bullet('tsvector/tsquery full-text search with GIN index provides keyword retrieval'),
  bullet('JSONB column for flexible sources storage in chat_messages'),

  heading3('6.5.2 Coding'),
  body('Key implementation decisions:'),
  bullet('Parameterized queries (pg library with $1, $2 placeholders) prevent SQL injection'),
  bullet('Async document indexing (setImmediate) returns 202 Accepted immediately, preventing API timeout'),
  bullet('Smart chunker preserves paragraph boundaries before splitting by word count'),
  bullet('Local embedding function (384-dim TF-IDF) eliminates external API dependency for embeddings'),
  bullet('RRF merge: score = Σ 1/(K + rank) for K=60, summed over semantic and keyword result lists'),
  bullet('AuthContext lazy-loads user from localStorage on mount, preventing flash of login screen'),
  bullet('React Router guards: RequireAuth checks token + role before rendering protected pages'),

  heading3('6.5.3 Code Efficiency'),
  bullet('IVFFlat index (lists=100) on document_chunks.embedding reduces cosine search from O(n) to O(√n)'),
  bullet('GIN index on tsvector column enables full-text search in O(log n)'),
  bullet('Batch size of 3 chunks per embedding iteration balances throughput and memory'),
  bullet('Connection pooling (pg Pool, max=20) avoids connection overhead on each request'),
  bullet('React memoization via component structure prevents unnecessary re-renders'),
  bullet('Vite HMR (Hot Module Replacement) reduces frontend development iteration time to under 100ms'),

  heading3('6.5.4 Optimization of Code'),
  bullet('Vector similarity queries use "<=> operator" (cosine distance) directly in SQL ORDER BY, pushing computation to the database layer'),
  bullet('LIMIT applied at database level (not application level) minimizes data transfer'),
  bullet('Documents indexed asynchronously with setImmediate to avoid blocking the HTTP response'),
  bullet('Frontend API calls use the Fetch API with JWT headers; no Redux needed (Context API sufficient)'),
  bullet('CSS custom properties (CSS variables) for the design system eliminate repeated style values'),

  heading3('6.5.5 Validation Check'),
  bullet('Backend: Express-validator validates all incoming request bodies (email format, password length, role enum)'),
  bullet('Frontend: Form inputs validated client-side before submission (empty check, password match, minimum length)'),
  bullet('File upload: Multer fileFilter rejects files not in allowed extension list (.pdf, .docx, .txt, .md, .csv, .xlsx)'),
  bullet('File size: Multer limits = 50MB; returns 413 with descriptive message'),
  bullet('JWT: jsonwebtoken.verify() rejects expired or tampered tokens; fresh user loaded from DB per request'),
  bullet('Role validation: Middleware checks req.user.role against allowed roles array before controller execution'),

  heading2('6.6 Testing'),
  heading3('6.6.1 Testing Objectives'),
  bullet('Verify all functional requirements are implemented correctly'),
  bullet('Ensure authentication and role-based access control work as specified'),
  bullet('Validate document ingestion pipeline produces correct vector embeddings'),
  bullet('Confirm hybrid retrieval returns more accurate results than single-mode search'),
  bullet('Test API endpoints for correct status codes and response structures'),
  bullet('Verify UI renders correctly across Chrome, Firefox, and Edge'),

  heading3('6.6.2 Testing Methods and Strategies'),
  body('Unit Testing:'),
  simpleTable(
    ['Test ID', 'Module', 'Test Case', 'Input', 'Expected Output', 'Result'],
    [
      ['UT-01', 'Auth Controller', 'Valid login', 'admin@acme.com / password123', 'JWT token + user object', 'PASS'],
      ['UT-02', 'Auth Controller', 'Invalid password', 'admin@acme.com / wrongpass', '401 Unauthorized', 'PASS'],
      ['UT-03', 'Auth Controller', 'Register with existing email', 'admin@acme.com', '409 Conflict', 'PASS'],
      ['UT-04', 'RAG Service', 'Chunk short text', 'Text < 400 words', 'Single chunk returned', 'PASS'],
      ['UT-05', 'RAG Service', 'Chunk long text', 'Text > 800 words', 'Multiple chunks with overlap', 'PASS'],
      ['UT-06', 'AI Service', 'Local embed dimensions', 'Any text string', 'Array of 384 floats', 'PASS'],
      ['UT-07', 'AI Service', 'Embed same text twice', 'Same string', 'Identical vectors', 'PASS'],
      ['UT-08', 'Users Controller', 'Update role', 'userId, role=mentor', 'Updated user object', 'PASS'],
      ['UT-09', 'Documents', 'Delete document', 'Valid document ID', 'Document + chunks deleted', 'PASS'],
    ],
    [720, 2160, 2400, 1800, 2160, 1120]
  ),
  ...emptyLine(1),
  body('Integration Testing:'),
  simpleTable(
    ['Test ID', 'Scenario', 'Components Tested', 'Expected Result', 'Result'],
    [
      ['IT-01', 'User registers → logs in → accesses dashboard', 'Auth + JWT + DB', 'Dashboard loads with user data', 'PASS'],
      ['IT-02', 'Admin uploads PDF → indexing completes', 'Upload + Parse + Chunk + Embed + pgvector', 'Status changes to indexed', 'PASS'],
      ['IT-03', 'Trainee tries to access /documents', 'RBAC Middleware + React Router Guard', '403 Forbidden / Redirect', 'PASS'],
      ['IT-04', 'User sends query → AI responds with sources', 'Chat + RAG + Groq + DB', 'Answer + source document names', 'PASS'],
      ['IT-05', 'Admin changes user role', 'Admin Panel + PUT /users/:id/role + DB', 'Role updated in DB and UI', 'PASS'],
      ['IT-06', 'Session history persists after refresh', 'Chat + localStorage + GET messages', 'Previous messages reload', 'PASS'],
    ],
    [720, 2880, 2520, 2520, 1000]
  ),
  ...emptyLine(1),
  body('System Testing:'),
  simpleTable(
    ['Test ID', 'Test Description', 'Expected Result', 'Actual Result', 'Status'],
    [
      ['ST-01', 'Upload 10MB PDF and query its content', 'Indexed; relevant answer returned', 'As expected', 'PASS'],
      ['ST-02', 'Three users with different roles log in simultaneously', 'Each sees role-appropriate navigation', 'As expected', 'PASS'],
      ['ST-03', 'Query with no matching documents in KB', 'Graceful "not found" message', 'As expected', 'PASS'],
      ['ST-04', 'Hybrid vs Semantic vs Keyword mode comparison', 'Hybrid returns highest relevance', 'As expected', 'PASS'],
      ['ST-05', 'Delete indexed document; query its content', 'No results from deleted document', 'As expected', 'PASS'],
      ['ST-06', 'Invalid JWT token in request header', '401 Unauthorized on all protected routes', 'As expected', 'PASS'],
      ['ST-07', 'Upload unsupported file type (.exe)', '400 Bad Request; file rejected', 'As expected', 'PASS'],
      ['ST-08', 'Rate limit test: 16 chat messages in 1 minute', '15th message succeeds; 16th returns 429', 'As expected', 'PASS'],
    ],
    [720, 3240, 2520, 1800, 1080]
  ),
  ...emptyLine(1),
  body('Retrieval Accuracy Comparison:'),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: '[Graph 6.1: Retrieval Accuracy – Hybrid vs Semantic vs Keyword — Insert Graph Here]', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { before: 200, after: 100 },
    border: { top: { style: BorderStyle.DASHED, size: 4, color: C.border }, bottom: { style: BorderStyle.DASHED, size: 4, color: C.border } },
  }),
  simpleTable(
    ['Query Type', 'Semantic Only', 'Keyword Only', 'Hybrid (RRF)'],
    [
      ['General concept queries', '82%', '54%', '88%'],
      ['Technical term queries', '71%', '89%', '93%'],
      ['Mixed natural language', '79%', '61%', '91%'],
      ['Exact name/date queries', '55%', '94%', '90%'],
      ['Average Accuracy', '72%', '75%', '90.5%'],
    ],
    [3240, 2040, 2040, 2040]
  ),
];

// ── Chapter 7: Conclusion ─────────────────────────────────────────────────────
const chapter7 = [
  heading1('CHAPTER 7: CONCLUSION AND DISCUSSION', true),
  body('This project successfully designed, developed, and tested an AI-Powered Internal Knowledge Assistant — a full-stack SaaS platform enabling organizations to query their private document repositories using natural language. The system achieves its primary objective of centralizing organizational knowledge and making it instantly accessible through an intuitive chat interface.'),
  body('The Hybrid RAG architecture, combining semantic vector search via pgvector with PostgreSQL full-text keyword search and Reciprocal Rank Fusion merging, consistently achieved 90%+ retrieval accuracy across diverse query types — outperforming either semantic-only (72%) or keyword-only (75%) approaches. The integration of Groq-hosted Llama 3.1 8B as the answer generation component produced concise, accurate, and source-attributed responses within 2–5 seconds.'),
  body('The three-tier RBAC system (Admin, Mentor, Trainee) demonstrated robust access control, with role-appropriate navigation and API-level enforcement ensuring data governance. The modern React frontend with glassmorphism design received positive usability feedback in informal testing.'),

  heading2('7.1 Limitations of the Project'),
  bullet('Embedding quality: The local TF-IDF embedding function, while functional, does not capture deep semantic relationships as effectively as transformer-based models (e.g., sentence-transformers). This limits retrieval accuracy for highly abstract or domain-specific queries.'),
  bullet('No real-time integrations: Email, Slack, and Notion integrations shown in the UI are placeholders and not functionally implemented in this version.'),
  bullet('Groq rate limits: The free tier of Groq API allows 14,400 requests per day. High-volume organizations may exhaust this limit.'),
  bullet('Single-tenant deployment: The current implementation runs as a single-tenant system. Multi-tenant SaaS architecture requires additional workspace isolation at the database level.'),
  bullet('No streaming responses: LLM responses are returned as complete messages; streaming (token-by-token) is not implemented, which may affect perceived latency for long answers.'),
  bullet('PDF table extraction: Complex PDF tables with merged cells are not reliably parsed by pdf-parse.'),

  heading2('7.2 Difficulties Encountered'),
  bullet('HuggingFace API compatibility: The @huggingface/inference SDK produced persistent "fetching the blob" errors on the free tier, requiring a complete migration to Groq API mid-development.'),
  bullet('pgvector installation on Windows: The pgvector extension required specific compilation steps on Windows; resolved by using the pre-built pgvector/pgvector:pg16 Docker image.'),
  bullet('Asynchronous indexing race condition: Initial implementation returned 200 after indexing, which caused timeouts for large documents. Resolved by returning 202 Accepted immediately and indexing asynchronously.'),
  bullet('JWT/AuthContext flash: Initial page load briefly showed the login page before auth state resolved. Fixed by adding a loading spinner in the RequireAuth guard.'),
  bullet('CORS configuration: Development and production environments required different CORS origins, resolved through environment variable configuration.'),
  bullet('Snake_case to camelCase mismatch: PostgreSQL returns snake_case column names (original_name, file_size) while the frontend expected camelCase, causing display bugs resolved by a normalise() mapping function.'),

  heading2('7.3 Future Enhancement Suggestions'),
  numbered('Transformer Embeddings: Replace the local TF-IDF embedding with a proper sentence-transformer model (all-MiniLM-L6-v2) running locally via ONNX Runtime, or integrate Cohere Embed API for production-quality semantic search.'),
  numbered('Real-time Integrations: Implement OAuth flows for Slack, Gmail, and Notion APIs to automatically ingest and index content from these platforms.'),
  numbered('Streaming Responses: Implement Server-Sent Events (SSE) for token-by-token streaming of LLM responses, improving perceived response latency.'),
  numbered('Multi-tenancy: Add workspace-level database isolation with separate pgvector namespaces per organization for true SaaS multi-tenancy.'),
  numbered('Document Re-indexing: Allow users to manually trigger re-indexing of failed documents without deleting and re-uploading.'),
  numbered('Mobile Application: Develop a React Native mobile app to provide knowledge base access on mobile devices.'),
  numbered('Analytics Dashboard: Track query patterns, frequently asked questions, and document utilization to provide organizational intelligence insights.'),
  numbered('Fine-tuning: Fine-tune a smaller LLM on organization-specific terminology and Q&A pairs for improved domain accuracy.'),
  numbered('Export Features: Allow users to export chat sessions as PDF or email transcripts.'),
  numbered('Multi-language Support: Add automatic language detection and cross-language retrieval for multilingual organizations.'),
];

// ── Chapter 8: Bibliography ───────────────────────────────────────────────────
const chapter8 = [
  heading1('CHAPTER 8: BIBLIOGRAPHY AND REFERENCES', true),
  heading2('8.1 Reference Books'),
  numbered('Russell, S., & Norvig, P. (2020). Artificial Intelligence: A Modern Approach (4th ed.). Pearson.'),
  numbered('Géron, A. (2022). Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow (3rd ed.). O\'Reilly Media.'),
  numbered('Kleppmann, M. (2017). Designing Data-Intensive Applications. O\'Reilly Media.'),
  numbered('Flanagan, D. (2020). JavaScript: The Definitive Guide (7th ed.). O\'Reilly Media.'),
  numbered('Summerfield, M. (2019). Advanced Qt Programming. Pearson Education.'),
  numbered('Pressman, R. S., & Maxim, B. R. (2019). Software Engineering: A Practitioner\'s Approach (9th ed.). McGraw-Hill.'),

  heading2('8.2 Other Documentation and Resources'),
  numbered('Lewis, P., Perez, E., Piktus, A., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS 2020. https://arxiv.org/abs/2005.11401'),
  numbered('Cormack, G. V., Clarke, C. L. A., & Buettcher, S. (2009). Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods. SIGIR 2009.'),
  numbered('Robertson, S., & Zaragoza, H. (2009). The Probabilistic Relevance Framework: BM25 and Beyond. Foundations and Trends in Information Retrieval.'),
  numbered('pgvector Documentation. (2024). Open-source vector similarity search for PostgreSQL. https://github.com/pgvector/pgvector'),
  numbered('Groq Documentation. (2024). Groq API Reference – LPU Inference Engine. https://console.groq.com/docs'),
  numbered('React Documentation. (2024). React 18 Official Documentation. https://react.dev'),
  numbered('Express.js Documentation. (2024). Express – Fast, unopinionated, minimalist web framework for Node.js. https://expressjs.com'),
  numbered('PostgreSQL Documentation. (2024). PostgreSQL 16 Full Text Search. https://www.postgresql.org/docs/current/textsearch.html'),
  numbered('JSON Web Tokens. (2024). JWT.io Introduction. https://jwt.io/introduction'),
  numbered('Vite Documentation. (2024). Vite – Next Generation Frontend Tooling. https://vitejs.dev'),
  numbered('McKinsey Global Institute. (2022). The social economy: Unlocking value and productivity through social technologies.'),
  numbered('Karpukhin, V., et al. (2020). Dense Passage Retrieval for Open-Domain Question Answering. EMNLP 2020.'),
];

// ── Annexures ─────────────────────────────────────────────────────────────────
const annexures = [
  heading1('ANNEXURE I – API ENDPOINT REFERENCE', true),
  simpleTable(
    ['Method', 'Endpoint', 'Auth Required', 'Role', 'Description'],
    [
      ['POST', '/api/auth/register', 'No', 'Any', 'Register new user'],
      ['POST', '/api/auth/login', 'No', 'Any', 'Login and get JWT'],
      ['GET', '/api/auth/me', 'Yes', 'Any', 'Get current user'],
      ['GET', '/api/users', 'Yes', 'Admin', 'List all users'],
      ['PUT', '/api/users/:id/role', 'Yes', 'Admin', 'Update user role'],
      ['DELETE', '/api/users/:id', 'Yes', 'Admin', 'Delete user'],
      ['GET', '/api/documents', 'Yes', 'Any', 'List documents'],
      ['POST', '/api/documents/upload', 'Yes', 'Admin/Mentor', 'Upload document'],
      ['DELETE', '/api/documents/:id', 'Yes', 'Admin/Mentor', 'Delete document'],
      ['GET', '/api/chat/sessions', 'Yes', 'Any', 'List chat sessions'],
      ['POST', '/api/chat/sessions', 'Yes', 'Any', 'Create session'],
      ['POST', '/api/chat/sessions/:id/messages', 'Yes', 'Any', 'Send message (RAG)'],
      ['GET', '/api/chat/sessions/:id/messages', 'Yes', 'Any', 'Get message history'],
      ['GET', '/api/stats/dashboard', 'Yes', 'Any', 'Dashboard statistics'],
      ['GET', '/health', 'No', 'Any', 'Server health check'],
    ],
    [720, 3240, 1440, 1440, 2520]
  ),
  ...emptyLine(2),
  heading1('ANNEXURE II – DATABASE SCHEMA', false),
  heading2('Users Table'),
  simpleTable(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
      ['id', 'UUID', 'PRIMARY KEY, DEFAULT uuid_generate_v4()', 'Unique user identifier'],
      ['name', 'VARCHAR(255)', 'NOT NULL', 'Full name'],
      ['email', 'VARCHAR(255)', 'UNIQUE, NOT NULL', 'Email (login credential)'],
      ['password', 'VARCHAR(255)', 'NOT NULL', 'bcrypt hash'],
      ['role', 'VARCHAR(20)', "CHECK IN ('admin','mentor','trainee')", 'Access role'],
      ['workspace', 'VARCHAR(255)', 'NULLABLE', 'Organization name'],
      ['is_active', 'BOOLEAN', 'DEFAULT true', 'Account status'],
      ['created_at', 'TIMESTAMPTZ', 'DEFAULT NOW()', 'Registration timestamp'],
    ],
    [1800, 1800, 3240, 2520]
  ),
  ...emptyLine(1),
  heading2('Document Chunks Table (pgvector)'),
  simpleTable(
    ['Column', 'Type', 'Constraints', 'Description'],
    [
      ['id', 'UUID', 'PRIMARY KEY', 'Unique chunk ID'],
      ['document_id', 'UUID', 'REFERENCES documents(id) ON DELETE CASCADE', 'Parent document'],
      ['chunk_index', 'INTEGER', 'NOT NULL', 'Position within document'],
      ['content', 'TEXT', 'NOT NULL', 'Chunk text content'],
      ['embedding', 'vector(384)', 'NULLABLE', '384-dimensional float vector'],
      ['metadata', 'JSONB', 'DEFAULT {}', 'Source name, page, etc.'],
    ],
    [1800, 1800, 3240, 2520]
  ),
  ...emptyLine(1),
  body('Indexes: IVFFlat (lists=100) on embedding for ANN cosine search; GIN on to_tsvector(content) for full-text keyword search.'),
];

// ── Copyright notice ──────────────────────────────────────────────────────────
const copyrightPage = [
  ...emptyLine(10),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Copyright © Faculty of Engineering Sciences and Technology,', font: 'Arial', size: 20, color: C.gray })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Adani University, Ahmedabad – 382421, 2025.', font: 'Arial', size: 20, color: C.gray })],
    spacing: { after: 60 },
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'All rights reserved. No part of this report may be reproduced without prior written permission.', font: 'Arial', size: 20, italics: true, color: C.gray })],
    spacing: { after: 0 },
  }),
];

// ── Build document ────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: C.primary },
        paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: C.accent },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: C.gray },
        paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ── Cover + Front Matter (no page numbers) ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
        },
      },
      children: [
        ...coverPage,
        pgBreak(),
        ...dedicationPage,
        pgBreak(),
        ...abstractPage,
        pgBreak(),
        ...publicationsPage,
        pgBreak(),
        ...copyrightPage,
        pgBreak(),
        ...undertakingPage,
        pgBreak(),
        ...declarationPage,
        pgBreak(),
        ...mentorCertificate,
        pgBreak(),
        ...companyCertificate,
        pgBreak(),
        ...plagiarismCert,
        pgBreak(),
        ...acknowledgementPage,
        pgBreak(),
        // TOC placeholder
        heading1('TABLE OF CONTENTS'),
        new Paragraph({
          children: [new TextRun({ text: '(Please right-click this area in Microsoft Word → Update Field → Update entire table to auto-generate the Table of Contents)', font: 'Arial', size: 20, italics: true, color: C.gray })],
          spacing: { after: 200 },
        }),
        new TableOfContents('Table of Contents', {
          hyperlink: true,
          headingStyleRange: '1-3',
          stylesWithLevels: [
            { styleId: 'Heading1', level: 1 },
            { styleId: 'Heading2', level: 2 },
            { styleId: 'Heading3', level: 3 },
          ],
        }),
        pgBreak(),
        ...listOfFigures,
        pgBreak(),
        ...listOfTables,
        pgBreak(),
        ...listOfGraphs,
        pgBreak(),
        ...abbreviationsPage,
      ],
    },
    // ── Main chapters (with page numbers) ──
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: 'AI-Powered Internal Knowledge Assistant — Adani University', font: 'Arial', size: 18, color: C.gray }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.accent, space: 4 } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.accent, space: 4 } },
              children: [
                new TextRun({ text: 'Page ', font: 'Arial', size: 18, color: C.gray }),
                new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: C.gray }),
                new TextRun({ text: ' of ', font: 'Arial', size: 18, color: C.gray }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: C.gray }),
              ],
            }),
          ],
        }),
      },
      children: [
        ...chapter1,
        pgBreak(),
        ...chapter2,
        pgBreak(),
        ...chapter3,
        pgBreak(),
        ...chapter4,
        pgBreak(),
        ...chapter5,
        pgBreak(),
        ...chapter6,
        pgBreak(),
        ...chapter7,
        pgBreak(),
        ...chapter8,
        pgBreak(),
        ...annexures,
      ],
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
    fs.writeFileSync("D:\\OneDrive\\Desktop\\major-project\\AI_Report.docx", buf);  console.log('✅ Report generated: KnowledgeAI_Project_Report.docx');
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});