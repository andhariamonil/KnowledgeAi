const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak,
  TableOfContents, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

// ─── helpers ────────────────────────────────────────────────────────────────
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorder = { top: NB, bottom: NB, left: NB, right: NB };
const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const allThin = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const headerBorder = { style: BorderStyle.SINGLE, size: 8, color: "1F3864" };
const allHeader = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

const PW = 9360; // content width in DXA (A4 with 1" margins)

function h1(text, bookmarkId) {
  const children = bookmarkId
    ? [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1F3864" })]
    : [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1F3864" })];
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children,
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F3864", space: 4 } }
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: "2E5090" })],
    spacing: { before: 280, after: 120 }
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "2E5090" })],
    spacing: { before: 200, after: 100 }
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })],
    spacing: { before: 60, after: 100 },
    alignment: AlignmentType.JUSTIFIED,
  });
}
function bold(text) { return new TextRun({ text, bold: true, size: 22, font: "Arial" }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function blank() { return new Paragraph({ children: [new TextRun("")], spacing: { before: 60, after: 60 } }); }

function centeredPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, size: 22, font: "Arial", ...opts })],
    spacing: { before: 80, after: 80 }
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, size: 22, font: "Arial" })],
    spacing: { before: 40, after: 60 }
  });
}
function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    children: [new TextRun({ text, size: 22, font: "Arial" })],
    spacing: { before: 40, after: 60 }
  });
}

function simpleTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  const makeBoldCell = (text, w, isHeader = false) => new TableCell({
    borders: allThin,
    width: { size: w, type: WidthType.DXA },
    shading: isHeader ? { fill: "1F3864", type: ShadingType.CLEAR } : { fill: "F5F7FA", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: isHeader, size: 20, font: "Arial", color: isHeader ? "FFFFFF" : "000000" })]
    })]
  });
  const makeCell = (text, w) => new TableCell({
    borders: allThin,
    width: { size: w, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, size: 20, font: "Arial" })]
    })]
  });

  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => makeBoldCell(h, colWidths[i], true))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders: allThin,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: ri % 2 === 0 ? { fill: "FFFFFF", type: ShadingType.CLEAR } : { fill: "EEF2F7", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, font: "Arial" })] })]
        }))
      }))
    ]
  });
}

// ─── COVER PAGE ─────────────────────────────────────────────────────────────
function coverPage() {
  return [
    blank(), blank(),
    centeredPara("AI-POWERED INTERNAL KNOWLEDGE ASSISTANT", { bold: true, size: 32, color: "1F3864" }),
    blank(),
    centeredPara("Report submitted in partial fulfillment of the requirements for the award of the degree of", { size: 22 }),
    blank(),
    centeredPara("Bachelor of Technology", { bold: true, size: 28, color: "1F3864" }),
    centeredPara("in", { size: 22 }),
    centeredPara("Computer Science & Engineering (AI-ML)", { bold: true, size: 26, color: "2E5090" }),
    blank(), blank(),
    centeredPara("By", { size: 22 }),
    blank(),
    centeredPara("NAME OF THE STUDENT", { bold: true, size: 26 }),
    centeredPara("Enrollment Number", { bold: true, size: 22 }),
    blank(), blank(),
    centeredPara("Under the Supervision of", { size: 22 }),
    blank(),
    centeredPara("NAME OF MENTOR", { bold: true, size: 24 }),
    blank(), blank(), blank(),
    centeredPara("DEPARTMENT OF CSE (AI-ML)", { bold: true, size: 22 }),
    centeredPara("FACULTY OF ENGINEERING SCIENCE AND TECHNOLOGY", { bold: true, size: 22 }),
    centeredPara("ADANI UNIVERSITY, AHMEDABAD-382421, INDIA", { bold: true, size: 22 }),
    blank(),
    centeredPara("NOV–DEC 2025", { bold: true, size: 22 }),
    pageBreak()
  ];
}

// ─── INSIDE COVER (same as cover but inside) ────────────────────────────────
function insideCoverPage() {
  return [
    blank(), blank(),
    centeredPara("AI-POWERED INTERNAL KNOWLEDGE ASSISTANT", { bold: true, size: 32, color: "1F3864" }),
    blank(),
    centeredPara("A Project Report", { size: 22 }),
    centeredPara("submitted in partial fulfillment of the requirements for the award of the degree of", { size: 22 }),
    blank(),
    centeredPara("Bachelor of Technology", { bold: true, size: 28, color: "1F3864" }),
    centeredPara("in", { size: 22 }),
    centeredPara("Computer Science & Engineering (AI-ML)", { bold: true, size: 26, color: "2E5090" }),
    blank(), blank(),
    centeredPara("By", { size: 22 }),
    blank(),
    centeredPara("NAME OF THE STUDENT", { bold: true, size: 26 }),
    centeredPara("Enrollment Number: [ENROLLMENT NO.]", { bold: true, size: 22 }),
    blank(), blank(),
    centeredPara("Under the Supervision of", { size: 22 }),
    blank(),
    centeredPara("NAME OF MENTOR", { bold: true, size: 24 }),
    centeredPara("Designation, Department of CSE (AI-ML)", { size: 22 }),
    blank(), blank(), blank(),
    centeredPara("DEPARTMENT OF CSE (AI-ML)", { bold: true, size: 22 }),
    centeredPara("FACULTY OF ENGINEERING SCIENCE AND TECHNOLOGY", { bold: true, size: 22 }),
    centeredPara("ADANI UNIVERSITY, AHMEDABAD-382421, INDIA", { bold: true, size: 22 }),
    blank(),
    centeredPara("NOV–DEC 2025", { bold: true, size: 22 }),
    pageBreak()
  ];
}

// ─── DEDICATION ─────────────────────────────────────────────────────────────
function dedicationPage() {
  return [
    blank(), blank(), blank(), blank(),
    centeredPara("DEDICATION", { bold: true, size: 28, color: "1F3864" }),
    blank(), blank(),
    centeredPara("Dedicated to", { size: 22, italics: true }),
    blank(),
    centeredPara("My Parents, Teachers, and Friends", { bold: true, size: 24 }),
    blank(),
    centeredPara("whose constant encouragement, support, and love", { size: 22, italics: true }),
    centeredPara("have been a source of inspiration throughout this journey.", { size: 22, italics: true }),
    blank(), blank(),
    centeredPara("And to all those who believe that technology", { size: 22, italics: true }),
    centeredPara("can transform the way we access and share knowledge.", { size: 22, italics: true }),
    pageBreak()
  ];
}

// ─── ABSTRACT ───────────────────────────────────────────────────────────────
function abstractPage() {
  return [
    h1("Abstract"),
    blank(),
    para("The AI-Powered Internal Knowledge Assistant is a full-stack SaaS (Software as a Service) platform designed to enable organizations to query their internal data repositories using natural language. Organizations today face a critical challenge: valuable knowledge is scattered across multiple platforms such as Notion, Slack, emails, PDFs, and other document management systems. This fragmentation leads to significant time wastage, knowledge loss, and slow employee onboarding processes."),
    blank(),
    para("This project addresses the aforementioned challenge by building a centralized AI assistant that understands company data, answers queries instantly, and provides source-attributed responses. The system is conceptually described as 'ChatGPT for company data,' functioning as a private, secure, and organization-specific question-answering engine."),
    blank(),
    para("The core technology employed is Retrieval-Augmented Generation (RAG), specifically a Hybrid RAG pipeline that combines semantic vector-based search with keyword-based full-text search. Documents uploaded to the system are parsed, chunked intelligently, embedded using AI embedding models, and stored in a PostgreSQL database with pgvector extension for fast similarity retrieval."),
    blank(),
    para("The system supports role-based access control with three distinct roles: Admin, Mentor, and Trainee. Each role has differentiated permissions ensuring security and appropriate access. The frontend is built using React.js with Vite, featuring a glassmorphism design aesthetic. The backend is built using Node.js and Express.js. The AI layer initially uses HuggingFace models but has been migrated to Groq's free-tier API (Llama 3.1 8B) for improved response reliability and speed."),
    blank(),
    para("The system supports ingestion of multiple document formats including PDF, DOCX, Markdown, CSV, and plain text files. A workspace system isolates data between organizational units. Chat sessions preserve conversation history enabling multi-turn dialogue. Query results include source citations with original document names for traceability."),
    blank(),
    para("This report documents the complete software engineering lifecycle of the project, including system analysis, feasibility studies, requirements specification, design diagrams, implementation details, testing strategies, and future enhancement roadmap."),
    blank(),
    para("Keywords: RAG, Hybrid Search, pgvector, Knowledge Management, SaaS, Role-Based Access Control, Natural Language Processing, Vector Embeddings, Groq, Node.js, React.js"),
    pageBreak()
  ];
}

// ─── LIST OF PUBLICATIONS ───────────────────────────────────────────────────
function publicationsPage() {
  return [
    h1("List of Publications"),
    blank(),
    para("No publications have been made from this project work at the time of submission. The following are proposed avenues for future publication:"),
    blank(),
    bullet("Conference paper on Hybrid RAG implementation for enterprise knowledge management systems."),
    bullet("Technical article on role-based access control design patterns in full-stack SaaS applications."),
    bullet("Workshop submission on integrating free-tier AI APIs (Groq, HuggingFace) with production-grade backend systems."),
    blank(),
    para("The author intends to submit findings to relevant IEEE or ACM conferences in the domain of Artificial Intelligence and Knowledge Management Systems upon completion of further research and validation."),
    pageBreak()
  ];
}

// ─── COPYRIGHT ──────────────────────────────────────────────────────────────
function copyrightPage() {
  return [
    blank(), blank(), blank(), blank(), blank(),
    centeredPara("Copyright © Faculty of Engineering Sciences and Technology,", { size: 22 }),
    centeredPara("Adani University, Ahmedabad-382421, 2025.", { size: 22 }),
    blank(),
    centeredPara("All rights reserved. No part of this report may be reproduced, stored in a retrieval system,", { size: 20 }),
    centeredPara("or transmitted in any form or by any means, electronic, mechanical, photocopying,", { size: 20 }),
    centeredPara("recording, or otherwise, without the prior written permission of the copyright holder.", { size: 20 }),
    pageBreak()
  ];
}

