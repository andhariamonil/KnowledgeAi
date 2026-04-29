# KnowledgeAI — AI-Powered Internal Knowledge Assistant

KnowledgeAI is a sophisticated, full-stack internal knowledge base that allows organizations to upload private documents (PDF, DOCX, MD, CSV, TXT) and query them using natural language. It leverages a **Hybrid RAG (Retrieval-Augmented Generation)** pipeline to provide accurate, source-attributed answers using local vector embeddings and the Groq Llama 3.1 LLM.

![Dashboard Preview](./dashboard.png)

## 🚀 Key Features

- **Hybrid RAG Pipeline**: Combines semantic vector search (`pgvector`) with traditional keyword search (`tsvector`) using Reciprocal Rank Fusion (RRF) for industry-leading accuracy.
- **Source Attribution**: Every AI-generated answer includes direct links to the source documents used, ensuring transparency and trust.
- **Role-Based Access Control (RBAC)**: 
  - **Admin**: Full system control, user management, and global document access.
  - **Mentor**: Can upload and manage documents, and use the AI assistant.
  - **Trainee**: Can view documents and use the AI assistant (upload restricted).
- **Multi-Format Support**: Intelligent parsing for `.pdf`, `.docx`, `.md`, `.csv`, and `.txt` files.
- **Modern UI/UX**: Built with a sleek Glassmorphism aesthetic, featuring dark mode, smooth animations, and a responsive layout.
- **Privacy First**: Designed for internal data; documents are stored and indexed within your own infrastructure.

## 🛠 Technology Stack

### Frontend
- **React.js v18** with **Vite** for lightning-fast development.
- **React Router v6** for seamless navigation.
- **Context API** for global state management (Auth, Theme).
- **Vanilla CSS** with CSS Variables for a custom, premium design system.

### Backend
- **Node.js & Express.js** for a robust RESTful API.
- **PostgreSQL** with the **pgvector** extension for high-performance vector storage.
- **JWT (JSON Web Tokens)** for secure, stateless authentication.
- **Multer** for efficient file handling and processing.

### AI & Search
- **Groq API**: Utilizing **Llama 3.1 8B Instant** for near-instantaneous, high-quality answer generation.
- **Local TF-IDF Embeddings**: High-speed, deterministic local vector generation (no external API cost for indexing).
- **Reciprocal Rank Fusion (RRF)**: Advanced merging algorithm for hybrid search results.

## 📸 Screenshots

| Login Page | AI Chat Assistant |
|------------|-------------------|
| ![Login](./login.png) | ![Chat](./chat.png) |

| Document Management | Global Dashboard |
|---------------------|------------------|
| ![Documents](./dacument.png) | ![Dashboard](./dashboard.png) |

## 🛠 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher) with the **pgvector** extension installed.
  - *Tip: Use the Docker image `pgvector/pgvector:pg16` for an easy setup.*

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/andhariamonil/KnowledgeAi.git
   cd knowledgeai
   ```

2. **Install Dependencies**
   ```bash
   npm run install:all
   ```

3. **Database Setup**
   Create a PostgreSQL database and run the setup script:
   ```bash
   # Update backend/.env with your DB credentials first
   npm run db:setup
   ```

4. **Environment Configuration**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=4000
   DATABASE_URL=postgres://user:pass@localhost:5432/knowledgeai
   JWT_SECRET=your_super_secret_key
   GROQ_API_KEY=your_groq_api_key
   GROQ_MODEL=llama-3.1-8b-instant
   ```

5. **Run the Application**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000`

## 📄 License
This project is for educational purposes as part of the B.Tech CSE (AI-ML) Final Major Project at Adani University.

---
Developed by **[Your Name]** · 2025
