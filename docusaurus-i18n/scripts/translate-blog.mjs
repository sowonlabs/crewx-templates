#!/usr/bin/env node

/**
 * Blog Translation Script
 *
 * Automated Korean → English blog translation script
 * Uses CrewX blog_translator agent for translation.
 */

import { execSync } from 'child_process';
import { readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Directory paths
const KO_BLOG_DIR = join(projectRoot, 'i18n/ko/docusaurus-plugin-content-blog');
const EN_BLOG_DIR = join(projectRoot, 'blog');

/**
 * Get blog file list (excluding authors.yml, tags.yml, options.json)
 */
function getBlogFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir)
    .filter(file => file.endsWith('.md'))
    .filter(file => !file.startsWith('.'))
    .sort();
}

/**
 * Find untranslated blogs (files in Korean but not in English)
 */
function findUntranslatedBlogs() {
  const koFiles = getBlogFiles(KO_BLOG_DIR);
  const enFiles = getBlogFiles(EN_BLOG_DIR);

  const untranslated = koFiles.filter(file => !enFiles.includes(file));

  return untranslated;
}

/**
 * Execute translation with CrewX blog_translator agent
 */
function translateBlog(filename) {
  const koPath = `i18n/ko/docusaurus-plugin-content-blog/${filename}`;
  const enPath = `blog/${filename}`;

  console.log(`\n🔄 Translating: ${filename}`);
  console.log(`   Korean: ${koPath}`);
  console.log(`   English: ${enPath}`);

  try {
    const command = `crewx x "@blog_translator Translate ${koPath} to English and save it to ${enPath}"`;

    execSync(command, {
      stdio: 'inherit',
      cwd: projectRoot
    });

    console.log(`✅ Translation complete: ${filename}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Translation failed: ${filename}`);
    console.error(error.message);
    return false;
  }
}

/**
 * Main execution function
 */
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'check';

  console.log('📝 CrewX Blog Translation Tool\n');
  console.log('=' .repeat(50));

  // Find untranslated blogs
  const untranslated = findUntranslatedBlogs();

  if (untranslated.length === 0) {
    console.log('✅ All Korean blogs have been translated to English!\n');
    return;
  }

  console.log(`\n📋 Untranslated blogs: ${untranslated.length}\n`);
  untranslated.forEach((file, idx) => {
    console.log(`   ${idx + 1}. ${file}`);
  });
  console.log();

  // check mode: Display list only
  if (mode === 'check') {
    console.log('💡 To translate: npm run translate:ko-to-en\n');
    return;
  }

  // translate mode: Execute actual translation
  if (mode === 'translate') {
    console.log('🚀 Starting translation...\n');
    console.log('=' .repeat(50));

    let successCount = 0;
    let failCount = 0;

    for (const file of untranslated) {
      const success = translateBlog(file);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log('=' .repeat(50));
    console.log('\n📊 Translation results:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📝 Total: ${untranslated.length}\n`);

    if (successCount > 0) {
      console.log('💡 Next steps:');
      console.log('   1. Check changes with git status');
      console.log('   2. Review translated files');
      console.log('   3. git add . && git commit\n');
    }

    return;
  }

  console.log('❌ Unknown mode:', mode);
  console.log('Usage: npm run translate:check or npm run translate:ko-to-en\n');
}

// Execute script
main();