// ─── UNDERTAKING ────────────────────────────────────────────────────────────
function undertakingPage() {
  return [
    h1("Undertaking"),
    blank(),
    para("I hereby undertake that the project entitled 'AI-Powered Internal Knowledge Assistant' submitted by me for the partial fulfillment of the requirements of the degree of Bachelor of Technology in Computer Science & Engineering (AI-ML) at Adani University, Ahmedabad is my own work."),
    blank(),
    para("I further declare that:"),
    blank(),
    numbered("This project has not been submitted previously, in whole or in part, to any University or Institution for any degree, diploma, or other qualification."),
    numbered("The project work has been carried out by me under the guidance and supervision of my faculty mentor."),
    numbered("All the information, data, and results mentioned in this report are authentic to the best of my knowledge and belief."),
    numbered("I have given due acknowledgement to all sources of information used in the preparation of this report."),
    numbered("I am aware of and comply with the University's academic integrity policies."),
    blank(), blank(),
    para("Date: _______________________"),
    blank(),
    para("Place: Ahmedabad"),
    blank(), blank(),
    para("Signature of Student: _______________________"),
    blank(),
    para("Name: _______________________"),
    para("Enrollment No.: _______________________"),
    pageBreak()
  ];
}

// ─── DECLARATION ────────────────────────────────────────────────────────────
function declarationPage() {
  return [
    h1("Candidate's Declaration"),
    blank(),
    para("I, [NAME OF STUDENT], Enrollment No. [ENROLLMENT NUMBER], student of Bachelor of Technology in Computer Science & Engineering (AI-ML) at the Department of CSE (AI-ML), Faculty of Engineering Science and Technology, Adani University, Ahmedabad, hereby declare that the project report titled:"),
    blank(),
    centeredPara("\"AI-Powered Internal Knowledge Assistant\"", { bold: true, size: 24, color: "1F3864" }),
    blank(),
    para("submitted in partial fulfillment of the requirements for the degree of Bachelor of Technology is an authentic record of my own work carried out during the period Nov–Dec 2025, under the supervision of [NAME OF MENTOR], Department of CSE (AI-ML), Adani University."),
    blank(),
    para("The matter embodied in this project report has not been submitted by me for the award of any other degree or diploma of any University/Institution. All references used have been cited appropriately."),
    blank(), blank(),
    para("Date: _______________________"),
    para("Place: Ahmedabad"),
    blank(), blank(),
    para("Signature: _______________________"),
    para("Name: [NAME OF STUDENT]"),
    para("Enrollment No.: [ENROLLMENT NUMBER]"),
    pageBreak()
  ];
}

// ─── CERTIFICATE FROM MENTOR ────────────────────────────────────────────────
function mentorCertificatePage() {
  return [
    h1("Certificate from Mentor"),
    blank(),
    para("This is to certify that the project report entitled:"),
    blank(),
    centeredPara("\"AI-Powered Internal Knowledge Assistant\"", { bold: true, size: 24, color: "1F3864" }),
    blank(),
    para("submitted by [NAME OF STUDENT], Enrollment No. [ENROLLMENT NUMBER], in partial fulfillment of the requirements for the degree of Bachelor of Technology in Computer Science & Engineering (AI-ML) at Adani University, Ahmedabad, is a record of bonafide work carried out under my supervision and guidance during the period Nov–Dec 2025."),
    blank(),
    para("To the best of my knowledge, the work presented in this report is original and has not been submitted elsewhere for the award of any degree or diploma."),
    blank(), blank(),
    para("Date: _______________________"),
    para("Place: Ahmedabad"),
    blank(), blank(),
    para("Signature of Mentor: _______________________"),
    para("Name: [NAME OF MENTOR]"),
    para("Designation: [DESIGNATION]"),
    para("Department: CSE (AI-ML)"),
    para("Adani University, Ahmedabad"),
    blank(), blank(),
    para("Countersigned by:"),
    blank(),
    para("HOD Signature: _______________________"),
    para("Head of Department, CSE (AI-ML)"),
    para("Adani University, Ahmedabad"),
    pageBreak()
  ];
}

