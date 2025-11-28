import { test, expect } from './fixtures';

test('verify snapshot filtering removes cursor and url attributes', async ({ client, server }) => {
  server.setContent('/', `
    <html>
    <head><title>Filter Test</title></head>
    <body>
      <nav>
        <a href="/about">About Us</a>
        <a href="/contact">Contact</a>
      </nav>
      <main>
        <input type="text" placeholder="Enter name">
        <button>Submit</button>
      </main>
    </body>
    </html>
  `, 'text/html');

  const response = await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  // Get the response text
  const text = response.content[0].text;
  
  // Verify cursor=pointer is removed
  expect(text).not.toContain('[cursor=pointer]');
  expect(text).not.toContain('[cursor=');
  
  // Verify /url: lines are removed  
  expect(text).not.toContain('- /url:');
  
  // Verify /placeholder: lines are removed
  expect(text).not.toContain('- /placeholder:');
  
  // Verify essential content is preserved
  expect(text).toContain('link "About Us"');
  expect(text).toContain('link "Contact"');
  expect(text).toContain('[ref=');
  expect(text).toContain('button "Submit"');
  expect(text).toContain('textbox "Enter name"');
});
