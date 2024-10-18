const express = require('express');
const orgRoutes = require('./routes/orgrouter');
const hospital = require('./routes/hospital');
const cors = require('cors');
const dotenv = require('dotenv');

const app = express();
const PORT = 3002;

// Load lại file .env khi cần (nếu bạn muốn reload `.env`)

// Middleware cho việc xử lý JSON và URL-encoded data
app.use(express.json({ limit: '500mb' }));  // Giới hạn tối đa 500MB cho JSON payload
app.use(express.urlencoded({ limit: '500mb', extended: true }));  // Giới hạn 500MB cho form data

// Cài đặt CORS
app.use(cors());

// Định nghĩa các route
app.use('/', orgRoutes);
app.use('/hospital', hospital);

// Đảm bảo load lại file .env (nếu cần thiết, ví dụ khi có thay đổi trong `.env`)

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
