// Khởi tạo: Kiểm tra xem đã có tiền lưu trong máy chưa, nếu chưa thì cho 1.000.000
let savedBalance = localStorage.getItem('casino_balance');
let user = { 
    balance: savedBalance !== null ? parseInt(savedBalance) : 1000000 
};

let game = { tempBet: 0, confirmedBet: 0, side: null, phase: 'betting', dice: [1, 1, 1], autoOpenTimer: null };

window.onload = () => {
    updateUI(); // Hiển thị số tiền đã lưu ngay khi vào trang
    startNewRound();
};

// Hàm lưu tiền vào bộ nhớ trình duyệt mỗi khi thay đổi
function saveToLocal() {
    localStorage.setItem('casino_balance', user.balance);
}

function updateUI() {
    document.getElementById('balance').textContent = user.balance.toLocaleString();
    document.getElementById('betValue').textContent = (game.tempBet + game.confirmedBet).toLocaleString();
    document.getElementById('betSideLabel').textContent = game.side ? `CỬA: ${game.side.toUpperCase()}` : "VUI LÒNG CHỌN CỬA";
    saveToLocal(); // Lưu lại mỗi lần UI cập nhật
}

// Hàm nạp tiền (Bây giờ sẽ được lưu lại vĩnh viễn)
function recharge() {
    user.balance += 500000;
    updateUI();
    showNotify("NẠP TIỀN", "Bạn vừa được cộng <span style='color:#f1c40f'>+500,000</span>. Tiền đã được lưu vào hệ thống!");
}

function selectSide(s, event) {
    if(game.phase !== 'betting') return;
    
    // Kiểm tra không cho đặt 2 cửa cùng lúc
    if (game.side !== null && game.side !== s && game.confirmedBet > 0) {
        showNotify("LỖI", "Bạn đã đặt cửa " + game.side.toUpperCase() + " rồi!");
        return;
    }

    if (user.balance >= currentChipValue) {
        // Trừ tiền và cộng vào cược
        user.balance -= currentChipValue;
        game.confirmedBet += currentChipValue;
        game.side = s;

        // Kích hoạt hiệu ứng tiền bay
        const targetGate = document.getElementById(`side${s.charAt(0).toUpperCase() + s.slice(1)}`);
        spawnCoin(event, targetGate);

        // Hiển thị chọn khung
        document.querySelectorAll('.gate').forEach(g => g.classList.remove('active'));
        targetGate.classList.add('active');
        
        updateUI();
    } else {
        showNotify("THÔNG BÁO", "Bạn không đủ số dư!");
    }
}

function spawnCoin(e, targetEl) {
    // Tạo phần tử đồng xu
    const coin = document.createElement('div');
    coin.className = 'coin-fly';
    coin.innerText = '$';
    
    // Vị trí xuất phát (tại điểm click hoặc chạm)
    const startX = e.clientX || e.touches[0].clientX;
    const startY = e.clientY || e.touches[0].clientY;
    
    // Vị trí đích (giữa khung Tài/Xỉu)
    const rect = targetEl.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    
    // Tính toán khoảng cách bay
    const diffX = targetX - startX;
    const diffY = targetY - startY;
    
    coin.style.left = startX + 'px';
    coin.style.top = startY + 'px';
    coin.style.setProperty('--tx', `${diffX}px`);
    coin.style.setProperty('--ty', `${diffY}px`);
    coin.style.animation = 'fly-to-target 0.6s forwards ease-in';
    
    document.body.appendChild(coin);
    
    // Rung khung cược khi tiền "chạm" đích
    setTimeout(() => {
        targetEl.classList.add('bounce');
        setTimeout(() => targetEl.classList.remove('bounce'), 2000);
        coin.remove();
    }, 6000);
}

document.querySelectorAll('.chip').forEach(btn => {
    btn.onclick = () => {
        if(game.phase !== 'betting' || !game.side) return;
        let val = parseInt(btn.dataset.val);
        if(user.balance >= val) { 
            user.balance -= val; 
            game.tempBet += val; 
            updateUI(); 
        } else {
            showNotify("THÔNG BÁO", "Bạn không đủ số dư!");
        }
    }
});

