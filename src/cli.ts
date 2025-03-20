import { Command } from 'commander';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { fetchEssay, chunkText, fetchFromUrl, readFromFile } from './services/dataService';
import { getTextEmbedding } from './services/embeddingService';
import { VectorIndex } from './models/vectorIndex';
import { runCompletion } from './services/completionService';
import { DocumentStore } from './models/documentStore';

interface AddCommandOptions {
  url?: string;
  file?: string;
  name?: string;
  chunkSize?: string;
  preserveHtml?: boolean;
  extractMetadata?: boolean;
}

// Define the Document interface to match DocumentStore
interface Document {
  name: string;
  text: string;
  chunks: string[];
  vectorIndex: VectorIndex;
}

// Define interface for command options
interface AddCommandOptions {
  url?: string;
  file?: string;
  name?: string;
  chunkSize?: string;
}

interface QueryCommandOptions {
  query?: string;
  document?: string;
  numChunks?: string;
}

// Initialize document store
const documentStore = new DocumentStore();

const program = new Command();

program
  .name('ts-rag')
  .description('TypeScript RAG CLI application')
  .version('1.0.0');

// Add command for adding a document
// Updated section for the add command in src/cli.ts

program
  .command('add')
  .description('Add a document to the RAG system')
  .option('-u, --url <url>', 'URL to fetch document from')
  .option('-f, --file <file>', 'Local file path to read document from')
  .option('-n, --name <n>', 'Name to identify the document')
  .option('-c, --chunk-size <size>', 'Size of text chunks', '2048')
  .option('--preserve-html', 'Preserve HTML content instead of extracting text')
  .option('--extract-metadata', 'Extract and include metadata from HTML documents', true)
  .action(async (options: AddCommandOptions & { preserveHtml?: boolean, extractMetadata?: boolean }) => {
    try {
      let text: string;
      let name = options.name;

      // If no name is provided, prompt for one
      if (!name) {
        const answer = await inquirer.prompt([{
          type: 'input',
          name: 'docName',
          message: 'Enter a name for this document:',
          validate: (input: string) => input.trim() !== '' ? true : 'Name cannot be empty'
        }]);
        name = answer.docName;
      }

      // Get the document text based on the provided options
      if (options.url) {
        const url = options.url;
        if (!url) {
          throw new Error('URL is required');
        }
        console.log(`Fetching document from URL: ${url}`);
        
        // Pass HTML processing options to fetchFromUrl
        text = await fetchFromUrl(url, {
          preserveHtml: options.preserveHtml ?? false,
          extractMetadata: options.extractMetadata ?? true
        });
      } else if (options.file) {
        const filePath = options.file;
        if (!filePath) {
          throw new Error('File path is required');
        }
        console.log(`Reading document from file: ${filePath}`);
        
        // Pass HTML processing options to readFromFile
        text = await readFromFile(filePath, {
          preserveHtml: options.preserveHtml ?? false,
          extractMetadata: options.extractMetadata ?? true
        });
      } else {
        // If neither URL nor file is provided, prompt user
        const sourceAnswer = await inquirer.prompt([{
          type: 'list',
          name: 'source',
          message: 'Select document source:',
          choices: ['URL', 'File', 'Example Essay (Paul Graham)']
        }]);

        if (sourceAnswer.source === 'URL') {
          const urlAnswer = await inquirer.prompt([{
            type: 'input',
            name: 'url',
            message: 'Enter URL:',
            validate: (input) => input.trim() !== '' ? true : 'URL cannot be empty'
          }]);
          
          // Prompt for HTML processing options
          const htmlOptions = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'processHtml',
              message: 'Process HTML content (extract text)?',
              default: true
            },
            {
              type: 'confirm',
              name: 'extractMetadata',
              message: 'Extract and include metadata from HTML?',
              default: true,
              when: (answers) => answers.processHtml
            }
          ]);
          
          text = await fetchFromUrl(urlAnswer.url, {
            preserveHtml: !htmlOptions.processHtml,
            extractMetadata: htmlOptions.extractMetadata
          });
        } else if (sourceAnswer.source === 'File') {
          const fileAnswer = await inquirer.prompt([{
            type: 'input',
            name: 'filePath',
            message: 'Enter file path:',
            validate: (input) => fs.existsSync(input) ? true : 'File does not exist'
          }]);
          
          // Prompt for HTML processing if file exists
          const htmlOptions = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'processHtml',
              message: 'Process HTML content if detected (extract text)?',
              default: true
            },
            {
              type: 'confirm',
              name: 'extractMetadata',
              message: 'Extract and include metadata from HTML?',
              default: true,
              when: (answers) => answers.processHtml
            }
          ]);
          
          text = await readFromFile(fileAnswer.filePath, {
            preserveHtml: !htmlOptions.processHtml,
            extractMetadata: htmlOptions.extractMetadata
          });
        } else {
          console.log('Fetching Paul Graham essay...');
          text = await fetchEssay();
        }
      }

      // Process the document
      const chunkSize = parseInt(options.chunkSize);
      console.log(`Processing document "${name}" (${text.length} characters)`);
      
      const chunks = chunkText(text, chunkSize);
      console.log(`Created ${chunks.length} chunks of size ${chunkSize}`);
      
      console.log('Generating embeddings (this may take a while)...');
      const textEmbeddings = await Promise.all(
        chunks.map(chunk => getTextEmbedding(chunk))
      );
      
      // Create a vector index and store the document
      const vectorIndex = new VectorIndex(textEmbeddings);
      documentStore.addDocument(name, text, chunks, vectorIndex);
      
      console.log(`Document "${name}" added successfully!`);
    } catch (error) {
      console.error('Error adding document:', error);
    }
  });

