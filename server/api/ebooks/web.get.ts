export default defineEventHandler(() => {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Real-time Clock</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
        }
        #clock {
            font-size: 48px;
            color: #333;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div id="clock"></div>

    <script>
        function updateClock() {
            const now = new Date();
            const time = now.toLocaleTimeString('vi-VN');
            document.getElementById('clock').textContent = time;
        }
        
        // Cập nhật ngay lập tức
        updateClock();
        
        // Cập nhật mỗi 1 giây
        setInterval(updateClock, 1000);
    </script>
</body>
</html>
  `

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
})