function betAll() {
    if(game.phase !== 'betting' || !game.side) return;
    game.tempBet += user.balance; 
    user.balance = 0; 
    updateUI();
}

function confirmBet() {
    if(game.tempBet <= 0 && game.confirmedBet <= 0) return showNotify("THÔNG BÁO", "Bạn chưa đặt cược!");
    if(game.tempBet > 0) {
        game.confirmedBet += game.tempBet; 
        game.tempBet = 0;
        updateUI();
        showNotify("THÀNH CÔNG", "Đặt cược thành công!");
    }
}

function clearBet() {
    if(game.phase !== 'betting') return;
    user.balance += (game.tempBet + game.confirmedBet);
    game.tempBet = 0; 
    game.confirmedBet = 0; 
    game.side = null;
    document.querySelectorAll('.gate').forEach(g => g.classList.remove('active'));
    updateUI();
}

function startNewRound() {
    game.phase = 'betting'; 
    game.tempBet = 0; 
    game.confirmedBet = 0; 
    game.side = null;
    document.querySelectorAll('.gate').forEach(g => g.classList.remove('active'));
    const lid = document.getElementById('lid');
    lid.style.transition = '0.5s'; 
    lid.style.transform = 'translate(0,0)'; 
    lid.style.opacity = '1';
    updateUI();
    
    let t = 25;
    const itv = setInterval(() => {
        document.getElementById('timer').textContent = t;
        if(t <= 0) { 
            clearInterval(itv); 
            startWaiting(); 
        }
        t--;
    }, 1000);
}

function startWaiting() {
    game.phase = 'waiting';
    game.dice = [1,2,3].map(() => Math.floor(Math.random()*6)+1);
    game.dice.forEach((v, i) => drawDice(`d${i+1}`, v));

    game.autoOpenTimer = setTimeout(() => {
        if(game.phase === 'waiting') {
            openLid();
        }
    }, 3000);
}

function openLid() {
    const lid = document.getElementById('lid');
    lid.style.transition = '1s ease-in-out';
    lid.style.transform = 'translate(220px, -60px) rotate(40deg)';
    lid.style.opacity = '0';
    setTimeout(processResult, 1000);
}