// List available documents
program
  .command('list')
  .description('List all available documents')
  .action(() => {
    const documents = documentStore.listDocuments();
    if (documents.length === 0) {
      console.log('No documents available. Add one with the "add" command.');
      return;
    }
    
    console.log('Available documents:');
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.name} (${doc.chunks.length} chunks)`);
    });
  });

// Query a document
program
  .command('query')
  .description('Query documents using RAG')
  .option('-d, --document <name>', 'Name of document to query (if not specified, will query all)')
  .option('-n, --num-chunks <number>', 'Number of chunks to retrieve', '2')
  .option('-q, --query <question>', 'Question to ask')
  .action(async (options: QueryCommandOptions) => {
    try {
      const documents = documentStore.listDocuments();
      if (documents.length === 0) {
        console.log('No documents found. Please add a document first.');
        return;
      }

      const docName = options.document;
      let question = options.query;
      const numChunks = options.numChunks ? parseInt(options.numChunks, 10) : 2;

      // Use specified document or prompt user to select one
      let documentToQuery: string;
      if (docName && documents.some(doc => doc.name === docName)) {
        documentToQuery = docName;
      } else {
        const docAnswer = await inquirer.prompt([{
          type: 'list',
          name: 'selectedDoc',
          message: 'Select a document to query:',
          choices: documents.map(doc => doc.name).concat(['All documents'])
        }]);
        documentToQuery = docAnswer.selectedDoc;
      }

      // If no question is provided, prompt for one
      let questionEmbedding: number[];
      if (!question) {
        const questionAnswer = await inquirer.prompt([{
          type: 'input',
          name: 'userQuestion',
          message: 'What would you like to ask about this document?',
          validate: (input: string) => input.trim() !== '' ? true : 'Question cannot be empty'
        }]);
        question = questionAnswer.userQuestion;
        questionEmbedding = await getTextEmbedding(question);
      } else {
        if (!question) {
          throw new Error('Question is required');
        }
        console.log(`Processing query: ${question}`);
        questionEmbedding = await getTextEmbedding(question!);
      }

      let retrievedChunks: string[] = [];
      
      if (documentToQuery === 'All documents') {
        // Query all documents and combine results
        for (const doc of documents) {
          const indices = doc.vectorIndex.search(questionEmbedding, numChunks);
          retrievedChunks = retrievedChunks.concat(indices.map(i => doc.chunks[i]));
        }
        // Limit to top chunks if we have too many
        if (retrievedChunks.length > numChunks * 2) {
          retrievedChunks = retrievedChunks.slice(0, numChunks * 2);
        }
      } else {
        // Query specific document
        const document = documentStore.getDocument(documentToQuery);
        if (!document) {
          console.log(`Document "${documentToQuery}" not found.`);
          return;
        }
        
        const indices = document.vectorIndex.search(questionEmbedding, numChunks);
        retrievedChunks = indices.map(i => document.chunks[i]);
      }

      console.log(`Retrieved ${retrievedChunks.length} relevant chunks`);

      // Create prompt with retrieved chunks
      const prompt = `Context information is below.
---------------------
${retrievedChunks.join("\n---------------------\n")}

Given the context information and not prior knowledge, answer the query.
Query: ${question}
Answer:`;

      console.log('Generating answer...');
      const completion = await runCompletion(prompt);
      
      console.log('\n===== ANSWER =====');
      console.log(completion);
      console.log('==================\n');
    } catch (error) {
      console.error('Error querying document:', error);
    }
  });

// Interactive mode
program
  .command('interactive')
  .description('Start interactive mode')
  .action(async () => {
    console.log('Starting interactive RAG mode. Type "exit" to quit.');
    console.log('Type "help" to see available commands.');
    
    try {
      // Menu options for the main menu
      const choices = [
        { name: 'Add Document', value: 'add' },
        { name: 'List Documents', value: 'list' },
        { name: 'Remove Document', value: 'remove' },
        { name: 'Query Documents', value: 'query' },
        { name: 'Exit', value: 'exit' }
      ];

      while (true) {
        const { action } = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices
        }]);

        if (action === 'exit') {
          console.log('Goodbye!');
          break;
        }

        if (action === 'add') {
          const addCommand = program.commands.find(c => c.name() === 'add');
          if (addCommand) {
            await addCommand.parseAsync([]); // Parse with empty args to run the action with no options
          }
        } else if (action === 'list') {
          const listCommand = program.commands.find(c => c.name() === 'list');
          if (listCommand) {
            await listCommand.parseAsync([]); // Parse with empty args to run the action with no options
          }
        } else if (action === 'remove') {
          const removeCommand = program.commands.find(c => c.name() === 'remove');
          if (removeCommand) {
            await removeCommand.parseAsync([]); // Parse with empty args to run the action with no options
          }
        } else if (action === 'query') {
          const { askQuestion } = await inquirer.prompt([{
            type: 'confirm',
            name: 'askQuestion',
            message: 'Would you like to provide a question now?',
            default: true
          }]);

          const queryCommand = program.commands.find(c => c.name() === 'query');
          if (queryCommand) {
            if (askQuestion) {
              const { question } = await inquirer.prompt([{
                type: 'input',
                name: 'question',
                message: 'Enter your question:',
              }]);
              await queryCommand.parseAsync(['--query', question]); // Parse with query option
            } else {
              await queryCommand.parseAsync([]); // Parse with empty args to run the action with no options
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in interactive mode:', error);
    }
  });
  program
  .command('remove')
  .description('Remove a document from the RAG system')
  .option('-n, --name <name>', 'Name of the document to remove')
  .action(async (options: { name?: string }) => {
    try {
      const documents = documentStore.listDocuments();
      if (documents.length === 0) {
        console.log('No documents available to remove.');
        return;
      }

      let docToRemove = options.name;

      // If no document name provided, prompt user to select one
      if (!docToRemove) {
        const answer = await inquirer.prompt([{
          type: 'list',
          name: 'selectedDoc',
          message: 'Select a document to remove:',
          choices: documents.map(doc => doc.name)
        }]);
        docToRemove = answer.selectedDoc;
      } else {
        // Verify the specified document exists
        if (!documents.some(doc => doc.name === docToRemove)) {
          console.log(`Document "${docToRemove}" not found.`);
          return;
        }
      }

      // Confirm removal
      const confirmAnswer = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmRemoval',
        message: `Are you sure you want to remove document "${docToRemove}"? This cannot be undone.`,
        default: false
      }]);

      if (confirmAnswer.confirmRemoval) {
        const removed = documentStore.removeDocument(docToRemove);
        if (removed) {
          console.log(`Document "${docToRemove}" has been removed successfully.`);
        } else {
          console.log(`Failed to remove document "${docToRemove}".`);
        }
      } else {
        console.log('Operation cancelled.');
      }
    } catch (error) {
      console.error('Error removing document:', error);
    }
  });

// If no arguments, show help
if (process.argv.length <= 2) {
  program.help();
}

export { program };