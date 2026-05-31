// ==================== STATE MANAGEMENT ====================
let appState = {
  onboardingComplete: false,
  userProfile: {
    name: "",
    age: null,
    lifeStage: "",
    biggestFear: "",
    focusAreas: []
  },
  activeTab: "home",
  conversations: [],
  decisions: [],
  roadmapState: {
    career: { action1: false, action2: false },
    money: { action1: false, action2: false },
    skills: { action1: false, action2: false }
  },
  journeyHighlights: []
};

// Initial system greetings and presets
const MOCK_COMPANION_RESPONSES = {
  greeting: (name) => `Hello, ${name}. It's so peaceful to connect with you. Adulthood can feel like a lot to carry. I'm here to walk beside you, listen, and navigate it with you. What's on your mind today?`,
  overwhelmed: (name, fear) => `I hear you, ${name}. Feeling overwhelmed is a completely natural reaction when you're facing big transitions. You mentioned earlier that your biggest concern is: "${fear}". That is a lot of pressure. Remember, adulthood is not a race. Let's take a deep breath. Would you like to break this concern into tiny, manageable steps, or just write out how you're feeling?`,
  money: (name) => `Money can be a huge source of silent anxiety, ${name}. In our roadmap, we focus on building money confidence, not perfection. A great first step is simply understanding where we stand. Would you like to map out your basic living expenses together, or talk about creating positive financial habits?`,
  career: (name, stage) => `Careers represent an exciting but highly uncertain chapter, especially as a ${stage}. The pressure to have it all figured out immediately is intense. Let's remember: your career is an unfolding journey, not a single final destination. What is one small career curiosity you'd like to explore today?`,
  skills: (name) => `Growing your independence step-by-step is an empowering feeling, ${name}. From understanding utility bills to cooking a warm meal, these are simple skills that build confidence over time. Which everyday independence milestone is on your mind?`,
  growth: (name) => `Personal growth is about progress, never perfection. By checking in today, you're already doing the work to support yourself, ${name}. Shall we do a brief, gentle reflection on what went well this past week?`,
  default: `I am here with you. Adulthood doesn't come with instructions, but we can figure out the next step together. Tell me more.`
};

// --- INITIALIZE APPLICATION ---
window.addEventListener("DOMContentLoaded", () => {
  loadStateFromLocalStorage();
  initializeUI();
});

// Load state
function loadStateFromLocalStorage() {
  const savedState = localStorage.getItem("withme_state");
  if (savedState) {
    try {
      appState = JSON.parse(savedState);
    } catch (e) {
      console.error("Could not parse saved app state, using defaults.", e);
    }
  }
}

// Save state
function saveStateToLocalStorage() {
  localStorage.setItem("withme_state", JSON.stringify(appState));
}

// --- UI CONFIGURATION ---
function initializeUI() {
  if (appState.onboardingComplete) {
    // Skip onboarding, load home
    const onboardingView = document.getElementById("view-onboarding");
    onboardingView.classList.remove("active");
    onboardingView.style.display = "none";

    const navBar = document.getElementById("app-nav-bar");
    navBar.classList.remove("hidden");

    switchTab(appState.activeTab || "home");
    renderHomeView();
    renderProfileView();
    renderDecisionsLog();
    syncRoadmapCheckboxes();
  } else {
    // Start onboarding from slide 1
    showOnboardingSlide(1);
    const navBar = document.getElementById("app-nav-bar");
    navBar.classList.add("hidden");
  }
}

// ==================== ONBOARDING FLOW ====================
let currentOnboardingStep = 1;
const totalOnboardingSteps = 6;

function showOnboardingSlide(step) {
  currentOnboardingStep = step;
  const slides = document.querySelectorAll(".onboarding-slide");
  slides.forEach(slide => {
    slide.classList.remove("active");
    if (parseInt(slide.getAttribute("data-step")) === step) {
      slide.classList.add("active");
    }
  });

  // Update progress bar (Splash slide 1 doesn't count towards the progress bars)
  const progressPercent = step === 1 ? 0 : ((step - 1) / (totalOnboardingSteps)) * 100;
  document.getElementById("onboarding-progress").style.width = `${progressPercent}%`;
}

