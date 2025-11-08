const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve the entire project folder as static so assets and pages load as expected
app.use(express.static(path.join(__dirname)));

// Fallback: return Index.html for unknown routes (helps single-page navigation)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Index.html'));
});

app.listen(PORT, () => {
  console.log(`Arbaz Portfolio server running: http://localhost:${PORT}`);
});