// Logic Nặn bát
let lidEl = document.getElementById('lid'), isDragging = false, startX, startY;
lidEl.onmousedown = (e) => { 
    if(game.phase === 'waiting') { 
        isDragging = true; startX = e.clientX; startY = e.clientY; 
        lidEl.style.transition = 'none'; 
        clearTimeout(game.autoOpenTimer);
    } 
};
document.onmousemove = (e) => {
    if(!isDragging) return;
    let dx = e.clientX - startX, dy = e.clientY - startY;
    lidEl.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx/15}deg)`;
    if(Math.sqrt(dx*dx + dy*dy) > 130) { 
        isDragging = false; 
        lidEl.style.transition = '0.5s'; 
        openLid(); 
    }
};
document.onmouseup = () => isDragging = false;

// Hàm xử lý kết quả và thiết lập vòng lặp phiên mới
function processResult() {
    if(game.phase === 'result') return;
    game.phase = 'result';
    
    const total = game.dice.reduce((a,b) => a+b, 0);
    const winSide = total >= 11 ? 'tai' : 'xiu';
    
    const overlay = document.getElementById('resultOverlay');
    const statusEl = document.getElementById('resStatus');
    const moneyEl = document.getElementById('resMoney');

    // 1. Hiển thị thông báo nếu có cược
    if(game.confirmedBet > 0 && game.side) {
        if(game.side === winSide) {
            let profit = Math.floor(game.confirmedBet * 0.95);
            user.balance += (game.confirmedBet + profit);
            statusEl.textContent = "THẮNG";
            statusEl.className = "win-color";
            moneyEl.textContent = "+" + profit.toLocaleString();
        } else {
            statusEl.textContent = "THUA";
            statusEl.className = "lose-color";
            moneyEl.textContent = "-" + game.confirmedBet.toLocaleString();
        }
        overlay.style.display = 'flex';
        
        // Sau 3 giây đóng bảng kết quả và chuẩn bị phiên mới
        setTimeout(() => {
            overlay.style.display = 'none';
            setTimeout(startNewRound, 1000); // Chờ 1 giây rồi sang phiên mới
        }, 3000);
    } else {
        // Nếu KHÔNG cược, chỉ ghi nhận kết quả vào roadmap và sang phiên mới luôn
        addRoadmap(winSide);
        setTimeout(startNewRound, 2000); 
    }

    if(game.confirmedBet > 0) {
        addRoadmap(winSide);
        updateUI();
    }
}

// Hàm khởi tạo phiên mới (Reset toàn bộ trạng thái)
function startNewRound() {
    game.phase = 'betting'; 
    game.tempBet = 0; 
    game.confirmedBet = 0; 
    game.side = null;
    
    document.querySelectorAll('.gate').forEach(g => g.classList.remove('active'));
    document.getElementById('resultOverlay').style.display = 'none';
    
    const lid = document.getElementById('lid');
    const plate = document.getElementById('mainPlate');
    
    // 1. Đậy nắp lại
    lid.style.transition = '0.5s ease-out';
    lid.style.transform = 'translate(0,0) rotate(0deg)';
    lid.style.opacity = '1';
    
    // 2. Bắt đầu lắc nhẹ ngay khi đậy nắp
    plate.classList.add('is-shaking');
    
    // 3. Sau 1 giây thì dừng lắc
    setTimeout(() => {
        plate.classList.remove('is-shaking');
    }, 1000);

    updateUI();
    
    // 4. Bắt đầu đếm ngược đặt cược
    let t = 25;
    const itv = setInterval(() => {
        document.getElementById('timer').textContent = t;
        if(t <= 0) { 
            clearInterval(itv); 
            // Khi hết giờ, chuyển sang trạng thái chờ nặn
            startWaiting(); 
        }
        t--;
    }, 1000);
}
// Hàm lắc xúc xắc và chuẩn bị nặn
function startWaiting() {
    game.phase = 'waiting';
    // Tạo kết quả xúc xắc ngẫu nhiên
    game.dice = [1,2,3].map(() => Math.floor(Math.random()*6)+1);
    game.dice.forEach((v, i) => drawDice(`d${i+1}`, v));

    // Sau 3 giây nếu không ai nặn thì tự động mở nắp
    game.autoOpenTimer = setTimeout(() => {
        if(game.phase === 'waiting') {
            openLid();
        }
    }, 3000);
}

function openLid() {
    const lid = document.getElementById('lid');
    lid.style.transition = '1s ease-in-out';
    lid.style.transform = 'translate(220px, -60px) rotate(40deg)';
    lid.style.opacity = '0';
    setTimeout(processResult, 1000);

    addRoadmap(winSide); 
    updateUI(); // Lưu tiền sau ván đấu
    setTimeout(startNewRound, 4000);
}

function addRoadmap(res) {
    const dot = document.createElement('div');
    dot.className = `dot dot-${res}`;
    const roadmap = document.getElementById('roadmap');
    roadmap.appendChild(dot);
    if(roadmap.children.length > 18) roadmap.removeChild(roadmap.firstChild);
}

function drawDice(id, val) {
    const el = document.getElementById(id); el.innerHTML = '';
    const patterns = { 1:[[50,50]], 2:[[25,25],[75,75]], 3:[[20,20],[50,50],[80,80]], 4:[[25,25],[25,75],[75,25],[75,75]], 5:[[25,25],[25,75],[75,25],[75,75],[50,50]], 6:[[25,25],[50,25],[75,25],[25,75],[50,75],[75,75]] };
    patterns[val].forEach(p => {
        const d = document.createElement('div');
        d.style.cssText = `position:absolute; width:9px; height:9px; background:#222; border-radius:50%; top:${p[0]}%; left:${p[1]}%; transform:translate(-50%,-50%)`;
        if(val === 1) { d.style.background = 'red'; d.style.width = '12px'; d.style.height = '12px'; }
        el.appendChild(d);
    });
}