function nextOnboardingStep() {
  showOnboardingSlide(currentOnboardingStep + 1);
}

function prevOnboardingStep() {
  if (currentOnboardingStep > 1) {
    showOnboardingSlide(currentOnboardingStep - 1);
  }
}

function selectLifeStage(element, stage) {
  // Clear other selected life stages
  const options = document.querySelectorAll(".onboarding-card-option");
  options.forEach(opt => opt.classList.remove("selected"));
  
  element.classList.add("selected");
  appState.userProfile.lifeStage = stage;
}

function toggleFocusArea(element, area) {
  element.classList.toggle("selected");
  const index = appState.userProfile.focusAreas.indexOf(area);
  if (index > -1) {
    appState.userProfile.focusAreas.splice(index, 1);
  } else {
    appState.userProfile.focusAreas.push(area);
  }
}

// Validation before moving next
function validateAndNext(step) {
  if (step === 2) {
    const nameInput = document.getElementById("ob-name").value.trim();
    if (!nameInput) {
      alert("Please enter a name so I know what to call you.");
      return;
    }
    appState.userProfile.name = nameInput;
  }
  
  if (step === 3) {
    const ageInput = parseInt(document.getElementById("ob-age").value);
    if (isNaN(ageInput) || ageInput < 18 || ageInput > 30) {
      alert("Please enter a valid age between 18 and 30.");
      return;
    }
    appState.userProfile.age = ageInput;
  }

  if (step === 4) {
    if (!appState.userProfile.lifeStage) {
      alert("Please select the life stage that describes you best.");
      return;
    }
  }

  if (step === 5) {
    const fearInput = document.getElementById("ob-fear").value.trim();
    if (!fearInput) {
      alert("It helps to share a little bit. What is one small concern you have about adulthood?");
      return;
    }
    appState.userProfile.biggestFear = fearInput;
  }

  if (step === 6) {
    if (appState.userProfile.focusAreas.length === 0) {
      alert("Please select at least one focus area to begin.");
      return;
    }
    
    // Prepare the final introductory note programmatically
    document.getElementById("companion-intro-title").innerText = `Meeting WithMe...`;
    document.getElementById("companion-intro-text").innerText = 
      `"Hi ${appState.userProfile.name}. I'm WithMe, your companion. I've read about what is on your mind regarding "${appState.userProfile.biggestFear}". Adulthood doesn't have to be walked alone. Let's step forward together."`;
  }

  nextOnboardingStep();
}

