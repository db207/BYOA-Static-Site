const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
require('dotenv').config();

// Configure marked to respect line breaks
marked.setOptions({
    breaks: true
});

// GitHub Pages configuration
const BASE_URL = '/BYOA-Static-Site';

// Function to add base URL to absolute paths
function addBaseUrl(content) {
    return content
        .replace(/href="\//g, `href="${BASE_URL}/`)
        .replace(/src="\//g, `src="${BASE_URL}/`);
}

// Ensure build directories exist
fs.ensureDirSync('public');
fs.ensureDirSync('public/blog');
fs.ensureDirSync('public/css');
fs.ensureDirSync('public/js');

// Read and process templates
const pageTemplate = addBaseUrl(fs.readFileSync('src/templates/page.html', 'utf-8'));
const blogTemplate = addBaseUrl(fs.readFileSync('src/templates/blog.html', 'utf-8'));
const blogIndexTemplate = addBaseUrl(fs.readFileSync('src/templates/blog-index.html', 'utf-8'));

// Parse frontmatter
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        console.log('No frontmatter found in content');
        return {
            metadata: {},
            content: content
        };
    }

    const metadata = {};
    const frontmatterLines = match[1].split('\n');
    
    frontmatterLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex !== -1) {
                const key = trimmedLine.slice(0, colonIndex).trim();
                const value = trimmedLine.slice(colonIndex + 1).trim();
                metadata[key] = value;
            }
        }
    });

    return {
        metadata,
        content: match[2]
    };
}

// Build pages
function buildPages() {
    const pages = fs.readdirSync('src/pages');
    console.log('Found pages:', pages);
    pages.forEach(page => {
        if (page === 'index.md') return;
        
        console.log('Building page:', page);
        const markdown = fs.readFileSync(`src/pages/${page}`, 'utf-8');
        console.log('Read markdown content:', markdown.substring(0, 100) + '...');
        
        const { metadata, content } = parseFrontmatter(markdown);
        console.log('Parsed content length:', content.length);
        
        const html = marked(content);
        console.log('Generated HTML length:', html.length);
        
        const finalHtml = pageTemplate
            .replace('{{content}}', html)
            .replace('{{title}}', metadata.title || page.replace('.md', '').charAt(0).toUpperCase() + page.replace('.md', '').slice(1));
        
        const outputPath = `public/${page.replace('.md', '.html')}`;
        fs.writeFileSync(outputPath, finalHtml);
        console.log('Page built successfully:', outputPath);
        
        // Verify the file was written
        const written = fs.readFileSync(outputPath, 'utf-8');
        console.log('Written file size:', written.length, 'bytes');
    });
}

// Build blog posts
function buildBlog() {
    const posts = fs.readdirSync('src/blog');
    const allPosts = [];

    posts.forEach(post => {
        const markdown = fs.readFileSync(`src/blog/${post}`, 'utf-8');
        const { metadata, content } = parseFrontmatter(markdown);
        const html = marked(content);
        
        // Add slug to metadata
        metadata.slug = post.replace('.md', '');
        
        // Store post data for the index
        allPosts.push({
            ...metadata,
            description: metadata.description || '',
            date: metadata.date || 'No date',
            author: metadata.author || 'Anonymous'
        });

        // Remove the h1 title since we're displaying it from metadata
        const contentWithoutTitle = html.replace(/<h1[^>]*>.*?<\/h1>/, '');

        // Replace template variables
        let finalHtml = blogTemplate;
        // Replace each metadata field
        Object.entries(metadata).forEach(([key, value]) => {
            finalHtml = finalHtml.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
        });
        // Replace content last
        finalHtml = finalHtml.replace('{{content}}', contentWithoutTitle);
        
        const outputPath = `public/blog/${metadata.slug}.html`;
        fs.writeFileSync(outputPath, finalHtml);
    });
}

// Copy and process JavaScript files
function processJavaScript() {
    // Read the newsletter.js file
    let newsletterJs = fs.readFileSync('src/scripts/newsletter.js', 'utf-8');
    
    // Get API key from environment variable
    const apiKey = process.env.CONVERTKIT_API_KEY;
    if (!apiKey) {
        throw new Error('CONVERTKIT_API_KEY environment variable is not set');
    }
    
    // Instead of exposing the API key in client-side code,
    // we'll create a server endpoint to handle the subscription
    newsletterJs = newsletterJs.replace(
        'const FORM_ID = \'7561209\';',
        'const FORM_ID = \'7561209\';\nconst API_ENDPOINT = \'/api/subscribe\';'
    );
    
    // Write the processed file
    fs.writeFileSync('public/js/newsletter.js', newsletterJs);
}

// Copy static assets
console.log('Copying static assets...');
fs.copySync('src/styles', 'public/css', { overwrite: true });
fs.copySync('src/images', 'public/images', { overwrite: true });
fs.copySync('src/scripts', 'public/js', { overwrite: true });
console.log('Static assets copied successfully');

// Run build
buildPages();
buildBlog();
processJavaScript(); 