function showNotify(title, msg) {
    document.getElementById('popTitle').textContent = title;
    document.getElementById('popMsg').innerHTML = msg;
    document.getElementById('notifyPopup').style.display = 'flex';
}
function closeNotify() { document.getElementById('notifyPopup').style.display = 'none'; }
let currentChipValue = 10000; // Mặc định chọn chip 10k khi vào game

// 1. Chọn Chip (Không trừ tiền ngay, chỉ là chọn mệnh giá)
document.querySelectorAll('.chip').forEach(btn => {
    btn.onclick = () => {
        // Xóa hiệu ứng chọn ở các chip khác
        document.querySelectorAll('.chip').forEach(c => c.style.border = "2px solid #555");
        // Làm nổi bật chip đang chọn
        btn.style.border = "3px solid #fff";
        currentChipValue = parseInt(btn.dataset.val);
    }
});

// 2. Chạm vào TÀI/XỈU là CƯỢC LUÔN
function selectSide(s) {
    if(game.phase !== 'betting') return;
    
    // Nếu đổi cửa giữa chừng (ví dụ đang cược Tài mà bấm Xỉu)
    if (game.side !== null && game.side !== s && game.confirmedBet > 0) {
        showNotify("LỖI", "Bạn đã đặt cửa " + game.side.toUpperCase() + ", không thể đặt thêm cửa khác!");
        return;
    }

    if (user.balance >= currentChipValue) {
        user.balance -= currentChipValue;
        game.confirmedBet += currentChipValue;
        game.side = s;
        
        // Hiển thị hiệu ứng chọn khung
        document.querySelectorAll('.gate').forEach(g => g.classList.remove('active'));
        document.getElementById(`side${s.charAt(0).toUpperCase() + s.slice(1)}`).classList.add('active');
        
        updateUI();
    } else {
        showNotify("THÔNG BÁO", "Bạn không đủ số dư!");
    }
}

// 3. Nút Hủy cược (Hoàn tiền nếu trong thời gian đặt)
function clearBet() {
    if(game.phase !== 'betting') return;
    if(game.confirmedBet > 0) {
        user.balance += game.confirmedBet;
        game.confirmedBet = 0;
        game.side = null;
        document.querySelectorAll('.gate').forEach(g => g.classList.remove('active'));
        updateUI();
    }
}

// 4. Bỏ qua bước Confirm, hàm updateUI sẽ tự lưu LocalStorage
function updateUI() {
    document.getElementById('balance').textContent = user.balance.toLocaleString();
    document.getElementById('betValue').textContent = game.confirmedBet.toLocaleString();
    document.getElementById('betSideLabel').textContent = game.side ? `ĐANG CƯỢC: ${game.side.toUpperCase()}` : "CHƯA ĐẶT CƯỢC";
    saveToLocal();
    // Hàm cập nhật lịch sử
function addRoadmap(winSide) {
    const historyBoard = document.getElementById('historyBoard');
    
    // Tạo viên kết quả mới
    const dot = document.createElement('div');
    dot.className = `dot dot-${winSide}`;
    
    // Thêm vào khung
    historyBoard.appendChild(dot);

    // Nếu có quá 18 kết quả, xóa kết quả cũ nhất để giữ khung gọn gàng
    if (historyBoard.children.length > 18) {
        historyBoard.removeChild(historyBoard.firstChild);
    }
}

// Lưu ý: Đảm bảo trong hàm processResult() của bạn có gọi addRoadmap(winSide)
function processResult() {
    // ... code xử lý thắng thua cũ ...

    const total = game.dice.reduce((a, b) => a + b, 0);
    const winSide = total >= 11 ? 'tai' : 'xiu';

    // Cập nhật lịch sử vào khung
    addRoadmap(winSide);

    // ... code tự động sang phiên mới ...
}
}
