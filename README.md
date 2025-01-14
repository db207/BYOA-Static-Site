# Static Site with HTML, CSS, JavaScript and simple Node libraries

A simple static site generator that converts Markdown to HTML for pages and blog posts.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run the build script:

```bash
npm run build
``` 

3. Run the server:

```bash
npm run serve
```

4. Open your browser and navigate to `http://localhost:3000` to view the site.

## Project Structure

- `src/pages/`: Markdown files for pages.
- `src/blog/`: Markdown files for blog posts.
- `src/styles/`: CSS files.
- `src/images/`: Image files.
- `src/js/`: JavaScript files.
- `public/`: Built HTML files and static assets.

## Notes

- The build script processes all Markdown files in `src/pages/` and `src/blog/`, generating HTML files in the `public/` directory.
- Static assets like CSS, images, and JavaScript are copied from `src/styles/`, `src/images/`, and `src/js/` to `public/` during the build process.
- The server serves the files from `public/` and handles routing based on the file structure.
- The `scripts/build.js` script is used to build the site. It processes all Markdown files, generates HTML files, and copies static assets to the `public/` directory.
- The `scripts/server.js` script is used to start the server. It serves the files from the `public/` directory.

