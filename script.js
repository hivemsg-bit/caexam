// Global Variables
const LOADER = document.getElementById('loader');
const BODY = document.body;
const USER_KEY = 'caexam_user';
const QUIZ_KEY = 'caexam_quiz_history';
const RESOURCES_KEY = 'caexam_saved_resources';

// Sample Data (In production, fetch from API)
const RESOURCES = [
    { id: 1, level: 'Foundation', title: 'Accounting Basics PDF', keyword: 'accounting', desc: 'Intro to principles.', url: '#' },
    { id: 2, level: 'Intermediate', title: 'GST Amendments 2024', keyword: 'gst', desc: 'Latest updates.', url: '#' },
    { id: 3, level: 'Final', title: 'Strategic FM Notes', keyword: 'fm', desc: 'Case studies.', url: '#' },
    // Add 10+ more
];

const QUIZ_QUESTIONS = [
    { q: 'What is the basic accounting equation?', options: ['Assets = Liabilities + Equity', 'Assets = Revenue - Expenses', 'Liabilities = Assets + Equity', 'Equity = Assets - Liabilities'], ans: 0 },
    // Add 9 more questions for CA Foundation (Math, Law, etc.)
    { q: 'Under Indian Contract Act, offer must be?', options: ['Unconditional', 'Conditional', 'Verbal only', 'Written only'], ans: 0 },
    // ... (Total 10)
];

// Init App
document.addEventListener('DOMContentLoaded', () => {
    hideLoader();
    initTheme();
    initNav();
    initAuth();
    initRouting();
    loadPageContent();
    initAnimations();
    registerSW(); // PWA
});

// Hide Loader
function hideLoader() {
    setTimeout(() => {
        LOADER.style.opacity = '0';
        setTimeout(() => LOADER.style.display = 'none', 300);
    }, 1000);
}

// Theme Toggle
function initTheme() {
    const toggle = document.getElementById('dark-toggle');
    const currentTheme = localStorage.getItem('theme') || 'light';
    BODY.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') toggle.innerHTML = '<i class="fas fa-sun"></i>';

    toggle.addEventListener('click', () => {
        const newTheme = BODY.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        BODY.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        toggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    });
}

// Navigation & Mobile Menu
function initNav() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Keyboard support
    hamburger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            hamburger.click();
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

// Authentication System
function initAuth() {
    const modal = document.getElementById('auth-modal');
    const form = document.getElementById('auth-form');
    const title = document.getElementById('modal-title');
    const switchLink = document.getElementById('switch-to-register');
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const isLogin = true;

    // Open Modal
    [loginBtn, ...document.querySelectorAll('.auth-btn')].forEach(btn => {
        if (btn) btn.addEventListener('click', () => openModal(isLogin));
    });

    function openModal(login = true) {
        title.textContent = login ? 'Login' : 'Register';
        document.getElementById('switch-to-register').textContent = login ? 'Register' : 'Login';
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    // Switch Form
    switchLink.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(!isLogin);
    });

    // Close Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        form.reset();
    }

    // Form Submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const isLogin = title.textContent === 'Login';

        if (validateEmail(email) && password.length >= 6) {
            if (isLogin) {
                loginUser(email, password);
            } else {
                registerUser(email, password);
            }
        } else {
            showToast('Invalid email or password too short!', 'error');
        }
    });

    function registerUser(email, password) {
        const user = { email, password, name: email.split('@')[0], joined: new Date().toISOString(), quizzes: [] };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        showToast('Registration successful! Welcome!', 'success');
        closeModal();
        updateUI(user);
    }

    function loginUser(email, password) {
        const user = JSON.parse(localStorage.getItem(USER_KEY));
        if (user && user.email === email && user.password === password) {
            showToast('Login successful!', 'success');
            closeModal();
            updateUI(user);
        } else {
            showToast('Invalid credentials!', 'error');
        }
    }

    function updateUI(user = null) {
        if (user) {
            loginBtn.style.display = 'none';
            userMenu.style.display = 'list-item';
            document.getElementById('user-name') && (document.getElementById('user-name').textContent = user.name);
            loadDashboard(user);
        } else {
            loginBtn.style.display = 'block';
            userMenu.style.display = 'none';
        }
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(QUIZ_KEY);
        showToast('Logged out successfully!', 'success');
        updateUI();
        window.location.href = 'index.html';
    });

    // Check if logged in
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) updateUI(JSON.parse(savedUser));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Routing (SPA-like)
function initRouting() {
    const links = document.querySelectorAll('a[data-page]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            loadPage(page);
            history.pushState({ page }, '', link.href);
        });
    });

    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) loadPage(e.state.page);
    });
}

