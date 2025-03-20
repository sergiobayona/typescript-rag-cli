// src/cli.ts
import { Command } from 'commander';
import inquirer from 'inquirer';
import * as fs from 'fs';
import * as path from 'path';
import { fetchEssay, chunkText, fetchFromUrl, readFromFile } from './services/dataService';
import { getTextEmbedding } from './services/embeddingService';
import { VectorIndex } from './models/vectorIndex';
import { runCompletion } from './services/completionService';
import { DocumentStore } from './models/documentStore';

// Initialize document store
const documentStore = new DocumentStore();

const program = new Command();

program
  .name('ts-rag')
  .description('TypeScript RAG CLI application')
  .version('1.0.0');

// Add command for adding a document
program
  .command('add')
  .description('Add a document to the RAG system')
  .option('-u, --url <url>', 'URL to fetch document from')
  .option('-f, --file <file>', 'Local file path to read document from')
  .option('-n, --name <name>', 'Name to identify the document')
  .option('-c, --chunk-size <size>', 'Size of text chunks', '2048')
  .action(async (options) => {
    try {
      let text: string;
      let name = options.name;

      // If no name is provided, prompt for one
      if (!name) {
        const answer = await inquirer.prompt([{
          type: 'input',
          name: 'docName',
          message: 'Enter a name for this document:',
          validate: (input) => input.trim() !== '' ? true : 'Name cannot be empty'
        }]);
        name = answer.docName;
      }

      // Get the document text based on the provided options
      if (options.url) {
        console.log(`Fetching document from URL: ${options.url}`);
        text = await fetchFromUrl(options.url);
      } else if (options.file) {
        console.log(`Reading document from file: ${options.file}`);
        text = await readFromFile(options.file);
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
          text = await fetchFromUrl(urlAnswer.url);
        } else if (sourceAnswer.source === 'File') {
          const fileAnswer = await inquirer.prompt([{
            type: 'input',
            name: 'filePath',
            message: 'Enter file path:',
            validate: (input) => fs.existsSync(input) ? true : 'File does not exist'
          }]);
          text = await readFromFile(fileAnswer.filePath);
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
  .action(async (options) => {
    try {
      const documents = documentStore.listDocuments();
      if (documents.length === 0) {
        console.log('No documents available. Add one with the "add" command.');
        return;
      }

      let docName = options.document;
      let question = options.query;
      const numChunks = parseInt(options.numChunks);

      // If no document is specified, prompt the user
      if (!docName) {
        const docAnswer = await inquirer.prompt([{
          type: 'list',
          name: 'selectedDoc',
          message: 'Select a document to query:',
          choices: documents.map(doc => doc.name).concat(['All documents'])
        }]);
        docName = docAnswer.selectedDoc;
      }

      // If no question is provided, prompt for one
      if (!question) {
        const questionAnswer = await inquirer.prompt([{
          type: 'input',
          name: 'userQuestion',
          message: 'Enter your question:',
          validate: (input) => input.trim() !== '' ? true : 'Question cannot be empty'
        }]);
        question = questionAnswer.userQuestion;
      }

      console.log(`Generating embedding for question: "${question}"`);
      const questionEmbedding = await getTextEmbedding(question);

      let retrievedChunks: string[] = [];
      
      if (docName === 'All documents') {
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
        const document = documentStore.getDocument(docName);
        if (!document) {
          console.log(`Document "${docName}" not found.`);
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
    
    let running = true;
    while (running) {
      const answer = await inquirer.prompt([{
        type: 'input',
        name: 'command',
        message: 'ts-rag> '
      }]);
      
      const cmd = answer.command.trim();
      
      if (cmd === 'exit') {
        running = false;
        console.log('Exiting interactive mode.');
      } else if (cmd === 'help') {
        console.log(`
Available commands:
  add          - Add a document
  list         - List available documents
  query        - Query a document
  exit         - Exit interactive mode
  help         - Show this help message
        `);
      } else if (cmd === 'add') {
        await program.commands.find(c => c.name() === 'add').action();
      } else if (cmd === 'list') {
        await program.commands.find(c => c.name() === 'list').action();
      } else if (cmd.startsWith('query')) {
        // If the command starts with 'query', treat the rest as a question
        const question = cmd.substring('query'.length).trim();
        if (question) {
          await program.commands.find(c => c.name() === 'query').action({ query: question });
        } else {
          await program.commands.find(c => c.name() === 'query').action({});
        }
      } else {
        console.log(`Unknown command: "${cmd}". Type "help" for available commands.`);
      }
    }
  });

// If no arguments, show help
if (process.argv.length <= 2) {
  program.help();
}

export { program };