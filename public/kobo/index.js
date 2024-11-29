var ebooksList = [];
var eleDownload = document.getElementById('download');
var eleH1 = document.getElementById('title');
eleH1.style.textAlign = 'center';

var pollTimer = null;

function getQueryParam(param) {
    var search = window.location.search.substring(1);
    var params = search.split('&');
    for (var i = 0; i < params.length; i++) {
        var pair = params[i].split('=');
        if (pair[0] === param) {
            return decodeURIComponent(pair[1]);
        }
    }
    return null;
}

function fetchEbooks(pk, id, page, limit, latestOnly) {
    id = id || 0;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', `/api/ebooks/web?pk=${pk}&page=${page}&limit=${limit}&latestOnly=${latestOnly}`);
    xhr.onload = function() {
        var response = JSON.parse(xhr.responseText);
        ebooksList = response.data;
        if(id !== 0) {
            var newData = response.data[0];
            var found = false;
            for (var i = 0; i < ebooksList.length; i++) {
                if (ebooksList[i].id === newData.id) {
                    found = true;
                    break;
                }
            }
            if (newData && !found) {
                ebooksList.unshift(newData); // Thêm vào đầu mảng
                updateTable();
            }
        } else {
            updateTable();
        }
    };
    xhr.send();
}

function updateTable() {
    var tbody = document.querySelector('#ebooks');
    var html = '';
    
    for (var i = 0; i < ebooksList.length; i++) {
        var file = ebooksList[i];
        var title = file.ebookTitle ? file.ebookTitle : file.fileName;
        
        html += '<tr>';
        html += '<td><a href="/api/ebooks/' + file.id + '">' + title + '</a></td>';
        html += '<td style="text-align: center;">' + formatFileSize(file.size) + '</td>';
        html += '</tr>';
    }
    
    tbody.innerHTML = html;
}

function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    var units = ['B', 'KB', 'MB', 'GB'];
    var size = bytes;
    var unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return size.toFixed(2) + ' ' + units[unitIndex];
}

function init() {
    var pk = getQueryParam('pk');

    if (!pk || pk.trim() === '') {
        window.location.href = '/';
        return;
    }

    // Khởi tạo mảng lưu trữ dữ liệu
    
    // Tạo bảng hiển thị
    // var table = document.createElement('table');
    
    // table.innerHTML = '<thead>' +
    //     '<tr>' +
    //         '<th>Tên file</th>' +
    //         '<th>Kích thước</th>' +
    //     '</tr>' +
    // '</thead>' +
    // '<tbody id="ebooks"></tbody>';
    // eleDownload.appendChild(table);

    

    fetchEbooks(pk, 0, 1, 10, false);

    pollTimer = setInterval(() => {
        fetchEbooks(pk, 1, 1, 1, true);
    }, 5000);

}

window.onload = function() {
    eleDownload.style.display = 'block';
    if(pollTimer) {
        clearInterval(pollTimer);
    }
    init();
}