function completeOnboarding() {
  appState.onboardingComplete = true;
  appState.activeTab = "home";
  
  // Create first system greeting in conversations
  appState.conversations = [
    {
      sender: "companion",
      text: MOCK_COMPANION_RESPONSES.greeting(appState.userProfile.name),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  // Log first journey highlight
  appState.journeyHighlights = [
    {
      type: "action",
      caption: `Created your sanctuary with WithMe. Welcome to your adulthood space.`,
      time: "Just now"
    }
  ];

  saveStateToLocalStorage();
  initializeUI();
}


// ==================== SINGLE PAGE ROUTER ====================
function switchTab(tabId) {
  appState.activeTab = tabId;
  saveStateToLocalStorage();

  // Highlight bottom navigation active item
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => item.classList.remove("active"));
  
  const activeNav = document.getElementById(`nav-${tabId}`);
  if (activeNav) activeNav.classList.add("active");

  // Show active view, hide others
  const views = document.querySelectorAll(".view");
  views.forEach(view => {
    view.classList.remove("active");
    if (view.id === `view-${tabId}`) {
      view.classList.add("active");
    }
  });

  // Custom renders when opening tabs
  if (tabId === "home") {
    renderHomeView();
  } else if (tabId === "walk") {
    renderWalkView();
  } else if (tabId === "profile") {
    renderProfileView();
  } else if (tabId === "decisions") {
    renderDecisionsLog();
  }
}


// ==================== HOME TAB RENDERING ====================
function getGreeting() {
  const hr = new Date().getHours();
  if (hr >= 5 && hr < 12) return "Good morning";
  if (hr >= 12 && hr < 17) return "Good afternoon";
  if (hr >= 17 && hr < 24) return "Good evening";
  return "Welcome back";
}

function getCompanionDynamicNote() {
  const hr = new Date().getHours();
  const name = appState.userProfile.name;
  if (hr >= 22 || hr < 4) {
    return `"It's getting late, ${name}. Remember to close your screens, let go of any worries from today, and give yourself credit for simply showing up. Sleep well."`;
  }
  if (hr >= 5 && hr < 11) {
    return `"A fresh morning, ${name}. Adulthood is not a sprint, it's a slow walk. Don't worry about trying to complete everything. Just take one small step at a time."`;
  }
  return `"Take a gentle deep breath, ${name}. If you feel like everyone else has adulthood completely figured out, I promise they don't. You are right on track."`;
}

function renderHomeView() {
  // Set User Name & Greeting
  document.getElementById("home-greeting-label").innerText = getGreeting();
  document.getElementById("home-user-name").innerText = appState.userProfile.name;

  // Render personalized Note from WithMe
  document.getElementById("companion-handwritten-note").innerText = getCompanionDynamicNote();

  // Render continue journey text
  const primaryArea = appState.userProfile.focusAreas[0] || "Careers";
  document.getElementById("journey-badge-topic").innerText = primaryArea;
  
  let journeyMessage = "";
  if (primaryArea.includes("Career")) {
    journeyMessage = `Last time we checked in, you were considering career next steps as a ${appState.userProfile.lifeStage}. Let's keep exploring your options together.`;
  } else if (primaryArea.includes("Money")) {
    journeyMessage = `Let's work together to make finances feel safe and clear. No math stress, just gentle practical habits.`;
  } else if (primaryArea.includes("Skills")) {
    journeyMessage = `Working on your self-reliance? Let's check out our latest life skill goals in the Roadmap.`;
  } else {
    journeyMessage = `How is your personal well-being today? Let's take 2 minutes to slow down and reflect on your growth.`;
  }
  document.getElementById("journey-text-content").innerText = journeyMessage;

  // Dynamic Reflection Prompt
  const prompts = [
    `"What is one tiny challenge you navigated recently that you should give yourself credit for?"`,
    `"What expectation are you placing on yourself today, and can we gently let it go?"`,
    `"What is a life skill that felt intimidating last year but feels completely normal now?"`,
    `"If you could give your past-self some supportive advice, what would you say?"`
  ];
  // Select a prompt based on the day of the month so it changes calmly
  const promptIndex = new Date().getDate() % prompts.length;
  document.getElementById("home-reflection-prompt").innerText = prompts[promptIndex];
}

function submitHomeReflection() {
  const replyInput = document.getElementById("home-reflection-reply");
  const text = replyInput.value.trim();
  if (!text) return;

  // Add reflection to Journey Highlights
  appState.journeyHighlights.unshift({
    type: "reflection",
    caption: `Recorded a personal reflection: "${text}"`,
    time: "Just now"
  });

  // Clear input and alert
  replyInput.value = "";
  alert("Your reflection has been added to your Profile Scrapbook under Journey Highlights. Be proud of taking this moment.");
  saveStateToLocalStorage();
  renderProfileView();
}


// ==================== WALK TAB (CONVERSATIONAL COMPANION) ====================
function renderWalkView() {
  const messagesContainer = document.getElementById("chat-messages");
  messagesContainer.innerHTML = "";

  // Render existing messages
  appState.conversations.forEach(msg => {
    const bubbleRow = document.createElement("div");
    bubbleRow.className = `chat-bubble-row ${msg.sender}`;

    const bubble = document.createElement("div");
    bubble.className = `message-bubble ${msg.sender}`;
    bubble.innerText = msg.text;

    bubbleRow.appendChild(bubble);
    messagesContainer.appendChild(bubbleRow);
  });

  scrollChatToBottom();
  renderQuickChips("main");
}

function scrollChatToBottom() {
  const container = document.getElementById("chat-messages");
  container.scrollTop = container.scrollHeight;
}

// Quick reply context routing
function renderQuickChips(context) {
  const chipWrapper = document.getElementById("chat-quick-chips");
  chipWrapper.innerHTML = "";

  let chips = [];
  if (context === "main") {
    chips = [
      { text: "I feel a bit overwhelmed", action: () => triggerCompanionResponse("overwhelmed") },
      { text: "Can we talk about careers?", action: () => triggerCompanionResponse("career") },
      { text: "Let's look at budgeting/money", action: () => triggerCompanionResponse("money") },
      { text: "I want to work on life skills", action: () => triggerCompanionResponse("skills") },
      { text: "Let's reflect on my goals", action: () => triggerCompanionResponse("growth") }
    ];
  } else if (context === "options") {
    chips = [
      { text: "Let's look at my Roadmap", action: () => switchTab("roadmap") },
      { text: "Help me clear a decision", action: () => switchTab("decisions") },
      { text: "See my Journey Highlights", action: () => switchTab("profile") },
      { text: "Let's talk about something else", action: () => renderQuickChips("main") }
    ];
  }

  chips.forEach(chip => {
    const chipBtn = document.createElement("div");
    chipBtn.className = "chat-quick-chip";
    chipBtn.innerText = chip.text;
    chipBtn.onclick = () => {
      // Post user text bubble instantly
      postUserMessage(chip.text);
      // Run custom action
      chip.action();
    };
    chipWrapper.appendChild(chipBtn);
  });
}

function postUserMessage(text) {
  const messagesContainer = document.getElementById("chat-messages");
  
  // Add to state
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  appState.conversations.push({
    sender: "user",
    text: text,
    time: timeStr
  });
  saveStateToLocalStorage();

  // Render visually
  const bubbleRow = document.createElement("div");
  bubbleRow.className = "chat-bubble-row user";
  const bubble = document.createElement("div");
  bubble.className = "message-bubble user";
  bubble.innerText = text;
  
  bubbleRow.appendChild(bubble);
  messagesContainer.appendChild(bubbleRow);
  scrollChatToBottom();
}

function handleUserChatSend() {
  const input = document.getElementById("chat-input-field");
  const text = input.value.trim();
  if (!text) return;

  postUserMessage(text);
  input.value = "";

  // Dynamic response matching simple keywords
  const lowerText = text.toLowerCase();
  let topic = "default";
  
  if (lowerText.includes("anxious") || lowerText.includes("overwhelm") || lowerText.includes("scared") || lowerText.includes("stress")) {
    topic = "overwhelmed";
  } else if (lowerText.includes("career") || lowerText.includes("job") || lowerText.includes("intern") || lowerText.includes("work")) {
    topic = "career";
  } else if (lowerText.includes("money") || lowerText.includes("budget") || lowerText.includes("save") || lowerText.includes("finance")) {
    topic = "money";
  } else if (lowerText.includes("skill") || lowerText.includes("cooking") || lowerText.includes("lease") || lowerText.includes("adulting")) {
    topic = "skills";
  } else if (lowerText.includes("grow") || lowerText.includes("reflect") || lowerText.includes("celebrate")) {
    topic = "growth";
  }

  triggerCompanionResponse(topic);
}

function triggerCompanionResponse(topic) {
  const messagesContainer = document.getElementById("chat-messages");
  
  // Render typing indicator
  const typingRow = document.createElement("div");
  typingRow.className = "chat-bubble-row companion";
  typingRow.id = "chat-typing-indicator";
  
  const typingBubble = document.createElement("div");
  typingBubble.className = "typing-bubble";
  typingBubble.innerHTML = `<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>`;
  
  typingRow.appendChild(typingBubble);
  messagesContainer.appendChild(typingRow);
  scrollChatToBottom();

  // Smooth delay to simulate reading and writing with care
  setTimeout(() => {
    // Remove typing indicator
    const indicator = document.getElementById("chat-typing-indicator");
    if (indicator) indicator.remove();

    // Get response
    let responseText = "";
    if (topic === "overwhelmed") {
      responseText = MOCK_COMPANION_RESPONSES.overwhelmed(appState.userProfile.name, appState.userProfile.biggestFear);
    } else if (topic === "money") {
      responseText = MOCK_COMPANION_RESPONSES.money(appState.userProfile.name);
    } else if (topic === "career") {
      responseText = MOCK_COMPANION_RESPONSES.career(appState.userProfile.name, appState.userProfile.lifeStage);
    } else if (topic === "skills") {
      responseText = MOCK_COMPANION_RESPONSES.skills(appState.userProfile.name);
    } else if (topic === "growth") {
      responseText = MOCK_COMPANION_RESPONSES.growth(appState.userProfile.name);
    } else {
      responseText = MOCK_COMPANION_RESPONSES.default;
    }

    // Add companion response to state
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appState.conversations.push({
      sender: "companion",
      text: responseText,
      time: timeStr
    });
    saveStateToLocalStorage();

    // Render companion bubble
    const bubbleRow = document.createElement("div");
    bubbleRow.className = "chat-bubble-row companion";
    const bubble = document.createElement("div");
    bubble.className = "message-bubble companion";
    bubble.innerText = responseText;
    
    bubbleRow.appendChild(bubble);
    messagesContainer.appendChild(bubbleRow);
    scrollChatToBottom();

    // Transition quick chips context
    renderQuickChips("options");
  }, 1600);
}

// Trigger conversation from Homepage Focus Areas
function triggerFocusChat(topic) {
  switchTab("walk");
  postUserMessage(`I'd like to focus on: ${topic}`);
  
  let code = "default";
  if (topic.includes("Career")) code = "career";
  else if (topic.includes("Conf")) code = "money";
  else if (topic.includes("Skills")) code = "skills";
  else if (topic.includes("Growth")) code = "growth";

  triggerCompanionResponse(code);
}


// ==================== GUIDED DECISIONS VIEW ====================
let activeDecisionStep = 1;

function showDecisionWizardStep(step) {
  activeDecisionStep = step;
  const wizardSteps = document.querySelectorAll(".dec-wizard-step");
  wizardSteps.forEach(ws => {
    ws.style.display = "none";
    ws.classList.remove("active");
  });

  const activeWs = document.getElementById(`dec-step-${step}`);
  if (activeWs) {
    activeWs.style.display = "block";
    activeWs.classList.add("active");
  }
}

function advanceDecisionWizard(step) {
  // Simple validation for inputs
  if (step === 2) {
    const situation = document.getElementById("dec-input-situation").value.trim();
    if (!situation) {
      alert("Please describe the decision you are considering.");
      return;
    }
  }

  if (step === 6) {
    // Dynamically synthesize companion clarifying question in step 6!
    const situation = document.getElementById("dec-input-situation").value.trim();
    const goals = document.getElementById("dec-input-goals").value.trim();
    const name = appState.userProfile.name;

    document.getElementById("decision-companion-q").innerText = 
      `"${name}, since your main target is "${goals}", how does selecting "${situation}" support your need for long-term emotional confidence over external comparison?"`;
  }

  showDecisionWizardStep(step);
}

function regressDecisionWizard(step) {
  showDecisionWizardStep(step);
}

function completeDecisionWorkbook() {
  const situation = document.getElementById("dec-input-situation").value.trim();
  const goals = document.getElementById("dec-input-goals").value.trim();
  const benefits = document.getElementById("dec-input-benefits").value.trim();
  const risks = document.getElementById("dec-input-risks").value.trim();
  const tradeoffs = document.getElementById("dec-input-tradeoffs").value.trim();
  const nextstep = document.getElementById("dec-input-nextstep").value.trim();

  if (!nextstep) {
    alert("Please formulate one small practical next step to help you gain clarity.");
    return;
  }

  // Create completed decision journal entry
  const newDecision = {
    id: Date.now(),
    date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    situation: situation,
    goals: goals,
    benefits: benefits,
    risks: risks,
    tradeoffs: tradeoffs,
    nextstep: nextstep
  };

  appState.decisions.unshift(newDecision);

  // Log in Journey Highlights
  appState.journeyHighlights.unshift({
    type: "decision",
    caption: `Clarified decision: "${situation}" • Next step defined: "${nextstep}"`,
    time: "Just now"
  });

  saveStateToLocalStorage();

  // Reset inputs
  document.getElementById("dec-input-situation").value = "";
  document.getElementById("dec-input-goals").value = "";
  document.getElementById("dec-input-benefits").value = "";
  document.getElementById("dec-input-risks").value = "";
  document.getElementById("dec-input-tradeoffs").value = "";
  document.getElementById("dec-input-nextstep").value = "";

  // Jump to step 1
  showDecisionWizardStep(1);

  // Render list
  renderDecisionsLog();
  renderProfileView();

  alert("Success. Your structured choice guide has been logged in your Decisions Journal. Take your time, there is no rush.");
}

function renderDecisionsLog() {
  const container = document.getElementById("decisions-log-container");
  
  // Clear all list items except empty label
  const items = container.querySelectorAll(".decision-journal-item");
  items.forEach(it => it.remove());

  const emptyLabel = document.getElementById("decisions-empty-label");

  if (appState.decisions.length === 0) {
    emptyLabel.style.display = "block";
    return;
  }

  emptyLabel.style.display = "none";

  appState.decisions.forEach(dec => {
    const decItem = document.createElement("div");
    decItem.className = "decision-journal-item";
    decItem.onclick = () => openDecisionModal(dec);

    decItem.innerHTML = `
      <div>
        <h4 class="decision-item-title">${dec.situation}</h4>
        <span class="decision-item-date">${dec.date}</span>
      </div>
      <span class="journal-badge-teal">Next step pending</span>
    `;

    container.appendChild(decItem);
  });
}

// Modal actions
function openDecisionModal(dec) {
  document.getElementById("modal-dec-title").innerText = dec.situation;
  document.getElementById("modal-dec-situation").innerText = dec.situation;
  document.getElementById("modal-dec-goals").innerText = dec.goals;
  document.getElementById("modal-dec-benefits").innerText = dec.benefits;
  document.getElementById("modal-dec-risks").innerText = dec.risks;
  document.getElementById("modal-dec-tradeoffs").innerText = dec.tradeoffs;
  document.getElementById("modal-dec-nextstep").innerText = dec.nextstep;
  document.getElementById("modal-dec-date").innerText = `Mapped on ${dec.date}`;

  document.getElementById("modal-decision-viewer").classList.add("active");
}

function closeDecisionModal(event) {
  if (event === null || event.target === document.getElementById("modal-decision-viewer")) {
    document.getElementById("modal-decision-viewer").classList.remove("active");
  }
}


// ==================== MINDFUL ROADMAP VIEW ====================
function toggleRoadmapTask(element, section, actionId) {
  element.classList.toggle("checked");
  const isChecked = element.classList.contains("checked");

  appState.roadmapState[section][actionId] = isChecked;

  // Log in Journey Highlights if checked (celebrating milestone)
  if (isChecked) {
    let taskName = "";
    if (section === "career" && actionId === "action1") taskName = "Update resume draft skills";
    else if (section === "career" && actionId === "action2") taskName = "Bookmark three job options";
    else if (section === "money" && actionId === "action1") taskName = "Learn about High-Yield Savings Accounts";
    else if (section === "money" && actionId === "action2") taskName = "Calculate monthly expenses";
    else if (section === "skills" && actionId === "action1") taskName = "Read one apartment lease clause";
    else if (section === "skills" && actionId === "action2") taskName = "Practice one home-cooked meal";

    appState.journeyHighlights.unshift({
      type: "action",
      caption: `Completed milestone: "${taskName}"`,
      time: "Just now"
    });

    // Gentle particles confetti celebration!
    triggerCalmParticles(element);
  }

  // Update visual nodes color if section fully checked
  const sectionNode = document.getElementById(`roadmap-${section}-node`);
  const secState = appState.roadmapState[section];
  if (secState.action1 && secState.action2) {
    sectionNode.classList.add("completed");
  } else {
    sectionNode.classList.remove("completed");
  }

  saveStateToLocalStorage();
  renderProfileView();
}

function syncRoadmapCheckboxes() {
  const sections = ["career", "money", "skills"];
  sections.forEach(sec => {
    const secState = appState.roadmapState[sec];
    const sectionNode = document.getElementById(`roadmap-${sec}-node`);

    // Sync fully completed status
    if (secState.action1 && secState.action2) {
      sectionNode.classList.add("completed");
    } else {
      sectionNode.classList.remove("completed");
    }

    // Sync individual rows
    const rows = sectionNode.querySelectorAll(".action-checkbox-row");
    // Row 1
    if (secState.action1) {
      rows[0].classList.add("checked");
    } else {
      rows[0].classList.remove("checked");
    }
    // Row 2
    if (secState.action2) {
      rows[1].classList.add("checked");
    } else {
      rows[1].classList.remove("checked");
    }
  });
}

// Gentle, slow-drifting teal and lavender particles confetti (non-overwhelming)
function triggerCalmParticles(parentEl) {
  const rect = parentEl.getBoundingClientRect();
  const viewport = document.querySelector(".app-viewport");
  
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div");
    particle.style.position = "absolute";
    particle.style.width = `${Math.random() * 6 + 4}px`;
    particle.style.height = particle.style.width;
    particle.style.borderRadius = "50%";
    particle.style.background = i % 2 === 0 ? "var(--color-teal-light)" : "var(--color-lavender-light)";
    particle.style.pointerEvents = "none";
    particle.style.opacity = "0.85";
    
    // Position near the checklist row
    const viewportRect = viewport.getBoundingClientRect();
    const x = rect.left - viewportRect.left + (rect.width / 4) + (Math.random() * 30 - 15);
    const y = rect.top - viewportRect.top + (rect.height / 2);
    
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    viewport.appendChild(particle);

    // Drifting float animation
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 40 + 20;
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y - (Math.random() * 60 + 30); // Float upward

    particle.animate([
      { transform: "translate(0, 0) scale(1)", opacity: 0.85 },
      { transform: `translate(${targetX - x}px, ${targetY - y}px) scale(0)`, opacity: 0 }
    ], {
      duration: Math.random() * 1500 + 1000,
      easing: "cubic-bezier(0.1, 0.8, 0.3, 1)",
      fill: "forwards"
    });

    // Cleanup particle
    setTimeout(() => particle.remove(), 2500);
  }
}