function loadPage(page) {
    // In full SPA, fetch content dynamically. For now, redirect
    window.location.href = `${page}.html`;
}

// Load Dynamic Content (e.g., Resources, Blog)
function loadPageContent() {
    // Resources on exams.html
    if (document.getElementById('resources-list')) {
        const list = document.getElementById('resources-list');
        RESOURCES.forEach(resource => {
            const card = document.createElement('article');
            card.className = 'level-card animate-slide-up';
            card.innerHTML = `
                <h3>${resource.level}</h3>
                <p>${resource.desc}</p>
                <a href="${resource.url}" class="resource-link">Download</a>
            `;
            list.appendChild(card);
        });
        initSearch();
    }

    // Blog Posts
    if (document.getElementById('blog-posts')) {
        const postsContainer = document.getElementById('blog-posts');
        const samplePosts = [
            { title: 'Top 5 Tips for CA Foundation Math', date: '2023-10-01', excerpt: 'Master equations with these strategies...', content: 'Full post...' },
            // Add 4 more
        ];
        samplePosts.forEach(post => {
            const postEl = document.createElement('article');
            postEl.className = 'blog-post animate-slide-up';
            postEl.innerHTML = `
                <h3>${post.title}</h3>
                <p class="post-date">${post.date}</p>
                <p>${post.excerpt}</p>
                <a href="#">Read More</a>
            `;
            postsContainer.appendChild(postEl);
        });
    }

    // Stats Counters
    if (document.querySelector('.stats')) {
        const counters = document.querySelectorAll('.animate-counter span');
        counters.forEach(counter => {
            const target = parseInt(counter.textContent.replace(/[^0-9]/g, ''));
            const increment = target / 100;
            let current = 0;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target + counter.textContent.replace(/\d+/, '');
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current) + counter.textContent.replace(/\d+/, '');
                }
            }, 20);
        });
    }

    // Newsletter
    if (document.getElementById('newsletter-form')) {
        document.getElementById('newsletter-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.querySelector('input[type="email"]').value;
            if (validateEmail(email)) {
                showToast('Subscribed! Check your email.', 'success');
                e.target.reset();
                // In production: Send to API
            } else {
                showToast('Please enter a valid email!', 'error');
            }
        });
    }

    // Contact Form
    if (document.getElementById('contact-form')) {
        document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            if (validateContact(data)) {
                showToast('Message sent! We\'ll respond within 24 hours.', 'success');
                e.target.reset();
                // In production: EmailJS.send('service_id', 'template_id', data);
            } else {
                showToast('Please fill all fields correctly.', 'error');
            }
        });
    }
}

function validateContact(data) {
    return data['c-name'] && validateEmail(data['c-email']) && data['c-subject'] && data['c-message'];
}

function initSearch() {
    const input = document.getElementById('search-input');
    const btn = document.getElementById('search-btn');
    const cards = document.querySelectorAll('.level-card');

    function search(query) {
        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = text.includes(query.toLowerCase()) ? 'block' : 'none';
        });
    }

    [input, btn].forEach(el => el.addEventListener('input', (e) => search(e.target.value)));
    btn.addEventListener('click', () => search(input.value));
}

