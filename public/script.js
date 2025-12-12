const BASE = '/M00867462';

function show(id, text) { document.getElementById(id).innerText = text || ''; }

async function safeFetch(url, opts={}) {
    try {
        const res = await fetch(url, opts);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) return { ok: res.ok, data: await res.json() };
        else return { ok: res.ok, data: await res.text() };
    } catch(e){ console.error(e); return {ok:false, error:e}; }
}

// --- Auth ---
async function register() {
    let username = document.getElementById('reg-username').value.trim(); // trim whitespace
    let password = document.getElementById('reg-password').value.trim(); // optional trim
    show('reg-message', '...');
    if(!username || !password) return show('reg-message', 'Username and password required');

    const r = await safeFetch(BASE + '/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = r.data;
    show('reg-message', data.success ? 'Registered!' : (data.message || 'Registration failed'));
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-password').value = '';
}

async function login() {
    let username = document.getElementById('login-username').value.trim();
    let password = document.getElementById('login-password').value.trim();
    show('login-message', '...');
    if(!username || !password) return show('login-message', 'Username and password required');

    const r = await safeFetch(BASE + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = r.data;
    if (data.success) {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('social-section').style.display = 'block';
        document.getElementById('menu-btn').style.display = 'inline-block';
        document.getElementById('profile-btn').style.display = 'inline-block';
        loadFeed();
    } else show('login-message', data.message || 'Login failed');
}

async function logout() {
    await safeFetch(BASE+'/login',{method:'DELETE'});
    location.reload();
}


// --- Posts ---
let uploadedImagePath=null;
async function postContent(){
    const text = document.getElementById('post-text').value;
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    let filePath='';
    if(file){
        const fd = new FormData(); fd.append('file',file);
        const res = await fetch(BASE+'/upload',{method:'POST', body:fd});
        const data = await res.json();
        if(!data.success) return alert('Upload failed');
        filePath = data.path;
    }
    const r = await fetch(BASE+'/contents',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text,filePath})});
    const data = await r.json();
    if(data.success){ document.getElementById('post-text').value=''; if(fileInput) fileInput.value=''; loadFeed(); loadMyPosts(); }
    else alert('Post failed');
}

// --- Feed ---
async function loadFeed(){
    const r = await safeFetch(BASE+'/feed');
    renderPosts('feed', r.data || []);
}


function renderPosts(listId, posts){
    const list = document.getElementById(listId);
    list.innerHTML='';
    posts.forEach(p=>{
        const li = document.createElement('li');
        li.className = 'post';
        li.textContent = p.text + ' — ' + (p.timestamp?new Date(p.timestamp).toLocaleString():'');
        if(p.filePath){
            const img = document.createElement('img'); img.src=p.filePath; li.appendChild(img);
        }
        list.appendChild(li);
    });
}

// --- Toggle Feed / My Posts ---
function showFeed(which){
    document.getElementById('feed').style.display = (which==='feed')?'block':'none';
}

// --- Search ---
async function searchAll() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return alert('Enter something to search');

    // --- Search Users ---
    const usersRes = await safeFetch(BASE + '/users?q=' + encodeURIComponent(query));
    const userList = document.getElementById('search-users-results');
    userList.innerHTML = '';
    (usersRes.data || []).forEach(u => {
        const li = document.createElement('li');
        li.textContent = u.username + ' ';
        const btn = document.createElement('button');
        btn.textContent = 'Follow';
        btn.onclick = () => followUser(u._id);
        li.appendChild(btn);

        li.style.cursor = 'pointer';
        li.onclick = (e) => { 
            if(e.target.tagName!=='BUTTON') showUserProfile(u._id); 
        };

        userList.appendChild(li);
    });

    // --- Search Posts ---
    const postsRes = await safeFetch(BASE + '/contents?q=' + encodeURIComponent(query));
    const postList = document.getElementById('search-posts-results');
    postList.innerHTML = '';
    (postsRes.data || []).forEach(p => {
        const li = document.createElement('li');
        li.textContent = (p.text || '') + ' — ' + (p.timestamp ? new Date(p.timestamp).toLocaleString() : '');
        if (p.filePath) {
            const img = document.createElement('img');
            img.src = p.filePath;
            img.style.maxWidth = '200px';
            img.style.display = 'block';
            li.appendChild(img);
        }
        postList.appendChild(li);
    });
}


// --- Follow ---
async function followUser(id){
    const r = await safeFetch(BASE+'/follow',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({followingId:id})});
    if(r.ok && r.data?.success) alert('Followed!'); else alert('Failed');
}

// --- Show User Profile ---
async function showUserProfile(userId) {
    const loginRes = await safeFetch(BASE+'/login');
    if(!loginRes.data.loggedIn) return alert('Not logged in');

    const usersRes = await safeFetch(BASE+'/users?q=');
    const user = (usersRes.data||[]).find(u=>u._id===userId);
    if(!user) return alert('User not found');

    document.getElementById('profile-username').innerText = user.username;

    // Followers & following
    const followersRes = await safeFetch(BASE+'/followers?userId='+userId);
    const followingRes = await safeFetch(BASE+'/following?userId='+userId);
    document.getElementById('profile-followers').innerText = followersRes.data?.length || 0;
    document.getElementById('profile-following').innerText = followingRes.data?.length || 0;

    // Posts
    const postsRes = await safeFetch(BASE+'/contents');
    const posts = (postsRes.data||[]).filter(p=>p.userId===userId);
    renderPosts('profile-posts', posts);

    // Layout adjustments
    document.getElementById('social-section').style.display='none';
    document.getElementById('profile-section').style.display='block';
}

// Back to feed
function backToFeed() {
    document.getElementById('profile-section').style.display='none';
    document.getElementById('social-section').style.display='block';
}

async function showMyProfile() {
    const r = await safeFetch(BASE+'/login');
    if(!r.data.loggedIn) return alert('Not logged in');
    showUserProfile(r.data.userId);
}

// --- Close Profile ---
function closeProfile(){ document.getElementById('profile-section').style.display='none'; }

// --- Weather ---
async function loadWeather() {
    const weatherDiv = document.getElementById('weather');
    const API_KEY = '6dbe65b363293273fb85b44a87b1daad'; 
    const CITY = 'London';

    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`);
        if (!res.ok) throw new Error('Weather fetch failed');

        const data = await res.json();
        const icon = data.weather[0].icon;
        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].main;

        weatherDiv.innerHTML = `<img src="https://openweathermap.org/img/wn/${icon}.png" alt="weather"> ${temp}°C ${desc}`;
    } catch (err) {
        console.error(err);
        weatherDiv.innerText = 'Weather unavailable';
    }
}

// Call weather after login to avoid CORS issues in preview
window.addEventListener('load', () => {
    loadWeather();
});


// --- Toggle ---
function togglePost(){
    const section = document.getElementById('post-section');
    section.style.display = section.style.display==='none'?'block':'none';
}

function toggleSearch(){
    const section = document.getElementById('search-section');
    section.style.display = section.style.display==='none'?'block':'none';
}

function toggleMenu() {
    const menu = document.getElementById('side-menu');
    menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
}

