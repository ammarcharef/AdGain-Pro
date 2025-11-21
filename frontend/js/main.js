const API_URL = 'http://localhost:5000/api'; // غير هذا الرابط عند الرفع

function showAlert(msg, type = 'error') {
    const el = document.getElementById('alertMsg');
    if (el) {
        el.textContent = msg;
        el.className = `alert alert-${type}`;
        el.style.display = 'block';
    }
}

function getToken() {
    return localStorage.getItem('token');
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// تسجيل
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html';
            } else {
                showAlert(data.msg);
            }
        } catch (err) {
            showAlert('خطأ في الاتصال بالخادم');
        }
    });
}

// دخول
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // انتبه: هنا يجب استخدام loginForm وليس registerForm
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html';
            } else {
                // في حالة index.html لا يوجد عنصر alertMsg افتراضياً في الكود السابق
                // يفضل إضافته في HTML أو استخدام alert بسيط للتجربة
                alert(data.msg); 
            }
        } catch (err) {
            alert('خطأ في الاتصال');
        }
    });
}

// جلب البيانات
async function fetchProfile() {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': token }
        });
        if (res.ok) {
            const user = await res.json();
            document.getElementById('userWelcome').textContent = `مرحباً، ${user.username}`;
            document.getElementById('balanceDisplay').textContent = user.balance.toFixed(2);
        } else {
            logout();
        }
    } catch (err) {
        console.error(err);
    }
}

// دالة جلب المهام
async function fetchTasks() {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/earn/tasks`, {
            headers: { 'Authorization': token }
        });
        const tasks = await res.json();
        renderTasks(tasks);
    } catch (err) {
        console.error('فشل جلب المهام', err);
    }
}

// دالة عرض المهام في HTML
function renderTasks(tasks) {
    const container = document.querySelector('.card h3').parentNode; // نحدد الكارد الموجود في Dashboard
    
    // تنظيف المحتوى القديم (إزالة نص "قريباً")
    const oldContent = container.querySelector('p');
    if(oldContent) oldContent.remove();
    
    // إنشاء حاوية للمهام
    let tasksList = document.getElementById('tasksList');
    if (!tasksList) {
        tasksList = document.createElement('div');
        tasksList.id = 'tasksList';
        tasksList.className = 'tasks-grid';
        container.appendChild(tasksList);
    }
    tasksList.innerHTML = ''; // مسح لتجنب التكرار

    if (tasks.length === 0) {
        tasksList.innerHTML = '<p>لا توجد مهام متاحة حالياً.</p>';
        return;
    }

    tasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = 'task-item';
        taskEl.innerHTML = `
            <div class="task-icon">${getIcon(task.type)}</div>
            <div class="task-details">
                <h4>${task.title}</h4>
                <small>${task.description}</small>
            </div>
            <div class="task-action">
                <span class="reward-badge">+${task.reward} د.ج</span>
                <button onclick="claimTask('${task._id}', '${task.link}')" class="btn-sm">نفذ</button>
            </div>
        `;
        tasksList.appendChild(taskEl);
    });
}

// دالة مساعدة للأيقونات
function getIcon(type) {
    if (type === 'video') return '📺';
    if (type === 'survey') return '📝';
    return '📢'; // default ad
}

// دالة تنفيذ المهمة والمطالبة بالربح
async function claimTask(id, link) {
    // 1. فتح الرابط في نافذة جديدة
    window.open(link, '_blank');

    // 2. طلب المكافأة من السيرفر
    const token = getToken();
    try {
        const res = await fetch(`${API_URL}/earn/claim/${id}`, {
            method: 'POST',
            headers: { 'Authorization': token }
        });
        const data = await res.json();

        if (res.ok) {
            alert(`🎉 ${data.msg}! رصيدك الجديد: ${data.newBalance}`);
            // تحديث الرصيد في الشاشة
            document.getElementById('balanceDisplay').textContent = data.newBalance.toFixed(2);
        } else {
            alert('خطأ: ' + data.msg);
        }
    } catch (err) {
        alert('حدث خطأ في الاتصال');
    }
}

// تحديث مستمع التحميل ليشمل جلب المهام
document.addEventListener('DOMContentLoaded', () => {
    if(!getToken() && window.location.pathname.includes('dashboard')) {
        window.location.href = 'index.html';
    }
    
    if (window.location.pathname.includes('dashboard')) {
        fetchProfile();
        fetchTasks(); // <-- استدعاء جديد
    }
});

// كشف الدوال للـ HTML
window.logout = logout;
window.claimTask = claimTask;