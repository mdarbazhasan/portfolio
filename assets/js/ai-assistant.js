// Simple client-side AI-like helpers: summarize, keywords, polish
(function(){
    function $(sel){ return document.querySelector(sel) }
    const aiToggle = $('#aiToggle');
    const aiPanel = $('#aiPanel');
    const aiClose = $('#aiClose');
    const aiInput = $('#aiInput');
    const aiResult = $('#aiResult');
    const btnSummarize = $('#btnSummarize');
    const btnKeywords = $('#btnKeywords');
    const btnPolish = $('#btnPolish');
    const btnClear = $('#btnClear');
    const btnChatGPT = $('#btnChatGPT');
    const aiSendBtn = $('#aiSend');
    const aiApiKeyInput = $('#aiApiKey');
    const aiSaveKey = $('#aiSaveKey');
    const aiModelSelect = $('#aiModel');
    const aiSaveKeyBtn = $('#aiSaveKeyBtn');
    const aiToggleKey = $('#aiToggleKey');
    const aiKeyStatus = $('#aiKeyStatus');

    if(!aiToggle || !aiPanel) return;

    function openPanel(){
        aiPanel.style.display = 'flex';
        aiPanel.setAttribute('aria-hidden','false');
        aiToggle.setAttribute('aria-expanded','true');
        aiInput.focus();
    }
    function closePanel(){
        aiPanel.style.display = 'none';
        aiPanel.setAttribute('aria-hidden','true');
        aiToggle.setAttribute('aria-expanded','false');
        aiToggle.focus();
    }

    aiToggle.addEventListener('click', ()=>{
        if(aiPanel.style.display === 'none' || aiPanel.style.display === '') openPanel();
        else closePanel();
    });
    aiClose.addEventListener('click', closePanel);

    // Load saved API key if present
    try{
        const saved = localStorage.getItem('ai_openai_key');
        if(saved && aiApiKeyInput) aiApiKeyInput.value = saved;
        if(saved && aiSaveKey) aiSaveKey.checked = true;
    }catch(e){ /* ignore localStorage errors */ }

    // Toggle visibility of API key
    if(aiToggleKey && aiApiKeyInput){
        aiToggleKey.addEventListener('click', ()=>{
            if(aiApiKeyInput.type === 'password'){
                aiApiKeyInput.type = 'text'; aiToggleKey.textContent = 'Hide';
            } else { aiApiKeyInput.type = 'password'; aiToggleKey.textContent = 'Show'; }
            aiApiKeyInput.focus();
        });
    }

    // Immediate save button: stores key to localStorage (with warning) and shows status
    if(aiSaveKeyBtn && aiApiKeyInput){
        aiSaveKeyBtn.addEventListener('click', ()=>{
            const k = aiApiKeyInput.value.trim();
            if(!k){ showStatus('Paste a valid API key first.', true); return; }
            try{
                localStorage.setItem('ai_openai_key', k);
                if(aiSaveKey) aiSaveKey.checked = true;
                showStatus('API key saved to this browser.');
            }catch(e){ showStatus('Could not save key locally (storage error).', true); }
        });
    }

    function showStatus(msg, isError){
        if(!aiKeyStatus) return;
        aiKeyStatus.textContent = msg;
        aiKeyStatus.style.color = isError ? 'rgba(255,140,140,0.95)' : 'rgba(180,230,200,0.95)';
        setTimeout(()=>{ if(aiKeyStatus) aiKeyStatus.textContent = ''; }, 4000);
    }

    // Summarize: naive first-2-sentences or trim to ~40 words
    function summarize(text){
        if(!text) return 'Paste some text to summarize.';
        // split into sentences
        const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
        if(sentences.length<=2) return text.trim();
        const out = sentences.slice(0,2).join(' ').trim();
        if(out.split(' ').length>60) return out.split(' ').slice(0,60).join(' ') + '...';
        return out;
    }

    // Extract keywords: basic frequency excluding stopwords
    function keywords(text, limit=8){
        if(!text) return 'Paste text to extract keywords.';
        const stop = new Set(['the','and','a','an','to','of','in','for','on','with','is','are','was','were','be','by','that','this','it','as','at','from','or','which','will','you','your','i','my','have','has','had']);
        const words = text.toLowerCase().replace(/[\u2018\u2019\u201c\u201d]/g,'').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
        const freq = {};
        words.forEach(w=>{ if(!stop.has(w) && w.length>2){ freq[w]=(freq[w]||0)+1 } });
        const items = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(x=>x[0]);
        if(items.length===0) return 'No clear keywords found (try longer input).';
        return items.join(', ');
    }

    // Polish: basic capitalization and spacing fixes
    function polish(text){
        if(!text) return 'Paste text to polish.';
        // fix stray spaces
        let s = text.replace(/\s+/g,' ').trim();
        // capitalize after sentence endings
        s = s.replace(/(?:^|[\.\!\?]\s+)([a-z])/g, function(m,p1){ return m.slice(0,-1) + p1.toUpperCase(); });
        // capitalize first char
        s = s.charAt(0).toUpperCase() + s.slice(1);
        // simple I fix
        s = s.replace(/\si\s/g,' I ');
        // common contractions fix (basic)
        s = s.replace(/\bim\b/gi, "I'm");
        return s;
    }

    // Chat rendering: maintain a simple message list and render into #aiChat
    const aiChat = $('#aiChat');
    let messages = [];

    function saveHistory(){
        try{ sessionStorage.setItem('ai_chat_history', JSON.stringify(messages)); }catch(e){}
    }
    function loadHistory(){
        try{ const s = sessionStorage.getItem('ai_chat_history'); if(s) messages = JSON.parse(s); }catch(e){}
    }

    function scrollChatToBottom(){
        if(!aiChat) return;
        requestAnimationFrame(()=>{ aiChat.scrollTop = aiChat.scrollHeight; });
    }

    function renderMessages(){
        if(!aiChat) return;
        aiChat.innerHTML = messages.map(m=>{
            if(m.role === 'user'){
                return `<div class="ai-msg user"><div class="content">${escapeHtml(m.text)}</div><span class="meta">You</span></div>`;
            }else{
                const typingClass = m.typing ? ' typing' : '';
                const dots = m.typing ? `<span class="ai-typing-dot"></span><span class="ai-typing-dot" style="animation-delay:.15s"></span><span class="ai-typing-dot" style="animation-delay:.3s"></span>` : '';
                const content = m.typing ? dots : `<div class="content">${escapeHtml(m.text)}</div>`;
                return `<div class="ai-msg assistant${typingClass}">${content}<span class="meta">Assistant</span></div>`;
            }
        }).join('');
        scrollChatToBottom();
    }

    function escapeHtml(str){
        if(!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>');
    }

    function addMessage(role, text, opts){
        const msg = { role: role, text: text || '', ts: Date.now() };
        if(opts && opts.typing) msg.typing = true;
        messages.push(msg);
        saveHistory();
        renderMessages();
        return messages.length-1; // index
    }

    // Initialize chat from session
    loadHistory(); renderMessages();

    btnSummarize.addEventListener('click', ()=>{
        const out = summarize(aiInput.value);
        addMessage('assistant', out);
    });
    btnKeywords.addEventListener('click', ()=>{
        const out = keywords(aiInput.value);
        addMessage('assistant', out);
    });
    btnPolish.addEventListener('click', ()=>{
        const out = polish(aiInput.value);
        addMessage('assistant', out);
    });
    btnClear.addEventListener('click', ()=>{
        aiInput.value=''; aiChat.innerHTML=''; messages = []; try{ sessionStorage.removeItem('ai_chat_history') }catch(e){}; aiInput.focus();
    });

    // ChatGPT integration (calls OpenAI from client using user's key)
    async function getSavedKey(){
        if(!aiApiKeyInput) return '';
        const val = aiApiKeyInput.value.trim();
        if(val) return val;
        try{ return localStorage.getItem('ai_openai_key') || ''; }catch(e){ return ''; }
    }

    async function callChatGPT(prompt){
        const key = await getSavedKey();
        if(!key) return { error: 'No API key found. Paste your OpenAI API key in ChatGPT settings.' };
        const model = (aiModelSelect && aiModelSelect.value) || 'gpt-3.5-turbo';
        const body = {
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            max_tokens: 800
        };

        try{
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + key
                },
                body: JSON.stringify(body)
            });
            if(!res.ok){
                const txt = await res.text();
                return { error: `OpenAI error: ${res.status} ${res.statusText} - ${txt}` };
            }
            const data = await res.json();
            const content = data?.choices?.[0]?.message?.content;
            if(!content) return { error: 'No content returned from OpenAI.' };
            return { content };
        }catch(err){
            return { error: String(err) };
        }
    }

    if(btnChatGPT){
        btnChatGPT.addEventListener('click', async ()=>{
            const prompt = aiInput.value.trim();
            if(!prompt){ showResult('Paste text or write a prompt to send to ChatGPT.'); return; }
            // append user message to chat
            addMessage('user', prompt);
            // show inline loader and typing assistant bubble
            const loader = document.getElementById('aiLoader');
            if(loader){ loader.classList.add('spin'); loader.setAttribute('aria-hidden','false') }
            [btnSummarize, btnKeywords, btnPolish, btnClear, btnChatGPT, aiSendBtn].forEach(b=>b && (b.disabled = true));
            // optionally save key
            try{ if(aiSaveKey && aiSaveKey.checked && aiApiKeyInput && aiApiKeyInput.value.trim()){ localStorage.setItem('ai_openai_key', aiApiKeyInput.value.trim()); } }
            catch(e){}
            // add a typing placeholder message and keep its index
            const typingIndex = addMessage('assistant', '', { typing: true });
            const r = await callChatGPT(prompt);
            if(loader){ loader.classList.remove('spin'); loader.setAttribute('aria-hidden','true') }
            [btnSummarize, btnKeywords, btnPolish, btnClear, btnChatGPT, aiSendBtn].forEach(b=>b && (b.disabled = false));
            if(r.error){
                // replace typing message with error text
                messages[typingIndex].typing = false; messages[typingIndex].text = 'Error: ' + r.error;
                saveHistory(); renderMessages();
            } else {
                messages[typingIndex].typing = false; messages[typingIndex].text = r.content;
                saveHistory(); renderMessages();
            }
        });
    }

    // Wire floating/send button to the same ChatGPT action
    if(aiSendBtn){
        aiSendBtn.addEventListener('click', async (e)=>{
            e.preventDefault();
            // visual feedback: briefly scale
            aiSendBtn.style.transform = 'scale(0.98)';
            setTimeout(()=> aiSendBtn.style.transform = '', 120);
            if(btnChatGPT) btnChatGPT.click();
        });
    }

    // Enter = send (unless Shift), Shift+Enter = newline. Ctrl/Cmd+Enter keeps Summarize as a quick helper.
    aiInput.addEventListener('keydown', (e)=>{
        if(e.key === 'Enter' && !e.shiftKey){
            e.preventDefault();
            // trigger send
            if(btnChatGPT) btnChatGPT.click();
            return;
        }
        if((e.ctrlKey||e.metaKey) && e.key === 'Enter'){
            showResult(summarize(aiInput.value));
        }
    });

    // Close panel on Escape
    document.addEventListener('keydown',(e)=>{
        if(e.key==='Escape' && aiPanel.style.display!=='none') closePanel();
    });

    // Simple accessibility: trap focus when panel open (small trap)
    aiPanel.addEventListener('keydown',(e)=>{
        if(e.key==='Tab'){
            // allow normal tabbing inside small panel; don't trap for now
        }
    });

    // Expose simple API to window for debugging
    window.__aiAssistant = { summarize, keywords, polish };
})();
