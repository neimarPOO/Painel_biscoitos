import { supabase } from './supabase-client.js';
import { fetchAndPopulateAppData, appData } from './data.js';
// Removed circular dependency import

export let currentUser = null;

export async function initAuth(renderCallback) {
    if (!supabase) {
        console.warn("Auth disabled: Supabase client not initialized.");
        setupAuthEventListeners(); // Still setup listeners to show error on click
        renderCallback(); // Render app with local data
        return;
    }

    // 1. Check active session
    const { data: { session } } = await supabase.auth.getSession();
    currentUser = session?.user || null;
    updateAuthUI();

    // 2. Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
        currentUser = session?.user || null;
        updateAuthUI();
        
        if (currentUser) {
            // Load user data if logged in
            await fetchAndPopulateAppData(renderCallback);
        } else {
            // If logged out, maybe reset to default local data or keep current?
            // Usually, logout means clearing sensitive data.
            // For now, let's just re-render what we have (which might be stale or default).
            renderCallback();
        }
    });

    setupAuthEventListeners();
}

function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');

    if (currentUser) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        userEmail.innerText = currentUser.email;
    } else {
        loginBtn.style.display = 'inline-flex';
        userInfo.style.display = 'none';
        userEmail.innerText = '';
    }
}

function setupAuthEventListeners() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const authDialog = document.getElementById('auth-dialog');
    const authSwitchMode = document.getElementById('auth-switch-mode');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const authError = document.getElementById('auth-error');

    let isLoginMode = true;

    loginBtn.addEventListener('click', () => {
        if (!supabase) {
            alert("Erro: Configuração do Supabase ausente. Verifique o console.");
            return;
        }
        isLoginMode = true;
        updateDialogMode();
        authDialog.show();
    });

    logoutBtn.addEventListener('click', async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        window.location.reload(); // Simple way to reset state
    });

    authSwitchMode.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        updateDialogMode();
    });

    function updateDialogMode() {
        const title = document.getElementById('auth-title');
        if (isLoginMode) {
            title.innerText = 'Login';
            authSubmitBtn.innerText = 'Entrar';
            authSwitchMode.innerText = 'Criar conta';
        } else {
            title.innerText = 'Criar Conta';
            authSubmitBtn.innerText = 'Cadastrar';
            authSwitchMode.innerText = 'Já tenho conta';
        }
        authError.style.display = 'none';
    }

    authSubmitBtn.addEventListener('click', async () => {
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        if (!email || !password) {
            showError("Preencha todos os campos.");
            return;
        }

        authSubmitBtn.disabled = true;
        authError.style.display = 'none';

        try {
            let error;
            if (isLoginMode) {
                const res = await supabase.auth.signInWithPassword({ email, password });
                error = res.error;
            } else {
                const res = await supabase.auth.signUp({ email, password });
                error = res.error;
                if (!error && res.data.user && !res.data.session) {
                    showError("Verifique seu email para confirmar o cadastro.");
                    authSubmitBtn.disabled = false;
                    return;
                }
            }

            if (error) throw error;
            authDialog.close();

        } catch (err) {
            showError(err.message || "Erro na autenticação.");
        } finally {
            authSubmitBtn.disabled = false;
        }
    });

    function showError(msg) {
        authError.innerText = msg;
        authError.style.display = 'block';
    }
}
