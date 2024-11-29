document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const pk = urlParams.get('pk');

    if (!pk || pk.trim() === '') {
        window.location.href = '/';
        return;
    }

    // Khởi tạo mảng lưu trữ dữ liệu
    let ebooksList = [];
    
    // Khởi tạo SSE connection
    const eventSource = new EventSource(`/api/ebooks/web?pk=${pk}`);

    // Tạo bảng hiển thị
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Tên file</th>
                <th>Kích thước</th>
            </tr>
        </thead>
        <tbody id="ebooks"></tbody>
    `;
    document.querySelector('#download').appendChild(table);

    // Lắng nghe sự kiện message
    eventSource.onmessage = function(event) {
        const response = JSON.parse(event.data);
        
        if (response.id === 0) {
            // Dữ liệu ban đầu
            ebooksList = response.data;
            updateTable();
            document.querySelector('#download').style.display = 'block';
        } else {
            // Update mới
            const newData = response.data[0];
            if (newData && !ebooksList.some(item => item.id === newData.id)) {
                ebooksList.unshift(newData); // Thêm vào đầu mảng
                updateTable();
            }
        }
    };

    function updateTable() {
        const tbody = document.querySelector('#ebooks');
        tbody.innerHTML = ebooksList.map(file => `
            <tr>
                <td><a href="/api/ebooks/${file.id}">${file.ebookTitle ? file.ebookTitle : file.fileName}</a></td>
                <td style="text-align: center;">${formatFileSize(file.size)}</td>
            </tr>
        `).join('');
    }

    function formatFileSize(bytes) {
        if (!bytes) return 'N/A';
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    // Xử lý khi có lỗi
    eventSource.onerror = function(error) {
        console.error('Lỗi SSE:', error);
        eventSource.close();
    };
});