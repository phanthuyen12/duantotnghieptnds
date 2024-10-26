const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.get('/organization', (req, res) => {
  const id = req.query.id;

  // Kiểm tra xem 'id' có tồn tại không
  if (id) {
      res.send(`ID được truyền vào là: ${id}`);
  } else {
      res.send('Không có ID được truyền vào');
  }
});

// Endpoint to run shell script
app.post('/run-script', (req, res) => {
  const value = req.body.value; // Nhận giá trị từ yêu cầu
    console.log(value);
  if (value === undefined) {
    return res.status(400).json({ error: 'No value provided' });
  }

  const scriptPath = path.join(__dirname, '../','network', 'tudong.sh'); // Đường dẫn đến file .sh

  // Chạy shell script với giá trị truyền vào
  exec(`sh ${scriptPath} ${value}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ error: 'Script execution failed', details: stderr });
    }

    res.json({ output: stdout });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