// ==================== EVOLVING PROFILE VIEW ====================
function renderProfileView() {
  const profile = appState.userProfile;
  if (!profile.name) return;

  // Initials
  document.getElementById("profile-initials").innerText = profile.name.charAt(0).toUpperCase();
  document.getElementById("profile-display-name").innerText = profile.name;
  document.getElementById("profile-display-subtitle").innerText = `${profile.age} • ${profile.lifeStage}`;
  
  // Custom aspirations mapping
  document.getElementById("profile-aspirations").innerText = profile.focusAreas.slice(0, 2).join(" & ");
  document.getElementById("profile-focus").innerText = profile.focusAreas[0] || "Growth Focus";
  document.getElementById("profile-display-fear").innerText = `"${profile.biggestFear}"`;

  // Render Highlights timeline
  const timeline = document.getElementById("profile-highlights-container");
  timeline.innerHTML = "";

  if (appState.journeyHighlights.length === 0) {
    timeline.innerHTML = `
      <div class="highlight-item" id="highlight-default-placeholder">
        <div class="highlight-icon-box action">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
        <div class="highlight-text-content">
          <p class="highlight-caption">Stepped into the WithMe sanctuary and took the first step on your journey.</p>
          <p class="highlight-time">Just now</p>
        </div>
      </div>
    `;
    return;
  }

  appState.journeyHighlights.forEach(hl => {
    const item = document.createElement("div");
    item.className = "highlight-item";

    let iconSvg = "";
    if (hl.type === "decision") {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
    } else if (hl.type === "reflection") {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    } else {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    }

    item.innerHTML = `
      <div class="highlight-icon-box ${hl.type}">
        ${iconSvg}
      </div>
      <div class="highlight-text-content">
        <p class="highlight-caption">${hl.caption}</p>
        <p class="highlight-time">${hl.time}</p>
      </div>
    `;

    timeline.appendChild(item);
  });
}

// Clear state to start onboarding again
function confirmResetAppData() {
  const check = confirm("Starting a new chapter will clear your current journal, completed milestones, and chat reflections. Are you ready to begin a fresh transition?");
  if (check) {
    localStorage.removeItem("withme_state");
    location.reload();
  }
}
