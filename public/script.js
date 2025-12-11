const BASE = '/M00867462';

function show(id, text) {
    document.getElementById(id).innerText = text || '';
}

async function safeFetch(url, opts = {}) {
    try {
        const res = await fetch(url, opts);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await res.json();
            return { ok: res.ok, data };
        } else {
            const text = await res.text();
            return { ok: res.ok, data: text };
        }
    } catch (err) {
        console.error('Network error for', url, err);
        return { ok: false, error: err };
    }
}

async function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    show('reg-message', '...');

    const r = await safeFetch(BASE + '/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!r.ok) {
        show('reg-message', 'Network/server error. Check console.');
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-password').value = '';
        return;
    }
    const data = r.data;
    console.log('register response', data);
    show('reg-message', data.success ? 'Registered!' : (data.message || 'Registration failed'));
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    show('login-message', '...');

    const r = await safeFetch(BASE + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (!r.ok) {
        show('login-message', 'Network/server error. Check console.');
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-password').value = '';
        return;
    }
    const data = r.data;
    console.log('login response', data);
    if (data.success) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('social-section').style.display = 'block';
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-password').value = '';
        loadFeed();
    } else {
        show('login-message', data.message || 'Login failed');
        document.getElementById('reg-username').value = '';
        document.getElementById('reg-password').value = '';
    }
}

async function logout() {
    await safeFetch(BASE + '/login', { method: 'DELETE' });
    location.reload();
}

let uploadedImagePath = null; // store after upload

async function postContent() {
    const text = document.getElementById('post-text').value;
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    let filePath = '';

    // Upload image first if selected
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(BASE + '/upload', {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadRes.json();

        if (!uploadData.success) {
            return alert('File upload failed: ' + (uploadData.message || 'unknown error'));
        }
        filePath = uploadData.path; // save uploaded path
    }

    // Create the post with optional image
    const r = await fetch(BASE + '/contents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, filePath })
    });
    const data = await r.json();

    if (data.success) {
        document.getElementById('post-text').value = '';
        if (fileInput) fileInput.value = '';
        loadFeed();
    } else {
        alert('Post failed: ' + (data.message || 'unknown error'));
    }
}

async function loadFeed() {
    const r = await safeFetch(BASE + '/feed');
    if (!r.ok) { console.error('feed error', r); return; }
    const feed = r.data || [];
    const list = document.getElementById('feed');
    list.innerHTML = '';
    feed.forEach(post => {
        const li = document.createElement('li');

        li.textContent = (post.text || '') + ' — ' + (post.timestamp ? new Date(post.timestamp).toLocaleString() : '');

        // if there is an image, display it
        if (post.filePath) {
            const img = document.createElement('img');
            img.src = post.filePath;
            img.style.maxWidth = '200px';
            img.style.display = 'block';
            li.appendChild(img);
        }

        list.appendChild(li);
    });
}

async function searchUsers() {
    const query = document.getElementById('search-user').value;
    const r = await safeFetch(BASE + '/users?q=' + encodeURIComponent(query));
    if (!r.ok) { alert('Search failed'); return; }
    const users = r.data || [];
    const list = document.getElementById('user-results');
    list.innerHTML = '';
    users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u.username + ' ';
        const btn = document.createElement('button');
        btn.textContent = 'Follow';
        btn.onclick = () => followUser(u._id);
        li.appendChild(btn);
        list.appendChild(li);
    });
}

async function followUser(id) {
    const r = await safeFetch(BASE + '/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: id })
    });
    console.log('follow response', r);
    if (r.ok && r.data && r.data.success) {
        alert('Followed!');
        loadFeed();
    } else {
        alert('Follow failed. Check console.');
    }
}
