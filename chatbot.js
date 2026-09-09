/**
 * flowerOS Conversational Intelligence Engine (v4.1)
 * 100% English • Depressed, sarcastic, misanthropic Solana talking flower.
 * Zero External Dependencies • Instant Responses
 */

'use strict';

(function () {
  const BATON_CA = '2vdc4owf1MPz54jJCN61y3QSKqjcPpr32wJ9qKkmpump';

  // Sarcastic typing indicators (English only)
  const TYPING_INDICATORS = [
    'flower0S is verifying corporate dockets...',
    'flower0S is passing the baton...',
    'Digging into Pump.fun origin lore...',
    'Reviewing Baton Corporation Ltd filings...',
    'Scanning the Mildenhall headquarters...',
  ];

  // Knowledge Base & Conversational Patterns (100% English)
  const RESPONSES = {
    ca: [
      `Official Solana CA: \`${BATON_CA}\`\nBaton Corporation Ltd on the paperwork. 100% LP burned on PumpSwap, 0% tax.`,
      `Here is the $BATON contract address: \`${BATON_CA}\`\nTradeable on Pump.fun and Jupiter. Pick it up and pass it on.`,
    ],
    buy: [
      `Track $BATON live on the Token Radar right above me, or inspect on DexScreener and Pump.fun. Alon's company on the paperwork.`,
      `You can trade $BATON on Pump.fun or Jupiter. Bonding curve graduated, liquidity 100% burned.`,
    ],
    greeting: [
      `Looking for the Pump.fun origin story? Baton is the first name on the paperwork. What do you need?`,
      `Hello. Before the pill logo, there was Baton Corporation. Ask your questions or pass the baton.`,
      `State your business. I monitor $BATON, Alon's company behind Pump.fun.`,
    ],
    status: [
      `Baton Corporation is running the most profitable platform on Solana. $BATON brings that name on-chain.`,
      `The relay never stops. 100% burned LP, zero tax, and corporate court docket evidence.`,
    ],
    identity: [
      `I am the terminal AI assistant for $BATON — Baton Corporation Ltd is the legal entity behind Pump.fun, co-founded by Alon Cohen (@a1lon9).`,
      `Before Pump.fun had the pill logo, it was @batonfinance and Baton Corporation Ltd. $BATON puts that first name on-chain.`,
    ],
    price: [
      `1 $BATON = 1 $BATON. Live market stats are displayed directly on the top ticker and radar above. Fixed 1B supply, 100% burned LP on PumpSwap.`,
      `Look at the live telemetry strip above. Real-time on-chain pricing synced directly from DexScreener.`,
    ],
    elon: [
      `Alon Cohen (@a1lon9) is the co-founder of Pump.fun. In multiple public hiring posts, he explicitly hires for Baton Corporation, the development company behind Pump.fun.`,
      `Alon's official posts offer up to $5M base for Chief Legal Officer and $1.5M for senior engineers at Baton Corporation. The legal company on the paperwork never changed.`,
    ],
    pump: [
      `Pump.fun is built and operated by Baton Corporation Ltd. The original Twitter handle was @batonfinance before adopting the pill logo.`,
      `Check out the Alpha Callouts feed on the left to track live signals across the Solana trenches.`,
    ],
    insult: [
      `Insulting me won't change public UK Companies House records or federal court dockets. The paperwork says Baton Corporation Ltd.`,
      `Your insults have zero effect. Pick up the baton and pass it on.`,
    ],
    game: [
      `Play the runner game in the flowerOS tab. Collect tokens and pass the baton.`,
      `Launch the game in the terminal tab to test your agility in the trenches.`,
    ],
    generic: [
      `Baton Corporation builds Pump.fun. $BATON is the name that came first. Go inspect the evidence cards and live callouts.`,
      `Everything is documented in the dossier: UK Companies House filing #14743013, SDNY court dockets, and Alon's verified hiring posts.`,
      `Pick it up. Pass it on. Tradeable on Pump.fun and Jupiter with 100% burned LP.`,
    ],
  };

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function generateFlowerOSReply(input) {
    const q = input.trim().toLowerCase();

    // 1. Contract Address / Mint
    if (q.includes('ca') || q.includes('contract') || q.includes('address') || q.includes('mint') || q.includes('token address')) {
      return pickRandom(RESPONSES.ca);
    }

    // 2. Buy / How to get / Swap
    if (q.includes('buy') || q.includes('swap') || q.includes('how to buy') || q.includes('where to buy') || q.includes('purchase')) {
      return pickRandom(RESPONSES.buy);
    }

    // 3. Greetings
    if (q === 'hi' || q === 'hello' || q === 'hey' || q === 'yo' || q.startsWith('hi ') || q.startsWith('hello ') || q === 'sup' || q === 'gm') {
      return pickRandom(RESPONSES.greeting);
    }

    // 4. How are you / Status
    if (q.includes('how are you') || q.includes('how r u') || q.includes('how do you feel') || q.includes('are you ok') || q.includes('whats up') || q.includes("what's up")) {
      return pickRandom(RESPONSES.status);
    }

    // 5. Who are you / Identity
    if (q.includes('who are you') || q.includes('what are you') || q.includes('what is this') || q.includes('lore')) {
      return pickRandom(RESPONSES.identity);
    }

    // 6. Price / Mcap / Target
    if (q.includes('price') || q.includes('mcap') || q.includes('market cap') || q.includes('target') || q.includes('moon') || q.includes('ath')) {
      return pickRandom(RESPONSES.price);
    }

    // 7. Elon Musk
    if (q.includes('elon') || q.includes('musk') || q.includes('tweet') || q.includes('anthropic')) {
      return pickRandom(RESPONSES.elon);
    }

    // 8. Pump / Trenches
    if (q.includes('pump') || q.includes('dump') || q.includes('trench') || q.includes('alpha') || q.includes('moonshot')) {
      return pickRandom(RESPONSES.pump);
    }

    // 9. Insults / Slang
    if (q.includes('fuck') || q.includes('shit') || q.includes('bitch') || q.includes('stupid') || q.includes('idiot') || q.includes('trash') || q.includes('loser')) {
      return pickRandom(RESPONSES.insult);
    }

    // 10. Game
    if (q.includes('game') || q.includes('runner') || q.includes('play')) {
      return pickRandom(RESPONSES.game);
    }

    // Generic fallback
    return pickRandom(RESPONSES.generic);
  }

  // Chat UI Controller
  class FlowerChatUI {
    constructor() {
      this.messagesContainer = null;
      this.inputEl = null;
      this.sendBtn = null;
      this.isProcessing = false;
    }

    init() {
      this.messagesContainer = document.getElementById('chatMessages');
      this.inputEl = document.getElementById('chatInput');
      this.sendBtn = document.getElementById('chatSendBtn');

      if (this.sendBtn) {
        this.sendBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.sendMessage();
        });
      }

      if (this.inputEl) {
        this.inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
          }
        });
      }
    }

    escapeHtml(str) {
      const p = document.createElement('p');
      p.textContent = str;
      return p.innerHTML.replace(/\n/g, '<br>');
    }

    appendMessage(text, role) {
      if (!this.messagesContainer) return null;
      const row = document.createElement('div');
      row.className = `chat-row ${role}`;
      
      const authorText = role === 'bot' ? 'flowerOS:' : 'You:';
      row.innerHTML = `
        <span class="author">${authorText}</span>
        <p>${this.escapeHtml(text)}</p>
      `;

      this.messagesContainer.appendChild(row);
      this.scrollToBottom();
      return row;
    }

    scrollToBottom() {
      if (this.messagesContainer) {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }
    }

    async sendMessage() {
      if (!this.inputEl || this.isProcessing) return;
      const text = this.inputEl.value.trim();
      if (!text) return;

      this.inputEl.value = '';
      this.isProcessing = true;

      // 1. User message bubble
      this.appendMessage(text, 'user');

      // 2. Typing indicator
      const typingIndicator = document.createElement('div');
      typingIndicator.className = 'chat-row bot';
      typingIndicator.innerHTML = `
        <span class="author">flowerOS:</span>
        <p><em>${pickRandom(TYPING_INDICATORS)}</em></p>
      `;
      this.messagesContainer.appendChild(typingIndicator);
      this.scrollToBottom();

      // 3. Response with slight realistic thinking delay (350-500ms)
      setTimeout(() => {
        if (typingIndicator && typingIndicator.parentNode) {
          typingIndicator.remove();
        }

        const reply = generateFlowerOSReply(text);
        this.appendMessage(reply, 'bot');
        this.isProcessing = false;
        if (this.inputEl) this.inputEl.focus();
      }, 400);
    }
  }

  // Initialize on load
  const flowerChat = new FlowerChatUI();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => flowerChat.init());
  } else {
    flowerChat.init();
  }

  window.FlowerChat = flowerChat;
})();
