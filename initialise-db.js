import Database from "better-sqlite3";

const db = new Database("sqlite.db", { verbose: console.log });
db.pragma("journal_mode = WAL");

const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS documents (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
	full_text TEXT,
	status TEXT,
	processed_at DATE,
  progress INTEGER DEFAULT 0,
  num_pages INTEGER DEFAULT 0,
  bullmq_job_id INTEGER
	);`,
  `CREATE TABLE IF NOT EXISTS document_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  text_content TEXT,
  FOREIGN KEY (document_id) REFERENCES documents(id)
  );`,
];

createTableStatements.forEach((statement) => {
  db.exec(statement);
});

db.close();
