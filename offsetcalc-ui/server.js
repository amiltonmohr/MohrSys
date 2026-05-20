const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 5173;
app.listen(PORT, () => {
  console.log(`🎨 UI Server rodando em http://localhost:${PORT}`);
});