// Quiz System
function initQuiz() {
    const modal = document.getElementById('quiz-modal');
    const openBtn = document.getElementById('take-quiz-btn');
    const closeBtn = modal.querySelector('.close');
    const retakeBtn = document.getElementById('retake-quiz');
    const saveBtn = document.getElementById('save-score');
    let currentQ = 0;
    let score = 0;
    let timeLeft = 600; // 10 min
    let timer;

    openBtn.addEventListener('click', () => {
        currentQ = 0;
        score = 0;
        timeLeft = 600;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadQuestion();
        startTimer();
    });

    closeBtn.addEventListener('click', closeQuiz);
    retakeBtn.addEventListener('click', () => {
        currentQ = 0;
        score = 0;
        document.getElementById('quiz-footer').style.display = 'none';
        loadQuestion();
        startTimer();
    });

    saveBtn.addEventListener('click', saveQuizScore);

    function loadQuestion() {
        if (currentQ >= QUIZ_QUESTIONS.length) {
            endQuiz();
            return;
        }
        const q = QUIZ_QUESTIONS[currentQ];
        const body = document.getElementById('quiz-body');
        body.innerHTML = `
            <div class="quiz-question">
                <h3>Q${currentQ + 1}: ${q.q}</h3>
                <form class="quiz-options">
                    ${q.options.map((opt, i) => `
                        <label><input type="radio" name="q${currentQ}" value="${i}"> ${opt}</label>
                    `).join('')}
                </form>
                <button onclick="nextQuestion()" class="cta-button">Next</button>
            </div>
        `;
        document.getElementById('current-q').textContent = currentQ + 1;
    }

    window.nextQuestion = () => {
        const selected = document.querySelector(`input[name="q${currentQ}"]:checked`);
        if (selected && parseInt(selected.value) === QUIZ_QUESTIONS[currentQ].ans) score++;
        currentQ++;
        loadQuestion();
    };

    function startTimer() {
        timer = setInterval(() => {
            timeLeft--;
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            document.getElementById('timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            if (timeLeft <= 0) endQuiz();
        }, 1000);
    }

    function endQuiz() {
        clearInterval(timer);
        document.getElementById('quiz-body').style.display = 'none';
        document.getElementById('quiz-footer').style.display = 'block';
        document.getElementById('quiz-score').textContent = score;
        document.getElementById('quiz-body').innerHTML = ''; // Hide questions
    }

    function closeQuiz() {
        clearInterval(timer);
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function saveQuizScore() {
        const user = JSON.parse(localStorage.getItem(USER_KEY));
        if (user) {
            user.quizzes.push({ date: new Date().toISOString(), score });
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            showToast('Score saved to dashboard!', 'success');
            loadDashboard(user);
            closeQuiz();
        } else {
            showToast('Login to save scores!', 'error');
        }
    }
}

// If on exams page, init quiz
if (document.getElementById('quiz-modal')) initQuiz();

// Dashboard Load
function loadDashboard(user) {
    if (document.getElementById('quiz-history')) {
        const historyList = document.getElementById('quiz-history');
        historyList.innerHTML = user.quizzes.map(q => `<li>${new Date(q.date).toLocaleDateString()}: ${q.score}/10</li>`).join('') || '<li>No quizzes taken yet.</li>';
    }

    if (document.getElementById('saved-resources')) {
        const savedList = document.getElementById('saved-resources');
        const saved = JSON.parse(localStorage.getItem(RESOURCES_KEY)) || [];
        savedList.innerHTML = saved.map(r => `<li>${r.title} <button onclick="removeSaved(${r.id})">Remove</button></li>`).join('') || '<li>No saved resources.</li>';
    }

    // Simple Canvas Chart for Progress
    if (document.getElementById('progress-chart')) {
        const ctx = document.getElementById('progress-chart').getContext('2d');
        // Basic bar chart (use Chart.js in production)
        ctx.fillStyle = '#00d4aa';
        ctx.fillRect(10, 200 - (user.quizzes.reduce((a, b) => a + b.score, 0) / user.quizzes.length * 20 || 0), 50, user.quizzes.length * 20 || 100);
    }
}

window.removeSaved = (id) => {
    // Implement remove from localStorage
    showToast('Removed!', 'info');
};

// Animations Observer
function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-slide-up, .animate-fade-in').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        observer.observe(el);
    });
}

// Toast Notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 1rem 2rem; border-radius: 8px;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
        color: white; z-index: 3000; transform: translateX(100%); transition: transform 0.3s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// PWA Service Worker
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').then(reg => {
            console.log('SW registered', reg);
        }).catch(err => console.log('SW failed', err));
    }
}

// Save Resource (e.g., on click in resources)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('resource-link')) {
        const user = localStorage.getItem(USER_KEY);
        if (user) {
            // Find resource by closest card, save to localStorage
            const resourceId = 1; // Demo
            let saved = JSON.parse(localStorage.getItem(RESOURCES_KEY)) || [];
            if (!saved.find(r => r.id === resourceId)) {
                saved.push(RESOURCES.find(r => r.id === resourceId));
                localStorage.setItem(RESOURCES_KEY, JSON.stringify(saved));
                showToast('Saved to dashboard!', 'success');
            }
        } else {
            showToast('Login to save!', 'info');
        }
    }
});
