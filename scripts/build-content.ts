import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import lunr from 'lunr';

const CONTENT_DIR = path.resolve(__dirname, '../content');
const OUTPUT_DIR = path.resolve(__dirname, '../src/assets');

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  })
);

interface BlockDir {
  dirName: string;
  blockId: number;
  slug: string;
  title: string;
  files: string[];
}

function getBlockDirs(): BlockDir[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('No content directory found. Skipping build.');
    return [];
  }

  const dirs = fs.readdirSync(CONTENT_DIR)
    .filter(d => d.startsWith('block-') && fs.statSync(path.join(CONTENT_DIR, d)).isDirectory())
    .sort();

  return dirs.map(dirName => {
    const match = dirName.match(/^block-(\d+)-(.+)$/);
    if (!match) throw new Error(`Invalid block dir name: ${dirName}`);

    const blockId = parseInt(match[1], 10);
    const slug = match[2];
    const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const files = fs.readdirSync(path.join(CONTENT_DIR, dirName))
      .filter(f => f.endsWith('.md'))
      .sort();

    return { dirName, blockId, slug, title, files };
  });
}

function parseTopicFile(blockDir: BlockDir, fileName: string) {
  const filePath = path.join(CONTENT_DIR, blockDir.dirName, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  const htmlContent = marked.parse(content) as string;

  // Parse sections from markdown (## headers)
  const sections: { id: string; title: string; htmlContent: string }[] = [];
  const headerMatches = [...content.matchAll(/^## (.+)$/gm)];
  for (let idx = 0; idx < headerMatches.length; idx++) {
    const match = headerMatches[idx];
    const sectionTitle = match[1].trim();
    const sectionId = sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const startIdx = content.indexOf(match[0]) + match[0].length;
    const nextHeader = headerMatches[idx + 1];
    const endIdx = nextHeader ? content.indexOf(nextHeader[0], startIdx) : content.length;
    const sectionContent = content.slice(startIdx, endIdx).trim();
    sections.push({
      id: sectionId,
      title: sectionTitle,
      htmlContent: marked.parse(sectionContent) as string,
    });
  }

  return {
    frontmatter,
    htmlContent,
    sections,
    rawContent: content,
  };
}

function extractInterviewQuestions(frontmatter: any, blockId: number, blockTitle: string): any[] {
  if (!frontmatter.interviewQuestions || !Array.isArray(frontmatter.interviewQuestions)) {
    return [];
  }
  return frontmatter.interviewQuestions.map((q: any) => ({
    ...q,
    block: blockId,
    blockTitle,
    topic: frontmatter.topic,
    topicTitle: frontmatter.title,
    topicSlug: frontmatter.slug,
  }));
}

function build() {
  console.log('Building content...');

  const blockDirs = getBlockDirs();
  if (blockDirs.length === 0) {
    // Create empty assets so the app can still build
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'content-index.json'), JSON.stringify({ blocks: [], totalTopics: 0, totalQuestions: 0 }));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'interview-questions.json'), '[]');
    const emptyIndex = lunr(function () {
      this.ref('id');
      this.field('title');
    });
    fs.writeFileSync(path.join(OUTPUT_DIR, 'search-index.json'), JSON.stringify(emptyIndex));
    console.log('No content found. Created empty asset files.');
    return;
  }

  const contentIndex: any = { blocks: [], totalTopics: 0, totalQuestions: 0 };
  const allQuestions: any[] = [];
  const searchDocuments: { id: string; title: string; tags: string; content: string }[] = [];

  for (const blockDir of blockDirs) {
    const block: any = {
      id: blockDir.blockId,
      slug: blockDir.slug,
      title: blockDir.title,
      description: '',
      topicCount: blockDir.files.length,
      topics: [],
    };

    const blockOutputDir = path.join(OUTPUT_DIR, 'content', blockDir.slug);
    fs.mkdirSync(blockOutputDir, { recursive: true });

    for (const file of blockDir.files) {
      const parsed = parseTopicFile(blockDir, file);
      const fm = parsed.frontmatter;

      const topicMeta = {
        id: `b${blockDir.blockId}t${fm.topic}`,
        block: blockDir.blockId,
        topic: fm.topic,
        slug: fm.slug,
        title: fm.title,
        difficulty: fm.difficulty ?? 3,
        sinceVersion: fm.sinceVersion,
        tags: fm.tags || [],
        relatedTopics: fm.relatedTopics || [],
        questionCount: fm.interviewQuestions?.length || 0,
      };

      block.topics.push(topicMeta);

      const topicContent = {
        ...topicMeta,
        htmlContent: parsed.htmlContent,
        sections: parsed.sections,
      };
      fs.writeFileSync(
        path.join(blockOutputDir, `${fm.slug}.json`),
        JSON.stringify(topicContent, null, 2)
      );

      const questions = extractInterviewQuestions(fm, blockDir.blockId, blockDir.title);
      allQuestions.push(...questions);

      searchDocuments.push({
        id: topicMeta.id,
        title: fm.title,
        tags: (fm.tags || []).join(' '),
        content: parsed.rawContent.slice(0, 5000),
      });

      contentIndex.totalTopics++;
      contentIndex.totalQuestions += questions.length;
    }

    if (block.topics.length > 0) {
      block.description = `${block.topicCount} topics covering ${block.title.toLowerCase()}`;
    }

    contentIndex.blocks.push(block);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'content-index.json'),
    JSON.stringify(contentIndex, null, 2)
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'interview-questions.json'),
    JSON.stringify(allQuestions, null, 2)
  );

  const searchIndex = lunr(function () {
    this.ref('id');
    this.field('title', { boost: 10 });
    this.field('tags', { boost: 5 });
    this.field('content');

    for (const doc of searchDocuments) {
      this.add(doc);
    }
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'search-index.json'),
    JSON.stringify(searchIndex)
  );

  console.log(`Done! ${contentIndex.totalTopics} topics, ${contentIndex.totalQuestions} questions, ${searchDocuments.length} search entries.`);
}

build();
