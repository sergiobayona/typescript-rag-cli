# TypeScript RAG CLI

An interactive command-line interface for Retrieval-Augmented Generation (RAG) implemented in TypeScript.

## Overview

This CLI tool allows you to:

1. Import documents from various sources (URLs, local files, example text)
2. Process documents by chunking text and generating vector embeddings
3. Query documents using natural language questions
4. Get AI-powered answers based on the document content

The application uses OpenAI's API for embeddings and completions to enable semantic search and contextually relevant answers.

## Features

- **Document Management**: Add, list, and query multiple documents
- **Multiple Sources**: Import documents from URLs, local files, or use the example essay
- **Smart Chunking**: Text is intelligently split into chunks, trying to preserve paragraph and sentence boundaries
- **Vector Embeddings**: Generate and store vector embeddings for semantic search
- **Persistent Storage**: Documents and their embeddings are stored on disk for future sessions
- **Interactive Mode**: Continuous interaction through an interactive shell

## Requirements

- Node.js (v14+)
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sergiobayona/typescript-rag-cli.git
   cd typescript-rag-cli
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

5. (Optional) Install globally:
   ```bash
   npm install -g .
   ```

## Usage

### Adding a Document

```bash
# Add from URL
ts-rag add --url https://example.com/document.txt --name "Example Doc"

# Add from local file
ts-rag add --file ./path/to/document.txt --name "Local Doc"

# Interactive add
ts-rag add
```

### Listing Documents

```bash
ts-rag list
```

### Querying Documents

```bash
# Query a specific document
ts-rag query --document "Example Doc" --query "What is the main topic?"

# Query with specific number of chunks to retrieve
ts-rag query --document "Example Doc" --query "What is the main topic?" --num-chunks 3

# Interactive query
ts-rag query
```

### Interactive Mode

```bash
ts-rag interactive
```

In interactive mode, you can use these commands:
- `add` - Add a new document
- `list` - List all documents
- `query What is the main topic?` - Query documents
- `exit` - Exit interactive mode
- `help` - Show help

## Architecture

The application is built with a modular architecture:

### Core Components

1. **CLI Interface**: Uses Commander and Inquirer for command-line and interactive interfaces
2. **Document Store**: Manages document storage, retrieval, and persistence
3. **Vector Index**: Implements vector similarity search using L2 distance
4. **Data Services**: Handles document fetching, reading, and chunking
5. **OpenAI Services**: Manages interactions with OpenAI's API for embeddings and completions

### Data Flow

1. Documents are fetched from source (URL, file, etc.)
2. Text is chunked into manageable segments
3. Chunks are converted to vector embeddings via OpenAI
4. When queried, the question is converted to an embedding
5. Most relevant chunks are retrieved through vector similarity
6. Retrieved chunks augment the prompt sent to OpenAI
7. AI-generated answer is returned based on document context

## Development

### Project Structure

```
src/
├── bin.ts                  # CLI entry point
├── cli.ts                  # CLI command implementation
├── index.ts                # Library entry point and exports
├── models/
│   ├── documentStore.ts    # Document management
│   └── vectorIndex.ts      # Vector similarity search
├── services/
│   ├── completionService.ts # OpenAI completion API
│   ├── dataService.ts      # Document fetching and processing
│   └── embeddingService.ts # OpenAI embedding API
└── utils/
    ├── distance.ts         # Vector distance calculation
    └── openai.ts           # OpenAI client configuration
```

### Development Commands

```bash
# Run in development mode with hot reload
npm run dev

# Build the project
npm run build

# Run tests
npm test
```

## License

MIT

## Credits

This project uses OpenAI's API for embeddings and completions.