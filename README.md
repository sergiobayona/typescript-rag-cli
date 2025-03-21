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

### Core Functionality
- **Document Management**: Add, list, query, and remove documents
- **Multiple Sources**: Import documents from URLs, local files, or use the example essay
- **Smart Chunking**: Text is intelligently split into chunks, preserving paragraph and sentence boundaries
- **Vector Embeddings**: Generate and store vector embeddings for semantic search
- **Persistent Storage**: Documents and their embeddings are stored on disk for future sessions
- **Interactive Mode**: Continuous interaction through an interactive shell

### Enhanced HTML Processing
- **HTML Detection**: Automatically detects HTML content
- **Text Extraction**: Extracts readable text content from HTML documents
- **Metadata Extraction**: Captures titles, descriptions, and author information
- **Content Prioritization**: Focuses on main content areas and properly formats paragraphs
- **HTML Preservation Option**: Option to keep original HTML content if needed

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
# Add from URL with HTML processing options
ts-rag add --url https://example.com/document.html --name "Example Doc" --extract-metadata

# Add from local file
ts-rag add --file ./path/to/document.txt --name "Local Doc" --chunk-size 1024

# Preserve HTML content instead of extracting text
ts-rag add --url https://example.com/page.html --preserve-html

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

# Query all documents at once
ts-rag query --query "What is the main topic?"

# Interactive query
ts-rag query
```

### Removing Documents

```bash
# Remove a specific document
ts-rag remove --name "Example Doc"

# Interactive removal
ts-rag remove
```

### Interactive Mode

```bash
ts-rag interactive
```

In interactive mode, you can use these commands:
- **Add Document**: Add a new document with guided prompts
- **List Documents**: List all available documents
- **Remove Document**: Remove a document with confirmation
- **Query Documents**: Query documents with options for document selection
- **Exit**: Exit interactive mode

## Architecture

The application is built with a modular architecture:

### Core Components

1. **CLI Interface**: Uses Commander and Inquirer for command-line and interactive interfaces
2. **Document Store**: Manages document storage, retrieval, and persistence
3. **Vector Index**: Implements vector similarity search using L2 distance
4. **Data Services**: Handles document fetching, reading, and chunking
5. **OpenAI Services**: Manages interactions with OpenAI's API for embeddings and completions
6. **HTML Processing**: Enhanced HTML detection and content extraction with Cheerio

### Data Flow

1. Documents are fetched from source (URL, file, etc.)
2. If HTML is detected, it's processed to extract readable text and metadata
3. Text is chunked into manageable segments
4. Chunks are converted to vector embeddings via OpenAI
5. When queried, the question is converted to an embedding
6. Most relevant chunks are retrieved through vector similarity
7. Retrieved chunks augment the prompt sent to OpenAI
8. AI-generated answer is returned based on document context

## Development

### Project Structure

```
src/
├── bin.ts                      # CLI entry point
├── cli.ts                      # CLI command implementation
├── index.ts                    # Library entry point and exports
├── models/
│   ├── documentStore.ts        # Document management and persistence
│   └── vectorIndex.ts          # Vector similarity search
├── services/
│   ├── completionService.ts    # OpenAI completion API
│   ├── dataService.ts          # Document fetching and processing
│   └── embeddingService.ts     # OpenAI embedding API
├── utils/
│   ├── distance.ts             # Vector distance calculation
│   ├── enhancedHtmlUtils.ts    # HTML processing utilities
│   └── openai.ts               # OpenAI client configuration
└── tests/                      # Test files for key components
```

### Development Commands

```bash
# Run in development mode with hot reload
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

### Code Quality

This project uses ESLint for code linting and Prettier for code formatting:

- ESLint: Enforces code quality rules and best practices for TypeScript
- Prettier: Ensures consistent code formatting

Configuration files:
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier configuration

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and delivery:

### CI Workflow

The CI workflow runs on every push to the main branch and on pull requests:

- Tests code on multiple Node.js versions (14, 16, 18) and operating systems
- Runs the linter to ensure code quality
- Builds the project to check for compilation errors
- Runs all tests with coverage reporting

### CD Workflow

The CD workflow automates publishing to npm:

- Triggered when a new GitHub release is created
- Runs tests and builds the project
- Publishes the package to the npm registry

### Setting Up Secrets

For the workflows to function properly, you'll need to add this secret to your GitHub repository:

1. `NPM_TOKEN` - Your npm access token for publishing

> **Note**: Your tests use mocked OpenAI API calls so no API key is required for CI/CD.

> **Important**: Make sure to commit your `package-lock.json` file to the repository for the CI/CD pipeline to work properly with caching enabled. This ensures reproducible builds and faster installation of dependencies.

## License

MIT

## Credits

This project uses OpenAI's API for embeddings and completions.