// ─── CERTIFICATE FROM COMPANY ───────────────────────────────────────────────
function companyCertificatePage() {
  return [
    h1("Certificate from Company / Organization"),
    blank(),
    para("(This certificate is to be provided if the project was undertaken in collaboration with or at any company/organization. If the project is purely academic, this page may be marked as 'Not Applicable' or replaced with the co-supervisor certificate from the institution.)"),
    blank(), blank(),
    new Paragraph({
      children: [new TextRun({ text: "[COMPANY/ORGANIZATION LETTERHEAD]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 }
    }),
    blank(), blank(),
    para("This is to certify that [NAME OF STUDENT], Enrollment No. [ENROLLMENT NUMBER], has successfully completed the project work titled 'AI-Powered Internal Knowledge Assistant' at [COMPANY NAME] during the period [START DATE] to [END DATE]."),
    blank(),
    para("The student has demonstrated satisfactory work ethic and technical skills during the tenure of the project."),
    blank(), blank(),
    para("Date: _______________________"),
    para("Place: _______________________"),
    blank(), blank(),
    para("Signature of Authorized Signatory: _______________________"),
    para("Name: _______________________"),
    para("Designation: _______________________"),
    para("Company/Organization: _______________________"),
    para("Company Stamp/Seal:"),
    pageBreak()
  ];
}

// ─── PLAGIARISM CHECK CERTIFICATE ───────────────────────────────────────────
function plagiarismPage() {
  return [
    h1("Plagiarism Check Certificate"),
    blank(),
    para("This is to certify that the project report entitled 'AI-Powered Internal Knowledge Assistant' submitted by [NAME OF STUDENT], Enrollment No. [ENROLLMENT NUMBER], has been checked for plagiarism using [PLAGIARISM DETECTION SOFTWARE, e.g., Turnitin / iThenticate]."),
    blank(),
    simpleTable(
      ["Parameter", "Details"],
      [
        ["Student Name", "[NAME OF STUDENT]"],
        ["Enrollment No.", "[ENROLLMENT NUMBER]"],
        ["Report Title", "AI-Powered Internal Knowledge Assistant"],
        ["Software Used", "[PLAGIARISM SOFTWARE NAME]"],
        ["Date of Check", "[DATE]"],
        ["Similarity Index", "____%"],
        ["Result", "ACCEPTED / REJECTED"],
      ],
      [4680, 4680]
    ),
    blank(),
    para("The similarity index is within the acceptable limit as per the University's guidelines. The certificate issued by the Library/Anti-Plagiarism Cell is attached herewith."),
    blank(), blank(),
    para("Signature of Librarian: _______________________"),
    para("Name: _______________________"),
    para("Date: _______________________"),
    para("Library Stamp:"),
    pageBreak()
  ];
}

// ─── ACKNOWLEDGEMENTS ───────────────────────────────────────────────────────
function acknowledgementsPage() {
  return [
    h1("Acknowledgements"),
    blank(),
    para("I would like to express my sincere gratitude to all those who have supported and guided me throughout the completion of this project."),
    blank(),
    para("First and foremost, I am deeply grateful to my project mentor, [NAME OF MENTOR], [Designation], Department of CSE (AI-ML), Adani University, for their invaluable guidance, constant encouragement, and insightful feedback throughout the course of this project. Their expertise in AI/ML and software engineering provided direction at every critical juncture."),
    blank(),
    para("I extend my heartfelt thanks to the Head of Department, [Name], Department of CSE (AI-ML), Faculty of Engineering Science and Technology, Adani University, for providing the necessary resources and a supportive environment for conducting this research."),
    blank(),
    para("I am also grateful to the faculty members of the Department of CSE (AI-ML) for their academic support and motivation. Their lectures and laboratory sessions on Artificial Intelligence, Machine Learning, Database Systems, and Web Technologies laid the foundation for this work."),
    blank(),
    para("I would like to acknowledge the open-source communities behind React.js, Node.js, PostgreSQL, pgvector, Groq, and various npm packages that made the development of this system possible. Special mention to Anthropic's Claude AI, which assisted in architecture planning and code review during development."),
    blank(),
    para("I am thankful to my family for their unwavering support, patience, and encouragement throughout my academic journey. Their belief in me has been my greatest motivation."),
    blank(),
    para("Lastly, I thank my friends and peers for their constructive criticism, collaborative discussions, and moral support."),
    blank(), blank(),
    para("[NAME OF STUDENT]"),
    para("Enrollment No.: [ENROLLMENT NUMBER]"),
    para("B.Tech CSE (AI-ML), Adani University"),
    para("Ahmedabad, Nov–Dec 2025"),
    pageBreak()
  ];
}

// ─── LIST OF FIGURES ────────────────────────────────────────────────────────
function listOfFiguresPage() {
  return [
    h1("List of Figures"),
    blank(),
    simpleTable(
      ["Figure No.", "Figure Title", "Page No."],
      [
        ["Fig 6.1", "Use Case Diagram – Admin Role", "19"],
        ["Fig 6.2", "Use Case Diagram – Mentor Role", "20"],
        ["Fig 6.3", "Use Case Diagram – Trainee Role", "21"],
        ["Fig 6.4", "Use Case Diagram – Full System Overview", "22"],
        ["Fig 6.5", "Conceptual Level Activity Diagram – Document Ingestion", "23"],
        ["Fig 6.6", "Conceptual Level Activity Diagram – Query Processing", "23"],
        ["Fig 6.7", "Conceptual Level Sequence Diagram – User Login", "23"],
        ["Fig 6.8", "Detailed Class Diagram", "30"],
        ["Fig 6.9", "Sequence Diagram – Document Upload & Indexing", "30"],
        ["Fig 6.10", "Sequence Diagram – Chat Query with RAG", "31"],
        ["Fig 6.11", "Collaboration Diagram – Chat Module", "31"],
        ["Fig 6.12", "State Diagram – Document Lifecycle", "32"],
        ["Fig 6.13", "State Diagram – User Session", "33"],
        ["Fig 6.14", "Activity Diagram – System Workflow", "34"],
        ["Fig 6.15", "Activity Diagram – Role-Based Access", "35"],
        ["Fig 6.16", "Object Diagram – Runtime Objects", "36"],
        ["Fig 6.17", "Deployment Diagram", "36"],
        ["Fig 6.18", "Component Diagram", "36"],
        ["Fig A1", "Login Page Screenshot", "A1"],
        ["Fig A2", "Dashboard Screenshot", "A1"],
        ["Fig A3", "Document Upload Page Screenshot", "A2"],
        ["Fig A4", "AI Chat Interface Screenshot", "A2"],
        ["Fig A5", "Admin Panel Screenshot", "A3"],
      ],
      [2000, 5360, 2000]
    ),
    pageBreak()
  ];
}

// ─── LIST OF TABLES ─────────────────────────────────────────────────────────
function listOfTablesPage() {
  return [
    h1("List of Tables"),
    blank(),
    simpleTable(
      ["Table No.", "Table Title", "Page No."],
      [
        ["Table 3.1", "Technical Feasibility Analysis", "7"],
        ["Table 3.2", "Economic Feasibility – Cost Analysis", "7"],
        ["Table 3.3", "Operational Feasibility – User Roles", "8"],
        ["Table 6.1", "Hardware Requirements", "3"],
        ["Table 6.2", "Software Requirements", "3"],
        ["Table 6.3", "Glossary of Terms", "18"],
        ["Table 6.4", "Supplementary Specifications", "18"],
        ["Table 6.5", "Project Resource Estimation", "24"],
        ["Table 6.6", "Risk Analysis Matrix", "26"],
        ["Table 6.7", "Test Cases – Authentication Module", "44"],
        ["Table 6.8", "Test Cases – Document Upload Module", "45"],
        ["Table 6.9", "Test Cases – RAG Query Module", "46"],
        ["Table 6.10", "Test Cases – Admin Panel Module", "47"],
      ],
      [2000, 5360, 2000]
    ),
    pageBreak()
  ];
}

// ─── LIST OF GRAPHS (blank for now) ─────────────────────────────────────────
function listOfGraphsPage() {
  return [
    h1("List of Graphs"),
    blank(),
    para("No graphs are included in the current version of this report. This section will be updated in future iterations with performance benchmarks, system load graphs, and query response time analysis charts."),
    pageBreak()
  ];
}

// ─── ABBREVIATIONS ──────────────────────────────────────────────────────────
function abbreviationsPage() {
  return [
    h1("Abbreviations"),
    blank(),
    simpleTable(
      ["Abbreviation", "Full Form"],
      [
        ["AI", "Artificial Intelligence"],
        ["ML", "Machine Learning"],
        ["NLP", "Natural Language Processing"],
        ["RAG", "Retrieval-Augmented Generation"],
        ["LLM", "Large Language Model"],
        ["API", "Application Programming Interface"],
        ["REST", "Representational State Transfer"],
        ["JWT", "JSON Web Token"],
        ["SaaS", "Software as a Service"],
        ["RBAC", "Role-Based Access Control"],
        ["CRUD", "Create, Read, Update, Delete"],
        ["UI", "User Interface"],
        ["UX", "User Experience"],
        ["DB", "Database"],
        ["SQL", "Structured Query Language"],
        ["ORM", "Object-Relational Mapping"],
        ["PDF", "Portable Document Format"],
        ["DOCX", "Microsoft Word Open XML Document"],
        ["CSV", "Comma-Separated Values"],
        ["DXA", "Document eXtended Attribute (unit)"],
        ["HTTP", "HyperText Transfer Protocol"],
        ["HTTPS", "HyperText Transfer Protocol Secure"],
        ["CORS", "Cross-Origin Resource Sharing"],
        ["HOD", "Head of Department"],
        ["CSE", "Computer Science & Engineering"],
        ["pgvector", "PostgreSQL vector similarity extension"],
        ["IVFFlat", "Inverted File Index with Flat Quantization"],
        ["GIN", "Generalized Inverted Index"],
        ["TF-IDF", "Term Frequency–Inverse Document Frequency"],
        ["BM25", "Best Match 25 (ranking algorithm)"],
        ["RRF", "Reciprocal Rank Fusion"],
        ["VITE", "Next-Generation Frontend Tooling"],
        ["npm", "Node Package Manager"],
        ["JSX", "JavaScript XML"],
      ],
      [2880, 6480]
    ),
    pageBreak()
  ];
}

// ─── CHAPTER 1: OVERVIEW ────────────────────────────────────────────────────
function chapter1() {
  return [
    h1("Chapter 1: Overview"),
    blank(),
    para("The AI-Powered Internal Knowledge Assistant is a modern SaaS platform developed to solve the pervasive problem of organizational knowledge fragmentation. In contemporary enterprise environments, knowledge is distributed across dozens of tools — Notion workspaces, Slack threads, email chains, PDF manuals, DOCX reports, and spreadsheets. Employees spend an estimated 20% of their working hours searching for information, and a significant portion of this time yields unsatisfactory results."),
    blank(),
    para("This system provides a unified conversational interface through which users can pose natural language questions and receive precise, source-attributed answers derived exclusively from their organization's internal documents. It operates on the principle of Retrieval-Augmented Generation (RAG), ensuring that AI responses are grounded in actual organizational data rather than hallucinated outputs."),
    blank(),
    h2("1.1 Problem Statement"),
    para("Modern organizations suffer from severe knowledge fragmentation. As companies scale, information becomes siloed across various platforms, leading to the following critical problems:"),
    blank(),
    bullet("No Centralized Search: Employees cannot query across all platforms simultaneously. Each tool has its own search, and cross-platform searching is practically impossible."),
    bullet("Time Wastage: Significant productive hours are lost daily as employees search through multiple systems for information that may or may not exist."),
    bullet("Knowledge Loss: When employees leave, their undocumented knowledge leaves with them. Documented knowledge is often buried in inaccessible formats."),
    bullet("Slow Onboarding: New employees take weeks to become productive because they cannot easily access institutional knowledge and context."),
    bullet("Inconsistent Information: Multiple versions of documents across platforms create confusion and lead to decisions based on stale data."),
    blank(),
    h2("1.2 Objectives"),
    para("The primary objectives of this project are:"),
    blank(),
    numbered("To design and implement a centralized AI-powered knowledge retrieval system capable of ingesting multiple document formats."),
    numbered("To implement a Hybrid RAG pipeline combining semantic vector search and keyword-based full-text search for high-accuracy query responses."),
    numbered("To build a secure role-based access control system supporting Admin, Mentor, and Trainee roles."),
    numbered("To develop a responsive, modern user interface with glassmorphism aesthetics and smooth animations."),
    numbered("To integrate the Groq AI API for fast, free-tier language model inference."),
    numbered("To create a workspace isolation system enabling multi-tenant use within a single deployment."),
    numbered("To ensure source attribution in all AI responses for traceability and trust."),
    blank(),
    h2("1.3 Scope"),
    para("The scope of this project encompasses the following areas:"),
    blank(),
    bullet("Document Ingestion: Support for PDF, DOCX, Markdown, CSV, and plain text file formats."),
    bullet("AI Query Interface: Natural language question answering with source citation."),
    bullet("User Management: Admin-controlled user registration, role assignment, and deletion."),
    bullet("Chat History: Persistent multi-session conversation history with export capability."),
    bullet("Workspace System: Logical isolation of data between organizational units."),
    bullet("Search Modes: User-selectable Hybrid, Semantic-only, or Keyword-only search modes."),
    blank(),
    para("The current version does not include: real-time collaboration, third-party integrations (Slack, Notion, Email are planned for future phases), mobile applications, or enterprise SSO (Single Sign-On) authentication."),
    blank(),
    h2("1.4 Platform Specification"),
    h3("1.4.1 Hardware Requirements"),
    blank(),
    simpleTable(
      ["Component", "Minimum Requirement", "Recommended"],
      [
        ["Processor", "Intel Core i5 / AMD Ryzen 5", "Intel Core i7 / AMD Ryzen 7"],
        ["RAM", "8 GB", "16 GB or more"],
        ["Storage", "50 GB HDD", "256 GB SSD"],
        ["Network", "10 Mbps Broadband", "100 Mbps Broadband"],
        ["GPU", "Not required", "NVIDIA GTX 1060+ (for local LLM)"],
      ],
      [2800, 3280, 3280]
    ),
    blank(),
    h3("1.4.2 Software Requirements"),
    blank(),
    simpleTable(
      ["Software", "Version", "Purpose"],
      [
        ["Node.js", "v18.x or higher", "Backend runtime"],
        ["npm", "v9.x or higher", "Package management"],
        ["PostgreSQL", "v14 or higher", "Primary database"],
        ["pgvector", "v0.5.0+", "Vector similarity search"],
        ["React.js", "v18.x", "Frontend framework"],
        ["Vite", "v5.x", "Frontend build tool"],
        ["pgAdmin 4", "Latest", "Database administration"],
        ["Git", "v2.x+", "Version control"],
        ["VS Code", "Latest", "Code editor"],
      ],
      [3120, 2120, 4120]
    ),
    blank(),
    h3("1.4.3 Implementation Language"),
    blank(),
    bullet("Frontend: JavaScript (JSX) with React.js and Vite"),
    bullet("Backend: JavaScript (Node.js) with Express.js framework"),
    bullet("Database Queries: SQL (PostgreSQL dialect with pgvector extensions)"),
    bullet("Styling: CSS3 with custom variables and Tailwind utility classes"),
    bullet("Configuration: JSON (.env, package.json), YAML"),
    pageBreak()
  ];
}

// ─── CHAPTER 2: SYSTEM ANALYSIS ─────────────────────────────────────────────
function chapter2() {
  return [
    h1("Chapter 2: System Analysis"),
    blank(),
    para("System analysis is the process of studying a procedural problem or business situation to identify improvement opportunities and develop solutions. For the AI-Powered Internal Knowledge Assistant, this phase involved examining the existing organizational knowledge management practices, identifying gaps, and defining precise requirements for the new system."),
    blank(),
    h2("2.1 Identification of Need"),
    para("The need for this system was identified through an analysis of typical organizational workflows in modern technology companies. The following observations formed the basis of this need:"),
    blank(),
    bullet("Employees across various departments were found to spend excessive time searching for procedural documents, policy files, and technical references across multiple platforms."),
    bullet("In fast-growing organizations, knowledge transfer during employee onboarding was found to be primarily manual and inconsistent."),
    bullet("Frequently asked questions within teams were being answered repeatedly, causing redundant effort for senior employees."),
    bullet("There was no searchable repository that could query across all document types simultaneously."),
    bullet("Responses from existing enterprise search tools lacked AI comprehension — they performed keyword matching but could not understand context or generate answers."),
    blank(),
    para("These observations led to the identification of the need for a conversational AI system that ingests internal organizational documents and responds to queries with contextual, source-backed answers."),
    blank(),
    h2("2.2 Preliminary Investigation"),
    para("The preliminary investigation involved researching the feasibility of building such a system, examining existing solutions in the market, and evaluating relevant technologies:"),
    blank(),
    bullet("Existing Solutions: Tools such as Notion AI, Microsoft Copilot, and Glean provide similar functionality but are proprietary, expensive, and do not offer self-hosted deployment. They also require full integration with existing SaaS platforms."),
    blank(),
    bullet("Technology Review: Retrieval-Augmented Generation (RAG) emerged as the optimal architecture because it allows grounding LLM responses in specific documents, preventing hallucination. PostgreSQL with pgvector was identified as a suitable vector store due to its open-source nature and ACID compliance."),
    blank(),
    bullet("API Availability: Initially, HuggingFace's free Inference API was identified for embedding and generation. However, during implementation, cold-start latencies and blob-fetching errors necessitated migration to Groq's API, which provides Llama 3.1 8B Instant with millisecond response times."),
    blank(),
    bullet("Development Approach: An Agile iterative development approach was chosen given the exploratory nature of the project, with frontend and backend developed concurrently and integrated progressively."),
    pageBreak()
  ];
}

// ─── CHAPTER 3: FEASIBILITY STUDY ───────────────────────────────────────────
function chapter3() {
  return [
    h1("Chapter 3: Feasibility Study"),
    blank(),
    para("A feasibility study evaluates whether the proposed system is practical and viable from technical, economic, and operational perspectives. This chapter presents a comprehensive feasibility analysis for the AI-Powered Internal Knowledge Assistant."),
    blank(),
    h2("3.1 Technical Feasibility"),
    para("Technical feasibility assesses whether the organization has or can acquire the technology and technical expertise required to develop and operate the proposed system."),
    blank(),
    simpleTable(
      ["Technical Aspect", "Assessment", "Verdict"],
      [
        ["RAG Implementation", "pgvector extension available for PostgreSQL; proven in production at scale", "Feasible"],
        ["AI API Integration", "Groq provides free API with Llama 3.1; HuggingFace as fallback", "Feasible"],
        ["Frontend Technology", "React.js with Vite is well-documented and widely adopted", "Feasible"],
        ["Backend Technology", "Node.js + Express is a mature, production-ready stack", "Feasible"],
        ["Vector Search", "IVFFlat index in pgvector supports cosine similarity at scale", "Feasible"],
        ["File Parsing", "PDF.js, mammoth.js, csv-parser are mature open-source libraries", "Feasible"],
        ["Authentication", "JWT-based auth is industry standard; bcryptjs for password hashing", "Feasible"],
        ["Deployment", "Docker containerization supports cloud deployment on AWS/GCP/Azure", "Feasible"],
      ],
      [3000, 4200, 2160]
    ),
    blank(),
    para("The system is technically feasible. All required technologies are open-source, well-documented, and actively maintained. The development team has demonstrated competency in each technology area through iterative implementation."),
    blank(),
    h2("3.2 Economic Feasibility"),
    para("Economic feasibility determines whether the benefits of the proposed system justify its development and operational costs."),
    blank(),
    para("Development Cost Estimation:"),
    blank(),
    simpleTable(
      ["Cost Component", "Estimated Cost (INR)", "Notes"],
      [
        ["Development Time (Academic Project)", "N/A", "Student project — no labor cost"],
        ["API Costs – Groq", "₹0", "Free tier: 14,400 req/day"],
        ["API Costs – HuggingFace", "₹0", "Free tier used for embeddings"],
        ["Database – PostgreSQL + pgvector", "₹0", "Open-source, self-hosted"],
        ["Frontend Framework – React/Vite", "₹0", "Open-source"],
        ["Backend Framework – Node.js/Express", "₹0", "Open-source"],
        ["Cloud Hosting (Estimated, Production)", "₹800–₹2000/month", "AWS EC2 t3.medium estimate"],
        ["Domain + SSL (Estimated, Production)", "₹600–₹1200/year", "Standard domain + Let's Encrypt"],
      ],
      [4200, 2880, 2280]
    ),
    blank(),
    para("The project is highly economically feasible for academic purposes with zero direct cost. Commercial deployment would incur modest hosting expenses but would be offset by significant organizational productivity gains from reduced knowledge retrieval time."),
    blank(),
    h2("3.3 Operational Feasibility"),
    para("Operational feasibility determines whether users will accept and effectively use the proposed system, and whether it fits within existing organizational processes."),
    blank(),
    simpleTable(
      ["Operational Factor", "Analysis"],
      [
        ["User Interface", "Glassmorphism dark-theme UI with intuitive navigation reduces learning curve"],
        ["Role-Based Access", "Three clearly defined roles (Admin/Mentor/Trainee) map to organizational hierarchy"],
        ["Training Requirement", "Minimal – users interact via natural language; no query language required"],
        ["Admin Overhead", "Admin panel provides full user management; document upload is drag-and-drop"],
        ["Change Resistance", "Chat-like interface mirrors familiar tools (WhatsApp, ChatGPT) reducing adoption friction"],
        ["Data Security", "JWT authentication, role-based access, and isolated workspaces address security concerns"],
        ["Integration", "REST API architecture allows future integration with existing organizational tools"],
      ],
      [3600, 5760]
    ),
    blank(),
    para("The system is operationally feasible. The user interface is designed for minimal learning curve, role-based access mirrors organizational structures, and the conversational paradigm is universally understood."),
    pageBreak()
  ];
}

// ─── CHAPTER 4: LITERATURE SURVEY ───────────────────────────────────────────
function chapter4() {
  return [
    h1("Chapter 4: Literature Survey"),
    blank(),
    para("This chapter reviews existing work in the areas of enterprise knowledge management, retrieval-augmented generation, and AI-powered search systems, drawing on published research and documented implementations."),
    blank(),
    h2("4.1 Work Done by Others"),
    para("Several researchers and organizations have explored AI-powered enterprise knowledge management:"),
    blank(),
    bullet("Lewis et al. (2020) introduced Retrieval-Augmented Generation (RAG) in their paper 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,' published at NeurIPS 2020. They demonstrated that augmenting language model generation with retrieved passages significantly improves factual accuracy."),
    blank(),
    bullet("Robertson and Zaragoza (2009) formalized BM25 (Best Match 25) ranking algorithm in 'The Probabilistic Relevance Framework: BM25 and Beyond.' BM25 remains the gold standard for keyword-based document retrieval."),
    blank(),
    bullet("Cormack et al. (2009) proposed Reciprocal Rank Fusion (RRF) as a method to combine rankings from multiple retrieval systems. This forms the basis of the hybrid search merging strategy in this project."),
    blank(),
    bullet("Microsoft's Azure Cognitive Search and Amazon Kendra represent commercial implementations of enterprise AI search, validating the market demand for this class of solutions. Both use similar RAG architectures but are proprietary and costly."),
    blank(),
    bullet("The pgvector project (open-source, 2021) enabled Postgres-native vector similarity search, democratizing vector databases. Prior to pgvector, vector search required dedicated databases like Pinecone or Weaviate."),
    blank(),
    h2("4.2 Benefits"),
    para("The proposed system offers the following demonstrated benefits over existing approaches:"),
    blank(),
    bullet("Zero Vendor Lock-in: Unlike Notion AI or Microsoft Copilot, the system is self-hosted and open-source at the core."),
    bullet("Privacy-First: All data resides within the organization's own infrastructure."),
    bullet("Cost-Effective: Uses free-tier APIs (Groq) and open-source databases."),
    bullet("Customizable: Role-based access, workspace isolation, and search mode selection are fully configurable."),
    blank(),
    h2("4.3 Proposed Solution"),
    para("The proposed solution addresses gaps in existing systems by combining:"),
    blank(),
    numbered("Hybrid RAG (semantic + keyword) for superior retrieval accuracy over single-method approaches."),
    numbered("Local embedding fallback ensuring the system functions even when external APIs are unavailable."),
    numbered("Role-based access control with three tiers appropriate for educational and enterprise environments."),
    numbered("Source attribution in every response for auditability and trust."),
    blank(),
    h2("4.4 Technology Used"),
    blank(),
    simpleTable(
      ["Layer", "Technology", "Justification"],
      [
        ["Frontend", "React.js v18 + Vite v5", "Component-based, fast HMR, ecosystem maturity"],
        ["Backend", "Node.js v18 + Express.js", "Non-blocking I/O, large package ecosystem"],
        ["Database", "PostgreSQL v14 + pgvector", "ACID compliance + native vector search"],
        ["AI – LLM", "Groq API (Llama 3.1 8B Instant)", "Free tier, sub-second latency"],
        ["AI – Embeddings", "Local TF-IDF / Sentence vectors", "Zero-cost, no API dependency"],
        ["Authentication", "JWT + bcryptjs", "Stateless, secure, industry standard"],
        ["File Processing", "pdf-parse, mammoth, csv-parser", "Mature parsing libraries for all formats"],
        ["Styling", "CSS3 + Glassmorphism", "Modern aesthetic, consistent design language"],
      ],
      [2200, 3200, 3960]
    ),
    pageBreak()
  ];
}

// ─── CHAPTER 5: TECHNICAL PART ──────────────────────────────────────────────
function chapter5() {
  return [
    h1("Chapter 5: Technical Part"),
    blank(),
    h2("5.1 Concept"),
    para("The system is built on the Retrieval-Augmented Generation (RAG) paradigm, which enhances language model outputs by providing relevant context retrieved from a knowledge base. The following two-phase workflow defines the system's core operation:"),
    blank(),
    para("Phase 1 — Document Ingestion Pipeline:"),
    blank(),
    bullet("Upload: Users upload documents (PDF, DOCX, MD, CSV, TXT) through the drag-and-drop interface."),
    bullet("Parse: The backend extracts raw text from the uploaded file using format-specific parsers (pdf-parse for PDF, mammoth for DOCX, standard fs for text files)."),
    bullet("Chunk: The extracted text is divided into overlapping chunks of approximately 400 words with 80-word overlap to preserve context across chunk boundaries."),
    bullet("Embed: Each chunk is converted into a numerical vector representation (embedding) using the local AI service or external embedding model."),
    bullet("Store: Embeddings are stored in PostgreSQL via the pgvector extension, alongside an IVFFlat vector index and a GIN full-text search index."),
    blank(),
    para("Phase 2 — Query Processing Pipeline:"),
    blank(),
    bullet("Question: User types a natural language question in the chat interface and selects a search mode (Hybrid/Semantic/Keyword)."),
    bullet("Embed: The question is converted to a vector embedding using the same model used during ingestion."),
    bullet("Retrieve: Based on the selected mode, the system performs cosine similarity search (semantic), full-text tsvector search (keyword), or both merged via Reciprocal Rank Fusion (hybrid)."),
    bullet("Generate: The top 5 retrieved chunks are passed as context to the Groq API (Llama 3.1 8B Instant) with a structured prompt instructing it to answer based only on the provided context."),
    bullet("Answer: The LLM response, along with source document citations, is returned to the user and displayed in the chat interface."),
    blank(),
    h2("5.2 Application Area"),
    para("The system has broad applicability across multiple domains:"),
    blank(),
    bullet("Corporate Training & Onboarding: New employees can query company policies, procedures, and onboarding documents conversationally."),
    bullet("Educational Institutions: Students and faculty can query academic resources, department policies, and course materials through a unified interface."),
    bullet("Legal Firms: Lawyers can search case files, precedents, and legal documents using natural language queries."),
    bullet("Healthcare Organizations: Medical professionals can query clinical guidelines, research papers, and patient protocols."),
    bullet("Software Development Teams: Developers can query internal wikis, API documentation, and code architecture documents."),
    bullet("Research Organizations: Researchers can query their literature collections and internal research reports."),
    pageBreak()
  ];
}

// ─── CHAPTER 6: SOFTWARE ENGINEERING APPROACH ───────────────────────────────
function chapter6() {
  const content = [
    h1("Chapter 6: Software Engineering Approach"),
    blank(),
    para("This chapter documents the complete software engineering lifecycle applied to the development of the AI-Powered Internal Knowledge Assistant, including paradigm selection, requirements analysis, project planning, design, implementation, and testing."),
    blank(),
    h2("6.1 Software Engineering Paradigm Applied"),
    h3("6.1.1 Description"),
    para("The Agile Software Development Methodology was applied for this project, specifically following Scrum-inspired sprint cycles. Given the exploratory nature of AI integration and the need for continuous feedback and adaptation, Agile was the most appropriate paradigm."),
    blank(),
    para("The development was organized into the following iterative phases:"),
    blank(),
    bullet("Sprint 1 (Week 1–2): Project setup, UI design, and basic frontend structure with mock data."),
    bullet("Sprint 2 (Week 2–3): Backend API development, database schema design, and authentication implementation."),
    bullet("Sprint 3 (Week 3–4): RAG pipeline implementation — document parsing, chunking, embedding, and vector storage."),
    bullet("Sprint 4 (Week 4–5): AI integration (HuggingFace → Groq migration), hybrid search implementation."),
    bullet("Sprint 5 (Week 5–6): Bug fixing, UI polish, role-based access refinement, and testing."),
    blank(),
    h3("6.1.2 Advantages & Disadvantages"),
    blank(),
    simpleTable(
      ["Advantages", "Disadvantages"],
      [
        ["Rapid iteration allows early identification of technical risks", "Requires active stakeholder involvement"],
        ["Working software delivered at each sprint end", "Scope can expand (scope creep) without discipline"],
        ["Flexibility to change AI provider mid-project (HF → Groq)", "Documentation may lag behind implementation"],
        ["Regular testing prevents accumulation of technical debt", "Less predictable timeline compared to Waterfall"],
      ],
      [4680, 4680]
    ),
    blank(),
    h3("6.1.3 Reasons for Use"),
    para("Agile was chosen because the project involved significant technological uncertainty (AI API reliability, vector search performance), requiring frequent adaptation. The single-developer context also suited Agile's lightweight structure over the heavier process of formal Waterfall documentation."),
    blank(),
    h2("6.2 Requirement Analysis"),
    para("Requirements were categorized into Functional Requirements (what the system does) and Non-Functional Requirements (quality attributes)."),
    blank(),
    para("Functional Requirements:"),
    bullet("FR-01: Users shall be able to register and log in with email and password."),
    bullet("FR-02: Admins shall be able to manage users — create, view, update roles, and delete accounts."),
    bullet("FR-03: Users with appropriate roles shall be able to upload documents (PDF, DOCX, MD, CSV, TXT)."),
    bullet("FR-04: The system shall parse, chunk, embed, and store uploaded documents automatically."),
    bullet("FR-05: Users shall be able to ask natural language questions and receive AI-generated answers."),
    bullet("FR-06: All AI responses shall include citations referencing the source documents."),
    bullet("FR-07: Users shall be able to select search mode: Hybrid, Semantic, or Keyword."),
    bullet("FR-08: Chat sessions shall be persisted and retrievable by users."),
    bullet("FR-09: Users shall be able to delete documents and chat sessions."),
    bullet("FR-10: Admins and Mentors shall be able to view system-wide statistics on the dashboard."),
    blank(),
    para("Non-Functional Requirements:"),
    bullet("NFR-01: Response time for chat queries shall not exceed 30 seconds under normal AI API conditions."),
    bullet("NFR-02: The UI shall be responsive and render correctly on screen widths from 768px to 1920px."),
    bullet("NFR-03: Passwords shall be hashed using bcrypt with a minimum salt factor of 10."),
    bullet("NFR-04: JWT tokens shall expire after 7 days."),
    bullet("NFR-05: The system shall handle file uploads up to 50 MB per document."),
    bullet("NFR-06: API endpoints shall implement rate limiting to prevent abuse."),
    blank(),
    h3("6.2.1 Software Requirements Specification"),
    h3("6.2.1.1 Glossary"),
    blank(),
    simpleTable(
      ["Term", "Definition"],
      [
        ["RAG", "Retrieval-Augmented Generation: technique that enhances LLM responses with retrieved context"],
        ["Chunk", "A fixed-size text segment extracted from a larger document during ingestion"],
        ["Embedding", "A numerical vector representation of text capturing semantic meaning"],
        ["Workspace", "A logical namespace isolating documents and users for a team or department"],
        ["Session", "A single conversation thread in the chat interface with its complete message history"],
        ["pgvector", "PostgreSQL extension enabling storage and similarity search of vector embeddings"],
        ["IVFFlat", "Index type in pgvector using Inverted File structure for approximate nearest neighbor search"],
        ["Hybrid Search", "Combination of semantic vector search and keyword full-text search with RRF merging"],
        ["Source Citation", "Reference to the original document from which an answer was derived"],
        ["Trainee", "User role with read-only access to chat and dashboard; cannot upload documents"],
      ],
      [2880, 6480]
    ),
    blank(),
    h3("6.2.1.2 Supplementary Specifications"),
    blank(),
    simpleTable(
      ["Category", "Specification"],
      [
        ["Performance", "Chat query response: < 30s; Page load: < 2s; Document indexing: < 60s per 10MB"],
        ["Security", "HTTPS in production; JWT authentication; bcrypt password hashing; Helmet.js security headers"],
        ["Scalability", "Stateless backend enables horizontal scaling; pgvector IVFFlat scales to millions of chunks"],
        ["Reliability", "Groq API fallback chain; local embedding fallback; database connection pooling"],
        ["Usability", "Responsive design; accessibility-aware color contrast; keyboard navigation supported"],
        ["Portability", "Containerizable with Docker; deployable on AWS, GCP, Azure, or bare-metal servers"],
        ["Maintainability", "Modular service architecture; separated controllers/routes/services; documented API"],
      ],
      [2400, 6960]
    ),
    blank(),
    h3("6.2.1.3 Use Case Model"),
    para("The system's use cases are organized by role. The following use case descriptions detail the interactions between actors and the system."),
    blank(),
    para("[Figure 6.1 — Use Case Diagram: Admin Role — Insert Screenshot Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[UI Image Placeholder — Use Case Diagram Admin]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Admin Use Cases: Login, Logout, View Dashboard, Upload Documents, View Documents, Delete Documents, View Chat History, Send Chat Queries, Manage Users (Create, View, Update Role, Delete), View Statistics."),
    blank(),
    para("[Figure 6.2 — Use Case Diagram: Mentor Role — Insert Screenshot Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[UI Image Placeholder — Use Case Diagram Mentor]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Mentor Use Cases: Login, Logout, View Dashboard, Upload Documents, View Documents, Delete Documents, View Chat History, Send Chat Queries, View Statistics. (Cannot manage users.)"),
    blank(),
    para("[Figure 6.3 — Use Case Diagram: Trainee Role — Insert Screenshot Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[UI Image Placeholder — Use Case Diagram Trainee]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Trainee Use Cases: Login, Logout, View Dashboard, View Chat History, Send Chat Queries. (Cannot upload documents or manage users.)"),
    blank(),
    para("[Figure 6.4 — Full System Use Case Diagram — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[UI Image Placeholder — Full System Use Case Diagram]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    h2("6.2.2 Conceptual Level Activity Diagram"),
    para("The conceptual activity diagram illustrates the high-level workflow of the system from document ingestion to query answering."),
    blank(),
    para("[Figure 6.5 — Activity Diagram: Document Ingestion — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[UI Image Placeholder — Activity Diagram Document Ingestion]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Document Ingestion Activity Flow: Start → User Uploads File → System Validates File Type → System Parses Text → System Splits into Chunks → System Generates Embeddings → System Stores in pgvector → System Updates Document Status to 'Indexed' → End."),
    blank(),
    para("[Figure 6.6 — Activity Diagram: Query Processing — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[UI Image Placeholder — Activity Diagram Query Processing]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Query Processing Activity Flow: Start → User Inputs Question → System Embeds Question → [Decision: Search Mode?] → Semantic: Vector cosine search → Keyword: Full-text tsvector search → Hybrid: Both + RRF merge → Retrieve Top 5 Chunks → Build LLM Prompt → Call Groq API → Receive LLM Response → Attach Source Citations → Display to User → End."),
    blank(),
    h2("6.2.3 Conceptual Level Sequence Diagram"),
    para("[Figure 6.7 — Sequence Diagram: User Login — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[UI Image Placeholder — Sequence Diagram User Login]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Login Sequence: User → Frontend (POST /api/auth/login) → Backend (auth.controller.js) → Database (SELECT user WHERE email) → Backend (bcrypt.compare password) → Backend (jwt.sign token) → Frontend (store token) → Redirect to Dashboard."),
    blank(),
    h2("6.3 Planning Managerial Issues"),
    h3("6.3.1 Planning Scope"),
    para("The project scope was defined to include a complete full-stack web application with AI capabilities, restricted to the features described in the requirements. Integrations with third-party platforms (Slack, Notion, Email) were explicitly placed in future scope to maintain timeline feasibility."),
    blank(),
    h3("6.3.2 Project Resources"),
    blank(),
    simpleTable(
      ["Resource Type", "Resource", "Availability"],
      [
        ["Human", "Developer (Student)", "Full-time, project duration"],
        ["Human", "Faculty Mentor", "Weekly guidance sessions"],
        ["Software", "Node.js, React.js, PostgreSQL", "Free / Open-source"],
        ["Software", "Groq API", "Free tier (14,400 req/day)"],
        ["Hardware", "Development Laptop (i7, 16GB RAM)", "Available"],
        ["Hardware", "Internet Connection (100 Mbps)", "Available"],
        ["Platform", "GitHub (Version Control)", "Free tier"],
        ["Platform", "pgAdmin 4", "Free"],
      ],
      [2400, 3800, 3160]
    ),
    blank(),
    h3("6.3.3 Team Organization"),
    para("This project was executed as a single-developer academic project with the following organizational structure:"),
    blank(),
    bullet("Project Lead / Developer: [NAME OF STUDENT] — responsible for all development, architecture decisions, and documentation."),
    bullet("Academic Supervisor / Mentor: [NAME OF MENTOR] — responsible for technical guidance, requirement validation, and report review."),
    bullet("Quality Reviewer: HOD/Faculty — responsible for final report and project evaluation."),
    blank(),
    h3("6.3.4 Project Scheduling"),
    blank(),
    simpleTable(
      ["Phase", "Activities", "Duration", "Milestone"],
      [
        ["Phase 1", "Requirement Analysis, Feasibility Study", "Week 1", "Requirements Document"],
        ["Phase 2", "System Design, Database Schema", "Week 1–2", "Design Documents"],
        ["Phase 3", "Frontend Development (UI)", "Week 2–3", "Working Frontend"],
        ["Phase 4", "Backend API Development", "Week 3–4", "Working API"],
        ["Phase 5", "RAG Pipeline + AI Integration", "Week 4–5", "AI Query Working"],
        ["Phase 6", "Integration, Testing, Bug Fixes", "Week 5–6", "Tested System"],
        ["Phase 7", "Documentation, Report Writing", "Week 6", "Final Report"],
      ],
      [1800, 3400, 1800, 2360]
    ),
    blank(),
    h3("6.3.5 Estimation"),
    para("Function Point estimation was used to quantify project complexity:"),
    blank(),
    simpleTable(
      ["Function Type", "Count", "Weight", "Function Points"],
      [
        ["External Inputs (uploads, login, queries)", "8", "4", "32"],
        ["External Outputs (answers, stats, lists)", "6", "5", "30"],
        ["External Queries (search, filters)", "5", "4", "20"],
        ["Internal Logical Files (5 tables)", "5", "10", "50"],
        ["External Interface Files (Groq API)", "1", "7", "7"],
        ["Total", "", "", "139 FP"],
      ],
      [3600, 1560, 1560, 2640]
    ),
    blank(),
    h3("6.3.6 Risk Analysis"),
    blank(),
    simpleTable(
      ["Risk", "Probability", "Impact", "Mitigation"],
      [
        ["AI API unavailability (Groq/HuggingFace)", "Medium", "High", "Local embedding fallback; LLM response chain with multiple fallbacks"],
        ["pgvector installation failure", "Low", "High", "Docker image with pgvector pre-installed as alternative"],
        ["Scope creep (adding integrations)", "High", "Medium", "Strict sprint planning; integrations deferred to future phase"],
        ["Data privacy breach", "Low", "Critical", "JWT auth; no external data transfer; role-based access"],
        ["Poor AI response quality", "Medium", "Medium", "System prompt engineering; hybrid search for better context retrieval"],
        ["Database performance at scale", "Low", "Medium", "IVFFlat index; connection pooling; query optimization"],
        ["Student time constraints", "High", "Medium", "Agile sprints with clear weekly milestones"],
      ],
      [2800, 1400, 1200, 3960]
    ),
    blank(),
    h3("6.3.7 Security Plan"),
    para("The following security measures are implemented:"),
    blank(),
    bullet("Authentication: JWT tokens with 7-day expiry, stored in localStorage (with plans for httpOnly cookie migration in production)."),
    bullet("Password Security: bcryptjs with salt factor 10; passwords never stored in plain text."),
    bullet("API Security: Helmet.js sets HTTP security headers; CORS restricts API access to the configured frontend origin."),
    bullet("Rate Limiting: Express-rate-limit middleware restricts authentication endpoints to 100 requests per 15 minutes per IP."),
    bullet("Role-Based Access: All protected API routes validate JWT and check user role before processing."),
    bullet("SQL Injection Prevention: Parameterized queries via the pg library; no raw string concatenation in SQL."),
    bullet("File Upload Security: Multer validates file MIME type and size; uploaded files stored with UUID names to prevent path traversal."),
    blank(),
    h3("6.3.8 Configuration Management Plan"),
    para("Version control is managed using Git with the following branch strategy:"),
    blank(),
    bullet("main: Production-ready stable code"),
    bullet("develop: Integration branch for completed features"),
    bullet("feature/[name]: Individual feature branches merged to develop via pull requests"),
    blank(),
    para("Environment configurations are managed via .env files (excluded from Git via .gitignore). Sensitive keys (database password, JWT secret, API keys) are never committed to version control."),
    blank(),
    h2("6.4 Design"),
    h3("6.4.1 Design Concept"),
    para("The system follows a three-tier architecture:"),
    blank(),
    bullet("Presentation Tier: React.js + Vite frontend with glassmorphism dark theme, animated backgrounds, and responsive design."),
    bullet("Application Tier: Node.js + Express.js RESTful API with JWT middleware, role guards, and modular service layer."),
    bullet("Data Tier: PostgreSQL with pgvector extension; five relational tables with vector and full-text indexes."),
    blank(),
    h3("6.4.2 Design Technique"),
    para("The following design patterns are applied:"),
    blank(),
    bullet("MVC (Model-View-Controller): Backend separates concerns into routes (router), controllers (business logic), and services (data access/AI)."),
    bullet("Component-Based Architecture: Frontend follows React's component model with reusable UI primitives (Button, Card, Input) and page-level components."),
    bullet("Service Layer Pattern: AI and RAG logic is encapsulated in dedicated service files (ai.service.js, rag.service.js, document.service.js) separate from HTTP controllers."),
    bullet("Context API (React): AuthContext provides global authentication state and role helper functions across all components."),
    blank(),
    h3("6.4.3 Modelling"),
    h3("6.4.3.1 Detailed Class Diagram"),
    para("[Figure 6.8 — Detailed Class Diagram — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Detailed Class Diagram showing User, Document, Chunk, ChatSession, ChatMessage classes with attributes and relationships]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Key classes: User (id, email, name, role, workspace, created_at), Document (id, user_id, original_name, file_type, file_size, status, created_at), DocumentChunk (id, document_id, content, embedding[384], chunk_index), ChatSession (id, user_id, title, workspace, created_at), ChatMessage (id, session_id, role, content, sources[JSONB], created_at)."),
    blank(),
    h3("6.4.3.2 Interaction Diagram"),
    h3("6.4.3.2.1 Sequence Diagram"),
    para("[Figure 6.9 — Sequence Diagram: Document Upload and Indexing — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Sequence Diagram Document Upload]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Upload Sequence: User → React Frontend → POST /api/documents/upload → Express Router → document.controller.js (save file metadata to DB, status='processing') → document.service.js (parse text) → rag.service.js (chunk text) → ai.service.js (embedText) → DB (INSERT chunks with embeddings) → document.controller.js (UPDATE status='indexed') → Frontend (refresh document list)."),
    blank(),
    para("[Figure 6.10 — Sequence Diagram: Chat Query with RAG — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Sequence Diagram Chat Query RAG]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    h3("6.4.3.2.2 Collaboration Diagram"),
    para("[Figure 6.11 — Collaboration Diagram: Chat Module — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Collaboration Diagram Chat Module showing ChatPage, ChatBox, ChatInput, MessageBubble interactions]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    h3("6.4.3.3 State Diagram"),
    para("[Figure 6.12 — State Diagram: Document Lifecycle — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — State Diagram: Document states: Uploaded → Processing → Indexed | Failed]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Document State Transitions: Initial State (Uploaded) → [Parsing begins] → Processing → [Embedding complete] → Indexed → [User deletes] → Deleted. If any step fails: Processing → Failed."),
    blank(),
    para("[Figure 6.13 — State Diagram: User Session — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — State Diagram: User states: Unauthenticated → Authenticated (Admin/Mentor/Trainee) → Logged Out]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    h3("6.4.3.4 Activity Diagram"),
    para("[Figure 6.14 — Activity Diagram: Full System Workflow — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Full System Activity Diagram]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("[Figure 6.15 — Activity Diagram: Role-Based Access — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Activity Diagram Role-Based Access showing decision branches for Admin/Mentor/Trainee]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    h3("6.4.3.5 Object Diagram"),
    para("[Figure 6.16 — Object Diagram: Runtime Objects — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Object Diagram showing runtime instances of User, Document, DocumentChunk with sample data values]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    h3("6.4.3.6 Deployment Diagram"),
    para("[Figure 6.17 — Deployment Diagram — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Deployment Diagram: Client Browser → React Frontend (Port 3000) → Node.js Backend (Port 4000) → PostgreSQL (Port 5432) + Groq API (External)]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("Deployment description: Client browser communicates with the React.js frontend served on port 3000. The frontend communicates with the Node.js/Express backend on port 4000 via REST API over HTTP/HTTPS. The backend connects to PostgreSQL (with pgvector) on port 5432 for data persistence. The backend also communicates with the Groq API (external HTTPS endpoint) for LLM inference."),
    blank(),
    h3("6.4.3.7 Component Diagram"),
    para("[Figure 6.18 — Component Diagram — Insert Here]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Diagram Placeholder — Component Diagram showing frontend components (React), backend modules (controllers, services, routes), database (PostgreSQL/pgvector), and external API (Groq)]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    h2("6.5 Implementation Phase"),
    h3("6.5.1 Language Used Characteristics"),
    blank(),
    para("JavaScript (Frontend — React.js + Vite):"),
    bullet("Component-Based: UI is built from reusable, composable React components."),
    bullet("JSX Syntax: Blends JavaScript logic with HTML-like structure for declarative UI."),
    bullet("Hooks: useState, useEffect, useContext for state management and side effects."),
    bullet("Context API: AuthContext provides global auth state, role helpers (isAdmin, isMentor), and user data."),
    bullet("Vite Build Tool: Faster HMR than Create React App; optimized production builds with code splitting."),
    blank(),
    para("JavaScript (Backend — Node.js + Express.js):"),
    bullet("Non-Blocking I/O: Node.js event loop handles concurrent requests without threading overhead."),
    bullet("Express.js: Lightweight web framework; middleware chain for auth, rate limiting, and error handling."),
    bullet("Async/Await: All database and API calls use modern async/await pattern for clean asynchronous code."),
    bullet("CommonJS Modules: require/module.exports for module system (migration to ES modules is future enhancement)."),
    blank(),
    para("SQL (PostgreSQL + pgvector):"),
    bullet("pgvector Extension: Adds VECTOR data type and <=> cosine similarity operator."),
    bullet("IVFFlat Index: CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100) for approximate nearest neighbor search."),
    bullet("GIN Index: CREATE INDEX ON document_chunks USING gin(to_tsvector('english', content)) for full-text keyword search."),
    bullet("Parameterized Queries: Prevent SQL injection through pg library's $1, $2 placeholder syntax."),
    blank(),
    h3("6.5.2 Coding"),
    para("The codebase follows these conventions:"),
    blank(),
    bullet("File Naming: camelCase for JavaScript files; PascalCase for React components."),
    bullet("Function Naming: camelCase verbs (getDocuments, embedText, generateAnswer)."),
    bullet("Error Handling: try-catch in all async functions; global error middleware in Express."),
    bullet("Comments: Inline comments for complex logic; JSDoc comments for service functions."),
    bullet("Environment Variables: All configuration via .env files; no hardcoded credentials."),
    blank(),
    para("Key Implementation Files:"),
    blank(),
    simpleTable(
      ["File", "Location", "Purpose"],
      [
        ["ai.service.js", "backend/src/services/", "Groq API LLM calls + local embedding fallback"],
        ["rag.service.js", "backend/src/services/", "Hybrid/Semantic/Keyword search + answer generation"],
        ["document.service.js", "backend/src/services/", "File parsing for PDF/DOCX/MD/CSV/TXT"],
        ["auth.controller.js", "backend/src/controllers/", "Login, register, JWT issuance"],
        ["chat.controller.js", "backend/src/controllers/", "Session management + RAG query routing"],
        ["migrate.js", "backend/src/db/", "PostgreSQL schema creation with pgvector"],
        ["AuthContext.jsx", "frontend/src/contexts/", "Global auth state + role helpers"],
        ["ChatPage.jsx", "frontend/src/pages/", "Full chat UI with session management"],
        ["Documents.jsx", "frontend/src/pages/", "Document upload + ingestion pipeline"],
        ["AppRoutes.jsx", "frontend/src/routes/", "Protected routes + role guards"],
      ],
      [2800, 2800, 3760]
    ),
    blank(),
    h3("6.5.3 Code Efficiency"),
    para("Several strategies are employed to ensure code efficiency:"),
    blank(),
    bullet("Connection Pooling: PostgreSQL connections are managed via pg.Pool to reuse connections across requests."),
    bullet("Async Indexing: Document embedding and storage happen asynchronously after upload — the API responds immediately with a 'processing' status, improving perceived performance."),
    bullet("IVFFlat Approximate Search: Uses approximate nearest neighbor search (lists=100) for O(log n) vector retrieval instead of O(n) brute force."),
    bullet("Chunked Processing: Documents are processed in chunks, enabling streaming progress updates and preventing memory overflow for large files."),
    bullet("React Code Splitting: Vite's dynamic imports split the bundle by route, reducing initial load time."),
    blank(),
    h3("6.5.4 Optimization of Code"),
    para("The following optimizations have been implemented:"),
    blank(),
    bullet("Local Embedding Fallback: When the external AI API is unavailable, a TF-IDF-inspired local embedding function provides approximate vector representations without API latency."),
    bullet("Response Caching: Chat session data is cached in React state to avoid redundant API calls when switching between sessions."),
    bullet("Debounced Search: Document list filtering uses debounced input to prevent excessive re-renders."),
    bullet("LLM Prompt Engineering: The system prompt instructs Groq's Llama 3.1 to be concise, cite sources explicitly, and acknowledge when information is not in the provided context — reducing token usage and improving answer quality."),
    blank(),
    h3("6.5.5 Validation Check"),
    para("Input validation is performed at multiple layers:"),
    blank(),
    bullet("Frontend Validation: Form fields validated before submission (email format, password length, required fields)."),
    bullet("Backend Middleware: JWT validation on all protected routes; role validation for role-restricted endpoints."),
    bullet("File Upload Validation: Multer restricts accepted MIME types to PDF, DOCX, TXT, MD, CSV; enforces 50MB size limit."),
    bullet("Database Constraints: NOT NULL constraints on required fields; UNIQUE constraint on user email; foreign key constraints ensure referential integrity."),
    blank(),
    h2("6.6 Testing"),
    h3("6.6.1 Testing Objectives"),
    para("The testing objectives for this system are:"),
    blank(),
    bullet("Verify all functional requirements are correctly implemented."),
    bullet("Ensure role-based access controls are correctly enforced."),
    bullet("Validate AI query responses are grounded in uploaded documents."),
    bullet("Confirm system handles edge cases gracefully (empty documents, invalid queries, API failures)."),
    bullet("Verify UI renders correctly across major browsers."),
    blank(),
    h3("6.6.2 Testing Methods & Strategies used along with test data"),
    para("The following testing approaches were employed:"),
    blank(),
    bullet("Manual Testing: All user flows tested manually through the browser interface."),
    bullet("API Testing: All REST endpoints tested using HTTP request tools (curl, browser fetch)."),
    bullet("Unit Testing: Core service functions (embedText, hybridSearch) tested with known inputs and expected outputs."),
    bullet("Integration Testing: Full upload-to-query pipeline tested end-to-end."),
    blank(),
    para("Test Cases — Authentication Module:"),
    blank(),
    simpleTable(
      ["TC ID", "Test Case", "Input", "Expected Output", "Result"],
      [
        ["TC-A01", "Valid Login", "Valid email + password", "JWT token returned, redirect to dashboard", "Pass"],
        ["TC-A02", "Invalid Password", "Valid email + wrong password", "401 Unauthorized error message", "Pass"],
        ["TC-A03", "Non-existent User", "Unregistered email", "404 User not found error", "Pass"],
        ["TC-A04", "Register New User", "Name, email, password, role", "User created, JWT returned", "Pass"],
        ["TC-A05", "Duplicate Email Registration", "Existing email", "409 Email already exists error", "Pass"],
        ["TC-A06", "Access Protected Route Without Token", "No Authorization header", "401 No token provided", "Pass"],
      ],
      [1200, 2200, 2200, 2400, 1360]
    ),
    blank(),
    para("Test Cases — Document Upload Module:"),
    blank(),
    simpleTable(
      ["TC ID", "Test Case", "Input", "Expected Output", "Result"],
      [
        ["TC-D01", "Valid PDF Upload", "Sample PDF file", "Document created, status=processing→indexed", "Pass"],
        ["TC-D02", "Valid DOCX Upload", "Sample DOCX file", "Document created, parsed successfully", "Pass"],
        ["TC-D03", "Invalid File Type", ".exe or .zip file", "400 Invalid file type error", "Pass"],
        ["TC-D04", "File Too Large", "File >50MB", "413 File too large error", "Pass"],
        ["TC-D05", "Delete Document", "Valid document ID", "Document and chunks deleted from DB", "Pass"],
        ["TC-D06", "Trainee Upload Attempt", "Trainee JWT + valid file", "403 Forbidden — role not authorized", "Pass"],
      ],
      [1200, 2400, 2000, 2400, 1360]
    ),
    blank(),
    para("Test Cases — RAG Query Module:"),
    blank(),
    simpleTable(
      ["TC ID", "Test Case", "Input", "Expected Output", "Result"],
      [
        ["TC-Q01", "Query on Indexed Document", "Question related to uploaded doc", "Answer + source citation displayed", "Pass"],
        ["TC-Q02", "Query Without Documents", "Question with no documents uploaded", "System informs no context available", "Pass"],
        ["TC-Q03", "Hybrid Search Mode", "Question + Hybrid mode selected", "Both semantic and keyword results merged", "Pass"],
        ["TC-Q04", "Semantic Only Mode", "Question + Semantic mode selected", "Only vector similarity results used", "Pass"],
        ["TC-Q05", "Keyword Only Mode", "Question + Keyword mode selected", "Only full-text search results used", "Pass"],
        ["TC-Q06", "Session Persistence", "Navigate away and return", "Previous messages still visible in session", "Pass"],
      ],
      [1200, 2400, 2000, 2400, 1360]
    ),
    blank(),
    para("Test Cases — Admin Panel Module:"),
    blank(),
    simpleTable(
      ["TC ID", "Test Case", "Input", "Expected Output", "Result"],
      [
        ["TC-P01", "Admin Views User List", "Admin JWT", "All registered users listed", "Pass"],
        ["TC-P02", "Admin Changes User Role", "User ID + new role", "User role updated in DB", "Pass"],
        ["TC-P03", "Admin Deletes User", "User ID", "User and associated data deleted", "Pass"],
        ["TC-P04", "Mentor Access Admin Panel", "Mentor JWT", "403 Forbidden — insufficient role", "Pass"],
        ["TC-P05", "Trainee Access Admin Panel", "Trainee JWT", "403 Forbidden + redirect to dashboard", "Pass"],
      ],
      [1200, 2600, 2000, 2400, 1160]
    ),
    pageBreak()
  ];
  return content;
}

// ─── CHAPTER 7: CONCLUSION ──────────────────────────────────────────────────
function chapter7() {
  return [
    h1("Chapter 7: Conclusion & Discussion"),
    blank(),
    para("The AI-Powered Internal Knowledge Assistant has been successfully designed and implemented as a full-stack SaaS platform addressing the critical problem of organizational knowledge fragmentation. The system demonstrates that Retrieval-Augmented Generation (RAG), when combined with a modern web application stack, can provide a highly functional and user-friendly private knowledge management solution."),
    blank(),
    para("The Hybrid RAG pipeline, which combines semantic vector search (via pgvector) with keyword full-text search and merges results using Reciprocal Rank Fusion, represents a significant improvement over single-method retrieval approaches. This combination ensures that both conceptually similar queries and exact-phrase matches yield relevant results, significantly improving answer quality."),
    blank(),
    para("The migration from HuggingFace's free Inference API to Groq's API (Llama 3.1 8B Instant) was a critical decision point that improved system reliability from near-zero uptime (due to cold-start blob errors) to consistent sub-second responses. This experience underscores the importance of API reliability evaluation during the technical feasibility phase."),
    blank(),
    para("The role-based access control system with three distinct roles (Admin, Mentor, Trainee) provides a flexible permission structure applicable to both corporate and educational contexts. The Admin panel enables self-service user management without requiring direct database access."),
    blank(),
    h2("7.1 Limitation of Project"),
    bullet("Local Embedding Quality: The local TF-IDF fallback embedding, while functional, produces lower-quality semantic representations compared to neural embedding models. Queries requiring deep semantic understanding may yield suboptimal results when the external API is unavailable."),
    bullet("No Third-Party Integrations: Planned integrations with Slack, Notion, and email systems remain unimplemented and are deferred to future phases."),
    bullet("Single Server Architecture: The current deployment model is single-server. Horizontal scaling, load balancing, and distributed vector storage are not yet implemented."),
    bullet("No Real-Time Updates: Document indexing status updates require manual page refresh; WebSocket-based real-time updates are planned but not yet implemented."),
    bullet("Limited File Format Support: While PDF, DOCX, MD, CSV, and TXT are supported, formats like PPTX, XLSX, and HTML are not currently parsed."),
    bullet("No Image Understanding: Images within PDFs and DOCX files are not processed; the system only extracts and indexes textual content."),
    blank(),
    h2("7.2 Difficulties Encountered"),
    bullet("HuggingFace API Failures: All HuggingFace embedding and LLM models failed with 'An error occurred while fetching the blob' errors, necessitating an emergency architectural change to Groq API. This consumed approximately one sprint's worth of development time."),
    bullet("pgvector Installation on Windows: Installing pgvector on Windows requires manual compilation or a Docker image with pgvector pre-installed. The Docker solution was adopted as the recommended approach."),
    bullet("CORS Configuration: Cross-Origin Resource Sharing errors between the Vite dev server (port 3000) and Express backend (port 4000) required careful Helmet.js and CORS middleware configuration."),
    bullet("Dashboard Data Mismatch: The backend returned snake_case field names (file_size, created_at) while the frontend expected camelCase (fileSize, createdAt), causing NaN MB and 'Invalid Date' rendering issues that required a normalisation mapper function."),
    bullet("Chat Session Loading: Fetching full message history for a selected session required additional API endpoints not in the original design, requiring backend schema and route additions mid-sprint."),
    blank(),
    h2("7.3 Future Enhancement Suggestions"),
    bullet("Third-Party Integrations: Implement OAuth-based connectors for Slack (Workspace API), Notion (Public API), and Gmail (Google Workspace API) to automatically ingest and index messages and pages."),
    bullet("Advanced Chunking Strategies: Implement semantic chunking (splitting on paragraph boundaries) and hierarchical chunking (document → section → paragraph) for better context preservation."),
    bullet("Multi-Modal Support: Integrate vision models (GPT-4 Vision, LLaVA) to extract and index content from images and charts within documents."),
    bullet("Real-Time Indexing Status: Implement WebSocket connections to push live document indexing progress and completion notifications to the frontend."),
    bullet("Advanced Analytics Dashboard: Add query analytics (most common topics, unanswered questions), document usage statistics, and knowledge gap identification."),
    bullet("Fine-Tuning: Fine-tune a smaller LLM on domain-specific organizational data for improved answer accuracy within the specific knowledge domain."),
    bullet("Mobile Application: Develop React Native mobile applications for iOS and Android to provide mobile access to the knowledge assistant."),
    bullet("SSO Integration: Implement SAML 2.0 or OAuth 2.0 SSO integration with enterprise identity providers (Okta, Azure AD) for seamless corporate authentication."),
    bullet("Vector Database Migration: Evaluate migration to a dedicated vector database (Qdrant, Weaviate) for improved vector search performance at large scale (10M+ chunks)."),
    pageBreak()
  ];
}

// ─── CHAPTER 8: BIBLIOGRAPHY ────────────────────────────────────────────────
function chapter8() {
  return [
    h1("Chapter 8: Bibliography & References"),
    blank(),
    h2("8.1 Reference Books"),
    blank(),
    numbered("Aurélien Géron, 'Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow', 3rd Edition, O'Reilly Media, 2022."),
    numbered("Ian Goodfellow, Yoshua Bengio, Aaron Courville, 'Deep Learning', MIT Press, 2016."),
    numbered("Andrew Ng, 'Machine Learning Yearning', DeepLearning.AI, 2019."),
    numbered("Roger S. Pressman, Bruce Maxim, 'Software Engineering: A Practitioner's Approach', 9th Edition, McGraw-Hill Education, 2020."),
    numbered("Ian Sommerville, 'Software Engineering', 10th Edition, Pearson Education, 2016."),
    numbered("Jonathan Wexler, 'Get Programming with Node.js', Manning Publications, 2019."),
    numbered("Mark Tielens Thomas, 'React: Up & Running', 2nd Edition, O'Reilly Media, 2021."),
    blank(),
    h2("8.2 Other Documentation & Resources"),
    blank(),
    numbered("Lewis, P., et al. (2020). 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.' NeurIPS 2020. Available: https://arxiv.org/abs/2005.11401"),
    numbered("Robertson, S. and Zaragoza, H. (2009). 'The Probabilistic Relevance Framework: BM25 and Beyond.' Foundations and Trends in Information Retrieval."),
    numbered("Cormack, G.V., Clarke, C.L.A. and Buettcher, S. (2009). 'Reciprocal rank fusion outperforms condorcet and individual rank learning methods.' SIGIR 2009."),
    numbered("pgvector GitHub Repository: https://github.com/pgvector/pgvector"),
    numbered("Groq API Documentation: https://console.groq.com/docs/quickstart"),
    numbered("React.js Official Documentation: https://react.dev"),
    numbered("Express.js Official Documentation: https://expressjs.com"),
    numbered("PostgreSQL 14 Documentation: https://www.postgresql.org/docs/14/"),
    numbered("Node.js v18 Documentation: https://nodejs.org/en/docs"),
    numbered("Vite.js Documentation: https://vitejs.dev/guide"),
    numbered("JSON Web Tokens (JWT) Specification: RFC 7519, https://tools.ietf.org/html/rfc7519"),
    numbered("bcryptjs npm package documentation: https://www.npmjs.com/package/bcryptjs"),
    numbered("Multer npm package documentation: https://www.npmjs.com/package/multer"),
    numbered("pdf-parse npm package: https://www.npmjs.com/package/pdf-parse"),
    numbered("mammoth.js (DOCX parsing): https://github.com/mwilliamson/mammoth.js"),
    pageBreak()
  ];
}

// ─── ANNEXURES ──────────────────────────────────────────────────────────────
function annexures() {
  return [
    h1("Annexure I — UI Screenshots"),
    blank(),
    para("[Figure A1 — Login Page]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Screenshot Placeholder — Login Page with glassmorphism design, email/password fields, and role quick-fill buttons]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("[Figure A2 — Dashboard]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Screenshot Placeholder — Dashboard showing stats grid, recent queries, quick actions, and system status]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("[Figure A3 — Document Upload Page]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Screenshot Placeholder — Document Upload page showing drag-and-drop zone and document list]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("[Figure A4 — AI Chat Interface]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Screenshot Placeholder — Chat page with session panel, message bubbles, source citations, and search mode selector]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    blank(),
    para("[Figure A5 — Admin Panel]"),
    blank(),
    new Paragraph({
      children: [new TextRun({ text: "[Screenshot Placeholder — Admin panel showing user management table with role dropdown and delete controls]", size: 22, font: "Arial", italics: true, color: "888888" })],
      alignment: AlignmentType.CENTER,
      border: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder },
      spacing: { before: 100, after: 100 }
    }),
    pageBreak(),
    h1("Annexure II — Database Schema"),
    blank(),
    para("The following SQL represents the complete database schema for the AI-Powered Internal Knowledge Assistant system:"),
    blank(),
    new Paragraph({
      children: [new TextRun({
        text:
`-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(50) DEFAULT 'trainee' CHECK (role IN ('admin','mentor','trainee')),
  workspace   VARCHAR(255) DEFAULT 'default',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  original_name VARCHAR(500) NOT NULL,
  stored_name   VARCHAR(500) NOT NULL,
  file_type     VARCHAR(50),
  file_size     INTEGER,
  status        VARCHAR(50) DEFAULT 'processing',
  workspace     VARCHAR(255) DEFAULT 'default',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks (with pgvector)
CREATE TABLE IF NOT EXISTS document_chunks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID REFERENCES documents(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  embedding     VECTOR(384),
  chunk_index   INTEGER,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vector and full-text search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_chunks_fts
  ON document_chunks USING gin(to_tsvector('english', content));

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(500) DEFAULT 'New Conversation',
  workspace   VARCHAR(255) DEFAULT 'default',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        VARCHAR(50) CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  sources     JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);`,
        size: 18,
        font: "Courier New"
      })],
      spacing: { before: 60, after: 60 }
    }),
  ];
}

// ─── ASSEMBLE DOCUMENT ──────────────────────────────────────────────────────
const allContent = [
  ...coverPage(),
  ...insideCoverPage(),
  ...dedicationPage(),
  ...abstractPage(),
  ...publicationsPage(),
  ...copyrightPage(),
  ...undertakingPage(),
  ...declarationPage(),
  ...mentorCertificatePage(),
  ...companyCertificatePage(),
  ...plagiarismPage(),
  ...acknowledgementsPage(),
  // TOC placeholder
  new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
  pageBreak(),
  ...listOfFiguresPage(),
  ...listOfTablesPage(),
  ...listOfGraphsPage(),
  ...abbreviationsPage(),
  ...chapter1(),
  ...chapter2(),
  ...chapter3(),
  ...chapter4(),
  ...chapter5(),
  ...chapter6(),
  ...chapter7(),
  ...chapter8(),
  ...annexures(),
];

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1F3864" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E5090" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2E5090" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1800 } // 1.25" left for binding
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "AI-Powered Internal Knowledge Assistant", size: 18, font: "Arial", color: "888888" }),
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
          spacing: { after: 80 }
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "Adani University, Ahmedabad | B.Tech CSE (AI-ML) | 2025", size: 18, font: "Arial", color: "888888" }),
            new TextRun({ text: "\t", size: 18 }),
            new TextRun({ text: "Page ", size: 18, font: "Arial", color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
          spacing: { before: 80 }
        })]
      })
    },
    children: allContent
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("AI_Knowledge_Assistant_Report.docx", buffer);
  console.log('Report generated successfully!');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});